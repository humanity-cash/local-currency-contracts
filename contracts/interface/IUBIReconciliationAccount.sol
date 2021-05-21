// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IUBIBeneficiary.sol";

/**
 * @title Celo UBI reconciliation contract interface
 *
 * @dev This contract is a special version of a
 *      UBIBeneficiary that additionally sweeps
 *      cUSD to a known custodian address
 *
 * @author Aaron Boyd <https://github.com/aaronmboyd>
 */
interface IUBIReconciliationAccount is IUBIBeneficiary {
    /**
     * @notice triggered when an amount has been reconciled
     *
     * @param _custodian   reconciliation target
     * @param _amt   reconciliation amount
     */
    event Reconciled(address _custodian, uint256 _amt);

    /**
     * @notice triggered when the custodian has been updated
     *
     * @param _custodianPrevious   previous custodian
     * @param _custodianCurrent    current custodian
     */
    event CustodianUpdated(address _custodianPrevious, address _custodianCurrent);

    /**
     * @notice Used to initialize a new UBIReconciliationAccount contract
     *
     * @param _cUSDToken token used for cUSD
     * @param _cUBIAuthToken token used for cUSD authorizations
     * @param _custodian Address of the custodian
     *
     */
    function initialize(
        address _cUSDToken,
        address _cUBIAuthToken,
        address _custodian,
        address _controller
    ) external;

    /**
     * @notice reconcile the cUSD balance of this account and send to the custodian
     *
     */
    function reconcile() external;

    /**
     * @notice update the custodian address
     *
     * @param _custodian   new custodian address
     */
    function setCustodian(address _custodian) external;

    /**
     * @notice Get the custodian address
     */
    function getCustodian() external view returns (address);
}
