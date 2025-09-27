import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseEther, Address, isAddress, decodeEventLog, formatUnits, createPublicClient, http, encodeFunctionData } from 'viem';
import { baseSepolia } from 'viem/chains';
import { useAuthStore } from '../store/useAuthStore';
import DynamicLockUpABI from '../../LockupDynamicABI.json'
import Sidebar from '../components/Sidebar';
import ERC20ABI from '../../ERC20ABI.json';
import { VESTING_CONFIG } from '../config/vesting';
import { CheckCircle, Clock, AlertCircle, Wallet, ArrowRight, ExternalLink, ChevronDown, Coins, RefreshCw } from 'lucide-react';
import { usePrivyWallet } from '../hooks/usePrivyWallet';

// Base Sepolia Sablier contract address
const SABLIER_CONTRACT_ADDRESS = VESTING_CONFIG.SABLIER_CONTRACT_ADDRESS as Address;


interface TokenHolding {
  chainId: string;
  tokenAddress: string;
  holderBalance: string;
  token: {
    name: string;
    symbol: string;
    decimals: number;
    detail?: {
      alias?: string;
      icon?: string;
      iconUrls?: {
        "32"?: string;
        "64"?: string;
        "256"?: string;
        "1024"?: string;
      };
    };
  };
}

interface SablierVesting {
  id: string;
  sender: string;
  recipient: string;
  asset: string | { id: string; symbol?: string; name?: string };
  token?: { id: string; symbol?: string; name?: string };
  depositAmount: string;
  startTime: string;
  endTime: string;
  cliff: string;
  canceled: boolean;
  withdrawnAmount: string;
  intactAmount: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimals?: number;
}

interface VestingFormData {
  tokenAddress: string;
  recipientAddress: string;
  totalAmount: string;
  durationDays: number;
  isTransferable: boolean;
  isCancelable: boolean;
}

const VestingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { walletAddress: address, isConnected, sendTransaction } = usePrivyWallet();
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  
  const [formData, setFormData] = useState<VestingFormData>({
    tokenAddress: '',
    recipientAddress: '',
    totalAmount: '',
    durationDays: 7,
    isTransferable: true,
    isCancelable: true,
  });

  const [currentStep, setCurrentStep] = useState<'form' | 'approve' | 'create' | 'success'>('form');
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenHolding | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [, setCreatedStreamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'my-vestings' | 'under-me'>('create');
  const [myVestings, setMyVestings] = useState<SablierVesting[]>([]);
  const [createdVestings, setCreatedVestings] = useState<SablierVesting[]>([]);
  const [isLoadingMyVestings, setIsLoadingMyVestings] = useState(false);
  const [isLoadingCreatedVestings, setIsLoadingCreatedVestings] = useState(false);

  // Helper function to get token address from either string or object format
  const getTokenAddress = (vesting: SablierVesting): string | null => {
    if (typeof vesting.asset === 'string') {
      return vesting.asset;
    } else if (vesting.asset && typeof vesting.asset === 'object' && 'id' in vesting.asset) {
      return vesting.asset.id;
    } else if (vesting.token && 'id' in vesting.token) {
      return vesting.token.id;
    }
    return null;
  };

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/onboarding');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Contract write hooks for token approval
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [isApprovalPending, setIsApprovalPending] = useState(false);
  const [approvalError, setApprovalError] = useState<Error | null>(null);

  const writeApproval = async (params: { address: Address; abi: any; functionName: string; args: any[] }) => {
    try {
      setIsApprovalPending(true);
      setApprovalError(null);

      const { address, abi, functionName, args } = params;
      const data = encodeFunctionData({ abi, functionName, args });

      const txHash = await sendTransaction({
        to: address,
        data,
      });

      setApprovalHash(txHash.hash);
    } catch (error) {
      setApprovalError(error as Error);
    } finally {
      setIsApprovalPending(false);
    }
  };

  // Contract write hooks for stream creation
  const [streamCreationHash, setStreamCreationHash] = useState<string | null>(null);
  const [isStreamCreationPending, setIsStreamCreationPending] = useState(false);
  const [streamCreationError, setStreamCreationError] = useState<Error | null>(null);

  const writeStreamCreation = async (params: { address: Address; abi: any; functionName: string; args: any[] }) => {
    try {
      setIsStreamCreationPending(true);
      setStreamCreationError(null);

      const { address, abi, functionName, args } = params;
      const data = encodeFunctionData({ abi, functionName, args });

      const txHash = await sendTransaction({
        to: address,
        data,
      });
      if(!txHash) throw new Error("No transaction hash returned");

      setStreamCreationHash(txHash.hash);
    } catch (error) {
      setStreamCreationError(error as Error);
    } finally {
      setIsStreamCreationPending(false);
    }
  };

  // Wait for approval transaction
  const [isApprovalConfirming, setIsApprovalConfirming] = useState(false);
  const [isApprovalConfirmed, setIsApprovalConfirmed] = useState(false);

  useEffect(() => {
    if (approvalHash) {
      const waitForApproval = async () => {
        setIsApprovalConfirming(true);
        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash as `0x${string}` });
          if (receipt.status === 'success') {
            setIsApprovalConfirmed(true);
          }
        } catch (error) {
          console.error('Error waiting for approval transaction:', error);
        } finally {
          setIsApprovalConfirming(false);
        }
      };
      waitForApproval();
    }
  }, [approvalHash]);

  const [isStreamCreationConfirming, setIsStreamCreationConfirming] = useState(false);
  const [isStreamCreationConfirmed, setIsStreamCreationConfirmed] = useState(false);
  const [streamCreationReceipt, setStreamCreationReceipt] = useState<null | Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>>>(null);

  useEffect(() => {
    if (streamCreationHash) {
      const waitForStreamCreation = async () => {
        setIsStreamCreationConfirming(true);
        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash: streamCreationHash as `0x${string}` });
          if (receipt.status === 'success') {
            setIsStreamCreationConfirmed(true);
            setStreamCreationReceipt(receipt);
          }
        } catch (error) {
          console.error('Error waiting for stream creation transaction:', error);
        } finally {
          setIsStreamCreationConfirming(false);
        }
      };
      waitForStreamCreation();
    }
  }, [streamCreationHash]);


  // Read token allowance

  // Handle form input changes
  const handleInputChange = useCallback((field: keyof VestingFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  // Fetch user's token holdings
  const fetchTokenHoldings = useCallback(async () => {
    if (!address) return;
    
    setIsLoadingTokens(true);
    try {
      const response = await fetch(`https://cdn.testnet.routescan.io/api/evm/all/address/${address}/erc20-holdings`);
      const data = await response.json();
      
      // Filter for Base Sepolia (chainId: 84532) and sort by balance
      const baseSepoliaTokens = data.items
        .filter((token: TokenHolding) => token.chainId === '84532')
        .sort((a: TokenHolding, b: TokenHolding) => {
          const balanceA = parseFloat(formatUnits(BigInt(a.holderBalance), a.token.decimals));
          const balanceB = parseFloat(formatUnits(BigInt(b.holderBalance), b.token.decimals));
          return balanceB - balanceA;
        });
      
      setTokenHoldings(baseSepoliaTokens);
    } catch (error) {
      console.error('Failed to fetch token holdings:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  }, [address]);

  // Fetch vestings where user is beneficiary
  const fetchMyVestings = useCallback(async () => {
    if (!address) return;
    
    setIsLoadingMyVestings(true);
    try {
      console.log('Fetching vestings for recipient:', address.toLowerCase());

      // GraphQL query for streams where user is recipient (search across all contracts)
      const query = `
        query GetUserVestings($recipient: String!) {
          streams(where: { recipient: $recipient, canceled: false }) {
            id
            sender
            recipient
            asset {
              id
              symbol
              name
            }
            contract
            depositAmount
            startTime
            endTime
            cliff
            canceled
            withdrawnAmount
            intactAmount
          }
        }
      `;

      // Try multiple subgraph endpoints to find user's vestings
      const endpoints = [
        "https://api.studio.thegraph.com/query/112500/sablier-lockup-base-sepolia/version/latest"
      ];

      let allVestings: any[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              variables: { recipient: address.toLowerCase() }
            })
          });

          const data = await response.json();
          if (data.data?.streams) {
            allVestings = [...allVestings, ...data.data.streams];
          }
        } catch (error) {
          console.warn(`Failed to fetch from endpoint ${endpoint}:`, error);
        }
      }

      console.log('My vestings response:', allVestings);
      
      if (allVestings.length > 0) {
        console.log('Found', allVestings.length, 'vestings as recipient');
        setMyVestings(allVestings);
      } else {
        console.log('No vestings found across all subgraphs');
      }
    } catch (error) {
      console.error('Failed to fetch my vestings:', error);
    } finally {
      setIsLoadingMyVestings(false);
    }
  }, [address]);

  // Fetch vestings created by user
  const fetchCreatedVestings = useCallback(async () => {
    if (!address) return;
    
    setIsLoadingCreatedVestings(true);
    try {
      console.log('Fetching vestings created by sender:', address.toLowerCase());

      // GraphQL query for streams where user is sender (search across all contracts)
      const query = `
        query GetCreatedVestings($sender: String!) {
          streams(where: { sender: $sender }) {
            id
            sender
            recipient
            asset {
              id
              symbol
              name
            }
            contract
            depositAmount
            startTime
            endTime
            cliff
            canceled
            withdrawnAmount
            intactAmount
          }
        }
      `;

      // Try multiple subgraph endpoints to find user's created vestings
      const endpoints = [
        "https://api.studio.thegraph.com/query/112500/sablier-lockup-base-sepolia/version/latest",
        "https://api.studio.thegraph.com/query/57079/sablier-v2-base-sepolia/version/latest"
      ];

      let allCreatedVestings: any[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              variables: { sender: address.toLowerCase() }
            })
          });

          const data = await response.json();
          if (data.data?.streams) {
            allCreatedVestings = [...allCreatedVestings, ...data.data.streams];
          }
        } catch (error) {
          console.warn(`Failed to fetch from endpoint ${endpoint}:`, error);
        }
      }

      console.log('Created vestings response:', allCreatedVestings);
      
      if (allCreatedVestings.length > 0) {
        console.log('Found', allCreatedVestings.length, 'vestings as sender');
        setCreatedVestings(allCreatedVestings);
      } else {
        console.log('No created vestings found across all subgraphs');
      }
    } catch (error) {
      console.error('Failed to fetch created vestings:', error);
    } finally {
      setIsLoadingCreatedVestings(false);
    }
  }, [address]);

  // Fetch token holdings when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      fetchTokenHoldings();
    }
  }, [address, isConnected, fetchTokenHoldings]);

  // Fetch vesting data when switching tabs
  useEffect(() => {
    if (address && isConnected) {
      if (activeTab === 'my-vestings') {
        fetchMyVestings();
      } else if (activeTab === 'under-me') {
        fetchCreatedVestings();
      }
    }
  }, [address, isConnected, activeTab, fetchMyVestings, fetchCreatedVestings]);

  // Handle token selection
  const handleTokenSelect = (token: TokenHolding) => {
    setSelectedToken(token);
    setFormData(prev => ({ ...prev, tokenAddress: token.tokenAddress }));
    setShowTokenDropdown(false);
    setShowManualInput(false); // Hide manual input when token is selected
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.token-dropdown-container')) {
        setShowTokenDropdown(false);
      }
    };

    if (showTokenDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTokenDropdown]);

  // Validate form data
  const validateForm = useCallback((): string | null => {
    if (!formData.tokenAddress) return 'Token address is required';
    if (!isAddress(formData.tokenAddress)) return 'Invalid token address format';
    if (!formData.recipientAddress) return 'Recipient address is required';
    if (!isAddress(formData.recipientAddress)) return 'Invalid recipient address format';
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) return 'Valid amount is required';
    if (formData.durationDays <= 0) return 'Duration must be greater than 0';
    
    // Check if user has sufficient token balance
    if (selectedToken) {
      const userBalance = parseFloat(formatUnits(BigInt(selectedToken.holderBalance), selectedToken.token.decimals));
      const requestedAmount = parseFloat(formData.totalAmount);
      if (requestedAmount > userBalance) {
        return `Insufficient balance. You have ${userBalance.toFixed(4)} ${selectedToken.token.symbol}`;
      }
    }
    
    try {
      parseEther(formData.totalAmount);
    } catch {
      return 'Invalid amount format';
    }

    return null;
  }, [formData, selectedToken]);

  // Handle token approval
  const handleApproval = useCallback(async () => {
    if (!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // First verify the contract is accessible
      console.log('Verifying contract accessibility...');
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http()
      });
      
      try {
        // Try to read the contract's name to verify it exists
        const contractName = await publicClient.readContract({
          address: SABLIER_CONTRACT_ADDRESS,
          abi: DynamicLockUpABI,
          functionName: 'name'
        });
        console.log('Contract verified, name:', contractName);
      } catch (contractError) {
        console.error('Contract verification failed:', contractError);
        const errorMessage = contractError instanceof Error ? contractError.message : 'Unknown contract error';
        setError(`Contract not accessible: ${errorMessage}`);
        return;
      }

      const amount = parseEther(formData.totalAmount);
      
      setCurrentStep('approve');
      setError(null);

      console.log('Initiating token approval...');
      writeApproval({
        address: formData.tokenAddress as Address,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [SABLIER_CONTRACT_ADDRESS, amount],
      });
    } catch (err: any) {
      console.error('Approval setup failed:', err);
      setError(`Approval failed: ${err.message}`);
      setCurrentStep('form');
    }
  }, [address, isConnected, formData, validateForm, writeApproval]);

  // Handle stream creation
  const handleCreateStream = useCallback(async () => {
    if (!address || !isConnected) {
      setError('Wallet not connected');
      return;
    }

    try {
      console.log('Preparing Dynamic stream creation parameters...');
      
      const totalAmount = parseEther(formData.totalAmount);
      const durationSeconds = formData.durationDays * 24 * 60 * 60;

      // Prepare parameters for createWithDurations (Dynamic contract method)
      // Segment structure: [amount, exponent, duration]
      const segment = [
        totalAmount,    // amount: uint128
        1n,             // exponent: uint64 (1 = linear vesting)
        durationSeconds // duration: uint40
      ];
      const segments = [segment]; // Array of segments

      // Broker: [account, fee] - zero address means no broker
      const broker = [
        '0x0000000000000000000000000000000000000000' as Address, // account
        0n // fee
      ];

      // Main parameters for Dynamic contract
      const params = [
        address,                              // sender: address
        formData.recipientAddress as Address, // recipient: address
        totalAmount,                          // totalAmount: uint128
        formData.tokenAddress as Address,     // asset: address
        formData.isCancelable,                // cancelable: bool
        formData.isTransferable,              // transferable: bool
        segments,                             // segments: tuple[]
        broker                                // broker: tuple
      ];

      console.log('Dynamic stream parameters:', {
        params,
        segments,
        broker,
        contract: SABLIER_CONTRACT_ADDRESS
      });

      setCurrentStep('create');
      setError(null);

      writeStreamCreation({
        address: SABLIER_CONTRACT_ADDRESS,
        abi: DynamicLockUpABI,
        functionName: 'createWithDurations',
        args: [params],
      });
    } catch (err: any) {
      console.error('Dynamic stream creation setup failed:', err);
      setError(`Vesting creation failed: ${err.message}`);
      setCurrentStep('approve');
    }
  }, [address, isConnected, formData, writeStreamCreation]);

  // Extract stream ID from transaction receipt
  React.useEffect(() => {
    if (isStreamCreationConfirmed && streamCreationReceipt) {
      try {
        console.log('Create stream tx:', streamCreationHash);
        console.log('Transaction receipt:', streamCreationReceipt);
        
        // Look for any event from the Sablier contract
        const sablierEvents = streamCreationReceipt.logs.filter(
          log => log.address.toLowerCase() === SABLIER_CONTRACT_ADDRESS.toLowerCase()
        );

        console.log('Sablier events found:', sablierEvents);

        if (sablierEvents.length > 0) {
          // Try to decode using the ABI to find CreateLockupLinearStream event
          for (const event of sablierEvents) {
            try {
              const decoded = decodeEventLog({
                abi: DynamicLockUpABI,
                data: event.data,
                topics: event.topics,
              });
              
              console.log('Decoded event:', decoded);
              
              // Check if it's a CreateLockupDynamicStream event (matching Python's Dynamic method)
              if (decoded.eventName === 'CreateLockupDynamicStream') {
                const streamId = (decoded.args as any).streamId?.toString();
                if (streamId) {
                  console.log('🎉 Dynamic Stream created with ID:', streamId);
                  setCreatedStreamId(streamId);
                  setCurrentStep('success');
                  return;
                }
              }
            } catch (decodeError) {
              console.log('Failed to decode event:', decodeError);
              // Continue to next event
            }
          }
          
          // If we can't decode, try to extract from topics directly
          const firstEvent = sablierEvents[0];
          if (firstEvent.topics && firstEvent.topics[1]) {
            const streamId = BigInt(firstEvent.topics[1]).toString();
            console.log('🎉 Stream ID extracted from topics:', streamId);
            setCreatedStreamId(streamId);
            setCurrentStep('success');
            return;
          }
        }
        
        setError('Stream created but ID could not be extracted from transaction logs. Check console for details.');
        setCurrentStep('success');
      } catch (err) {
        console.error('Error extracting stream ID:', err);
        setError(`Stream created but ID extraction failed: ${err}`);
        setCurrentStep('success');
      }
    }
  }, [isStreamCreationConfirmed, streamCreationReceipt]);

  // Auto-proceed to stream creation after approval
  React.useEffect(() => {
    if (isApprovalConfirmed && currentStep === 'approve') {
      handleCreateStream();
    }
  }, [isApprovalConfirmed, currentStep, handleCreateStream]);

  // Handle errors
  React.useEffect(() => {
    if (approvalError) {
      setError(`Approval failed: ${approvalError.message}`);
      setCurrentStep('form');
    }
  }, [approvalError]);

  React.useEffect(() => {
    if (streamCreationError) {
      setError(`Stream creation failed: ${streamCreationError.message}`);
      setCurrentStep('approve');
    }
  }, [streamCreationError]);

  const resetForm = () => {
    setFormData({
      tokenAddress: '',
      recipientAddress: '',
      totalAmount: '',
      durationDays: 7,
      isTransferable: true,
      isCancelable: true,
    });
    setCurrentStep('form');
    setCreatedStreamId(null);
    setError(null);
  };

  // Helper function to format vesting amounts
  const formatVestingAmount = (amount: string, decimals: number = 18) => {
    try {
      const formatted = formatUnits(BigInt(amount), decimals);
      return parseFloat(formatted).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  // Helper function to check if vesting is completed
  const isVestingCompleted = (vesting: SablierVesting) => {
    // Vesting is completed if intactAmount is 0 or if current time is past end time
    const now = Date.now() / 1000;
    const endTime = parseInt(vesting.endTime);
    const intactAmount = BigInt(vesting.intactAmount || '0');
    
    return intactAmount === 0n || now > endTime;
  };

  // Helper function to format dates
  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Helper function to calculate vesting progress
  const calculateProgress = (startTime: string, endTime: string) => {
    const now = Date.now() / 1000;
    const start = parseInt(startTime);
    const end = parseInt(endTime);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#f9fafb] text-[#141e41]">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center max-w-md">
                <div className="bg-red-100 text-red-600 rounded-xl p-4 mb-4">
                  <Wallet size={32} className="mx-auto" />
                </div>
                <h2 className="text-xl font-semibold mb-3">Wallet Connection Required</h2>
                <p className="text-[#9695a7] mb-6">Please connect your wallet to create token vesting streams for your employees.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#141e41]">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#141e41] mb-2">Token Vesting</h1>
                <p className="text-[#9695a7]">Manage token vesting schedules for your team members using Sablier protocol on Base Sepolia.</p>
              </div>

              {/* Tab Navigation */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-1 mb-6">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'create'
                        ? 'bg-indigo-600 text-white'
                        : 'text-[#9695a7] hover:text-[#141e41] hover:bg-[#f9fafb]'
                    }`}
                  >
                    Create Vesting
                  </button>
                  <button
                    onClick={() => setActiveTab('my-vestings')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'my-vestings'
                        ? 'bg-indigo-600 text-white'
                        : 'text-[#9695a7] hover:text-[#141e41] hover:bg-[#f9fafb]'
                    }`}
                  >
                    My Vestings
                  </button>
                  <button
                    onClick={() => setActiveTab('under-me')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl transition-colors ${
                      activeTab === 'under-me'
                        ? 'bg-indigo-600 text-white'
                        : 'text-[#9695a7] hover:text-[#141e41] hover:bg-[#f9fafb]'
                    }`}
                  >
                    Vestings Under Me
                  </button>
                </div>
              </div>

              {/* Progress Steps - Only show for Create Vesting tab */}
              {activeTab === 'create' && (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-6">
                  <div className="flex items-center justify-between relative">
                    {[
                      { key: 'form', label: 'Setup', icon: Wallet },
                      { key: 'approve', label: 'Approve', icon: CheckCircle },
                      { key: 'create', label: 'Create', icon: Clock },
                      { key: 'success', label: 'Complete', icon: CheckCircle }
                    ].map((step, index) => {
                      const isActive = ['form', 'approve', 'create', 'success'].indexOf(currentStep) >= index;
                      const isCurrent = ['form', 'approve', 'create', 'success'][index] === currentStep;
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center relative z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-[#f4f4f5] text-[#9695a7]'
                          } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}>
                            <Icon size={20} />
                          </div>
                          <span className={`mt-2 text-sm font-medium ${
                            isActive ? 'text-[#141e41]' : 'text-[#9695a7]'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Progress lines positioned absolutely */}
                    <div className="absolute top-5 left-0 right-0 flex justify-between px-5">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className={`h-0.5 ${
                            ['form', 'approve', 'create', 'success'].indexOf(currentStep) > index 
                              ? 'bg-indigo-600' : 'bg-[#e5e7eb]'
                          }`}
                          style={{ width: 'calc(100% / 3)' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert - Only show for Create Vesting tab */}
              {error && activeTab === 'create' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 font-medium">Error</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}



              {/* Main Content */}
              {activeTab === 'create' && (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                {currentStep === 'form' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">Vesting Configuration</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[#141e41]">
                              Token to Vest
                            </label>
                            <button
                              type="button"
                              onClick={fetchTokenHoldings}
                              disabled={isLoadingTokens}
                              className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-[#9695a7] flex items-center space-x-1"
                            >
                              <RefreshCw className={`w-4 h-4 ${isLoadingTokens ? 'animate-spin' : ''}`} />
                              <span>Refresh</span>
                            </button>
                          </div>
                          <div className="relative token-dropdown-container">
                            <button
                              type="button"
                              onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent flex items-center justify-between bg-white text-left"
                            >
                              {selectedToken ? (
                                <div className="flex items-center space-x-3">
                                  {selectedToken.token.detail?.iconUrls?.["32"] && (
                                    <img 
                                      src={selectedToken.token.detail.iconUrls["32"]} 
                                      alt={selectedToken.token.symbol}
                                      className="w-6 h-6 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <div>
                                      <span className="font-medium">{selectedToken.token.symbol}</span>
                                      <span className="text-[#9695a7] ml-2">{selectedToken.token.name}</span>
                                    </div>
                                    <div className="text-xs text-[#9695a7] font-mono mt-1">
                                      {selectedToken.tokenAddress}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Coins className="w-5 h-5 text-[#9695a7]" />
                                  <span className="text-[#9695a7]">Select token from your holdings</span>
                                </div>
                              )}
                              <ChevronDown className={`w-5 h-5 text-[#9695a7] transition-transform ${showTokenDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showTokenDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {isLoadingTokens ? (
                                  <div className="px-3 py-4 text-center text-[#9695a7]">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                                    <p className="mt-2 text-sm">Loading your tokens...</p>
                                  </div>
                                ) : tokenHoldings.length > 0 ? (
                                  tokenHoldings.map((token) => (
                                    <button
                                      key={token.tokenAddress}
                                      type="button"
                                      onClick={() => handleTokenSelect(token)}
                                      className="w-full px-3 py-3 text-left hover:bg-[#f9fafb] flex items-center justify-between border-b border-[#f1f5f9] last:border-b-0"
                                    >
                                      <div className="flex items-center space-x-3">
                                        {token.token.detail?.iconUrls?.["32"] && (
                                          <img 
                                            src={token.token.detail.iconUrls["32"]} 
                                            alt={token.token.symbol}
                                            className="w-6 h-6 rounded-full"
                                          />
                                        )}
                                        <div>
                                          <div className="font-medium text-[#141e41]">{token.token.symbol}</div>
                                          <div className="text-sm text-[#9695a7]">{token.token.name}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium text-[#141e41]">
                                          {parseFloat(formatUnits(BigInt(token.holderBalance), token.token.decimals)).toFixed(4)}
                                        </div>
                                        <div className="text-sm text-[#9695a7]">Balance</div>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-4 text-center text-[#9695a7]">
                                    <Coins className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">No tokens found</p>
                                    <p className="text-xs">Make sure you have ERC20 tokens on Base Sepolia</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Manual address input fallback */}
                          <div className="mt-3">
                            {!showManualInput ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowManualInput(true);
                                  setShowTokenDropdown(false);
                                  setSelectedToken(null); // Clear selected token when switching to manual
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800"
                              >
                                Or enter token address manually
                              </button>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-[#141e41]">Manual Token Address</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowManualInput(false);
                                      setFormData(prev => ({ ...prev, tokenAddress: '' })); // Clear manual input
                                    }}
                                    className="text-sm text-[#9695a7] hover:text-[#141e41]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={formData.tokenAddress}
                                  onChange={(e) => handleInputChange('tokenAddress', e.target.value)}
                                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                  placeholder="0x... (ERC20 token address)"
                                />
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-[#9695a7] mt-1">The token contract you want to vest</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#141e41] mb-2">
                            Recipient Address
                          </label>
                          <input
                            type="text"
                            value={formData.recipientAddress}
                            onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                            placeholder="0x... (employee wallet address)"
                          />
                          <p className="text-xs text-[#9695a7] mt-1">Employee's wallet address to receive vested tokens</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[#141e41]">
                              Total Amount
                            </label>
                            {selectedToken && (
                              <button
                                type="button"
                                onClick={() => {
                                  const maxBalance = formatUnits(BigInt(selectedToken.holderBalance), selectedToken.token.decimals);
                                  handleInputChange('totalAmount', maxBalance);
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50"
                              >
                                Max
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.000001"
                              value={formData.totalAmount}
                              onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                              placeholder="0.0"
                            />
                            {selectedToken && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-[#9695a7]">
                                {selectedToken.token.symbol}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-[#9695a7]">Total tokens to be vested over time</p>
                            {selectedToken && (
                              <p className="text-xs text-[#9695a7]">
                                Balance: {parseFloat(formatUnits(BigInt(selectedToken.holderBalance), selectedToken.token.decimals)).toFixed(4)} {selectedToken.token.symbol}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#141e41] mb-2">
                            Vesting Duration (days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.durationDays}
                            onChange={(e) => handleInputChange('durationDays', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                          />
                          <p className="text-xs text-[#9695a7] mt-1">Number of days for the vesting period</p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-[#141e41]">Stream Properties</h4>
                          
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="transferable"
                              checked={formData.isTransferable}
                              onChange={(e) => handleInputChange('isTransferable', e.target.checked)}
                              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-[#e5e7eb] rounded"
                            />
                            <div>
                              <label htmlFor="transferable" className="block text-sm font-medium text-[#141e41]">
                                Transferable
                              </label>
                              <p className="text-xs text-[#9695a7]">Allow recipient to transfer the stream NFT</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="cancelable"
                              checked={formData.isCancelable}
                              onChange={(e) => handleInputChange('isCancelable', e.target.checked)}
                              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-[#e5e7eb] rounded"
                            />
                            <div>
                              <label htmlFor="cancelable" className="block text-sm font-medium text-[#141e41]">
                                Cancelable
                              </label>
                              <p className="text-xs text-[#9695a7]">Allow you to cancel the stream if needed</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        onClick={handleApproval}
                        disabled={isApprovalPending}
                        className="bg-indigo-600 text-white py-3 px-6 rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Create Vesting
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {(currentStep === 'approve' || currentStep === 'create') && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-[#e5e7eb] border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                    {currentStep === 'approve' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Approving Token Spend</h3>
                        <p className="text-[#9695a7]">
                          {isApprovalPending && 'Please confirm the approval transaction in your wallet...'}
                          {isApprovalConfirming && 'Waiting for approval confirmation on the blockchain...'}
                        </p>
                      </div>
                    )}
                    {currentStep === 'create' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Creating Vesting</h3>
                        <p className="text-[#9695a7]">
                          {isStreamCreationPending && 'Please confirm the stream creation transaction in your wallet...'}
                          {isStreamCreationConfirming && 'Creating your vesting stream on the blockchain...'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 'success' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-green-600 mb-2">Vesting Created Successfully!</h3>
                    <p className="text-[#9695a7] mb-8">Your employee token vesting stream has been deployed on Base Sepolia.</p>

                    {streamCreationHash && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <h4 className="text-blue-800 font-semibold mb-2">Transaction</h4>
                        <div className="text-sm">
                          <p className="text-blue-700 font-mono text-xs break-all mb-2">{streamCreationHash}</p>
                          <a 
                            href={`https://sepolia.basescan.org/tx/${streamCreationHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1"
                          >
                            View on BaseScan
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#f4f4f5] rounded-xl p-4 mb-8">
                      <h4 className="font-medium mb-3">Vesting Summary</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[#9695a7]">Token:</span>
                            <span className="font-mono text-xs">{formData.tokenAddress.slice(0, 6)}...{formData.tokenAddress.slice(-4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#9695a7]">Recipient:</span>
                            <span className="font-mono text-xs">{formData.recipientAddress.slice(0, 6)}...{formData.recipientAddress.slice(-4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#9695a7]">Amount:</span>
                            <span className="font-medium">{formData.totalAmount} tokens</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-[#9695a7]">Duration:</span>
                            <span className="font-medium">{formData.durationDays} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#9695a7]">Transferable:</span>
                            <span className="font-medium">{formData.isTransferable ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#9695a7]">Cancelable:</span>
                            <span className="font-medium">{formData.isCancelable ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-xl hover:bg-indigo-700 font-medium"
                      >
                        Create Another Stream
                      </button>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 border border-[#e5e7eb] text-[#141e41] py-3 px-6 rounded-xl hover:bg-[#f4f4f5] font-medium"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )}

              {/* My Vestings Tab Content */}
              {activeTab === 'my-vestings' && (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#141e41]">My Vestings</h3>
                      <p className="text-sm text-[#9695a7] mt-1">Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>
                    <button
                      onClick={fetchMyVestings}
                      disabled={isLoadingMyVestings}
                      className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-[#9695a7] flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingMyVestings ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingMyVestings ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-[#e5e7eb] border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                      <p className="text-[#9695a7]">Loading your vestings...</p>
                    </div>
                  ) : myVestings.length > 0 ? (
                    <div className="grid gap-4">
                      {myVestings.map((vesting) => (
                        <div key={vesting.id} className="border border-[#e5e7eb] rounded-xl p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-[#141e41] mb-1">Vesting #{vesting.id}</h4>
                              <p className="text-sm text-[#9695a7]">From: {vesting.sender.slice(0, 6)}...{vesting.sender.slice(-4)}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-[#141e41]">
                                {formatVestingAmount(vesting.depositAmount)} Tokens
                              </div>
                              <div className="text-sm text-[#9695a7]">
                                Withdrawn: {formatVestingAmount(vesting.withdrawnAmount)}
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-[#9695a7] mb-2">
                              <span>Progress</span>
                              <span>{calculateProgress(vesting.startTime, vesting.endTime).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-[#e5e7eb] rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${calculateProgress(vesting.startTime, vesting.endTime)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-[#9695a7]">Start Date</div>
                              <div className="font-medium text-[#141e41]">{formatDate(vesting.startTime)}</div>
                            </div>
                            <div>
                              <div className="text-[#9695a7]">End Date</div>
                              <div className="font-medium text-[#141e41]">{formatDate(vesting.endTime)}</div>
                            </div>
                            <div>
                              <div className="text-[#9695a7]">Status</div>
                              <div className={`font-medium ${
                                vesting.canceled ? 'text-red-600' : 
                                isVestingCompleted(vesting) ? 'text-green-600' : 'text-indigo-600'
                              }`}>
                                {vesting.canceled ? 'Canceled' : 
                                 isVestingCompleted(vesting) ? 'Completed' : 'Active'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex justify-between items-center">
                            <div className="text-xs text-[#9695a7] font-mono">
                              Token: {(() => {
                                const tokenAddress = getTokenAddress(vesting);
                                return tokenAddress ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` : 'N/A';
                              })()}
                            </div>
                            <a
                              href={`https://sepolia.basescan.org/address/${getTokenAddress(vesting) || '#'}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                            >
                              View Token
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#f4f4f5] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-[#9695a7]" />
                      </div>
                      <h4 className="text-lg font-semibold text-[#141e41] mb-2">No Vestings Found</h4>
                      <p className="text-[#9695a7]">You don't have any active vestings as a beneficiary</p>
                    </div>
                  )}
                </div>
              )}

              {/* Vestings Under Me Tab Content */}
              {activeTab === 'under-me' && (
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#141e41]">Vestings Under Me</h3>
                      <p className="text-sm text-[#9695a7] mt-1">Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>
                    <button
                      onClick={fetchCreatedVestings}
                      disabled={isLoadingCreatedVestings}
                      className="text-sm text-indigo-600 hover:text-indigo-800 disabled:text-[#9695a7] flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingCreatedVestings ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingCreatedVestings ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-[#e5e7eb] border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                      <p className="text-[#9695a7]">Loading created vestings...</p>
                    </div>
                  ) : createdVestings.length > 0 ? (
                    <div className="grid gap-4">
                      {createdVestings.map((vesting) => (
                        <div key={vesting.id} className="border border-[#e5e7eb] rounded-xl p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-[#141e41] mb-1">Vesting #{vesting.id}</h4>
                              <p className="text-sm text-[#9695a7]">To: {vesting.recipient.slice(0, 6)}...{vesting.recipient.slice(-4)}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-[#141e41]">
                                {formatVestingAmount(vesting.depositAmount)} Tokens
                              </div>
                              <div className="text-sm text-[#9695a7]">
                                Withdrawn: {formatVestingAmount(vesting.withdrawnAmount)}
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-[#9695a7] mb-2">
                              <span>Progress</span>
                              <span>{calculateProgress(vesting.startTime, vesting.endTime).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-[#e5e7eb] rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${calculateProgress(vesting.startTime, vesting.endTime)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-[#9695a7]">Start Date</div>
                              <div className="font-medium text-[#141e41]">{formatDate(vesting.startTime)}</div>
                            </div>
                            <div>
                              <div className="text-[#9695a7]">End Date</div>
                              <div className="font-medium text-[#141e41]">{formatDate(vesting.endTime)}</div>
                            </div>
                            <div>
                              <div className="text-[#9695a7]">Status</div>
                              <div className={`font-medium ${
                                vesting.canceled ? 'text-red-600' : 
                                isVestingCompleted(vesting) ? 'text-green-600' : 'text-indigo-600'
                              }`}>
                                {vesting.canceled ? 'Canceled' : 
                                 isVestingCompleted(vesting) ? 'Completed' : 'Active'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex justify-between items-center">
                            <div className="text-xs text-[#9695a7] font-mono">
                              Token: {(() => {
                                const tokenAddress = getTokenAddress(vesting);
                                return tokenAddress ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` : 'N/A';
                              })()}
                            </div>
                            <div className="flex space-x-2">
                              <a
                                href={`https://sepolia.basescan.org/address/${vesting.recipient}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                              >
                                View Recipient
                                <ExternalLink size={14} />
                              </a>
                              <a
                                href={`https://sepolia.basescan.org/address/${getTokenAddress(vesting) || '#'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                              >
                                View Token
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#f4f4f5] rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-[#9695a7]" />
                      </div>
                      <h4 className="text-lg font-semibold text-[#141e41] mb-2">No Vestings Created</h4>
                      <p className="text-[#9695a7]">You haven't created any vestings yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default VestingPage;