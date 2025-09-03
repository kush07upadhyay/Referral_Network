0) High-level assumptions
=======================================

1.  Newly referred candidates become new _active referrers_ with the same lifetime capacity (10) — this is the usual interpretation for growth simulation. If the challenge intended otherwise, tell me and I’ll adapt.
    
2.  User IDs: use string (e.g. email/uuid) as the primary key. Easy to adapt to numbers.
    
3.  We’ll implement everything in **TypeScript**, test with **Jest + ts-jest**, and use Node (18+ or 20+). (If you want a different stack, say so.)
    

1) Repo structure & tooling (create first)
==========================================

Create a professional repo layout and tooling so reviewers can run tests and read design quickly.

Recommended structure:

My-challenge/
├── README.md
├── package.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── graph/
│   │   └── ReferralGraph.ts
│   ├── metrics/
│   │   └── influencers.ts
│   ├── sim/
│   │   └── Simulation.ts
│   ├── bonus/
│   │   └── BonusOptimizer.ts
│   └── index.ts        # demo / exports
├── tests/
│   ├── graph.test.ts
│   ├── metrics.test.ts
│   ├── sim.test.ts
│   └── bonus.test.ts
├── examples/            # small scripts showing usage
└── .github/
    └── workflows/ci.yml


package.json (scripts example):

{
  "scripts": {
    "build": "tsc",
    "test": "jest --coverage",
    "lint": "eslint . --ext .ts",
    "fmt": "prettier --write ."
  }
}


tsconfig: target ES2020, commonjs/module resolution, sourceMap for easier debugging.

CI: GitHub Actions that runs npm ci && npm test.

2) Part 1 — Referral Graph (core DS)
====================================

**Goal:** represent directed referrals with constraints:

*   No self-referral.
    
*   Each candidate has at most one referrer.
    
*   Graph must remain acyclic.
    

API (TypeScript sketch)
-----------------------

type Id = string;

class ReferralGraph {
  addUser(id: Id): void;
  addReferral(referrer: Id, candidate: Id): void; // enforces constraints or throws
  getDirectReferrals(id: Id): Id[];
  hasUser(id: Id): boolean;
  // optional helpers:
  removeUser(id: Id): void;
}


Internal data structures
------------------------

*   children: Map\> — outgoing edges (referrer → referrals)
    
*   parent: Map — to enforce unique referrer quickly (maps candidate→referrer)
    
*   users: Set
    

Adding a referral: validations
------------------------------

1.  Ensure both users exist (or auto-create).
    
2.  Reject if referrer === candidate.
    
3.  Reject if parent.has(candidate) (already has a referrer).
    
4.  **Acyclicity check:** before inserting edge referrer -> candidate, do a reachability test from candidate to see if referrer is reachable (DFS/BFS). If yes, adding would create a cycle → reject.
    

*   Use iterative stack-based DFS to avoid recursion limits.
    
*   Complexity: O(V+E) worst-case per insertion.
    

Tests to write
--------------

*   adding valid referral tree
    
*   self-referral rejected
    
*   candidate with existing referrer rejected
    
*   cycle detection: e.g., A→B, B→C then C→A should be rejected
    
*   getDirectReferrals returns correct list
    

3) Part 2 — Full Network Reach (BFS)
====================================

**Goal:** for any user compute total number of downstream referrals (direct + indirect).

Implementation
--------------

*   getReach(id): Set — run BFS from id on children graph and collect visited nodes (skip start node).
    
*   totalReferralCount(id) = reach.size.
    
*   topReferrersByReach(k) — compute reach for every user, sort descending by size and return top k.
    

Performance notes & caching
---------------------------

*   Naive: computing reach for all nodes is O(V\*(V+E)). That’s fine for medium graphs.
    
*   If graph is mostly static, **cache reach sets** after computation; invalidate/update on graph changes.
    
*   Selecting k: explain in README. Recommendations:
    
    *   Business: show top 10 or top √N (if N large) or top X% of users. For small N choose fixed k like 10. Document tradeoffs.
        

Tests
-----

*   small graph with known reach values (hand-computed)
    
*   caching path (if implemented)
    

4) Part 3 — Identify Influencers
================================

Two metrics: **Unique Reach Expansion** (greedy set cover) and **Flow Centrality**.

### Metric 1 — Unique Reach Expansion (Greedy set cover)

**Algorithm**

1.  Precompute reachSet\[u\] for every user u (use Part 2).
    
2.  Keep covered = Set{}.
    
3.  Repeat: pick user u with largest |reachSet\[u\] \\ covered|, add them to result, update covered.
    
4.  Stop when you have selected desired number k or full coverage.
    

**Complexity**: naive O(k \* V \* avgReach). For large graphs use bitsets (typed arrays) to speed set operations.

**When to use business case**: launching a campaign and you want minimal overlap (maximize unique new candidates reached).

### Metric 2 — Flow Centrality (broker / betweenness idea)

**Naive algorithm (as suggested by PDF)**:

*   For every source s, run BFS to compute dist(s, \*).
    
*   For every pair (s, t) and for each node v, check whether dist(s, v) + dist(v, t) == dist(s, t). If true and v not s/t, increment centrality score for v.
    
*   Rank nodes by score.
    

**Complexity**: naive O(V^3) in worst-case (V BFS + O(V^2) checks each), acceptable for small graphs. Put clear note in README that this is correct but not optimized.

**Optimization (recommended)**: implement Brandes’ algorithm for betweenness centrality (O(V\*E)). I recommend at least mentioning it and optionally implementing it if you have time — but the PDF said correctness is more important than high optimization, so implement naive first then optionally optimize.

**When to use business case**: you want brokers whose removal fragments the network — e.g., to identify nodes critical for spread or users to incentivize heavily.

### Tests

*   small graph where you can compute expected flow centrality manually (e.g., a small chain and one central hub)
    

5) Part 4 — Network Growth Simulation (days, probabilities)
===========================================================

PDF: initial referrers = **100**, referral capacity per referrer = **10**, time unit = day.

I propose a deterministic-**expected-value** simulation that’s exact for expectations (no Monte Carlo). Model each referrer by how many successful referrals they have already made (0..9 active; 10 → inactive). This yields a compact vector update each day.

Exact expected-value discrete algorithm (vector of counts)
----------------------------------------------------------

Let C\[a\] = expected number of referrers who have already made exactly a successful referrals at start of day (0 ≤ a ≤ 9).Start: C\[0\] = 100, others 0.

On each day:

1.  For each a compute expected successes S\[a\] = C\[a\] \* p.
    
2.  New referrers created that day = new = sum\_a S\[a\].
    
3.  Update classes:
    
    *   nextC\[0\] = (C\[0\] \* (1-p)) + new // those who failed plus brand new ones
        
    *   For 1 ≤ a ≤ 9: nextC\[a\] = C\[a\] \* (1-p) + S\[a-1\]
        
    *   Referrers who succeed from a=9 are S\[9\] and become inactive (exit).
        
4.  New referrals that day = new. Keep cumulative sum.
    

This deterministic update is linear algebra on a length-10 vector — extremely fast. Complexity O(days \* capacity) where capacity=10.

### Implement:

*   simulate(p: number, days: number): number\[\] → returns cumulative referrals at end of each day (array length = days). Use double precision.
    
*   days\_to\_target(p: number, target\_total: number): number → simulate day-by-day until cumulative >= target; return day index. If growth trends to infinite but slow, use an upper bound and doubling then binary search (but daily loop is cheap — so linear scan is fine).
    

### Edge cases/tests

*   p = 0 → always zero new referrals.
    
*   p = 1 → every active referrer succeeds every day until capacity used (deterministic), test behavior.
    
*   Small day counts and known small examples as unit tests.
    

6) Part 5 — Referral Bonus Optimization (min\_bonus\_for\_target)
=================================================================

Goal: given adoption\_prob(bonus) black box (monotonic), days, target\_hires, eps precision → find minimum bonus (rounded **UP** to nearest $10) so cumulative expected hires >= target.

Algorithm (binary search over bonus)
------------------------------------

1.  If simulate(adoption\_prob(0), days) >= target → return 0.
    
2.  Check simulate(adoption\_prob(max\_test), days) for a reasonably large max\_test (e.g., double bonus until success or until adoption\_prob(max\_test) is sufficiently close to 1). If even p=1.0 doesn’t reach target → return null.
    
3.  Use binary search on continuous bonus range \[low, high\] using eps stopping criterion:
    
    *   mid = (low + high)/2
        
    *   p = adoption\_prob(mid)
        
    *   simulate(p, days), if cumulative >= target => high = mid else low = mid
        
4.  After convergence, **round up** to nearest $10 and verify the rounded value achieves target (if not, increase by $10 until success or prove impossible).
    
5.  Return the rounded $10 value.
    

Complexity
----------

*   Each check requires running simulate: O(days \* capacity) — very cheap (capacity=10). Binary search typically needs O(log(B/eps)) iterations where B is max bonus. So overall O(days \* log(range/eps)).
    

Tests
-----

*   Use mock adoption\_prob functions:
    
    *   linear min(1, bonus/100),
        
    *   logistic-like approximations,
        
    *   constant functions to test unreachable scenarios.
        

7) Testing strategy (must be comprehensive)
===========================================

**Framework**: Jest + ts-jest.

**What to test (per part)**

Part 1 (Graph):

*   basic additions, direct referrals
    
*   reject self-referrals
    
*   reject multiple referrer
    
*   reject cycles (create a cycle attempt)
    
*   getDirectReferrals output order/contents
    

Part 2 (Reach):

*   BFS reach correctness on multiple small DAGs
    
*   top-k sorting correctness (ties)
    

Part 3 (Influencers):

*   unique\_reach greedy correctness (manual small graphs)
    
*   flow\_centrality correctness with small handcrafted graphs
    
*   test edge cases (isolated nodes, disconnected components)
    

Part 4 (Simulation):

*   p=0, p=1 deterministic checks
    
*   conservation checks (class sums + inactive counts)
    
*   sample numeric checks against manual small-step calculations
    

Part 5 (Bonus):

*   binary search correctness with simple adoption\_prob
    
*   unreachable detection when even p=1 insufficient
    

**Extra tests**

*   property tests (optional): random small DAG generator and assert Part1 constraints always hold; assert no cycles created by allowed operations.
    

**One command to run all tests:** npm test (document this clearly in README)

8) README contents (must include these)
=======================================

1.  **Language & Setup**
    
    *   Node version, TypeScript, commands:
        
        *   npm ci
            
        *   npm run build
            
        *   npm test
            
2.  **Design Choices**
    
    *   data structure justification for Part 1 (maps for O(1) checks + DFS for acyclicity)
        
    *   algorithm choices for metrics, simulation method (explain vector model)
        
3.  **How to run**
    
    *   simple examples to run simulation and min\_bonus\_for\_target
        
4.  **Complexity**
    
    *   list time/space complexity for each method implemented
        
5.  **Tests**
    
    *   how to run and what coverage to expect
        
6.  **Notes & Assumptions**
    
    *   explicit assumptions (e.g., new referred become referrers)
        
7.  **Comparisons**
    
    *   short comparison of reach, unique\_reach, flow\_centrality use-cases (business scenarios) — required by prompt.
        

Include short snippets demonstrating expected outputs.

9) Nice-to-have improvements (make your submission stand out)
=============================================================

*   Implement **Brandes’ algorithm** for betweenness centrality as an optimization and include both implementations in code (flowCentralityNaive & flowCentralityBrandes) with README benchmarks.
    
*   Add a small demo script in examples/ that reads a JSON graph and prints top influencers and simulates growth.
    
*   Add type-safe exports and a minimal CLI (node dist/index.js --simulate ...) so reviewers can try quickly.
    
*   Add coverage thresholds in CI (e.g., 80%).
    
*   Provide small performance benchmark in README for graph sizes (100, 1k nodes).
    

10) Deliverable & final checklist before submission
===================================================

*   README contains required sections and design justification.
    
*   package.json declares deps and npm test runs all tests.
    
*   Tests validate Part 1 constraints explicitly and include edge cases.
    
*   Code is typed (TypeScript) with clean API boundaries and comments describing complexities.
    
*   CI runs tests on push.
    
*   The GitHub repository is private and access has been granted.
    
*   The README.md file is complete and includes all required sections.
    
*   All project dependencies are declared in a manifest file.
    
*   Your test suite is comprehensive and runs with a single command.