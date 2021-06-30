/* global it, before */
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { oneToken, zeroTokens } = require("./constants");
const { toBytes32 } = require("./toBytes32");
const { deploy } = require("./deploy");

contract("Controller.Deposit", async (accounts) => {
	const [, someone] = accounts;

	let deployment;

	before(async () => {
		deployment = await deploy();
	});

	it("Should be able to deposit", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user);

		await controller.deposit(user, oneToken);

		console.log((await controller.balanceOfWallet(user)).toString());
	});

	it("Should fail to deposit from someone", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());
		await controller.newWallet(user);

		await truffleAssert.reverts(
			controller.deposit(user, oneToken, {
				from: someone,
			}),
			"Ownable: caller is not the owner"
		);
	});

	it("Should fail to deposit zero", async () => {
		const { controller } = deployment;

		let newUserId = toBytes32(uuid());
		await controller.newWallet(newUserId);

		await truffleAssert.reverts(
			controller.deposit(newUserId, zeroTokens),
			"ERR_ZERO_VALUE"
		);
	});

	it("Should fail to deposit to unknown wallet", async () => {
		const { controller } = deployment;

		let user = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.deposit(user, oneToken),
			"ERR_USER_NOT_EXISTS"
		);
	});

	it("Should fail to deposit when paused", async () => {
		const { controller } = deployment;

		let newUserId = toBytes32(uuid());
		await controller.newWallet(newUserId);
		await controller.pause();

		await truffleAssert.reverts(
			controller.deposit(newUserId, oneToken),
			"Pausable: paused"
		);
	});
});