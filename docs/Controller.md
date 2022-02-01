## `Controller`



Administrative and orchestrator contract for local currencies



### `greaterThanZero(uint256 _value)`

Enforces values > 0 only



### `onlyOwnerOrOperator(address _address)`

Enforces only owner or operator roles



### `balanceAvailable(bytes32 _userId, uint256 _value)`

Enforces value to not be greater than a user's available balance



### `userNotExist(bytes32 _userId)`

Enforces a _userId should not be mapped to an existing user / contract address



### `userExist(bytes32 _userId)`

Enforces a _userId exists




### `constructor(address _erc20Token, address _walletFactory)` (public)

Used to initialize a new Controller contract





### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `balanceOfWallet(bytes32 _userId) → uint256` (external)

Retrieves the available balance of a wallet





### `_balanceOfWallet(bytes32 _userId) → uint256` (internal)

Retrieves the available balance of a wallet





### `balanceOfWallet(address _walletAddress) → uint256` (external)

Retrieves the available balance of a wallet





### `_balanceOfWallet(address _walletAddress) → uint256` (internal)

Retrieves the available balance of a wallet





### `getWalletAddress(bytes32 _userId) → address` (external)

retrieve contract address for a Wallet





### `_getWalletAddress(bytes32 _userId) → address` (internal)

retrieve contract address for a Wallet





### `getWalletAddressAtIndex(uint256 _index) → address` (external)

Get wallet address at index


Used for iterating the complete list of wallets


### `getWalletCount() → uint256` (external)

Get count of wallets




### `transferWithMemo(bytes32 _fromUserId, bytes32 _toUserId, uint256 _value, uint256 _roundUpValue, string _memo) → bool` (external)

Transfers a local currency token between two existing wallets with an attached memo





### `transfer(bytes32 _fromUserId, bytes32 _toUserId, uint256 _value, uint256 _roundUpValue) → bool` (external)

Transfers a local currency token between two existing wallets





### `transferWithMemo(bytes32 _fromUserId, address _toAddress, uint256 _value, uint256 _roundUpValue, string _memo) → bool` (external)

Transfers a local currency token between two existing wallets with an attached memo field





### `transfer(bytes32 _fromUserId, address _toAddress, uint256 _value, uint256 _roundUpValue) → bool` (external)

Transfers a local currency token between two existing wallets





### `_roundUp(bytes32 _fromUserId, uint256 _roundUpValue) → bool` (internal)

Transfers a local currency token to the Community Chest





### `deposit(bytes32 _userId, uint256 _value) → bool` (external)

Deposits tokens in the wallet identified by the given user id





### `_deposit(bytes32 _userId, uint256 _value) → bool` (internal)

Internal implementation of deposits tokens in the wallet identified by the given user id





### `withdraw(bytes32 _userId, uint256 _value) → bool` (external)

Withdraws tokens from the wallet identified by the given user id





### `_withdraw(bytes32 _userId, uint256 _value) → bool` (internal)

Internal implementation of withdraw tokens in the wallet identified by the given user id





### `newWallet(bytes32 _userId)` (external)

create a new user and assign them a wallet contract





### `_newWallet(bytes32 _userId)` (internal)

create a new user and assign them a wallet contract





### `setWalletFactory(address _newFactoryAddress)` (external)

Public update to a new Wallet Factory





### `_setWalletFactory(address _newFactoryAddress)` (internal)

Internal implementation of update to a new Wallet Factory





### `transferContractOwnership(address newOwner)` (external)

Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner.






### `transferWalletOwnership(address newOwner, bytes32 userId)` (external)

Transfers ownership of the wallet to a new account (`newOwner`).
Can only be called by the current owner.






### `updateWalletImplementation(address _newLogic)` (external)

Update implementation address for wallets



If the number of wallets is sufficiently large this
     function may run out of gas


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

### `setCommunityChest(address _communityChest)` (external)

Update community chest address





### `setHumanityCashAddress(address _humanityCashAddress)` (external)

Update Humanity Cash Address





### `setRedemptionFee(int256 _numerator, int256 _denominator)` (external)

Set redemption fee





### `setRedemptionFeeMinimum(uint256 _redemptionFeeMinimum)` (external)

Set redemption fee minimum








