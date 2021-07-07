/* global it, before */
const { uuid } = require("uuidv4");
const { toBytes32 } = require("./toBytes32");
const truffleAssert = require("truffle-assertions");
const { oneToken, zeroTokens } = require("./constants");
const { deploy } = require("./deploy");

contract("Controller.Pause", async (accounts) => {
	const [, operator1, , , , someone, user1, user2] = accounts;

	let deployment;

	before(async () => {
		deployment = await deploy(accounts);
	});

	it("Should be able to pause", async () => {
		const { controller } = deployment;
		await controller.pause();
	});

	it("Should fail to pause when paused", async () => {
		const { controller } = deployment;
		await truffleAssert.reverts(controller.pause(), "Pausable: paused");
	});

	it("Should be able to transfer tokens even when controller is paused", async () => {
		const { controller, token } = await deploy(accounts);

		const tmpUser = toBytes32(uuid());
		await controller.newWallet(tmpUser, { from: operator1 });
		await controller.deposit(tmpUser, oneToken, { from: operator1 });
		await controller.methods["transfer(bytes32,address,uint256)"](
			tmpUser,
			user1,
			oneToken,
			{ from: operator1 }
		);
		await token.transfer(user2, oneToken, { from: user1 });
		await token.transfer(user1, oneToken, { from: user2 });
	});

	it("Should be able to unpause", async () => {
		const { controller } = deployment;
		await controller.unpause();
	});

	it("Should fail to unpause when not paused", async () => {
		const { controller } = deployment;
		await truffleAssert.reverts(
			controller.unpause(),
			"Pausable: not paused"
		);
	});

	it("Should be able to emergency withdraw after pausing", async () => {
		const { controller, token } = await deploy(accounts);

		const tmpUser = toBytes32(uuid());
		await controller.newWallet(tmpUser, { from: operator1 });
		await controller.deposit(tmpUser, oneToken, { from: operator1 });
		await controller.methods["transfer(bytes32,address,uint256)"](
			tmpUser,
			controller.address,
			oneToken,
			{ from: operator1 }
		);

		const controllerBalanceOfOld = await token.balanceOf(
			controller.address
		);

		assert.equal(
			controllerBalanceOfOld.toString(),
			oneToken,
			`Walllet token balance should be ${oneToken}`
		);
		await controller.pause();
		await controller.withdrawToOwner();
		await controller.unpause();

		const controllerBalanceOfNew = await token.balanceOf(
			controller.address
		);

		assert.equal(
			controllerBalanceOfNew.toString(),
			zeroTokens,
			`Walllet token balance should be ${zeroTokens}`
		);
	});

	it("Should fail to emergency withdraw when called from someone", async () => {
		const { controller } = await deploy(accounts);
		await controller.pause();
		await truffleAssert.reverts(
			controller.withdrawToOwner({ from: someone }),
			"Ownable: caller is not the owner."
		);
	});

	it("Should fail to emergency withdraw when not paused", async () => {
		const { controller } = deployment;
		await truffleAssert.reverts(
			controller.withdrawToOwner(),
			"Pausable: not paused"
		);
	});
});
