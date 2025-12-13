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

## Bug Fixes

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

