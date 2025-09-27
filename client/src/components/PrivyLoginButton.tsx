import { usePrivy } from '@privy-io/react-auth';
import { useAuthStore } from '../store/useAuthStore';

interface PrivyLoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export const PrivyLoginButton = ({ className = '', children }: PrivyLoginButtonProps) => {
  const { login, ready, authenticated } = usePrivy();
  const { isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!ready || authenticated) return;
    
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (!ready) {
    return (
      <button
        disabled
        className={`rounded-xl px-6 py-3 text-white font-medium bg-gray-400 cursor-not-allowed ${className}`}
      >
        Loading...
      </button>
    );
  }

  if (authenticated) {
    return (
      <button
        disabled
        className={`rounded-xl px-6 py-3 text-white font-medium bg-green-600 cursor-default ${className}`}
      >
        ✓ Connected
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`rounded-xl px-6 py-3 text-white font-medium bg-[#1c01fe] hover:bg-[#1a01e6] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? 'Connecting...' : (children || 'Continue with Email')}
    </button>
  );
};
