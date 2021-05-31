require("dotenv").config();
const celoGanache = require("@celo/ganache-cli");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const getMnemonic = (network) => {
	require("dotenv").config({ path: `.env.${network}` });
	return process.env.MNEMONIC;
};

module.exports = {
	networks: {
		development: {
			network_id: "*",
			gasPrice: 20000000000,
			gas: 13000000,
			provider: celoGanache.provider({
				gasLimit: 13000000,
				gasPrice: 20000000000,
				default_balance_ether: 10000000000000000000,
			}),
		},

		local: {
			provider: new HDWalletProvider({
				mnemonic: getMnemonic("local"),
				providerOrUrl: `http://localhost:7545`,
			}),
			network_id: "*",
			gas: 13000000,
			gasPrice: 20000000000,
		},

		alfajores: {
			provider: new HDWalletProvider({
				mnemonic: getMnemonic("alfajores"),
				providerOrUrl: `https://alfajores-forno.celo-testnet.org`,
			}),
			network_id: 44787, // Alfajores network id
		},

		baklava: {
			provider: new HDWalletProvider({
				mnemonic: getMnemonic("baklava"),
				providerOrUrl: `https://baklava-forno.celo-testnet.org`,
			}),
			network_id: 62320, // Baklava network id
		},

		mainnet: {
			provider: new HDWalletProvider({
				mnemonic: getMnemonic("mainnet"),
				providerOrUrl: `https://forno.celo.org`,
			}),
			network_id: 42220, // Mainnet network id
		},
	},

	// Set default mocha options here, use special reporters etc.
	mocha: {
		timeout: 10000,
		useColors: true,
	},

	plugins: ["solidity-coverage"],

	// Configure your compilers
	compilers: {
		solc: {
			version: "0.8.4",
			docker: false, // Use "0.5.1" you've installed locally with docker (default: false)
			settings: {
				// See the solidity docs for advice about optimization and evmVersion
				optimizer: {
					enabled: true,
					runs: 200,
				},
				evmVersion: "istanbul",
				metadata: { useLiteralContent: true },
			},
		},
	},
};
