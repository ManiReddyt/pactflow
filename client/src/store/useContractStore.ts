import { create } from 'zustand';
import { IContract, CreateContractRequest } from '../types';
import apiService from '../services/api';

type ContractState = {
  contracts: IContract[];
  receivedContracts: (IContract & { creator_uid: string; creator_evm_address: string })[];
  currentContract: IContract | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setContracts: (contracts: IContract[]) => void;
  setReceivedContracts: (contracts: (IContract & { creator_uid: string; creator_evm_address: string })[]) => void;
  setCurrentContract: (contract: IContract | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API actions
  fetchContracts: () => Promise<void>;
  fetchReceivedContracts: () => Promise<void>;
  fetchContract: (contractAddress: string) => Promise<void>;
  createContract: (contractData: CreateContractRequest) => Promise<IContract | null>;
  updateContract: (contractAddress: string, updates: Partial<IContract>) => Promise<void>;
  signContract: (contractAddress: string, recipientAddress: string) => Promise<void>;
  
  // Clear state
  clearError: () => void;
  reset: () => void;
};

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  receivedContracts: [],
  currentContract: null,
  isLoading: false,
  error: null,
  
  setContracts: (contracts) => set({ contracts }),
  setReceivedContracts: (receivedContracts) => set({ receivedContracts }),
  setCurrentContract: (contract) => set({ currentContract: contract }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  fetchContracts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getMyAllContracts();
      if (response.success) {
        set({ contracts: response.contracts, isLoading: false });
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch contracts',
        isLoading: false 
      });
    }
  },

  fetchReceivedContracts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getReceivedContracts();
      if (response.success) {
        set({ receivedContracts: response.contracts, isLoading: false });
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch received contracts',
        isLoading: false 
      });
    }
  },
  
  fetchContract: async (contractAddress: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getContract(contractAddress);
      if (response.success) {
        set({ currentContract: response.contract, isLoading: false });
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch contract',
        isLoading: false  
      });
    }
  },
  
  createContract: async (contractData: CreateContractRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.createContract(contractData);
      if (response.success && response.contract) {
        const { contracts } = get();
        set({ 
          contracts: [...contracts, response.contract],
          currentContract: response.contract,
          isLoading: false 
        });
        return response.contract;
      } else {
        set({ error: response.message, isLoading: false });
        return null;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create contract',
        isLoading: false 
      });
      return null;
    }
  },
  
  updateContract: async (contractAddress: string, updates: Partial<IContract>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.updateContract(contractAddress, updates);
      if (response.success && response.contract) {
        const { contracts } = get();
        const updatedContracts = contracts.map(contract => 
          contract.contract_address === contractAddress ? response.contract! : contract
        );
        set({ 
          contracts: updatedContracts,
          currentContract: response.contract,
          isLoading: false 
        });
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update contract',
        isLoading: false 
      });
    }
  },
  
  signContract: async (contractAddress: string, recipientAddress: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.updateRecipientStatus(contractAddress, recipientAddress, {
        is_signed: true
      });
      if (response.success && response.contract) {
        const { contracts } = get();
        const updatedContracts = contracts.map(contract => 
          contract.contract_address === contractAddress ? response.contract! : contract
        );
        set({ 
          contracts: updatedContracts,
          currentContract: response.contract,
          isLoading: false 
        });
      } else {
        set({ error: response.message, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign contract',
        isLoading: false 
      });
    }
  },
  
  clearError: () => set({ error: null }),
  reset: () => set({ 
    contracts: [], 
    receivedContracts: [],
    currentContract: null, 
    isLoading: false, 
    error: null 
  }),
}));
