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
| Controller    | `0x65d6fCC312466f9bD12eBb79151Ec1F14164aA42` |
| Token         | `0x6D5066cC9Af584F32cdCb00E7320D9a6988a061f` |

### Baklava Celo Testnet

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| Controller    | `0xdE996B9b11078Cfb733d1bFc5ac04D9e09c9a091` |
| Token         | `0x5bA6Ade11a4A7e4D4654a31E998bC6507c14B5D0` |
