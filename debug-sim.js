const { NetworkGrowthSimulation } = require('./dist/sim/Simulation');

console.log('Perfect success rate (p=1) results:');
const result = NetworkGrowthSimulation.simulate(1, 5);
result.forEach((val, day) => console.log(`Day ${day+1}: ${val}`));

console.log('\nTesting high target with low probability:');
const highTarget = NetworkGrowthSimulation.daysToTarget(0.01, 1000000);
console.log(`Days to reach 1M with p=0.01: ${highTarget}`);
