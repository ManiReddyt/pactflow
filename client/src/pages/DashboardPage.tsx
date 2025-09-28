import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  FileText,
  Inbox,
  PenLine,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useContractStore } from "../store/useContractStore";

function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    contracts,
    receivedContracts,
    fetchContracts,
    fetchReceivedContracts,
    isLoading,
    error,
  } = useContractStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Defensive: Ensure contracts and receivedContracts are always arrays
  const safeContracts = Array.isArray(contracts) ? contracts : [];
  const safeReceivedContracts = Array.isArray(receivedContracts)
    ? receivedContracts
    : [];

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/onboarding");
      return;
    }

    // Fetch contracts when component mounts
    fetchContracts();
    fetchReceivedContracts();
  }, [isAuthenticated, user, navigate, fetchContracts, fetchReceivedContracts]);

  // // Debug logging for contracts data (can be removed in production)
  // useEffect(() => {
  //   if (safeContracts.length > 0) {
  //     // console.log('Contracts loaded:', safeContracts.length);
  //   }
  // }, [safeContracts]);

  // useEffect(() => {
  //   if (safeReceivedContracts.length > 0) {
  //     // console.log('Received contracts loaded:', safeReceivedContracts.length);
  //   }
  // }, [safeReceivedContracts]);

  // Helper function to safely format dates
  const formatDate = (date: any): string => {
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid Date";
      }
      return dateObj.toISOString().split("T")[0];
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Transform contracts to include type information and filter
  const transformedContracts = [
    // Received contracts (where user is recipient)
    ...safeReceivedContracts.map((contract) => ({
      ...contract,
      type: "received" as const,
      // Add computed fields for display
      createdDate: formatDate(contract?.created_at),
      lastUpdated: formatDate(contract?.updated_at),
      parties: [
        contract?.creator_uid ?? "",
        ...(Array.isArray(contract?.recipients)
          ? contract.recipients.map((r: any) => r?.mail ?? "")
          : []),
      ],
    })),
    // Issued contracts (created by user)
    ...safeContracts.map((contract) => ({
      ...contract,
      type: "issued" as const,
      // Add computed fields for display
      createdDate: formatDate(contract?.created_at),
      lastUpdated: formatDate(contract?.updated_at),
      parties: [
        user?.username || "You",
        ...(Array.isArray(contract?.recipients)
          ? contract.recipients.map((r: any) => r?.mail ?? "")
          : []),
      ],
    })),
  ];

  const filteredContracts = transformedContracts.filter((contract) => {
    const matchesSearch =
      typeof contract.title === "string"
        ? contract.title.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
    // const matchesTab = contract.type === activeTab;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      case "signed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate statistics from real contract data
  const stats = {
    total: safeContracts.length + safeReceivedContracts.length,
    pending:
      safeContracts.filter((c) => c?.status === "sent").length +
      safeReceivedContracts.filter((c) => c?.status === "sent").length,
    signed:
      safeContracts.filter((c) => c?.status === "signed").length +
      safeReceivedContracts.filter((c) => c?.status === "signed").length,
    received: safeReceivedContracts.length,
  };

  // Dummy sort and download handlers
  const handleSort = () => {
    // Implement sort logic here
    alert("Sort functionality not implemented");
  };

  return (
    <div className="text-[#141e41]">
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              {/* Overall Contracts */}
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-md text-[#141e41]">Overall</div>
                  <div className="mt-1 text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-indigo-100 text-indigo-600 rounded-xl p-3">
                  <FileText size={28} />
                </div>
              </div>
              {/* Pending  */}
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-md text-[#141e41]">Pending</div>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </div>
                <div className="bg-yellow-100 text-yellow-600 rounded-xl p-3">
                  <Clock size={28} />
                </div>
              </div>
              {/* Signed  */}
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-md text-[#141e41]">Signed </div>
                  <div className="mt-1 text-2xl font-bold">{stats.signed}</div>
                </div>
                <div className="bg-blue-100 text-blue-600 rounded-xl p-3">
                  <PenLine size={28} />
                </div>
              </div>
              {/* Received  */}
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-md text-[#141e41]">Received</div>
                  <div className="mt-1 text-2xl font-bold">
                    {stats.received}
                  </div>
                </div>
                <div className="bg-green-100 text-green-600 rounded-xl p-3">
                  <Inbox size={28} />
                </div>
              </div>
            </div>

            {/* Contracts Section */}
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">My Contracts</h2>
                <div className="flex items-center gap-2">
                  <div className="relative w-30">
                    <input
                      type="text"
                      placeholder="Search contracts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 py-2 border border-[#e5e7eb] rounded-xl focus:ring-2 focus:ring-[#dfdee2] focus:border-transparent outline-none"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9695a7]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <button
                    onClick={handleSort}
                    className="rounded-xl px-4 py-3 border border-[#e5e7eb] bg-white text-[#141e41] font-medium hover:bg-[#f4f4f5] text-sm flex items-center"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 7h18M6 12h12M9 17h6"
                      />
                    </svg>
                  </button>
                  <button
                    className="rounded-xl px-4 py-2 border border-[#e5e7eb] bg-white text-[#141e41] font-medium hover:bg-[#f4f4f5] text-sm flex items-center"
                    onClick={() => navigate("/new-contract")}
                  >
                    <Plus size={20} />
                    New Contract
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#e5e7eb] border-t-[#1c01fe] rounded-full animate-spin"></div>
                  <span className="ml-3 text-[#6b7280]">
                    Loading contracts...
                  </span>
                </div>
              )}

              {/* Contracts List */}
              {!isLoading && (
                <div className="grid grid-cols-2 gap-4">
                  {paginatedContracts.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-[#6b7280]">No contracts found.</p>
                      <p className="text-sm text-[#9695a7] mt-2">
                        Use the "New Contract" button to create your first
                        contract.
                      </p>
                    </div>
                  ) : (
                    paginatedContracts.map((contract) => (
                      <div
                        key={contract.contract_address}
                        className="rounded-xl border border-[#e5e7eb] p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/contract-detail/${contract.contract_address}`
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex p-2 rounded-lg bg-[#f4f4f5]">
                                {contract.type === "received" ? (
                                  <ArrowDownLeft />
                                ) : (
                                  <ArrowUpRight />
                                )}
                              </div>
                              <h3 className="font-medium text-[#141e41]">
                                {contract.title}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  contract.status
                                )}`}
                              >
                                {contract.status}
                              </span>
                            </div>
                            <div className="text-sm text-[#9695a7]">
                              Parties:{" "}
                              {Array.isArray(contract.parties)
                                ? contract.parties.join(", ")
                                : ""}{" "}
                            </div>
                            <div className="ml-auto text-sm text-[#9695a7] text-right">
                              Last updated: {contract.lastUpdated}
                            </div>
                          </div>
                          {/* <button
                            onClick={() =>
                              navigate(
                                `/contract-detail/${contract.contract_address}`
                              )
                            }
                            className="rounded-lg border border-[#e5e7eb] px-3 py-2 hover:bg-[#f4f4f5] text-sm"
                          >
                            Open
                          </button> */}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-[#9695a7]">
                    Showing {startIndex + 1} to{" "}
                    {Math.max(
                      startIndex + itemsPerPage,
                      filteredContracts.length
                    )}{" "}
                    of {filteredContracts.length} contracts
                  </div>
                  {/* <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f4f4f5]"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-[#141e41]">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-[#e5e7eb] rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f4f4f5]"
                    >
                      Next
                    </button>
                  </div> */}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
