/* global it, before */
const truffleAssert = require("truffle-assertions");
const { deploy } = require("./deploy");

contract("Versions", async () => {
	let deployment;

	before(async () => {
		deployment = await deploy();
	});

	it("Should read version numbers of all deployed contracts", async () => {
		const { controller, walletFactory, wallet } = deployment;
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
