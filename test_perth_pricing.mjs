import { execSync } from 'child_process';

// Use curl to test the tRPC endpoint with proper batch format
const query = {
  serviceType: "L1 Network Engineer",
  serviceLevel: "next_day",
  durationMinutes: 120,
  city: "Perth",
  country: "AU",
  scheduledDateTime: "2025-12-15T09:00",
  timezone: "Australia/Perth"
};

// tRPC expects batch format with input wrapped
const batchInput = {
  "0": {
    json: query
  }
};

const encodedInput = encodeURIComponent(JSON.stringify(batchInput));
const url = `http://localhost:3000/api/trpc/jobs.getEstimatedPrice?batch=1&input=${encodedInput}`;

console.log("Testing Perth, Australia pricing with L1 Network Engineer...\n");

try {
  const result = execSync(`curl -s "${url}"`, { encoding: 'utf-8' });
  const parsed = JSON.parse(result);
  
  console.log("API Response:");
  console.log(JSON.stringify(parsed, null, 2));
  
  if (parsed[0]?.result?.data) {
    const data = parsed[0].result.data;
    console.log("\n✅ SUCCESS! Pricing engine returned:");
    console.log(`  - Available: ${data.available}`);
    console.log(`  - Supplier Count: ${data.supplierCount}`);
    if (data.estimatedPriceCents) {
      console.log(`  - Estimated Price: $${(data.estimatedPriceCents / 100).toFixed(2)}`);
      console.log(`  - Min Price: $${(data.minPriceCents / 100).toFixed(2)}`);
      console.log(`  - Max Price: $${(data.maxPriceCents / 100).toFixed(2)}`);
    } else {
      console.log(`  - Message: ${data.message}`);
    }
  } else {
    console.log("\n❌ FAILED: No pricing data returned");
  }
} catch (error) {
  console.error("Error:", error.message);
}
