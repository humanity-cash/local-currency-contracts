// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "./interface/IWallet.sol";
import "./interface/IWalletFactory.sol";
import "./interface/IVersionedContract.sol";

contract WalletFactory is IVersionedContract, IWalletFactory, Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for ERC20PresetMinterPauser;

    ProxyAdmin private proxyAdmin;
    IWallet private wallet;
    IERC20 private erc20Token;

    /**
     * @notice Constructor for WalletFactory contract
     *
     */
    constructor(
        IWallet _wallet,
        IERC20 _erc20Token
    ) {
        proxyAdmin = new ProxyAdmin();
        erc20Token = _erc20Token;
        wallet = _wallet;
    }

    /**
     * @notice Returns the storage, major, minor, and patch version of the contract.
     * @return The storage, major, minor, and patch version of the contract.
     */
    function getVersionNumber()
        external
        pure
        override
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (1, 2, 0, 0);
    }

    /**
     * @notice Create a new Wallet proxy contract
     *
     * @param _userId UserId of the new wallet
     *
     */
    function createProxiedWallet(string memory _userId)
        external
        override
        returns (address)
    {
        TransparentUpgradeableProxy proxy =
        new TransparentUpgradeableProxy(
            address(wallet),
            address(proxyAdmin),
            abi.encodeWithSignature(
                "initialize(address,address,string)",
                address(erc20Token),
                msg.sender,
                _userId
            )
        );
        emit WalletCreated(address(proxy));
        return address(proxy);
    }

    /**
     * @notice Update proxy implementation address
     *
     * @param _proxy Address of a wallet proxy
     * @param _newLogic Address of new implementation contract
     *
     */
    function updateProxyImplementation(address _proxy, address _newLogic)
        external
        override
        onlyOwner
    {
        proxyAdmin.upgrade(TransparentUpgradeableProxy(payable(_proxy)), _newLogic);
    }
}
