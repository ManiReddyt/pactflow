# Contract Lock 🔒

**A Decentralized Alternative to Contractbook - Secure, Immutable, and Self-Verified Contract Management**

Contract Lock is a revolutionary platform that enables any two parties to share agreements and verify that the intended party is the one who agreed to the document. Built on decentralized infrastructure with seamless Web2-like user experience, Contract Lock eliminates the centralization issues present in traditional contract management systems.

## 🚀 The Problem We Solve

When someone joins a company, they need to sign forms, agree to rules and conditions, or sign NDAs. Most companies use centralized platforms like Contractbook, which creates several critical issues:

- **Centralized Control**: Companies can change form contents without informing employees
- **Lost Documentation**: Users can't find specific points they signed
- **Trust Issues**: No immutable proof of what was actually agreed upon
- **Single Point of Failure**: Centralized systems can be compromised or shut down

## ✨ Our Solution

Contract Lock provides a **decentralized, immutable, and self-verified** contract management system that ensures:

- **Immutable Agreements**: Once signed, contracts cannot be altered
- **Self-Verified Identity**: Integration with Self Protocol for identity verification
- **Decentralized Storage**: Documents stored on IPFS with Lit Protocol encryption
- **On-Chain Proof**: NFT-based signatures provide blockchain proof
- **Web2 UX**: Smooth user experience without Web3 complexity

## 🏗️ Architecture Overview

### Core Flow

1. **User Registration**: Users sign up using valid identity documents through Self app, receiving a unique nullifier
2. **Agreement Creation**: Party A creates an agreement for Party B
3. **Document Encryption**: PDF is encrypted using Lit Protocol and stored securely
4. **Access Control**: Only the two parties can decrypt and view the document
5. **Signing Process**: Party B reviews and signs the contract
6. **NFT Minting**: Upon signing, an NFT is minted as on-chain proof
7. **Immutable Record**: The agreement becomes permanently immutable

### Key Technologies

- **Self Protocol**: Identity verification and nullifier generation
- **Lit Protocol**: Threshold cryptography for document encryption
- **IPFS**: Decentralized document storage
- **Ethereum**: Smart contracts for agreement logic
- **NFTs**: On-chain proof of signatures

## 📁 Project Structure

```
pactflow/
├── client/                 # React frontend application
├── server/                 # Node.js backend with IPFS integration
├── contracts/              # Solidity smart contracts
├── ai-client/             # AI-powered document processing
├── email-client/           # Email notification service
└── encryption-server/      # Document encryption service
```

## 🔧 Smart Contracts

### 1. NftSignFactory Contract

**Purpose**: Factory contract for deploying child NFT contracts

- **Function**: Creates new NftSign contracts for each agreement
- **Owner**: The creator of the agreement becomes the owner
- **Recipient**: The intended signer becomes the recipient
- **Key Features**:
  - Deploys new NftSign contracts
  - Tracks all deployments by owner
  - Manages contract lifecycle

### 2. NftSign Contract (Child Contract)

**Purpose**: Individual contract for each agreement

- **Document Details**: Stores document title, description, and content hash
- **Sign Function**: Allows intended signer to sign and mint NFT
- **Metadata**: Contains encrypted document content hash and Self Protocol nullifier
- **Key Features**:
  - Document metadata storage
  - Signature verification
  - NFT minting upon signing
  - Immutable record keeping

### 3. SelfVerification Contract

**Purpose**: Identity verification using Self Protocol

- **Core Function**: `customVerificationHook` function
- **Verification**: Ensures the expected verified person is signing
- **Integration**: Seamlessly integrates with Self Protocol's identity system
- **Key Features**:
  - Identity verification
  - Nullifier validation
  - Secure signing process

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Yarn >= 1.22.5
- Python 3.8+ (for AI and email services)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pactflow
   ```

2. **Install dependencies for each service**

   **Client (Frontend)**

   ```bash
   cd client
   yarn install
   ```

   **Server (Backend)**

   ```bash
   cd server
   yarn install
   ```

   **AI Client**

   ```bash
   cd ai-client
   pip install -r requirements.txt
   ```

   **Email Client**

   ```bash
   cd email-client
   pip install -r requirements.txt
   ```

   **Encryption Server**

   ```bash
   cd encryption-server
   npm install
   ```

### Environment Setup

Create `.env.example` files for each service:

**Client (.env.example)**

```env
VITE_RPC_URL=your_rpc_url_here
VITE_CONTRACT_ADDRESS=your_contract_address_here
VITE_SELF_APP_ID=your_self_app_id_here
VITE_PRIVY_APP_ID=your_privy_app_id_here
VITE_LIT_CLIENT_CONFIG=your_lit_config_here
```

**Server (.env.example)**

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/contractlock
JWT_SECRET=your_jwt_secret_here
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
```

**AI Client (.env.example)**

```env
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Email Client (.env.example)**

```env
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_user_here
SMTP_PASS=your_smtp_password_here
FROM_EMAIL=noreply@contractlock.com
```

**Encryption Server (.env.example)**

```env
PORT=3002
LIT_CLIENT_CONFIG=your_lit_config_here
```

### Running the Application

1. **Start the backend server**

   ```bash
   cd server
   yarn dev
   ```

2. **Start the frontend client**
   ```bash
   cd client
   yarn dev
   ```

The application will be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- AI Service: `http://localhost:8000`
- Email Service: `http://localhost:8001`
- Encryption Service: `http://localhost:3002`

## 🔐 Self Protocol Integration

Contract Lock leverages **Self Protocol** for robust identity verification:

- **Identity Verification**: Users must verify their identity through Self Protocol
- **Nullifier Generation**: Each user receives a unique nullifier for privacy-preserving verification
- **Custom Verification Hook**: Our smart contract integrates with Self's verification system
- **Privacy-Preserving**: Users can prove their identity without revealing personal information
- **Decentralized Identity**: No central authority controls user identities

## 🛡️ Security Features

- **Threshold Cryptography**: Documents encrypted with Lit Protocol's MPC
- **IPFS Storage**: Decentralized document storage
- **Identity Verification**: Self Protocol integration for verified identities
- **Immutable Records**: Once signed, contracts cannot be altered
- **Encryption Key Management**: Secure key management through Lit Protocol

## 🌟 Key Benefits

- **Decentralized**: No single point of failure
- **Immutable**: Contracts cannot be altered after signing
- **Self-Verified**: Identity verification through Self Protocol
- **User-Friendly**: Web2-like experience with Web3 security
- **Transparent**: All operations are verifiable on-chain
- **Private**: Documents encrypted and only accessible to parties
- **Efficient**: Fast and cost-effective operations

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Self Protocol**: [https://self.xyz](https://self.xyz)
- **Lit Protocol**: [https://litprotocol.com](https://litprotocol.com)
- **IPFS**: [https://ipfs.io](https://ipfs.io)
- **Contractbook**: [https://contractbook.com](https://contractbook.com)

## 📞 Support

For support and questions, please open an issue in this repository.

---

**Built with ❤️ for a decentralized future**
