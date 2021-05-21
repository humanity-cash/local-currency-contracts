const advanceTimeAndBlock = async (time) => {
	await advanceTime(time);
	await advanceBlock();
	return Promise.resolve(web3.eth.getBlock("latest"));
};
module.exports.advanceTimeAndBlock = advanceTimeAndBlock;

const advanceTime = (time) => {
	return new Promise((resolve, reject) => {
		web3.currentProvider.send(
			{
				jsonrpc: "2.0",
				method: "evm_increaseTime",
				params: [time],
				id: new Date().getTime(),
			},
			(err, result) => {
				if (err) {
					return reject(err);
				}
				return resolve(result);
			}
		);
	});
};
module.exports.advanceTime = advanceTime;

const advanceBlock = () => {
	return new Promise((resolve, reject) => {
		web3.currentProvider.send(
			{
				jsonrpc: "2.0",
				method: "evm_mine",
				id: new Date().getTime(),
			},
			(err, result) => {
				if (err) {
					return reject(err);
				}
				const newBlockHash = web3.eth.getBlock("latest").hash;

				return resolve(newBlockHash);
			}
		);
	});
};
module.exports.advanceBlock = advanceBlock;

module.exports.advanceTimeAndBlockNTimes = async (n, epochSize) => {
	// console.log(`Time travelling ${n} blocks with epoch size ${epochSize}`);
	for (let i = 0; i < n; i++) {
		const newBlock = await advanceTimeAndBlock();
		// if((newBlock.number % epochSize) === 0)
		//     console.log(`Block ${newBlock.number}, hash ${newBlock.hash}, epoch ${Math.round(newBlock.number/epochSize)}`);
	}
};
