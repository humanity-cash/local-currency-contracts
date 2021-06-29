## `IWallet`



A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner




### `initialize(address _erc20token, address _controller, bytes32 _userId)` (external)

Used to initialize a new Wallet contract





### `availableBalance() → uint256` (external)

retrieve available balance for this contract





### `transferTo(contract IWallet _toWallet, uint256 _value) → bool` (external)

Perform a settlement by returning token to the wallet contract



If there was an existing authorization for this txId, de-authorize it, for the original authorization amount, regardless of the current settlement amount


### `transferController(address _newController)` (external)

Transfer control of the controller






### `TransferToEvent(bytes32 _fromUserId, bytes32 _toUserId, uint256 _amt)`

Triggered when an amount has been settled for a user





