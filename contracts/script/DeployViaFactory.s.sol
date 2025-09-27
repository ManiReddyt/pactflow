// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NftSignFactory} from "contracts/NftSignFactory.sol";

contract DeployViaFactory is Script {
    function run() external returns (address deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address intendedSigner = vm.envAddress("INTENDED_SIGNER");
        string memory fileName = vm.envString("FILE_NAME");
        string memory docTitle = vm.envString("DOC_TITLE");
        string memory docDesc = vm.envString("DOC_DESC");
        string memory cid = vm.envString("DOC_CID");
        address factoryAddr = vm.envAddress("FACTORY_ADDR");

        vm.startBroadcast(deployerPrivateKey);
        NftSignFactory factory = NftSignFactory(factoryAddr);
        deployed = factory.deployNftSign(fileName, docTitle, docDesc, intendedSigner, cid);
        vm.stopBroadcast();
    }
}
