// Test OOH detection with duration extending past 5 PM
const { detectOOH } = require('./shared/oohDetection.ts');

// Test case: 3 PM start + 3 hours = 6 PM end (should trigger OOH)
const result = detectOOH(
  '2025-01-08', // Wednesday
  '15:00',      // 3 PM
  180,          // 3 hours (180 minutes)
  'scheduled'
);

console.log('Test: 3 PM + 3 hours (ends at 6 PM)');
console.log('Result:', JSON.stringify(result, null, 2));
console.log('Expected: isOOH=true, reason includes "extends beyond business hours"');
