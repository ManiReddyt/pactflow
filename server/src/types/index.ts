import { Document } from 'mongoose';
import { Request } from 'express';

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

// Mongoose document types
export interface IUserDocument extends IUser, Document {}
export interface IContractDocument extends IContract, Document {}

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
  fingerprint: string;
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

export interface JWTPayload {
  uid: string;
  evm_address: string;
  publickeyhash: string;
  iat?: number;
  exp?: number;
}


export interface GetReceivedContractsResponse {
  success: boolean;
  message: string;
  contracts: (IContract & {
    creator_uid: string;
    creator_evm_address: string;
  })[];
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    evm_address: string;
    publickeyhash: string;
  };
}
