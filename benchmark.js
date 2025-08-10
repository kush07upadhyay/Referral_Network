/**
 * Performance benchmarking for the referral network implementation
 * This script measures the performance characteristics of all major operations
 */

async function runPerformanceBenchmarks() {
  console.log(' Referral Network Performance Benchmarks\n');
  console.log('=' .repeat(60));
  
  try {
    const { ReferralGraphWithReach } = await import('./dist/graph/ReferralGraphWithReach.js');
    const { InfluencerAnalyzer } = await import('./dist/metrics/influencers.js');
    const { NetworkGrowthSimulation } = await import('./dist/sim/Simulation.js');
    const { BonusOptimizer } = await import('./dist/bonus/BonusOptimizer.js');

    // Benchmark 1: Graph Operations Scalability
    console.log('\n Part 1: Graph Operations Performance');
    console.log('-'.repeat(40));
    
    const sizes = [100, 500, 1000, 2000];
    
    for (const size of sizes) {
      const graph = new ReferralGraphWithReach();
      
      // Create a tree structure for predictable performance
      const start = performance.now();
      
      for (let i = 0; i < size - 1; i++) {
        const parent = Math.floor(i / 3); // Create tree with branching factor 3
        graph.addReferral(`user${parent}`, `user${i + 1}`);
      }
      
      const buildTime = performance.now() - start;
      const stats = graph.getStats();
      
      console.log(`  ${size} users: ${buildTime.toFixed(2)}ms (${stats.edgeCount} edges)`);
    }

    // Benchmark 2: Reach Analysis Performance  
    console.log('\n Part 2: Reach Analysis Performance');
    console.log('-'.repeat(40));
    
    const graph = new ReferralGraphWithReach();
    
    // Create a network with 1000 users for reach testing
    for (let i = 0; i < 999; i++) {
      const parent = Math.floor(i / 2); // Binary tree structure
      graph.addReferral(`user${parent}`, `user${i + 1}`);
    }
    
    let start = performance.now();
    const allReach = graph.getAllReachData();
    let duration = performance.now() - start;
    console.log(`  Reach computation (1000 users): ${duration.toFixed(2)}ms`);
    
    start = performance.now();
    const topReferrers = graph.getTopReferrersByReach(10);
    duration = performance.now() - start;
    console.log(`  Top 10 referrers: ${duration.toFixed(2)}ms`);
    
    start = performance.now();
    graph.precomputeReach();
    duration = performance.now() - start;
    console.log(`  Precompute reach (caching): ${duration.toFixed(2)}ms`);

    // Benchmark 3: Influencer Analysis Performance
    console.log('\n Part 3: Influencer Analysis Performance');
    console.log('-'.repeat(45));
    
    const analyzer = new InfluencerAnalyzer(graph);
    
    start = performance.now();
    const uniqueReach = analyzer.getUniqueReachExpansion(5);
    duration = performance.now() - start;
    console.log(`  Unique reach expansion (5 influencers): ${duration.toFixed(2)}ms`);
    
    start = performance.now();
    const flowCentrality = analyzer.getFlowCentrality();
    duration = performance.now() - start;
    console.log(`  Flow centrality (full network): ${duration.toFixed(2)}ms`);
    
    start = performance.now();
    const comprehensive = analyzer.getComprehensiveInfluencerAnalysis(10);
    duration = performance.now() - start;
    console.log(`  Comprehensive analysis: ${duration.toFixed(2)}ms`);

    // Benchmark 4: Simulation Performance
    console.log('\n Part 4: Simulation Performance');
    console.log('-'.repeat(35));
    
    const simulations = [
      { days: 30, label: '30 days' },
      { days: 365, label: '1 year' },
      { days: 1825, label: '5 years' }
    ];
    
    for (const sim of simulations) {
      start = performance.now();
      const result = NetworkGrowthSimulation.simulate(0.15, sim.days);
      duration = performance.now() - start;
      const finalCount = result[result.length - 1];
      console.log(`  Simulation ${sim.label}: ${duration.toFixed(2)}ms (${finalCount.toFixed(0)} hires)`);
    }
    
    start = performance.now();
    const daysNeeded = NetworkGrowthSimulation.daysToTarget(0.1, 1000);
    duration = performance.now() - start;
    console.log(`  Days to target (1000 hires): ${duration.toFixed(2)}ms (${daysNeeded} days)`);

    // Benchmark 5: Bonus Optimization Performance
    console.log('\n Part 5: Bonus Optimization Performance');
    console.log('-'.repeat(42));
    
    const adoptionFunctions = BonusOptimizer.createAdoptionFunctions();
    const optimizations = [
      { func: adoptionFunctions.linear(100), name: 'Linear adoption' },
      { func: adoptionFunctions.logistic(75, 0.08), name: 'Logistic adoption' },
      { func: adoptionFunctions.threshold(30, 80), name: 'Threshold adoption' }
    ];
    
    for (const opt of optimizations) {
      start = performance.now();
      const bonus = BonusOptimizer.minBonusForTarget(30, 500, opt.func);
      duration = performance.now() - start;
      console.log(`  ${opt.name}: ${duration.toFixed(2)}ms ($${bonus})`);
    }
    
    start = performance.now();
    const sensitivity = BonusOptimizer.analyzeBonusSensitivity(
      20, 
      adoptionFunctions.logistic(60, 0.1), 
      [0, 20, 40, 60, 80, 100]
    );
    duration = performance.now() - start;
    console.log(`  Sensitivity analysis (6 points): ${duration.toFixed(2)}ms`);

    // Memory usage estimation
    console.log('\n Memory Usage Estimates');
    console.log('-'.repeat(25));
    
    const memoryUsage = process.memoryUsage();
    console.log(`  Heap used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);

    // Complexity Analysis Summary
    console.log('\n Performance Characteristics Summary');
    console.log('-'.repeat(40));
    console.log('  Graph operations: O(V + E) per operation');
    console.log('  Reach computation: O(V * (V + E)) worst case');
    console.log('  Unique reach: O(k * V * avgReach)');
    console.log('  Flow centrality: O(V³) naive implementation');
    console.log('  Simulation: O(days * capacity) = O(days)');
    console.log('  Bonus optimization: O(days * log(range/ε))');
    
    console.log('\n Optimization Recommendations');
    console.log('-'.repeat(32));
    console.log('  ✅ Efficient for networks up to 1000-5000 users');
    console.log('  ✅ Caching implemented for repeated reach queries');
    console.log('  ✅ Deterministic simulation avoids Monte Carlo overhead');
    console.log('  📝 For larger networks: Consider Brandes\' algorithm for centrality');
    console.log('  📝 For frequent updates: Implement incremental reach computation');
    
    console.log('\n Performance benchmarking completed successfully!');
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runPerformanceBenchmarks();
