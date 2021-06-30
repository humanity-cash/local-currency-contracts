/* global it, before */
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { deploy } = require("./deploy");
const { toBytes32 } = require("./toBytes32");
const { oneHundredTokens, oneToken, zeroTokens } = require("./constants");

contract("Controller.Transfer", async (accounts) => {
	const [, someone] = accounts;

	let deployment, walletId;

	before(async () => {
		deployment = await deploy();

		const { controller, token } = deployment;
		walletId = toBytes32(uuid());
		await controller.newWallet(walletId);

		await token.mint(
			await controller.getWalletAddress(walletId),
			oneHundredTokens
		);
	});

	it("Should transfer to new wallet", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId);

		await controller.transferTo(walletId, newWalletId, oneToken);
	});

	it("Should fail to transfer with zero value even if funds are available", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId);

		await truffleAssert.reverts(
			controller.transferTo(walletId, newWalletId, zeroTokens),
			"ERR_ZERO_VALUE"
		);
	});

	it("Should fail to transfer when called from someone", async () => {
		const { controller } = deployment;

		await truffleAssert.reverts(
			controller.transferTo(walletId, walletId, oneToken, {
				from: someone,
			}),
			"Ownable: caller is not the owner"
		);
	});

	it("Should fail to transfer when receiver wallet does not exist", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.transferTo(walletId, newWalletId, oneToken),
			"ERR_USER_NOT_EXIST"
		);
	});

	it("Should fail to transfer when sender wallet does not exist", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.transferTo(newWalletId, walletId, oneToken),
			"ERR_USER_NOT_EXISTS"
		);
	});

	it("Should fail to transfer when no funds available", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId);

		await truffleAssert.reverts(
			controller.transferTo(newWalletId, newWalletId, oneToken),
			"ERR_NO_BALANCE"
		);
	});

	it("Should transfer to new wallet and back", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId);
		await controller.transferTo(walletId, newWalletId, oneToken);
		await controller.transferTo(newWalletId, walletId, oneToken);
	});

	it("Should fail to transfer to new wallet if paused", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId);
		await controller.pause();
		await truffleAssert.reverts(
			controller.transferTo(walletId, newWalletId, oneToken),
			"Pausable: paused -- Reason given: Pausable: paused"
		);
	});
});
