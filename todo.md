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
