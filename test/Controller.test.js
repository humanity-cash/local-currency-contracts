const Controller = artifacts.require("Controller");
const WalletFactory = artifacts.require("WalletFactory");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const Wallet = artifacts.require("Wallet");
const UBIReconciliationAccount = artifacts.require("UBIReconciliationAccount");
const Web3 = require("web3");
const config = require("./config.json");
const truffleAssert = require("truffle-assertions");
const { uuid } = require("uuidv4");

contract("Controller", async (accounts) => {
	const owner = accounts[0];

	let controller, factory, cUSDTestToken, cUBIAuthToken;

	before(async () => {
		cUSDTestToken = await ERC20.new("cUSD", "cUSD");
		cUBIAuthToken = await ERC20.new(
			"Celo UBI Authorization Token",
			"cUBIAUTH"
		);

		ubiLogic = await Wallet.deployed();
		reconcileLogic = await UBIReconciliationAccount.deployed();

		factory = await WalletFactory.new(
			ubiLogic.address,
			reconcileLogic.address,
			cUSDTestToken.address,
			cUBIAuthToken.address
		);

		controller = await Controller.new(
			cUSDTestToken.address,
			cUBIAuthToken.address,
			factory.address,
			config.custodianAccount
		);

		await factory.transferOwnership(controller.address);

		await cUBIAuthToken.grantRole(
			Web3.utils.keccak256("DEFAULT_ADMIN_ROLE"),
			controller.address
		);
		await cUBIAuthToken.grantRole(
			Web3.utils.keccak256("MINTER_ROLE"),
			controller.address
		);

		result = await cUSDTestToken.mint(
			controller.address,
			Web3.utils.toWei("10000000", "ether")
		);
	});

	it("Should read public attributes for important internal addresses", async () => {
		const cUSDToken = await controller.cUSDToken();
		assert(cUSDToken);

		const cUBIAuthToken = await controller.cUBIAuthToken();
		assert(cUBIAuthToken);

		const reconciliationAccount = await controller.reconciliationAccount();
		assert(reconciliationAccount);
	});

	it("Should have an owner matching the deployer address", async () => {
		const contractOwner = await controller.owner();
		assert.equal(owner, contractOwner, `Owner should be ${owner}`);
	});

	it("Should be able to update custodian account", async () => {
		await controller.setCustodian(config.updateCustodianAccount);
	});

	it("Should be able to update factory", async () => {
		const factory = await controller.walletFactory();
		await controller.setUBIBeneficiaryFactory(factory);
	});

	it("Should be able to read and update disbursement amount", async () => {
		let expected = Web3.utils.toWei("100", "ether");
		let disbursementWei = await controller.disbursementWei();
		assert(expected == disbursementWei);

		await controller.setDisbursementWei(Web3.utils.toWei("150", "ether"));
		expected = Web3.utils.toWei("150", "ether");
		disbursementWei = await controller.disbursementWei();
		assert(expected == disbursementWei);
	});

	it("Should be able to pause", async () => {
		await controller.pause();
	});

	it("Should be able to unpause", async () => {
		await controller.unpause();
	});

	it("Should be able to update beneficiary proxy logic contract after creating 3 new accounts", async () => {
		const newLogic = await Wallet.new();
		await controller.newUbiBeneficiary(uuid());
		await controller.newUbiBeneficiary(uuid());
		await controller.newUbiBeneficiary(uuid());
		await controller.updateBeneficiaryImplementation(newLogic.address);
	});

	it("Should be able to update reconciler proxy logic contract", async () => {
		const newLogic = await UBIReconciliationAccount.new();
		await controller.updateReconciliationImplementation(newLogic.address);
	});

	it("Should be able to update the factory and create a new user", async () => {
		const newFactory = await WalletFactory.new(
			ubiLogic.address,
			reconcileLogic.address,
			cUSDTestToken.address,
			cUBIAuthToken.address
		);
		await controller.setUBIBeneficiaryFactory(newFactory.address);
		await controller.newUbiBeneficiary(uuid());
	});

	it("Should be able to emergency withdraw after pausing", async () => {
		const controllerBalanceOf = await cUSDTestToken.balanceOf(
			controller.address
		);

		await controller.pause();
		await controller.withdrawToCustodian();
		await controller.unpause();

		const controllerBalanceOfNew = await cUSDTestToken.balanceOf(
			controller.address
		);
		const custodianBalanceOf = await cUSDTestToken.balanceOf(
			config.updateCustodianAccount
		); // custodian had previously been updated

		assert.equal(
			custodianBalanceOf.cmp(controllerBalanceOf),
			0,
			`Custodian cUSD balance should be ${controllerBalanceOf}`
		);
		assert.equal(
			controllerBalanceOfNew,
			0,
			`UBI Controller cUSD balance should be ${0}`
		);
	});

	it("Should be able to transfer ownership", async () => {
		// Re-mint some cUSD test token to continue testing
		await cUSDTestToken.mint(
			controller.address,
			Web3.utils.toWei("10000000", "ether")
		);
		let user1 = uuid();
		let user2 = uuid();
		let user3 = uuid();

		await controller.newUbiBeneficiary(user1);
		await controller.newUbiBeneficiary(user2);
		await controller.newUbiBeneficiary(user3);

		await controller.transferOwnership(accounts[1]);
		const contractOwner = await controller.owner();
		assert.equal(
			accounts[1],
			contractOwner,
			`Owner should now be ${accounts[1]}`
		);
	});

	it("Should not be able to update custodian account after transferring ownership", async () => {
		await truffleAssert.fails(
			controller.setCustodian(config.updateCustodianAccount),
			truffleAssert.ErrorType.REVERT
		);
	});
});
