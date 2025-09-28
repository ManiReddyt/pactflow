import { BlockchainContractData, getBaseScanLink } from "./ContractDetailPage";

export const BlockChainData = ({
  blockchainData,
}: {
  blockchainData: BlockchainContractData;
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6">
      <h2 className="text-lg font-semibold mb-4">Blockchain Data</h2>
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
          <p className="text-[#141e41]">{blockchainData.documentDescription}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#9695a7]">
            Intended Signer (On-Chain)
          </label>
          <p className="text-xs text-[#141e41] font-mono bg-[#f4f4f5] p-2 rounded">
            <a
              href={getBaseScanLink(blockchainData.intendedSigner)}
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
  );
};
