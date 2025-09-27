import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import NewContractPage from "./pages/NewContractPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import VestingPage from "./pages/VestingPage";
import { useAuthStore } from "./store/useAuthStore";
import { usePrivy } from "@privy-io/react-auth";
import { Layout } from "./Layout";

function App() {
  const { initializeAuth, handlePrivyLogin, handlePrivyLogout } =
    useAuthStore();
  const { ready, authenticated, user } = usePrivy();
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication on app start
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitializing(false);
    };
    init();
  }, [initializeAuth]);

  // Handle Privy authentication state changes
  useEffect(() => {
    if (!ready) return;

    if (authenticated && user) {
      // User is authenticated with Privy
      handlePrivyLogin(user);
    } else if (!authenticated) {
      // User is not authenticated with Privy
      handlePrivyLogout();
    }
  }, [ready, authenticated, user, handlePrivyLogin, handlePrivyLogout]);

  // Show loading screen while initializing auth
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#e5e7eb] border-t-[#1c01fe] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/new-contract" element={<NewContractPage />} />
        <Route
          path="/contract-detail/:contractAddress"
          element={<ContractDetailPage />}
        />
        <Route path="/profile" element={<ProfilePage />} />
        {/* <Route path="/vesting" element={<VestingPage />} /> */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
