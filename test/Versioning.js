const UBIController = artifacts.require("UBIController");
const Factory = artifacts.require("UBIBeneficiaryFactory");
const Demurrage = artifacts.require("Demurrage");
const UBIBeneficiary = artifacts.require("UBIBeneficiary");
const UBIReconciliationAccount = artifacts.require("UBIReconciliationAccount");
const truffleAssert = require("truffle-assertions");

contract("Versions", async (accounts) => {
	let controller, factory, demurrage, beneficiary, reconciler;

	before(async () => {
		beneficiary = await UBIBeneficiary.deployed();
		reconciler = await UBIReconciliationAccount.deployed();
		controller = await UBIController.deployed();
		factory = await Factory.deployed();
		demurrage = await Demurrage.deployed();
	});

	it("Should read version numbers of all deployed contracts", async () => {
		await truffleAssert.passes(
			console.log(
				`UBIController version: ${JSON.stringify(
					await controller.getVersionNumber()
				)}`
			),
			console.log(
				`Factory version: ${JSON.stringify(
					await factory.getVersionNumber()
				)}`
			),
			console.log(
				`Demurrage version: ${JSON.stringify(
					await demurrage.getVersionNumber()
				)}`
			),
			console.log(
				`UBIBeneficiary version: ${JSON.stringify(
					await beneficiary.getVersionNumber()
				)}`
			),
			console.log(
				`UBIReconciliationAccount version: ${JSON.stringify(
					await reconciler.getVersionNumber()
				)}`
			),
			"All version numbers should be retrieved"
		);
	});
});
