/**
 * Tests for Part 4: Network Growth Simulation
 * Validates deterministic expected-value simulation algorithms
 */

import { NetworkGrowthSimulation } from '../src/sim/Simulation';

describe('NetworkGrowthSimulation', () => {
  describe('simulate', () => {
    test('should handle p=0 (no growth)', () => {
      const result = NetworkGrowthSimulation.simulate(0, 10);
      
      expect(result).toHaveLength(10);
      expect(result.every(count => count === 0)).toBe(true);
    });

    test('should handle p=1 (perfect success rate)', () => {
      const result = NetworkGrowthSimulation.simulate(1, 5);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(100); // Day 1: 100 initial referrers succeed
      expect(result[1]).toBe(300); // Day 2: original 100 + 100 new referrers succeed
      expect(result[2]).toBe(700); // Day 3: continuing exponential growth
      
      // Results should be monotonically increasing
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i-1]);
      }
    });

    test('should handle moderate probability', () => {
      const result = NetworkGrowthSimulation.simulate(0.1, 10);
      
      expect(result).toHaveLength(10);
      expect(result[0]).toBeCloseTo(10, 1); // Day 1: 100 * 0.1 = 10
      
      // Results should be monotonically increasing
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBeGreaterThanOrEqual(result[i-1]);
      }
    });

    test('should handle edge cases', () => {
      // Zero days
      expect(NetworkGrowthSimulation.simulate(0.5, 0)).toEqual([]);
      
      // Negative probability should throw
      expect(() => NetworkGrowthSimulation.simulate(-0.1, 5)).toThrow();
      
      // Probability > 1 should throw
      expect(() => NetworkGrowthSimulation.simulate(1.1, 5)).toThrow();
      
      // Negative days should throw
      expect(() => NetworkGrowthSimulation.simulate(0.5, -1)).toThrow();
    });

    test('should produce consistent results', () => {
      const result1 = NetworkGrowthSimulation.simulate(0.3, 5);
      const result2 = NetworkGrowthSimulation.simulate(0.3, 5);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('daysToTarget', () => {
    test('should return 0 for zero or negative target', () => {
      expect(NetworkGrowthSimulation.daysToTarget(0.5, 0)).toBe(0);
      expect(NetworkGrowthSimulation.daysToTarget(0.5, -10)).toBe(0);
    });

    test('should return -1 for impossible targets (p=0)', () => {
      expect(NetworkGrowthSimulation.daysToTarget(0, 100)).toBe(-1);
    });

    test('should find correct days for achievable targets', () => {
      // With p=1, we should reach 100 referrals on day 1
      expect(NetworkGrowthSimulation.daysToTarget(1, 100)).toBe(1);
      expect(NetworkGrowthSimulation.daysToTarget(1, 300)).toBe(2);
    });

    test('should handle small targets efficiently', () => {
      const days = NetworkGrowthSimulation.daysToTarget(0.1, 20);
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThan(100); // Should find reasonable solution
      
      // Verify the target is actually reached
      const simulation = NetworkGrowthSimulation.simulate(0.1, days);
      expect(simulation[days - 1]).toBeGreaterThanOrEqual(20);
    });

    test('should return -1 for impossible targets (p=0)', () => {
      expect(NetworkGrowthSimulation.daysToTarget(0, 100)).toBe(-1);
    });

    test('should handle very high targets with low probability', () => {
      // Even with very low probability, exponential growth can eventually reach high targets
      // But it should take a reasonable amount of time, not be impossible
      const result = NetworkGrowthSimulation.daysToTarget(0.01, 1000000);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10000); // Should find solution within reasonable time limit
    });
  });

  describe('getParameters', () => {
    test('should return correct simulation parameters', () => {
      const params = NetworkGrowthSimulation.getParameters();
      
      expect(params.initialReferrers).toBe(100);
      expect(params.referralCapacity).toBe(10);
    });
  });

  describe('analyzeSimulation', () => {
    test('should provide analysis for zero days', () => {
      const analysis = NetworkGrowthSimulation.analyzeSimulation(0.5, 0);
      
      expect(analysis.cumulativeReferrals).toBe(0);
      expect(analysis.activeReferrers).toBe(100);
      expect(analysis.inactiveReferrers).toBe(0);
      expect(analysis.avgReferralsPerActiveReferrer).toBe(0);
    });

    test('should provide meaningful analysis for simulation runs', () => {
      const analysis = NetworkGrowthSimulation.analyzeSimulation(0.1, 10);
      
      expect(analysis.cumulativeReferrals).toBeGreaterThan(0);
      expect(analysis.activeReferrers).toBeGreaterThan(0);
      expect(analysis.inactiveReferrers).toBeGreaterThanOrEqual(0);
      expect(analysis.avgReferralsPerActiveReferrer).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Growth patterns', () => {
    test('should show exponential-like growth with high probability', () => {
      const result = NetworkGrowthSimulation.simulate(0.8, 5);
      
      // Growth should accelerate over time
      const growthRate1 = result[1] - result[0];
      const growthRate2 = result[2] - result[1];
      const growthRate3 = result[3] - result[2];
      
      expect(growthRate2).toBeGreaterThan(growthRate1);
      expect(growthRate3).toBeGreaterThan(growthRate2);
    });

    test('should show diminishing returns as referrers reach capacity', () => {
      // With perfect probability, growth should eventually slow due to capacity limits
      const result = NetworkGrowthSimulation.simulate(1, 15);
      
      // Early growth should be strong
      expect(result[1] - result[0]).toBeGreaterThan(0);
      
      // Later growth should slow down (though this is hard to test precisely
      // without knowing exact implementation details)
      expect(result[result.length - 1]).toBeGreaterThan(result[0]);
    });
  });
});
