/**
 * Complete demonstration of all referral network features
 * This script showcases all 5 parts of the Mercor Challenge implementation
 */

async function demonstrateCompleteSystem() {
  console.log(' Mercor Challenge: Complete Referral Network Demonstration\n');
  console.log('=' .repeat(60));
  
  try {
    // Import all modules
    const { ReferralGraph } = await import('./dist/graph/ReferralGraph.js');
    const { ReferralGraphWithReach } = await import('./dist/graph/ReferralGraphWithReach.js');
    const { InfluencerAnalyzer } = await import('./dist/metrics/influencers.js');
    const { NetworkGrowthSimulation } = await import('./dist/sim/Simulation.js');
    const { BonusOptimizer } = await import('./dist/bonus/BonusOptimizer.js');

    // Part 1: Core Referral Graph
    console.log('\n PART 1: REFERRAL GRAPH');
    console.log('-'.repeat(30));
    
    const graph = new ReferralGraphWithReach();
    
    // Create sample network
    const referrals = [
      ['alice', 'bob'], ['alice', 'charlie'], ['alice', 'david'],
      ['bob', 'eve'], ['bob', 'frank'], ['charlie', 'grace'],
      ['david', 'henry'], ['eve', 'iris'], ['frank', 'jack'],
      ['grace', 'karen'], ['henry', 'leo'], ['iris', 'mary']
    ];
    
    referrals.forEach(([referrer, candidate]) => {
      graph.addReferral(referrer, candidate);
    });
    
    const stats = graph.getStats();
    console.log(` Created network: ${stats.userCount} users, ${stats.edgeCount} referrals`);
    console.log(` Constraints enforced: acyclic, unique referrers, no self-referrals`);

    // Part 2: Reach Analysis
    console.log('\n PART 2: REACH ANALYSIS');
    console.log('-'.repeat(30));
    
    const topReferrers = graph.getTopReferrersByReach(5);
    console.log('Top referrers by total reach:');
    topReferrers.forEach((ref, i) => {
      console.log(`  ${i + 1}. ${ref.id}: ${ref.reachCount} total referrals`);
    });

    // Part 3: Influencer Analysis
    console.log('\n PART 3: INFLUENCER IDENTIFICATION');
    console.log('-'.repeat(40));
    
    const analyzer = new InfluencerAnalyzer(graph);
    const analysis = analyzer.getComprehensiveInfluencerAnalysis(3);
    
    console.log(' Raw Reach (viral potential):');
    analysis.reachBased.forEach((inf, i) => {
      console.log(`  ${i + 1}. ${inf.id}: ${inf.score} total reach`);
    });
    
    console.log('\n Unique Reach Expansion (minimal overlap):');
    analysis.uniqueReach.forEach((inf, i) => {
      console.log(`  ${i + 1}. ${inf.id}: +${inf.score} unique contribution`);
    });
    
    console.log('\n Flow Centrality (network bridges):');
    analysis.flowCentrality.forEach((inf, i) => {
      console.log(`  ${i + 1}. ${inf.id}: ${inf.score} centrality score`);
    });

    // Part 4: Network Growth Simulation
    console.log('\n PART 4: NETWORK GROWTH SIMULATION');
    console.log('-'.repeat(40));
    
    const params = NetworkGrowthSimulation.getParameters();
    console.log(`Parameters: ${params.initialReferrers} initial referrers, ${params.referralCapacity} capacity each`);
    
    // Simulate different scenarios
    const scenarios = [
      { name: 'Conservative', p: 0.1 },
      { name: 'Moderate', p: 0.2 },
      { name: 'Aggressive', p: 0.3 }
    ];
    
    console.log('\nGrowth projections (30 days):');
    scenarios.forEach(scenario => {
      const results = NetworkGrowthSimulation.simulate(scenario.p, 30);
      const final = results[results.length - 1];
      const day10 = results[9];
      console.log(`  ${scenario.name} (p=${scenario.p}): Day 10: ${day10.toFixed(0)}, Day 30: ${final.toFixed(0)} hires`);
    });
    
    // Target achievement
    const targetDays = NetworkGrowthSimulation.daysToTarget(0.15, 500);
    console.log(`\n Time to 500 hires (p=0.15): ${targetDays} days`);

    // Part 5: Bonus Optimization
    console.log('\n PART 5: BONUS OPTIMIZATION');
    console.log('-'.repeat(35));
    
    const adoptionFunctions = BonusOptimizer.createAdoptionFunctions();
    
    // Business scenarios
    const businessCases = [
      { 
        name: 'Startup Launch', 
        days: 15, 
        target: 200, 
        adoption: adoptionFunctions.linear(100),
        description: 'Quick growth needed, linear response'
      },
      { 
        name: 'Enterprise Scale', 
        days: 30, 
        target: 1000, 
        adoption: adoptionFunctions.logistic(75, 0.08),
        description: 'Large target, S-curve adoption'
      },
      { 
        name: 'Budget Conscious', 
        days: 20, 
        target: 300, 
        adoption: adoptionFunctions.threshold(30, 80),
        description: 'Threshold effect expected'
      }
    ];
    
    console.log('Optimal bonus recommendations:');
    businessCases.forEach(scenario => {
      const bonus = BonusOptimizer.minBonusForTarget(scenario.days, scenario.target, scenario.adoption);
      const result = bonus ? `$${bonus}` : 'Not achievable';
      console.log(`  ${scenario.name}: ${result}`);
      console.log(`    └─ ${scenario.description}`);
    });
    
    // Sensitivity analysis
    console.log('\nBonus sensitivity (Logistic adoption, 25 days):');
    const sensitivity = BonusOptimizer.analyzeBonusSensitivity(
      25, 
      adoptionFunctions.logistic(60, 0.1), 
      [0, 40, 80, 120]
    );
    
    sensitivity.forEach(point => {
      const roi = point.bonus > 0 ? (point.hires / point.bonus).toFixed(1) : 'N/A';
      console.log(`  $${point.bonus}: ${point.hires.toFixed(0)} hires (ROI: ${roi})`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(' IMPLEMENTATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\n All 5 parts implemented and working:');
    console.log('   1. Referral Graph with constraint enforcement');
    console.log('   2. Reach analysis with BFS and caching');
    console.log('   3. Multi-metric influencer identification');
    console.log('   4. Deterministic network growth simulation');
    console.log('   5. Binary search bonus optimization');
    console.log('\n Key metrics:');
    console.log(`   • Graph: ${stats.userCount} users, ${stats.edgeCount} edges`);
    console.log(`   • Top influencer reach: ${topReferrers[0]?.reachCount || 0}`);
    console.log(`   • 30-day growth potential: ${NetworkGrowthSimulation.simulate(0.2, 30)[29].toFixed(0)} hires`);
    console.log(`   • Optimization examples: $${businessCases.map(bc => BonusOptimizer.minBonusForTarget(bc.days, bc.target, bc.adoption)).filter(Boolean).join(', $')}`);
    
    console.log('\n Ready for production use!');
    
  } catch (error) {
    console.error(' Demonstration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run demonstration
demonstrateCompleteSystem();
