import { LogOut, Plus } from "lucide-react";
import blueicon from "./assets/blue.png";
import { useAuthStore } from "./store/useAuthStore";
import { useLocation, useNavigate } from "react-router-dom";
import { usePrivyWallet } from "./hooks/usePrivyWallet";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout: logoutPrivy } = usePrivyWallet();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    try {
      logout();
      logoutPrivy();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center p-4 px-10 rounded-full border border-gray-200 bg-white my-4">
        <div
          className="flex items-center gap-10 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img src={blueicon} alt="Contract Book" className="flex-shrink-0" />
        </div>

        {user?.username && (
          <div className="flex items-center justify-between gap-2 ml-auto">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <img
                src={`https://ui-avatars.com/api/?name=${user?.username}&background=1c01fe&color=fff`}
                alt={user?.username}
                className="h-10 w-10 rounded-full border border-[#e5e7eb] object-cover"
              />
              <span className="font-medium text-[#141e41] text-sm">
                {user?.username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center rounded-full p-2 bg-[#f4f4f5] text-[#141e41] text-sm hover:bg-[#e5e7eb]"
              title="Logout"
            >
              <LogOut size={18} className="text-[#9695a7]" />
            </button>
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto">{children}</div>

      <button
        onClick={() => navigate("/new-contract")}
        className="fixed bottom-6 right-6 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-lg transition-colors duration-200 z-50"
        title="Create New Contract"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};
