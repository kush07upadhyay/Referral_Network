/**
 * Example: Bonus optimization scenarios
 * Demonstrates Part 5 functionality
 */

import { BonusOptimizer } from '../src/bonus/BonusOptimizer';

console.log('=== Bonus Optimization Example ===\n');

// Create different adoption probability functions
const adoptionFunctions = BonusOptimizer.createAdoptionFunctions();

console.log(' Available Adoption Functions:');
console.log('  1. Linear: Probability increases linearly with bonus');
console.log('  2. Logistic: S-curve with slow start, rapid middle, diminishing returns');
console.log('  3. Square Root: Diminishing returns from the start');
console.log('  4. Threshold: No effect until threshold, then linear');
console.log('  5. Constant: For testing edge cases\n');

// Scenario 1: Startup with linear adoption
console.log(' Scenario 1: Startup with Linear Adoption');
console.log('Goal: 200 hires in 15 days, linear adoption (max at $100)');

const linearAdoption = adoptionFunctions.linear(100);
const startupBonus = BonusOptimizer.minBonusForTarget(15, 200, linearAdoption);

console.log(` Minimum bonus: ${startupBonus ? `$${startupBonus}` : 'Not achievable'}`);

// Scenario 2: Enterprise with logistic adoption
console.log('\n Scenario 2: Enterprise with Logistic Adoption');
console.log('Goal: 1000 hires in 30 days, logistic curve (midpoint $75, moderate steepness)');

const logisticAdoption = adoptionFunctions.logistic(75, 0.08);
const enterpriseBonus = BonusOptimizer.minBonusForTarget(30, 1000, logisticAdoption);

console.log(` Minimum bonus: ${enterpriseBonus ? `$${enterpriseBonus}` : 'Not achievable'}`);

// Scenario 3: Budget-conscious with threshold
console.log('\n Scenario 3: Budget-Conscious with Threshold Effect');
console.log('Goal: 300 hires in 20 days, no effect until $30, then linear over $80 range');

const thresholdAdoption = adoptionFunctions.threshold(30, 80);
const budgetBonus = BonusOptimizer.minBonusForTarget(20, 300, thresholdAdoption);

console.log(` Minimum bonus: ${budgetBonus ? `$${budgetBonus}` : 'Not achievable'}`);

// Sensitivity Analysis
console.log('\n Bonus Sensitivity Analysis');
console.log('Analyzing how hiring outcomes change with bonus amount (Logistic adoption, 25 days):\n');

const bonusRange = [0, 20, 40, 60, 80, 100, 120, 150];
const sensitivity = BonusOptimizer.analyzeBonusSensitivity(25, logisticAdoption, bonusRange);

console.log('Bonus | Probability | Expected Hires | ROI (Hires/$)');
console.log('------|-------------|----------------|---------------');
sensitivity.forEach(result => {
  const roi = result.bonus > 0 ? (result.hires / result.bonus).toFixed(2) : 'N/A';
  console.log(
    `$${result.bonus.toString().padStart(4)} | ` +
    `${result.probability.toFixed(3).padStart(11)} | ` +
    `${result.hires.toFixed(1).padStart(14)} | ` +
    `${roi.toString().padStart(13)}`
  );
});

// Function validation
console.log('\n Adoption Function Validation:');
const functions = [
  { name: 'Linear', func: linearAdoption },
  { name: 'Logistic', func: logisticAdoption },
  { name: 'Threshold', func: thresholdAdoption },
  { name: 'Square Root', func: adoptionFunctions.sqrtDiminishing(150) }
];

functions.forEach(({ name, func }) => {
  const isValid = BonusOptimizer.validateAdoptionFunction(func);
  console.log(`  ${name}: ${isValid ? '✅ Valid' : '❌ Invalid'} (monotonic & bounded)`);
});

// Real-world comparison
console.log('\n Real-World Business Comparison:');
console.log('\nComparing different adoption curves for 500 hires in 20 days:');

const businessScenarios = [
  { name: 'Conservative (Linear)', func: adoptionFunctions.linear(200) },
  { name: 'Typical (Logistic)', func: adoptionFunctions.logistic(80, 0.06) },
  { name: 'Skeptical (Threshold)', func: adoptionFunctions.threshold(50, 100) },
  { name: 'Saturation (Sqrt)', func: adoptionFunctions.sqrtDiminishing(300) }
];

console.log('\nScenario           | Min Bonus | Efficiency Notes');
console.log('-------------------|-----------|------------------');
businessScenarios.forEach(scenario => {
  const bonus = BonusOptimizer.minBonusForTarget(20, 500, scenario.func);
  const bonusStr = bonus ? `$${bonus}` : 'N/A';
  let efficiency = '';
  
  if (bonus) {
    if (bonus <= 50) efficiency = 'Highly efficient';
    else if (bonus <= 100) efficiency = 'Moderately efficient';
    else if (bonus <= 200) efficiency = 'Expensive but viable';
    else efficiency = 'Very expensive';
  } else {
    efficiency = 'Target not achievable';
  }
  
  console.log(`${scenario.name.padEnd(18)} | ${bonusStr.padStart(9)} | ${efficiency}`);
});

console.log('\n Key Insights:');
console.log('  • Linear adoption usually requires higher bonuses');
console.log('  • Logistic curves can be very efficient in the sweet spot');
console.log('  • Threshold effects delay impact but can be cost-effective');
console.log('  • Diminishing returns (sqrt) may require higher investment');

console.log('\n Bonus optimization examples completed!');
