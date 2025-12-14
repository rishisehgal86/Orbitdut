# Orbidut Marketplace - Project TODO

## Phase 37: Out-of-Hours (OOH) Booking System - COMPLETED ✅

### Database Schema
- [x] Add `offersOutOfHours` boolean to suppliers table
- [x] Add `isOutOfHours` boolean to jobs table (already existed)
- [x] Add `oohPremiumPercent` integer to jobs table (stores 50, 100, or 150)
- [x] Add `oohReason` text to jobs table (stores why it's OOH: evening, weekend, holiday, etc.)

### OOH Detection Logic
- [x] Create shared utility function to detect OOH conditions
- [x] Check if start time is outside 9 AM - 5 PM
- [x] Check if end time (start + duration) extends beyond 5 PM
- [x] Check if booking is on weekend (Saturday/Sunday)
- [x] Calculate appropriate premium based on service level:
  - [x] Scheduled OOH: +50%
  - [x] Next Day OOH: +100%
  - [x] Same Day OOH: +150%

### Request Form Integration
- [x] Add real-time OOH detection when date/time/duration changes
- [x] Display amber alert when OOH conditions detected
- [x] Show OOH premium percentage in alert
- [x] Show specific OOH reasons (weekend, evening, extends beyond hours)
- [x] Store OOH flag and premium in sessionStorage for pricing page

### Supplier Settings
- [x] Add "Offer Out-of-Hours Services" toggle to supplier settings
- [x] Add OOH availability section with premium rate display
- [x] Show OOH premium breakdown when enabled
- [x] Backend tRPC procedure to update OOH availability

### Testing
- [x] Test OOH detection for evening bookings (after 5 PM)
- [x] Test OOH detection for early morning bookings (before 9 AM)
- [x] Test OOH detection for weekend bookings
- [x] Test OOH detection when duration extends past 5 PM
- [x] Test premium calculation for all three service levels
- [x] Write vitest tests for OOH detection logic (17 tests, all passing)
- [x] Write vitest tests for OOH formatting utilities

## Phase 35-36: Service Level System with Weekend Booking Fix - COMPLETED ✅

### Service Level Selector
- [x] Implement three-tier service level system:
  - [x] Same Business Day (locked to today)
  - [x] Next Business Day (locked to next business day, skips weekends)
  - [x] Scheduled (48+ hours, allows weekends)
- [x] Auto-adjust date when service level changes
- [x] Lock date field for Same/Next Business Day
- [x] Allow manual date selection for Scheduled
- [x] Fix weekend booking gap (Scheduled now allows Saturday/Sunday)

### Request Form Improvements
- [x] Add service level selector with descriptions
- [x] Add duration selector (2-8 hours)
- [x] Add timezone detection and display
- [x] Add site name field (optional)
- [x] Update service types to L1_EUC, L1_NETWORK, SMART_HANDS
- [x] Add date validation for each service level
- [x] Add helpful UI hints for locked dates

## Future Enhancements (Not Yet Implemented)

### Job Matching Integration
- [ ] Filter suppliers by OOH availability when job is OOH
- [ ] Apply OOH premium to job pricing calculations
- [ ] Display OOH badge on job cards in supplier portal
- [ ] Show OOH premium in job detail pricing breakdown

### UI/UX Enhancements
- [ ] Add OOH badge to supplier cards when enabled
- [ ] Display OOH reason in job timeline/history
- [ ] Add OOH filter to job listings
- [ ] Show OOH indicator in schedule section

### Coverage & Pricing Integration
- [ ] Implement real-time coverage check
- [ ] Calculate and display pricing with OOH surcharge
- [ ] Show supplier availability count
- [ ] Display estimated total with OOH breakdown

## Immediate Priority Tasks

- [x] Update rate management interface to clearly show rates are hourly with 2-hour minimum job requirement

## Bugs

- [x] Update remote site fee logic: mark locations beyond 300km from major cities as unserviceable

- [x] Fix OOH warning not displaying in customer request service page - COMPLETED
- [x] Remove irrelevant /request-service page (was working on wrong file) - COMPLETED
- [x] Update OOH warning to generic message (no specific percentage) - COMPLETED


## Job Matching & Automatic Allocation System (White-Label Model)

### Phase 1: Pricing Calculator
- [ ] Create server/pricingCalculator.ts utility
- [ ] Implement calculateJobPricing() function with OOH detection
- [ ] Add pricing fields to jobs table (baseCostCents, oohSurchargeCents, platformFeeCents, etc.)
- [ ] Write vitest tests for all pricing scenarios

### Phase 2: Supplier Matching & Ranking (UPDATED WITH SIMPLIFIED ALGORITHM)
- [ ] Create server/supplierMatcher.ts utility
- [ ] Implement findQualifiedSuppliers() function (filters: verified, active, coverage, service type, service level, OOH)
- [ ] Implement rankSuppliers() simplified algorithm:
  - [ ] Priority city coverage > country-only coverage
  - [ ] Higher rating wins (default 2.0/5.0 for new suppliers)
  - [ ] Lower price wins (among equal ratings)
  - [ ] Random tiebreaker
- [ ] Create jobSupplierRankings table
- [ ] Add jobs.getPricingEstimate tRPC procedure
  - [x] Add rating field to suppliers table (default: 200 = 2.0/5.0)

### Phase 3: Automatic Assignment & Cascading
- [ ] Update jobs.create procedure with auto-assignment to best-ranked supplier
- [ ] Create cascadeToNextSupplier() function (for declines/timeouts)
- [ ] Add timeout handling cron job (30-minute response deadline)
- [ ] Implement supplier.acceptJob procedure
- [ ] Implement supplier.declineJob procedure
- [ ] Add supplierResponseDeadline field to jobs table

### Phase 4: Frontend Integration
- [ ] Update customer request service page with pricing estimate display
- [ ] Create supplier pending jobs tab with countdown timer
- [ ] Add accept/decline buttons for suppliers
- [ ] Add email notifications for job assignments
- [ ] Hide supplier names from customer view (white-label)

### Phase 5: Analytics & Monitoring
- [ ] Track supplier acceptance rates
- [ ] Track cascade frequency (how often job goes to 2nd/3rd choice)
- [ ] Create admin dashboard for distribution metrics
- [ ] Monitor coverage gaps

## Supplier Rating System
- [x] Add rating field to suppliers table with default 2.0/5.0 (stored as 200 hundredths)
- [x] Update existing suppliers to have 2.0 rating
- [x] Add rating to new supplier signup flow
- [x] Write comprehensive vitest tests for rating system
- [ ] Implement rating update mechanism based on customer feedback (future)
- [ ] Display supplier rating in admin/supplier dashboards
- [ ] Create rating history/audit trail (future)

### Superadmin Rating System Documentation Page
- [x] Create getRatingStatistics backend procedure (distribution, averages, totals)
- [x] Create getAllSuppliersWithRatings backend procedure (paginated list)
- [x] Create updateSupplierRating backend procedure (admin manual adjustment)
- [x] Create /superadmin/ratings page with documentation
- [x] Build Rating Distribution statistics with charts
- [x] Build Supplier Rating Management table
- [x] Add rating adjustment dialog for admins
- [x] Add to superadmin navigation sidebar
- [x] Fix Ratings page to use SuperadminLayout wrapper with purple sidebar navigation
- [x] Add search bar to search by supplier name
- [x] Add table column filters (country, rating range)
- [x] Add supplier ranking column to Suppliers page

## Payment Processing (Future)
- [ ] Integrate Stripe Connect for supplier payouts
- [ ] Implement payment flow (customer → platform → supplier)
- [ ] Add 15% platform fee deduction
- [ ] Create payment dashboard for suppliers
- [x] Make rating system details collapsible with dropdown on Ratings page
- [x] Make rating distribution collapsible with dropdown on Ratings page
- [x] Replace separate filter controls with sortable column headers on Ratings page
- [x] Coverage by Country should show suppliers count (not areas count)
- [x] Coverage by Supplier should show countries count (not areas count)
- [x] Add expandable/collapsible details to show full lists on Coverage page
- [x] Add hover tooltips to country abbreviations in Coverage Matrix tab showing full country names

## Superadmin Portal - Replace Inline Filters with Sortable Headers
- [x] Remove inline filters and add sortable headers to Verifications table (company name, contact person, country, status, last updated)
- [x] Remove inline filters and add sortable headers to Suppliers table (company name, country, verification status, rating, created date)
- [x] Add sortable headers to Users table (name, email, role, account type, created date)
- [x] Add sortable headers to Jobs table (job ID, customer, supplier, service type, status, price, date)
- [x] Add sortable headers to Coverage Analytics tables (country, supplier count, coverage percentage)

## Superadmin Verification Status Management (Flexible Status Changes)

### Database Schema
- [x] Add isManuallyVerified boolean field to supplierVerification table
- [x] Add manualVerificationReason text field to supplierVerification table
- [x] Add manuallyVerifiedBy text field (admin user email)
- [x] Add manuallyVerifiedAt datetime field
- [x] Run database migration

### Backend
- [x] Create changeVerificationStatus procedure in superadmin router (NOT admin)
- [x] Accept supplierId, newStatus, reason (required), and clearManualFlag parameters
- [x] Update supplierVerification table with new status
- [x] Set isManuallyVerified=1 when changing to approved/rejected without full docs
- [x] Allow clearing manual flag (set isManuallyVerified=0) to revert to normal process
- [x] Store superadmin email and timestamp in manual verification fields
- [x] Update suppliers.isVerified flag based on status (approved=true, others=false)
- [x] Send email notification to supplier about status change
- [x] Track all status changes in audit trail

### Frontend - New Manual Verification Page (/superadmin/verifications/manual)
- [x] Create new page under verifications section
- [x] Add "Manual Verification" tab/link in verifications navigation
- [x] Show list of all suppliers with their current verification status
- [x] Add search/filter by company name, country, current status
- [x] Each row has "Change Status" button
- [x] Status change dialog with:
  - [x] Dropdown for all verification statuses
  - [x] Required reason text field
  - [x] "Clear Manual Verification Flag" checkbox (if already manually verified)
  - [x] Confirmation step
- [x] Display "Manual Verification Status" badge in status column
- [x] Show manual verification details on hover (by whom, when, reason)
- [x] Refresh table after successful status change
- [x] Show success/error toast notifications

### Testing
- [x] Test status change from not_started to approved (sets manual flag)
- [x] Test status change from rejected to approved
- [x] Test revoking manual verification (clear flag)
- [x] Test changing approved back to in_progress
- [x] Verify only superadmins can access this feature
- [x] Verify email notifications are sent
- [x] Verify isVerified flag updates correctly
- [x] Test manual verification badge display
- [x] Write and run vitest tests (9 tests, all passing)

## Bug Fix: Verification Record Not Found Error - COMPLETED ✅

### Issue
- [x] Manual verification status change fails with "Verification record not found" error
- [x] Suppliers created without verification records cannot have status changed

### Solution
- [x] Update changeVerificationStatus to use upsert pattern
- [x] Automatically create verification record if it doesn't exist
- [x] Test with suppliers that have no verification record
- [x] All 3 vitest tests passing (auto-create, status change, batch processing)

## Show Manual Verification Status on Suppliers Page

- [x] Update getAllSuppliers backend to include isManuallyVerified field
- [x] Add "Verification Type" column or badge to Suppliers table
- [x] Display "Manual" badge for manually verified suppliers
- [x] Show verification status (approved/in_progress/rejected) in status column
- [x] Add tooltip with manual verification details (reason, by whom, date)
- [ ] Test with manually verified suppliers

## Optimize Manual Verification Management Table Layout

- [ ] Reduce column widths to fit content
- [ ] Make Contact column more compact (show email on hover or truncate)
- [ ] Optimize Company Name column width
- [ ] Ensure table fits within viewport without horizontal scrolling

## Coverage Page - Display Full Country Names

- [x] Replace country code abbreviations (AG, AR, BS, etc.) with full country names
- [x] Update Coverage by Country table to show full names
- [x] Ensure consistent country name display across the page

## Coverage Analytics Page - Add Search Functionality

- [x] Add search bar to filter coverage data
- [x] Filter by supplier name in Coverage by Supplier section
- [x] Filter by country name in Coverage by Country section
- [x] Update both Analytics and Coverage Matrix views with search
- [x] Show filtered results dynamically


## Coverage Page - Replace All Coverage Areas with Excel Export

- [x] Remove "All Coverage Areas" table section
- [x] Add "Export to Excel" button in Analytics tab
- [x] Generate Excel file with all coverage data (Supplier, Country, Coverage details)
- [x] Use xlsx library for Excel generation
- [x] Include columns: Supplier Name, Country Code, Country Name

## Coverage Page - Move Export Button to Top

- [x] Move Excel export button to top of page in slim frame
- [x] Place between stats cards and search bar
- [x] Make it compact and unobtrusive

## Coverage Page - Inline Export Button with Search Bar

- [ ] Combine export button, explanation text, and search bar on one line
- [ ] Use flex layout to fit all elements horizontally
- [ ] Add brief explanation text between export button and search bar

## Coverage Page - Inline Export Button with Search Bar

- [x] Combine export button and search bar on one line
- [x] Use flex layout to fit both elements horizontally
- [x] Add hover tooltip to export button with explanation

## Dashboard Menu ## Dashboard Menu - Make Manual Verification a Subsection

- [x] Reorganize SuperadminLayout navigation
- [x] Make Manual Verification appear as a subsection under Verifications
- [x] Add visual indentation (ml-6) and smaller text/icon to show hierarchy
- [x] Ensure both menu items navigate correctly

## UI Improvement: Status Badge Styling

- [x] Analyze current badge styling (bright blue, bold appearance)
- [x] Design more subtle badge styles with softer colors and borders
- [x] Update verification status badges (Verified, Unverified)
- [x] Update job status badges (completed, pending supplier acceptance)
- [x] Apply consistent badge styling across all superadmin pages
- [x] Test visual improvements on Dashboard, Suppliers, Jobs pages

## Phase 1: Live Price Estimation on Request Form - COMPLETED ✅

### Backend - Pricing Estimation API
- [x] Create `getEstimatedPrice()` tRPC procedure in server/routers.ts
- [x] Find qualified suppliers for location + service type + service level
- [x] Calculate average rate from qualified suppliers
- [x] Apply service level multiplier (same_day, next_day, scheduled)
- [x] Apply OOH surcharge if applicable based on detectOOH result
- [x] Return price breakdown: base rate, duration, service level, OOH, subtotal, platform fee (15%), total
- [x] Handle edge cases: no suppliers found, no rates configured
- [x] Return price range (min-max) from qualified suppliers

### Frontend - Live Price Display in Coverage & Pricing Section
- [x] Update RequestService.tsx Coverage & Pricing section
- [x] Add useEffect to call getEstimatedPrice when form data changes
- [x] Show loading state while calculating
- [x] Display estimated price range (min-max) or average
- [x] Show detailed breakdown: base rate, duration, surcharges, total
- [x] Handle no coverage scenario with helpful message
- [x] Add debouncing to avoid excessive API calls (500ms)

### Testing
- [x] Write vitest tests for getEstimatedPrice procedure (11 tests, all passing)
- [x] Test with various scenarios: same day, next day, scheduled, OOH, no coverage
- [x] Verify price calculations are accurate
- [x] Test edge cases: no suppliers, no rates, invalid inputs

## Phase 1: Live Price Estimation - Error Handling Improvement - COMPLETED ✅

- [x] Add graceful error handling to pricing estimation
- [x] Show fallback message when pricing fails: "Pricing will be shown in detail on next page"
- [x] Ensure form remains functional even if pricing API fails
- [x] Don't block user from proceeding if pricing estimate unavailable

## Bug Fix: Service Type Mismatch in Pricing Engine (URGENT) - COMPLETED ✅

- [x] Add service type mapping function to convert customer-facing labels to database enums
- [x] Frontend sends: "L1 Network Engineer", "Level 1 End User Compute Engineer", "Smart Hands"
- [x] Backend expects: "L1_NETWORK", "L1_EUC", "SMART_HANDS"
- [x] Update getEstimatedPrice procedure to map service types before database query
- [x] Test with Perth Australia NBD L1 Network request

## Proportional OOH Calculation Fix - COMPLETED ✅

- [x] Update pricing engine to apply OOH surcharge only to hours worked outside business hours (9 AM - 5 PM)
- [x] Calculate exact OOH hours for jobs that span business and non-business hours
- [x] Example: 4 PM - 7 PM job (3 hours) = 1 hour regular + 2 hours OOH
- [x] Update calculatePrice function in server/pricingEngine.ts
- [x] Update tests to verify proportional OOH charging (35 tests passing)
- [x] Test edge cases: jobs starting before 9 AM, ending after 5 PM, spanning midnight
- [x] Update backend getPricingEstimate to pass start time to pricing engine
- [x] Verify pricing calculations work correctly in browser

- [x] Add per-hour cost display to customer pricing breakdown with full OOH transparency:
  - Show normal hourly rate vs OOH hourly rate
  - Display how many hours are normal vs OOH
  - Clear calculation showing surcharge applied


## Remote Site Fee System Implementation

### Overview
- Customer pays: $1.00 per km for distance beyond 50km from nearest major city (250k+ population)
- Supplier receives: $0.50 per km
- Platform keeps: $0.50 per km (50% margin on travel fees)
- Mandatory for all suppliers (no opt-out)

### Ph### Phase 3: Database Schema
- [x] Add remote site fee fields to jobs table:e:
  - [ ] remoteSiteFeeKm DECIMAL(10,2) - billable distance in km
  - [ ] remoteSiteFeeCustomerCents INT - amount customer pays
  - [ ] remoteSiteFeeSupplierCents INT - amount supplier receives
  - [ ] remoteSiteFeePlatformCents INT - platform revenue
  - [ ] nearestMajorCity VARCHAR(255) - name of nearest major city
  - [ ] distanceToMajorCityKm DECIMAL(10,2) - total distance to city
- [ ] Run database migration (pnpm db:push)

### Phase 2: GeoNames API Integration
- [ ] Create server/geonames.ts utility module
- [ ] Implement findNearestMajorCity() function:
  - [ ] Query GeoNames API for cities with population >= 250,000
  - [ ] Search within reasonable radius (e.g., 200km)
  - [ ] Return nearest city with coordinates
- [ ] Add error handling for API failures
- [ ] Add caching to reduce API calls

### Phase 3: Distance Calculation
- [ ] Create server/distanceCalculator.ts utility module
- [ ] Implement calculateDrivingDistance() function using Google Maps Distance Matrix API
- [ ] Handle edge cases: unreachable locations, API failures
- [ ] Add fallback to straight-line distance if driving distance unavailable

### Phase 4: Pricing Engine Integration
- [x] Update server/pricingEngine.ts with remote site fee logic
- [x] Create calculateRemoteSiteFee() function:
  - [x] Calculate billable distance (total - 50km free zone)
  - [x] Calculate customer charge ($1/km)
  - [x] Calculate supplier payout ($0.50/km)
  - [x] Calculate platform revenue ($0.50/km)
- [x] Integrate into calculateJobPricing() main function
- [x] Update accounting integrity checks to include remote site fee
- [x] Add remote site fee to pricing breakdown structure

### Phase 5: Frontend - Request Service Form
- [x] Update client/src/pages/customer/RequestService.tsx
- [x] Add distance calculation when address is selected
- [x] Display nearest major city in Coverage & Pricing section
- [x] Show distance to city
- [x] Display remote site fee if applicable:
  - [x] "Remote Site Fee: $25.00 (25km beyond 50km free zone)"
  - [x] Or: "No remote site fee (within 50km of major city)"
- [x] Update total price to include remote site fee

### Phase 6: Frontend - Pricing Breakdown Display
- [ ] Update pricing breakdown component to show remote site fee
- [ ] Add new section: "Travel & Distance"
  - [ ] Nearest major city: [City Name]
  - [ ] Distance: [X] km
  - [ ] Remote site fee: $[amount] or "None"
- [ ] Update total calculation to include remote site fee

### Phase 7: Job Detail Pages
- [ ] Update customer job detail page to show remote site fee
- [ ] Update supplier job detail page with payment breakdown:
  - [ ] Show remote site fee received by supplier
  - [ ] Separate from hourly rate payment
- [ ] Update admin job detail page to show full fee breakdown

### Phase 8: Testing
- [x] Write vitest tests for remote site fee calculations
- [x] Test with location near major city (< 50km, no fee)
- [x] Test with remote location (> 50km, fee applies)
- [x] Test edge cases: exactly 50km, very remote (200+ km)
- [x] Test accounting integrity with remote site fee
- [x] Verify 50/50 split between platform and supplier
- [x] Test GeoNames API integration (mocked)
- [x] Test error handling when APIs fail
- [x] Browser testing completed (requires GeoNames API key for live testing)

### Phase 9: Documentation
- [ ] Document remote site fee policy in supplier onboarding
- [ ] Add remote site fee explanation to customer help section
- [ ] Update pricing documentation
- [ ] Add remote site fee to platform fee breakdown

## Remote Site Fee System - Testing Required

### Backend Testing (Completed ✅)
- [x] GeoNames API integration test (22 vitest tests passing)
- [x] Remote site fee calculator unit tests
- [x] Pricing engine integration tests with remote site fees
- [x] Distance calculation accuracy tests
- [x] Free zone boundary tests (49km, 50km, 51km)
- [x] Accounting integrity tests (customer = supplier + platform)

### Frontend Integration Testing (Required)
- [ ] Test address autocomplete with Google Places API
- [ ] Verify remote site fee displays in pricing breakdown on request form
- [ ] Test with location within 50km of major city (should show $0 fee)
- [ ] Test with location 100km from major city (should show ~$50 fee)
- [ ] Test with very remote location (should show appropriate fee)
- [ ] Verify fee breakdown shows on pricing/confirmation page
- [ ] Test that fee persists through job creation workflow
- [ ] Verify fee displays correctly in job detail pages (customer & supplier views)

### Edge Case Testing (Required)
- [ ] Test with location where no major city found within 200km radius
- [ ] Test GeoNames API failure handling (graceful degradation)
- [ ] Test with international locations (Sydney, London, Tokyo, etc.)
- [ ] Test with locations near country borders
- [ ] Test timezone detection still works with coordinates
- [ ] Verify supplier receives correct payout amount (50% of fee)
- [ ] Verify platform revenue calculation is correct (50% of fee)

### UI/UX Testing (Required)
- [ ] Verify distance and nearest city display correctly
- [ ] Test that "X km from [City Name]" shows in UI
- [ ] Verify fee explanation is clear to customers
- [ ] Test mobile responsiveness of fee display
- [ ] Verify fee appears in all relevant pricing breakdowns
- [ ] Test that suppliers can see fee breakdown in their job view

### Database Testing (Required)
- [ ] Verify all remote site fee fields save correctly to jobs table
- [ ] Test that distanceToNearestCityKm stores accurate values
- [ ] Verify remoteSiteFeeCustomerCents calculation is correct
- [ ] Verify remoteSiteFeeSupplierCents is exactly 50% of customer fee
- [ ] Verify remoteSiteFeePlatformCents is exactly 50% of customer fee
- [ ] Test that nearestMajorCity name stores correctly

### End-to-End Workflow Testing (Required)
- [ ] Create test job with remote location (e.g., 150km from city)
- [ ] Verify fee calculates during request form
- [ ] Verify fee shows on pricing/confirmation page
- [ ] Submit job and verify fee saves to database
- [ ] Check supplier view shows correct payout amount
- [ ] Verify customer confirmation shows correct total including fee
- [ ] Test complete job workflow with remote site fee included

### Documentation Testing (Required)
- [ ] Verify GEONAMES_SETUP.md instructions are accurate
- [ ] Test GeoNames account creation process
- [ ] Verify API key setup instructions work
- [ ] Test that free tier limits (20,000 requests/day) are sufficient
- [ ] Document any API rate limiting or quota issues encountered

- [x] Refine unserviceable location messaging to remove misleading "next page" text
- [x] Update "no suppliers available" messaging to provide helpful guidance instead of misleading "next page" text

## Pricing Page Integration with New Pricing Engine

- [x] Update RequestServicePricing.tsx to retrieve pricing estimate from sessionStorage
- [x] Display comprehensive pricing breakdown (base rate, OOH surcharge, remote site fee, platform fee)
- [x] Show service level information (Same Day/Next Day/Scheduled)
- [x] Show nearest major city and distance for remote site fee context
- [x] Display detailed OOH hours breakdown when applicable
- [x] Use actual pricing data when creating job (not hardcoded values)
- [x] Test complete flow from request form → pricing page → job creation
