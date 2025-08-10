import { ReferralGraphWithReach } from '../graph/ReferralGraphWithReach';
import { Id } from '../graph/ReferralGraph';

/**
 * Influencer identification algorithms
 * Implements Unique Reach Expansion (greedy set cover) and Flow Centrality
 */

export interface InfluencerResult {
  id: Id;
  score: number;
}

export class InfluencerAnalyzer {
  constructor(private graph: ReferralGraphWithReach) {}

  /**
   * Metric 1: Unique Reach Expansion (Greedy Set Cover)
   * 
   * Business use case: Campaign targeting with minimal overlap
   * - Launching a marketing campaign and want to maximize unique reach
   * - Budget constraints require selecting optimal set of influencers
   * - Goal: reach maximum number of unique candidates with minimal overlap
   * 
   * Algorithm: Greedy set cover approach
   * 1. Precompute reach sets for all users
   * 2. Iteratively select user with largest uncovered reach
   * 3. Continue until k users selected or full coverage achieved
   * 
   * Time Complexity: O(k * V * avgReach) where k=selection size, V=vertices
   * 
   * @param k Number of influencers to select
   * @returns Array of influencers with their unique contribution scores
   */
  getUniqueReachExpansion(k: number): InfluencerResult[] {
    const allUsers = this.graph.getAllUsers();
    
    // Precompute reach sets for all users
    this.graph.precomputeReach();
    const reachSets = new Map<Id, Set<Id>>();
    for (const user of allUsers) {
      reachSets.set(user, this.graph.getReach(user));
    }

    const result: InfluencerResult[] = [];
    const globalCovered = new Set<Id>();
    const remainingUsers = new Set(allUsers);

    for (let i = 0; i < k && remainingUsers.size > 0; i++) {
      let bestUser: Id | null = null;
      let bestNewReach = 0;

      // Find user with largest uncovered reach
      for (const user of remainingUsers) {
        const userReach = reachSets.get(user)!;
        const newReach = this.setDifference(userReach, globalCovered).size;
        
        if (newReach > bestNewReach) {
          bestNewReach = newReach;
          bestUser = user;
        }
      }

      if (bestUser === null || bestNewReach === 0) {
        break; // No more unique reach possible
      }

      // Add best user to result
      result.push({ id: bestUser, score: bestNewReach });
      
      // Update global coverage
      const bestUserReach = reachSets.get(bestUser)!;
      for (const reachedUser of bestUserReach) {
        globalCovered.add(reachedUser);
      }
      
      remainingUsers.delete(bestUser);
    }

    return result;
  }

  /**
   * Metric 2: Flow Centrality (Betweenness-like centrality)
   * 
   * Business use case: Identifying critical network brokers
   * - Finding users whose removal would fragment the network
   * - Identifying key connectors between different network communities
   * - Targeting users who facilitate information/influence flow
   * 
   * Algorithm: Naive implementation of betweenness centrality
   * 1. Compute shortest distances between all pairs (BFS from each node)
   * 2. For each triple (s,t,v), check if v lies on shortest path from s to t
   * 3. Increment centrality score for v when condition holds
   * 
   * Time Complexity: O(V^3) - acceptable for small/medium graphs
   * Note: Brandes' algorithm could optimize this to O(V*E) for larger graphs
   * 
   * @returns Array of users ranked by flow centrality score
   */
  getFlowCentrality(): InfluencerResult[] {
    const allUsers = this.graph.getAllUsers();
    const userCount = allUsers.length;
    
    if (userCount === 0) {
      return [];
    }

    // Step 1: Compute all-pairs shortest distances using BFS
    const distances = new Map<string, number>();
    
    for (const source of allUsers) {
      const distFromSource = this.bfsDistances(source);
      for (const [target, dist] of distFromSource) {
        distances.set(`${source}->${target}`, dist);
      }
    }

    // Step 2: Compute centrality scores
    const centralityScores = new Map<Id, number>();
    for (const user of allUsers) {
      centralityScores.set(user, 0);
    }

    // For each pair (s,t) and each potential broker v
    for (const source of allUsers) {
      for (const target of allUsers) {
        if (source === target) continue;
        
        const distSourceTarget = distances.get(`${source}->${target}`);
        if (distSourceTarget === undefined || distSourceTarget === Infinity) {
          continue; // No path from source to target
        }

        for (const broker of allUsers) {
          if (broker === source || broker === target) continue;
          
          const distSourceBroker = distances.get(`${source}->${broker}`);
          const distBrokerTarget = distances.get(`${broker}->${target}`);
          
          if (distSourceBroker === undefined || distBrokerTarget === undefined) {
            continue;
          }

          // Check if broker lies on shortest path from source to target
          if (distSourceBroker + distBrokerTarget === distSourceTarget) {
            const currentScore = centralityScores.get(broker) || 0;
            centralityScores.set(broker, currentScore + 1);
          }
        }
      }
    }

    // Convert to result format and sort
    const result: InfluencerResult[] = [];
    for (const [id, score] of centralityScores) {
      result.push({ id, score });
    }

    // Sort by score (descending), then by id (for deterministic results)
    result.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.id.localeCompare(b.id);
    });

    return result;
  }

  /**
   * Combined analysis: Get all three influence metrics for comparison
   * @param k Number of top influencers to return for reach-based metrics
   * @returns Object containing results from all three metrics
   */
  getComprehensiveInfluencerAnalysis(k: number): {
    reachBased: InfluencerResult[];
    uniqueReach: InfluencerResult[];
    flowCentrality: InfluencerResult[];
  } {
    // Reach-based (from Part 2)
    const topReferrers = this.graph.getTopReferrersByReach(k);
    const reachBased = topReferrers.map(r => ({ id: r.id, score: r.reachCount }));

    return {
      reachBased,
      uniqueReach: this.getUniqueReachExpansion(k),
      flowCentrality: this.getFlowCentrality().slice(0, k)
    };
  }

  /**
   * BFS to compute shortest distances from a source to all reachable nodes
   * @param source Starting node
   * @returns Map from target node to shortest distance
   */
  private bfsDistances(source: Id): Map<Id, number> {
    const distances = new Map<Id, number>();
    const visited = new Set<Id>();
    const queue: Array<{ node: Id; dist: number }> = [{ node: source, dist: 0 }];

    visited.add(source);
    distances.set(source, 0);

    while (queue.length > 0) {
      const { node: current, dist: currentDist } = queue.shift()!;
      const neighbors = this.graph.getDirectReferrals(current);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const newDist = currentDist + 1;
          distances.set(neighbor, newDist);
          queue.push({ node: neighbor, dist: newDist });
        }
      }
    }

    return distances;
  }

  /**
   * Compute set difference: elements in setA but not in setB
   * @param setA First set
   * @param setB Second set
   * @returns New set containing difference
   */
  private setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const difference = new Set<T>();
    for (const item of setA) {
      if (!setB.has(item)) {
        difference.add(item);
      }
    }
    return difference;
  }
}

/**
 * Comparison of influence metrics:
 * 
 * 1. REACH (Total Referral Count):
 *    - Measures: Total downstream network size
 *    - Business scenario: Identifying users with largest potential audience
 *    - Best for: General influence assessment, viral potential estimation
 *    - Example: Selecting ambassadors for broad awareness campaigns
 * 
 * 2. UNIQUE REACH EXPANSION:
 *    - Measures: Incremental unique audience when selecting multiple influencers
 *    - Business scenario: Budget-constrained campaigns requiring minimal overlap
 *    - Best for: Optimizing influencer selection with limited resources
 *    - Example: Choosing 5 influencers for maximum unique customer reach
 * 
 * 3. FLOW CENTRALITY:
 *    - Measures: Importance as network broker/connector
 *    - Business scenario: Identifying critical nodes for network stability
 *    - Best for: Understanding information flow, preventing fragmentation
 *    - Example: Prioritizing customer retention for users who connect communities
 */
