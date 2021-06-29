const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { deploy } = require("./deploy");
const { toBytes32 } = require("./toBytes32");
const utils = require("web3-utils");

contract("Controller.Transfer", async (accounts) => {
	const [, someone] = accounts;

	let controller, walletFactory, testToken, userId;

	before(async () => {
		let deployment = await deploy();

		controller = deployment.controller;
		walletFactory = deployment.walletFactory;
		testToken = deployment.testToken;

		userId = toBytes32(uuid());
		await controller.newWallet(userId);

		await testToken.mint(
			await controller.getWalletAddress(userId),
			utils.toWei("100", "ether")
		);
	});

	it("Should transfer to new wallet", async () => {
		const userId2 = toBytes32(uuid());
		await controller.newWallet(userId2);

		await controller.transferTo(userId, userId2, utils.toWei("1", "ether"));
	});

	it("Should fail to transfer when called from someone", async () => {
		await truffleAssert.reverts(
			controller.transferTo(userId, userId, utils.toWei("1", "ether"), {
				from: someone,
			}),
			"Ownable: caller is not the owner"
		);
	});

	it("Should fail to transfer when receiver wallet does not exist", async () => {
		const userId2 = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.transferTo(userId, userId2, utils.toWei("1", "ether")),
			"ERR_USER_NOT_EXIST"
		);
	});

	it("Should fail to transfer when sender wallet does not exist", async () => {
		const userId2 = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.transferTo(userId2, userId, utils.toWei("1", "ether")),
			"ERR_USER_NOT_EXISTS"
		);
	});

	it("Should fail to transfer when no funds available", async () => {
		const userId2 = toBytes32(uuid());
		await controller.newWallet(userId2);

		await truffleAssert.reverts(
			controller.transferTo(userId2, userId2, utils.toWei("1", "ether")),
			"ERR_NO_BALANCE"
		);
	});

	it("Should transfer to new wallet and back", async () => {
		const userId2 = toBytes32(uuid());
		await controller.newWallet(userId2);

		await controller.transferTo(userId, userId2, utils.toWei("1", "ether"));

		await controller.transferTo(userId2, userId, utils.toWei("1", "ether"));
	});
});
