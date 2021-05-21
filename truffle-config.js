require('dotenv').config();
const Kit = require("@celo/contractkit");
const celoGanache = require('@celo/ganache-cli');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const getProvider = () => {
  const kit = Kit.newKit(process.env.RPC_HOST);
  kit.addAccount(process.env.DEPLOYER_PRIVATE_KEY);
  return kit.web3.currentProvider;
}

const getMnemonic = () => {
  require('dotenv').config({ path: '.env.local'});
  return process.env.MNEMONIC;
}

const getAlfajoresProvider = () => {
  require('dotenv').config({ path: '.env.alfajores'});
  return getProvider();
}

const getBaklavaProvider = () => {
  require('dotenv').config({ path: '.env.baklava'});
  return getProvider();
}

const getMainnetProvider = () => {
  require('dotenv').config({ path: '.env.mainnet'});
  return getProvider();
}

module.exports = {

  networks: {

    development: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
      gasPrice: 20000000000,
      gas: 13000000,
      provider: celoGanache.provider({
        gasLimit: 13000000,
        gasPrice: 20000000000,
        default_balance_ether: 10000000000000000000
      })
    },

    local: {
      provider: () => new HDWalletProvider(
        getMnemonic(),
        `http://localhost:7545`
      ),
      network_id: "*",      
      gas: 9500000,        
      gasPrice: 20000000000, 
      timeoutBlocks: 50
    },
    
    alfajores: {
      provider: () => getAlfajoresProvider(),     // CeloProvider
      network_id: 44787                           // Alfajores network id
    },

    baklava: {
      provider: () => getBaklavaProvider(),       // CeloProvider
      network_id: 62320                           // Baklava network id
    },

    mainnet: {
      provider: () => getMainnetProvider(),       // CeloProvider
      network_id: 42220                           // Mainnet network id
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: 10000,
    useColors: true
  },

  plugins: [
    'solidity-coverage'
  ],

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.4",
      docker: false,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 200
       },
       evmVersion: "istanbul",
       metadata: { useLiteralContent: true }
      }
    }
  }
  
}