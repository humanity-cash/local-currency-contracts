const utils = require("web3-utils");

module.exports.zeroTokens = utils.toWei("0", "ether");
module.exports.oneToken = utils.toWei("1", "ether");
module.exports.oneHundredTokens = utils.toWei("100", "ether");
