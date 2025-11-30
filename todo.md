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
- [x] Sort countries alphabetically in Current Coverage display

## Coverage Management - Phase 2
- [x] Implement Global Coverage one-click selection
- [x] Build Coverage Preview tab with statistics
- [x] Add region breakdown display
- [ ] Implement world map visualization for covered countries (deferred - will add after Priority Cities)
- [x] Build Priority Cities UI with city search input
- [x] Add city management (add/remove cities)
- [x] Persist priority cities to database

## Coverage Management - Phase 3
- [ ] Integrate Google Maps Places API for city autocomplete
- [ ] Auto-detect country code when adding cities using geocoding
- [ ] Capture and store latitude/longitude coordinates for each city
- [ ] Add map visualization showing priority cities on a world map

## Response Time Management System
- [x] Update database schema to support global default response time
- [x] Create shared response time constants (4h, 24h, 48h, 72h, 96h)
- [x] Build Default Response Time UI (global fallback setting)
- [x] Implement Country-Level Response Time management with bulk actions
- [x] Add Priority City response time overrides
- [x] Update Preview tab to show response time statistics
- [x] Add backend API for CRUD operations on response times

## UI Enhancements
- [x] Add search bar to Country-Level Response Times for quick country filtering

## Priority Cities - Google Places Integration
- [x] Integrate Google Places API autocomplete for city search
- [x] Update database schema to store state/province, latitude, longitude
- [x] Update backend API to handle geocoded city data
- [x] Display full location details (City, State, Country) in UI

## Response Time Enhancements
- [ ] Add checkboxes to Country-Level Response Times for multi-select
- [ ] Add bulk action to set response time for selected countries

## Preview Tab Enhancements
- [x] Add response time breakdown statistics (count by tier: 4h, 24h, 48h, 72h, 96h)
- [ ] Integrate world map visualization with color-coded countries by response time
- [ ] Add legend showing response time colors on map

## Priority City Response Times Enhancements
- [x] Add search bar to filter priority cities
- [x] Add checkboxes for multi-select cities
- [x] Add bulk action to set response time for selected cities
- [x] Add Select All / Deselect All functionality
- [x] Add Priority City Response Time Distribution to Preview tab

## UI Improvements
- [x] Reorder sidebar navigation: Coverage should appear above Rates

## Preview Tab Enhancements
- [x] Show detailed country lists under each response time tier (like Coverage by Region)
- [x] Show detailed city lists under each response time tier for Priority Cities

## Bug Fixes
- [x] Fix × button functionality in custom country selection (Selected countries list)

## Critical Bug Fixes
- [x] Fix × button in Selected countries section - buttons should remove country from selection when clicked

## Bug Fixes - Sorting
- [x] Fix All Countries (A-Z) list to sort alphabetically by country name instead of by region

## Response Time Validation
- [x] Implement validation logic ensuring Priority Cities have faster response times than parent countries
- [x] Add visual warnings when city response time is slower than country response time



## Rate Management System
- [x] Review and verify supplierRates table schema
- [x] Create shared constants for service types and response times
- [x] Build backend tRPC procedures (getRates, upsertRate, bulkUpsertRates, getRateCompletionStats)
- [x] Fix TypeScript errors from schema migration
- [x] Create Rates page with tab structure (Quick Setup, By Location, By Service, Bulk Import/Export)
- [x] Implement Quick Setup tab with base rate inputs for all service types
- [x] Add "Apply to All Locations" functionality
- [x] Add completion tracker showing rates configured percentage
- [x] Fix toast notification errors (use sonner API correctly)
- [x] Fix getPriorityCities query name (was getCities)
- [x] Add refetch for stats query after bulk upsert
- [x] Test Quick Setup tab with all 3 service types (L1 EUC, L1 Network, Smart Hands)
- [ ] Build By Location tab with searchable location list
- [x] Create expandable rate cards for each location
- [x] Implement inline rate editing with auto-save
- [x] Add validation warnings (e.g., faster response time cheaper than slower)
- [ ] Test rate CRUD operations thoroughly
- [ ] Test with multiple locations and service types

## Rate Management - Quick Setup Improvements
- [x] Fix: Reset base rate inputs when switching between service types
- [x] Clear input fields when user selects a different service type tab

## Rate Management - By Location Tab Implementation
- [x] Create By Location tab with nested regional tabs
- [x] Add Africa tab showing countries in Africa region
- [x] Add Americas tab showing countries in Americas region
- [x] Add Asia tab showing countries in Asia region
- [x] Add Europe tab showing countries in Europe region
- [x] Add Oceania tab showing countries in Oceania region
- [x] Add Cities tab showing all priority cities
- [x] Display rates in table format with inline editing
- [x] Add search functionality for filtering locations
- [x] Implement save functionality for individual rate changes
- [x] Update getSupplierCountries to include region and country name
- [x] Test all regional tabs and inline editing
- [x] Update getSupplierCountries to include region and country name
- [x] Test regional filtering and tab switching
- [x] Test inline editing with auto-save on blur

## Rate Management - Quick Setup Regional Tabs
- [x] Add regional tabs to Quick Setup (Africa, Americas, Asia, Europe, Oceania, Cities)
- [x] Allow suppliers to set different base rates for each region
- [x] Update "Apply to All Locations" to only apply to selected region/cities
- [x] Update button text to reflect regional scope (e.g., "Apply to Africa")
- [x] Test regional rate application
- [x] Reset rates when switching between regions

## Rate Management - Quick Setup Location Preview
- [x] Show actual location names instead of just count in Quick Setup
- [x] Display list of countries/cities that will be affected by the bulk operation
- [x] Fix typo: "cityies" should be "cities"
- [x] Show first 5 locations and "and X more" for longer lists
- [x] Test with all regional tabs

## Rate Management - Enhanced Progress Tracking
- [x] Update getRateCompletionStats API to return breakdown by location type (countries vs cities)
- [x] Update getRateCompletionStats API to return breakdown by service type (L1 EUC, L1 Network, Smart Hands)
- [x] Create progress breakdown UI component showing multiple progress bars
- [x] Display countries completion percentage and count
- [x] Display cities completion percentage and count
- [x] Display service type completion percentages (L1 EUC, L1 Network, Smart Hands)
- [x] Keep overall progress bar at the top
- [x] Use color-coded progress bars (blue for countries, green for cities, purple/orange/cyan for services)
- [x] Test progress tracking with different completion states

## Rate Management - Progress Tracking Fixes & Enhancements
- [ ] Fix bug: Service type progress not updating after Quick Setup bulk upsert
- [ ] Investigate why service types show 0% despite rates being configured
- [ ] Verify bulk upsert is setting serviceType field correctly
- [ ] Add hover tooltips to progress bars showing missing rate details
- [ ] Show which specific locations/services are missing on hover
- [ ] Consider alternative visualization: interactive breakdown, heatmap, or smart recommendations
- [ ] Test service type tracking after bulk upsert operations

## Multi-Tenancy Architecture Audit
- [x] Review all database tables to ensure supplierId tenant differentiator exists
- [x] Audit all queries to verify supplierId filtering is applied
- [x] Check supplierRates table for proper tenant isolation
- [x] Check supplierCoverageCountries table for proper tenant isolation
- [x] Check supplierPriorityCities table for proper tenant isolation
- [x] Review any shared/global tables (countries, cities reference data)
- [x] Add database indexes on supplierId for performance
- [x] Add foreign key constraints to enforce referential integrity (CASCADE DELETE)
- [x] Add defensive supplierId check to UPDATE operations
- [x] Clean up orphaned cityId references
- [x] Add composite unique indexes to prevent duplicate rates
- [ ] Verify no cross-tenant data leakage in API endpoints
- [ ] Document multi-tenancy architecture and patterns
- [ ] Test tenant isolation with multiple supplier accounts

## Complete Tenant Isolation Audit - All Tables
- [x] Audit supplierResponseTimes table (missing FK and indexes)
- [x] Audit supplierUsers table (missing FK and indexes)
- [x] Audit jobs table (verify assignedSupplierId isolation)
- [x] Audit payments table (verify supplier payout isolation)
- [x] Audit reviews table (verify supplierId FK and indexes)
- [x] Add foreign key constraints where missing
- [x] Add performance indexes on all tenant differentiator fields
- [x] Clean up orphaned data (supplierUsers, supplierRates)
- [x] Add CASCADE DELETE for automatic cleanup
- [x] Add SET NULL for optional references (customerId, assignedSupplierId)
- [x] Add composite unique constraints to prevent duplicates
- [ ] Verify all SELECT queries include tenant filtering
- [ ] Verify all UPDATE queries include tenant checks
- [ ] Verify all DELETE queries include tenant checks
- [ ] Create tenant isolation test suite
- [ ] Document tenant isolation architecture

## API Query Tenant Isolation Audit
- [x] Find all SELECT queries in server code
- [x] Verify each SELECT includes supplierId filtering where applicable
- [x] Find all UPDATE queries in server code
- [x] Verify each UPDATE includes supplierId in WHERE clause
- [x] Find all DELETE queries in server code
- [x] Verify each DELETE includes supplierId in WHERE clause
- [x] Audit tRPC procedures for proper ctx.user.supplierId usage
- [x] Check db.ts helper functions for tenant filtering
- [x] Check rates.ts for tenant filtering
- [x] Check routers.ts for tenant filtering
- [x] Document all queries and their tenant isolation status
- [x] Fix all critical security vulnerabilities (7 issues fixed)
- [x] Fixed: deleteSupplierPriorityCity - added supplierId check
- [x] Fixed: deleteSupplierResponseTime - added supplierId check
- [x] Fixed: deleteRate - added supplierId check
- [x] Fixed: updateSupplier - added user permission verification
- [x] Fixed: getJobById - added customer/supplier filtering
- [x] Verified: updateJobStatus - already secure with supplier check
- [x] Verified: acceptJob - has business logic TODO but no security issue
- [ ] Create test cases for cross-tenant access attempts

## Rate Validation Warnings
- [x] Design validation rules for rate patterns
- [x] Rule 1: Faster response time should not be cheaper than slower response time
- [x] Rule 2: Rates should be positive numbers
- [x] Rule 3: Warn if rate difference between tiers is too large (>50%)
- [x] Create validation utility function (shared/rateValidation.ts)
- [x] Add visual warning indicators in Quick Setup tab
- [x] Show warning icon with tooltip explaining the issue
- [x] Use amber/yellow color for warnings, blue for suggestions
- [ ] Add visual warning indicators in By Location tab
- [ ] Test validation with various rate combinations

## Rates Submenu Restructuring
- [ ] Design submenu structure with two sections: Current Rates and Rate Management
- [ ] Create Current Rates page (read-only view)
- [ ] Show all applied rates with status indicators (configured, missing, no coverage)
- [ ] Add filtering by location, service type, response time
- [ ] Add search functionality for locations
- [ ] Show visual indicators: green for configured, amber for missing, gray for no coverage
- [ ] Add export to CSV/Excel functionality
- [ ] Show rate statistics and completion summary
- [ ] Rename existing Rates page to Rate Management
- [ ] Update sidebar navigation to show Rates submenu
- [ ] Update routing: /supplier/rates/current and /supplier/rates/manage
- [ ] Test navigation between Current Rates and Rate Management
- [ ] Ensure progress tracker is visible on both pages

## Rates Submenu Restructuring
- [x] Create submenu structure with two pages: Current Rates and Rate Management
- [x] Design Current Rates page (read-only view)
- [x] Add multi-select filters (service types, regions, response times, status)
- [x] Create comprehensive table view showing all rates
- [x] Add export to CSV functionality
- [x] Add search bar for location filtering
- [x] Show rate status with color coding (configured, missing, no coverage)
- [x] Rename existing Rates page to Rate Management
- [x] Update App.tsx routing for both pages (/supplier/rates/current, /supplier/rates/manage)
- [x] Update SupplierLayout navigation with submenu support
- [x] Add submenu rendering in navigation (indented, smaller text)
- [x] Fix stats API response structure in CurrentRates
- [x] Test both pages with real data

## Service Exclusion System
- [x] Design service exclusion architecture (coverage-level + bulk actions)
- [x] Update database schema to add supplierServiceExclusions table
- [x] Add isServiceable field to supplierRates (null=missing, 0=not_offered, 1=active)
- [x] Create backend API for service exclusions CRUD (server/serviceExclusions.ts)
- [x] Add tenant isolation to all service exclusion operations
- [ ] Add tRPC procedures for service exclusions
- [ ] Add "Service Exclusions" section to Coverage page
- [ ] Allow excluding service types per country (e.g., "No Smart Hands in Algeria")
- [ ] Allow excluding service types per city (e.g., "No L1 Network in New York")
- [ ] Add bulk "Mark as Not Offered" button in Rate Management By Location tab
- [ ] Add "Mark Region as Not Offered" option in Quick Setup tab
- [x] Update getRates API to filter out excluded service/location combinations
- [x] Update progress tracking to exclude non-serviceable rates from completion %
- [ ] Add visual distinction: Missing (amber) vs Not Offered (gray) vs Configured (green)
- [ ] Show "X rates opted out" stat in progress card
- [ ] Test service exclusions with various combinations

## Service Exclusion UI Implementation
- [x] Add tRPC procedures for service exclusions (getExclusions, addExclusion, removeExclusion, bulkAdd, bulkRemove)
- [x] Create Coverage page at /supplier/coverage
- [x] Add navigation link to Coverage in SupplierLayout (already exists)
- [x] Build service exclusion management UI in Coverage page
- [x] Show list of countries with expandable service type checkboxes
- [x] Show list of cities with expandable service type checkboxes
- [x] Add "Save Exclusions" button with optimistic updates
- [x] Add search functionality for filtering locations
- [x] Add tabs for Countries and Priority Cities
- [x] Add unsaved changes warning
- [ ] Add bulk "Mark as Not Offered" button in Rate Management By Location tab
- [ ] Add "Mark Region as Not Offered" option in Quick Setup tab
- [x] Update getRates to filter out excluded combinations
- [x] Update progress tracking to exclude non-serviceable rates
- [ ] Add visual distinction: Missing (amber) vs Not Offered (gray) vs Configured (green)
- [ ] Test service exclusions end-to-end

## Fix Coverage.tsx Syntax Error (CRITICAL)
- [x] Investigate syntax error at line 406:184 in Coverage.tsx
- [x] Fix the Unicode escape sequence issue causing application crash (template literals had \$ instead of $)
- [x] Fix SERVICE_TYPES import (changed to RATE_SERVICE_TYPES array)
- [x] Restart dev server and test Coverage page

## Fix Coverage Management Page Layout
- [x] Add SupplierLayout wrapper to Coverage.tsx to display left sidebar navigation
- [x] Test that sidebar navigation appears on Coverage page

## Restore Full Coverage Page Functionality
- [x] Check if original coverage page with country/city/response time management still exists
- [x] Restore original coverage features (country selection, priority cities, response times)
- [x] Create separate ServiceExclusions.tsx page
- [x] Add Coverage submenu in SupplierLayout (Geographic Coverage, Service Exclusions)
- [x] Add route for /supplier/coverage/exclusions in App.tsx
- [x] Fix null safety in filter functions
- [x] Test all coverage management features together

## Fix Priority Cities Deletion UI Issue
- [x] Investigate why deleted cities remain visible in the UI (tenant isolation issue)
- [x] Fix deletePriorityCity procedure to include supplierId parameter for tenant isolation
- [x] Update handleRemoveCity to pass supplierId along with id
- [x] Add optimistic updates to deleteCity mutation for instant UI feedback
- [x] Test that cities disappear immediately after clicking X button

## Fix Google Maps API Deprecation Warnings
- [ ] Update Google Maps script loading to use `loading=async` parameter for better performance
- [ ] Migrate from deprecated `google.maps.places.Autocomplete` to new `google.maps.places.PlaceAutocompleteElement` API
- [ ] Test city search functionality with new PlaceAutocompleteElement
- [ ] Verify all Maps features work correctly after migration
- [ ] Remove deprecation warnings from browser console

## Fix Service Exclusions Page - Not Showing Coverage Countries
- [x] Investigate why Service Exclusions page shows "Countries (0)" when Geographic Coverage has 196 countries (missing database tables)
- [ ] Verify tenant isolation in all Service Exclusions tRPC procedures (getServiceExclusions, bulkAddServiceExclusions, bulkRemoveServiceExclusions)
- [ ] Create missing database tables (supplier_coverage_countries, supplierServiceExclusions, etc.)
- [ ] Fix data fetching to load countries from supplier coverage settings
- [ ] Fix data fetching to load priority cities from supplier coverage settings
- [ ] Test that countries and cities appear on Service Exclusions page

## Fix Service Exclusions Page - Database and UI Issues
- [x] Investigate why Service Exclusions page shows "Countries (0)" when Geographic Coverage has 196 countries
- [x] Verify tenant isolation in all Service Exclusions tRPC procedures (all properly implemented with supplierId checks)
- [x] Create missing supplierServiceExclusions table via drizzle migration
- [x] Fix field name mismatch (changed country.name to country.countryName, city.name to city.cityName)
- [x] Add missing Label component import to ServiceExclusions.tsx
- [x] Test that countries and cities appear on Service Exclusions page (196 countries, 2 cities now showing correctly)

## Service Exclusions Page Layout Optimization
- [x] Analyze current layout structure and identify spacing issues (Card wrapper with pt-6 padding, individual bordered boxes for each checkbox)
- [x] Redesign service checkboxes to use horizontal inline layout instead of cards
- [x] Implement four-column grid layout (180px for location, 1fr each for 3 service types)
- [x] Reduce padding and margins for more compact display (p-3, space-y-1)
- [x] Test layout responsiveness on different screen sizes
- [x] Verify all 196 countries fit better on screen with reduced scrolling (now shows ~11 countries vs 3-4 before)

## Service Availability UX Redesign (formerly Service Exclusions)
- [x] Rename page from "Service Exclusions" to "Service Availability"
- [x] Flip checkbox logic: checked = service IS available (positive framing maintained)
- [x] Update page title and description with clear positive wording ("Check the services you provide")
- [x] Update card title ("Service Availability by Location") and helper text for clarity
- [x] Rename file from ServiceExclusions.tsx to ServiceAvailability.tsx
- [x] Update navigation menu item from "Service Exclusions" to "Service Availability"
- [x] Update route from /supplier/coverage/exclusions to /supplier/coverage/availability
- [x] Add green styling to checked checkboxes for visual reinforcement
- [x] Backend logic remains unchanged (still stores exclusions, but UI presents as availability)
- [x] Test that checkbox states work correctly with new logic
- [x] Verify data persistence with flipped logic

## Integrate Service Availability with Rates System
- [x] Analyze current service availability and rates data flow (isServiceable field exists but unused)
- [x] Implement sync logic: when service availability changes, update supplierRates.isServiceable field
- [x] Add syncServiceAvailabilityToRates and syncServiceExclusionToRates functions in serviceExclusions.ts
- [x] Update bulkAddServiceExclusions to call syncServiceExclusionToRates (sets isServiceable = 0)
- [x] Update bulkRemoveServiceExclusions to call syncServiceAvailabilityToRates (sets isServiceable = 1)
- [x] Add bulkSyncAllRatesWithAvailability procedure for fixing existing data inconsistencies
- [x] Update getSupplierRates query to filter WHERE isServiceable = 1 OR isServiceable IS NULL
- [x] Add info banner to Rate Management page explaining service availability connection
- [x] Add link from Rate Management to Service Availability page
- [x] Test that info banner displays correctly with proper messaging
- [x] Verify sync logic updates isServiceable when availability changes

## Service Availability Page - Add Region Filter
- [x] Add region filter tabs to Countries section (All, Africa, Americas, Asia, Europe, Oceania)
- [x] Update countries query to include region field
- [x] Implement region filtering logic in frontend
- [x] Test region filter with all 196 countries
- [x] Verify service checkboxes work correctly after filtering

## Grey Out Unavailable Service Rate Inputs
- [x] Fetch service exclusions in By Location tab
- [x] Disable rate input fields for excluded service/location combinations
- [x] Add grey styling and "Not Offered" tooltip for disabled inputs
- [x] Update By Service tab (when built) to also respect exclusions
- [x] Test with various exclusion scenarios (cities only, countries only, mixed)

## Fix Service Availability Save Error
- [x] Fix bulkAddServiceExclusions mutation - supplierId is undefined in exclusions array
- [x] Ensure each exclusion object includes supplierId when calling bulk save
- [x] Test service availability changes save successfully

## Fix Service Availability City Checkbox Bug
- [x] Reproduce bug: checking service for one city checks it for all cities
- [x] Analyze exclusion key generation logic for cities
- [x] Fix checkbox state management to properly handle individual cities
- [x] Test with multiple cities and different services

## By Location Tab Enhancements
- [x] Replace flat table with Accordion-based expandable cards for each location
- [x] Add location header showing country/city name and configured count
- [x] Implement collapsible rate sections per location
- [x] Add inline rate editing with debounced auto-save (500ms delay)
- [x] Show save status indicators (saving, saved, error)
- [x] Add validation warnings for pricing inconsistencies (faster cheaper than slower)
- [x] Display amber warning icons with tooltips for invalid rates
- [ ] Test expandable cards with multiple locations
- [ ] Test auto-save functionality with rapid edits
- [ ] Test validation warnings with various rate combinations

## Validation Warning Tooltip Enhancement
- [x] Replace HTML title attribute with shadcn/ui Tooltip component for validation warnings
- [x] Show clear explanation of pricing inconsistency on hover
- [x] Test tooltip hover behavior and readability

## Response Time-Level Exclusions
- [x] Update database schema to support response time exclusions (supplierResponseTimeExclusions table)
- [x] Add supplierId, serviceType, countryCode/cityId, responseTimeHours columns
- [x] Create backend tRPC procedures (addResponseTimeExclusion, removeResponseTimeExclusion, getResponseTimeExclusions)
- [x] Add X icon next to each rate input in By Location tab
- [ ] Implement click handler to toggle exclusion state
- [ ] Show tooltip "Mark Xh response time as not offered" on hover
- [ ] Grey out input and show "N/A" when response time is excluded
- [ ] Update getRates API to filter out excluded response times
- [ ] Update progress tracking to exclude response time exclusions from totals
- [ ] Test exclusion toggle with various service/location/response time combinations
- [ ] Verify visual consistency with service-level exclusions

## Update Exclusion Checking Logic to Query Both Tables
- [x] Update `getSupplierRates` in server/rates.ts to check both service and response time exclusions
- [x] Modify WHERE clause to exclude rates if EITHER service OR response time is excluded
- [ ] Update frontend By Location tab to fetch both exclusion types
- [ ] Combine service exclusions and response time exclusions in isRateDisabled check
- [ ] Ensure service-level exclusions take precedence (hide X icon if service excluded)
- [ ] Test precedence: service exclusion should override response time exclusions

## Bug Fixes - Response Time Exclusions
- [x] Fix X icon re-enabling behavior to be instant (currently has delay when removing exclusions)

## Current Rates Page - Show Exclusions
- [ ] Query service exclusions in Current Rates page
- [ ] Query response time exclusions in Current Rates page
- [ ] Display service exclusions in the rates table (e.g., "Service Not Offered")
- [ ] Display response time exclusions in the rates table (e.g., grey out or show "N/A")
- [ ] Test exclusion display with various scenarios

## Current Rates Page - Show Exclusions
- [x] Query both service exclusions and response time exclusions tables
- [x] Display "Service Excluded" badge when a service is excluded for a location
- [x] Display "Response Time Excluded" text when a response time is excluded

## Rate Management - By Service Tab Implementation
- [x] Create By Service tab component mirroring By Location tab structure
- [x] Group locations by service type (L1 EUC, L1 Network, Smart Hands)
- [x] Reuse same table UI and inline editing components
- [x] Add search functionality for filtering locations
- [x] Implement X icon toggle for response time exclusions
- [x] Test all service type tabs and inline editing

## Rate Management - By Location Tab UI Change
- [x] Remove service type selector from By Location tab
- [x] Update LocationRatesTable to show all 3 services for each location
- [x] Display each service as a separate section with its own rate inputs
- [x] Update description to reflect new functionality

## Bug Fixes - Rate Management By Location Tab
- [x] Fix state key to include serviceType so editing one service doesn't affect other services' inputs

## Bulk Import/Export Tab - Excel Multi-Sheet Implementation
- [x] Install xlsx npm package for Excel file handling
- [x] Create backend API to generate Excel template with 6 sheets (3 services × 2 location types)
- [x] Sheet structure: Service Name - Countries, Service Name - Cities
- [x] Include only covered locations in template (filter by supplier coverage)
- [x] Add columns: Region (fixed), Location (fixed), Country Code (fixed), 4h Rate (editable), 24h Rate (editable), 48h Rate (editable), 72h Rate (editable), 96h Rate (editable)
- [x] Mark fixed columns with header styling or instructions (Do Not Edit)
- [ ] Add data validation: rates must be USD with 2 decimal places (e.g., 150.00)
- [ ] Include sample row in template showing correct format
- [x] Pre-fill template with current rates if they exist
- [ ] Create backend API to parse uploaded Excel file and validate data
- [x] Build Bulk Import/Export tab UI with card-based layout
- [x] Add "Download Excel Template" button
- [x] Add "Upload Excel File" input with drag-and-drop support
- [ ] Create preview table showing parsed data before import (grouped by sheet/service)
- [x] Add validation error display with sheet name, row numbers, and error messages
- [x] Show import summary (X rows valid, Y rows with errors per service type)
- [ ] Add "Confirm Import" button to execute bulk upsert
- [ ] Test with sample Excel files

## Bulk Import/Export - Excel Template Generation Implementation
- [x] Create tRPC procedure `supplier.downloadExcelTemplate` to generate Excel file
- [x] Query supplier's covered locations from coverage tables
- [x] Query current rates for all service types and response times
- [x] Generate 6 sheets using xlsx library (L1 EUC Countries, L1 EUC Cities, L1 Network Countries, L1 Network Cities, Smart Hands Countries, Smart Hands Cities)
- [x] Add columns: Region, Location, Country Code, 4h Rate, 24h Rate, 48h Rate, 72h Rate, 96h Rate
- [x] Pre-fill with current rates where they exist
- [x] Style fixed columns (Region, Location, Country Code) with different background color
- [x] Return Excel file as base64 or buffer for download
- [x] Connect frontend download button to call the tRPC procedure
- [x] Test download with actual supplier data
- [x] Fix sheet names to comply with Excel 31-character limit

## Bug Fixes - Bulk Import/Export
- [x] Fix Confirm Import button not working - implement Excel file parsing and validation
- [x] Create backend API to parse uploaded Excel file
- [x] Implement rate import with validation and error handling
- [x] Add parseExcelFile tRPC procedure to validate uploaded files
- [x] Add importRatesFromExcel tRPC procedure to bulk import rates
- [x] Update frontend to convert file to base64 and call parse API
- [x] Display validation results and error messages in UI
- [x] Connect Confirm Import button to import API

## Bug Fixes - Import Functionality
- [x] Fix bulkUpsertRates is not a function error
- [x] Implement bulkUpsertRates function in db.ts to handle bulk rate insertions
- [x] Test complete import workflow with real Excel file

## Bug Fixes - Excel Import Recognition
- [ ] Debug why uploaded Excel file shows no rates recognized
- [ ] Issue is with how parser reads uploaded file and extracts rate values
- [ ] Parser returns 0 rates even when file contains valid rate data
- [ ] Add debug logging to parseExcelFile to trace the parsing process
- [ ] Fix the rate extraction logic in excelImport.ts

## Bug Fixes - Excel Import Column Mapping
- [ ] Rates are being captured in the wrong response time columns
- [ ] Debug findRateColumns function to see how it matches headers
- [ ] Fix the column header matching logic to correctly map response times
- [ ] Test import with actual data to verify correct column mapping

## Bug Fixes - Excel Import Column Mapping Issue
- [x] Fix 4h rate reading 24h column value (off-by-one error)
- [x] Root cause: "24h rate" contains substring "4h rate", causing incorrect match
- [x] Solution: Use regex with word boundary (\b) to match exact response times
- [x] Updated findRateColumns to use pattern: \b${responseTime}h\s+rate
- [x] Verified all response times now map to correct columns
- [x] Tested with Micronesia data: 4h=299, 24h=289, 48h=279, 72h=269, 96h=259

## Bug Fixes - Current Rates Table Alignment
- [x] Fix table alignment issue where response time labels (4h, 24h, etc.) appear in Location column
- [x] Restructured expanded view to use separate table rows for each response time
- [x] Each response time now has its own row with proper alignment across service columns
- [x] Condensed spacing with reduced padding (py-1.5 instead of p-3) for better readability

## Feature - Current Rates Location Filtering
- [x] Add location type filter (Countries/Cities) to Current Rates page sidebar
- [x] Allow users to toggle between showing countries only, cities only, or both
- [x] Separate cities from countries list instead of showing mixed at the end

## UI Improvement - Condense Filter Menu
- [x] Reduce vertical spacing in filter sections on Current Rates page
- [x] Use more compact grid layout for filter checkboxes (gap-6 → gap-4)
- [x] Reduce padding and margins between filter groups (space-y-3 → space-y-1.5)
- [x] Reduce checkbox and label sizes (text-sm → text-xs, smaller checkboxes)
- [x] Update section headers to uppercase text-xs for better hierarchy

## Bug Fix - Rate Management Drag and Drop
- [x] Fix drag-and-drop file upload functionality on Rate Management page
- [x] Ensure drag events (dragover, drop) are properly handled
- [x] Added onDragOver and onDrop handlers to upload div
- [x] Test file drop with Excel files (.xlsx, .xls)

## Feature - Redesign Rates Configured Section
- [x] Analyze current "Rates configured" section and identify UX issues
- [x] Design new layout that clearly shows missing rates by service type and location
- [x] Add actionable quick-fix buttons to jump to missing rate locations
- [x] Create visual hierarchy that prioritizes critical missing rates (red/amber/green dots)
- [x] Show breakdown by service type with drill-down capability (Accordion)
- [x] Add Quick Setup and Edit by Location action buttons in expanded sections
- [x] Implement 3-card summary showing Configured/Missing/Completion Rate
- [x] Test new design for usability and clarity

## Bug Fix - Completion Rate Calculation Error
- [x] Investigate why completion rate shows 132% instead of correct percentage
- [x] Simplify logic: Total = all rate slots, Configured = slots with prices, Missing = slots without prices
- [x] Don't exclude legacy rates from configured count - if it has a price, it's configured
- [x] Fix the calculation logic in getRateCompletionStats procedure
- [x] Verify all statistics (configured, missing, totalPossible) are calculated correctly
- [x] Test with different data scenarios to confirm accuracy
- [x] Now shows: Configured 2956, Missing 14, Completion 100%

## Bug Fix - Subtract Rate Exclusions from Total
- [x] Investigate if there's a rate exclusions table or mechanism (supplierResponseTimeExclusions)
- [x] Update completion calculation to subtract both service exclusions AND response time exclusions
- [x] Service exclusions: each removes 5 response times (entire service/location combo)
- [x] Response time exclusions: each removes 1 specific rate slot
- [x] Test with different exclusion scenarios to verify accuracy
- [x] Verified: Total dropped from 2970 to 2969, Missing from 14 to 13

## CRITICAL BUG - Missing Rates Calculation
- [x] Missing rates showing negative numbers (-95, -116)
- [x] Root cause: Legacy rates (without service types) counted in configured but not in totalPossible
- [x] Delete all legacy rates from database (rates without service types)
- [x] Update calculation to only count rates WITH service types as configured
- [x] Remove legacy rate warning from UI
- [x] Remove legacyRates from return type
- [x] Test that missing = totalPossible - configured works correctly
- [x] Verified: Configured 0, Missing 2969, Completion 0% (all correct!)

## Fix - Simplify Rate Completion Calculation
- [x] Replace complex theoretical calculation with simple database counts
- [x] Total = COUNT rows WHERE isServiceable = 1 (excludes both exclusion types)
- [x] Configured = COUNT rows WHERE rateUsdCents IS NOT NULL AND isServiceable = 1
- [x] Missing = Total - Configured (calculated in frontend)
- [x] Percentage = (Configured / Total) × 100
- [x] Remove coverage-based calculation logic (countries, cities, services multiplication)
- [x] Test with real data to verify accuracy
- [x] Verified: Total 0, Configured 0, Missing 0, Completion 0% (correct after legacy deletion)

## CRITICAL BUG - Current Rates Page Shows 0
- [x] Current Rates page shows "0 Total Configured" but rates exist in table
- [x] Rate Configuration Summary showing all zeros despite visible rate data
- [x] Root cause: Service type case mismatch (filtering for lowercase, DB has uppercase)
- [x] Fixed: Changed filter from "l1_euc" to "L1_EUC" (and others)
- [x] Test to verify statistics now show correct numbers
- [x] Verified: Total 2956, Missing 0, Completion 100%, Country Rates 2940 ✅

## CRITICAL - Simplify Rate Calculation (Pure Database Counts)
- [ ] Remove ALL complex logic (service type filtering, coverage calculations, etc.)
- [ ] Total = COUNT(*) FROM supplierRates WHERE supplierId = X
- [ ] Configured = COUNT(*) WHERE supplierId = X AND rateUsdCents IS NOT NULL
- [ ] Missing = Total - Configured
- [ ] Completion % = (Configured / Total) × 100
- [ ] Each calculation must be tenant-specific (per supplierId)
- [ ] Test with real data to verify accuracy

## CRITICAL - Simplify Rate Calculation (Pure Database Counts)
- [x] Remove ALL complex logic (service type filtering from total count)
- [x] Total = COUNT(*) WHERE supplierId = X AND (isServiceable = 1 OR isServiceable IS NULL)
- [x] Configured = COUNT(*) WHERE supplierId = X AND rateUsdCents IS NOT NULL AND (isServiceable = 1 OR isServiceable IS NULL)
- [x] Missing = Total - Configured (calculated in frontend)
- [x] Completion % = (Configured / Total) × 100
- [x] isServiceable flag handles both service exclusions and response time exclusions
- [x] Each calculation is tenant-specific (per supplierId)
- [x] Test with real data to verify accuracy
- [x] Verified: Total 2956, Missing 0, Completion 100% ✅

## Feature - Add Total Rates Card to Summary
- [x] Add "Total Rates" card showing totalPossible (configured + missing)
- [x] Update Current Rates page summary to show 4 cards: Total Rates, Configured, Missing, Completion %
- [x] Update Rate Management page summary to show 4 cards
- [x] Ensure card order makes sense: Total Rates → Configured → Missing → Completion %
- [x] Test with real data to verify accuracy
- [x] Verified: Both pages show Total Rates 2,956, Configured 2,956, Missing 0, Completion 100% ✅

## Rewrite - Rate Completion Calculations
- [x] User requirements clarified
- [x] Total Rates = (Countries + Cities) × 3 services × 5 response times (from coverage)
- [x] Exclusions = NEW FIELD - count from both exclusion tables (service excl × 5 + response time excl)
- [x] Configured = COUNT WHERE rateUsdCents IS NOT NULL AND isServiceable = 1
- [x] Missing = COUNT WHERE rateUsdCents IS NULL AND isServiceable = 1
- [x] Completion % = (Configured / (Total Rates - Exclusions)) × 100
- [x] Update getRateCompletionStats function with new return type
- [x] Add Exclusions and Missing cards to UI
- [x] Add Country Rates breakdown field to UI
- [x] Fix SQL column name issues (countryCode, cityId)
- [x] Test with supplier 12 (12@supplier.com)

## Bug Fix - Exclusions Count Not Accurate
- [x] Review exclusions calculation in getRateCompletionStats
- [x] Each service exclusion should count ALL response times excluded (5 per service exclusion)
- [x] Response time exclusions should count individually (1 per exclusion)
- [x] Verify the calculation matches: (service exclusions × 5) + response time exclusions
- [x] Test with supplier data to confirm accurate count
- [x] Verified: Shows 1 exclusion correctly (0 service excl × 5 + 1 RT excl = 1)

## Bug Fix - Configured Count Should Read Actual Rate Entries
- [x] Review configured calculation in getRateCompletionStats
- [x] Configured should count ALL rates with rateUsdCents IS NOT NULL (regardless of isServiceable)
- [x] Current logic only counts isServiceable = 1, missing rates that have prices
- [x] Update query to count all rates with prices entered
- [x] Test with supplier data to verify accurate count
- [x] Verified: Shows 2,956 configured rates (matches database count)

## Clarification - Configured Count Should Be Simple Database Query
- [x] Configured = COUNT rates with prices for locations in CURRENT coverage only
- [x] This is account-specific, counting rate entries with prices
- [x] Must filter by current coverage to avoid counting orphaned rates
- [x] Implementation verified and working correctly

## Bug Fix - Configured Count Exceeds Total Rates
- [x] Issue: Configured (354) > Total Rates (255) - mathematically impossible
- [x] Root cause: Total calculated from coverage, Configured from all database entries
- [x] Orphaned rates exist for locations no longer in coverage
- [x] Solution: Filter Configured to only count rates for locations in CURRENT coverage
- [x] This ensures Total always >= Configured
- [x] Test with multiple supplier accounts to verify consistency
- [x] Verified: Supplier 12 shows 170 configured < 255 total (correct!)

## Apply Coverage Filtering to Missing Count
- [x] Missing should also only count rates for locations in current coverage
- [x] Use same filtering logic as Configured (check against coverageCountryCodes and coverageCityIds)
- [x] Ensure Missing + Configured <= Total Rates - Exclusions
- [x] Test with supplier 12 to verify accuracy
- [x] Verified: Configured (170) + Missing (0) = 170 ≤ 230 (255 - 25) ✓

## Bug Fix - Missing Count Shows 0 But Should Show Actual Missing Rates
- [ ] Root cause: getSupplierRates (UI table) shows ALL rates, getRateCompletionStats (statistics) filters by coverage
- [ ] Solution: Update getSupplierRates to also filter by current coverage
- [ ] This ensures UI table and statistics use the same data set
- [ ] Missing count will then accurately reflect what's shown in the table
- [ ] Test with supplier 12 to verify Fiji rates appear correctly

## Rewrite - Rate Configuration Summary (Simplified)
- [x] Remove all old complex logic (coverage filtering, exclusion table queries)
- [x] Total Rates = COUNT(*) FROM supplierRates WHERE supplierId = X
- [x] Configured = COUNT(*) WHERE rateUsdCents IS NOT NULL
- [x] Missing = COUNT(*) WHERE rateUsdCents IS NULL AND isServiceable != 1
- [x] Excluded = COUNT(*) WHERE isServiceable = 0
- [x] Percentage calculation to be added later (set to 0 for now)
- [x] Update return type to match new fields
- [x] Update UI to display new 5-column layout
- [x] Test with supplier 12 data
- [x] Verified: Total=354, Configured=354, Missing=0, Excluded=6

## Investigation - UI Virtual Rate Matrix Logic
- [x] Analyze how CurrentRates.tsx generates the location list (from coverage)
- [x] Understand how it creates the virtual rate matrix (locations × services × response times)
- [x] Identify why database has 354 entries but UI shows different combinations
- [x] Findings:
  * UI builds location list from coverage tables (14 countries + 3 cities = 17 locations)
  * Virtual matrix = 17 × 3 services × 5 response times = 255 cells
  * Database has 354 actual entries (includes 99 orphaned rates for old coverage)
  * UI displays virtual matrix and looks up prices from database
  * Fiji Smart Hands 4h has NO database entry (shows as "—" in UI)
- [ ] Decision needed: Should statistics count database entries (354) OR virtual matrix (255)?
- [ ] Option A: Match UI (coverage-based) - Total=255, Missing=cells without DB entries
- [ ] Option B: Match database (entry-based) - Total=354, Missing=entries without prices

## Implement Option A - Coverage-Based Statistics
- [x] Rewrite getRateCompletionStats to use coverage-based virtual matrix
- [x] Total = (Countries + Cities) × 3 services × 5 response times
- [x] Build virtual matrix of all possible rate combinations from coverage
- [x] Configured = Count virtual matrix cells that have prices in database
- [x] Missing = Total - Configured - Excluded (includes cells without DB entries)
- [x] Excluded = Count rates with isServiceable = 0 for current coverage
- [x] Test with supplier 12: Total=255 (17 locations × 3 × 5) ✓
- [x] Verify Missing count includes Fiji Smart Hands 4h (no DB entry) ✓
- [x] Validation: 170 + 79 + 6 = 255 ✓

## Remove Excluded Field from Display
- [x] Remove Excluded card from CurrentRates.tsx statistics display
- [x] Update grid layout from 5 columns to 4 columns (md:grid-cols-2 lg:grid-cols-4)
- [x] Keep Excluded in backend calculation (still needed for Missing calculation)
- [x] Test display with supplier 12
- [x] Verified: Clean 4-column layout showing Total, Configured, Missing, Completion

## Bug Fix - RateManagement Page Error
- [x] RateManagement.tsx still references stats.excluded field
- [x] Update RateManagement to remove Excluded from display (same as CurrentRates)
- [x] Update grid layout to 4 columns
- [x] Remove "Missing Rates by Service Type" section (uses stats.byServiceType which no longer exists)
- [x] Test RateManagement page loads without errors
- [x] Verified: Page displays correctly with Total=255, Configured=170, Missing=79, Completion=0%

## Implement Orphaned Rates Cleanup
- [x] Create manual cleanup script (Option B) to delete orphaned rates
- [x] Script should find rates where location not in current coverage
- [x] Script should find rates where service/response time is excluded
- [x] Add tRPC procedure to expose cleanup script to admin/supplier (cleanupOrphanedRates)
- [x] Implement automatic cleanup (Option A) in coverage removal logic
- [x] Add cleanup to updateCountries procedure (runs after coverage changes)
- [x] Add cleanup to deletePriorityCity procedure (runs after city removal)
- [x] Add cleanup to addServiceExclusion procedure
- [x] Add cleanup to addResponseTimeExclusion procedure
- [x] Test with supplier 12 data (cleanup found 0 orphaned rates - all entries match coverage)
- [x] Verify statistics update correctly after cleanup (Total=255, Configured=170, Missing=79)
- [x] Created vitest test for cleanup functionality (server/cleanup.test.ts)

## Implement Completion Percentage Calculation
- [x] Update getRateCompletionStats to calculate percentage: (Configured / Total) × 100
- [x] Round to 1 decimal place for display
- [x] Handle edge case where Total = 0 (return 0%)
- [x] Test with supplier 12 data (173 / 255 = 67.8% ≈ 68%)
- [x] Verify percentage displays correctly on both Current Rates and Rate Management pages
- [x] Both pages show Completion: 68% correctly

## Update Total Rates to Exclude "Not Offered" Rates
- [x] Change Total calculation from: Virtual matrix size (locations × 3 × 5)
- [x] To: Virtual matrix size - Excluded rates
- [x] This makes Total dynamic (decreases when rates marked as Not Offered)
- [x] Update getRateCompletionStats to subtract excluded count from total
- [x] Test: Mark a rate as "Not Offered" and verify Total decreases
- [x] Verify percentage calculation still works correctly
- [x] Verified: Total=249 (255-6 excluded), Configured=175, Missing=74, Completion=70%

## Fix Total Rates Not Increasing When Re-enabling Rates
- [x] Investigate getRateCompletionStats calculation logic
- [x] Check how exclusions are counted (isServiceable = 0)
- [x] Verified exclusion removal deletes rows from exclusion tables
- [x] Fix calculation to count exclusions from exclusion tables instead of rates table
- [x] Test: Remove an exclusion and verify Total increases (230 → 225 → 230) ✓
- [x] Test: Add an exclusion and verify Total decreases (worked correctly) ✓
- [x] Verified: Total now dynamically updates when exclusions are added/removed
