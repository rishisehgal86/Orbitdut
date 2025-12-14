# GeoNames API Setup Instructions

The remote site fee feature requires a free GeoNames API account to calculate distances from major cities (250k+ population).

## Quick Setup (2 minutes)

### Step 1: Create Free GeoNames Account

1. Visit [https://www.geonames.org/login](https://www.geonames.org/login)
2. Click "create a new user account" 
3. Fill in the registration form:
   - Username (this will be your API username)
   - Email address
   - Password
4. Check your email and click the confirmation link
5. **Important:** After confirming your email, log in to your account and go to [https://www.geonames.org/manageaccount](https://www.geonames.org/manageaccount)
6. Click "Click here to enable" under "Free Web Services" section
7. Your account is now activated for API access!

### Step 2: Add API Username to Environment

Once you have your GeoNames username, you need to add it as an environment variable:

1. In the Manus UI, go to **Management UI → Settings → Secrets**
2. Click "Add New Secret"
3. Add the following:
   - **Key:** `GEONAMES_USERNAME`
   - **Value:** Your GeoNames username (from Step 1)
4. Save the secret

### Step 3: Restart the Server

After adding the environment variable, restart the development server:

1. In the Manus UI, click the restart button in the Management UI header
2. Or wait for the server to automatically pick up the new environment variable

## How It Works

Once configured, the remote site fee system will:

1. **Find nearest major city:** When a customer enters a site address, the system queries GeoNames to find the nearest city with 250k+ population
2. **Calculate distance:** Calculates straight-line distance in kilometers
3. **Apply fee if remote:** If distance > 50km, charges $1/km for the excess distance
4. **Split revenue:** Customer pays $1/km, supplier receives $0.50/km, platform keeps $0.50/km

## Example Pricing

**Site within 50km of major city:**
- Distance: 35km from Portland, OR
- Remote site fee: $0.00 (within free zone)

**Remote site:**
- Distance: 125km from nearest major city (Portland, OR)
- Billable distance: 125km - 50km = 75km
- Customer pays: 75km × $1.00 = $75.00
- Supplier receives: 75km × $0.50 = $37.50
- Platform revenue: 75km × $0.50 = $37.50

## API Limits

The free GeoNames account includes:

- **2,000 requests per hour** (more than sufficient for typical usage)
- **30,000 requests per day**
- No credit card required
- No expiration

For higher limits, GeoNames offers premium plans, but the free tier should be adequate for most marketplace operations.

## Troubleshooting

**"GeoNames API error: user account not enabled"**
- Make sure you've enabled the "Free Web Services" in your GeoNames account settings
- Visit [https://www.geonames.org/manageaccount](https://www.geonames.org/manageaccount) and click "enable"

**"GEONAMES_USERNAME environment variable not set"**
- Add the secret in Management UI → Settings → Secrets
- Restart the server after adding the secret

**"No major cities found near location"**
- This can happen for extremely remote locations (e.g., Antarctica, middle of ocean)
- The system will gracefully handle this by not applying a remote site fee
- Check the server logs for details

## Testing

To test the remote site fee calculation:

1. Go to **Request Service** page
2. Fill in the service details
3. Enter a remote location (e.g., "Bend, Oregon" or "Alice Springs, Australia")
4. The pricing estimate will show:
   - Nearest major city name and distance
   - Remote site fee breakdown (if applicable)
   - Total price including remote site fee

## Support

For GeoNames API issues, visit:
- Documentation: [https://www.geonames.org/export/web-services.html](https://www.geonames.org/export/web-services.html)
- Forum: [https://forum.geonames.org/](https://forum.geonames.org/)
