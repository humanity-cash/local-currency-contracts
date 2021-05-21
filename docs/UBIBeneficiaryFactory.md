## `UBIBeneficiaryFactory`






### `constructor(contract IUBIBeneficiary _ubiLogic, contract IUBIReconciliationAccount _reconciliationLogic, contract IERC20 _cUSDToken, contract ERC20PresetMinterPauser _cUBIAuthToken)` (public)

Constructor for UBIBeneficiaryFactory contract




### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `createProxiedUBIBeneficiary(string _userId) → address` (external)

Create a new UBI Beneficiary proxy contract





### `createProxiedUBIReconciliationAccount(address _custodian) → address` (external)

Create a new UBI Reconciliation proxy contract





### `updateProxyImplementation(address _proxy, address _newLogic)` (external)

Update proxy implementation address






