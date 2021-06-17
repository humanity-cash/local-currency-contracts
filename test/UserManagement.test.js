const Controller = artifacts.require("Controller");
const Factory = artifacts.require("UBIBeneficiaryFactory");
const ERC20 = artifacts.require("ERC20PresetMinterPauser");
const UBIBeneficiary = artifacts.require("UBIBeneficiary");
const UBIReconciliationAccount = artifacts.require("UBIReconciliationAccount");
const Web3 = require("web3");
const truffleAssert = require("truffle-assertions");
const config = require("./config.json");
const { uuid } = require("uuidv4");

contract("User Management", async (accounts) => {
	let controller,
		disbursementWei,
		cUSDMinted,
		user1,
		factory,
		cUSDTestToken,
		cUBIAuthToken;

	before(async () => {
		cUSDTestToken = await ERC20.new("cUSD", "cUSD");
		cUBIAuthToken = await ERC20.new(
			"Celo UBI Authorization Token",
			"cUBIAUTH"
		);

		ubiLogic = await UBIBeneficiary.deployed();
		reconcileLogic = await UBIReconciliationAccount.deployed();

		factory = await Factory.new(
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

		cUSDMinted = await cUSDTestToken.balanceOf(controller.address);
	});

	it("Should verify Controller contract has cUSD balance", async () => {
		const balance = await cUSDTestToken.balanceOf(controller.address);
		assert(balance > 0);
	});

	it("Should verify Controller has disbursementWei public attribute", async () => {
		disbursementWei = await controller.disbursementWei();
		assert(disbursementWei > 0);
	});

	it("Should create a new user with cUSD balance of disbursementWei", async () => {
		user1 = uuid();
		await controller.newUbiBeneficiary(user1);

		const user1Bytes32 = Web3.utils.keccak256(user1);
		const address = await controller.beneficiaryAddress(user1Bytes32);
		assert(address > 0x0);

		const userBalance = await cUSDTestToken.balanceOf(address);
		assert.equal(
			userBalance.cmp(disbursementWei),
			0,
			`UBI Beneficiary cUSD balance should be ${disbursementWei}`
		);
	});

	it("Should verify Controller cUSD balance is reduced by disbursementWei", async () => {
		const balance = await cUSDTestToken.balanceOf(controller.address);
		assert.equal(
			balance.cmp(cUSDMinted.sub(disbursementWei)),
			0,
			`Controller contract cUSD balance should be ${cUSDMinted.sub(
				disbursementWei
			)}`
		);
	});

	it("Should not create a user that already exists", async () => {
		await truffleAssert.fails(
			controller.newUbiBeneficiary(user1),
			truffleAssert.ErrorType.REVERT
		);
	});

	it("Should create three more users and count a total", async () => {
		user1 = uuid();
		await controller.newUbiBeneficiary(user1);

		user2 = uuid();
		await controller.newUbiBeneficiary(user2);

		user3 = uuid();
		await controller.newUbiBeneficiary(user3);

		const beneficiaryCount = await controller.getBeneficiaryCount();
		assert(beneficiaryCount == 4);
	});

	it("Should iterate the users", async () => {
		const beneficiaryCount = await controller.getBeneficiaryCount();

		let users = [];
		for (let i = 0; i < beneficiaryCount; i++) {
			const address = await controller.getBeneficiaryAddressAtIndex(i);
			const ubi = new web3.eth.Contract(UBIBeneficiary.abi, address);
			const userId = await ubi.methods.userId().call();
			const createdBlock = await ubi.methods.createdBlock().call();
			users.push({
				userId: userId,
				address: address,
				createdBlock: createdBlock,
			});
		}
		// console.log(users);
		assert(users);
		assert(users.length == 4);
	});
});
