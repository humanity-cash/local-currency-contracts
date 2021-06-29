const utils = require("web3-utils");
const truffleAssert = require("truffle-assertions");
const { toBytes32 } = require("./toBytes32");
const { uuid } = require("uuidv4");
const { deploy } = require("./deploy");

contract("Controller.Deposit", async (accounts) => {
	const [owner, someone] = accounts;

	let controller, walletFactory, testToken, wallet;

	before(async () => {
		let deployment = await deploy();

		wallet = deployment.wallet;
		controller = deployment.controller;
		walletFactory = deployment.walletFactory;
		testToken = deployment.testToken;
	});

	it("Should be able to deposit", async () => {
		let user = toBytes32(uuid());
		await controller.newWallet(user);

		await controller.deposit(user, utils.toWei("1", "ether"));

		console.log((await controller.balanceOfWallet(user)).toString());
	});

	it("Should fail to deposit from someone", async () => {
		let user = toBytes32(uuid());
		await controller.newWallet(user);

		await truffleAssert.reverts(
			controller.deposit(user, utils.toWei("1", "ether"), {
				from: someone,
			}),
			"Ownable: caller is not the owner"
		);
	});

	it("Should fail to deposit to unknown wallet", async () => {
		let user = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.deposit(user, utils.toWei("1", "ether")),
			"ERR_USER_NOT_EXISTS"
		);
	});
});
