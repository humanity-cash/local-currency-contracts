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
| Controller    | `0x9a39f9307026a1Ec08aa57Fa80000D74b8C2BCc9` |
| Token         | `0xd1e1f2b6301d3Ba0F26521617f6fDD666825f209` |

### Baklava Celo Testnet

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| Controller    | `0x722A2f8F81E4a3C0d0cB36fEd586E2998aDFc181` |
| Token         | `0x2232bb724051CDf15535785F0F3386415CE25465` |
