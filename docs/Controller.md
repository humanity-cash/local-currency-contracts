## `Controller`



Administrative and orchestrator contract for local currencies



### `greaterThanZero(uint256 _value)`

Enforces values > 0 only



### `balanceAvailable(bytes32 _userId, uint256 _value)`

Enforces value to not be greater than a user's available balance



### `userNotExist(bytes32 _userId)`

Enforces a _userId should not be mapped to an existing user / contract address




### `constructor(address _erc20Token, address _factory)` (public)

Used to initialize a new Controller contract





### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `setWalletFactory(address _newFactoryAddress)` (external)

Public update to a new Wallet Factory





### `balanceOfWallet(bytes32 _userId) → uint256` (public)

Retrieves the available balance of a wallet





### `settle(bytes32 _userId, string _txId, uint256 _value)` (external)

Settles an amount for a wallet and transfers to the wallet contract





### `newWallet(string _userId)` (external)

create a new user and assign them a wallet contract





### `getWalletAddress(bytes32 _userId) → address` (public)

retrieve contract address for a Wallet





### `transferOwnership(address newOwner)` (public)

Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner.



In this override, we iterate all the existing Wallet contracts
and change their owner before changing the owner of the core contract



### `updateWalletImplementation(address _newLogic)` (external)

Update implementation address for beneficiaries





### `pause()` (external)

Triggers stopped state.



Requirements: The contract must not be paused.

### `unpause()` (external)

Returns to normal state.



Requirements: The contract must be paused.

### `withdrawToOwner()` (external)

Emergency withdrawal of all remaining token to the owner account



The contract must be paused
Sends erc20 to current owner

### `getWalletAddressAtIndex(uint256 _index) → address` (external)

Get wallet address at index


Used for iterating the complete list of beneficiaries


### `getWalletCount() → uint256` (external)

Get count of beneficiaries





### `NewUser(bytes32 _userId, address _walletAddress)`

Triggered when a new user has been created





### `FactoryUpdated(address _oldFactoryAddress, address _newFactoryAddress)`

Triggered when the Wallet Factory is updated





