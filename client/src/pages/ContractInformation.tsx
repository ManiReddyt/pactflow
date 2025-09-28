import { useContractStore } from "../store/useContractStore";
import { getBaseScanLink } from "./ContractDetailPage";

export const ContractInformation = () => {
  const { currentContract } = useContractStore();
  if (!currentContract) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
      <h2 className="text-lg font-semibold mb-4">Contract Information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Title
          </label>
          <p className="text-[#141e41] font-medium">{currentContract.title}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Contract Address
          </label>
          <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
            <a
              href={getBaseScanLink(currentContract.contract_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {currentContract.contract_address}
            </a>
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Creator Fingerprint
          </label>
          <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
            {currentContract.fingerprint}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Recipients
          </label>
          <div className="space-y-2">
            {currentContract.recipients.map((recipient, index) => (
              <div key={index} className="bg-[#f4f4f5] p-3 rounded-lg">
                <p className="text-sm font-medium text-[#141e41]">
                  {recipient.mail}
                </p>
                <p className="text-xs text-[#9695a7] font-mono">
                  <a
                    href={getBaseScanLink(recipient.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {recipient.address}
                  </a>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      recipient.is_signed
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {recipient.is_signed ? "Signed" : "Pending"}
                  </span>
                  {recipient.signed_at && (
                    <span className="text-xs text-[#9695a7]">
                      {new Date(recipient.signed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Status
          </label>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentContract.status === "draft"
                ? "bg-gray-100 text-gray-800"
                : currentContract.status === "sent"
                  ? "bg-yellow-100 text-yellow-800"
                  : currentContract.status === "signed"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
            }`}
          >
            {currentContract.status}
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Created
          </label>
          <p className="text-[#141e41]">
            {new Date(currentContract.created_at).toLocaleDateString()}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Last Updated
          </label>
          <p className="text-[#141e41]">
            {new Date(currentContract.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
