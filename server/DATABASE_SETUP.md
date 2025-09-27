# Database Setup Guide

## Environment Variables

Create a `.env` file in the server root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/contrac-book
# or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/contrac-book

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# IPFS/Pinata Configuration (existing)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_API_KEY=your-pinata-secret-key
```

## Installation

1. Install dependencies:
```bash
cd server
yarn install
```

2. Make sure MongoDB is running (locally or use MongoDB Atlas)

3. Start the server:
```bash
yarn dev
```

## API Endpoints

### User Endpoints (`/api/users`)

- `POST /api/users` - Create new user
- `GET /api/users/profile` - Get user profile (requires JWT)
- `PATCH /api/users/profile` - Update user profile (requires JWT)

### Contract Endpoints (`/api/contracts`)

- `POST /api/contracts` - Create new contract (requires JWT)
- `GET /api/contracts` - Get all user's contracts (requires JWT)
- `GET /api/contracts/:contractAddress` - Get specific contract (requires JWT)
- `PATCH /api/contracts/:contractAddress` - Update contract (requires JWT)
- `PATCH /api/contracts/:contractAddress/recipients/:recipientAddress` - Update recipient status (requires JWT)

## Authentication

- JWT tokens are returned when creating a user
- Include the token in the Authorization header: `Bearer <token>`
- Tokens expire after 7 days (configurable)

## Data Models

### User Model
- `uid`: Unique identifier
- `username`: User's display name
- `publickeyhash`: User's public key hash
- `evm_address`: Ethereum address
- `mail`: Email address
- `nft_addresses`: Object mapping chain names to NFT contract addresses
- `contracts`: Array of contracts created by the user
- `created_at`, `updated_at`: Timestamps

### Contract Model
- `contract_address`: Unique contract address
- `title`: Contract title
- `fingerprint`: Contract fingerprint
- `recipients`: Array of recipient objects
- `status`: Contract status (draft, sent, signed, completed)
- `created_at`, `updated_at`: Timestamps

### Recipient Model
- `address`: Recipient's address
- `mail`: Recipient's email
- `fingerprint`: Recipient's fingerprint
- `is_signed`: Whether the contract is signed
- `is_verified`: Whether the signature is verified
- `signed_at`, `verified_at`: Timestamps for actions
