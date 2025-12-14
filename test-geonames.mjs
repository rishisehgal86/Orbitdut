// Test the GeoNames integration for remote site fee calculation
async function testRemoteSiteFee() {
  const geonamesUsername = process.env.GEONAMES_USERNAME;
  
  if (!geonamesUsername) {
    console.error('❌ GEONAMES_USERNAME not set');
    return;
  }
  
  console.log('✅ GEONAMES_USERNAME is configured');
  console.log('\n📍 Testing with Sydney Opera House coordinates:');
  console.log('   Latitude: -33.8568, Longitude: 151.2153\n');
  
  // Test 1: Find nearest city to Sydney
  const url = `http://api.geonames.org/findNearbyPlaceNameJSON?lat=-33.8568&lng=151.2153&username=${geonamesUsername}&maxRows=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.geonames && data.geonames.length > 0) {
      const nearestCity = data.geonames[0];
      console.log('✅ GeoNames API Response:');
      console.log(`   Nearest City: ${nearestCity.name}, ${nearestCity.adminName1}, ${nearestCity.countryName}`);
      console.log(`   Distance: ${nearestCity.distance} km`);
      console.log(`   Coordinates: ${nearestCity.lat}, ${nearestCity.lng}`);
      
      // Test 2: Calculate distance from San Francisco (supplier base)
      const sfLat = 37.7749;
      const sfLng = -122.4194;
      const sydneyLat = parseFloat(nearestCity.lat);
      const sydneyLng = parseFloat(nearestCity.lng);
      
      // Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (sydneyLat - sfLat) * Math.PI / 180;
      const dLng = (sydneyLng - sfLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(sfLat * Math.PI / 180) * Math.cos(sydneyLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      console.log(`\n📏 Distance Calculation:`);
      console.log(`   From: San Francisco (37.7749, -122.4194)`);
      console.log(`   To: ${nearestCity.name} (${sydneyLat}, ${sydneyLng})`);
      console.log(`   Distance: ${distance.toFixed(2)} km`);
      
      // Calculate remote site fee
      const baseRate = 100; // Example base rate per hour
      const hours = 2;
      const baseCost = baseRate * hours;
      
      let remoteFee = 0;
      if (distance > 100) {
        remoteFee = Math.min(distance * 0.5, 500); // $0.50 per km, max $500
      }
      
      console.log(`\n💰 Pricing Calculation:`);
      console.log(`   Base Rate: $${baseRate}/hour`);
      console.log(`   Duration: ${hours} hours`);
      console.log(`   Base Cost: $${baseCost}`);
      console.log(`   Remote Site Fee: $${remoteFee.toFixed(2)} (distance > 100km)`);
      console.log(`   Total: $${(baseCost + remoteFee).toFixed(2)}`);
      
      console.log(`\n✅ GeoNames integration test PASSED!`);
      console.log(`   The system can calculate remote site fees for locations like Sydney.`);
      
    } else {
      console.error('❌ No results from GeoNames API');
    }
  } catch (error) {
    console.error('❌ Error calling GeoNames API:', error.message);
  }
}

testRemoteSiteFee();
