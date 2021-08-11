/* global it, before */
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");
const { deploy, OPERATOR_ROLE } = require("./deploy");
const { toBytes32 } = require("./toBytes32");
const { oneHundredTokens, oneToken, zeroTokens } = require("./constants");

contract("Controller.Transfer", async (accounts) => {
	const [owner, operator1, operator2, , , someone] = accounts;

	let deployment, walletId;

	before(async () => {
		deployment = await deploy(accounts);

		const { controller } = deployment;
		walletId = toBytes32(uuid());

		await controller.newWallet(walletId, { from: operator1 });
		await controller.deposit(walletId, oneHundredTokens, {
			from: operator1,
		});
	});

	it("Should transfer to new wallet", async () => {
		const { controller } = deployment;
		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator2 });
		const result = await controller.transfer(
			walletId,
			newWalletId,
			oneToken,
			{
				from: operator1,
			}
		);
		truffleAssert.eventEmitted(result, "TransferToEvent", (ev) => {
			return (
				ev._fromUserId == walletId &&
				ev._toUserId == newWalletId &&
				ev._amt == oneToken
			);
		});
	});

	it("Should transfer to someone", async () => {
		const { controller } = deployment;
		const result = await controller.methods[
			"transfer(bytes32,address,uint256)"
		](walletId, someone, oneToken, {
			from: operator1,
		});
		truffleAssert.eventEmitted(result, "TransferToEvent", (ev) => {
			return (
				ev._fromUserId == walletId &&
				ev._toAddress == someone &&
				ev._amt == oneToken
			);
		});
	});

	it("Should fail to transfer with zero value even if funds are available", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });

		await truffleAssert.reverts(
			controller.transfer(walletId, newWalletId, zeroTokens, {
				from: operator1,
			}),
			"ERR_ZERO_VALUE"
		);
	});

	it("Should fail to transfer when called from owner", async () => {
		const { controller } = deployment;

		await truffleAssert.reverts(
			controller.transfer(walletId, walletId, oneToken, {
				from: owner,
			}),
			`AccessControl: account ${owner.toLowerCase()} is missing role ${OPERATOR_ROLE}`
		);
	});

	it("Should fail to transfer when called from someone", async () => {
		const { controller } = deployment;

		await truffleAssert.reverts(
			controller.transfer(walletId, walletId, oneToken, {
				from: someone,
			}),
			`AccessControl: account ${someone.toLowerCase()} is missing role ${OPERATOR_ROLE}`
		);
	});

	it("Should fail to transfer when receiver wallet does not exist", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid(), { from: operator1 });

		await truffleAssert.reverts(
			controller.transfer(walletId, newWalletId, oneToken),
			"ERR_USER_NOT_EXIST"
		);
	});

	it("Should fail to transfer when sender wallet does not exist", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());

		await truffleAssert.reverts(
			controller.transfer(newWalletId, walletId, oneToken),
			"ERR_USER_NOT_EXISTS"
		);
	});

	it("Should fail to transfer when no funds available", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });

		await truffleAssert.reverts(
			controller.transfer(newWalletId, newWalletId, oneToken, {
				from: operator1,
			}),
			"ERR_NO_BALANCE"
		);
	});

	it("Should transfer to new wallet and back", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });
		await controller.transfer(walletId, newWalletId, oneToken, {
			from: operator1,
		});
		await controller.transfer(newWalletId, walletId, oneToken, {
			from: operator1,
		});
	});

	it("Should fail to transfer to new wallet if paused", async () => {
		const { controller } = deployment;

		const newWalletId = toBytes32(uuid());
		await controller.newWallet(newWalletId, { from: operator1 });
		await controller.pause();
		await truffleAssert.reverts(
			controller.transfer(walletId, newWalletId, oneToken, {
				from: operator1,
			}),
			"Pausable: paused -- Reason given: Pausable: paused"
		);
	});
});
