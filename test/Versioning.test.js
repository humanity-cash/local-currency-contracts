const truffleAssert = require("truffle-assertions");
const { deploy } = require("./deploy");

contract("Versions", async (accounts) => {
	let controller, walletFactory, wallet;

	before(async () => {
		let deployment = await deploy();

		wallet = deployment.wallet;
		controller = deployment.controller;
		walletFactory = deployment.walletFactory;
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
					await walletFactory.getVersionNumber()
				)}`
			),
			console.log(
				`Wallet version: ${JSON.stringify(
					await wallet.getVersionNumber()
				)}`
			),
			"All version numbers should be retrieved"
		);
	});
});
