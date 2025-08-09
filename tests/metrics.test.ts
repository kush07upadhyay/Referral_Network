/**
 * Tests for Part 2: Full Network Reach and Part 3: Influencer Analysis
 * Validates BFS-based reach calculations, top referrer analysis, and influencer identification
 */

import { ReferralGraphWithReach } from '../src/graph/ReferralGraphWithReach';
import { InfluencerAnalyzer } from '../src/metrics/influencers';

describe('ReferralGraphWithReach', () => {
  let graph: ReferralGraphWithReach;

  beforeEach(() => {
    graph = new ReferralGraphWithReach();
  });

  describe('Reach Calculation', () => {
    test('should calculate reach correctly for simple chain', () => {
      // Chain: alice -> bob -> charlie -> david
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      graph.addReferral('charlie', 'david');

      expect(graph.getTotalReferralCount('alice')).toBe(3); // bob, charlie, david
      expect(graph.getTotalReferralCount('bob')).toBe(2);   // charlie, david
      expect(graph.getTotalReferralCount('charlie')).toBe(1); // david
      expect(graph.getTotalReferralCount('david')).toBe(0);   // no referrals
    });

    test('should calculate reach correctly for tree structure', () => {
      // Tree: alice -> bob, charlie
      //       bob -> david, eve
      //       charlie -> frank
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      graph.addReferral('bob', 'david');
      graph.addReferral('bob', 'eve');
      graph.addReferral('charlie', 'frank');

      expect(graph.getTotalReferralCount('alice')).toBe(5); // bob, charlie, david, eve, frank
      expect(graph.getTotalReferralCount('bob')).toBe(2);   // david, eve
      expect(graph.getTotalReferralCount('charlie')).toBe(1); // frank
      expect(graph.getTotalReferralCount('david')).toBe(0);
      expect(graph.getTotalReferralCount('eve')).toBe(0);
      expect(graph.getTotalReferralCount('frank')).toBe(0);
    });

    test('should handle disconnected components', () => {
      // Two separate chains
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      graph.addReferral('x', 'y');
      graph.addReferral('y', 'z');

      expect(graph.getTotalReferralCount('alice')).toBe(2); // bob, charlie
      expect(graph.getTotalReferralCount('x')).toBe(2);     // y, z
      expect(graph.getTotalReferralCount('charlie')).toBe(0);
      expect(graph.getTotalReferralCount('z')).toBe(0);
    });

    test('should return 0 for non-existent user', () => {
      graph.addReferral('alice', 'bob');
      expect(graph.getTotalReferralCount('nonexistent')).toBe(0);
    });

    test('should return empty set for getReach on non-existent user', () => {
      graph.addReferral('alice', 'bob');
      expect(graph.getReach('nonexistent')).toEqual(new Set());
    });
  });

  describe('Top Referrers by Reach', () => {
    test('should rank referrers correctly by reach', () => {
      // Create hierarchy with different reach sizes
      graph.addReferral('alice', 'bob');    // alice reach: 4
      graph.addReferral('alice', 'charlie'); // bob reach: 1
      graph.addReferral('bob', 'david');     // charlie reach: 1
      graph.addReferral('charlie', 'eve');   // others reach: 0

      const top3 = graph.getTopReferrersByReach(3);
      
      expect(top3).toHaveLength(3);
      expect(top3[0]).toEqual({ id: 'alice', reachCount: 4 });
      expect(top3[1].reachCount).toBe(1);
      expect(top3[2].reachCount).toBe(1);
      
      // Check that bob and charlie are included (order may vary for ties)
      const topIds = top3.map(r => r.id);
      expect(topIds).toContain('alice');
      expect(topIds).toContain('bob');
      expect(topIds).toContain('charlie');
    });

    test('should handle ties deterministically', () => {
      // Create scenario with ties
      graph.addReferral('alice', 'a1');
      graph.addReferral('bob', 'b1');
      graph.addReferral('charlie', 'c1');

      const top2 = graph.getTopReferrersByReach(2);
      expect(top2).toHaveLength(2);
      expect(top2[0].reachCount).toBe(1);
      expect(top2[1].reachCount).toBe(1);
      
      // Should be deterministic based on ID ordering
      const topIds = top2.map(r => r.id).sort();
      expect(topIds).toEqual(['alice', 'bob']);
    });

    test('should limit results to k', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('charlie', 'david');
      graph.addReferral('eve', 'frank');

      const top2 = graph.getTopReferrersByReach(2);
      expect(top2).toHaveLength(2);
    });

    test('should handle k larger than user count', () => {
      graph.addReferral('alice', 'bob');

      const top10 = graph.getTopReferrersByReach(10);
      expect(top10.length).toBeLessThanOrEqual(2); // alice and bob
    });

    test('should handle empty graph', () => {
      const top5 = graph.getTopReferrersByReach(5);
      expect(top5).toEqual([]);
    });
  });

  describe('Reach Caching', () => {
    test('should precompute reach for all users', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      
      // This should cache reach for all users
      graph.precomputeReach();
      
      // Verify cached results match fresh calculations
      expect(graph.getTotalReferralCount('alice')).toBe(2);
      expect(graph.getTotalReferralCount('bob')).toBe(1);
      expect(graph.getTotalReferralCount('charlie')).toBe(0);
    });

    test('should invalidate cache when graph changes', () => {
      graph.addReferral('alice', 'bob');
      graph.precomputeReach();
      
      const initialReach = graph.getTotalReferralCount('alice');
      
      // Add new referral - should invalidate cache
      graph.addReferral('bob', 'charlie');
      
      // Should reflect new structure
      const newReach = graph.getTotalReferralCount('alice');
      expect(newReach).toBe(initialReach + 1);
    });
  });

  describe('Recommended K Selection', () => {
    test('should recommend appropriate k for small graphs', () => {
      // Add 5 users
      graph.addReferral('a', 'b');
      graph.addReferral('c', 'd');
      graph.addUser('e');
      
      const k = graph.getRecommendedK();
      expect(k).toBeLessThanOrEqual(10);
      expect(k).toBeGreaterThan(0);
    });

    test('should recommend appropriate k for medium graphs', () => {
      // Add 50 users in a chain
      for (let i = 0; i < 49; i++) {
        graph.addReferral(`user${i}`, `user${i + 1}`);
      }
      
      const k = graph.getRecommendedK();
      expect(k).toBeGreaterThan(5);
      expect(k).toBeLessThanOrEqual(20);
    });
  });

  describe('All Reach Data', () => {
    test('should return reach data for all users', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      
      const allReach = graph.getAllReachData();
      
      expect(allReach.get('alice')).toBe(2);
      expect(allReach.get('bob')).toBe(1);
      expect(allReach.get('charlie')).toBe(0);
      expect(allReach.size).toBe(3);
    });

    test('should handle empty graph', () => {
      const allReach = graph.getAllReachData();
      expect(allReach.size).toBe(0);
    });
  });

  describe('Complex Graph Scenarios', () => {
    test('should handle large fan-out', () => {
      // One user referring to many others
      const referralCount = 20;
      for (let i = 0; i < referralCount; i++) {
        graph.addReferral('influencer', `user${i}`);
      }
      
      expect(graph.getTotalReferralCount('influencer')).toBe(referralCount);
      
      const topReferrer = graph.getTopReferrersByReach(1)[0];
      expect(topReferrer.id).toBe('influencer');
      expect(topReferrer.reachCount).toBe(referralCount);
    });

    test('should handle deep chain', () => {
      // Create a deep chain
      const chainLength = 15;
      for (let i = 0; i < chainLength - 1; i++) {
        graph.addReferral(`user${i}`, `user${i + 1}`);
      }
      
      expect(graph.getTotalReferralCount('user0')).toBe(chainLength - 1);
      expect(graph.getTotalReferralCount('user5')).toBe(chainLength - 6);
      expect(graph.getTotalReferralCount(`user${chainLength - 1}`)).toBe(0);
    });
  });
});

describe('InfluencerAnalyzer', () => {
  let graph: ReferralGraphWithReach;
  let analyzer: InfluencerAnalyzer;

  beforeEach(() => {
    graph = new ReferralGraphWithReach();
    analyzer = new InfluencerAnalyzer(graph);
  });

  describe('Unique Reach Expansion', () => {
    test('should identify optimal influencers with minimal overlap', () => {
      // Create network with clear optimal selection
      // alice: large reach but overlaps with bob
      // helen: smaller but unique reach
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      graph.addReferral('bob', 'david');
      graph.addReferral('charlie', 'eve');
      
      graph.addReferral('helen', 'iris');
      graph.addReferral('helen', 'jack');
      
      const result = analyzer.getUniqueReachExpansion(2);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('alice'); // Should pick alice first (largest reach)
      expect(result[0].score).toBe(4); // alice's total reach
      expect(result[1].id).toBe('helen'); // Should pick helen second (unique reach)
      expect(result[1].score).toBe(2); // helen's unique contribution
    });

    test('should handle empty graph', () => {
      const result = analyzer.getUniqueReachExpansion(5);
      expect(result).toEqual([]);
    });

    test('should handle single user with no referrals', () => {
      graph.addUser('alice');
      const result = analyzer.getUniqueReachExpansion(1);
      // User with no referrals won't be selected (score = 0, algorithm stops)
      expect(result).toHaveLength(0);
    });

    test('should stop early when no more unique reach available', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      
      const result = analyzer.getUniqueReachExpansion(5); // Ask for more than available
      expect(result).toHaveLength(1); // Should only return alice
      expect(result[0].id).toBe('alice');
    });
  });

  describe('Flow Centrality', () => {
    test('should identify brokers in simple network', () => {
      // Create network where bob is a clear broker
      // alice -> bob -> charlie -> david
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      graph.addReferral('charlie', 'david');
      
      const result = analyzer.getFlowCentrality();
      
      expect(result.length).toBeGreaterThan(0);
      
      // bob should have highest centrality (bridges alice to charlie/david)
      const bobResult = result.find(r => r.id === 'bob');
      expect(bobResult).toBeDefined();
      expect(bobResult!.score).toBeGreaterThan(0);
      
      // charlie should also have some centrality (bridges to david)
      const charlieResult = result.find(r => r.id === 'charlie');
      expect(charlieResult).toBeDefined();
    });

    test('should handle star network centrality', () => {
      // alice is central hub
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      graph.addReferral('alice', 'david');
      
      const result = analyzer.getFlowCentrality();
      
      // In a star, central node doesn't lie on shortest paths between leaves
      // (leaves are not connected to each other)
      const aliceResult = result.find(r => r.id === 'alice');
      expect(aliceResult).toBeDefined();
      expect(aliceResult!.score).toBe(0); // No shortest paths pass through alice in this structure
    });

    test('should handle empty graph', () => {
      const result = analyzer.getFlowCentrality();
      expect(result).toEqual([]);
    });

    test('should sort results by centrality score', () => {
      // Create network with clear centrality differences
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      graph.addReferral('bob', 'david');
      graph.addReferral('charlie', 'eve');
      graph.addReferral('david', 'frank');
      
      const result = analyzer.getFlowCentrality();
      
      // Results should be sorted by score (descending)
      for (let i = 1; i < result.length; i++) {
        expect(result[i].score).toBeLessThanOrEqual(result[i-1].score);
      }
    });
  });

  describe('Comprehensive Analysis', () => {
    test('should provide all three metrics', () => {
      // Build a network suitable for testing all metrics
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      graph.addReferral('bob', 'david');
      graph.addReferral('charlie', 'eve');
      graph.addReferral('helen', 'iris');
      
      const analysis = analyzer.getComprehensiveInfluencerAnalysis(3);
      
      expect(analysis.reachBased).toBeDefined();
      expect(analysis.uniqueReach).toBeDefined();
      expect(analysis.flowCentrality).toBeDefined();
      
      expect(analysis.reachBased.length).toBeGreaterThan(0);
      expect(analysis.uniqueReach.length).toBeGreaterThan(0);
      expect(analysis.flowCentrality.length).toBeGreaterThan(0);
      
      // Each should have id and score
      analysis.reachBased.forEach(result => {
        expect(result.id).toBeDefined();
        expect(typeof result.score).toBe('number');
      });
      
      analysis.uniqueReach.forEach(result => {
        expect(result.id).toBeDefined();
        expect(typeof result.score).toBe('number');
      });
      
      analysis.flowCentrality.forEach(result => {
        expect(result.id).toBeDefined();
        expect(typeof result.score).toBe('number');
      });
    });

    test('should handle different k values', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('charlie', 'david');
      graph.addReferral('eve', 'frank');
      
      const analysis1 = analyzer.getComprehensiveInfluencerAnalysis(1);
      const analysis2 = analyzer.getComprehensiveInfluencerAnalysis(2);
      
      expect(analysis1.reachBased.length).toBeLessThanOrEqual(1);
      expect(analysis1.uniqueReach.length).toBeLessThanOrEqual(1);
      expect(analysis1.flowCentrality.length).toBeLessThanOrEqual(1);
      
      expect(analysis2.reachBased.length).toBeLessThanOrEqual(2);
      expect(analysis2.uniqueReach.length).toBeLessThanOrEqual(2);
      expect(analysis2.flowCentrality.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Edge Cases and Performance', () => {
    test('should handle large network efficiently', () => {
      // Create a moderately large network
      const size = 50;
      for (let i = 0; i < size - 1; i++) {
        graph.addReferral(`user${i}`, `user${i + 1}`);
      }
      
      const start = Date.now();
      const analysis = analyzer.getComprehensiveInfluencerAnalysis(5);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(analysis.reachBased.length).toBeGreaterThan(0);
      expect(analysis.uniqueReach.length).toBeGreaterThan(0);
      expect(analysis.flowCentrality.length).toBeGreaterThan(0);
    });

    test('should handle network with isolated nodes', () => {
      graph.addReferral('alice', 'bob');
      graph.addUser('isolated');
      
      const analysis = analyzer.getComprehensiveInfluencerAnalysis(3);
      
      // Should include all users but handle isolated ones appropriately
      const allUsers = new Set();
      analysis.reachBased.forEach(r => allUsers.add(r.id));
      analysis.uniqueReach.forEach(r => allUsers.add(r.id));
      analysis.flowCentrality.forEach(r => allUsers.add(r.id));
      
      expect(allUsers.size).toBeGreaterThan(0);
    });
  });
});
