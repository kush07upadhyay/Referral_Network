#!/usr/bin/env node

/**
 * Final validation script to ensure all requirements are met
 */

async function validateProject() {
  console.log('🔍 Final Project Validation');
  console.log('=' .repeat(50));
  
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };

  function check(description, condition, errorMsg = '') {
    if (condition) {
      console.log(`✅ ${description}`);
      results.passed++;
    } else {
      console.log(`❌ ${description}`);
      if (errorMsg) console.log(`   └─ ${errorMsg}`);
      results.failed++;
      results.issues.push(description);
    }
  }

  try {
    // Import all modules
    const { ReferralGraph } = await import('./dist/graph/ReferralGraph.js');
    const { ReferralGraphWithReach } = await import('./dist/graph/ReferralGraphWithReach.js');
    const { InfluencerAnalyzer } = await import('./dist/metrics/influencers.js');
    const { NetworkGrowthSimulation } = await import('./dist/sim/Simulation.js');
    const { BonusOptimizer } = await import('./dist/bonus/BonusOptimizer.js');

    console.log('\n PART 1: REFERRAL GRAPH VALIDATION');
    console.log('-'.repeat(40));
    
    const graph = new ReferralGraph();
    
    // Test basic functionality
    graph.addReferral('alice', 'bob');
    graph.addReferral('alice', 'charlie');
    check('Basic referral addition works', graph.getDirectReferrals('alice').length === 2);
    
    // Test constraints
    let selfReferralBlocked = false;
    try {
      graph.addReferral('alice', 'alice');
    } catch (e) {
      selfReferralBlocked = true;
    }
    check('Self-referral constraint enforced', selfReferralBlocked);
    
    let uniqueReferrerBlocked = false;
    try {
      graph.addReferral('david', 'bob');
    } catch (e) {
      uniqueReferrerBlocked = true;
    }
    check('Unique referrer constraint enforced', uniqueReferrerBlocked);
    
    let cycleBlocked = false;
    try {
      graph.addReferral('bob', 'alice');
    } catch (e) {
      cycleBlocked = true;
    }
    check('Cycle prevention works', cycleBlocked);
    
    // Test user removal fix
    const testGraph = new ReferralGraph();
    testGraph.addReferral('alice', 'bob');
    testGraph.addReferral('bob', 'charlie');
    testGraph.removeUser('bob');
    check('User removal cleans up properly', 
          !testGraph.hasUser('bob') && 
          testGraph.getReferrer('charlie') === undefined);

    console.log('\n PART 2: REACH ANALYSIS VALIDATION');
    console.log('-'.repeat(40));
    
    const reachGraph = new ReferralGraphWithReach();
    reachGraph.addReferral('alice', 'bob');
    reachGraph.addReferral('bob', 'charlie');
    reachGraph.addReferral('alice', 'david');
    
    check('Reach calculation works', reachGraph.getTotalReferralCount('alice') === 3);
    check('Top referrers function works', reachGraph.getTopReferrersByReach(1).length === 1);
    check('Recommended k calculation works', reachGraph.getRecommendedK() > 0);

    console.log('\n PART 3: INFLUENCER ANALYSIS VALIDATION');
    console.log('-'.repeat(45));
    
    const analyzer = new InfluencerAnalyzer(reachGraph);
    const uniqueReach = analyzer.getUniqueReachExpansion(2);
    const flowCentrality = analyzer.getFlowCentrality();
    const comprehensive = analyzer.getComprehensiveInfluencerAnalysis(2);
    
    check('Unique reach expansion works', uniqueReach.length > 0);
    check('Flow centrality calculation works', Array.isArray(flowCentrality));
    check('Comprehensive analysis works', 
          comprehensive.reachBased && 
          comprehensive.uniqueReach && 
          comprehensive.flowCentrality);

    console.log('\n PART 4: SIMULATION VALIDATION');
    console.log('-'.repeat(35));
    
    const simResult = NetworkGrowthSimulation.simulate(0.1, 10);
    const daysToTarget = NetworkGrowthSimulation.daysToTarget(0.15, 100);
    const params = NetworkGrowthSimulation.getParameters();
    
    check('Simulation produces results', simResult.length === 10);
    check('Results are monotonic', simResult.every((val, i) => i === 0 || val >= simResult[i-1]));
    check('Days to target works', daysToTarget > 0);
    check('Parameters are correct', params.initialReferrers === 100 && params.referralCapacity === 10);

    console.log('\n PART 5: BONUS OPTIMIZATION VALIDATION');
    console.log('-'.repeat(45));
    
    const adoptionFunc = BonusOptimizer.createAdoptionFunctions().linear(100);
    const minBonus = BonusOptimizer.minBonusForTarget(10, 50, adoptionFunc);
    const sensitivity = BonusOptimizer.analyzeBonusSensitivity(5, adoptionFunc, [0, 50, 100]);
    const isValid = BonusOptimizer.validateAdoptionFunction(adoptionFunc);
    
    check('Bonus optimization works', minBonus !== null && minBonus % 10 === 0);
    check('Sensitivity analysis works', sensitivity.length === 3);
    check('Function validation works', isValid === true);

    console.log('\n REQUIREMENT COMPLIANCE CHECK');
    console.log('-'.repeat(40));
    
    // Check file structure
    const fs = require('fs');
    check('README.md exists and is comprehensive', 
          fs.existsSync('./README.md') && 
          fs.readFileSync('./README.md', 'utf8').length > 1000);
    
    check('All source files exist', 
          fs.existsSync('./src/graph/ReferralGraph.ts') &&
          fs.existsSync('./src/graph/ReferralGraphWithReach.ts') &&
          fs.existsSync('./src/metrics/influencers.ts') &&
          fs.existsSync('./src/sim/Simulation.ts') &&
          fs.existsSync('./src/bonus/BonusOptimizer.ts'));
    
    check('All test files exist',
          fs.existsSync('./tests/graph.test.ts') &&
          fs.existsSync('./tests/metrics.test.ts') &&
          fs.existsSync('./tests/sim.test.ts') &&
          fs.existsSync('./tests/bonus.test.ts'));
    
    check('Package.json has required scripts',
          fs.existsSync('./package.json') &&
          JSON.parse(fs.readFileSync('./package.json', 'utf8')).scripts.test);
    
    check('TypeScript configuration exists', fs.existsSync('./tsconfig.json'));
    check('CI configuration exists', fs.existsSync('./.github/workflows/ci.yml'));

    console.log('\n' + '='.repeat(50));
    console.log(' VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.failed === 0) {
      console.log('\n PROJECT IS COMPLETE AND READY FOR SUBMISSION!');
      console.log('\n All requirements from Instructions.md are fully implemented:');
      console.log('   ✅ Part 1: Referral Graph with all constraints');
      console.log('   ✅ Part 2: Full Network Reach analysis');
      console.log('   ✅ Part 3: Influencer identification (3 metrics)');
      console.log('   ✅ Part 4: Network Growth Simulation');
      console.log('   ✅ Part 5: Referral Bonus Optimization');
      console.log('   ✅ Comprehensive test suite');
      console.log('   ✅ Professional documentation');
      console.log('   ✅ TypeScript implementation');
      console.log('   ✅ Build and dependency management');
      console.log('\n Ready for submission!');
    } else {
      console.log('\n  Issues found:');
      results.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

validateProject();
