// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {SelfUtils} from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {NftSign} from "./NftSign.sol";

/**
 * @title TestSelfVerificationRoot
 * @notice Test implementation of SelfVerificationRoot for testing purposes
 * @dev This contract provides a concrete implementation of the abstract SelfVerificationRoot
 */
contract ProofOfHuman is SelfVerificationRoot {
    // Storage for testing purposes
    SelfStructs.VerificationConfigV2 public verificationConfig;
    bytes32 public verificationConfigId;

    // Events for testing
    event VerificationCompleted(address nftSignContract);

    /**
     * @notice Constructor for the test contract
     * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
     */
    constructor(
        address identityVerificationHubV2Address,
        string memory scope,
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    ) SelfVerificationRoot(identityVerificationHubV2Address, scope) {
        verificationConfig = SelfUtils.formatVerificationConfigV2(_verificationConfig);
        verificationConfigId =
            IIdentityVerificationHubV2(identityVerificationHubV2Address).setVerificationConfigV2(verificationConfig);
    }

    /**
     * @notice Implementation of customVerificationHook for testing
     * @dev This function is called by onVerificationSuccess after hub address validation
     * @param output The verification output from the hub
     * @param userData The user data passed through verification
     */
    function customVerificationHook(ISelfVerificationRoot.GenericDiscloseOutputV2 memory output, bytes memory userData)
        internal
        override
    {
        require(userData.length >= 84, "Invalid userData: need at least 2 addresses (84 chars)");

        // Extract first address (signer) - first 42 hex characters
        bytes memory signerBytes = new bytes(42);
        for (uint256 i = 0; i < 42; i++) {
            signerBytes[i] = userData[i];
        }
        address signer = hexStringToAddressOptimized(signerBytes);

        // Extract second address (nftContract) - next 42 hex characters
        bytes memory nftContractBytes = new bytes(42);
        for (uint256 i = 42; i < 84; i++) {
            nftContractBytes[i - 42] = userData[i];
        }
        address nftSignContract = hexStringToAddressOptimized(nftContractBytes);

        // Extract dynamic bytes (remaining data after both addresses)
        string memory signatureContentHash;
        if (userData.length > 84) {
            bytes memory signatureBytes = new bytes(userData.length - 84);
            for (uint256 i = 84; i < userData.length; i++) {
                signatureBytes[i - 84] = userData[i];
            }
            signatureContentHash = string(signatureBytes);
        } else {
            signatureContentHash = "";
        }

        // Call the sign method on the NftSign contract
        NftSign(nftSignContract).sign(signatureContentHash, signer, output.nullifier);
        emit VerificationCompleted(nftSignContract);
    }

    function setConfigId(bytes32 configId) external {
        verificationConfigId = configId;
    }

    function hexStringToAddressOptimized(bytes memory userData) internal pure returns (address) {
        require(userData.length >= 42, "Invalid hex string length");

        uint256 offset = 0;
        // Check for "0x" prefix
        if (userData.length >= 2 && userData[0] == 0x30 && userData[1] == 0x78) {
            offset = 2;
        }

        require(userData.length >= offset + 40, "Invalid address hex string");

        uint256 result = 0;
        for (uint256 i = offset; i < offset + 40; i++) {
            result = result * 16;
            uint8 char = uint8(userData[i]);

            if (char >= 48 && char <= 57) {
                result += char - 48; // 0-9
            } else if (char >= 65 && char <= 70) {
                result += char - 55; // A-F
            } else if (char >= 97 && char <= 102) {
                result += char - 87; // a-f
            } else {
                revert("Invalid hex character");
            }
        }

        return address(uint160(result));
    }

    function getConfigId(
        bytes32, /* destinationChainId */
        bytes32, /* userIdentifier */
        bytes memory /* userDefinedData */
    ) public view override returns (bytes32) {
        return verificationConfigId;
    }
}
