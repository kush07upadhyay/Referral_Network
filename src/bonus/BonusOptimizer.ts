import { NetworkGrowthSimulation } from '../sim/Simulation';

/**
 * Adoption probability function type
 * Must be monotonically increasing: higher bonus never results in lower probability
 */
export type AdoptionProbFunction = (bonus: number) => number;

/**
 * Referral Bonus Optimization
 * 
 * Finds minimum bonus (in $10 increments) required to achieve hiring target
 * Uses binary search over bonus values with simulation-based evaluation
 */
export class BonusOptimizer {
  /**
   * Find minimum bonus to achieve target hires within specified timeframe
   * 
   * Algorithm: Binary search over bonus values
   * 1. Check if target achievable with zero bonus
   * 2. Find upper bound where target is definitely achievable
   * 3. Binary search between bounds using eps precision
   * 4. Round up to nearest $10 and verify
   * 
   * Time Complexity: O(days * log(maxBonus/eps))
   * - Each simulation is O(days * capacity) = O(days)
   * - Binary search requires O(log(range/eps)) iterations
   * 
   * @param days Number of days available
   * @param targetHires Target number of hires (cumulative referrals)
   * @param adoptionProb Function mapping bonus amount to adoption probability
   * @param eps Precision for binary search convergence
   * @returns Minimum bonus (rounded up to nearest $10) or null if impossible
   */
  static minBonusForTarget(
    days: number,
    targetHires: number,
    adoptionProb: AdoptionProbFunction,
    eps: number = 1e-3
  ): number | null {
    if (days <= 0 || targetHires <= 0) {
      return 0;
    }

    // Step 1: Check if achievable with zero bonus
    const zeroProb = adoptionProb(0);
    const zeroResult = NetworkGrowthSimulation.simulate(zeroProb, days);
    const zeroFinal = zeroResult.length > 0 ? zeroResult[zeroResult.length - 1] : 0;
    
    if (zeroFinal >= targetHires) {
      return 0;
    }

    // Step 2: Find upper bound where target is achievable
    let maxBonus = 10; // Start with $10
    while (maxBonus <= 10000) { // Reasonable upper limit
      const prob = adoptionProb(maxBonus);
      
      // If probability approaches 1, this should be our upper bound
      if (prob >= 0.999) {
        const result = NetworkGrowthSimulation.simulate(prob, days);
        const final = result.length > 0 ? result[result.length - 1] : 0;
        if (final >= targetHires) {
          break;
        } else {
          // Even with near-perfect adoption, target not reachable
          return null;
        }
      }

      // Test current bonus level
      const result = NetworkGrowthSimulation.simulate(prob, days);
      const final = result.length > 0 ? result[result.length - 1] : 0;
      
      if (final >= targetHires) {
        break;
      }
      
      maxBonus *= 2; // Double the bonus to find upper bound
    }

    if (maxBonus > 10000) {
      // Even with very high bonus, target not achievable
      return null;
    }

    // Step 3: Binary search for minimum bonus
    let low = 0;
    let high = maxBonus;
    
    while (high - low > eps) {
      const mid = (low + high) / 2;
      const prob = adoptionProb(mid);
      const result = NetworkGrowthSimulation.simulate(prob, days);
      const final = result.length > 0 ? result[result.length - 1] : 0;
      
      if (final >= targetHires) {
        high = mid;
      } else {
        low = mid;
      }
    }

    // Step 4: Round up to nearest $10 and verify
    const rawMinBonus = high;
    const roundedBonus = Math.ceil(rawMinBonus / 10) * 10;
    
    // Verify that rounded bonus actually achieves target
    const finalProb = adoptionProb(roundedBonus);
    const finalResult = NetworkGrowthSimulation.simulate(finalProb, days);
    const finalHires = finalResult.length > 0 ? finalResult[finalResult.length - 1] : 0;
    
    if (finalHires >= targetHires) {
      return roundedBonus;
    } else {
      // If rounded value doesn't work, try next $10 increment
      const nextBonus = roundedBonus + 10;
      const nextProb = adoptionProb(nextBonus);
      const nextResult = NetworkGrowthSimulation.simulate(nextProb, days);
      const nextHires = nextResult.length > 0 ? nextResult[nextResult.length - 1] : 0;
      
      return nextHires >= targetHires ? nextBonus : null;
    }
  }

  /**
   * Analyze bonus sensitivity: how hiring results change with bonus amount
   * Useful for understanding the bonus-outcome relationship
   * 
   * @param days Number of days
   * @param adoptionProb Adoption probability function
   * @param bonusRange Array of bonus values to test
   * @returns Array of {bonus, probability, hires} results
   */
  static analyzeBonusSensitivity(
    days: number,
    adoptionProb: AdoptionProbFunction,
    bonusRange: number[]
  ): Array<{ bonus: number; probability: number; hires: number }> {
    return bonusRange.map(bonus => {
      const probability = adoptionProb(bonus);
      const result = NetworkGrowthSimulation.simulate(probability, days);
      const hires = result.length > 0 ? result[result.length - 1] : 0;
      
      return { bonus, probability, hires };
    });
  }

  /**
   * Create common adoption probability functions for testing
   */
  static createAdoptionFunctions() {
    return {
      /**
       * Linear adoption: probability increases linearly with bonus
       * p = min(1, bonus / maxBonus)
       */
      linear: (maxBonus: number = 100): AdoptionProbFunction => {
        return (bonus: number) => Math.min(1, bonus / maxBonus);
      },

      /**
       * Logistic adoption: S-curve relationship
       * p = 1 / (1 + exp(-k * (bonus - midpoint)))
       */
      logistic: (midpoint: number = 50, steepness: number = 0.1): AdoptionProbFunction => {
        return (bonus: number) => 1 / (1 + Math.exp(-steepness * (bonus - midpoint)));
      },

      /**
       * Square root adoption: diminishing returns
       * p = min(1, sqrt(bonus / maxBonus))
       */
      sqrtDiminishing: (maxBonus: number = 100): AdoptionProbFunction => {
        return (bonus: number) => Math.min(1, Math.sqrt(bonus / maxBonus));
      },

      /**
       * Constant adoption: for testing impossible scenarios
       * p = constant (independent of bonus)
       */
      constant: (prob: number): AdoptionProbFunction => {
        return (_bonus: number) => prob;
      },

      /**
       * Threshold adoption: no effect until threshold, then linear
       * p = max(0, min(1, (bonus - threshold) / range))
       */
      threshold: (threshold: number = 20, range: number = 80): AdoptionProbFunction => {
        return (bonus: number) => {
          if (bonus < threshold) return 0;
          return Math.min(1, (bonus - threshold) / range);
        };
      }
    };
  }

  /**
   * Validate adoption probability function
   * Checks if function is monotonically increasing
   * 
   * @param adoptionProb Function to validate
   * @param testRange Range of bonus values to test
   * @returns true if function is monotonically increasing
   */
  static validateAdoptionFunction(
    adoptionProb: AdoptionProbFunction,
    testRange: number[] = [0, 10, 20, 50, 100, 200, 500]
  ): boolean {
    for (let i = 1; i < testRange.length; i++) {
      const prevProb = adoptionProb(testRange[i - 1]);
      const currProb = adoptionProb(testRange[i]);
      
      if (currProb < prevProb) {
        return false; // Not monotonically increasing
      }
      
      if (currProb < 0 || currProb > 1) {
        return false; // Invalid probability value
      }
    }
    
    return true;
  }
}
