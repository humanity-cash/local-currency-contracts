const Web3 = require("web3");
const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const Wallet = artifacts.require("Wallet");

module.exports.deploy = async () => {
	let controller, factory, testToken;

	testToken = await ERC20.new("TestToken", "TT");

	let wallet = await Wallet.deployed();

	factory = await WalletFactory.new(wallet.address, testToken.address);

	controller = await Controller.new(testToken.address, factory.address);

	await factory.transferOwnership(controller.address);

	await testToken.mint(
		controller.address,
		Web3.utils.toWei("10000000", "ether")
	);

	return {
		wallet,
		controller,
		factory,
		testToken,
	};
};
