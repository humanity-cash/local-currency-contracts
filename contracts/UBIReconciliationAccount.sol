// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/IUBIReconciliationAccount.sol";
import "./UBIBeneficiary.sol";

/**
 * @title Celo UBI reconciliation contract
 *
 * @dev This contract is a special version of a
 *      UBIBeneficiary that additionally sweeps
 *      cUSD to a known custodian address
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 */
contract UBIReconciliationAccount is IUBIReconciliationAccount, UBIBeneficiary {
    using SafeERC20 for IERC20;
    using SafeERC20 for ERC20PresetMinterPauser;

    address private custodian;

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
     * @notice used to initialize a new UBIReconciliationAccount contract
     *
     * @param _cUSDToken token used for cUSD
     * @param _cUBIAuthToken token used for cUSD authorizations
     * @param _custodian Address of the custodian
     * @param _controller Address of the controller contract
     *
     */
    function initialize(
        address _cUSDToken,
        address _cUBIAuthToken,
        address _custodian,
        address _controller
    ) external override initializer {
        cUSDToken = IERC20(_cUSDToken);
        cUBIAuthToken = ERC20PresetMinterPauser(_cUBIAuthToken);
        createdBlock = block.number;
        userId = "Reconciler";
        custodian = _custodian;
        _setupRole(CONTROLLER_ROLE, _controller);
        _setupRole(DEFAULT_ADMIN_ROLE, _controller);
        _setupRole(FACTORY_ROLE, msg.sender);
    }

    /**
     * @notice reconcile the cUSD balance of this account and send to the custodian
     *
     */
    function reconcile() external override onlyController(msg.sender) nonReentrant {
        uint256 cUSDBalance = cUSDToken.balanceOf(address(this));
        require(cUSDBalance > 0, "ERR_NOTHING_TO_RECONCILE");
        cUSDToken.transfer(custodian, cUSDBalance);
        emit Reconciled(custodian, cUSDBalance);
    }

    /**
     * @notice update the custodian address
     *
     * @param _custodian   new custodian address
     */
    function setCustodian(address _custodian) external override onlyController(msg.sender) {
        _setCustodian(_custodian);
    }

    /**
     * @notice Get the custodian address
     */
    function getCustodian() external view override returns (address) {
        return custodian;
    }

    /**
     * @notice Internal implementaiton of update the custodian address
     *
     * @param _custodian   new custodian address
     */
    function _setCustodian(address _custodian) internal {
        address previousCustodian = custodian;
        custodian = _custodian;
        emit CustodianUpdated(previousCustodian, custodian);
    }
}
