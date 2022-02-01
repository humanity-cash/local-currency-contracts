## `IController`



Administrative and orchestrator contract for local currencies




### `balanceOfWallet(bytes32 _userId) → uint256` (external)

Retrieves the available balance of a wallet





### `balanceOfWallet(address _walletAddress) → uint256` (external)

Retrieves the available balance of a wallet





### `getWalletAddress(bytes32 _userId) → address` (external)

retrieve contract address for a Wallet





### `getWalletAddressAtIndex(uint256 _index) → address` (external)

Get wallet address at index


Used for iterating the complete list of wallets


### `getWalletCount() → uint256` (external)

Get count of wallets




### `transfer(bytes32 _fromUserId, bytes32 _toUserId, uint256 _value, uint256 _roundUpValue) → bool` (external)

Transfers a local currency token between two existing wallets





### `transfer(bytes32 _fromUserId, address _toAddress, uint256 _value, uint256 _roundUpValue) → bool` (external)

Transfers a local currency token between two existing wallets





### `transferWithMemo(bytes32 _fromUserId, bytes32 _toUserId, uint256 _value, uint256 _roundUpValue, string _memo) → bool` (external)

Transfers a local currency token between two existing wallets with an attached memo field





### `transferWithMemo(bytes32 _fromUserId, address _toAddress, uint256 _value, uint256 _roundUpValue, string _memo) → bool` (external)

Transfers a local currency token between two existing wallets with an attached memo field





### `deposit(bytes32 _userId, uint256 _value) → bool` (external)

Deposits tokens in the wallet identified by the given user id





### `withdraw(bytes32 _userId, uint256 _value) → bool` (external)

Withdraws tokens from the wallet identified by the given user id





### `newWallet(bytes32 _userId)` (external)

create a new user and assign them a wallet contract





### `setWalletFactory(address _newFactoryAddress)` (external)

Public update to a new Wallet Factory





### `transferContractOwnership(address newOwner)` (external)

Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner.






### `transferWalletOwnership(address newOwner, bytes32 userId)` (external)

Transfers ownership of the wallet to a new account (`newOwner`).
Can only be called by the current owner.






### `updateWalletImplementation(address _newLogic)` (external)

Update implementation address for wallets





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

override onlyOwner {  
Update community chest address





### `setHumanityCashAddress(address _humanityCashAddress)` (external)

Update Humanity Cash Address





### `setRedemptionFee(int256 _numerator, int256 _denominator)` (external)

Set redemption fee





### `setRedemptionFeeMinimum(uint256 _redemptionFeeMinimum)` (external)

Set redemption fee minimum






### `NewUser(bytes32 _userId, address _walletAddress)`

Triggered when a new user has been created





### `UserDeposit(bytes32 _userId, address _operator, uint256 _value)`

Triggered when a user has deposited





### `UserWithdrawal(bytes32 _userId, address _operator, uint256 _value)`

Triggered when a user has withdrawn





### `TransferToEvent(bytes32 _fromUserId, bytes32 _toUserId, uint256 _amt)`

Triggered when an amount has been transferred from one wallet to another





### `TransferToEvent(bytes32 _fromUserId, address _toAddress, uint256 _amt)`

Triggered when an amount has been transferred from one wallet to another





### `TransferToEventWithMemo(bytes32 _fromUserId, bytes32 _toUserId, uint256 _amt, string _memo)`

Triggered when an amount has been transferred from one wallet to another





### `TransferToEventWithMemo(bytes32 _fromUserId, address _toAddress, uint256 _amt, string _memo)`

Triggered when an amount has been transferred from one wallet to another





### `RoundUpEvent(bytes32 _fromUserId, address _toAddress, uint256 _amt)`

Triggered when a round up has been sent from one account to another





### `FactoryUpdated(address _oldFactoryAddress, address _newFactoryAddress)`

Triggered when the Wallet Factory is updated





### `CommunityChestUpdated(address _oldCommunityChestAddress, address _newCommunityChestAddress)`

Triggered when the Community Chest address is updated





### `HumanityCashUpdated(address _oldHumanityCashAddress, address _newHumanityCashAddress)`

Triggered when the Humanity Cash address is updated





### `RedemptionFeeUpdated(int256 _oldNumerator, int256 _oldDenominator, int256 _newNumerator, int256 _newDenominator)`

Triggered when the Redemption Fee is updated





### `RedemptionFeeMinimumUpdated(uint256 _oldRedemptionFeeMinimum, uint256 _newRedemptionFeeMinimum)`

Triggered when the Redemption Fee Minimum is updated





### `RedemptionFee(address _redemptionFeeAddress, uint256 _redemptionFee)`

Triggered when a redemption (withdrawal) fee is collected







