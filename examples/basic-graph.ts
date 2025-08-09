/**
 * Example: Basic referral graph operations
 * Demonstrates Part 1 functionality
 */

import { ReferralGraph } from '../src/graph/ReferralGraph';

console.log('=== Basic Referral Graph Example ===\n');

const graph = new ReferralGraph();

// Add some referrals
try {
  graph.addReferral('alice', 'bob');
  graph.addReferral('alice', 'charlie');
  graph.addReferral('bob', 'david');
  graph.addReferral('charlie', 'eve');
  
  console.log(' Successfully created referral network');
  console.log(` Network stats: ${JSON.stringify(graph.getStats())}`);
  
  // Show referrals
  console.log('\n Direct referrals:');
  for (const user of graph.getAllUsers()) {
    const referrals = graph.getDirectReferrals(user);
    if (referrals.length > 0) {
      console.log(`  ${user} → [${referrals.join(', ')}]`);
    }
  }
  
} catch (error) {
  console.error(' Error:', error.message);
}

// Demonstrate constraint violations
console.log('\n Testing constraints:');

try {
  graph.addReferral('alice', 'alice');
} catch (error) {
  console.log(' Self-referral blocked:', error.message);
}

try {
  graph.addReferral('eve', 'bob');  // bob already has referrer alice
} catch (error) {
  console.log('✅ Unique referrer enforced:', error.message);
}

try {
  graph.addReferral('david', 'alice');  // would create cycle
} catch (error) {
  console.log('✅ Cycle prevented:', error.message);
}

console.log('\n Example completed successfully!');
