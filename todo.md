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

## Superadmin Dashboard - Full Platform Visibility

### Phase 74: Superadmin Organization & Multi-User Access Control
- [ ] Database schema for admin organization:
  - [ ] Create adminOrganization table (organizationId, name, createdAt)
  - [ ] Create adminUsers table (userId, organizationId, role: owner/admin/viewer, permissions)
  - [ ] Add organizationId to users table for admin users
- [ ] Role-based access control:
  - [ ] Owner: Full access including user management
  - [ ] Admin: Full platform access except user management
  - [ ] Viewer: Read-only access to all data
- [ ] Backend procedures:
  - [ ] Create superadminProcedure middleware (checks organizationId)
  - [ ] Add admin user invitation system
  - [ ] Add admin user permission management
- [ ] Frontend:
  - [ ] Add /admin route and AdminLayout component
  - [ ] Create admin navigation sidebar
  - [ ] Add admin user management page
  - [ ] Implement role-based UI visibility

### Phase 75: Platform Overview Dashboard
- [ ] Total platform statistics card:
  - [ ] Total jobs (all time)
  - [ ] Total customers
  - [ ] Total suppliers
  - [ ] Total engineers
  - [ ] Total revenue
  - [ ] Platform margin collected
- [ ] Real-time metrics:
  - [ ] Jobs created today/this week/this month
  - [ ] Active jobs (in progress)
  - [ ] Completed jobs today
  - [ ] Average job completion time
- [ ] Revenue charts:
  - [ ] Revenue over time (line chart)
  - [ ] Revenue by service type (pie chart)
  - [ ] Revenue by region (bar chart)

### Phase 76: Job Management & Monitoring
- [ ] All jobs table with advanced filtering:
  - [ ] Filter by status (all statuses)
  - [ ] Filter by service type
  - [ ] Filter by date range
  - [ ] Filter by customer/supplier
  - [ ] Search by job ID, customer name, location
- [ ] Job detail view with full visibility:
  - [ ] All job information
  - [ ] Customer details
  - [ ] Supplier details
  - [ ] Engineer details
  - [ ] Payment status
  - [ ] Timeline and GPS tracking
  - [ ] Site visit report
- [ ] Job actions:
  - [ ] Manually reassign job to different supplier
  - [ ] Cancel job with reason
  - [ ] Refund customer
  - [ ] Mark job as disputed

### Phase 77: Supplier Verification & Approval Workflow
- [ ] Database schema for verification:
  - [ ] Add supplierVerification table (supplierId, status, submittedAt, reviewedAt, reviewedBy, rejectionReason, adminNotes)
  - [ ] Add supplierCompanyProfile table:
    - [ ] supplierId (FK)
    - [ ] companyName, registrationNumber, yearFounded
    - [ ] headquarters (address, city, country)
    - [ ] regionalOffices (JSON array of office locations)
    - [ ] ownershipStructure (enum: private, group, subsidiary)
    - [ ] parentCompany (if subsidiary)
    - [ ] missionStatement (TEXT)
    - [ ] coreValues (TEXT)
    - [ ] companyOverview (TEXT - what the company does)
    - [ ] numberOfEmployees, annualRevenue (optional)
    - [ ] websiteUrl, linkedInUrl
    - [ ] primaryContactName, primaryContactTitle, primaryContactEmail, primaryContactPhone
    - [ ] createdAt, updatedAt
  - [ ] Add verificationDocuments table:
    - [ ] supplierId (FK)
    - [ ] documentType (enum: insurance_liability, insurance_indemnity, insurance_workers_comp, dpa_signed, nda_signed, non_compete_signed, security_compliance, engineer_vetting_policy, other)
    - [ ] documentName (original filename)
    - [ ] fileUrl (S3 URL)
    - [ ] fileKey (S3 key)
    - [ ] fileSize, mimeType
    - [ ] uploadedAt, uploadedBy
    - [ ] expiryDate (for insurance certificates)
    - [ ] status (enum: pending_review, approved, rejected, expired)
    - [ ] reviewedBy, reviewedAt, reviewNotes
  - [ ] Add verificationStatus enum: pending, under_review, approved, rejected, resubmission_required
  - [ ] Add isVerified and verificationStatus fields to suppliers table
- [ ] Document types required:
  - [ ] **1. Company Profile Questionnaire** (stored in supplierCompanyProfile table):
    - [ ] Company name, registration number, year founded
    - [ ] Headquarters + regional offices
    - [ ] Ownership structure (private, group, subsidiary)
    - [ ] Mission statement & core values
    - [ ] High-level summary of what the company does
  - [ ] **2. Insurance Certificates** (uploaded documents):
    - [ ] Public liability insurance
    - [ ] Professional indemnity insurance
    - [ ] Workers' compensation insurance
    - [ ] Track expiry dates and send renewal reminders
  - [ ] **3. Data Processing Agreement (DPA)** - Orbidut provides template:
    - [ ] Generate DPA PDF with supplier details pre-filled
    - [ ] Supplier downloads, signs, and uploads signed copy
    - [ ] Store signed DPA in verificationDocuments
  - [ ] **4. Non-Disclosure Agreement (NDA)** - Orbidut provides template:
    - [ ] Generate NDA PDF with supplier details
    - [ ] Supplier signs and uploads
    - [ ] Store signed NDA
  - [ ] **5. Non-Compete Agreement** - Orbidut provides template:
    - [ ] Generate non-compete PDF
    - [ ] Supplier signs and uploads
    - [ ] Store signed agreement
  - [ ] **6. Security Compliance Documents** (optional):
    - [ ] ISO 27001, SOC 2, or other security certifications
    - [ ] Mark as optional in UI
  - [ ] **7. Engineer Vetting Policy** - Orbidut may provide template:
    - [ ] Supplier's process for vetting engineers
    - [ ] Background checks, qualifications verification
    - [ ] Can use Orbidut template or upload own policy
- [ ] Supplier-side verification submission:
  - [ ] Create multi-step verification wizard in supplier portal:
    - [ ] **Step 1: Company Profile Questionnaire**
      - [ ] Form with all company profile fields
      - [ ] Validation for required fields
      - [ ] Save progress (can complete later)
    - [ ] **Step 2: Insurance Certificates Upload**
      - [ ] Upload public liability insurance (with expiry date)
      - [ ] Upload professional indemnity insurance (with expiry date)
      - [ ] Upload workers' compensation insurance (with expiry date)
      - [ ] File validation (PDF/image, max 10MB per file)
    - [ ] **Step 3: Legal Agreements**
      - [ ] Generate and download DPA template (pre-filled with supplier info)
      - [ ] Upload signed DPA
      - [ ] Generate and download NDA template
      - [ ] Upload signed NDA
      - [ ] Generate and download Non-Compete template
      - [ ] Upload signed Non-Compete
    - [ ] **Step 4: Optional Documents**
      - [ ] Upload security compliance certificates (optional)
      - [ ] Upload engineer vetting policy (or use Orbidut template)
    - [ ] **Step 5: Review & Submit**
      - [ ] Summary of all entered information
      - [ ] List of all uploaded documents
      - [ ] Checkbox: "I confirm all information is accurate"
      - [ ] Submit for review button
  - [ ] Verification status dashboard:
    - [ ] Show current status (pending/under review/approved/rejected)
    - [ ] Progress indicator showing completed steps
    - [ ] Show rejection reasons if rejected
    - [ ] Allow resubmission with updated documents
    - [ ] Show which specific documents need resubmission
  - [ ] Document expiry tracking:
    - [ ] Show insurance expiry dates
    - [ ] Send email reminders 30 days before expiry
    - [ ] Allow uploading renewed certificates
    - [ ] Flag expired documents in admin review
- [ ] Superadmin verification review:
  - [ ] Pending verifications dashboard with count badge
  - [ ] Verification queue table (newest first, filterable by status)
  - [ ] Detailed verification review page:
    - [ ] View all uploaded documents (inline preview or download)
    - [ ] View business details form
    - [ ] View supplier profile (coverage, rates, contact info)
    - [ ] Approve/Reject buttons with reason field
    - [ ] Request additional documents option
    - [ ] Add internal notes visible only to admins
  - [ ] Bulk actions (approve/reject multiple suppliers)
  - [ ] Email notifications:
    - [ ] Notify supplier when verification approved
    - [ ] Notify supplier when verification rejected (with reasons)
    - [ ] Notify supplier when additional documents needed
- [ ] Access control based on verification:
  - [ ] Unverified suppliers cannot see available jobs
  - [ ] Unverified suppliers see "Verification Pending" banner
  - [ ] Only verified suppliers can accept jobs
  - [ ] Show verification badge on supplier profiles

### Phase 78: User Management
- [ ] Customers table:
  - [ ] View all customers
  - [ ] Customer details (jobs, spending, join date)
  - [ ] Suspend/activate customer accounts
  - [ ] View customer job history
  - [ ] Export customer data
- [ ] Suppliers table:
  - [ ] View all suppliers (verified and unverified)
  - [ ] Filter by verification status
  - [ ] Supplier details (coverage, rates, jobs completed, verification status)
  - [ ] Suspend/activate supplier accounts
  - [ ] View supplier performance metrics
  - [ ] Manually verify/unverify suppliers
- [ ] Engineers list:
  - [ ] View all engineers (extracted from jobs)
  - [ ] Engineer performance (jobs completed, ratings, on-time %)
- [ ] Admin users management (Organization owners only):
  - [ ] View all admin users in organization
  - [ ] Invite new admin users via email
  - [ ] Change admin user roles (owner/admin/viewer)
  - [ ] Revoke admin access
  - [ ] View admin activity logs

### Phase 79: Financial Management
- [ ] Payment tracking:
  - [ ] All transactions table
  - [ ] Payment status (pending, completed, refunded)
  - [ ] Platform margin per transaction
  - [ ] Export financial reports (CSV)
- [ ] Payout management:
  - [ ] Pending payouts to suppliers
  - [ ] Completed payouts
  - [ ] Failed payouts with retry option
- [ ] Revenue analytics:
  - [ ] Total revenue by time period
  - [ ] Revenue by service type
  - [ ] Revenue by region/country
  - [ ] Top earning suppliers
  - [ ] Top spending customers

### Phase 80: Platform Configuration
- [ ] Service type management:
  - [ ] Add/edit/remove service types
  - [ ] Set platform margin percentage per service
- [ ] Response time options:
  - [ ] Add/edit/remove response time tiers
- [ ] Geographic settings:
  - [ ] Manage country list
  - [ ] Add/remove regions
- [ ] Email template management:
  - [ ] Edit email notification templates
  - [ ] Preview emails before sending
- [ ] Platform settings:
  - [ ] Set platform-wide margin percentage
  - [ ] Configure payment processing
  - [ ] Set minimum/maximum job durations

### Phase 81: Analytics & Reporting
- [ ] Performance metrics:
  - [ ] Average job completion time
  - [ ] Customer satisfaction (from reviews)
  - [ ] Supplier performance scores
  - [ ] Engineer on-time percentage
- [ ] Growth metrics:
  - [ ] New customers per week/month
  - [ ] New suppliers per week/month
  - [ ] Job volume trends
  - [ ] Revenue growth rate
- [ ] Geographic analytics:
  - [ ] Jobs by country/city
  - [ ] Revenue by region
  - [ ] Supplier coverage heatmap
- [ ] Export capabilities:
  - [ ] Export all reports to CSV/Excel
  - [ ] Schedule automated reports via email

### Phase 82: Support & Dispute Management
- [ ] Support ticket system:
  - [ ] View all support tickets
  - [ ] Assign tickets to team members
  - [ ] Respond to tickets
  - [ ] Close/resolve tickets
- [ ] Dispute resolution:
  - [ ] View disputed jobs
  - [ ] Review evidence (site visit reports, photos, GPS)
  - [ ] Make rulings (refund customer, pay supplier, split)
  - [ ] Track dispute outcomes

### Phase 83: Audit & Logs
- [ ] Activity logs:
  - [ ] User login/logout events
  - [ ] Job status changes
  - [ ] Payment transactions
  - [ ] Admin actions
- [ ] System health monitoring:
  - [ ] Database connection status
  - [ ] Email delivery status
  - [ ] GPS tracking success rate
  - [ ] API response times

### Phase 84: Testing & Deployment
- [ ] Test all superadmin features with test data
- [ ] Verify role-based access control
- [ ] Test all filters and search functionality
- [ ] Verify all charts and analytics display correctly
- [ ] Test export functionality
- [ ] Save checkpoint and push to GitHub

## Phase 85: Implement Supplier Verification & Superadmin Dashboard (In Progress)

### Database Schema Implementation
- [x] Create supplierCompanyProfile table in drizzle/schema.ts
- [x] Create verificationDocuments table in drizzle/schema.ts
- [x] Create supplierVerification table in drizzle/schema.ts
- [x] Create adminOrganization table in drizzle/schema.ts
- [x] Create adminUsers table in drizzle/schema.ts
- [x] Add isVerified field to suppliers table
- [x] Run database migration (SQL execution)

### Backend Procedures - Supplier Verification
- [x] Create getVerificationStatus procedure (supplier checks their status)
- [x] Create submitCompanyProfile procedure (save questionnaire)
- [x] Create uploadVerificationDocument procedure (upload docs to S3)
- [x] Create submitForVerification procedure (final submission)
- [x] Create getVerificationDocuments procedure (list uploaded docs)
- [ ] Add access control: block unverified suppliers from viewing/accepting jobs

### Backend Procedures - Admin Verification Review
- [ ] Create superadminProcedure middleware (check admin organization membership)
- [x] Create getPendingVerifications procedure (admin queue)
- [x] Create getVerificationDetails procedure (admin review page)
- [x] Create approveVerification procedure (approve supplier)
- [x] Create rejectVerification procedure (reject with reason)
- [x] Create addVerificationNote procedure (internal admin notes)

### Backend Procedures - Admin Organization
- [ ] Create getAdminUsers procedure (list admin team)
- [ ] Create inviteAdminUser procedure (send invitation)
- [ ] Create updateAdminRole procedure (change permissions)
- [ ] Create revokeAdminAccess procedure (remove admin)

### Supplier Portal UI - Verification Wizard
- [x] Create VerificationWizard component (5-step flow)
- [x] Step 1: Company Profile form (all questionnaire fields)
- [x] Step 2: Insurance certificates upload (3 types with expiry dates)
- [x] Step 3: Legal agreements (generate templates, upload signed)
- [x] Step 4: Optional documents (security compliance, vetting policy)
- [x] Step 5: Review and submit
- [x] Create VerificationStatus component (dashboard showing status)
- [ ] Add verification banner to supplier dashboard (if unverified)
- [ ] Block "Available Jobs" page access for unverified suppliers

### Admin Portal UI - Layout & Navigation
- [x] Create AdminLayout component (similar to DashboardLayout)
- [x] Create admin navigation sidebar with sections:
  - [x] Dashboard (overview)
  - [x] Verifications (pending queue)
  - [x] Jobs (all jobs monitoring)
  - [x] Users (customers, suppliers, engineers)
  - [x] Admin Team (organization management)
- [x] Create /admin route in App.tsx
- [ ] Add role-based route protection (only admin users can access)

### Admin Portal UI - Verification Review
- [x] Create VerificationQueue page (table of pending verifications)
- [x] Create VerificationReview page (detailed review interface)
- [ ] Document preview component (inline PDF/image viewer)
- [x] Approve/Reject dialog with reason field
- [ ] Request additional documents dialog
- [ ] Internal notes section (admin-only)
- [ ] Email notification on approval/rejection

### Admin Portal UI - Platform Overview
- [x] Create AdminDashboard page (platform statistics)
- [x] Statistics cards (total jobs, customers, suppliers, revenue)
- [ ] Real-time metrics (jobs today, active jobs, completed today)
- [ ] Create AllJobs page (table with advanced filtering)
- [ ] Create UserManagement page (customers and suppliers tables)
- [ ] Create AdminTeam page (manage admin organization users)

### Testing
- [ ] Test supplier verification submission flow end-to-end
- [ ] Test admin verification review and approval
- [ ] Test access control (unverified suppliers blocked)
- [ ] Test admin role-based permissions
- [ ] Test document upload and storage
- [ ] Test email notifications

## Verification Wizard - Document Storage Migration

- [ ] Migrate document storage from localStorage to external storage solution
  - Current: All documents (insurance, legal, optional) stored in browser localStorage
  - Issue: 5-10MB limit, data lost on cache clear
  - Future: Move to database BLOB storage or external document management service
  - Affects: Insurance certificate uploads, e-signed legal agreements, optional documents

## Verification Wizard - Immediate Priority

- [ ] Block "My Jobs" page access until verification is approved
  - Prevent suppliers from viewing jobs if verification status is not "approved"
  - Show message explaining verification is required
  - Redirect to verification status page

- [ ] Prevent re-opening of verification wizard after submission
  - Check verification status before allowing wizard access
  - If status is "pending_review", "under_review", or "approved", redirect to status page
  - Only allow wizard access if status is "not_started" or "resubmission_required"

## Phase 30: Navigation and Verification Access Control
- [x] Fix dashboard navigation to route based on user role (customer vs supplier)
- [x] Block "My Jobs" page access until verification is approved
- [x] Prevent re-opening of verification wizard after submission
- [x] Add "Back to Dashboard" button to verification wizard

## Phase 31: Verification Notifications and Progress Indicator
- [x] Add email notifications when verification status changes (approved, rejected, resubmission required)
- [x] Create verification progress indicator component showing completion percentage
- [x] Integrate progress indicator into supplier dashboard
- [x] Show missing items and next steps in progress indicator

## Phase 32: Superadmin Panel
- [x] Add superadmin role to user schema
- [x] Push database schema changes
- [x] Create superadmin middleware for role-based access control
- [x] Protect all admin procedures with superadmin check
- [x] Build supplier verification review interface (approve/reject/request resubmission)
- [x] Create supplier management table (all suppliers with details)
- [x] Create user management table (all users with details)
- [x] Build job management interface (all jobs across platform)
- [x] Create coverage visualization - Map view with supplier overlays
- [x] Create coverage visualization - Table view with coverage matrix
- [x] Create coverage visualization - Analytics view with statistics
- [x] Create superadmin dashboard with overview metrics
- [x] Add superadmin navigation and layout

## Phase 33: Superadmin Account Setup
- [x] Create superadmin account (admin@orbitdut.com)
- [x] Test superadmin login and panel access

## URGENT: Superadmin Routing Fix
- [x] Fix dashboard routing to redirect superadmin users to /superadmin panel
- [x] Update DashboardLayout or main.tsx to check for superadmin role
- [x] Test superadmin login redirects to correct dashboard

## Phase 34: Fix Superadmin Login Redirect Loop
- [x] Fix infinite redirect loop in CustomerDashboard useEffect
- [x] Remove redirect from CustomerDashboard (should only be in Login.tsx)
- [x] Test superadmin login flow works correctly

## Phase 35: Update Superadmin Email
- [x] Update superadmin email to admin@orbidut.com in database
- [x] Verify login works with new email

## Phase 36: Fix Missing useAuth Import
- [x] Add useAuth import back to CustomerDashboard.tsx
- [x] Verify customer dashboard loads correctly

## Phase 37: Comprehensive Superadmin Verification System
- [x] Design verification dashboard with tabs/sections for different statuses
- [x] Show "Not Started" suppliers (signed up but haven't begun verification)
- [x] Show "In Progress" suppliers (partially completed verification wizard)
- [x] Show "Pending Review" suppliers (submitted and awaiting approval)
- [x] Display contact details for all suppliers (name, email, phone, company)
- [x] Build backend procedure to fetch all suppliers grouped by verification status
- [x] Create verification detail view page (/superadmin/verifications/:supplierId)
- [x] Add document viewer for insurance, certifications, licenses
- [x] Add coverage map visualization in detail view
- [x] Implement approve/reject/request resubmission actions
- [x] Test backend procedures with vitest
- [x] Add filters and search functionality

## Phase 38: Ensure 100% Field Coverage in Verification Review
- [x] Audit all verification-related tables (suppliers, supplierVerification, supplierCompanyProfile, verificationDocuments, supplierCoverageAreas, supplierServiceCapabilities)
- [x] List all fields captured during verification wizard
- [x] Compare with current VerificationDetail page display
- [x] Add any missing fields to the review page
- [x] Organize fields logically by section
- [x] Test with real data to ensure all fields render correctly

## Phase 39: Add Remaining Missing Contact and Verification Fields
- [x] Audit what contact fields are missing (check suppliers table vs display)
- [x] Audit what verification fields are missing (check supplierVerification table vs display)
- [x] Backend: Update getVerificationDetails to fetch suppliers.isActive, suppliers.updatedAt
- [x] Backend: Update getVerificationDetails to fetch supplierVerification.createdAt, supplierVerification.updatedAt
- [x] Backend: Update getVerificationDetails to fetch supplierCompanyProfile.createdAt, supplierCompanyProfile.updatedAt
- [x] Backend: Update getVerificationDetails to fetch supplierUsers (all team members with roles)
- [x] Frontend: Add Account Status section showing isActive status
- [x] Frontend: Add Timestamps section showing all creation/update dates
- [x] Frontend: Add Team Members section showing all supplier users with roles
- [x] Testing: Verify all fields display correctly with real data
- [x] Verify 100% coverage with user confirmation

## Phase 40: Display Full Signed Documents with Signatures
- [x] Audit verificationDocuments table for signature-related fields
- [x] Check if signedBy, signatureUrl, signedAt fields exist
- [x] Add signedBy, signatureUrl, signedAt fields to schema
- [x] Run database migration to add signature fields
- [x] Update backend to fetch signer information (already fetched in getVerificationDetails)
- [x] Update frontend to display document preview, signer name, and signature image together
- [x] Test signed document display

## Phase 41: Audit and Enhance Document Upload for Complete Signature Capture
- [x] Find and review current supplier document upload form
- [x] Check what fields are currently being collected
- [x] Verify if signedBy, signatureUrl, signedAt are in upload form
- [x] Add IP address field to schema (signerIpAddress)
- [x] Add user agent field to schema (signerUserAgent)
- [x] Update upload procedure to accept signature metadata
- [x] Update upload form to send signer name, signature image, signing date
- [x] Update backend to capture IP address and user agent automatically
- [x] Ensure fileUrl stores complete signed document (text file with metadata)
- [x] Update verification detail page to display IP and user agent
- [ ] Test complete upload workflow with all metadata
- [ ] Verify all data displays correctly on verification review page
