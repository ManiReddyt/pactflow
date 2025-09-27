import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivyWallet } from '../hooks/usePrivyWallet';
import { useAuthStore } from '../store/useAuthStore';
import AadhaarExtractor from '../components/AadharExtractor';
import { useAnonAadhaarStore } from '../store/useAnonAadhaarStore';
import { PrivyLoginButton } from '../components/PrivyLoginButton';

type Step = 0 | 1 | 2;

function StepIndicator({ current }: { current: Step }) {
  const steps = ['Connect', 'Aadhaar', 'Complete'];
  return (
    <div className="flex items-center justify-center gf-4">
      {steps.map((label, index) => {
        const active = index <= current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={
                'h-8 w-8 rounded-full grid place-items-center text-sm font-semibold ' +
                (active ? 'bg-[#1c01fe] text-white' : 'bg-gray-200 text-gray-500')
              }
            >
              {index + 1}
            </div>
            <span className={'text-sm ' + (active ? 'text-[#141e41] font-medium' : 'text-gray-400')}>{label}</span>
            {index < steps.length - 1 && (
              <div className={'mx-2 h-[2px] w-8 rounded ' + (active ? 'bg-[#1cdc77]' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  
  const { 
    isAuthenticated, 
    walletAddress, 
    user: privyUser
  } = usePrivyWallet();
  
  const { isAuthenticated: isBackendAuthenticated } = useAuthStore();
  const anonAadhaarProof = useAnonAadhaarStore((state) => state.latestProof);

  // Auto-advance to next step when authenticated
  useEffect(() => {
    if (isAuthenticated && step === 0) {
      setStep(1);
    }
  }, [isAuthenticated, step]);

  // Auto-advance to completion when Aadhaar is verified
  useEffect(() => {
    if (anonAadhaarProof && step === 1) {
      setStep(2);
    }
  }, [anonAadhaarProof, step]);

  // Navigate to dashboard when fully authenticated
  useEffect(() => {
    if (isBackendAuthenticated && step === 2) {
      navigate('/dashboard');
    }
  }, [isBackendAuthenticated, step, navigate]);

  const handleComplete = () => {
    if (isBackendAuthenticated) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-sm text-[#9695a7] hover:text-[#141e41]">Back</button>
          <div className="text-[#141e41] font-semibold">Onboarding</div>
          <div />
        </div>

        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">

          {step === 0 && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#141e41]">Welcome to Contract Book</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Connect your account to get started. We'll create a wallet for you automatically.
              </p>
              <div className="mt-6">
                <PrivyLoginButton className="w-full">
                  Continue with Email
                </PrivyLoginButton>
              </div>
              {isAuthenticated && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-600 text-sm">
                    ✓ Connected! Email: {privyUser?.email?.address}
                  </p>
                  {walletAddress && (
                    <p className="text-green-600 text-xs mt-1">
                      Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-[#141e41]">Aadhaar Verification</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Verify your identity using Anon Aadhaar for secure contract management.
              </p>

              <div className="mt-4">
                <div className="text-sm font-medium text-[#141e41] mb-2">Anon Aadhaar Verification</div>
                <AadhaarExtractor />
              </div>

              {anonAadhaarProof && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-600 text-sm">
                    ✓ Aadhaar verification completed successfully!
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#141e41]">Setup Complete!</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Your account has been created and you're ready to start managing contracts.
              </p>
              
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-600 text-sm">
                    <strong>Email:</strong> {privyUser?.email?.address}
                  </p>
                  {walletAddress && (
                    <p className="text-blue-600 text-sm mt-1">
                      <strong>Wallet Address:</strong> {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  )}
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-600 text-sm">
                    ✓ Aadhaar verification completed
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleComplete}
                  className="rounded-xl px-6 py-3 text-white font-medium bg-[#1c01fe] hover:bg-[#1a01e6]"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => (s > 0 ? ((s - 1) as Step) : s))}
            className="rounded-xl px-4 py-2 border border-[#e5e7eb] text-[#141e41] hover:bg-[#f4f4f5]"
          >
            Back
          </button>
          {step < 2 && (
            <button
              onClick={() => setStep((s) => ((s + 1) as Step))}
              disabled={!isAuthenticated}
              className="rounded-xl px-6 py-2 text-white font-medium bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;


