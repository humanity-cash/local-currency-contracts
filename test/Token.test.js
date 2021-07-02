/* global it, before */
const { deploy } = require("./deploy");
const utils = require("web3-utils");

contract("Token", async (accounts) => {
	const [owner] = accounts;

	let deployment;

	const MINTER_ROLE = utils.keccak256("MINTER_ROLE");
	const PAUSER_ROLE = utils.keccak256("PAUSER_ROLE");

	before(async () => {
		deployment = await deploy();
	});

	it("Should have the right minter roles", async () => {
		const { token, controller } = deployment;
		const count = await token.getRoleMemberCount(MINTER_ROLE);

		assert.equal(count, 2);

		const minters = [];
		for (let i = 0; i < count; i++) {
			minters.push(await token.getRoleMember(MINTER_ROLE, i));
		}

		assert.equal(minters[0], owner);
		assert.equal(minters[1], controller.address);
	});

	it("Should have the right pauser roles", async () => {
		const { token } = deployment;
		const count = await token.getRoleMemberCount(PAUSER_ROLE);

		assert.equal(count, 1);

		const pauser = [];
		for (let i = 0; i < count; i++) {
			pauser.push(await token.getRoleMember(PAUSER_ROLE, i));
		}

		assert.equal(pauser[0], owner);
	});
});
