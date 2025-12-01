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
- [ ] Create site visit report form component
- [ ] Add digital signature capture (react-signature-canvas)
- [ ] Add photo upload functionality (multiple images)
- [ ] Build tRPC procedure to save site visit report
- [ ] Generate PDF report with signature and photos
- [ ] Email report to customer and supplier

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
