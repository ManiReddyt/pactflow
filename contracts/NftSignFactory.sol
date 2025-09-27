// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {NftSign} from "./contract-nft.sol"; // Imports NftSign

/**
 * @title NftSignFactory
 * @notice Factory to deploy NftSign contracts. The caller of `deployNftSign` becomes
 *         the owner of the newly deployed contract. A mapping tracks all deployments
 *         by each owner.
 */
contract NftSignFactory {
    // owner => list of deployed contract addresses
    mapping(address => address[]) private _contractsByOwner;

    event NftSignDeployed(address indexed owner, address indexed contractAddress);

    /**
     * @notice Deploy a new NftSign contract.
     * @param _fileName Original file name
     * @param _documentTitle Document title
     * @param _documentDescription Document description
     * @param _intendedSigner Address of the intended signer allowed to call sign()
     * @param _documentContentHash IPFS content hash (CID) for the document
     * @return deployed Address of the deployed NftSign contract
     */
    function deployNftSign(
        string memory _fileName,
        string memory _documentTitle,
        string memory _documentDescription,
        address _intendedSigner,
        string memory _documentContentHash
    ) external returns (address deployed) {
        NftSign instance =
            new NftSign(_fileName, _documentTitle, _documentDescription, _intendedSigner, _documentContentHash);

        // Make the caller the owner of the new contract (factory is temporary owner)
        instance.transferOwnership(msg.sender);

        deployed = address(instance);
        _contractsByOwner[msg.sender].push(deployed);
        emit NftSignDeployed(msg.sender, deployed);
    }

    /**
     * @notice Get all NftSign contracts deployed by a specific owner.
     */
    function getDeployments(address owner) external view returns (address[] memory) {
        return _contractsByOwner[owner];
    }

    /**
     * @notice Convenience helper to get the caller's deployments.
     */
    function getMyDeployments() external view returns (address[] memory) {
        return _contractsByOwner[msg.sender];
    }

    /**
     * @notice Get the number of contracts deployed by an owner.
     */
    function getDeploymentsCount(address owner) external view returns (uint256) {
        return _contractsByOwner[owner].length;
    }
}
