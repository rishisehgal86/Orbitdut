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
