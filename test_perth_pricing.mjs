import fetch from 'node-fetch';

const testPricing = async () => {
  const response = await fetch('http://localhost:3000/api/trpc/customer.getEstimatedPrice?input=' + encodeURIComponent(JSON.stringify({
    serviceType: 'L1 Network Engineer',
    serviceLevel: 'next_day',
    durationMinutes: 120,
    city: 'Perth',
    country: 'AU',
    scheduledDateTime: '2025-12-15T09:00:00'
  })), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
};

testPricing().catch(console.error);
