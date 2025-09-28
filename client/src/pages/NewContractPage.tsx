import {
  encryptFileWithLit,
  accForSingleAddress,
} from "../services/irysLitClient";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useContractStore } from "../store/useContractStore";
import apiService from "../services/api";
import { encodeFunctionData, createPublicClient, http } from "viem";
import { celoSepolia } from "viem/chains";
import { CONTRACT_ABI } from "../constants/NewContractABI";
import { usePrivyWallet } from "../hooks/usePrivyWallet";

function NewContractPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { createContract, error } = useContractStore();
  const {
    isConnected,
    walletAddress,
    walletClient,
    sendTransaction,
    switchToChain84532,
  } = usePrivyWallet();

  // Contract configuration
  const CONTRACT_ADDRESS =
    "0x5FB367B2189dB79E94B3AA4aCAfFD8c7406632b9" as const;

  // Create public client for reading transaction receipts
  const publicClient = createPublicClient({
    chain: celoSepolia,
    transport: http(),
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    recipientEmail: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileError(null);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    switchToChain84532().then(() => {
      console.log("wallet switched");
    });
  }, [switchToChain84532]);

  // Check authentication and wallet connection
  if (!isAuthenticated || !user) {
    navigate("/onboarding");
    return null;
  }

  if (!isConnected || !walletAddress) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 max-w-md w-full mx-4 text-center">
          <h3 className="text-lg font-semibold text-[#141e41] mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-sm text-[#6b7280] mb-4">
            Please connect your wallet to create a contract.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractError(null);

    // Validation
    if (!file) {
      setFileError("Please select a PDF file to upload.");
      fileInputRef.current?.focus();
      return;
    }

    if (!formData.title.trim()) {
      setContractError("Please enter a contract title.");
      return;
    }

    // if (!formData.recipientAddress.trim()) {
    //   setContractError("Please enter recipient address.");
    //   return;
    // }

    if (!formData.recipientEmail.trim()) {
      setContractError("Please enter recipient email.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress while encrypting and uploading to Irys
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 5;
        });
      }, 200);

      const { user } = await apiService.getUserByEmail(formData.recipientEmail);
      const recipientAddress = user.evm_address;

      console.log("🚀 Starting contract creation process");
      console.log("📋 Form data:", formData);
      console.log("📄 Selected file:", file.name, file.size, "bytes");

      // Encrypt file with Lit (no wallet required for encryption)
      const acc = accForSingleAddress(recipientAddress);
      console.log(
        "🔑 Generated access control conditions for:",
        recipientAddress
      );

      const { ciphertext, dataToEncryptHash } = await encryptFileWithLit(
        file,
        acc
      );

      console.log("📤 Uploading encrypted file to IPFS...");

      // Create encrypted payload
      const encryptedPayload = {
        cipherText: ciphertext,
        dataToEncryptHash,
        accessControlConditions: acc,
        fileName: file.name,
        contentType: file.type,
      };

      // Convert to file and upload to IPFS
      const payloadBlob = new Blob([JSON.stringify(encryptedPayload)], {
        type: "application/json",
      });
      const payloadFile = new File(
        [payloadBlob],
        `${file.name}.encrypted.json`,
        {
          type: "application/json",
        }
      );

      // Upload to IPFS using existing endpoint
      const response = await apiService.uploadFile(payloadFile);

      console.log("✅ File successfully encrypted and uploaded to IPFS!");
      console.log("🆔 IPFS CID for on-chain storage:", response.cid.cid);
      console.log("🌐 IPFS Gateway URL:", response.gatewayUrl);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Use IPFS CID as on-chain document reference
      const documentContentHash = response.cid.cid;

      console.log("=== CONTRACT DEPLOYMENT DATA ===");
      console.log("Contract Address:", CONTRACT_ADDRESS);
      console.log("File Name:", file.name);
      console.log("Document Title:", formData.title);
      console.log("Document Description:", formData.description);
      console.log("Intended Signer:", recipientAddress);
      console.log("Document Content Hash:", documentContentHash);
      console.log("IPFS Gateway URL:", response.gatewayUrl);
      console.log("================================");

      // Call the smart contract deployNftSign function using viem
      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      const deployNftSignData = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: "deployNftSign",
        args: [
          file.name, // _fileName
          formData.title, // _documentTitle
          formData.description, // _documentDescription
          recipientAddress as `0x${string}`, // _intendedSigner
          documentContentHash, // _documentContentHash
        ],
      });

      console.log("=== VIEM TRANSACTION DATA ===");
      console.log("Encoded Function Data:", deployNftSignData);
      console.log("==============================");

      // Send transaction
      const hash = await sendTransaction({
        to: CONTRACT_ADDRESS,
        data: deployNftSignData,
        value: 0n, // No ETH value needed
      });

      console.log("=== TRANSACTION RESULT ===");
      console.log("Transaction Hash:", hash);
      console.log("==========================");

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt(hash);

      console.log("=== TRANSACTION RECEIPT ===");
      console.log("Receipt:", receipt);
      console.log("============================");

      // Extract the deployed contract address from the event
      let deployedContractAddress = "";
      if (receipt.logs && receipt.logs.length > 2) {
        const log = receipt.logs[2];
        if (log.topics && log.topics.length > 2) {
          const topicValue = log.topics[2];
          if (typeof topicValue === "string" && topicValue.length >= 40) {
            deployedContractAddress = "0x" + topicValue.slice(-40);
            console.log(
              "Extracted deployed contract address:",
              deployedContractAddress
            );
          }
        }
      }

      // Generate fingerprint for the creator (user's fingerprint)
      const creatorFingerprint = `creator_${user.uid}_${Date.now()}`;

      // Generate fingerprint for recipient (will be updated when they sign)
      const recipientFingerprint = `recipient_${recipientAddress}_${Date.now()}`;

      // Create contract data
      const contractData = {
        contract_address:
          deployedContractAddress ||
          `0x${Math.random().toString(16).substr(2, 40)}`,
        title: formData.title,
        fingerprint: creatorFingerprint,
        recipients: [
          {
            address: recipientAddress,
            mail: formData.recipientEmail,
            fingerprint: recipientFingerprint,
          },
        ],
      };

      console.log("=== FINAL CONTRACT DATA ===");
      console.log("Contract Data:", contractData);
      console.log("===========================");

      // Create contract via API
      const createdContract = await createContract(contractData);

      if (createdContract) {
        // Navigate to contract detail page
        navigate(`/contract-detail/${createdContract.contract_address}`);
      } else {
        setContractError(error || "Failed to create contract");
      }
    } catch (error) {
      console.error("Contract creation failed:", error);
      setContractError(
        error instanceof Error ? error.message : "Failed to create contract"
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isUploading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-[#e5e7eb] border-t-[#1c01fe] animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-[#141e41] mb-2">
              Uploading Contract
            </h3>
            <p className="text-sm text-[#6b7280] mb-4">
              Please wait while we encrypt and upload your contract to IPFS...
            </p>
            <div className="w-full bg-[#e5e7eb] rounded-full h-2">
              <div
                className="bg-[#1c01fe] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#9695a7] mt-2">
              {uploadProgress}% complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[#141e41]">
      <div className="flex">
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto">
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
                <h1 className="text-2xl font-semibold mb-6">
                  Create New Contract
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div>
                    <label className="block text-sm font-medium text-[#141e41] mb-2">
                      Contract Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#1c01fe]"
                      placeholder="Enter contract title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#141e41] mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#1c01fe]"
                      placeholder="Describe the contract details"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* <div>
                      <label className="block text-sm font-medium text-[#141e41] mb-2">
                        Recipient Address
                      </label>
                      <input
                        type="text"
                        name="recipientAddress"
                        value={formData.recipientAddress}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#1c01fe]"
                        placeholder="0x..."
                      />
                    </div> */}

                    <div>
                      <label className="block text-sm font-medium text-[#141e41] mb-2">
                        Recipient Email
                      </label>
                      <input
                        type="email"
                        name="recipientEmail"
                        value={formData.recipientEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#1c01fe]"
                        placeholder="recipient@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#141e41] mb-2">
                      Contract Document (PDF)
                    </label>
                    <div className="border-2 border-dashed border-[#e5e7eb] rounded-xl p-6 text-center hover:border-[#1c01fe] transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="contract-file"
                        ref={fileInputRef}
                        // Remove required attribute to avoid browser validation error
                        // required
                        name="contractFile"
                        tabIndex={-1}
                        aria-required="true"
                      />
                      <label htmlFor="contract-file" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                          <svg
                            className="w-12 h-12 text-[#9695a7] mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-sm text-[#141e41] font-medium">
                            {file ? file.name : "Click to upload PDF"}
                          </p>
                          <p className="text-xs text-[#9695a7] mt-1">
                            {file
                              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                              : "PDF files only"}
                          </p>
                        </div>
                      </label>
                      {fileError && (
                        <p className="text-xs text-red-600 mt-2">{fileError}</p>
                      )}
                    </div>
                  </div>

                  {/* Error Display */}
                  {(contractError || error) && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-600 text-sm">
                        {contractError || error}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      className="px-6 py-3 rounded-xl border border-[#e5e7eb] text-[#141e41] hover:bg-[#f4f4f5]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                    >
                      Upload & Continue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default NewContractPage;
