## `IWallet`



A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner




### `initialize(address _erc20token, address _controller, string _userId)` (external)

Used to initialize a new Wallet contract





### `getSettlementKeys() → bytes32[]` (external)

Return array of settlementKeys



Note this is marked external, you cannot return dynamically sized data target is a Web3 caller for iterating Settlements


### `getSettlementAtKey(bytes32 _key) → uint256, string` (external)

Return the primitive attributes of an Settlement struct





### `availableBalance() → uint256` (external)

retrieve available balance for this contract





### `settle(string _txId, uint256 _value)` (external)

Perform a settlement by returning cUSD token to the wallet contract



If there was an existing authorization for this txId, de-authorize it, for the original authorization amount, regardless of the current settlement amount


### `transferController(address _newController)` (external)

Transfer control of the controller






### `SettlementEvent(bytes32 _userId, address _walletAddress, string _txId, uint256 _amt)`

Triggered when an amount has been settled for a user





