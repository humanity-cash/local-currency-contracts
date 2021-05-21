## `UBIReconciliationAccount`



This contract is a special version of a
     UBIBeneficiary that additionally sweeps
     cUSD to a known custodian address




### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `initialize(address _cUSDToken, address _cUBIAuthToken, address _custodian, address _controller)` (external)

used to initialize a new UBIReconciliationAccount contract





### `reconcile()` (external)

reconcile the cUSD balance of this account and send to the custodian




### `setCustodian(address _custodian)` (external)

update the custodian address





### `getCustodian() → address` (external)

Get the custodian address



### `_setCustodian(address _custodian)` (internal)

Internal implementaiton of update the custodian address






