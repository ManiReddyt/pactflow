import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useAuthStore } from "../store/useAuthStore";
import apiService from "../services/api";
import { useContractStore } from "../store/useContractStore";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import { DEPLOYED_CONTRACT_ABI } from "../constants/DeployedContractABI";
import { sleep } from "@gardenfi/utils";
import { usePrivyWallet } from "../hooks/usePrivyWallet";
import { decryptFromCid } from "../services/irysLitClient";
import { useChat } from "../hooks/useChat";

interface BlockchainContractData {
  fileName: string;
  documentTitle: string;
  documentDescription: string;
  intendedSigner: string;
  documentContentHash: string;
  signed: boolean;
  owner: string;
  tokenId: string;
}

const getBaseScanLink = (address: string) =>
  `https://sepolia.basescan.org/address/${address}`;

function ContractDetailPage() {
  const { contractAddress } = useParams<{ contractAddress: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { currentContract, fetchContract, signContract, isLoading, error } =
    useContractStore();
  const { walletAddress, sendTransaction, embeddedWallet, signMessage } =
    usePrivyWallet();
  const { setUser } = useAuthStore();

  // State for blockchain contract data
  const [blockchainData, setBlockchainData] =
    useState<BlockchainContractData | null>(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);

  // State for signing process
  const [isSigning, setIsSigning] = useState(false);
  const [signingStep, setSigningStep] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chat = useChat({
    onSessionEnd: () => {
      console.log("Chat session ended");
    },
  });

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    []
  );

  const handleDecrypt = async () => {
    if (!walletAddress || !blockchainData?.documentContentHash) return;
    setDecryptError(null);
    setDecrypting(true);
    try {
      const signFn = async (message: string): Promise<string> => {
        if (!signMessage) {
          throw new Error("No signMessage function available from Privy");
        }
        const signature = await signMessage({ message: message });
        return signature.signature;
      };

      const { bytes, contentType } = await decryptFromCid(
        blockchainData.documentContentHash,
        walletAddress,
        signFn
      );

      const type = contentType || "application/pdf";
      const slice = bytes.subarray(0).buffer;
      const blob = new Blob([slice as ArrayBuffer], { type });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setDecryptedBlob(blob); // Store the decrypted blob for reuse

      // Automatically start AI chat session with the decrypted document
      try {
        await chat.startSession(blob);
        setIsChatOpen(true);
        console.log("AI chat session started with decrypted document");
      } catch (chatError) {
        console.error("Failed to start AI chat session:", chatError);
        // Don't throw - PDF decryption was successful
      }
    } catch (e) {
      setDecryptError(
        e instanceof Error ? e.message : "Failed to decrypt document"
      );
    } finally {
      setDecrypting(false);
    }
  };

  const getContractDetails = useCallback(async () => {
    if (!contractAddress) {
      console.error("No contract address provided");
      return;
    }

    setBlockchainLoading(true);
    setBlockchainError(null);

    try {
      const [
        fileName,
        documentTitle,
        documentDescription,
        intendedSigner,
        documentContentHash,
        signed,
        owner,
        tokenId,
      ] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "fileName",
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "documentTitle",
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "documentDescription",
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "intendedSigner",
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "documentContentHash",
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "signed",
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "owner",
        }),
        // Only call getSign if the owner address doesn't match the current user's address
        // ...(walletAddress
        //   ? [
        //       publicClient.readContract({
        //         address: contractAddress as `0x${string}`,
        //         abi: DEPLOYED_CONTRACT_ABI,
        //         functionName: "getSign",
        //       }),
        //     ]
        //   :
        "",
      ]);

      // Save all blockchain data in state
      const contractData: BlockchainContractData = {
        fileName: fileName as string,
        documentTitle: documentTitle as string,
        documentDescription: documentDescription as string,
        intendedSigner: intendedSigner as string,
        documentContentHash: documentContentHash as string,
        signed: signed as boolean,
        owner: owner as string,
        tokenId: tokenId as string,
      };

      setBlockchainData(contractData);
    } catch (err) {
      console.error("Error reading contract details:", err);
      // Only show error if it's not related to getSign function
      if (err instanceof Error && !err.message.includes("getSign")) {
        setBlockchainError(err.message);
      }
    } finally {
      setBlockchainLoading(false);
    }
  }, [contractAddress, publicClient]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/onboarding");
      return;
    }

    if (contractAddress) {
      fetchContract(contractAddress);
      getContractDetails();
    } else {
      navigate("/dashboard");
    }
  }, [
    isAuthenticated,
    user,
    navigate,
    contractAddress,
    fetchContract,
    getContractDetails,
  ]);

  const handleSignContract = async () => {
    if (
      !currentContract ||
      !walletAddress ||
      !contractAddress ||
      !embeddedWallet
    )
      return;

    setIsSigning(true);
    setSigningStep("Preparing signature...");

    try {
      // Find the recipient that matches the current user's address
      const recipient = currentContract.recipients.find(
        (r) => r.address === walletAddress
      );
      if (!recipient) {
        console.error("User is not a recipient of this contract");
        setSigningStep("Error: Not a recipient");
        setIsSigning(false);
        return;
      }

      // Create signature content hash with contract details
      setSigningStep("Creating signature data...");
      const signatureData = {
        cid: blockchainData?.documentContentHash || currentContract.fingerprint,
        timestamp: Date.now(),
        title: currentContract.title,
        owner: blockchainData?.owner || walletAddress,
        recipient: walletAddress,
        contractAddress: contractAddress,
      };

      const signatureContentHash = JSON.stringify(signatureData);

      console.log("Signing contract with signature:", signatureContentHash);

      // Check if embedded wallet is available
      if (!embeddedWallet) {
        console.error("Embedded wallet not available");
        setSigningStep("Error: Wallet not connected");
        setIsSigning(false);
        return;
      }

      // Write contract to sign using Privy's sendTransaction
      setSigningStep("Submitting transaction...");

      const hash = await sendTransaction({
        to: contractAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: DEPLOYED_CONTRACT_ABI,
          functionName: "sign",
          args: [signatureContentHash],
        }),
      });

      console.log("Contract signed, transaction hash:", hash);

      // Wait for transaction to be mined
      setSigningStep("Waiting for confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt(hash);
      console.log("Transaction receipt:", receipt);
      await sleep(1000);

      // Only call getSign() if the owner address doesn't match the current user's address
      let tokenId = "";
      if (blockchainData?.owner && blockchainData.owner !== walletAddress) {
        setSigningStep("Retrieving NFT...");
        try {
          tokenId = (await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: DEPLOYED_CONTRACT_ABI,
            functionName: "getSign",
          })) as string;
          console.log("Received tokenId:", tokenId);
        } catch (getSignError) {
          console.log("getSign error (expected):", getSignError);
          setSigningStep("Skipping NFT retrieval (expected error)...");
        }
      } else {
        console.log(
          "Owner address matches current user, skipping getSign call"
        );
        setSigningStep("Skipping NFT retrieval (owner)...");
      }

      // Update user's NFT addresses via API
      setSigningStep("Updating profile...");
      const nftAddresses = {
        ...user?.nft_addresses,
        [contractAddress]: tokenId,
      };
      try {
        const nftLink = `https://sepolia.basescan.org/address/${contractAddress}`;
        const recipientEmail = recipient.mail;

        // Send notification to the customer
        await fetch("https://email-client.abdulsahil.me/notify-success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            link: nftLink,
            email: recipientEmail,
          }),
        });
        console.log("Success email notification sent to:", recipientEmail);
      } catch (err) {
        console.error("Failed to send success email notification:", err);
      }

      try {
        await apiService.updateUser({
          nft_addresses: nftAddresses,
        });

        console.log("NFT address updated successfully");

        // Update local auth store
        if (user) {
          setUser({
            ...user,
            nft_addresses: nftAddresses,
          });
        }
      } catch (updateError) {
        console.error("Failed to update NFT address:", updateError);
      }

      // Update the contract signing status in database
      setSigningStep("Updating database...");
      await signContract(currentContract.contract_address, recipient.address);

      // Refetch contract details to get updated blockchain data
      setSigningStep("Refreshing data...");
      await getContractDetails();
      await fetchContract(contractAddress);

      console.log("Contract signing completed successfully");
      setSigningStep("Completed successfully!");
      setShowSuccess(true);

      // Reset signing state after a brief delay
      setTimeout(() => {
        setIsSigning(false);
        setSigningStep("");
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error signing contract:", error);
      setSigningStep("Error: Signing failed");
      setIsSigning(false);
      // Handle error - show user-friendly message
    }
  };

  const canSign =
    currentContract &&
    walletAddress &&
    currentContract.recipients.some(
      (r) => r.address === walletAddress && !r.is_signed
    );

  if (!contractAddress) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="text-[#141e41]">
      <div className="flex ">
        <div className="flex-1 flex flex-col ">
          <main className="flex-1 p-4 sm:p-6">
            <div className="">
              {(isLoading || blockchainLoading) && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#e5e7eb] border-t-[#1c01fe] rounded-full animate-spin"></div>
                  <span className="ml-3 text-[#6b7280]">
                    {isLoading
                      ? "Loading contract..."
                      : blockchainLoading
                        ? "Loading blockchain data..."
                        : "Processing..."}
                  </span>
                </div>
              )}

              {/* Success State */}
              {showSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2"
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
                    <p className="text-green-600 text-sm font-medium">
                      Contract signed successfully! NFT minted and added to your
                      profile.
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {(error || blockchainError) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-600 text-sm">
                    {error || blockchainError}
                  </p>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}

              {/* Contract Content */}
              {!isLoading && currentContract && (
                <div className="flex w-full items-start gap-6">
                  {/* PDF Preview Section */}
                  <div className="bg-white sticky top-12 w-1/2 rounded-2xl border border-[#e5e7eb] p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      Document Preview
                    </h2>
                    <div className="border border-[#e5e7eb] rounded-xl p-2 bg-[#f9fafb] min-h-[600px] flex items-center justify-center">
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
                          <p className="text-[#141e41] font-medium mb-2">
                            Contract Document
                          </p>
                          <p className="text-sm text-[#9695a7] mb-4">
                            Encrypted PDF uploaded to IPFS
                          </p>
                          <p className="text-xs text-[#9695a7] font-mono bg-[#f4f4f5] p-2 rounded mb-4">
                            Contract:{" "}
                            <a
                              href={getBaseScanLink(
                                currentContract.contract_address
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {currentContract.contract_address}
                            </a>
                          </p>
                          {decryptError && (
                            <p className="text-xs text-red-600 mb-2">
                              {decryptError}
                            </p>
                          )}
                          <button
                            onClick={handleDecrypt}
                            disabled={decrypting}
                            className={`px-4 py-2 rounded-xl text-sm font-medium ${true ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-200 text-gray-500"} ${decrypting ? "opacity-50 cursor-not-allowed" : ""}`}
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
                                    console.error(
                                      "Failed to start chat session:",
                                      error
                                    );
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
                                  {chat.sessionId
                                    ? "Open AI Chat"
                                    : "Chat with AI"}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contract Details & Actions */}
                  <div className="space-y-6 w-1/2">
                    {/* Contract Info */}
                    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                      <h2 className="text-lg font-semibold mb-4">
                        Contract Information
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#9695a7]">
                            Title
                          </label>
                          <p className="text-[#141e41] font-medium">
                            {currentContract.title}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#9695a7]">
                            Contract Address
                          </label>
                          <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
                            <a
                              href={getBaseScanLink(
                                currentContract.contract_address
                              )}
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
                            {currentContract.recipients.map(
                              (recipient, index) => (
                                <div
                                  key={index}
                                  className="bg-[#f4f4f5] p-3 rounded-lg"
                                >
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
                                      {recipient.is_signed
                                        ? "Signed"
                                        : "Pending"}
                                    </span>
                                    {recipient.signed_at && (
                                      <span className="text-xs text-[#9695a7]">
                                        {new Date(
                                          recipient.signed_at
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
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
                            {new Date(
                              currentContract.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#9695a7]">
                            Last Updated
                          </label>
                          <p className="text-[#141e41]">
                            {new Date(
                              currentContract.updated_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Blockchain Contract Data */}
                    {blockchainData && (
                      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                        <h2 className="text-lg font-semibold mb-4">
                          Blockchain Data
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              File Name (On-Chain)
                            </label>
                            <p className="text-[#141e41] font-medium">
                              {blockchainData.fileName}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              Document Title (On-Chain)
                            </label>
                            <p className="text-[#141e41] font-medium">
                              {blockchainData.documentTitle}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              Document Description (On-Chain)
                            </label>
                            <p className="text-[#141e41]">
                              {blockchainData.documentDescription}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              Intended Signer (On-Chain)
                            </label>
                            <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
                              <a
                                href={getBaseScanLink(
                                  blockchainData.intendedSigner
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {blockchainData.intendedSigner}
                              </a>
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              Document Content Hash
                            </label>
                            <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
                              <a
                                href={`https://ipfs.io/ipfs/${blockchainData.documentContentHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {blockchainData.documentContentHash}
                              </a>
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              Signed (On-Chain)
                            </label>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                blockchainData.signed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {blockchainData.signed ? "Signed" : "Not Signed"}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              Owner (On-Chain)
                            </label>
                            <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
                              <a
                                href={getBaseScanLink(blockchainData.owner)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {blockchainData.owner}
                              </a>
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9695a7]">
                              Token ID (On-Chain)
                            </label>
                            <p className="text-xs overflow-x-scroll text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
                              {blockchainData.tokenId}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                      <h2 className="text-lg font-semibold mb-4">Actions</h2>
                      <div className="grid gap-3">
                        {canSign && !blockchainData?.signed ? (
                          <button
                            onClick={handleSignContract}
                            disabled={isLoading || isSigning}
                            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSigning ? (
                              <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            )}
                            {isSigning ? signingStep : "Sign Contract"}
                          </button>
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
                            {currentContract.recipients.some(
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
                                  console.error(
                                    "Failed to start chat session:",
                                    error
                                  );
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
                                {chat.sessionId
                                  ? "Open AI Chat"
                                  : "Chat with AI"}
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
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Chat Window */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          chat.endSession();
        }}
        sessionId={chat.sessionId || undefined}
        isLoading={chat.isLoading}
        error={chat.error}
        messages={chat.messages}
        onSendMessage={chat.sendMessage}
        isSendingMessage={chat.isSendingMessage}
      />
    </div>
  );
}

export default ContractDetailPage;
