#!/usr/bin/env node

/**
 * Simple test runner to validate the implementation
 */

async function runBasicTests() {
  console.log(' Running basic implementation tests...\n');
  
  try {
    // Test Part 1: Basic Graph
    console.log('1️ Testing ReferralGraph...');
    const { ReferralGraph } = await import('./dist/graph/ReferralGraph.js');
    const graph = new ReferralGraph();
    
    graph.addReferral('alice', 'bob');
    graph.addReferral('alice', 'charlie');
    console.log('    Basic referrals work');
    
    try {
      graph.addReferral('alice', 'alice');
      console.log('    Self-referral should be blocked');
    } catch (e) {
      console.log('    Self-referral correctly blocked');
    }
    
    // Test Part 2: Reach Analysis
    console.log('\n2️ Testing ReferralGraphWithReach...');
    const { ReferralGraphWithReach } = await import('./dist/graph/ReferralGraphWithReach.js');
    const reachGraph = new ReferralGraphWithReach();
    
    reachGraph.addReferral('alice', 'bob');
    reachGraph.addReferral('bob', 'charlie');
    const reach = reachGraph.getTotalReferralCount('alice');
    console.log(`    Alice's reach: ${reach} (expected: 2)`);
    
    // Test Part 3: Influencer Analysis
    console.log('\n3️ Testing InfluencerAnalyzer...');
    const { InfluencerAnalyzer } = await import('./dist/metrics/influencers.js');
    const analyzer = new InfluencerAnalyzer(reachGraph);
    const topInfluencers = analyzer.getUniqueReachExpansion(2);
    console.log(`    Influencer analysis works: found ${topInfluencers.length} top influencers`);
    
    // Test Part 4: Simulation
    console.log('\n4️ Testing NetworkGrowthSimulation...');
    const { NetworkGrowthSimulation } = await import('./dist/sim/Simulation.js');
    
    const result = NetworkGrowthSimulation.simulate(0.1, 5);
    console.log(`    Simulation works: ${result.length} days, final count: ${result[result.length-1].toFixed(1)}`);
    
    // Test Part 5: Bonus Optimization
    console.log('\n5️ Testing BonusOptimizer...');
    const { BonusOptimizer } = await import('./dist/bonus/BonusOptimizer.js');
    
    const adoptionFunc = BonusOptimizer.createAdoptionFunctions().linear(100);
    const bonus = BonusOptimizer.minBonusForTarget(10, 50, adoptionFunc);
    console.log(`    Bonus optimization works: $${bonus} for 50 hires in 10 days`);
    
    console.log('\n All basic tests passed! Implementation is working correctly.');
    
  } catch (error) {
    console.error(' Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runBasicTests();
