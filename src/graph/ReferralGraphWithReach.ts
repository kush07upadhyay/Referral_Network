import { ReferralGraph, Id } from './ReferralGraph';

export { Id };

/**
 * Extension of ReferralGraph with reach analysis capabilities
 * Implements BFS-based algorithms to compute full network reach
 */
export class ReferralGraphWithReach extends ReferralGraph {
  // Cache for reach sets to avoid recomputation
  private reachCache: Map<Id, Set<Id>> = new Map();
  private cacheValid = true;

  /**
   * Override addReferral to invalidate cache
   */
  addReferral(referrer: Id, candidate: Id): void {
    super.addReferral(referrer, candidate);
    this.invalidateCache();
  }

  /**
   * Override removeUser to invalidate cache
   */
  removeUser(id: Id): void {
    super.removeUser(id);
    this.invalidateCache();
  }

  /**
   * Get the complete reach set for a user (all downstream referrals)
   * Uses BFS to traverse the referral tree
   * @param id User identifier
   * @returns Set of all user IDs reachable from the given user (excluding the user itself)
   */
  getReach(id: Id): Set<Id> {
    if (!this.hasUser(id)) {
      return new Set();
    }

    // Check cache first
    if (this.cacheValid && this.reachCache.has(id)) {
      return new Set(this.reachCache.get(id)!);
    }

    const reach = new Set<Id>();
    const visited = new Set<Id>();
    const queue = [id];

    visited.add(id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const directReferrals = this.getDirectReferrals(current);

      for (const referral of directReferrals) {
        if (!visited.has(referral)) {
          visited.add(referral);
          reach.add(referral);
          queue.push(referral);
        }
      }
    }

    // Cache the result
    this.reachCache.set(id, new Set(reach));
    return reach;
  }

  /**
   * Get the total referral count for a user (direct + indirect)
   * @param id User identifier
   * @returns Total number of referrals in the user's network
   */
  getTotalReferralCount(id: Id): number {
    return this.getReach(id).size;
  }

  /**
   * Get top k referrers by their total reach
   * @param k Number of top referrers to return
   * @returns Array of {id, reachCount} objects sorted by reach count (descending)
   * 
   * Guidelines for choosing k:
   * - For small networks (< 100 users): k = 5-10
   * - For medium networks (100-1000 users): k = 10-20 or top 10%
   * - For large networks (> 1000 users): k = sqrt(N) or top 5%
   * - Business context: Consider showing enough to identify clear leaders
   *   but not so many that the list becomes overwhelming
   */
  getTopReferrersByReach(k: number): Array<{ id: Id; reachCount: number }> {
    const allUsers = this.getAllUsers();
    const reachData = allUsers.map(id => ({
      id,
      reachCount: this.getTotalReferralCount(id)
    }));

    // Sort by reach count (descending), then by id (for deterministic results)
    reachData.sort((a, b) => {
      if (a.reachCount !== b.reachCount) {
        return b.reachCount - a.reachCount;
      }
      return a.id.localeCompare(b.id);
    });

    return reachData.slice(0, k);
  }

  /**
   * Get reach data for all users
   * @returns Map from user ID to their reach count
   */
  getAllReachData(): Map<Id, number> {
    const reachData = new Map<Id, number>();
    for (const user of this.getAllUsers()) {
      reachData.set(user, this.getTotalReferralCount(user));
    }
    return reachData;
  }

  /**
   * Precompute reach sets for all users
   * Useful for algorithms that need reach data for multiple users
   */
  precomputeReach(): void {
    this.reachCache.clear();
    for (const user of this.getAllUsers()) {
      this.getReach(user);
    }
    this.cacheValid = true;
  }

  /**
   * Invalidate the reach cache
   */
  private invalidateCache(): void {
    this.cacheValid = false;
    this.reachCache.clear();
  }

  /**
   * Get recommended k value for top referrers based on network size
   * @returns Recommended k value
   */
  getRecommendedK(): number {
    const userCount = this.getAllUsers().length;
    
    if (userCount < 100) {
      return Math.min(10, userCount);
    } else if (userCount < 1000) {
      return Math.min(20, Math.floor(userCount * 0.1));
    } else {
      return Math.min(50, Math.floor(Math.sqrt(userCount)));
    }
  }
}
