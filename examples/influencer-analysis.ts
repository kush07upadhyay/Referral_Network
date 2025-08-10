/**
 * Example: Influencer identification and comparison
 * Demonstrates Part 3 functionality
 */

import { ReferralGraphWithReach } from '../src/graph/ReferralGraphWithReach';
import { InfluencerAnalyzer } from '../src/metrics/influencers';

console.log('=== Influencer Analysis Example ===\n');

const graph = new ReferralGraphWithReach();

// Create a more complex network with clear influencer patterns
const referrals = [
  // Alice: high reach hub
  ['alice', 'bob'], ['alice', 'charlie'], ['alice', 'david'],
  ['bob', 'eve'], ['charlie', 'frank'], ['david', 'grace'],
  
  // Helen: smaller but unique branch
  ['helen', 'iris'], ['helen', 'jack'], ['iris', 'karen'],
  
  // Mike: bridge between communities
  ['mike', 'alice'], ['mike', 'helen'],
  
  // Additional depth
  ['eve', 'leo'], ['frank', 'mary'], ['grace', 'nancy'],
  ['jack', 'oscar'], ['karen', 'paul']
];

console.log(' Building influencer network...');
referrals.forEach(([referrer, candidate]) => {
  graph.addReferral(referrer, candidate);
});

console.log(`✅ Created network with ${graph.getStats().userCount} users and ${graph.getStats().edgeCount} referrals\n`);

const analyzer = new InfluencerAnalyzer(graph);

// Comprehensive analysis
console.log(' Comprehensive influencer analysis:');
const k = 5;
const analysis = analyzer.getComprehensiveInfluencerAnalysis(k);

console.log(`\n1️ Top ${k} by Raw Reach:`);
analysis.reachBased.forEach((influencer, index) => {
  console.log(`  ${index + 1}. ${influencer.id}: ${influencer.score} total reach`);
});

console.log(`\n2️ Top ${k} by Unique Reach Expansion:`);
analysis.uniqueReach.forEach((influencer, index) => {
  console.log(`  ${index + 1}. ${influencer.id}: ${influencer.score} unique contribution`);
});

console.log(`\n3️ Top ${k} by Flow Centrality:`);
analysis.flowCentrality.forEach((influencer, index) => {
  console.log(`  ${index + 1}. ${influencer.id}: ${influencer.score} centrality score`);
});

// Business scenario explanations
console.log('\n Business Use Cases:');
console.log('\n Raw Reach - Best for:');
console.log('  • General awareness campaigns');
console.log('  • Estimating viral potential');
console.log('  • Identifying largest audiences');

console.log('\n Unique Reach Expansion - Best for:');
console.log('  • Budget-constrained campaigns');
console.log('  • Minimizing audience overlap');
console.log('  • Optimizing influencer selection');

console.log('\n Flow Centrality - Best for:');
console.log('  • Identifying network bridges');
console.log('  • Understanding information flow');
console.log('  • Preventing network fragmentation');

console.log('\n Influencer analysis completed!');
