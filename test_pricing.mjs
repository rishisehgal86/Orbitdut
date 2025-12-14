// Test the getEstimatedPrice procedure with Perth, Australia
const testData = {
  serviceType: "L1 Network Engineer",
  serviceLevel: "next_day",
  durationMinutes: 120,
  city: "Perth",
  country: "AU",
  scheduledDateTime: "2025-12-15T09:00",
  timezone: "Australia/Perth"
};

console.log("Testing pricing with:", JSON.stringify(testData, null, 2));

// Make HTTP request to tRPC endpoint
const response = await fetch("http://localhost:3000/api/trpc/jobs.getEstimatedPrice?input=" + encodeURIComponent(JSON.stringify(testData)));
const result = await response.json();

console.log("\nResult:", JSON.stringify(result, null, 2));
