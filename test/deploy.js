const Web3 = require("web3");
const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const Wallet = artifacts.require("Wallet");

module.exports.deploy = async () => {
	let controller, walletFactory, testToken, wallet;

	testToken = await ERC20.new("TestToken", "TT");
	wallet = await Wallet.new();
	walletFactory = await WalletFactory.new(testToken.address, wallet.address);
	controller = await Controller.new(testToken.address, walletFactory.address);

	await walletFactory.transferOwnership(controller.address);

	await testToken.mint(
		controller.address,
		Web3.utils.toWei("10000000", "ether")
	);

	return {
		wallet,
		controller,
		walletFactory,
		testToken,
	};
};
