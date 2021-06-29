const { deploy } = require("./deploy");

contract("Controller.Pause", async (accounts) => {
	const [owner, someone] = accounts;

	let controller, walletFactory, testToken, wallet;

	before(async () => {
		let deployment = await deploy();

		wallet = deployment.wallet;
		controller = deployment.controller;
		walletFactory = deployment.walletFactory;
		testToken = deployment.testToken;
	});

	it("Should be able to pause", async () => {
		await controller.pause();
	});

	it("Should be able to unpause", async () => {
		await controller.unpause();
	});

	it("Should be able to emergency withdraw after pausing", async () => {
		await controller.pause();
		await controller.withdrawToOwner();
		await controller.unpause();

		const controllerBalanceOfNew = await testToken.balanceOf(
			controller.address
		);

		assert.equal(
			controllerBalanceOfNew,
			0,
			`Walllet token balance should be ${0}`
		);
	});
});
