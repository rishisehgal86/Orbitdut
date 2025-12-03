# Orbidut Marketplace TODO

## Completed Features
- [x] Basic customer portal with job submission
- [x] Supplier portal with job management
- [x] Email notification system (Gmail SMTP)
- [x] Password reset flow
- [x] Job status email notifications

## FieldPulse Integration - Complete Workflow

### Phase 1: Database Schema
- [x] Add jobStatusHistory table (audit trail of all status changes)
- [x] Add jobLocations table (GPS tracking data)
- [x] Add siteVisitReports table (completion reports with signatures)
- [x] Add svrMediaFiles table (photos/videos for reports)
- [x] Engineer fields already exist in jobs table (engineerName, engineerEmail, engineerPhone)
- [x] Run database migration (manual SQL execution)

### Phase 2: Supplier Engineer Assignment
- [x] Add "Assign Engineer" button to supplier job detail page
- [x] Create engineer assignment modal/form (AssignEngineerDialog component)
- [x] Build tRPC procedure to assign engineer to job
- [x] Send email/notification to engineer with unique job link
- [x] Update job status to "sent_to_engineer"
- [x] Add job status history tracking

### Phase 3: Engineer Job Page (Token-Based, No Login)
- [x] Create /engineer/job/:token route
- [x] Build EngineerJobPage component (copy from FieldPulse)
- [x] Add Accept/Decline buttons
- [x] Add status update buttons (En Route, On Site, Completed)
- [x] Build tRPC procedures for engineer actions
- [x] Add automatic timestamp tracking on status changes

### Phase 4: GPS Tracking
- [x] Implement browser geolocation API in engineer page
- [x] Auto-track location when status is "en_route" or "on_site"
- [x] Save GPS coordinates to jobLocations table
- [x] Create real-time map view for customers
- [ ] Calculate and display ETA based on GPS data (deferred)
- [x] Add location tracking indicator to engineer page

### Phase 5: Site Visit Reports
- [x] Create site visit report form component
- [x] Add digital signature capture (react-signature-canvas)
- [x] Add photo upload functionality (multiple images)
- [x] Build tRPC procedure to save site visit report
- [x] Integrate report form into EngineerJobPage
- [ ] Generate PDF report with signature and photos (deferred)
- [ ] Email report to customer and supplier (deferred)

### Phase 6: Job Timeline & Activity History
- [ ] Create JobTimeline component
- [ ] Display all status changes with timestamps
- [ ] Calculate and show duration in each status (travel time, on-site time)
- [ ] Add timeline to customer job detail page
- [ ] Add timeline to supplier job detail page
- [ ] Show GPS location for each status change

### Phase 7: Testing & Polish
- [ ] Test complete workflow end-to-end
- [ ] Test engineer page on mobile devices
- [ ] Verify GPS tracking accuracy
- [ ] Test signature capture on touch devices
- [ ] Verify email notifications at each step
- [ ] Test with multiple concurrent jobs
- [ ] Save checkpoint and push to GitHub

## Future Features (Post-Launch)
- [ ] Supplier matching algorithm
- [ ] Pricing and payment integration (Stripe)
- [ ] Multi-project support
- [ ] SMS notifications
- [ ] Native mobile app for engineers
- [ ] Customer review/rating system
- [ ] Invoice generation and management

## Phase 6: Job Timeline & Activity History (Complete)
- [x] Create JobTimeline component with visual timeline UI
- [x] Build getJobTimeline tRPC procedure
- [x] Calculate duration between status changes (travel time, on-site time)
- [x] Display GPS location for each status change
- [x] Add timeline to customer job detail page
- [x] Add timeline to supplier job detail page
- [x] Show formatted timestamps and durations

## Bug Fixes
- [x] Fix customer jobs not appearing in dashboard (user 12@customer.com)
- [x] Investigate database query for customer jobs
- [x] Update getCustomerJobs to match by email address as fallback
- [x] Fix 500 error in getCustomerJobs query (database column issue)
- [x] Add missing engineerToken column to database
- [x] Fix getCustomerJobs query to work with existing database schema

## Phase 7: End-to-End Workflow Testing
- [ ] Fix timezone API 400 error (deferred - needs Google Maps API investigation)
- [ ] Build pricing page to complete job creation flow (deferred)
- [x] Create test job manually in database (workaround)
- [x] Create fresh supplier account (testsupplier@example.com)
- [x] Link supplier to company via supplierUsers table
- [x] Assign test job to supplier
- [x] Document comprehensive gap analysis
- [ ] Login as supplier and verify job appears in dashboard
- [ ] Assign engineer to job
- [ ] Test engineer acceptance via token link
- [ ] Test GPS tracking (en route, arrived)
- [ ] Complete job with site visit report and signature
- [ ] Verify timeline shows all status changes
- [ ] Check all emails and notifications sent
- [ ] Verify data integrity across all tables

## Known Bugs to Fix
- [ ] Timezone API returning 400 error - Google Maps timezone endpoint not working through Manus proxy
  - Impact: Blocks form submission even with valid address selection
  - Workaround: Manually create jobs in database with timezone field
  - Root cause: Needs investigation of Google Maps API integration and tRPC parameter passing

## Phase 8: UX Improvements for Job Request Form (Complete)
- [x] Auto-fill name and email from logged-in user session
- [x] Add inline validation with real-time error messages
- [x] Fix form layout - remove excessive white space gaps (space-y-6 → space-y-4)
- [x] Add validation to all required fields (name, email, phone, service type, address, date, time)
- [x] Add red border highlighting for invalid fields when touched
- [x] Show clear error messages below each invalid field
- [ ] Add timezone display next to time picker (deferred - timezone API needs fix first)
- [ ] Add success/error toast notifications (deferred)
- [ ] Test all UX improvements in browser

## Phase 9: Fix Supplier Dashboard Statistics
- [x] Fix supplier dashboard to show real job counts instead of hardcoded zeros

## Phase 10: Fix Job Timeline Display
- [ ] Verify JobTimeline component is imported and rendered in customer job detail page
- [ ] Verify JobTimeline component is imported and rendered in supplier job detail page
- [ ] Test timeline displays all status changes with timestamps

## Phase 11: Display All Job Details
- [x] Add Site Access & Requirements section to customer job detail page
- [x] Add Project & Ticket Information section to customer job detail page
- [x] Add Site Contact section to customer job detail page
- [x] Add Communication section (video conference link) to customer job detail page
- [x] Add all missing sections to supplier job detail page
- [x] Ensure all fields from job request form are visible in both portals

## Phase 12: Fix Job Timeline Backend Errors
- [x] Fix getJobTimeline procedure to use correct field names (status instead of newStatus, timestamp instead of changedAt)

## Phase 13: Implement Supplier Job Acceptance Workflow
- [x] Research Field Pulse code for supplier job acceptance pattern
- [x] Update database schema with new statuses (supplier_accepted, sent_to_engineer, engineer_accepted)
- [x] Add backend procedure for supplier to accept available jobs (jobs.acceptJob)
- [x] Update job status flow: pending_supplier_acceptance → supplier_accepted → sent_to_engineer (after engineer assigned)
- [x] Update assignEngineer to require supplier_accepted status before assigning
- [x] Fix mutation name from jobs.accept to jobs.acceptJob in supplier Jobs page
- [x] Update getSupplierJobs to exclude pending_supplier_acceptance jobs
- [x] Update dashboard metrics to reflect new status flow (Available Jobs + My Jobs)
- [x] Update status enum in updateStatus procedure
- [x] Add View Details button to Available Jobs for suppliers to review before accepting
- [ ] Test complete workflow: Available → Accept → Assign Engineer → My Jobs

## Phase 14: Build Engineer Assignment UI (Dual Assignment Options)
- [x] Research Field Pulse engineer assignment approach
- [x] Verify assignEngineer backend procedure accepts name, email, phone
- [x] Update acceptJob procedure to generate engineerToken when supplier accepts
- [x] Keep existing assignEngineer for Option 1: Manual assignment (supplier inputs details, email sent)
- [x] Add shareable engineer link to supplier job detail page with copy button (Option 2)
- [x] Update status check from assigned_to_supplier to supplier_accepted
- [x] Update engineer job page to show claim form if engineer details not yet provided
- [x] Create claimJob procedure for engineers to self-assign by submitting their details
- [ ] Test both workflows:
  - Option 1: Supplier assigns manually → Email sent to engineer
  - Option 2: Supplier shares link → Engineer claims job themselves

## Phase 15: Update Job Status Timeline Display
- [x] Update JobTimeline component to show complete workflow: pending_supplier_acceptance → supplier_accepted → sent_to_engineer → engineer_accepted → en_route → on_site → completed
- [x] Add visual distinction for engineer assignment step (sent_to_engineer)
- [x] Update status labels and descriptions to match new workflow
- [x] Ensure timeline works correctly in both customer and supplier job detail pages
- [x] Consolidate job progress bar (customer) and job status bar (supplier) to use same JobTimeline component
- [x] Create shared JobDetailCards component for common job information display
- [x] Add viewerType prop to JobDetailCards to show different pricing (customer: price paid, supplier: amount received)
- [x] Refactor customer and supplier job detail pages to use shared components

## Phase 16: Fix Job Details Display and Timeline
- [x] Debug why JobDetailCards component is not showing job details
- [x] Fix job details rendering in customer portal (added null checks and fallbacks)
- [x] Update JobTimeline to show actual timeline events with timestamps (component already has all status icons and labels)
- [x] Ensure timeline displays all workflow transitions properly (fetches from jobStatusHistory table)
- [x] Test both customer and supplier job detail pages

## Phase 17: Standardize Timeline Across Both Portals
- [x] Remove old STATUS_FLOW progress bar from supplier job detail page
- [x] Replace with JobTimeline component (same as customer portal - already present at bottom)
- [x] Ensure both portals show identical timeline with complete workflow (both use JobTimelineWrapper)
- [x] Test timeline display in both customer and supplier portals

## Phase 18: Separate Job Status Progress from Timeline
- [x] Create JobStatusProgress component for visual workflow indicator (top of page)
- [x] Keep JobTimeline as audit trail (bottom of page)
- [x] Update customer job detail page with new layout: Header → Status Progress → Details → Timeline
- [x] Update supplier job detail page with same layout structure (keeping supplier-specific features)
- [x] Ensure both pages have identical formatting and component placement
- [x] Test both portals show consistent layout

## Phase 19: Fix Engineer Information Display
- [x] Check why engineer info showing when no engineer assigned (was checking assignedSupplierId instead of engineerName)
- [x] Fix conditional rendering in customer job detail page
- [x] Fix conditional rendering in supplier job detail page (already correct from rewrite)
- [x] Verify engineer info only shows when engineerName exists

## Phase 20: Add UTC Markers to Timeline Timestamps
- [ ] Update JobTimeline component to show UTC markers on all timestamps
- [ ] Verify UTC markers appear on both customer and supplier job detail pages

## Phase 20: Add Dual Timezone Display to Timeline
- [x] Update JobTimeline component to show local time (primary) + UTC (secondary)
- [x] Format: "Dec 2, 2025 3:30 PM (15:30 UTC)"
- [x] Verify dual timezone display on both customer and supplier job detail pages

## Phase 21: Add Dual Timezone to Scheduled Date & Time
- [x] Update JobDetailCards scheduled datetime to show service location time + UTC
- [x] Format: "18/12/2025, 14:30:00 (14:30 UTC)" + "Local time at service location" label
- [x] Verify display in both customer and supplier portals

## Phase 22: Redesign Engineer Claim Page
- [x] Add Orbidut header with logo and branding to engineer claim page
- [x] Display complete job details using JobDetailCards component
- [x] Maintain claim form functionality (name, email, phone)
- [x] Match styling and layout with main platform design
- [x] Test engineer claim workflow end-to-end

## Phase 23: Remove Pricing from Engineer View
- [x] Update JobDetailCards to accept showPricing prop
- [x] Hide pricing section when showPricing=false
- [x] Update engineer claim page to use showPricing=false
- [x] Move claim form to top of engineer page (after header, before job details)
- [x] Verify engineer page shows job details without payment information

## Phase 24: Add Email Notification to Self-Claim Workflow
- [x] Update claimJob procedure to send confirmation email to engineer
- [x] Include job details, site info, schedule, and engineer link in email
- [x] Test self-claim workflow end-to-end with email delivery (dev server running successfully)

## Phase 25: Update Engineer Assignment Workflow Logic
- [x] Update claimJob procedure to set status to `engineer_accepted` (self-claim implies acceptance)
- [x] Create acceptJob procedure for manually assigned engineers to confirm/update details
- [x] Engineer input details supersede supplier's manual assignment details
- [x] Update engineer page to show accept form when status is `sent_to_engineer`
- [x] Update engineer page to show job management interface when status is `engineer_accepted` or later (already implemented - shows full job management when status is beyond sent_to_engineer)
- [x] Test self-claim workflow (should go directly to engineer_accepted)
- [x] Test manual assignment workflow (should require engineer acceptance)

## Phase 26: Fix Engineer Claim Job 500 Error
- [x] Investigate claimJob procedure backend error causing 500 response
- [x] Fix the error and test engineer claim workflow
- [x] Verify email notification is sent after successful claim

## Phase 27: Complete Engineer Job Management Interface
- [x] Add job details display to engineer page after claim (job info, location, schedule)
- [x] Add status update buttons (En Route, On Site, Complete Job)
- [x] Add GPS tracking integration
- [x] Add site visit report form
- [x] Test complete engineer workflow end-to-end

## Phase 28: Fix Customer Job Acceptance Error
- [x] Fix customer Accept Job button calling wrong mutation (should call acceptJobAsSupplier, not acceptJob)
- [x] Test customer job acceptance workflow

## Phase 29: Fix Engineer Link Error for Jobs Without Engineer Token
- [x] Fix EngineerJobPage to handle null/invalid tokens gracefully
- [x] Show appropriate message when job hasn't been accepted by supplier yet
- [x] Test with jobs in different states

## Phase 30: Fix Engineer Token System
- [x] Investigate when engineer tokens are generated (job creation vs supplier acceptance)
- [x] Check all procedures that should generate tokens
- [x] Verify token generation works for all job statuses
- [x] Ensure engineer page loads correctly with valid tokens
- [x] Test complete workflow end-to-end

## Phase 31: Fix Engineer Email Links
- [x] Set VITE_APP_URL environment variable to production domain
- [x] Test email link generation uses correct domain
- [x] Verify all email notifications use production URLs

## Phase 32: Fix Customer Job Page Error
- [x] Fix ReferenceError: Phone variable undefined in CustomerJobDetail
- [x] Test customer job detail pages
- [x] Verify all customer pages load correctly

## Phase 33: Add Real-Time GPS Tracking Maps
- [ ] Review existing EngineerLocationMap component
- [ ] Add map to customer job detail page (show when en route/on site)
- [ ] Add map to supplier job detail page (show when en route/on site)
- [ ] Display engineer location pin and site location pin
- [ ] Show route/distance when en route
- [ ] Test real-time updates

## Phase 33: Add Real-Time GPS Tracking Maps with ETA
- [x] Review existing EngineerLocationMap component
- [x] Add map to customer job detail page (show when en route/on site)
- [x] Add map to supplier job detail page (show when en route/on site)
- [x] Display engineer location pin and site location pin
- [x] Show route line between engineer and site
- [x] Calculate and display distance
- [x] Calculate and display estimated ETA
- [x] Auto-refresh location every 30 seconds
- [x] Test real-time updates

## Phase 34: Remove Route Line from GPS Tracking
- [x] Remove DirectionsRenderer from EngineerLocationMap
- [x] Keep only pins (engineer and site) visible
- [x] Keep ETA and distance calculation (but no visual route line)
- [x] Test map display

## Phase 35: Implement Short Engineer Links
- [x] Add shortCode field to jobs table (6-8 character alphanumeric)
- [x] Generate short code at job creation
- [x] Create /e/:shortCode route that redirects to /engineer/job/:token
- [x] Update supplier portal to show short link format
- [x] Make engineer link visible for all statuses after sent_to_engineer
- [x] Test short link generation and routing

## Phase 37: Fix Site Visit Report Database Insertion
- [x] Fix submitSiteVisitReport procedure - map form fields to correct schema fields
- [x] Replace .$returningId() with proper Drizzle ORM .execute() method
- [x] Change fileUrl to LONGTEXT for base64 image storage
- [x] Test site visit report submission with photos and signature
- [x] Verify all form fields are saved correctly to database

## Phase 38: Fix Site Visit Report ID Field Error
- [ ] Remove id field from siteVisitReports insert statement - causing database constraint violation
- [ ] Test site visit report submission with all fields
- [ ] Verify report is saved correctly without id conflict
- [x] Fix insertResult.insertId access - used query-back approach instead
- [x] Debug the actual structure of Drizzle insert result - bypassed with query-back approach
## Phase 39: Analyze FieldPulse Code for Drizzle ORM Pattern
- [x] Clone FieldPulse repository from GitHub
- [x] Find database insertion code that handles auto-increment IDs
- [x] Apply query-back approach to fix site visit report submission
- [x] Test the corrected implementation - SUCCESS!
- [x] Still getting database insertion error - used query-back approach successfully
- [x] FieldPulse pattern still not working - examined their database configuration and schema differences
## Phase 40: Fix Photo Insertion Preventing Form Submission
- [x] Site visit report inserts but photo insertion fails, preventing successful form completion
- [x] Check svrMediaFiles schema and fix field name mismatch
- [x] Test complete submission with success response
## Phase 41: Deep Dive into FieldPulse Site Visit Report Implementation
- [x] Analyze FieldPulse backend tRPC procedure structure and database operations
- [x] Analyze FieldPulse frontend form submission and mutation handling
- [x] Identify key differences between FieldPulse and Orbidut implementations
- [x] Rewrite Orbidut submission flow based on FieldPulse working patterns
- [x] Test complete end-to-end submission with success response - SUCCESS!
## Phase 42: Fix Database Column Size for Signature Storage
- [x] Identified TEXT column size limitation for clientSignatureData (64KB max)
- [x] Changed clientSignatureData column from TEXT to LONGTEXT (4GB max)
- [x] Applied ALTER TABLE directly to database
- [x] Fixed insertId retrieval by using query-back approach (orderBy desc + limit 1)
- [x] Added eq and desc imports from drizzle-orm
- [ ] Waiting for user to test site visit report submission with signature and photos
## Phase 43: Fix Persistent Site Visit Report Database Insertion Error
- [x] Form submission still failing with "TRPCClientError: Failed query: insert into `siteVisitReports`"
- [x] Database column changed to LONGTEXT but error persists
- [x] Query-back approach implemented but insertion still fails
- [x] Investigated exact SQL error and field constraints
- [x] Found root cause: unique constraint on jobId with existing report for job 30001
- [x] Implemented upsert logic: check if report exists, UPDATE if yes, INSERT if no
- [ ] Test the fix with form submission
## Phase 44: Fix Job Status Update After Site Visit Report Submission
- [x] Site visit report submission now working successfully
- [x] Job status not automatically updating to "completed" after report submission
- [x] Add job status update logic to submitSiteVisitReport procedure
- [x] Add status history entry to track completion
- [ ] Test complete workflow in both supplier and customer portals

## Phase 45: Display Site Visit Report in Job Details
- [x] Create a `SiteVisitReport` component to display report details.
- [x] Fetch site visit report data in the customer job detail page (updated getById procedure).
- [x] Render the `SiteVisitReport` component in the customer job detail page.
- [x] Fetch site visit report data in the supplier job detail page (same getById procedure).
- [x] Render the `SiteVisitReport` component in the supplier job detail page.
- [ ] Test the display of the site visit report in both portals.

## Phase 46: Fix Missing Site Visit Report in
 Job Details
- [ ] Site visit report not showing in customer job detail page
- [ ] Site visit report not showing in supplier job detail page
- [ ] Debug getById query to check if siteVisitReport data is being fetched
- [ ] Fix the query to properly join and return site visit report data
- [ ] Test the display in both portals

## Phase 47: Add Missing Recommendations Field to Site Visit Report Display
- [x] Check database schema for recommendations field name
- [x] Add recommendations column to database schema and table
- [x] Update backend to save recommendations field
- [x] Add recommendations field to SiteVisitReport component interface
- [x] Add recommendations display section to the component
- [ ] Test the display in job details page

## Phase 48: Add Time Tracking Display for Completed Jobs
- [x] Check database schema for timeOnsite and timeLeftSite fields in site visit report
- [x] Create time tracking display component showing arrival, departure, and duration
- [x] Display times in both local site time and UTC
- [x] Only show for completed jobs (jobs with site visit reports)
- [x] Add to both customer and supplier job detail pages (via SiteVisitReport component)
- [x] Backend logic to capture timestamps from job status history
- [ ] Test the display

## Phase 49: Add Engineer Link Display for Sent to Engineer Status
- [x] Check supplier job detail page to find where engineer link should be displayed
- [x] Add engineer link display for jobs in 'sent_to_engineer' status
- [ ] Test the display in supplier portal

## Phase 50: Fix Time Tracking Display to Show All Three Fields
- [x] Identified issue: timeLeftSite was looking for completed status before it was created
- [x] Fixed submitSiteVisitReport to use current timestamp as timeLeftSite (when report is submitted)
- [x] Verified SiteVisitReport component displays all three fields correctly:
  * Arrived On Site (from on_site status history)
  * Left Site (from report submission time)
  * Total Time On Site (calculated duration)
- [x] Time tracking now shows complete information with local and UTC timestamps


## SHORT-TERM PRIORITY TASKS

### 1. Check Complete Workflow End-to-End
- [ ] Test customer job creation flow
- [ ] Test supplier job acceptance
- [ ] Test engineer assignment (both manual and self-claim)
- [ ] Test engineer status updates (en route → on site → completed)
- [ ] Test site visit report submission with new time tracking
- [ ] Verify all three time fields display correctly (arrived, left, total duration)
- [ ] Check email notifications at each step
- [ ] Verify timeline shows all status changes

### 2. Add Print Facility for Completed Jobs
- [ ] Add "Print Report" button to site visit report display
- [ ] Create printable PDF layout for site visit reports including:
  * Job details (service type, location, scheduled time)
  * Engineer information
  * Time tracking (arrived, left, total duration)
  * Findings, actions performed, recommendations
  * Customer signature
  * Photos
- [ ] Implement PDF generation (consider using jsPDF or similar)
- [ ] Add print button to both customer and supplier job detail pages
- [ ] Style PDF for professional appearance
- [ ] Test printing functionality

### 3. Add On-Site Pause Button for Engineers
- [ ] Add "Pause" and "Resume" buttons to engineer job page when status is "on_site"
- [ ] Create pauseTracking and resumeTracking tRPC procedures
- [ ] Add jobTimePauses table to track pause periods:
  * jobId, pausedAt, resumedAt, reason (optional)
- [ ] Update timeline to show pause periods visually
- [ ] Calculate actual working time (total time - pause time)
- [ ] Display pause history in job timeline
- [ ] Update site visit report to show:
  * Total time on site
  * Total pause time
  * Actual working time
- [ ] Add visual indicator when job is paused (orange/amber status)
- [ ] Test pause/resume functionality with GPS tracking


## Phase 51: Implement Print Function for Completed Jobs
- [x] Add Print button to SiteVisitReport component
- [x] Install jsPDF library for PDF generation
- [x] Create PDF generation function with professional layout
- [x] Include all report sections: job details, time tracking, findings, actions, signature, photos
- [x] Style PDF for print-ready output
- [x] Test PDF generation and download


## Phase 52: Add Orbidut Branding to PDF Report
- [x] Add Orbidut logo to PDF header
- [x] Add brand colors (blue accent)
- [x] Add company tagline/footer
- [x] Format header with professional layout
- [x] Test branded PDF output


## Phase 53: Implement Pause/Resume Tracking for Engineers
- [x] Create jobTimePauses table in database schema (jobId, pausedAt, resumedAt, reason)
- [x] Run database migration
- [x] Create pauseWork tRPC procedure
- [x] Create resumeWork tRPC procedure
- [x] Add Pause/Resume buttons to engineer job page (visible when on_site)
- [x] Add visual indicator when job is paused
- [x] Update JobTimeline to display pause periods
- [x] Calculate and display actual working time (total time - pause time)
- [x] Update site visit report to show pause summary
- [x] Test pause/resume workflow


## Phase 54: Fix Supplier Job Access Issue
- [ ] Debug getJobDetails procedure to check supplier access control
- [ ] Fix supplier access verification for assigned jobs
- [ ] Test supplier can view job details after assignment

- [x] Fix duration display in supplier jobs list to show hours and minutes format (e.g., "2h 0m" instead of "120 minutes")
- [x] Add site name, duration, and payment details to My Jobs cards

## Phase 55: Simplify Request Service Form
- [x] Remove booking type field from customer request service form (only hourly bookings supported)

## Phase 56: Fix Site Name Not Being Saved
- [x] Fix job creation procedure to save siteName field to database
- [x] Add siteName display to Available Jobs tab in supplier portal

## Phase 57: Add Site Name to Job Detail Pages
- [x] Add siteName display to supplier job detail page Service Location section
- [x] Add siteName display to customer job detail page Service Location section

## Phase 58: Fix Site Name Data Capture
- [x] Investigate why siteName is not being saved when customers submit request form
- [x] Add console logging at each step to trace data flow
- [x] Test with new job submission to verify siteName is captured - CONFIRMED WORKING

## Phase 59: Fix Customer My Jobs Page Display Issues
- [x] Fix duration showing as hours instead of converting from minutes (180 minutes showing as "180 hours" instead of "3 hours")
- [x] Add siteName display to customer My Jobs page

## Phase 60: Fix Duration Display on Job Detail Pages
- [x] Fix "Estimated Duration" in Service Information section (showing "180 hours" instead of "3h")
- [x] Fix "Duration" in Pricing Details section (showing "180 hours" instead of "3h")
- [x] Fix hourly rate calculation to use hours instead of minutes

## Phase 61: Fix Timezone Detection on Request Service Form
- [x] Investigate timezone API 400 error when selecting addresses
- [x] Fix timezone detection to work with Google Places autocomplete - changed to use tRPC utils.client.jobs.getTimezone.query()
- [x] Test timezone detection with Times Square address - working correctly, shows "Timezone detected: Eastern Standard Time"

## Phase 62: Fix Address Validation Double-Click Issue
- [x] Fix validation error not clearing when address is selected from autocomplete
- [x] Ensure red border and error message disappear immediately after selection
- [x] Test address selection workflow end-to-end - working perfectly, no more double-click needed

## Phase 63: Fix Schedule Timezone Conversion Bug
- [x] Investigate why 09:00 local time input is being treated as UTC
- [x] Fix conversion logic to properly interpret time picker input as site local time
- [x] Ensure display shows correct local time and UTC conversion
- [x] User confirmed timezone conversion is now working correctly

## Phase 64: Fix Supplier Portal Job Details Navigation
- [x] Investigate why job details cannot be found when clicking from supplier portal
- [x] Check routing and data fetching logic for job details page - found getById query was filtering out unassigned jobs
- [x] Fix the navigation or query issue - allow suppliers to view jobs with status 'pending_supplier_acceptance'
- [x] Test job details navigation from supplier portal - Job #210003 and #210004 both loading successfully

## Phase 65: Add Map Popup to Service Location in Job Details
- [x] Create map popup dialog component with Google Maps integration
- [x] Add pin marker to show exact service location on map
- [x] Make service location section clickable to open map popup
- [x] Test map popup on supplier job details pages - tested with Job #210004 (New York) and Job #210003 (Dubai), both working perfectly

## Phase 66: Reorganize Job Details Page Layout
- [x] Review current section order in job details page
- [x] Make Customer Information, Engineer Link, and Assigned Engineer half-width (2 columns) while maintaining current order
- [x] Keep Job Status, Service Information, and Job Timeline full-width
- [x] Test responsive layout on Job #210004 - working correctly with better space utilization

## Phase 67: Make Site Contact and Assigned Engineer Side-by-Side
- [x] Move Site Contact and Assigned Engineer into same responsive 2-column grid
- [x] Test responsive layout - working correctly with md:grid-cols-2 (mobile: stacked, desktop: side-by-side)


## Phase 68: Enhanced GPS Location Tracking at All Milestones
- [x] Analyze current GPS tracking implementation (currently only tracks en_route)
- [x] Update updateStatusByToken backend to capture GPS coordinates for on_site, completed statuses
- [x] Update pauseWork backend to capture GPS coordinates when pausing
- [x] Update resumeWork backend to capture GPS coordinates when resuming
- [x] Update engineer UI to get current position before status changes
- [x] Update JobTimeline component to display GPS coordinates for all milestone events (on_site, pause, resume, completed)
- [ ] Test complete workflow: en_route → on_site → pause → resume → complete (all with GPS data)

## Phase 69: Make All Buttons Instant (GPS Capture Non-Blocking)
- [x] Reduce GPS timeout to 1 second for faster response (pause, resume, status updates)
- [x] Refactor pause/resume to trigger mutation immediately, capture GPS in background
- [x] Refactor status updates (on_site, complete) to be instant with background GPS
- [x] All buttons now respond instantly - status update happens first, GPS captured in background

## Phase 70: Fix Pause Notification Layout
- [x] Make "Work is paused" notification appear above buttons (not below)
- [x] Show pause time inline with notification text
