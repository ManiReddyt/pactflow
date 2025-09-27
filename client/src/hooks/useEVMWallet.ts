import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { useChainId } from "wagmi";
import { LOCAL_STORAGE_KEYS } from "../constants/constants";
import { useAuthStore } from "../store/useAuthStore";

export const clearLocalStorageExcept = (keysToKeep: string[]) => {
    const allKeys = Object.values(LOCAL_STORAGE_KEYS);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  };
export const useEVMWallet = () => {
  const { data: walletClient } = useWalletClient();
  const { address, isConnected, connector } = useAccount();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { status, connectors, isPending, connectAsync } = useConnect();
  const chainId = useChainId();
  const setConnectedConnectorName = useAuthStore((s) => s.setConnectedConnectorName);

  const disconnect = () => {
    disconnectWallet();
    clearLocalStorageExcept([
      LOCAL_STORAGE_KEYS.notification,
      LOCAL_STORAGE_KEYS.deletedOrders,
    ]);
  };

  const safeConnect = async (params: { connector: any }) => {
    try {
      if (isConnected && connector?.uid === params.connector?.uid) {
        return;
      }
      if (isConnected && connector?.uid !== params.connector?.uid) {
        disconnect();
      }
      const res = await connectAsync(params);
      setConnectedConnectorName(res.accounts[0]);
      return res;
    } catch (e: any) {
      if (e?.name === 'ConnectorAlreadyConnectedError') {
        setConnectedConnectorName(connector?.name);
        return;
      }
      throw e;
    }
  };

  return {
    walletClient,
    address,
    connectors,
    isPending,
    connector,
    isConnected,
    status,
    disconnect,
    connectAsync: safeConnect,
    chainId,
  };
};
