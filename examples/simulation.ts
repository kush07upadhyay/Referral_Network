/**
 * Example: Network growth simulation
 * Demonstrates Part 4 functionality
 */

import { NetworkGrowthSimulation } from '../src/sim/Simulation';

console.log('=== Network Growth Simulation Example ===\n');

// Display simulation parameters
const params = NetworkGrowthSimulation.getParameters();
console.log(' Simulation Parameters:');
console.log(`  • Initial referrers: ${params.initialReferrers}`);
console.log(`  • Referral capacity per user: ${params.referralCapacity}`);
console.log(`  • Time unit: days\n`);

// Example 1: Conservative growth
console.log(' Scenario 1: Conservative Growth (p=0.1)');
const conservative = NetworkGrowthSimulation.simulate(0.1, 30);
console.log(`  Day 1: ${conservative[0].toFixed(1)} referrals`);
console.log(`  Day 10: ${conservative[9].toFixed(1)} referrals`);
console.log(`  Day 20: ${conservative[19].toFixed(1)} referrals`);
console.log(`  Day 30: ${conservative[29].toFixed(1)} referrals`);

// Example 2: Aggressive growth
console.log('\n Scenario 2: Aggressive Growth (p=0.3)');
const aggressive = NetworkGrowthSimulation.simulate(0.3, 30);
console.log(`  Day 1: ${aggressive[0].toFixed(1)} referrals`);
console.log(`  Day 10: ${aggressive[9].toFixed(1)} referrals`);
console.log(`  Day 20: ${aggressive[19].toFixed(1)} referrals`);
console.log(`  Day 30: ${aggressive[29].toFixed(1)} referrals`);

// Example 3: Find days to target
console.log('\n Target Achievement Analysis:');

const targets = [100, 500, 1000];
const probabilities = [0.1, 0.15, 0.2, 0.25];

console.log('\nDays needed to reach targets:');
console.log('Target\\Probability  |  0.1  |  0.15 |  0.2  |  0.25');
console.log('------------------|-------|-------|-------|-------');

targets.forEach(target => {
  let row = `${target.toString().padStart(8)} hires     |`;
  probabilities.forEach(p => {
    const days = NetworkGrowthSimulation.daysToTarget(p, target);
    const result = days === -1 ? ' N/A ' : days.toString().padStart(4);
    row += ` ${result} |`;
  });
  console.log(row);
});

// Example 4: Growth pattern analysis
console.log('\n Growth Pattern Analysis (p=0.2, 20 days):');
const pattern = NetworkGrowthSimulation.simulate(0.2, 20);
const analysis = NetworkGrowthSimulation.analyzeSimulation(0.2, 20);

console.log('\nDaily growth rates:');
for (let i = 0; i < Math.min(10, pattern.length); i++) {
  const daily = i === 0 ? pattern[0] : pattern[i] - pattern[i-1];
  console.log(`  Day ${i+1}: +${daily.toFixed(1)} new referrals (total: ${pattern[i].toFixed(1)})`);
}

console.log('\nFinal Analysis:');
console.log(`  • Total referrals: ${analysis.cumulativeReferrals.toFixed(1)}`);
console.log(`  • Active referrers: ${analysis.activeReferrers.toFixed(1)}`);
console.log(`  • Inactive referrers: ${analysis.inactiveReferrers.toFixed(1)}`);
console.log(`  • Avg referrals/active: ${analysis.avgReferralsPerActiveReferrer.toFixed(2)}`);

// Example 5: Edge cases
console.log('\n Edge Cases:');
console.log(`  • No growth (p=0): ${NetworkGrowthSimulation.simulate(0, 5).join(', ')}`);
console.log(`  • Perfect success (p=1): ${NetworkGrowthSimulation.simulate(1, 3).map(x => x.toFixed(0)).join(', ')}`);

const impossibleDays = NetworkGrowthSimulation.daysToTarget(0.05, 10000);
console.log(`  • Impossible target: ${impossibleDays} days (${impossibleDays === -1 ? 'not achievable' : 'achievable'})`);

console.log('\n Simulation examples completed!');
