const Migrations = artifacts.require("Migrations");
const Controller = artifacts.require("Controller");
const Wallet = artifacts.require("Wallet");
const WalletFactory = artifacts.require("WalletFactory");
const Token = artifacts.require("Token");
const config = require("./config.json");
const utils = require("web3-utils");

module.exports = (deployer, network, accounts) => {
	deployer.deploy(Migrations).then(async (migrations) => {
		console.log(`Migrations address ${migrations.address}`);

		// Use configuration items
		let configToUse = config[network];
		if (!configToUse) configToUse = config["development"];

		let walletFactory, controller, token;

		// Deploy logic/implementation contracts
		const wallet = await deployer.deploy(Wallet);

		// do we already have a token to use?
		let tokenToUse = configToUse.token;
		if (!tokenToUse) {
			//no, deploy one
			token = await deployer.deploy(
				Token,
				configToUse.tokenName,
				configToUse.tokenTicker
			);
			tokenToUse = token.address;
		}

		// Deploy factory
		walletFactory = await deployer.deploy(
			WalletFactory,
			tokenToUse,
			wallet.address
		);

		// Deploy controller
		controller = await deployer.deploy(
			Controller,
			tokenToUse,
			walletFactory.address
		);

		// Make controller own factory
		await walletFactory.transferOwnership(controller.address);

		// If we are local, mint some fake token to play with for the controller
		if (token) {
			await token.mint(
				controller.address,
				utils.toWei("10000000", "ether")
			);
			await token.grantRole(
				utils.toHex("MINTER_ROLE"),
				controller.address
			);
		}

		// Give ownership of controller to the operational account
		await controller.transferOwnership(configToUse.initialOwner);
	});
};
