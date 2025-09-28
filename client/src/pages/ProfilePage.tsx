import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuthStore } from "../store/useAuthStore";
import { usePrivyWallet } from "../hooks/usePrivyWallet";
import { User, Mail, Wallet, Key, Calendar, LogOut } from "lucide-react";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { walletAddress, isConnected, logout: privyLogout } = usePrivyWallet();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/onboarding");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await privyLogout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen text-[#141e41]">
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Profile Header */}
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User size={32} className="text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-[#141e41]">
                      {user.username}
                    </h1>
                    <p className="text-[#9695a7]">{user.mail}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isConnected
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isConnected
                          ? "Wallet Connected"
                          : "Wallet Disconnected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User size={20} className="text-indigo-600" />
                    Personal Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Username
                      </label>
                      <p className="text-[#141e41] font-medium">
                        {user.username}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Email
                      </label>
                      <p className="text-[#141e41] flex items-center gap-2">
                        <Mail size={16} className="text-[#9695a7]" />
                        {user.mail}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        User ID
                      </label>
                      <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
                        {user.uid}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Member Since
                      </label>
                      <p className="text-[#141e41] flex items-center gap-2">
                        <Calendar size={16} className="text-[#9695a7]" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallet Information */}
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Wallet size={20} className="text-indigo-600" />
                    Wallet Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        EVM Address
                      </label>
                      <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded break-all">
                        {user.evm_address}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Connected Address
                      </label>
                      <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded break-all">
                        {walletAddress || "Not connected"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Public Key Hash
                      </label>
                      <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded break-all">
                        {user.publickeyhash}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Connection Status
                      </label>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isConnected ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <span className="text-sm text-[#141e41]">
                          {isConnected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* NFT Addresses */}
                <div className="bg-white rounded-2xl border overflow-hidden border-[#e5e7eb] p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Key size={20} className="text-indigo-600" />
                    NFT Addresses
                  </h2>
                  {Object.keys(user.nft_addresses).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(user.nft_addresses).map(
                        ([chain, address]) => (
                          <div
                            key={chain}
                            className="bg-[#f4f4f5] p-3 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-[#141e41] capitalize">
                                {chain}
                              </span>
                              <span className="text-xs text-[#9695a7] font-mono">
                                {address}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-[#9695a7] text-sm">
                      No NFT addresses configured
                    </p>
                  )}
                </div>

                {/* Account Statistics */}
                <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-600" />
                    Account Statistics
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Total Contracts
                      </label>
                      <p className="text-2xl font-bold text-[#141e41]">
                        {user.contracts.length}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Account Created
                      </label>
                      <p className="text-[#141e41]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9695a7] mb-1">
                        Last Updated
                      </label>
                      <p className="text-[#141e41]">
                        {new Date(user.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate("/new-contract")}
                  className="flex-1 px-6 py-3 border border-[#e5e7eb] text-[#141e41] rounded-xl hover:bg-[#f4f4f5] font-medium"
                >
                  Create New Contract
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
