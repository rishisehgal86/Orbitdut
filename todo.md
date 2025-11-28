# Orbidut Marketplace TODO

## Phase 1: Foundation & Database Schema
- [x] Design and implement marketplace database schema
- [x] Create supplier tables (suppliers, supplier_users, supplier_rates, supplier_coverage)
- [x] Create job and payment tables
- [x] Run database migration

## Phase 2: Navigation & Layout
- [x] Implement modern left-hand sidebar navigation component
- [x] Create responsive mobile navigation (hamburger + bottom nav)
- [x] Build collapsible sidebar functionality
- [x] Implement dark/light mode support
- [x] Create supplier portal layout wrapper
- [x] Create customer portal layout wrapper

## Phase 3: Supplier Authentication & Onboarding
- [x] Extend user roles to include supplier types (supplier_admin, supplier_tech)
- [x] Create supplier registration page
- [x] Create supplier login page
- [x] Implement supplier session management
- [x] Build supplier dashboard home page

## Phase 4: Supplier Profile & Coverage
- [x] Create company profile management API
- [x] Build company profile form UI
- [ ] Implement geographic coverage API (postal codes, radius, polygons)
- [ ] Build service area page with interactive map
- [ ] Integrate map for visual coverage selection

## Phase 5: Supplier Rates & Pricing
- [x] Create supplier rates API (country-specific hourly rates)
- [x] Build rates management UI
- [x] Implement multi-currency support
- [ ] Create pricing engine service

## Future Phases (Not Yet Started)
- [ ] Job matching algorithm
- [ ] Real-time job notifications
- [ ] FCFS job acceptance mechanism
- [ ] Stripe Connect integration
- [ ] Customer portal
- [ ] Rating and review system
- [ ] Admin dashboard enhancements
- [ ] Analytics and reporting

## Phase 6: Customer Job Request Flow
- [x] Create job request form with address lookup
- [x] Implement service type selection
- [x] Add scheduling calendar/date picker
- [x] Build dynamic pricing calculation engine
- [ ] Integrate payment authorization (Stripe)
- [x] Create job submission and confirmation

## Phase 7: Supplier Marketplace & Job Distribution
- [ ] Build geographic matching algorithm
- [x] Implement FCFS job distribution to qualified suppliers
- [ ] Create real-time job notification system
- [x] Build supplier job acceptance interface
- [ ] Add job offer expiration logic

## Phase 8: Job Workflow Management
- [x] Implement job status tracking (assigned → en_route → on_site → completed)
- [x] Create supplier job detail page
- [x] Build status update interface for suppliers
- [ ] Add real-time status notifications to customers
- [ ] Implement job timeline/activity log

## Phase 9: Job Completion & Payment
- [x] Create job completion workflow for suppliers
- [x] Implement customer notification on completion
- [ ] Build automatic payment capture from authorization (Stripe integration pending)
- [ ] Create supplier payout processing (Stripe integration pending)
- [ ] Add review/rating system post-completion

## Phase 10: Customer Portal & Authentication Flow
- [x] Create customer portal layout with left sidebar navigation
- [x] Build customer dashboard with job history and status
- [x] Move request service form to authenticated customer portal
- [x] Update homepage to show service preview with login prompts
- [ ] Add customer job tracking and management interface
- [ ] Create customer profile settings page

## Phase 11: Service Types and Time Zone Updates
- [x] Update service types to three engineer services only (L1 EUC, L1 Network, Smart Hands)
- [x] Implement dual time UTC system (local time selection based on site location)
- [x] Display both local time and UTC time on job details
- [ ] Store scheduled time as UTC timestamp in database

## Phase 12: Google Maps Timezone API Integration
- [x] Create backend endpoint to fetch timezone from Google Maps API
- [x] Update frontend RequestService to call timezone API
- [x] Replace coordinate-based timezone estimation with API call
- [ ] Test timezone accuracy for various global locations

## Phase 13: Job Duration Constraints
- [x] Update frontend duration input to enforce 2-16 hour range
- [x] Add validation messages for duration limits
- [x] Update backend job creation validation
- [x] Update pricing calculation to respect duration limits

## Phase 14: Local Authentication System
- [x] Update users table to include password hash and account type fields
- [x] Create backend signup endpoint with password hashing
- [x] Create backend login endpoint with JWT token generation
- [x] Update logout endpoint for local auth
- [x] Build separate customer signup page
- [x] Build separate supplier signup page
- [x] Build login page
- [x] Update auth context and hooks to use local auth
- [x] Remove Manus OAuth dependencies from navigation and pages
- [x] Test complete signup and login flow

## Phase 15: Customer Job Tracking Page
- [x] Create customer jobs list page with filtering
- [x] Add status filter (all, pending, assigned, in progress, completed)
- [x] Display job cards with key information
- [x] Create detailed job view page with timeline
- [x] Add job timeline/activity log
- [x] Implement real-time status updates
- [x] Add search functionality

## Phase 16: Homepage Signup Links
- [x] Add prominent customer signup link to homepage
- [x] Add prominent supplier signup link to homepage
- [x] Update hero section with clear calls-to-action
- [x] Add signup section explaining benefits for each user type

## Phase 17: Supplier Signup Portal Integration
- [x] Update supplier signup to redirect to supplier portal after registration
- [x] Ensure supplier account type is set correctly during signup
- [x] Test complete supplier signup and portal access flow

## Phase 18: Fix Supplier Signup Route
- [x] Add /auth/supplier-signup route to App.tsx
- [x] Verify all auth routes are properly registered
- [x] Test supplier signup page access

## Phase 19: Remove Manus OAuth
- [x] Remove OAuth callback route from server
- [x] Disable OAuth fallback in context.ts
- [x] Update error messages to remove OAuth references
- [x] Test complete authentication flow without OAuth

## Phase 20: Homepage CTA Differentiation
- [x] Update navigation to show distinct customer vs supplier CTAs
- [x] Change "Get Started" to "Request Service" for customers
- [x] Make "Supplier Signup" more prominent with different styling
- [x] Update bottom CTA section with clearer messaging
- [x] Test both signup flows from homepage

## Phase 21: Geographic Coverage Management System
- [x] Update database schema to store coverage data (countries, cities, exclusions, response times)
- [x] Create ISO 3166-1 country list with codes
- [x] Build backend API for coverage CRUD operations
- [x] Create coverage management page with tabbed interface
- [x] Build Tier 1: Country selection UI with search and select all
- [ ] Build Tier 2: Priority cities/metro areas UI with Google Maps
- [ ] Build Tier 4: Response time zones UI
- [x] Add supplier navigation link to coverage page
- [ ] Test complete coverage management flow
- [ ] Add coverage visualization on supplier profiles
- [ ] Update job matching algorithm to use coverage data
- [ ] Test coverage setup and job matching

## Bug Fixes
- [x] Fix Coverage navigation button to link to /supplier/coverage page
- [x] Fix database delete query error in coverage update operation
- [x] Add loading states and success feedback to coverage save operation
- [x] Load existing coverage on page mount and display selected countries
- [x] Fix coverage mode selection to load existing countries (not replace them)
- [x] Remove country display limit in Current Coverage section (show all countries)
