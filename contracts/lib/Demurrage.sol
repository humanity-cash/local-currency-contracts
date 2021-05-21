// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ABDKMath64x64.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library Demurrage {
    using SafeMath for uint256;

    struct Parameters {
        uint256 blocksInEpoch;
        uint256 freeEpochs;
        uint256 freeBlocks;
        uint256 ratioNumerator;
        uint256 ratioDenominator;
        uint256 lastCalculatedAtBlock;
    }

    /**
     * @notice Returns the storage, major, minor, and patch version of the contract.
     * @return The storage, major, minor, and patch version of the contract.
     */
    function getVersionNumber()
        external
        pure
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (1, 2, 0, 0);
    }

    /**
     * @notice Mathematical function to calculate negatively compounding interest (demurrage charge)
     *
     * @param _principle Principle amount to calculate demurrage for, in wei
     * @param _ratioNumerator Numerator of compounding ratio, e.g. if the demurrage rate is .01 (1/100), numerator == 1
     * @param _ratioDenominator Denominator of the compounding ratio, e.g. if the demurrage rate is .01 (1/100), denominator == 100
     * @param _compoundingPeriods Number of compounding periods
     *
     * @dev This follows a standard compounding formula of FV(future value) = PV (present value) * (1  + ratio ) ^ N
     * @dev In this function however, the ratio is always intended to be a charge, and thus ( 1 - ratio ) in the brackets
     * @dev ABDK Math 64.64 Smart Contract Library.  Copyright © 2019 by ABDK Consulting.
     *
     * @return Returns the reduced principle from a compounding negative interest charge
     */
    function compoundDemurrage(
        uint256 _principle,
        uint256 _ratioNumerator,
        uint256 _ratioDenominator,
        uint256 _compoundingPeriods
    ) public pure returns (uint256) {
        uint256 result =
            ABDKMath64x64.mulu(
                ABDKMath64x64.pow(
                    ABDKMath64x64.sub(
                        ABDKMath64x64.fromUInt(1),
                        ABDKMath64x64.divu(_ratioNumerator, _ratioDenominator)
                    ),
                    _compoundingPeriods
                ),
                _principle
            );
        return _principle.sub(result);
    }
}
