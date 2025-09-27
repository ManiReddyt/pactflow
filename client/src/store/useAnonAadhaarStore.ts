import { create } from 'zustand';

export type AnonStatus = 'logged-out' | 'logging-in' | 'logged-in' | string;

type AnonState = {
  status: AnonStatus;
  latestProof: any | null;
  setStatus: (s: AnonStatus) => void;
  setLatestProof: (p: any | null) => void;
  reset: () => void;
};

export const useAnonAadhaarStore = create<AnonState>((set) => ({
  status: 'logged-out',
  latestProof: null,
  setStatus: (s) => set({ status: s }),
  setLatestProof: (p) => set({ latestProof: p }),
  reset: () => set({ status: 'logged-out', latestProof: null }),
}));


