// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NftSignFactory} from "NftSignFactory.sol";

contract DeployFactory is Script {
    function run() external returns (NftSignFactory factory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        factory = new NftSignFactory();
        vm.stopBroadcast();
    }
}
