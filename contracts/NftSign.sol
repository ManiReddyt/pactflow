// NftSign.sol
pragma solidity ^0.8.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NftSign is ERC721URIStorage, Ownable {
    string public documentTitle;
    string public fileName;
    string public documentDescription;
    string public documentContentHash;

    address public intendedSigner;
    uint256 tokenId;
    bool public signed = false;

    event DocumentSigned(uint256 indexed tokenId, string signatureContentHash);

    constructor(
        string memory _fileName,
        string memory _documentTitle,
        string memory _documentDescription,
        address _intendedSigner,
        string memory _documentContentHash
    ) ERC721("NftSign", "NS") Ownable(msg.sender) {
        fileName = _fileName;
        documentTitle = _documentTitle;
        documentDescription = _documentDescription;
        documentContentHash = _documentContentHash;

        intendedSigner = _intendedSigner;
    }

    modifier onlyIntendedSigner() {
        _onlyIntendedSigner();
        _;
    }

    function _onlyIntendedSigner() internal view {
        require(intendedSigner == msg.sender, "Only intended signer can call this");
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/";
    }

    function sign(string memory _signatureContentHash) external onlyIntendedSigner {
        // require(signed == false, "Document already signed");
        tokenId += 1;
        signed = true;
        _mint(msg.sender, tokenId); // Mint a new NFT for the signer
        _setTokenURI(tokenId, _signatureContentHash); // Set the NFT's metadata URL (IPFS content hash)
        emit DocumentSigned(tokenId, _signatureContentHash);
    }

    function getDocument() external view returns (string memory) {
        string memory base = _baseURI();

        return string(abi.encodePacked(base, documentContentHash));
    }

    function getSign() external view returns (string memory) {
        require(signed, "Document unsigned");
        return tokenURI(tokenId);
    }
}
