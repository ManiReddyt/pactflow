import { create } from 'zustand';
import { IUser } from '../types';
import apiService from '../services/api';

type AuthState = {
  // Legacy fields for backward compatibility
  name: string;
  email: string;
  isOnboarded: boolean;
  connectedConnectorName?: string;
  
  // New server-integrated fields
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Privy-specific fields
  privyUser: any | null;
  walletAddress: string | null;
  
  // Legacy setters
  setName: (n: string) => void;
  setEmail: (e: string) => void;
  setOnboarded: (v: boolean) => void;
  setConnectedConnectorName: (n?: string) => void;
  
  // New server-integrated methods
  setUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  // Privy-specific setters
  setPrivyUser: (user: any | null) => void;
  setWalletAddress: (address: string | null) => void;
  
  // Auth actions
  login: (token: string, user: IUser) => void;
  logout: () => void;
  initializeAuth: () => void;
  
  // Privy-specific actions
  handlePrivyLogin: (privyUser: any) => Promise<void>;
  handlePrivyLogout: () => void;
  
  // Combined reset
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  // Legacy fields
  name: '',
  email: '',
  isOnboarded: false,
  connectedConnectorName: undefined,
  
  // New fields
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  
  // Privy fields
  privyUser: null,
  walletAddress: null,
  
  // Legacy setters
  setName: (n) => set({ name: n }),
  setEmail: (e) => set({ email: e }),
  setOnboarded: (v) => set({ isOnboarded: v }),
  setConnectedConnectorName: (n) => set({ connectedConnectorName: n }),
  
  // New setters
  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token });
    if (token) {
      apiService.setAuthToken(token);
    } else {
      apiService.removeAuthToken();
    }
  },
  setAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Privy setters
  setPrivyUser: (privyUser) => set({ privyUser }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  
  // Auth actions
  login: (token, user) => {
    set({ 
      token, 
      user, 
      isAuthenticated: true,
      // Update legacy fields for backward compatibility
      name: user.username,
      email: user.mail,
      isOnboarded: true
    });
    apiService.setAuthToken(token);
    console.log("logged in", user);
  },
  
  logout: () => {
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false,
      // Reset legacy fields
      name: '',
      email: '',
      isOnboarded: false,
      connectedConnectorName: undefined,
      // Reset Privy fields
      privyUser: null,
      walletAddress: null
    });
    apiService.removeAuthToken();
  },
  
  // Privy-specific actions
  handlePrivyLogin: async (privyUser) => {
    set({ privyUser, isLoading: true });
    
    try {
      // Get the wallet address from Privy user
      const wallet = privyUser.wallet;
      const walletAddress = wallet?.address || null;
      set({ walletAddress });
      
      // Get user email and name from Privy
      const email = privyUser.email?.address || '';
      const name = privyUser.name || email.split('@')[0] || '';
      
      // Check if user exists in our backend
      let response;
      try {
        response = await apiService.getUserByEmail(email);
      } catch (error) {
        // User doesn't exist, create new user
        const publickeyhash = `pk_${walletAddress}_${Date.now()}`;
        
        const userData = {
          username: name,
          mail: email,
          evm_address: walletAddress,
          publickeyhash,
          nft_addresses: {}
        };
        
        response = await apiService.createUser(userData);
      }
      
      if (response.success && response.user) {
        const { login } = get();
        // For existing users, we need to get a token - this might need backend support
        if ('token' in response && response.token) {
          login(response.token, response.user);
        } else {
          // For existing users without token, we'll need to implement a login endpoint
          throw new Error('User exists but authentication token is required. Please implement login endpoint.');
        }
      } else {
        throw new Error(response.message || 'Failed to authenticate user');
      }
    } catch (error) {
      console.error('Privy login failed:', error);
      set({ privyUser: null, walletAddress: null, isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  handlePrivyLogout: () => {
    const { logout } = get();
    logout();
  },
  
  initializeAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ token, isAuthenticated: true });
      apiService.setAuthToken(token);
      
      // Fetch user data to complete authentication
      try {
        const response = await apiService.getUserProfile();
        if (response.success && response.user) {
          set({ 
            user: response.user,
            // Update legacy fields for backward compatibility
            name: response.user.username,
            email: response.user.mail,
            isOnboarded: true
          });
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
          set({ token: null, isAuthenticated: false, user: null });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
        set({ token: null, isAuthenticated: false, user: null });
      }
    }
  },
  
  reset: () => set({ 
    name: '', 
    email: '', 
    isOnboarded: false, 
    connectedConnectorName: undefined,
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    privyUser: null,
    walletAddress: null
  }),
}));


