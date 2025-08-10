/**
 * Tests for Part 5: Referral Bonus Optimization
 * Validates bonus optimization algorithms and adoption probability functions
 */

import { BonusOptimizer } from '../src/bonus/BonusOptimizer';
import { NetworkGrowthSimulation } from '../src/sim/Simulation';

describe('BonusOptimizer', () => {
  describe('minBonusForTarget', () => {
    test('should return 0 for zero or negative inputs', () => {
      const linearAdoption = BonusOptimizer.createAdoptionFunctions().linear(100);
      
      expect(BonusOptimizer.minBonusForTarget(0, 100, linearAdoption)).toBe(0);
      expect(BonusOptimizer.minBonusForTarget(10, 0, linearAdoption)).toBe(0);
      expect(BonusOptimizer.minBonusForTarget(10, -10, linearAdoption)).toBe(0);
    });

    test('should return 0 if target achievable with no bonus', () => {
      // Create function where even 0 bonus gives decent probability
      const constantAdoption = BonusOptimizer.createAdoptionFunctions().constant(0.3);
      
      const result = BonusOptimizer.minBonusForTarget(10, 50, constantAdoption);
      expect(result).toBe(0);
    });

    test('should return null for impossible targets', () => {
      // Function that always returns 0 probability regardless of bonus
      const impossibleAdoption = BonusOptimizer.createAdoptionFunctions().constant(0);
      
      const result = BonusOptimizer.minBonusForTarget(10, 100, impossibleAdoption);
      expect(result).toBe(null);
    });

    test('should find correct bonus with linear adoption function', () => {
      const linearAdoption = BonusOptimizer.createAdoptionFunctions().linear(100);
      
      const result = BonusOptimizer.minBonusForTarget(5, 200, linearAdoption);
      
      expect(result).not.toBe(null);
      expect(result! % 10).toBe(0); // Should be multiple of $10
      expect(result!).toBeGreaterThan(0);
    });

    test('should find correct bonus with logistic adoption function', () => {
      const logisticAdoption = BonusOptimizer.createAdoptionFunctions().logistic(50, 0.1);
      
      const result = BonusOptimizer.minBonusForTarget(7, 150, logisticAdoption);
      
      expect(result).not.toBe(null);
      expect(result! % 10).toBe(0); // Should be multiple of $10
    });

    test('should handle threshold adoption function', () => {
      const thresholdAdoption = BonusOptimizer.createAdoptionFunctions().threshold(30, 70);
      
      const result = BonusOptimizer.minBonusForTarget(10, 100, thresholdAdoption);
      
      if (result !== null) {
        expect(result).toBeGreaterThanOrEqual(30); // Should be at least the threshold
        expect(result % 10).toBe(0); // Should be multiple of $10
      }
    });

    test('should respect epsilon precision', () => {
      const linearAdoption = BonusOptimizer.createAdoptionFunctions().linear(100);
      
      const result1 = BonusOptimizer.minBonusForTarget(5, 150, linearAdoption, 1e-3);
      const result2 = BonusOptimizer.minBonusForTarget(5, 150, linearAdoption, 1e-6);
      
      // Results might be the same or very close due to $10 rounding
      expect(Math.abs((result1 || 0) - (result2 || 0))).toBeLessThanOrEqual(10);
    });

    test('should verify that returned bonus actually achieves target', () => {
      const sqrtAdoption = BonusOptimizer.createAdoptionFunctions().sqrtDiminishing(200);
      
      const target = 100;
      const days = 8;
      const result = BonusOptimizer.minBonusForTarget(days, target, sqrtAdoption);
      
      if (result !== null) {
        // Verify that this bonus actually achieves the target
        const probability = sqrtAdoption(result);
        const simulation = NetworkGrowthSimulation.simulate(probability, days);
        const actualHires = simulation[simulation.length - 1];
        
        expect(actualHires).toBeGreaterThanOrEqual(target);
      }
    });
  });

  describe('analyzeBonusSensitivity', () => {
    test('should analyze bonus sensitivity correctly', () => {
      const linearAdoption = BonusOptimizer.createAdoptionFunctions().linear(100);
      const bonusRange = [0, 10, 20, 50, 100];
      
      const analysis = BonusOptimizer.analyzeBonusSensitivity(5, linearAdoption, bonusRange);
      
      expect(analysis).toHaveLength(bonusRange.length);
      
      // Check structure of results
      analysis.forEach((result, index) => {
        expect(result.bonus).toBe(bonusRange[index]);
        expect(result.probability).toBeGreaterThanOrEqual(0);
        expect(result.probability).toBeLessThanOrEqual(1);
        expect(result.hires).toBeGreaterThanOrEqual(0);
      });

      // Probabilities should be non-decreasing (monotonic)
      for (let i = 1; i < analysis.length; i++) {
        expect(analysis[i].probability).toBeGreaterThanOrEqual(analysis[i-1].probability);
      }

      // Hires should generally increase with probability (though not strictly monotonic due to simulation complexity)
      expect(analysis[analysis.length - 1].hires).toBeGreaterThanOrEqual(analysis[0].hires);
    });
  });

  describe('createAdoptionFunctions', () => {
    const functions = BonusOptimizer.createAdoptionFunctions();

    test('linear function should work correctly', () => {
      const linear = functions.linear(100);
      
      expect(linear(0)).toBe(0);
      expect(linear(50)).toBe(0.5);
      expect(linear(100)).toBe(1);
      expect(linear(200)).toBe(1); // Capped at 1
    });

    test('logistic function should work correctly', () => {
      const logistic = functions.logistic(50, 0.1);
      
      expect(logistic(50)).toBeCloseTo(0.5, 2);
      expect(logistic(0)).toBeGreaterThan(0);
      expect(logistic(0)).toBeLessThan(0.5);
      expect(logistic(100)).toBeGreaterThan(0.5);
      expect(logistic(100)).toBeLessThan(1);
    });

    test('sqrt diminishing function should work correctly', () => {
      const sqrt = functions.sqrtDiminishing(100);
      
      expect(sqrt(0)).toBe(0);
      expect(sqrt(25)).toBeCloseTo(0.5, 2);
      expect(sqrt(100)).toBe(1);
      expect(sqrt(400)).toBe(1); // Capped at 1
    });

    test('constant function should work correctly', () => {
      const constant = functions.constant(0.3);
      
      expect(constant(0)).toBe(0.3);
      expect(constant(50)).toBe(0.3);
      expect(constant(1000)).toBe(0.3);
    });

    test('threshold function should work correctly', () => {
      const threshold = functions.threshold(20, 80);
      
      expect(threshold(0)).toBe(0);
      expect(threshold(19)).toBe(0);
      expect(threshold(20)).toBe(0);
      expect(threshold(60)).toBe(0.5);
      expect(threshold(100)).toBe(1);
      expect(threshold(200)).toBe(1); // Capped at 1
    });
  });

  describe('validateAdoptionFunction', () => {
    test('should validate monotonic functions correctly', () => {
      const linear = BonusOptimizer.createAdoptionFunctions().linear(100);
      const logistic = BonusOptimizer.createAdoptionFunctions().logistic(50, 0.1);
      const sqrt = BonusOptimizer.createAdoptionFunctions().sqrtDiminishing(100);
      
      expect(BonusOptimizer.validateAdoptionFunction(linear)).toBe(true);
      expect(BonusOptimizer.validateAdoptionFunction(logistic)).toBe(true);
      expect(BonusOptimizer.validateAdoptionFunction(sqrt)).toBe(true);
    });

    test('should reject non-monotonic functions', () => {
      const nonMonotonic = (bonus: number) => {
        return bonus < 50 ? bonus / 50 : (100 - bonus) / 50; // Goes up then down
      };
      
      expect(BonusOptimizer.validateAdoptionFunction(nonMonotonic)).toBe(false);
    });

    test('should reject functions with invalid probability values', () => {
      const invalidNegative = (_bonus: number) => -0.1;
      const invalidTooHigh = (_bonus: number) => 1.5;
      
      expect(BonusOptimizer.validateAdoptionFunction(invalidNegative)).toBe(false);
      expect(BonusOptimizer.validateAdoptionFunction(invalidTooHigh)).toBe(false);
    });

    test('should validate with custom test range', () => {
      const linear = BonusOptimizer.createAdoptionFunctions().linear(100);
      const customRange = [0, 25, 50, 75, 100];
      
      expect(BonusOptimizer.validateAdoptionFunction(linear, customRange)).toBe(true);
    });
  });

  describe('Integration tests', () => {
    test('should handle realistic business scenario', () => {
      // Scenario: Company wants 500 hires in 30 days with logistic adoption curve
      const adoptionProb = BonusOptimizer.createAdoptionFunctions().logistic(75, 0.08);
      
      const minBonus = BonusOptimizer.minBonusForTarget(30, 500, adoptionProb);
      
      if (minBonus !== null) {
        expect(minBonus % 10).toBe(0);
        expect(minBonus).toBeGreaterThan(0);
        expect(minBonus).toBeLessThan(1000); // Reasonable business constraint
        
        // Verify the solution works
        const finalProb = adoptionProb(minBonus);
        const results = NetworkGrowthSimulation.simulate(finalProb, 30);
        const actualHires = results[results.length - 1];
        
        expect(actualHires).toBeGreaterThanOrEqual(500);
      }
    });

    test('should show sensitivity analysis provides insights', () => {
      const logisticAdoption = BonusOptimizer.createAdoptionFunctions().logistic(60, 0.1);
      const bonusRange = [0, 20, 40, 60, 80, 100, 120];
      
      const sensitivity = BonusOptimizer.analyzeBonusSensitivity(15, logisticAdoption, bonusRange);
      
      // Should show clear relationship between bonus and results
      const lowBonusHires = sensitivity[0].hires;
      const highBonusHires = sensitivity[sensitivity.length - 1].hires;
      
      expect(highBonusHires).toBeGreaterThan(lowBonusHires);
      
      // Should show diminishing returns in later stages
      const prob1 = sensitivity[sensitivity.length - 2].probability;
      const prob2 = sensitivity[sensitivity.length - 1].probability;
      expect(prob2 - prob1).toBeLessThan(0.5); // Marginal gain should be reasonable
    });
  });
});
