const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const Wallet = artifacts.require("Wallet");
const UBIReconciliationAccount = artifacts.require("UBIReconciliationAccount");
const truffleAssert = require("truffle-assertions");

contract("Versions", async (accounts) => {
	let controller, factory, wallet, reconciler;

	before(async () => {
		wallet = await Wallet.deployed();
		reconciler = await UBIReconciliationAccount.deployed();
		controller = await Controller.deployed();
		factory = await WalletFactory.deployed();
	});

	it("Should read version numbers of all deployed contracts", async () => {
		await truffleAssert.passes(
			console.log(
				`Controller version: ${JSON.stringify(
					await controller.getVersionNumber()
				)}`
			),
			console.log(
				`Factory version: ${JSON.stringify(
					await factory.getVersionNumber()
				)}`
			),
			console.log(
				`Wallet version: ${JSON.stringify(
					await wallet.getVersionNumber()
				)}`
			),
			console.log(
				`UBIReconciliationAccount version: ${JSON.stringify(
					await reconciler.getVersionNumber()
				)}`
			),
			"All version numbers should be retrieved"
		);
	});
});
