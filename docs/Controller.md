## `Controller`



Administrative and orchestrator contract for the Celo UBI program



### `greaterThanZero(uint256 _value)`

Enforces values > 0 only



### `balanceAvailable(bytes32 _userId, uint256 _value)`

Enforces value to not be greater than a user's available balance



### `userNotExist(bytes32 _userId)`

Enforces a _userId should not be mapped to an existing user / contract address




### `constructor(address _cUSDToken, address _cUBIAuthToken, address _factory, address _custodian)` (public)

Used to initialize a new Controller contract





### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `setDisbursementWei(uint256 _newDisbursementWei)` (external)

Set amount of wei to disburse to new beneficiaries





### `setUBIBeneficiaryFactory(address _newFactoryAddress)` (external)

Public update to a new UBI Beneficiary Factory





### `setCustodian(address _custodian)` (external)

Update the custodian address





### `balanceOfUBIBeneficiary(bytes32 _userId) → uint256` (public)

Retrieves the available balance of a UBI beneficiary





### `settle(bytes32 _userId, string _txId, uint256 _value)` (external)

Settles an amount for a UBI Beneficiary and transfers to the Reconciliation account





### `reconcile()` (external)

Reconciles cUSD built up in reconciliation account and sends to pre-configured custodian




### `newUbiBeneficiary(string _userId)` (external)

create a new user and assign them a wallet contract





### `beneficiaryAddress(bytes32 _userId) → address` (public)

retrieve contract address for a UBI Beneficiary





### `transferOwnership(address newOwner)` (public)

Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner.



In this override, we iterate all the existing UBIBeneficiary contracts
and change their owner before changing the owner of the core contract



### `updateBeneficiaryImplementation(address _newLogic)` (external)

Update implementation address for beneficiaries





### `updateReconciliationImplementation(address _newLogic)` (external)

Update implementation address for reconciliationAccount





### `pause()` (external)

Triggers stopped state.



Requirements: The contract must not be paused.

### `unpause()` (external)

Returns to normal state.



Requirements: The contract must be paused.

### `withdrawToCustodian()` (external)

Emergency withdrawal of all remaining cUSD to the custodian account



The contract must be paused
Sends cUSD to current custodian from the current reconciliation account

### `withdrawToOwner()` (external)

Emergency withdrawal of all remaining cUSD to the owner account



The contract must be paused
Sends cUSD to current owner

### `getBeneficiaryAddressAtIndex(uint256 _index) → address` (external)

Get beneficiary address at index


Used for iterating the complete list of beneficiaries


### `getBeneficiaryCount() → uint256` (external)

Get count of beneficiaries





### `NewUser(bytes32 _userId, address _ubiAddress)`

Triggered when a new user has been created





### `DisbursementUpdated(uint256 _disbursementWei)`

Triggered when the disbursement amount is changed





### `FactoryUpdated(address _oldFactoryAddress, address _newFactoryAddress)`

Triggered when the UBI Beneficiary Factory is updated





