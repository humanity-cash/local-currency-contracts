// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "./interface/IWallet.sol";
import "./interface/IUBIReconciliationAccount.sol";
import "./interface/IWalletFactory.sol";
import "./interface/IVersionedContract.sol";

contract WalletFactory is IVersionedContract, IWalletFactory, Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for ERC20PresetMinterPauser;

    ProxyAdmin private proxyAdmin;
    IWallet private ubiLogic;
    IUBIReconciliationAccount private reconciliationLogic;
    IERC20 private cUSDToken;
    ERC20PresetMinterPauser private cUBIAuthToken;

    /**
     * @notice Constructor for UBIBeneficiaryFactory contract
     *
     */
    constructor(
        IWallet _ubiLogic,
        IUBIReconciliationAccount _reconciliationLogic,
        IERC20 _cUSDToken,
        ERC20PresetMinterPauser _cUBIAuthToken
    ) {
        proxyAdmin = new ProxyAdmin();
        cUSDToken = _cUSDToken;
        ubiLogic = _ubiLogic;
        reconciliationLogic = _reconciliationLogic;
        cUBIAuthToken = _cUBIAuthToken;
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
     * @notice Create a new UBI Beneficiary proxy contract
     *
     * @param _userId UserId of the new beneficiary
     *
     */
    function createProxiedUBIBeneficiary(string memory _userId)
        external
        override
        returns (address)
    {
        TransparentUpgradeableProxy ubiProxy =
            new TransparentUpgradeableProxy(
                address(ubiLogic),
                address(proxyAdmin),
                abi.encodeWithSignature(
                    "initialize(address,address,address,string)",
                    address(cUSDToken),
                    address(cUBIAuthToken),
                    msg.sender,
                    _userId
                )
            );
        emit UBIBeneficiaryCreated(address(ubiProxy));
        return address(ubiProxy);
    }

    /**
     * @notice Create a new UBI Reconciliation proxy contract
     *
     * @param _custodian Address of the custodian target address
     *
     */
    function createProxiedUBIReconciliationAccount(address _custodian)
        external
        override
        returns (address)
    {
        TransparentUpgradeableProxy reconciliationProxy =
            new TransparentUpgradeableProxy(
                address(reconciliationLogic),
                address(proxyAdmin),
                abi.encodeWithSignature(
                    "initialize(address,address,address,address)",
                    address(cUSDToken),
                    address(cUBIAuthToken),
                    _custodian,
                    msg.sender
                )
            );
        emit UBIReconciliationAccountCreated(address(reconciliationProxy));
        return address(reconciliationProxy);
    }

    /**
     * @notice Update proxy implementation address
     *
     * @param _proxy Address of either a UBIBeneficiary or ReconciliationAccount proxy
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
