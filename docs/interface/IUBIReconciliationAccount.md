## `IUBIReconciliationAccount`



This contract is a special version of a
     UBIBeneficiary that additionally sweeps
     cUSD to a known custodian address




### `initialize(address _cUSDToken, address _cUBIAuthToken, address _custodian, address _controller)` (external)

Used to initialize a new UBIReconciliationAccount contract





### `reconcile()` (external)

reconcile the cUSD balance of this account and send to the custodian




### `setCustodian(address _custodian)` (external)

update the custodian address





### `getCustodian() → address` (external)

Get the custodian address




### `Reconciled(address _custodian, uint256 _amt)`

triggered when an amount has been reconciled





### `CustodianUpdated(address _custodianPrevious, address _custodianCurrent)`

triggered when the custodian has been updated





