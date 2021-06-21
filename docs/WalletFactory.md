## `WalletFactory`






### `constructor(contract IWallet _wallet, contract IERC20 _erc20Token)` (public)

Constructor for WalletFactory contract




### `getVersionNumber() → uint256, uint256, uint256, uint256` (external)

Returns the storage, major, minor, and patch version of the contract.




### `createProxiedWallet(string _userId) → address` (external)

Create a new Wallet proxy contract





### `updateProxyImplementation(address _proxy, address _newLogic)` (external)

Update proxy implementation address






