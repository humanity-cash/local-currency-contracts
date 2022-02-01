## `IWallet`



A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner




### `initialize(address _erc20token, address _controller, bytes32 _userId)` (external)

Used to initialize a new Wallet contract





### `availableBalance() → uint256` (external)

retrieve available balance for this contract





### `transferTo(contract IWallet _toWallet, uint256 _value) → bool` (external)

Performs a transfer from one wallet to another





### `withdraw(uint256 _value) → bool` (external)

Performs a withdrawal to the controller





### `transferController(address _newController)` (external)

Transfer control of the controller








