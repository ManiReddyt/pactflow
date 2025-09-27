import mongoose, { Schema } from 'mongoose';
import { IUser, IUserDocument } from '../types';

const recipientSchema = new Schema({
  address: {
    type: String,
    required: true,
    trim: true
  },
  mail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  fingerprint: {
    type: String,
    required: true,
    trim: true
  },
  is_signed: {
    type: Boolean,
    default: false
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  signed_at: {
    type: Date,
    default: null
  },
  verified_at: {
    type: Date,
    default: null
  }
}, { _id: false });

const contractSchema = new Schema({
  contract_address: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  fingerprint: {
    type: String,
    required: true,
    trim: true
  },
  recipients: [recipientSchema],
  status: {
    type: String,
    enum: ['draft', 'sent', 'signed', 'completed'],
    default: 'draft'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
contractSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const userSchema = new Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  publickeyhash: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  evm_address: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  mail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  nft_addresses: {
    type: Map,
    of: String,
    default: {}
  },
  contracts: [contractSchema],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
userSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Indexes for better query performance
userSchema.index({ evm_address: 1 });
userSchema.index({ publickeyhash: 1 });
userSchema.index({ mail: 1 });
userSchema.index({ uid: 1 });

contractSchema.index({ contract_address: 1 });

export const User = mongoose.model<IUserDocument>('User', userSchema);
