import { Request, Response } from 'express';
import ipfsService from '../services/ipfsService';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("uploading file, ")
    // console.log("Req", req)
    if (!req.file) {
      res.status(400).json({
        error: 'No file uploaded',
        message: 'Please provide a file to upload'
      });
      return;
    }

    const { buffer, originalname } = req.file;
    
    // Upload file to IPFS
    const cid = await ipfsService.uploadFile(buffer, originalname);
    
    // Get the gateway URL for the file
    const gatewayUrl = ipfsService.getGatewayUrl(cid.cid)

    res.status(200).json({
      success: true,
      cid: cid,
      gatewayUrl: gatewayUrl,
      fileName: originalname,
      size: buffer.length,
      message: 'File uploaded successfully to IPFS'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};
