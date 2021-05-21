// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "../contracts/lib/Demurrage.sol";

contract TestDemurrage {

    uint256 randNonce = 0;
    
    // Defining a function to generate  a random number 
    function randMod(uint256 _modulus) internal returns(uint256)  
    {    
        randNonce++;   
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender,randNonce))) % _modulus; 
    } 

    function testKnownParameters1() public {
        
        // Demurrage = 1000 - 1000*(1-(1/100))^72 ~= 515.0086297

        uint256 _principle = 1000 ether;
        uint256 _ratioNumerator = 1;
        uint256 _ratioDenominator = 100;
        uint256 _compoundingPeriods = 72;

        uint256 actual = Demurrage.compoundDemurrage(_principle, _ratioNumerator, _ratioDenominator, _compoundingPeriods);

        uint256 minimum = 515008629700000000000;
        uint256 maximum = 515010000000000000000;

        Assert.isAtLeast(actual, minimum, "Actual value below minimum");
        Assert.isBelow(actual, maximum, "Actual value above maximum");
    }

    function testKnownParameters2() public {
        
        // Demurrage = 100000 - 100000*(1-(2/100))^44~ = 58890.01385

        uint256 _principle = 100000 ether;
        uint256 _ratioNumerator = 2;
        uint256 _ratioDenominator = 100;
        uint256 _compoundingPeriods = 44;

        uint256 actual = Demurrage.compoundDemurrage(_principle, _ratioNumerator, _ratioDenominator, _compoundingPeriods);
        
        uint256 minimum = 58890000000000000000000;
        uint256 maximum = 58890020000000000000000;

        Assert.isAtLeast(actual, minimum, "Actual value below minimum");
        Assert.isBelow(actual, maximum, "Actual value above maximum");
    }

    function testRandomParameters() public {
        uint8 i;
        for (i = 0; i < 20; i++) {
            uint256 _principle = (randMod(4) + 1) * 10**18; // number betwen 1-10000 converted to wei
            uint256 _ratioNumerator = randMod(1) + 1; // number between 1-10
            uint256 _ratioDenominator = randMod(3) + 1; // number between 1-1000
            uint256 _compoundingPeriods = randMod(3) + 1; // number between 1-1000
            uint256 result = Demurrage.compoundDemurrage(_principle, _ratioNumerator, _ratioDenominator, _compoundingPeriods);
            Assert.isNotZero(result, "Result should not be zero");
        }
    }
}