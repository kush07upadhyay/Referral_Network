/**
 * Tests for Part 1: Referral Graph
 * Validates core data structure functionality and constraints
 */

import { ReferralGraph } from '../src/graph/ReferralGraph';

describe('ReferralGraph', () => {
  let graph: ReferralGraph;

  beforeEach(() => {
    graph = new ReferralGraph();
  });

  describe('Basic Operations', () => {
    test('should add users successfully', () => {
      graph.addUser('alice');
      graph.addUser('bob');
      
      expect(graph.hasUser('alice')).toBe(true);
      expect(graph.hasUser('bob')).toBe(true);
      expect(graph.hasUser('charlie')).toBe(false);
    });

    test('should add valid referrals', () => {
      graph.addReferral('alice', 'bob');
      
      expect(graph.getDirectReferrals('alice')).toEqual(['bob']);
      expect(graph.getDirectReferrals('bob')).toEqual([]);
      expect(graph.getReferrer('bob')).toBe('alice');
    });

    test('should auto-create users when adding referrals', () => {
      graph.addReferral('alice', 'bob');
      
      expect(graph.hasUser('alice')).toBe(true);
      expect(graph.hasUser('bob')).toBe(true);
    });

    test('should handle multiple referrals from same user', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      graph.addReferral('alice', 'david');
      
      const referrals = graph.getDirectReferrals('alice');
      expect(referrals).toHaveLength(3);
      expect(referrals).toContain('bob');
      expect(referrals).toContain('charlie');
      expect(referrals).toContain('david');
    });
  });

  describe('Constraint 1: No Self-Referrals', () => {
    test('should reject self-referrals', () => {
      expect(() => {
        graph.addReferral('alice', 'alice');
      }).toThrow('Self-referrals are not allowed');
    });
  });

  describe('Constraint 2: Unique Referrer', () => {
    test('should reject candidate with existing referrer', () => {
      graph.addReferral('alice', 'bob');
      
      expect(() => {
        graph.addReferral('charlie', 'bob');
      }).toThrow('Candidate bob already has a referrer: alice');
    });

    test('should allow same user to be referred by different users to different candidates', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      
      expect(graph.getDirectReferrals('alice')).toHaveLength(2);
    });
  });

  describe('Constraint 3: Acyclic Graph', () => {
    test('should reject direct cycle (A -> B -> A)', () => {
      graph.addReferral('alice', 'bob');
      
      expect(() => {
        graph.addReferral('bob', 'alice');
      }).toThrow('Adding referral bob -> alice would create a cycle');
    });

    test('should reject indirect cycle (A -> B -> C -> A)', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      
      expect(() => {
        graph.addReferral('charlie', 'alice');
      }).toThrow('Adding referral charlie -> alice would create a cycle');
    });

    test('should reject longer cycle (A -> B -> C -> D -> A)', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      graph.addReferral('charlie', 'david');
      
      expect(() => {
        graph.addReferral('david', 'alice');
      }).toThrow('Adding referral david -> alice would create a cycle');
    });

    test('should allow valid tree structure', () => {
      // Create a tree: alice -> bob, charlie
      //                bob -> david
      //                charlie -> eve, frank
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      graph.addReferral('bob', 'david');
      graph.addReferral('charlie', 'eve');
      graph.addReferral('charlie', 'frank');
      
      expect(graph.getDirectReferrals('alice')).toHaveLength(2);
      expect(graph.getDirectReferrals('bob')).toHaveLength(1);
      expect(graph.getDirectReferrals('charlie')).toHaveLength(2);
    });
  });

  describe('Graph Operations', () => {
    test('should return empty array for non-existent user', () => {
      expect(graph.getDirectReferrals('nonexistent')).toEqual([]);
    });

    test('should return correct graph statistics', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('alice', 'charlie');
      graph.addReferral('bob', 'david');
      
      const stats = graph.getStats();
      expect(stats.userCount).toBe(4);
      expect(stats.edgeCount).toBe(3);
    });

    test('should list all users correctly', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('charlie', 'david');
      
      const users = graph.getAllUsers();
      expect(users).toHaveLength(4);
      expect(users).toContain('alice');
      expect(users).toContain('bob');
      expect(users).toContain('charlie');
      expect(users).toContain('david');
    });
  });

  describe('User Removal', () => {
    test('should remove user and all associated edges', () => {
      graph.addReferral('alice', 'bob');
      graph.addReferral('bob', 'charlie');
      graph.addReferral('alice', 'david');
      
      graph.removeUser('bob');
      
      expect(graph.hasUser('bob')).toBe(false);
      expect(graph.getDirectReferrals('alice')).toEqual(['david']);
      expect(graph.getReferrer('charlie')).toBeUndefined();
    });

    test('should handle removal of non-existent user', () => {
      expect(() => {
        graph.removeUser('nonexistent');
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty graph', () => {
      expect(graph.getAllUsers()).toEqual([]);
      expect(graph.getStats()).toEqual({ userCount: 0, edgeCount: 0 });
    });

    test('should handle single user', () => {
      graph.addUser('alice');
      
      expect(graph.getAllUsers()).toEqual(['alice']);
      expect(graph.getDirectReferrals('alice')).toEqual([]);
      expect(graph.getStats()).toEqual({ userCount: 1, edgeCount: 0 });
    });

    test('should maintain consistency after multiple operations', () => {
      // Build a complex valid graph
      graph.addReferral('root', 'branch1');
      graph.addReferral('root', 'branch2');
      graph.addReferral('branch1', 'leaf1');
      graph.addReferral('branch1', 'leaf2');
      graph.addReferral('branch2', 'leaf3');
      
      // Verify structure
      expect(graph.getDirectReferrals('root')).toHaveLength(2);
      expect(graph.getDirectReferrals('branch1')).toHaveLength(2);
      expect(graph.getDirectReferrals('branch2')).toHaveLength(1);
      
      // Verify constraints still hold
      expect(() => {
        graph.addReferral('leaf1', 'root');
      }).toThrow();
    });
  });
});
