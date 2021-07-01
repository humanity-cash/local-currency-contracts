const utils = require("web3-utils");

module.exports.toBytes32 = (input) => {
	return utils.keccak256(input);
};
