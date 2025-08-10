/**
 * Example: Reach analysis and top referrers
 * Demonstrates Part 2 functionality
 */

import { ReferralGraphWithReach } from '../src/graph/ReferralGraphWithReach';

console.log('=== Reach Analysis Example ===\n');

const graph = new ReferralGraphWithReach();

// Create a sample network
const referrals = [
  ['alice', 'bob'],
  ['alice', 'charlie'],
  ['alice', 'david'],
  ['bob', 'eve'],
  ['bob', 'frank'],
  ['charlie', 'grace'],
  ['david', 'henry'],
  ['eve', 'iris'],
  ['frank', 'jack'],
  ['grace', 'karen']
];

console.log(' Building sample network...');
referrals.forEach(([referrer, candidate]) => {
  graph.addReferral(referrer, candidate);
});

console.log(` Created network with ${graph.getStats().userCount} users and ${graph.getStats().edgeCount} referrals\n`);

// Analyze reach for each user
console.log(' Individual reach analysis:');
const users = graph.getAllUsers().sort();
users.forEach(user => {
  const reach = graph.getTotalReferralCount(user);
  const directReferrals = graph.getDirectReferrals(user);
  console.log(`  ${user}: ${reach} total reach (${directReferrals.length} direct)`);
});

// Get top referrers
console.log('\n Top referrers by reach:');
const k = Math.min(5, users.length);
const topReferrers = graph.getTopReferrersByReach(k);
topReferrers.forEach((referrer, index) => {
  console.log(`  ${index + 1}. ${referrer.id}: ${referrer.reachCount} total reach`);
});

// Show recommended k value
const recommendedK = graph.getRecommendedK();
console.log(`\n Recommended k for this network size: ${recommendedK}`);

console.log('\n Reach analysis completed!');
