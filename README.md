![Keyko Banner](https://raw.githubusercontent.com/keyko-io/assets/master/images/logo/keyko_banner_2.jpg)

# local-currency-contracts

![workflow status](https://github.com/humanity-cash/local-currency-contracts/workflows/Build/badge.svg) 
[![MythXBadge](https://badgen.net/https/api.mythx.io/v1/projects/42dd13c5-1c7d-4cb4-9969-a889e4ca449e/badge/data?cache=300&icon=https://raw.githubusercontent.com/ConsenSys/mythx-github-badge/main/logo_white.svg)](https://docs.mythx.io/dashboard/github-badges)

Solidity contracts deployable on any EVM compatible network that faciliate a non-custodial light user wallet for a 1:1 backed stablecoin / token payment system. This is a Truffle project.

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
* [IController](docs/interface/IController.md)
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

### Celo Mainnet

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| Controller    | `0xa444da1f6eF511ce00E7Adc7D3963Eeafa79a33a` |
| Token         | `0x88Ab2daF8ead7e71CaDd9323ae688C207f9D943B` |