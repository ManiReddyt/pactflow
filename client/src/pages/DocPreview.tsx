import { UseChatReturn } from "../hooks/useChat";
import { useContractStore } from "../store/useContractStore";
import { getBaseScanLink } from "./ContractDetailPage";

export const DocPreview = ({
  pdfUrl,
  decryptError,
  handleDecrypt,
  decrypting,
  decryptedBlob,
  chat,
  setIsChatOpen,
}: {
  pdfUrl: string | null;
  decryptError: string | null;
  handleDecrypt: () => Promise<void>;
  decrypting: boolean;
  decryptedBlob: Blob | null;
  chat: UseChatReturn | null;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { currentContract } = useContractStore();
  if (!currentContract || !chat) return null;

  return (
    <div className="bg-white top-12 w-full rounded-2xl border border-[#e5e7eb] p-6">
      <h2 className="text-lg font-semibold mb-4">Document Preview</h2>
      <div className="border border-[#e5e7eb] rounded-xl p-2 bg-[#f9fafb] min-h-1/2 flex items-center justify-center">
        {pdfUrl ? (
          <iframe
            title="Decrypted PDF"
            src={pdfUrl}
            className="w-full h-[600px] rounded-lg"
          />
        ) : (
          <div className="text-center p-4">
            <svg
              className="w-16 h-16 text-[#9695a7] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-[#141e41] font-medium mb-2">Contract Document</p>
            <p className="text-sm text-[#9695a7] mb-4">
              Encrypted PDF uploaded to IPFS
            </p>
            <p className="text-xs text-[#9695a7] font-mono bg-[#f4f4f5] p-2 rounded mb-4">
              Contract:{" "}
              <a
                href={getBaseScanLink(currentContract.contract_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {currentContract.contract_address}
              </a>
            </p>
            {decryptError && (
              <p className="text-xs text-red-600 mb-2">{decryptError}</p>
            )}
            <button
              onClick={handleDecrypt}
              disabled={decrypting}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${"bg-indigo-600 text-white hover:bg-indigo-700"} ${decrypting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {decrypting ? "Decrypting…" : "Decrypt & Preview"}
            </button>
            {pdfUrl && decryptedBlob && (
              <button
                onClick={async () => {
                  if (!chat.sessionId) {
                    // Use the stored decrypted blob directly
                    try {
                      await chat.startSession(decryptedBlob);
                    } catch (error) {
                      console.error("Failed to start chat session:", error);
                    }
                  }
                  setIsChatOpen(true);
                }}
                disabled={chat.isLoading}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium flex items-center justify-center disabled:opacity-50"
              >
                {chat.isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting AI...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"
                      />
                    </svg>
                    {chat.sessionId ? "Open AI Chat" : "Chat with AI"}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
