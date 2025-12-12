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

## Bug Fixes

- [x] Fix OOH warning not displaying in customer request service page - COMPLETED
- [x] Remove irrelevant /request-service page (was working on wrong file) - COMPLETED
