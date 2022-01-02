/* global it, before */
const { uuid } = require("uuidv4");
const truffleAssert = require("truffle-assertions");
const { deploy } = require("./deploy");
const { toBytes32 } = require("./toBytes32");
const utils = require("web3-utils");

contract("WalletFactory", async (accounts) => {
	const [, someone] = accounts;

	let deployment;

	before(async () => {
		deployment = await deploy(accounts);
	});

	it("Should create a new wallet proxy", async () => {
		const { walletFactory } = deployment;
		const newUserId = toBytes32(uuid());
		await walletFactory.createProxiedWallet(newUserId);
	});

	it("Should create two wallets with the same user id", async () => {
		const { walletFactory } = deployment;
		const newUserId = toBytes32(uuid());
		await walletFactory.createProxiedWallet(newUserId);
		await walletFactory.createProxiedWallet(newUserId);
	});

	it("Should create a new wallet proxy from someone", async () => {
		const { walletFactory } = deployment;
		const newUserId = toBytes32(uuid());
		await walletFactory.createProxiedWallet(newUserId, { from: someone });
	});

	it("Should fail to create a new wallet proxy with no userId", async () => {
		const { walletFactory } = deployment;
		await truffleAssert.reverts(
			walletFactory.createProxiedWallet(utils.fromAscii("")),
			"ERR_NO_USER_ID"
		);
	});
});
