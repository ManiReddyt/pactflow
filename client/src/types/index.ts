// Types copied from server for client-side usage

// Recipient interface for contracts
export interface IRecipient {
  address: string;
  mail: string;
  fingerprint: string;
  is_signed: boolean;
  is_verified: boolean;
  signed_at?: Date;
  verified_at?: Date;
}

// Contract interface
export interface IContract {
  contract_address: string;
  title: string;
  fingerprint: string;
  recipients: IRecipient[];
  created_at: Date;
  updated_at: Date;
  status: 'draft' | 'sent' | 'signed' | 'completed';
}

// NFT addresses interface
export interface INFTAddresses {
  [key: string]: string; // chain -> nft_address
}

// User interface
export interface IUser {
  uid: string;
  username: string;
  publickeyhash: string;
  evm_address: string;
  mail: string;
  nft_addresses: INFTAddresses;
  contracts: IContract[];
  created_at: Date;
  updated_at: Date;
}

// Request/Response types
export interface CreateUserRequest {
  username: string;
  publickeyhash: string;
  evm_address: string;
  mail: string;
  nft_addresses?: INFTAddresses;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user?: IUser;
  token?: string;
}

export interface CreateContractRequest {
  contract_address: string;
  title: string;
  fingerprint?: string;
  recipients: Omit<IRecipient, 'is_signed' | 'is_verified' | 'signed_at' | 'verified_at'>[];
}

export interface CreateContractResponse {
  success: boolean;
  message: string;
  contract?: IContract;
}

export interface UpdateUserRequest {
  username?: string;
  mail?: string;
  nft_addresses?: INFTAddresses;
}

export interface UpdateContractRequest {
  title?: string;
  status?: 'draft' | 'sent' | 'signed' | 'completed';
  recipients?: IRecipient[];
}

export interface GetUserContractsResponse {
  success: boolean;
  message: string;
  contracts: IContract[];
}

export interface GetReceivedContractsResponse {
  success: boolean;
  message: string;
  contracts: (IContract & {
    creator_uid: string;
    creator_evm_address: string;
  })[];
}

export interface GetContractResponse {
  success: boolean;
  message: string;
  contract: IContract;
}

export interface GetUserProfileResponse {
  success: boolean;
  message: string;
  user: IUser;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  user: IUser;
}

export interface UpdateContractResponse {
  success: boolean;
  message: string;
  contract: IContract;
}

export interface UpdateRecipientStatusRequest {
  is_signed?: boolean;
  is_verified?: boolean;
}

export interface UpdateRecipientStatusResponse {
  success: boolean;
  message: string;
  contract: IContract;
}

// Upload response types
export interface UploadResponse {
  success: boolean;
  cid: {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    cid: string;
    network: string;
    number_of_files: number;
    streamable: boolean;
    created_at: string;
    updated_at: string;
    vectorized: boolean;
  };
  gatewayUrl: string;
  fileName: string;
  size: number;
  message: string;
}

// API Error type
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}
