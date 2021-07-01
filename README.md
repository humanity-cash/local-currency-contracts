![workflow status](https://github.com/humanity-cash/berkshares-contracts/workflows/Build/badge.svg)
[![MythXBadge](https://badgen.net/https/api.mythx.io/v1/projects/aa4b6061-6775-4a06-958f-df8340a3e8f6/badge/data?cache=300&icon=https://raw.githubusercontent.com/ConsenSys/mythx-github-badge/main/logo_white.svg)](https://docs.mythx.io/dashboard/github-badges)

# berkshares-contracts

EVM compatible Solidity contracts the Berkshares local currency program on the Celo protocol

## Install

```
nvm use 12
yarn --ignore-engines
``` 

## Build / Test / Deploy

`yarn build` / `yarn coverage` / `yarn migrate`

## Documentation

Generate with `yarn doc`

* [Token](docs/Token.md)
* [IWallet](docs/interface/IWallet.md)
* [IWalletFactory](docs/interface/IWalletFactory.md)
* [Wallet](docs/Wallet.md)
* [WalletFactory](docs/WalletFactory.md)
* [Controller](docs/Controller.md)

## Networks

### Alfajores Celo Testnet

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| Controller    | `0x0148A386d34d54078416ba9c7367BD41fF6fA663` |
| Token         | `0xFE161AAd1eE51a18bFfCf6620D9065eA3280E04d` |

### Baklava Celo Testnet

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| Controller    | `0xf8BCD6AC808816CdB5C950e2b1F17593f4759eB3` |
| Token         | `0xA5D6D2352eB1DE443B7aa8ef376Dd43f2054eC26` |
