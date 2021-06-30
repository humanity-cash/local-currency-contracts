/* global it, before */
const { deploy } = require("./deploy");

contract("Controller.Pause", async () => {
	let deployment;

	before(async () => {
		deployment = await deploy();
	});

	it("Should be able to pause", async () => {
		const { controller } = deployment;
		await controller.pause();
	});

	it("Should be able to unpause", async () => {
		const { controller } = deployment;
		await controller.unpause();
	});

	it("Should be able to emergency withdraw after pausing", async () => {
		const { controller, token } = deployment;
		await controller.pause();
		await controller.withdrawToOwner();
		await controller.unpause();

		const controllerBalanceOfNew = await token.balanceOf(
			controller.address
		);

		assert.equal(
			controllerBalanceOfNew,
			0,
			`Walllet token balance should be ${0}`
		);
	});
});
