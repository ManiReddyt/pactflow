// Sablier Vesting Configuration for Base Sepolia

export const VESTING_CONFIG = {
  // Base Sepolia Sablier LockupDynamic contract address from environment variables
  SABLIER_CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x6dcb73e5f7e8e70be20b3b9cf50e3be4625a91c3',
  
  // Default vesting parameters
  DEFAULT_DURATION_DAYS: 7,
  DEFAULT_CLIFF_DURATION_DAYS: 0,
  
  // UI Configuration
  MIN_DURATION_DAYS: 1,
  MAX_DURATION_DAYS: 365 * 4, // 4 years
  
  // Validation
  MIN_AMOUNT: '0.000001',
} as const;
export type VestingConfig = typeof VESTING_CONFIG;