import { Response } from 'express';
import { User } from '../models/User';
import { CreateContractRequest, CreateContractResponse, UpdateContractRequest, AuthenticatedRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Create new contract
export const createContract = async (req: any, res: Response): Promise<void> => {   
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { title, fingerprint, recipients, contract_address } = req.body as CreateContractRequest;

    // Validate required fields
    if (!title || !fingerprint || !recipients || !Array.isArray(recipients)) {
      res.status(400).json({
        success: false,
        message: 'Title, fingerprint, and recipients array are required'
      });
      return;
    }

    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.address || !recipient.mail || !recipient.fingerprint) {
        res.status(400).json({
          success: false,
          message: 'Each recipient must have address, mail, and fingerprint'
        });
        return;
      }
    }


    // Create new contract
    const newContract = {
      contract_address,
      title,
      fingerprint,
      recipients: recipients.map(recipient => ({
        ...recipient,
        is_signed: false,
        is_verified: false
      })),
      status: 'draft' as const,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add contract to user
    const updatedUser = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $push: { contracts: newContract } },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get the newly created contract
    const createdContract = updatedUser.contracts.find(
      contract => contract.contract_address === contract_address
    );

    const response: CreateContractResponse = {
      success: true,
      message: 'Contract created successfully',
      contract: createdContract
    };
    
    for (const recipient of recipients) {
      try {
        await fetch('https://email-client.abdulsahil.me/notify-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            link: `http://localhost:5173/contract-detail/${contract_address}`,
            email: recipient.mail
          })
        });
      } catch (err) {
        console.error(`Failed to notify recipient ${recipient.mail}:`, err);
        // Optionally, you could continue or handle errors differently
      }
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating contract'
    });
  }
};

// Get user's contracts
export const getMyAllContracts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findOne({ uid: req.user.uid }).select('contracts -_id');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Contracts retrieved successfully',
      contracts: JSON.parse(JSON.stringify(user.contracts)) // Convert Mongoose documents to plain objects
    });
  } catch (error) {
    console.error('Error getting user contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving contracts'
    });
  }
};

// Get specific contract
export const getContract = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { contractAddress } = req.params;

    // Search all users' contracts for the contract with the given address
    const userWithContract = await User.findOne({
      'contracts.contract_address': contractAddress
    }).select('contracts -_id');

    if (!userWithContract) {
      res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
      return;
    }

    const contract = userWithContract.contracts.find(
      (c: any) => c.contract_address === contractAddress
    );

    res.status(200).json({
      success: true,
      message: 'Contract retrieved successfully',
      contract: contract ? JSON.parse(JSON.stringify(contract)) : null // Convert Mongoose document to plain object
    });
  } catch (error) {
    console.error('Error getting contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving contract'
    });
  }
};

// Update contract
export const updateContract = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { contractAddress } = req.params;
    const { title, status, recipients } = req.body as UpdateContractRequest;

    const updateData: any = {};
    if (title) updateData['contracts.$.title'] = title;
    if (status) updateData['contracts.$.status'] = status;
    if (recipients) updateData['contracts.$.recipients'] = recipients;
    
    // Always update the updated_at timestamp
    updateData['contracts.$.updated_at'] = new Date();

    if (Object.keys(updateData).length === 1) { // Only updated_at
      res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
      return;
    }

    const updatedUser = await User.findOneAndUpdate(
      { 
        uid: req.user.uid,
        'contracts.contract_address': contractAddress
      },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
      return;
    }

    const updatedContract = updatedUser.contracts.find(
      contract => contract.contract_address === contractAddress
    );

    res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      contract: updatedContract
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating contract'
    });
  }
};

// Get contracts where user is a recipient
export const getReceivedContracts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Find all contracts where the user's EVM address is in the recipients array
    const users = await User.find({
      'contracts.recipients.address': req.user.evm_address
    }).select('contracts -_id');

    if (!users || users.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No received contracts found',
        contracts: []
      });
      return;
    }

    // Extract all contracts where the user is a recipient
    const receivedContracts = [];
    for (const user of users) {
      for (const contract of user.contracts) {
        const isRecipient = contract.recipients.some(
          recipient => recipient.address === req.user!.evm_address
        );
        if (isRecipient) {
          receivedContracts.push({
            ...JSON.parse(JSON.stringify(contract)), // Convert Mongoose document to plain object
            creator_uid: user.uid, // Add creator info
            creator_evm_address: user.evm_address
          });
        }
      }
    }

    // Sort by created_at descending (newest first)
    receivedContracts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.status(200).json({
      success: true,
      message: 'Received contracts retrieved successfully',
      contracts: receivedContracts
    });
  } catch (error) {
    console.error('Error getting received contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving received contracts'
    });
  }
};

// Update recipient signature/verification status
export const updateRecipientStatus = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { contractAddress, recipientAddress } = req.params;
    const { is_signed, is_verified } = req.body as { is_signed?: boolean; is_verified?: boolean };

    const updateFields: any = {};
    if (typeof is_signed === 'boolean') {
      updateFields['contracts.$[contract].recipients.$[recipient].is_signed'] = is_signed;
      if (is_signed) {
        updateFields['contracts.$[contract].recipients.$[recipient].signed_at'] = new Date();
      }
    }
    if (typeof is_verified === 'boolean') {
      updateFields['contracts.$[contract].recipients.$[recipient].is_verified'] = is_verified;
      if (is_verified) {
        updateFields['contracts.$[contract].recipients.$[recipient].verified_at'] = new Date();
      }
    }

    if (Object.keys(updateFields).length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid status fields to update'
      });
      return;
    }

    const updatedUser = await User.findOneAndUpdate(
      { 
        uid: req.user.uid,
        'contracts.contract_address': contractAddress
      },
      { $set: updateFields },
      { 
        new: true,
        arrayFilters: [
          { 'contract.contract_address': contractAddress },
          { 'recipient.address': recipientAddress }
        ]
      }
    ).select('-__v');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'Contract or recipient not found'
      });
      return;
    }

    const updatedContract = updatedUser.contracts.find(
      contract => contract.contract_address === contractAddress
    );

    res.status(200).json({
      success: true,
      message: 'Recipient status updated successfully',
      contract: updatedContract
    });
  } catch (error) {
    console.error('Error updating recipient status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating recipient status'
    });
  }
};
