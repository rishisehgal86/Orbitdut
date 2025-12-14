/**
 * GeoNames API Integration
 * Finds nearest major city (250k+ population) for a given location
 */

interface GeonamesCity {
  geonameId: number;
  name: string;
  lat: string;
  lng: string;
  distance: string; // in km
  countryCode: string;
  countryName: string;
  population: number;
  adminName1?: string; // state/province
}

interface GeonamesResponse {
  geonames: GeonamesCity[];
}

/**
 * Find the nearest major city (250k+ population) to given coordinates
 * Uses GeoNames API with cities15000 filter, then filters by 250k+ population
 * 
 * @param latitude - Latitude of the location
 * @param longitude - Longitude of the location
 * @param radiusKm - Search radius in km (default: 200km)
 * @returns Nearest major city info or null if none found
 */
export async function findNearestMajorCity(
  latitude: number,
  longitude: number,
  radiusKm: number = 300
): Promise<{
  cityName: string;
  distanceKm: number;
  countryCode: string;
  countryName: string;
} | null> {
  try {
    // GeoNames requires a free account - username should be configured
    // For now, using 'demo' for testing - MUST be replaced with actual account
    const username = process.env.GEONAMES_USERNAME || 'demo';
    
    // Use cities15000 filter (cities with 15k+ population) and search within radius
    // We'll filter for 250k+ on our end
    const url = new URL('http://api.geonames.org/findNearbyPlaceNameJSON');
    url.searchParams.set('lat', latitude.toString());
    url.searchParams.set('lng', longitude.toString());
    url.searchParams.set('radius', radiusKm.toString());
    url.searchParams.set('cities', 'cities15000'); // Pre-filter for larger cities
    url.searchParams.set('maxRows', '50'); // Get more results to find 250k+ cities
    url.searchParams.set('username', username);
    url.searchParams.set('style', 'FULL'); // Get full details including population
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('GeoNames API error:', response.status, response.statusText);
      return null;
    }
    
    const data: GeonamesResponse = await response.json();
    
    if (!data.geonames || data.geonames.length === 0) {
      console.log('No cities found within radius');
      return null;
    }
    
    // Filter for cities with population >= 250,000
    const majorCities = data.geonames.filter(city => city.population >= 250000);
    
    if (majorCities.length === 0) {
      console.log('No cities with 250k+ population found within 300km radius - location unserviceable');
      return null;
    }
    
    // Get the nearest major city (results are sorted by distance)
    const nearestCity = majorCities[0];
    
    return {
      cityName: nearestCity.name,
      distanceKm: parseFloat(nearestCity.distance),
      countryCode: nearestCity.countryCode,
      countryName: nearestCity.countryName,
    };
  } catch (error) {
    console.error('Error finding nearest major city:', error);
    return null;
  }
}

/**
 * Format city name for display (includes state/country if available)
 */
export function formatCityName(
  cityName: string,
  countryCode: string,
  adminName?: string
): string {
  if (adminName) {
    return `${cityName}, ${adminName}, ${countryCode}`;
  }
  return `${cityName}, ${countryCode}`;
}
