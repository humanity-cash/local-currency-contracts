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

* [IUBIBeneficiary](docs/IUBIBeneficiary.md)
* [IUBIBeneficiaryFactory](docs/IUBIBeneficiaryFactory.md)
* [IUBIReconciliationAccount](docs/IUBIReconciliationAccount.md)
* [UBIBeneficiary](docs/UBIBeneficiary.md)
* [UBIBeneficiaryFactory](docs/UBIBeneficiaryFactory.md)
* [UBIController](docs/UBIController.md)
* [UBIReconciliationAccount](docs/UBIReconciliationAccount.md)


## Networks

### Alfajores Celo Testnet

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| UBIController | `0x307D068DBADbd9CB8BD397917Be42e23FAb4880F` |


### Baklava Celo Testnet

| Contract      | Address                                      |
|---------------|----------------------------------------------|
| UBIController | `0x3d29428E0e096d8d338e02e3F625313689A627f6` |
