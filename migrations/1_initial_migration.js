const Migrations = artifacts.require("Migrations");
const Controller = artifacts.require("Controller");
const Wallet = artifacts.require("Wallet");
const WalletFactory = artifacts.require("WalletFactory");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const config = require("./config.json");
const utils = require("web3-utils");

module.exports = (deployer, network, accounts) => {
	deployer.deploy(Migrations).then(async (migrations) => {
		console.log(`Migrations address ${migrations.address}`);

		// Use configuration items
		let configToUse = config[`${network}`];
		if (!configToUse) configToUse = config["development"];

		let walletFactory, controller, fakeToken;

		// Deploy logic/implementation contracts
		const wallet = await deployer.deploy(Wallet);

		// If we are local, create a fake token
		let tokenToUse = configToUse.token;
		if (network === "local") {
			fakeToken = await deployer.deploy(ERC20, "TestToken", "TT");
			tokenToUse = fakeToken.address;
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
		if (network === "local") {
			await fakeToken.mint(
				controller.address,
				utils.toWei("10000000", "ether")
			);
		}

		// Give ownership of controller to the operational account
		await controller.transferOwnership(configToUse.initialOwner);
	});
};
