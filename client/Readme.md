# ContractLock Client

A modern, secure, and decentralized contract management platform built with React, TypeScript, and Web3 technologies. ContractLock transforms traditional contract management with blockchain-powered security, anonymous verification, and AI assistance.

## 🚀 Features

### Core Functionality

- **Decentralized Contract Management**: Create, manage, and execute contracts on the blockchain
- **Anonymous Verification**: Privacy-preserving contract verification using Aadhaar integration
- **AI-Powered Assistance**: Intelligent contract analysis and suggestions
- **Multi-Chain Support**: Works with Celo Sepolia testnet and other EVM-compatible chains
- **Document Management**: Secure document upload and storage using IPFS
- **Real-time Notifications**: Instant updates on contract status changes

### Authentication & Security

- **Privy Integration**: Seamless Web3 authentication with embedded wallets
- **Aadhaar Verification**: Anonymous identity verification using zero-knowledge proofs
- **JWT Token Management**: Secure session management
- **Wallet Integration**: Support for multiple wallet types and embedded wallets

### Contract Features

- **Contract Creation**: Create new contracts with multiple recipients
- **Digital Signatures**: Secure contract signing with blockchain verification
- **Status Tracking**: Real-time contract status updates (draft, sent, signed, completed)
- **Document Preview**: Built-in document viewer for contract review
- **Vesting Integration**: Token vesting functionality with Sablier protocol

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Web3 & Blockchain

- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **Privy** - Web3 authentication and wallet management
- **Ethers.js** - Ethereum library
- **SIWE** - Sign-In with Ethereum

### Privacy & Security

- **Anon Aadhaar** - Anonymous Aadhaar verification
- **Lit Protocol** - Decentralized encryption and access control
- **Irys** - Decentralized data storage
- **Zero-Knowledge Proofs** - Privacy-preserving verification

### State Management

- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management and caching

### UI/UX

- **Lucide React** - Beautiful icon library
- **Heroicons** - Additional icon set
- **Custom Components** - Tailored UI components

## 📦 Installation

### Prerequisites

- Node.js >= 18
- Yarn >= 1.22.5
- Git

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd contract-lock/client
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the client directory:

   ```env
   VITE_PRIVY_APP_ID=your_privy_app_id
   VITE_CONTRACT_ADDRESS=your_contract_address
   VITE_API_URL=http://localhost:3000
   VITE_IRYS_GATEWAY_URL=https://gateway.irys.xyz
   ```

4. **Start development server**

   ```bash
   yarn dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AadharExtractor.tsx
│   ├── ChatWindow.tsx
│   ├── PrivyLoginButton.tsx
│   └── Sidebar.tsx
├── config/             # Configuration files
│   ├── vesting.ts      # Vesting configuration
│   └── wagmi.ts        # Wagmi configuration
├── constants/          # Application constants
│   ├── constants.ts
│   ├── DeployedContractABI.ts
│   └── NewContractABI.ts
├── hooks/              # Custom React hooks
│   ├── useChat.ts
│   ├── useEVMWallet.ts
│   └── usePrivyWallet.ts
├── pages/              # Page components
│   ├── Actions.tsx
│   ├── BlockChainData.tsx
│   ├── ContractDetailPage.tsx
│   ├── ContractInformation.tsx
│   ├── DashboardPage.tsx
│   ├── DocPreview.tsx
│   ├── LandingPage.tsx
│   ├── NewContractPage.tsx
│   ├── OnboardingPage.tsx
│   ├── ProfilePage.tsx
│   ├── ShowSuccess.tsx
│   └── VestingPage.tsx
├── services/           # API and external services
│   ├── aiChatService.ts
│   ├── api.ts
│   ├── iryisLitClient.ts
│   └── irysLitClient.ts
├── store/              # State management
│   ├── useAnonAadhaarStore.ts
│   ├── useAuthStore.ts
│   └── useContractStore.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── utils.ts
├── App.tsx             # Main application component
├── Layout.tsx          # Application layout
└── main.tsx            # Application entry point
```

## 🔧 Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn lint` - Run ESLint

## 🌐 Environment Variables

| Variable                | Description            | Required |
| ----------------------- | ---------------------- | -------- |
| `VITE_PRIVY_APP_ID`     | Privy application ID   | Yes      |
| `VITE_CONTRACT_ADDRESS` | Smart contract address | Yes      |
| `VITE_API_URL`          | Backend API URL        | Yes      |
| `VITE_IRYS_GATEWAY_URL` | Irys gateway URL       | No       |

## 🔐 Security Features

### Authentication Flow

1. **Privy Authentication**: Users authenticate using email or social login
2. **Wallet Creation**: Embedded wallets are created automatically
3. **Aadhaar Verification**: Optional anonymous identity verification
4. **JWT Tokens**: Secure session management

### Data Protection

- **End-to-End Encryption**: Documents encrypted using Lit Protocol
- **Decentralized Storage**: Files stored on IPFS via Irys
- **Zero-Knowledge Proofs**: Anonymous verification without revealing identity
- **Secure Key Management**: Private keys managed by Privy

## 🚀 Deployment

### Production Build

```bash
yarn build
```

### Docker Deployment

```bash
docker build -t contract-lock-client .
docker run -p 3000:3000 contract-lock-client
```

### Environment Setup

Ensure all environment variables are properly configured for production:

- Update API URLs to production endpoints
- Configure proper CORS settings
- Set up SSL certificates
- Configure CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔗 Related Projects

- [ContractLock Server](../server/) - Backend API
- [ContractLock Contracts](../contracts/) - Smart contracts
- [ContractLock AI Client](../ai-client/) - AI service integration

---

**Built with ❤️ by the ContractLock Team**
