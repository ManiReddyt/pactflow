import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAuthStore } from "../store/useAuthStore";
import { useChainId, useWalletClient } from "wagmi";
import { celoSepolia } from "viem/chains";

export const usePrivyWallet = () => {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    sendTransaction,
    signMessage,
  } = usePrivy();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  console.log("chainId :", chainId);
  const { wallets } = useWallets();
  const wallet = wallets[0];

  const {
    handlePrivyLogin,
    handlePrivyLogout,
    privyUser,
    walletAddress,
    isLoading,
    isAuthenticated,
  } = useAuthStore();

  // Get the embedded wallet (Privy's default wallet)
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  // Handle Privy login
  const handleLogin = async () => {
    if (!ready) return;

    try {
      await login();
    } catch (error) {
      console.error("Failed to login with Privy:", error);
    }
  };

  // Handle Privy logout
  const handleLogout = async () => {
    try {
      await logout();
      handlePrivyLogout();
    } catch (error) {
      console.error("Failed to logout from Privy:", error);
    }
  };

  // Get wallet address - prioritize embedded wallet, fallback to connected wallet
  const getWalletAddress = () => {
    if (embeddedWallet?.address) return embeddedWallet.address;
    // Check for any connected wallet address
    const connectedWallet = wallets.find((wallet) => wallet.address);
    if (connectedWallet?.address) return connectedWallet.address;
    return walletAddress;
  };

  // Check if user has a wallet
  const hasWallet = () => {
    return embeddedWallet || wallets.some((wallet) => wallet.address);
  };

  // Get wallet for signing transactions
  const getWalletForSigning = () => {
    if (embeddedWallet) return embeddedWallet;
    // Return the first connected wallet for signing
    return wallets.find((wallet) => wallet.address);
  };

  // Switch wallet to chain 84532 (Base Sepolia)
  const switchToChain84532 = async () => {
    try {
      const walletForSwitching = wallet;
      if (walletForSwitching) {
        await walletForSwitching.switchChain(celoSepolia.id);
      }
    } catch (error) {
      console.error("Failed to switch to chain 84532:", error);
    }
  };

  return {
    // Privy state
    ready,
    authenticated,
    user,
    wallets,
    connectedWallet: wallet,
    embeddedWallet,
    // Wallet info
    walletAddress: getWalletAddress(),
    isConnected: authenticated || !!embeddedWallet,
    hasWallet: hasWallet(),
    walletClient: getWalletForSigning(),
    sendTransaction,

    // Auth state
    isAuthenticated,
    isLoading,

    // Actions
    login: handleLogin,
    logout: handleLogout,
    switchToChain84532,
    signMessage,

    // Utility functions
    getWalletAddress,
    getWalletForSigning,

    wallet,
  };
};
