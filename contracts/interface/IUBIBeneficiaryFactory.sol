// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUBIBeneficiaryFactory {
    /**
     * @notice Triggered when a new UBIBeneficiary has been created
     *
     * @param _newUBIBeneficiaryAddress   Celo address of the UBI Beneficiary
     */
    event UBIBeneficiaryCreated(address _newUBIBeneficiaryAddress);

    /**
     * @notice Triggered when a new UBIReconciliationAccount has been created
     *
     * @param _newUBIReconciliationAccountAddress   Celo address of the UBI Reconciliation Account
     */
    event UBIReconciliationAccountCreated(address _newUBIReconciliationAccountAddress);

    /**
     * @notice Create a new UBI Beneficiary proxy contract
     *
     * @param _userId UserId of the new beneficiary
     *
     */
    function createProxiedUBIBeneficiary(string memory _userId) external returns (address);

    /**
     * @notice Create a new UBI Reconciliation proxy contract
     *
     * @param _custodian Address of the custodian target address
     *
     */
    function createProxiedUBIReconciliationAccount(address _custodian) external returns (address);

    /**
     * @notice Update proxy implementation address
     *
     * @param _proxy Address of either a UBIBeneficiary or ReconciliationAccount proxy
     * @param _newLogic Address of new implementation contract
     *
     */
    function updateProxyImplementation(address _proxy, address _newLogic) external;
}
