## `Wallet`



A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner



### `onlyController(address operator)`

Enforces only controller can perform action




### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `initialize(address _erc20Token, address _controller, bytes32 _userId)` (external)

used to initialize a new Wallet contract





### `availableBalance() → uint256` (external)

retrieve available balance for this contract





### `transferTo(contract IWallet _toWallet, uint256 _value) → bool` (external)

Performs a transfer from one wall to another





### `transferController(address _newController)` (external)

Transfer control of the controller






