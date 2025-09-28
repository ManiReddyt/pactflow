import { SelfQRcodeWrapper, type SelfApp } from "@selfxyz/qrcode";
import { ErrorBoundary } from "react-error-boundary";
import { useContractStore } from "../store/useContractStore";
import { useAuthStore } from "../store/useAuthStore";
import { BlockchainContractData } from "./ContractDetailPage";
import { UseChatReturn } from "hooks/useChat";

export const Actions = ({
  blockchainData,
  selfApp,
  canSign,
  pdfUrl,
  decryptedBlob,
  chat,
  setIsChatOpen,
}: {
  blockchainData: BlockchainContractData | null;
  selfApp: SelfApp | null;
  canSign: boolean;
  pdfUrl: string | null;
  decryptedBlob: Blob | null;
  chat: UseChatReturn | null;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { currentContract, signContract } = useContractStore();
  const { walletAddress } = useAuthStore();
  const handleSuccessfulVerification = async () => {
    console.log("Successful verification");
    if (!currentContract || !walletAddress) {
      console.error("No current contract or wallet address");
      return;
    }
    console.log("Updating database...");
    await signContract(currentContract.contract_address, walletAddress);
  };
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
      <h2 className="text-lg font-semibold mb-4">Actions</h2>
      <div className="grid gap-3">
        {canSign && !blockchainData?.signed ? (
          <>
            {selfApp ? (
              <ErrorBoundary
                FallbackComponent={function ErrorFallback() {
                  return <></>;
                }}
                onReset={() => {
                  // Optional: Log the error, send to an error tracking service, etc.
                  console.log("Error boundary reset!");
                }}
              >
                <SelfQRcodeWrapper
                  selfApp={selfApp}
                  onSuccess={handleSuccessfulVerification}
                  onError={() => {
                    console.log("QR Code component crashed");
                  }}
                />
              </ErrorBoundary>
            ) : (
              <div className="w-[256px] h-[256px] bg-gray-200 animate-pulse flex items-center justify-center">
                <p className="text-gray-500 text-sm">Loading QR Code...</p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-500 rounded-xl">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {currentContract?.recipients.some(
              (r) => r.address === walletAddress
            )
              ? "Already Signed"
              : "Not a Recipient"}
          </div>
        )}

        {/* Chat with AI Button */}
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
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chat.isLoading ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Starting AI...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
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

        <button className="w-full flex items-center justify-center px-4 py-3 border border-[#e5e7eb] text-[#141e41] rounded-xl hover:bg-[#f4f4f5]">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
          Share Contract
        </button>
      </div>
    </div>
  );
};
