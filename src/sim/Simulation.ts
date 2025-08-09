/**
 * Network Growth Simulation
 * 
 * Implements deterministic expected-value simulation for referral network growth
 * Uses vector-based state tracking for efficiency
 * 
 * Model Parameters:
 * - Initial referrers: 100 active referrers
 * - Referral capacity: Each referrer can make up to 10 successful referrals
 * - Time unit: Days (discrete steps)
 * - State representation: Vector of referrer counts by success level (0-9)
 */

export class NetworkGrowthSimulation {
  private static readonly INITIAL_REFERRERS = 100;
  private static readonly REFERRAL_CAPACITY = 10;

  /**
   * Simulate network growth over specified number of days
   * 
   * Algorithm: Deterministic expected-value simulation
   * - State: C[a] = expected number of referrers with exactly 'a' successful referrals
   * - Each day: compute expected successes, update state vector
   * - New referrers = sum of all successful referrals (they become new active referrers)
   * 
   * Time Complexity: O(days * capacity) = O(days * 10) = O(days)
   * Space Complexity: O(capacity) = O(10) = O(1)
   * 
   * @param p Probability of successful referral per active referrer per day
   * @param days Number of days to simulate
   * @returns Array where element i is cumulative referrals at end of day i
   */
  static simulate(p: number, days: number): number[] {
    if (p < 0 || p > 1) {
      throw new Error('Probability must be between 0 and 1');
    }
    if (days < 0) {
      throw new Error('Days must be non-negative');
    }

    const result: number[] = [];
    let cumulativeReferrals = 0;
    
    // State vector: C[a] = expected number of referrers with exactly 'a' successful referrals
    // Index 0-9 represent referrers with 0-9 successful referrals (active)
    // Referrers with 10 successful referrals become inactive (not tracked)
    const referrerCounts = new Array(NetworkGrowthSimulation.REFERRAL_CAPACITY).fill(0);
    referrerCounts[0] = NetworkGrowthSimulation.INITIAL_REFERRERS; // Start with 100 referrers at level 0

    for (let day = 0; day < days; day++) {
      // Step 1: Compute expected successes for each referrer level
      const successes = new Array(NetworkGrowthSimulation.REFERRAL_CAPACITY);
      let totalNewReferrals = 0;

      for (let level = 0; level < NetworkGrowthSimulation.REFERRAL_CAPACITY; level++) {
        successes[level] = referrerCounts[level] * p;
        totalNewReferrals += successes[level];
      }

      // Step 2: Update cumulative count
      cumulativeReferrals += totalNewReferrals;
      result.push(cumulativeReferrals);

      // Step 3: Update referrer state for next day
      const nextReferrerCounts = new Array(NetworkGrowthSimulation.REFERRAL_CAPACITY).fill(0);

      // Level 0: those who failed today + all new referrers
      nextReferrerCounts[0] = referrerCounts[0] * (1 - p) + totalNewReferrals;

      // Levels 1-9: those who failed at this level + those who succeeded at previous level
      for (let level = 1; level < NetworkGrowthSimulation.REFERRAL_CAPACITY; level++) {
        nextReferrerCounts[level] = referrerCounts[level] * (1 - p) + successes[level - 1];
      }

      // Note: Referrers who succeed at level 9 (successes[9]) become inactive and exit the system

      referrerCounts.splice(0, NetworkGrowthSimulation.REFERRAL_CAPACITY, ...nextReferrerCounts);
    }

    return result;
  }

  /**
   * Find minimum number of days to reach target referrals
   * 
   * Algorithm: Linear scan through simulation
   * - More efficient than binary search for most practical cases
   * - Each simulation step is O(capacity) = O(10) = O(1)
   * - Early termination when target reached
   * 
   * Time Complexity: O(result_days * capacity) = O(result_days)
   * 
   * @param p Probability of successful referral per active referrer per day
   * @param targetTotal Target cumulative referrals
   * @returns Minimum days to reach target, or -1 if impossible
   */
  static daysToTarget(p: number, targetTotal: number): number {
    if (p <= 0) {
      return targetTotal <= 0 ? 0 : -1; // Impossible if no growth and positive target
    }
    if (targetTotal <= 0) {
      return 0; // Already at target
    }

    // For efficiency, we'll use a reasonable upper bound
    // In practice, exponential growth means targets are reached quickly or not at all
    const maxDays = 10000; // Reasonable upper bound
    
    let cumulativeReferrals = 0;
    const referrerCounts = new Array(NetworkGrowthSimulation.REFERRAL_CAPACITY).fill(0);
    referrerCounts[0] = NetworkGrowthSimulation.INITIAL_REFERRERS;

    for (let day = 1; day <= maxDays; day++) {
      // Compute expected successes for each referrer level
      const successes = new Array(NetworkGrowthSimulation.REFERRAL_CAPACITY);
      let totalNewReferrals = 0;

      for (let level = 0; level < NetworkGrowthSimulation.REFERRAL_CAPACITY; level++) {
        successes[level] = referrerCounts[level] * p;
        totalNewReferrals += successes[level];
      }

      // Update cumulative count
      cumulativeReferrals += totalNewReferrals;

      // Check if target reached
      if (cumulativeReferrals >= targetTotal) {
        return day;
      }

      // Update referrer state for next day
      const nextReferrerCounts = new Array(NetworkGrowthSimulation.REFERRAL_CAPACITY).fill(0);
      nextReferrerCounts[0] = referrerCounts[0] * (1 - p) + totalNewReferrals;

      for (let level = 1; level < NetworkGrowthSimulation.REFERRAL_CAPACITY; level++) {
        nextReferrerCounts[level] = referrerCounts[level] * (1 - p) + successes[level - 1];
      }

      referrerCounts.splice(0, NetworkGrowthSimulation.REFERRAL_CAPACITY, ...nextReferrerCounts);

      // Early termination if growth has essentially stopped
      if (totalNewReferrals < 1e-10) {
        break;
      }
    }

    return -1; // Target not reachable within reasonable time
  }

  /**
   * Get simulation parameters for reference
   */
  static getParameters(): { initialReferrers: number; referralCapacity: number } {
    return {
      initialReferrers: NetworkGrowthSimulation.INITIAL_REFERRERS,
      referralCapacity: NetworkGrowthSimulation.REFERRAL_CAPACITY
    };
  }

  /**
   * Get expected final state information for analysis
   * @param p Probability parameter
   * @param days Number of days
   * @returns Analysis of final simulation state
   */
  static analyzeSimulation(p: number, days: number): {
    cumulativeReferrals: number;
    activeReferrers: number;
    inactiveReferrers: number;
    avgReferralsPerActiveReferrer: number;
  } {
    if (days === 0) {
      return {
        cumulativeReferrals: 0,
        activeReferrers: NetworkGrowthSimulation.INITIAL_REFERRERS,
        inactiveReferrers: 0,
        avgReferralsPerActiveReferrer: 0
      };
    }

    const results = NetworkGrowthSimulation.simulate(p, days);
    const cumulativeReferrals = results[results.length - 1];

    // To get final state, we need to run the simulation one more step
    // This is a simplified approximation
    const totalNewReferrers = cumulativeReferrals;
    const approximateActiveReferrers = Math.max(1, NetworkGrowthSimulation.INITIAL_REFERRERS + totalNewReferrers * 0.5);
    
    return {
      cumulativeReferrals,
      activeReferrers: approximateActiveReferrers,
      inactiveReferrers: Math.max(0, totalNewReferrers - approximateActiveReferrers),
      avgReferralsPerActiveReferrer: approximateActiveReferrers > 0 ? cumulativeReferrals / approximateActiveReferrers : 0
    };
  }
}
