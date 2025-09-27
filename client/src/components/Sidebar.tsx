import { useNavigate, useLocation } from "react-router-dom";
import blueicon from "../assets/blue.png";
import { FileText, User, Settings, LogOut, Plus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { usePrivyWallet } from "../hooks/usePrivyWallet";

interface SidebarProps {
  className?: string;
}

function Sidebar({ className = "" }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { logout: logoutPrivy } = usePrivyWallet();

  let bgColor = "bg-white";
  if (location.pathname.startsWith("/dashboard")) {
    bgColor = "bg-[#f9fafb]";
  } else if (location.pathname.startsWith("/profile")) {
    bgColor = "bg-[#f0f7ff]";
  } else if (location.pathname.startsWith("/settings")) {
    bgColor = "bg-[#f6f6fa]";
  }

  // Helper to highlight active nav
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
    <aside
      className={`w-64 ${bgColor} border-r border-[#e5e7eb] sticky top-0 left-0 h-screen py-6 px-3 hidden md:flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center gap-3 mb-8 w-full justify-center">
          <img src={blueicon} alt="Contract Book" className="h-full w-full " />
        </div>
        <nav className="space-y-1 ">
          <button
            onClick={() => navigate("/dashboard")}
            className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 hover:bg-[#1C01FE]/10 text-[#141e41] ${isActive("/dashboard") ? "bg-[#1C01FE] text-white font-semibold" : ""}`}
          >
            <FileText
              size={20}
              className={
                isActive("/dashboard") ? "text-white" : "text-[#9695a7]"
              }
            />
            My Contracts
          </button>

          {/* <button 
            onClick={() => navigate('/vesting')}
            className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 hover:bg-[#1C01FE]/10 text-[#141e41] ${isActive('/vesting') ? 'bg-[#1C01FE] text-white font-semibold' : ''}`}
          >
            <FileText size={20} className={isActive('/vesting') ? 'text-white' : 'text-[#9695a7]'} />
            Vesting Page
          </button> */}

          <button
            onClick={() => navigate("/new-contract")}
            className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 hover:bg-[#1C01FE]/10 text-[#141e41] ${isActive("/new-contract") ? "bg-[#1C01FE] text-white font-semibold" : ""}`}
          >
            <Plus
              size={20}
              className={
                isActive("/new-contract") ? "text-white" : "text-[#9695a7]"
              }
            />
            New Contract
          </button>

          <button
            onClick={() => navigate("/profile")}
            className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 hover:bg-[#1C01FE]/10 text-[#141e41] ${isActive("/profile") ? "bg-[#1C01FE] text-white font-semibold" : ""}`}
          >
            <User
              size={20}
              className={isActive("/profile") ? "text-white" : "text-[#9695a7]"}
            />
            Profile
          </button>

          <button
            onClick={() => navigate("/settings")}
            className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2 hover:bg-[#1C01FE]/10 text-[#141e41] ${isActive("/settings") ? "bg-[#1C01FE] text-white font-semibold" : ""}`}
          >
            <Settings
              size={20}
              className={
                isActive("/settings") ? "text-white" : "text-[#9695a7]"
              }
            />
            Settings
          </button>
        </nav>
      </div>
      <div className="mt-8 flex items-center justify-between gap-2 border-t border-[#e5e7eb] pt-5">
        <div className="flex items-center gap-3">
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
          className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 bg-[#f4f4f5] text-[#141e41] text-sm hover:bg-[#e5e7eb]"
          title="Logout"
        >
          <LogOut size={18} className="text-[#9695a7]" />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
