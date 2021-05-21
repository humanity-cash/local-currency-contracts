## `IUBIBeneficiary`



A simple wallet contract to hold specific ERC20 tokens that is controlled by an owner




### `initialize(address _cUSDToken, address _cUBIAuthToken, address _controller, string _userId)` (external)

Used to initialize a new UBIBeneficiary contract



Demurrage parameters defaulted to Celo: 17280 blocks/epoch, 28 epochs demurrage free, and 1% (1/100) per epoch after

### `setDemurrageParameters(uint256 _blocksInEpoch, uint256 _demurrageFreeEpochs, uint256 _demurrageNumerator, uint256 _demurrageDenominator)` (external)

External entry point function for updating of updating demurrage parameters





### `getSettlementKeys() → bytes32[]` (external)

Return array of settlementKeys



Note this is marked external, you cannot return dynamically sized data target is a Web3 caller for iterating Settlements


### `getAuthorizationKeys() → bytes32[]` (external)

Return array of authorizationsKeys



Note this is marked external, you cannot return dynamically sized data target is a Web3 caller for iterating Authorizations


### `getAuthorizationAtKey(bytes32 _key) → uint256, bool, string` (external)

Return the primitive attributes of an Authorization struct





### `getSettlementAtKey(bytes32 _key) → uint256, string` (external)

Return the primitive attributes of an Settlement struct





### `availableBalance() → uint256` (external)

retrieve available balance for this contract





### `authorizationBalance() → uint256` (external)

retrieve authorization balance for this contract





### `deauthorize(string _txId) → uint256` (external)

External method deauthorization



We don't need to specify the transaction size here because it is stored in the Authorization struct


### `authorize(string _txId, uint256 _value)` (external)

Store a new authorization 





### `settle(string _txId, uint256 _value, address _reconciliationAccount)` (external)

Perform a settlement by returning cUSD token to the reconciliation contract



If there was an existing authorization for this txId, de-authorize it, for the original authorization amount, regardless of the current settlement amount


### `transferController(address _newController)` (external)

Transfer control of the UBIBeneficiary






### `AuthorizationEvent(bytes32 _userId, address _ubiAddress, string _txId, uint256 _amt)`

Triggered when an amount has been pre-authorized for a user





### `DeauthorizationEvent(bytes32 _userId, address _ubiAddress, string _txId, uint256 _amt)`

Triggered when an amount has been de-authorized for a user





### `SettlementEvent(bytes32 _userId, address _ubiAddress, string _txId, uint256 _amt)`

Triggered when an amount has been settled for a user





### `DemurragePaidEvent(bytes32 _userId, address _ubiAddress, string _txId, uint256 _amt)`

Triggered when a demurrage charge has been paid back to the owner





