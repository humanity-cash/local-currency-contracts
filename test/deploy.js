const utils = require("web3-utils");
const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const Token = artifacts.require("Token");
const Wallet = artifacts.require("Wallet");

module.exports.deploy = async () => {
	let controller, walletFactory, testToken, wallet;

	testToken = await Token.new("TestToken", "TT");
	wallet = await Wallet.new();
	walletFactory = await WalletFactory.new(testToken.address, wallet.address);
	controller = await Controller.new(testToken.address, walletFactory.address);

	await walletFactory.transferOwnership(controller.address);

	await testToken.grantRole(utils.toHex("MINTER_ROLE"), controller.address);

	return {
		wallet,
		controller,
		walletFactory,
		testToken,
	};
};
