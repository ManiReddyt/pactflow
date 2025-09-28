import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import ChatWindow from "../components/ChatWindow";
import { useAuthStore } from "../store/useAuthStore";
import { useContractStore } from "../store/useContractStore";
import { createPublicClient, http, toBytes, toHex } from "viem";
import { celoSepolia } from "viem/chains";
import { DEPLOYED_CONTRACT_ABI } from "../constants/DeployedContractABI";
import { usePrivyWallet } from "../hooks/usePrivyWallet";
import { decryptFromCid } from "../services/irysLitClient";
import { useChat } from "../hooks/useChat";
import { SelfAppBuilder, type SelfApp, countries } from "@selfxyz/qrcode";

import { BlockChainData } from "./BlockChainData";
import { ContractInformation } from "./ContractInformation";
import { DocPreview } from "./DocPreview";
import { Actions } from "./Actions";
// import { ShowSuccess } from "./ShowSuccess";

export interface BlockchainContractData {
  fileName: string;
  documentTitle: string;
  documentDescription: string;
  intendedSigner: string;
  documentContentHash: string;
  signed: boolean;
  owner: string;
  tokenId: string;
}

export const getBaseScanLink = (address: string) =>
  `https://celo-sepolia.blockscout.com/address/${address}`;

function ContractDetailPage() {
  const { contractAddress } = useParams<{ contractAddress: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { currentContract, fetchContract, signContract, isLoading, error } =
    useContractStore();
  const { walletAddress, signMessage } = usePrivyWallet();

  // State for blockchain contract data
  const [blockchainData, setBlockchainData] =
    useState<BlockchainContractData | null>(null);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);

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
        chain: celoSepolia,
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
        // Only call getBaseScanLink if the owner address doesn't match the current user's address
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

  // Use useMemo to cache the array to avoid creating a new array on each render
  const excludedCountries = useMemo(() => [countries.UNITED_STATES], []);

  // Use useEffect to ensure code only executes on the client side
  useEffect(() => {
    if (!walletAddress || !currentContract || !blockchainData) return;
    const signatureData = {
      cid: blockchainData?.documentContentHash || currentContract.fingerprint,
      timestamp: Date.now(),
      title: currentContract.title,
      owner: blockchainData?.owner || walletAddress,
      recipient: walletAddress,
      contractAddress: contractAddress,
    };
    const signatureContentHash = JSON.stringify(signatureData);
    const bytes = toBytes(signatureContentHash);
    const hex = toHex(bytes).slice(2);

    console.log("userDefinedData :", contractAddress + hex);

    try {
      if (!SelfAppBuilder) {
        throw new Error("SelfAppBuilder is not available");
      }

      const app = new SelfAppBuilder({
        version: 2,
        appName: import.meta.env.VITE_SELF_APP_NAME || "Self Workshop",
        scope: import.meta.env.VITE_SELF_SCOPE || "self-workshop",
        endpoint: `${import.meta.env.VITE_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // url of a png image, base64 is accepted but not recommended
        userId: walletAddress,

        endpointType: "staging_celo",
        userIdType: "hex", // use 'hex' for ethereum address or 'uuid' for uuidv4
        userDefinedData: walletAddress + contractAddress,
        disclosures: {
          // what you want to verify from users' identity
          minimumAge: 18,
          // ofac: true,
          excludedCountries: excludedCountries,
          // what you want users to reveal
          // name: false,
          // issuing_state: true,
          // nationality: true,
          // date_of_birth: true,
          // passport_number: false,
          // gender: true,
          // expiry_date: false,
        },
      }).build();

      setSelfApp(app);
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [
    excludedCountries,
    walletAddress,
    blockchainData?.documentContentHash,
    currentContract,
    blockchainData,
    contractAddress,
  ]);

  // const handleSignContract = async () => {
  //   if (
  //     !currentContract ||
  //     !walletAddress ||
  //     !contractAddress ||
  //     !embeddedWallet
  //   )
  //     return;

  //   setIsSigning(true);
  //   setSigningStep("Preparing signature...");

  //   try {
  //     // Find the recipient that matches the current user's address
  //     const recipient = currentContract.recipients.find(
  //       (r) => r.address === walletAddress
  //     );
  //     if (!recipient) {
  //       console.error("User is not a recipient of this contract");
  //       setSigningStep("Error: Not a recipient");
  //       setIsSigning(false);
  //       return;
  //     }

  //     // Create signature content hash with contract details
  //     setSigningStep("Creating signature data...");
  //     const signatureData = {
  //       cid: blockchainData?.documentContentHash || currentContract.fingerprint,
  //       timestamp: Date.now(),
  //       title: currentContract.title,
  //       owner: blockchainData?.owner || walletAddress,
  //       recipient: walletAddress,
  //       contractAddress: contractAddress,
  //     };

  //     const signatureContentHash = JSON.stringify(signatureData);

  //     console.log("Signing contract with signature:", signatureContentHash);

  //     // Check if embedded wallet is available
  //     if (!embeddedWallet) {
  //       console.error("Embedded wallet not available");
  //       setSigningStep("Error: Wallet not connected");
  //       setIsSigning(false);
  //       return;
  //     }

  //     // Write contract to sign using Privy's sendTransaction
  //     setSigningStep("Submitting transaction...");

  //     const hash = await sendTransaction({
  //       to: contractAddress as `0x${string}`,
  //       data: encodeFunctionData({
  //         abi: DEPLOYED_CONTRACT_ABI,
  //         functionName: "sign",
  //         args: [signatureContentHash],
  //       }),
  //     });

  //     console.log("Contract signed, transaction hash:", hash);

  //     // Wait for transaction to be mined
  //     setSigningStep("Waiting for confirmation...");
  //     const receipt = await publicClient.waitForTransactionReceipt(hash);
  //     console.log("Transaction receipt:", receipt);
  //     await sleep(1000);

  //     // Only call getSign() if the owner address doesn't match the current user's address
  //     let tokenId = "";
  //     if (blockchainData?.owner && blockchainData.owner !== walletAddress) {
  //       setSigningStep("Retrieving NFT...");
  //       try {
  //         tokenId = (await publicClient.readContract({
  //           address: contractAddress as `0x${string}`,
  //           abi: DEPLOYED_CONTRACT_ABI,
  //           functionName: "getSign",
  //         })) as string;
  //         console.log("Received tokenId:", tokenId);
  //       } catch (getSignError) {
  //         console.log("getSign error (expected):", getSignError);
  //         setSigningStep("Skipping NFT retrieval (expected error)...");
  //       }
  //     } else {
  //       console.log(
  //         "Owner address matches current user, skipping getSign call"
  //       );
  //       setSigningStep("Skipping NFT retrieval (owner)...");
  //     }

  //     // Update user's NFT addresses via API
  //     setSigningStep("Updating profile...");
  //     const nftAddresses = {
  //       ...user?.nft_addresses,
  //       [contractAddress]: tokenId,
  //     };
  //     try {
  //       const nftLink = `https://sepolia.basescan.org/address/${contractAddress}`;
  //       const recipientEmail = recipient.mail;

  //       // Send notification to the customer
  //       await fetch("https://email-client.abdulsahil.me/notify-success", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           link: nftLink,
  //           email: recipientEmail,
  //         }),
  //       });
  //       console.log("Success email notification sent to:", recipientEmail);
  //     } catch (err) {
  //       console.error("Failed to send success email notification:", err);
  //     }

  //     try {
  //       await apiService.updateUser({
  //         nft_addresses: nftAddresses,
  //       });

  //       console.log("NFT address updated successfully");

  //       // Update local auth store
  //       if (user) {
  //         setUser({
  //           ...user,
  //           nft_addresses: nftAddresses,
  //         });
  //       }
  //     } catch (updateError) {
  //       console.error("Failed to update NFT address:", updateError);
  //     }

  //     // Update the contract signing status in database
  //     setSigningStep("Updating database...");
  //     await signContract(currentContract.contract_address, recipient.address);

  //     // Refetch contract details to get updated blockchain data
  //     setSigningStep("Refreshing data...");
  //     await getContractDetails();
  //     await fetchContract(contractAddress);

  //     console.log("Contract signing completed successfully");
  //     setSigningStep("Completed successfully!");
  //     setShowSuccess(true);

  //     // Reset signing state after a brief delay
  //     setTimeout(() => {
  //       setIsSigning(false);
  //       setSigningStep("");
  //       setShowSuccess(false);
  //     }, 3000);
  //   } catch (error) {
  //     console.error("Error signing contract:", error);
  //     setSigningStep("Error: Signing failed");
  //     setIsSigning(false);
  //     // Handle error - show user-friendly message
  //   }
  // };

  const canSign =
    currentContract &&
    walletAddress &&
    currentContract.recipients.some(
      (r) => r.address === walletAddress && !r.is_signed
    );

  console.log("blockchainData?.signed :", blockchainData?.signed);
  console.log("canSign :", canSign);
  console.log("selfApp :", selfApp);

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
              {/* {showSuccess && <ShowSuccess />} */}

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
                  <div className="flex flex-col gap-6">
                    <DocPreview
                      pdfUrl={pdfUrl}
                      decryptError={decryptError}
                      handleDecrypt={handleDecrypt}
                      decrypting={decrypting}
                      decryptedBlob={decryptedBlob}
                      chat={chat}
                      setIsChatOpen={setIsChatOpen}
                    />
                    <Actions
                      blockchainData={blockchainData}
                      selfApp={selfApp}
                      canSign={!!canSign}
                      pdfUrl={pdfUrl}
                      decryptedBlob={decryptedBlob}
                      chat={chat}
                      setIsChatOpen={setIsChatOpen}
                    />
                  </div>

                  {/* Contract Details & Actions */}
                  <div className="space-y-6 w-1/2">
                    <ContractInformation />
                    {blockchainData && (
                      <BlockChainData blockchainData={blockchainData} />
                    )}

                    {/* Actions */}
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
