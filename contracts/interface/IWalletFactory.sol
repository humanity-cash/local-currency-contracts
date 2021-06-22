// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWalletFactory {
    /**
     * @notice Triggered when a new Wallet has been created
     *
     * @param _newWalletAddress   Address of the Wallet
     */
    event WalletCreated(address _newWalletAddress);

    /**
     * @notice Create a new Wallet proxy contract
     *
     * @param _userId UserId of the new wallet
     *
     */
    function createProxiedWallet(string memory _userId) external returns (address);

    /**
     * @notice Update proxy implementation address
     *
     * @param _proxy Address of a Wallet proxy
     * @param _newLogic Address of new implementation contract
     *
     */
    function updateProxyImplementation(address _proxy, address _newLogic) external;
}
