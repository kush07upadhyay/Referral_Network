/**
 * Core referral graph implementation with constraints:
 * - No self-referrals
 * - Each candidate has at most one referrer
 * - Graph must remain acyclic
 */

export type Id = string;

export class ReferralGraph {
  // Outgoing edges: referrer -> set of referrals
  private children: Map<Id, Set<Id>> = new Map();
  
  // Incoming edge: candidate -> referrer (enforces unique referrer)
  private parent: Map<Id, Id> = new Map();
  
  // All users in the graph
  private users: Set<Id> = new Set();

  /**
   * Add a user to the graph
   * @param id User identifier
   */
  addUser(id: Id): void {
    this.users.add(id);
    if (!this.children.has(id)) {
      this.children.set(id, new Set());
    }
  }

  /**
   * Check if a user exists in the graph
   * @param id User identifier
   * @returns true if user exists
   */
  hasUser(id: Id): boolean {
    return this.users.has(id);
  }

  /**
   * Add a referral relationship from referrer to candidate
   * Enforces all constraints: no self-referral, unique referrer, acyclic graph
   * @param referrer The user making the referral
   * @param candidate The user being referred
   * @throws Error if any constraint is violated
   */
  addReferral(referrer: Id, candidate: Id): void {
    // Ensure both users exist (auto-create if needed)
    this.addUser(referrer);
    this.addUser(candidate);

    // Constraint 1: No self-referrals
    if (referrer === candidate) {
      throw new Error('Self-referrals are not allowed');
    }

    // Constraint 2: Candidate can only have one referrer
    if (this.parent.has(candidate)) {
      throw new Error(`Candidate ${candidate} already has a referrer: ${this.parent.get(candidate)}`);
    }

    // Constraint 3: Acyclicity check
    // If candidate can reach referrer, adding this edge would create a cycle
    if (this.canReach(candidate, referrer)) {
      throw new Error(`Adding referral ${referrer} -> ${candidate} would create a cycle`);
    }

    // All constraints passed, add the referral
    this.children.get(referrer)!.add(candidate);
    this.parent.set(candidate, referrer);
  }

  /**
   * Get direct referrals for a user
   * @param id User identifier
   * @returns Array of direct referral IDs
   */
  getDirectReferrals(id: Id): Id[] {
    if (!this.hasUser(id)) {
      return [];
    }
    return Array.from(this.children.get(id) || []);
  }

  /**
   * Get the referrer of a user (if any)
   * @param id User identifier
   * @returns Referrer ID or undefined if no referrer
   */
  getReferrer(id: Id): Id | undefined {
    return this.parent.get(id);
  }

  /**
   * Remove a user from the graph (optional helper)
   * @param id User identifier to remove
   */
  removeUser(id: Id): void {
    if (!this.hasUser(id)) {
      return;
    }

    // Remove incoming edge (if any) - get referrer before deleting from parent map
    const referrer = this.parent.get(id);
    if (referrer) {
      this.children.get(referrer)?.delete(id);
    }
    this.parent.delete(id);

    // Remove all outgoing edges and update parent references
    const directReferrals = this.getDirectReferrals(id);
    for (const referral of directReferrals) {
      this.parent.delete(referral);
    }
    this.children.delete(id);

    // Remove from users set
    this.users.delete(id);
  }

  /**
   * Check if source can reach target using DFS
   * Uses iterative implementation to avoid recursion limits
   * @param source Starting node
   * @param target Target node
   * @returns true if target is reachable from source
   */
  private canReach(source: Id, target: Id): boolean {
    if (source === target) {
      return true;
    }

    const visited = new Set<Id>();
    const stack = [source];

    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (visited.has(current)) {
        continue;
      }
      
      visited.add(current);

      // Check all children
      const currentChildren = this.children.get(current);
      if (currentChildren) {
        for (const child of currentChildren) {
          if (child === target) {
            return true;
          }
          if (!visited.has(child)) {
            stack.push(child);
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all users in the graph
   * @returns Array of all user IDs
   */
  getAllUsers(): Id[] {
    return Array.from(this.users);
  }

  /**
   * Get graph statistics
   * @returns Object with user count and edge count
   */
  getStats(): { userCount: number; edgeCount: number } {
    let edgeCount = 0;
    for (const children of this.children.values()) {
      edgeCount += children.size;
    }
    return {
      userCount: this.users.size,
      edgeCount
    };
  }
}
