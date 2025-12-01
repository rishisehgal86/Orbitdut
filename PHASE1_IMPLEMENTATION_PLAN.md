# Phase 1 Implementation Plan: Customer User System & Service Request Foundation

**Document Version:** 1.0  
**Created:** December 1, 2025  
**Status:** Ready for Implementation  
**Estimated Duration:** 2 weeks  
**Author:** Manus AI

---

## Executive Summary

This document provides a comprehensive implementation plan for Phase 1 of the Orbidut marketplace development. Phase 1 establishes the foundational customer-facing systems required for the marketplace to function, including customer registration and authentication, service request submission, and the underlying data models to support the complete job lifecycle. This phase transforms Orbidut from a supplier-only platform into a functional two-sided marketplace.

The implementation is divided into four major work streams executed sequentially to respect technical dependencies. The customer user system must be completed first to enable customer authentication and profile management. The service request data model follows, establishing the database schema for jobs, assignments, and status tracking. The service request form provides the customer interface for submitting jobs with real-time pricing. Finally, the customer dashboard delivers a centralized view for managing all service requests and tracking job progress.

Upon completion of Phase 1, customers will be able to register accounts, submit detailed service requests with location and timing specifications, receive real-time price estimates based on supplier rates, and track their requests through a comprehensive dashboard. The system will store all job data in a properly structured database ready for the matching algorithm and supplier assignment features planned for Phase 2.

---

## Current State Analysis

### Existing Infrastructure

The Orbidut platform currently operates as a supplier-focused system with comprehensive rate management and coverage configuration capabilities. The authentication system supports both local password-based authentication and role-based access control through JWT tokens. The database schema includes a **users** table with an `accountType` enum supporting both "customer" and "supplier" values, though customer-specific functionality remains unimplemented.

The supplier portal features a complete rate management system allowing suppliers to configure hourly rates across three service types (L1 EUC Support, L1 Network Support, and Smart Hands) and five response time tiers (4-hour, 24-hour, 48-hour, 72-hour, and 96-hour). Suppliers can define geographic coverage at the country level or specify priority cities for more granular service areas. The system includes response time configuration and service exclusion management, enabling suppliers to opt out of specific service types or response times in particular locations.

The existing **jobs** table in the database schema provides a foundation for service requests but requires enhancement to support the full job lifecycle. Currently, the table includes fields for customer information, service details, location data with coordinates, scheduling information, pricing, and basic status tracking. However, the status workflow is limited to six states and does not adequately represent the matching and assignment phases critical to marketplace operations.

### Technical Stack

The application is built on a modern React 19 frontend with Tailwind CSS 4 for styling and Wouter for client-side routing. The backend uses Express 4 with tRPC 11 for type-safe API communication, eliminating the need for manual REST endpoint definitions. The database is MySQL hosted on Railway with Drizzle ORM providing type-safe database queries and schema management. Authentication is handled through JWT tokens with bcrypt password hashing for local accounts.

The frontend leverages shadcn/ui components for consistent, accessible user interface elements. The Google Maps JavaScript API is integrated for location selection and geocoding, with authentication handled through a Manus proxy service. The application supports both light and dark themes through a context-based theme provider.

### Gaps Requiring Implementation

The platform currently lacks a customer registration flow, requiring implementation of a dedicated customer signup page with appropriate field collection and role assignment. Customer profile management is absent, necessitating a dashboard where customers can view and update their account information. The service request submission interface does not exist, requiring creation of a multi-step form with location selection, service configuration, and real-time pricing calculation.

The database schema requires extension to support job assignments, status history tracking, and the complete matching workflow. The existing jobs table status enum must be expanded to include states for supplier matching, multiple assignment offers, and detailed progress tracking. Foreign key relationships need strengthening to ensure referential integrity across the job lifecycle.

The customer dashboard is entirely absent, requiring implementation of a comprehensive view showing active requests, completed jobs, and draft submissions. Real-time status updates and supplier communication channels need development. Integration with the existing supplier rate and coverage data is required to enable accurate price calculation and supplier matching.

---

## Phase 1 Architecture

### System Components Overview

Phase 1 introduces four major components that work together to enable customer service requests. The **Customer Authentication Module** extends the existing authentication system with customer-specific registration and profile management. The **Service Request Module** provides the interface and business logic for creating and managing job requests. The **Pricing Engine** calculates real-time price estimates by querying supplier rates and coverage data. The **Customer Dashboard Module** delivers a comprehensive view of all customer requests and their current status.

These components integrate with existing supplier systems through shared database tables and tRPC procedures. The pricing engine queries the **supplierRates**, **supplierCoverageCountries**, and **supplierPriorityCities** tables to identify eligible suppliers and retrieve their configured rates. The service request module stores job data in the **jobs** table, which will be consumed by the matching algorithm in Phase 2.

### Data Flow Architecture

When a customer initiates a service request, the flow begins with authentication verification through the existing JWT token system. Upon successful authentication, the customer accesses the service request form, which presents a multi-step wizard interface. The first step captures location information through the Google Maps Places API, automatically geocoding the address to obtain coordinates, timezone, and geographic identifiers.

As the customer selects service type and response time, the pricing engine executes a real-time query against the supplier database. This query identifies all suppliers whose coverage includes the selected location, filters out suppliers who have excluded the requested service or response time, retrieves the configured rates from eligible suppliers, and calculates minimum, maximum, and average pricing. The results are displayed to the customer immediately, providing transparent pricing expectations before submission.

Upon form completion and submission, the system creates a new record in the jobs table with status "draft" or "submitted" depending on customer action. The job record includes all customer-provided information, calculated pricing, and timestamps. The customer is redirected to their dashboard where the new request appears in the appropriate status category. Real-time updates will be implemented through polling or WebSocket connections in future phases.

### Security and Access Control

All customer-facing endpoints require authentication through JWT token validation. The tRPC context middleware extracts the user from the token and verifies the account type matches "customer" before allowing access to customer-specific procedures. Database queries include customer ID filtering to ensure users can only access their own service requests and profile data.

Password security follows industry best practices with bcrypt hashing using a cost factor of 10. Email addresses are validated for proper format and uniqueness before account creation. Rate limiting will be implemented on authentication endpoints to prevent brute force attacks. Session tokens expire after a configurable duration, requiring re-authentication for continued access.

---

## Work Stream 1: Customer User System

### 1.1 Customer Registration

The customer registration flow requires implementation of a dedicated signup page accessible from the homepage navigation. The page design should mirror the existing supplier signup interface for consistency while collecting customer-specific information. Required fields include company name (or individual name for personal accounts), email address, phone number, password with confirmation, and acceptance of terms of service.

The registration form must validate all inputs client-side before submission. Email validation ensures proper format and checks for existing accounts to prevent duplicates. Password strength requirements enforce minimum length of 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character. Phone number validation accepts international formats with country code selection.

Upon form submission, the frontend invokes the `auth.customerSignup` tRPC procedure, passing the validated form data. The backend procedure performs additional validation, hashes the password using bcrypt, creates a new record in the users table with `accountType` set to "customer" and `role` set to "user", generates a JWT token for immediate authentication, and returns the token along with user profile data.

The registration flow concludes with automatic login and redirection to the customer dashboard. A welcome email is sent to the registered address containing account confirmation and getting started information. Error handling provides clear feedback for validation failures, duplicate email addresses, and server errors.

### 1.2 Customer Authentication

Customer login leverages the existing authentication infrastructure with minor modifications to support account type differentiation. The login page provides a unified interface for both customers and suppliers, with the system automatically routing users to the appropriate dashboard based on their account type after successful authentication.

The login form collects email and password, validating format client-side before submission. The `auth.login` tRPC procedure verifies credentials by querying the users table for a matching email, comparing the provided password against the stored bcrypt hash, checking that the account is active and not suspended, generating a new JWT token with user ID and account type claims, and returning the token along with user profile data including account type.

The frontend stores the JWT token in localStorage for persistence across sessions and sets it in the tRPC client headers for authenticated requests. The authentication context provider makes the current user object available throughout the application through a React context. Protected routes check authentication status and account type, redirecting unauthenticated users to the login page and users with incorrect account types to their appropriate dashboard.

Session management includes automatic token refresh before expiration to maintain seamless user experience. Logout functionality clears the stored token and resets the authentication context. The system supports "remember me" functionality through extended token expiration times when explicitly requested during login.

### 1.3 Customer Profile Management

Customer profile management requires implementation of a profile settings page accessible from the customer dashboard navigation. The page is organized into tabbed sections for different categories of information, following the pattern established in the supplier portal.

The **Account Information** tab displays and allows editing of basic profile data including company name, contact email, phone number, and billing address. Changes to email address require verification through a confirmation link sent to the new address before taking effect. Password changes require entry of the current password for security verification.

The **Billing Information** tab collects payment method details for future Stripe integration. During Phase 1, this section displays placeholder content indicating that payment processing will be available in a future release. The data model includes fields for storing Stripe customer IDs and payment method tokens once integration is complete.

The **Notification Preferences** tab allows customers to configure how they receive updates about their service requests. Options include email notifications for status changes, SMS alerts for urgent updates (future feature), and in-app notification badges. Customers can specify quiet hours during which non-urgent notifications are suppressed.

Profile updates invoke the `customer.updateProfile` tRPC procedure, which validates the provided data, updates the corresponding fields in the users table, and returns the updated profile object. The frontend optimistically updates the UI before receiving server confirmation, rolling back changes if the update fails. Success and error messages provide clear feedback about the operation outcome.

---

## Work Stream 2: Service Request Data Model

### 2.1 Database Schema Enhancements

The existing **jobs** table requires several enhancements to support the complete job lifecycle and matching workflow. The current status enum must be expanded to include additional states representing the matching and assignment phases. The enhanced status workflow includes the following states in order:

**draft** represents a service request that the customer has started but not yet submitted. Draft requests are saved automatically as the customer progresses through the multi-step form, allowing them to return and complete submission later. **submitted** indicates the customer has completed and submitted the request, triggering the matching algorithm to identify eligible suppliers. **matching** represents the active matching process where the system is querying supplier coverage and rates to identify candidates.

**matched** indicates that eligible suppliers have been identified and job assignment records have been created. **offered** means assignment offers have been sent to one or more suppliers awaiting their acceptance or rejection. **assigned** indicates a supplier has accepted the job and is now responsible for fulfillment. **in_progress** represents active work with substates including en_route, on_site, and working.

**completed** means the supplier has marked the work as finished and submitted completion documentation. **invoiced** indicates an invoice has been generated and sent to the customer for payment. **paid** represents successful payment processing and fund transfer. **cancelled** indicates the job was cancelled by the customer or system before completion. **disputed** represents a situation where either party has flagged an issue requiring administrator review and resolution.

The jobs table schema must be modified to add several new fields supporting this enhanced workflow. A **responseTimeHours** field stores the customer's requested response time as an integer (4, 24, 48, 72, or 96) for precise matching against supplier capabilities. A **timezone** field captures the timezone of the service location for accurate scheduling. A **urgencyLevel** enum field distinguishes between routine, urgent, and emergency requests, influencing assignment priority and notification urgency.

Additional fields include **estimatedBudget** for storing the customer's budget expectations, **actualCost** for recording the final invoiced amount, **completionNotes** for supplier-provided documentation of work performed, and **customerFeedback** for post-completion comments before formal review submission. Timestamp fields are added for **matchedAt**, **offeredAt**, and **invoicedAt** to track progression through the workflow.

### 2.2 Job Assignments Table

A new **jobAssignments** table must be created to support the matching algorithm's ability to offer jobs to multiple suppliers simultaneously or sequentially. This table creates a many-to-one relationship between suppliers and jobs, allowing the system to track which suppliers have been offered each job and their responses.

The table schema includes an auto-incrementing **id** primary key, **jobId** foreign key referencing the jobs table with CASCADE DELETE, **supplierId** foreign key referencing the suppliers table with SET NULL to preserve history if supplier accounts are deleted, **offeredAt** timestamp recording when the assignment was created, **expiresAt** timestamp indicating when the offer becomes invalid if not accepted, **respondedAt** timestamp capturing when the supplier accepted or declined, **status** enum with values (pending, accepted, declined, expired, cancelled), and **offeredPrice** storing the rate offered to this specific supplier based on their configured pricing.

The assignment workflow begins when the matching algorithm identifies eligible suppliers and creates assignment records with status "pending". Suppliers receive notifications of new job opportunities and can view assignment details through their dashboard. When a supplier accepts an assignment, the status changes to "accepted", the respondedAt timestamp is set, and the corresponding job record is updated with assignedSupplierId and status "assigned". If a supplier declines, the status changes to "declined" and the system may offer the job to the next ranked supplier depending on the configured assignment strategy.

Assignments that are not responded to before the expiresAt timestamp automatically transition to "expired" status through a background job that runs periodically. This ensures jobs are not left in limbo waiting for supplier responses indefinitely. The expiration duration is configurable based on job urgency, with emergency requests expiring after 1 hour, urgent requests after 4 hours, and routine requests after 24 hours.

### 2.3 Job Status History Table

A new **jobStatusHistory** table provides a complete audit trail of all status changes throughout the job lifecycle. This history is essential for dispute resolution, performance analytics, and customer transparency about job progress.

The table schema includes an auto-incrementing **id** primary key, **jobId** foreign key referencing the jobs table with CASCADE DELETE, **fromStatus** enum matching the jobs status enum, **toStatus** enum matching the jobs status enum, **changedBy** foreign key referencing the users table with SET NULL, **changedAt** timestamp defaulting to the current time, **notes** text field for optional explanatory comments, and **metadata** JSON field for storing additional context about the status change.

Every status transition in the jobs table triggers creation of a corresponding history record. The application code uses database triggers or application-level hooks to ensure history records are never missed. The changedBy field identifies whether the status change was initiated by the customer, supplier, or system automation, providing accountability and context.

The customer dashboard displays the status history as a visual timeline, showing each transition with timestamp, responsible party, and any associated notes. This transparency builds trust by allowing customers to see exactly when their request progressed through each stage and who was responsible for each action.

### 2.4 Database Indexes and Performance

To ensure the service request system performs efficiently at scale, several database indexes must be created on frequently queried fields. The jobs table requires a composite index on **(customerId, status)** for dashboard queries filtering by customer and status. A composite index on **(status, createdAt)** supports admin views showing all jobs in a particular status ordered by creation time.

The jobAssignments table needs a composite index on **(supplierId, status)** for supplier dashboard queries showing pending and active assignments. A composite index on **(jobId, status)** supports queries retrieving all assignments for a specific job. An index on **expiresAt** enables efficient queries by the background job that processes expired assignments.

The jobStatusHistory table requires an index on **jobId** for retrieving the complete history of a specific job. A composite index on **(jobId, changedAt)** supports queries retrieving history ordered chronologically. These indexes significantly improve query performance, especially as the number of jobs grows into the thousands.

---

## Work Stream 3: Service Request Form

### 3.1 Multi-Step Form Architecture

The service request form is implemented as a multi-step wizard to reduce cognitive load and improve completion rates. Research shows that breaking long forms into logical steps increases conversion by 20-30% compared to single-page forms. The wizard consists of four steps: Location & Service, Timing & Response, Job Details, and Review & Submit.

The form state is managed through React context, allowing each step component to read and update the overall form data without prop drilling. The context provider maintains the current step index, form data object, validation errors object, and functions for navigating between steps and updating field values. Form data is persisted to localStorage after each step completion, enabling customers to close the browser and return later without losing progress.

Navigation between steps is controlled through "Next" and "Back" buttons at the bottom of each step. The "Next" button is disabled until all required fields in the current step are valid. Step indicators at the top of the form show progress and allow direct navigation to previously completed steps. The current step is highlighted, completed steps show checkmarks, and future steps are grayed out.

Client-side validation occurs on blur for individual fields and on submit for the entire step. Validation errors are displayed inline below each field with clear, actionable messages. The form prevents progression to the next step until all validation errors are resolved. Server-side validation occurs on final submission, with any errors displayed at the top of the form and the user returned to the relevant step for correction.

### 3.2 Step 1: Location & Service Selection

The first step collects the service location and basic service requirements. The location input uses the Google Maps Places Autocomplete API integrated through the existing Maps component. As the customer types an address, the autocomplete dropdown suggests matching locations. Selecting a suggestion automatically populates the address fields and captures coordinates, timezone, and geographic identifiers.

The location fields include street address, city, state/province, country, and postal code. These fields are auto-populated from the Places API response but remain editable to allow manual corrections. The system stores both the formatted address string and the individual components for flexible querying and display. Latitude and longitude coordinates are captured for precise location matching against supplier coverage areas.

Service type selection presents three radio button options with descriptive labels and icons: **L1 EUC Support** for end-user computing issues including desktop, laptop, and peripheral troubleshooting; **L1 Network Support** for basic network connectivity issues, switch port activation, and cable testing; and **Smart Hands** for physical tasks like equipment installation, cable management, and hardware replacement. Each option includes a "Learn More" link that opens a modal with detailed service descriptions and example scenarios.

Response time selection presents five radio button options corresponding to the supplier rate tiers: **4-hour emergency response** for critical issues requiring immediate attention, **24-hour urgent response** for high-priority issues that impact business operations, **48-hour standard response** for routine issues with moderate impact, **72-hour scheduled response** for planned maintenance or non-urgent work, and **96-hour flexible response** for low-priority tasks with minimal time constraints. Each option displays a brief description of appropriate use cases.

As the customer selects service type and response time, the form makes a real-time API call to the pricing engine to retrieve estimated costs. The pricing display shows minimum, maximum, and average rates from eligible suppliers, along with the number of suppliers who can fulfill the request. If no suppliers service the selected location or offer the chosen service/response combination, a clear message indicates unavailability and suggests alternatives.

### 3.3 Step 2: Timing & Scheduling

The second step collects scheduling information and timing preferences. A date-time picker allows the customer to specify their preferred start time for the service. The picker displays times in the local timezone of the service location (captured in Step 1) to avoid confusion. The system validates that the selected time is in the future and respects the chosen response time (e.g., a 4-hour emergency request cannot be scheduled more than 4 hours in advance).

An estimated duration input allows the customer to specify how long they expect the work to take. The input accepts values between 2 and 16 hours in 30-minute increments, as these are the duration limits configured in the existing system. The duration affects pricing calculation, as longer jobs may incur higher costs or require special arrangements.

An "out of hours" checkbox allows customers to indicate if the work should be performed outside normal business hours (evenings, weekends, or holidays). This flag may affect pricing and supplier availability, as some suppliers charge premium rates for out-of-hours work. The form displays a warning if out-of-hours work is selected, explaining potential cost implications.

A budget range input allows customers to specify their expected budget for the work. This is an optional field that helps the system prioritize supplier matches and provides suppliers with context about customer expectations. The input uses a slider with minimum and maximum values based on the pricing estimates from Step 1, allowing customers to indicate if they expect costs at the low end, high end, or middle of the range.

### 3.4 Step 3: Job Details

The third step collects detailed information about the specific work to be performed. A large text area labeled "Job Description" allows customers to explain the issue or requirements in detail. Placeholder text provides guidance on what information to include, such as symptoms, error messages, affected systems, and any troubleshooting already attempted. The text area supports up to 5000 characters to accommodate detailed descriptions.

A file upload component allows customers to attach relevant documents, photos, or diagrams. Supported file types include images (JPG, PNG, GIF), documents (PDF, DOC, DOCX), and text files (TXT, CSV). Maximum file size is 10MB per file with up to 5 files per request. Uploaded files are stored in S3 using the existing storage infrastructure, with file metadata stored in a new **jobAttachments** table linking to the jobs table.

A contact information section displays the customer's profile email and phone number with options to override for this specific request. This allows customers to specify an on-site contact person different from their account owner. The fields default to the profile values but can be edited for this request only without updating the profile.

Special instructions text area allows customers to provide additional context such as building access procedures, parking information, security requirements, or specific tools needed. This information helps suppliers prepare appropriately and reduces on-site delays. The field is optional but recommended for complex or restricted locations.

### 3.5 Step 4: Review & Submit

The final step displays a comprehensive summary of all information entered in previous steps. The layout presents each section (Location, Service, Timing, Details) in clearly labeled cards with the ability to click "Edit" to return to the relevant step for changes. All edits preserve other form data and return the customer to the review step after saving changes.

The pricing summary displays the estimated cost range from eligible suppliers, the number of suppliers who can fulfill the request, and an explanation of how the estimate was calculated. A disclaimer notes that final pricing may vary based on actual work performed and supplier selection. The estimated total includes any applicable taxes or platform fees (though these are not yet implemented in Phase 1).

Terms of service and cancellation policy are displayed with a required checkbox for acceptance. The terms include information about payment processing, supplier selection, cancellation deadlines, and dispute resolution. A link opens the full terms in a modal for detailed review.

Two action buttons are provided: "Save as Draft" and "Submit Request". Saving as draft stores the form data in the jobs table with status "draft" and redirects to the customer dashboard where the draft can be resumed later. Submitting the request changes the status to "submitted", triggers the matching algorithm (in Phase 2), and redirects to the dashboard with a success message confirming submission.

---

## Work Stream 4: Customer Dashboard

### 4.1 Dashboard Layout and Navigation

The customer dashboard serves as the central hub for all customer interactions with the platform. The layout follows the established pattern from the supplier portal, using a left sidebar navigation for consistency across the application. The sidebar includes navigation links for Dashboard (home view), My Requests (all service requests), Submit Request (new request form), Profile Settings, and Billing (placeholder for future Stripe integration).

The main content area displays a welcome header with the customer's name and a quick action button to submit a new request. Below the header, a metrics summary section presents key statistics in card format: Total Requests showing the count of all submitted requests, Active Jobs displaying the number of requests currently in progress, Completed Jobs showing finished work, and Total Spent displaying cumulative spending (placeholder until payment integration is complete).

The primary content section uses a tabbed interface to organize requests by status category. Tabs include Active (submitted, matched, offered, assigned, in_progress), Completed (completed, invoiced, paid), Drafts (draft status), and Cancelled (cancelled or disputed status). Each tab displays a list of request cards with relevant information and action buttons appropriate to the status.

The dashboard implements responsive design with the sidebar collapsing to a hamburger menu on mobile devices. The metrics cards stack vertically on small screens, and the request cards adapt to single-column layout. Touch-friendly button sizes and spacing ensure usability on mobile devices.

### 4.2 Request List and Card Design

Each request card displays essential information in a compact, scannable format. The card header shows the service type icon and name, request ID for reference, and submission date. The card body displays the service location (city and country), requested response time, current status with color-coded badge, and assigned supplier name (if applicable) with their rating.

Status badges use consistent color coding across the application: blue for submitted and matching, yellow for matched and offered, green for assigned and in_progress, gray for completed and paid, and red for cancelled and disputed. The badge text uses clear, customer-friendly language rather than technical status names.

Action buttons appear at the bottom of each card, varying based on the current status. Draft requests show "Continue Editing" and "Delete Draft" buttons. Submitted requests show "View Details" and "Cancel Request" buttons. Assigned requests show "View Details", "Contact Supplier", and "Track Progress" buttons. Completed requests show "View Invoice", "Leave Review", and "Request Again" buttons.

The request list supports sorting by date (newest/oldest first), status, and service type. A search bar allows filtering by location, request ID, or supplier name. Pagination displays 20 requests per page with infinite scroll as an alternative loading pattern. Empty states provide helpful messages and call-to-action buttons when no requests match the current filter.

### 4.3 Request Detail View

Clicking any request card navigates to a detailed view showing complete information about the service request. The detail view is organized into sections with clear headings and visual separation. The header displays the request ID, service type, current status, and submission date prominently.

The **Request Information** section shows all details from the original submission including service location with map visualization, service type and response time, scheduled start time and duration, job description, and attached files with download links. An "Edit Request" button allows modifications if the request is still in draft or submitted status (before supplier assignment).

The **Status Timeline** section displays a visual timeline of all status changes from the jobStatusHistory table. Each timeline entry shows the status name, timestamp, responsible party (customer, supplier, or system), and any associated notes. The timeline uses vertical layout with connecting lines between entries, with the most recent status at the top. Color coding matches the status badge colors for visual consistency.

The **Supplier Information** section appears once a supplier is assigned. It displays the supplier company name, contact information, rating and review summary, and a "Contact Supplier" button that opens a messaging interface (placeholder in Phase 1, to be implemented in Phase 3). The section includes the offered price and any supplier-specific notes about the assignment.

The **Pricing and Payment** section shows the estimated price range from the original submission, the final offered price from the assigned supplier (if applicable), and invoice details once the job is invoiced. Payment status and transaction details appear after payment processing (to be implemented in Phase 5). A "Download Invoice" button generates a PDF invoice (placeholder in Phase 1).

Action buttons at the bottom of the detail view vary by status. Submitted requests show "Cancel Request" and "Modify Request" buttons. Assigned requests show "Contact Supplier" and "Cancel Request" (with cancellation fee warning). Completed requests show "Approve Completion", "Report Issue", and "Leave Review" buttons. The button layout adapts to mobile screens with stacked layout and full-width buttons.

### 4.4 Real-Time Updates

The dashboard implements polling-based real-time updates to display status changes without requiring manual page refresh. Every 30 seconds, the dashboard makes an API call to check for updates to the customer's requests. If any status changes are detected, the UI updates automatically with a subtle animation drawing attention to the changed request card.

When a significant status change occurs (supplier assigned, work started, work completed), a toast notification appears in the top-right corner of the screen. The notification displays a brief message about the change and includes a "View Details" link that navigates to the request detail page. Notifications auto-dismiss after 5 seconds but can be manually dismissed by clicking the close button.

The polling interval is configurable and may be adjusted based on server load and user activity. Active users viewing the dashboard poll more frequently (every 30 seconds), while inactive users (dashboard in background tab) poll less frequently (every 2 minutes) to reduce server load. The polling pauses entirely when the browser tab is not visible, resuming when the user returns.

Future phases will replace polling with WebSocket connections for true real-time updates with lower latency and reduced server load. The current polling implementation provides acceptable user experience while maintaining simplicity during Phase 1 development.

---

## Implementation Sequence

### Week 1: Foundation and Data Models

The first week focuses on establishing the foundational systems and data structures required for all subsequent work. Day 1 begins with customer registration implementation, including the signup page UI, form validation logic, backend tRPC procedure for account creation, and email confirmation workflow. Day 2 implements customer authentication, extending the existing login flow to support customer accounts and implementing the authentication context provider for customer routes.

Day 3 focuses on customer profile management, creating the profile settings page with tabbed interface, implementing update procedures for each profile section, and adding client-side validation for profile changes. Day 4 implements the database schema enhancements, adding new fields to the jobs table, creating the jobAssignments table, creating the jobStatusHistory table, and adding all necessary indexes for performance.

Day 5 is dedicated to testing and refinement of the customer user system and database changes. This includes writing unit tests for authentication procedures, testing database migrations on development and staging environments, verifying foreign key constraints and cascade behaviors, and conducting security testing of authentication flows. Any issues discovered during testing are addressed before proceeding to Week 2.

### Week 2: Service Request Interface

The second week implements the customer-facing service request interface and dashboard. Day 6 begins work on the service request form, implementing the multi-step wizard framework, creating the form context provider, implementing Step 1 (Location & Service), and integrating the Google Maps Places API for location selection.

Day 7 continues form development with Step 2 (Timing & Scheduling) and Step 3 (Job Details). This includes implementing the date-time picker with timezone support, creating the file upload component with S3 integration, and adding validation logic for all form fields. Day 8 completes the form with Step 4 (Review & Submit) and implements the pricing engine for real-time cost estimation.

Day 9 focuses on the customer dashboard, implementing the dashboard layout and navigation, creating the request list with filtering and sorting, implementing request cards with status-specific actions, and adding the metrics summary section. Day 10 implements the request detail view, including the status timeline visualization, supplier information display, and pricing/payment section.

Days 11-12 are dedicated to integration testing, bug fixes, and polish. This includes end-to-end testing of the complete customer flow from registration through request submission, testing the dashboard with various request statuses and edge cases, conducting cross-browser and mobile device testing, implementing accessibility improvements based on testing feedback, and preparing documentation for Phase 2 development.

---

## Technical Specifications

### API Endpoints (tRPC Procedures)

The following tRPC procedures must be implemented to support Phase 1 functionality:

**Authentication Procedures** (`auth` router):
- `auth.customerSignup`: Creates a new customer account with email, password, and profile information. Returns JWT token and user object.
- `auth.login`: Authenticates user with email and password. Returns JWT token and user object including account type.
- `auth.logout`: Invalidates the current session token.
- `auth.me`: Returns the current authenticated user's profile information.

**Customer Profile Procedures** (`customer` router):
- `customer.getProfile`: Retrieves the authenticated customer's complete profile.
- `customer.updateProfile`: Updates customer profile fields. Accepts partial profile object.
- `customer.updatePassword`: Changes customer password. Requires current password for verification.
- `customer.updateNotificationPreferences`: Updates notification settings for the customer.

**Service Request Procedures** (`serviceRequest` router):
- `serviceRequest.create`: Creates a new service request with status "draft" or "submitted".
- `serviceRequest.update`: Updates an existing service request. Only allowed for draft or submitted status.
- `serviceRequest.delete`: Deletes a draft service request.
- `serviceRequest.getById`: Retrieves a single service request by ID with full details.
- `serviceRequest.listByCustomer`: Returns paginated list of service requests for the authenticated customer with filtering and sorting.
- `serviceRequest.getStatusHistory`: Returns the complete status history for a service request.
- `serviceRequest.cancel`: Cancels a service request. Behavior varies by current status.

**Pricing Procedures** (`pricing` router):
- `pricing.calculateEstimate`: Calculates price estimate for a given location, service type, and response time. Returns min, max, average, and supplier count.
- `pricing.getEligibleSuppliers`: Returns list of suppliers who can fulfill a request based on coverage and rates.

### Database Schema Changes

The following database schema modifications must be implemented:

**jobs table modifications**:
```sql
ALTER TABLE jobs 
ADD COLUMN responseTimeHours INT NOT NULL,
ADD COLUMN timezone VARCHAR(50),
ADD COLUMN urgencyLevel ENUM('routine', 'urgent', 'emergency') DEFAULT 'routine',
ADD COLUMN estimatedBudget INT,
ADD COLUMN actualCost INT,
ADD COLUMN completionNotes TEXT,
ADD COLUMN customerFeedback TEXT,
ADD COLUMN matchedAt TIMESTAMP,
ADD COLUMN offeredAt TIMESTAMP,
ADD COLUMN invoicedAt TIMESTAMP;

ALTER TABLE jobs 
MODIFY COLUMN status ENUM(
  'draft', 'submitted', 'matching', 'matched', 'offered', 
  'assigned', 'in_progress', 'completed', 'invoiced', 
  'paid', 'cancelled', 'disputed'
) DEFAULT 'draft' NOT NULL;
```

**jobAssignments table creation**:
```sql
CREATE TABLE jobAssignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jobId INT NOT NULL,
  supplierId INT,
  offeredAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL,
  respondedAt TIMESTAMP,
  status ENUM('pending', 'accepted', 'declined', 'expired', 'cancelled') DEFAULT 'pending' NOT NULL,
  offeredPrice INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX jobAssignments_jobId_idx (jobId),
  INDEX jobAssignments_supplierId_status_idx (supplierId, status),
  INDEX jobAssignments_expiresAt_idx (expiresAt)
);
```

**jobStatusHistory table creation**:
```sql
CREATE TABLE jobStatusHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jobId INT NOT NULL,
  fromStatus VARCHAR(50),
  toStatus VARCHAR(50) NOT NULL,
  changedBy INT,
  changedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  metadata JSON,
  FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (changedBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX jobStatusHistory_jobId_idx (jobId),
  INDEX jobStatusHistory_jobId_changedAt_idx (jobId, changedAt)
);
```

### Frontend Component Structure

The following React components must be implemented:

**Authentication Components**:
- `CustomerSignup.tsx`: Customer registration form with validation
- `LoginPage.tsx`: Unified login page for customers and suppliers (extends existing)
- `ProtectedRoute.tsx`: Route wrapper that checks authentication and account type

**Customer Dashboard Components**:
- `CustomerDashboard.tsx`: Main dashboard layout with sidebar navigation
- `DashboardHome.tsx`: Dashboard home view with metrics and request tabs
- `RequestList.tsx`: List of request cards with filtering and sorting
- `RequestCard.tsx`: Individual request card component
- `RequestDetail.tsx`: Detailed view of a single request
- `StatusTimeline.tsx`: Visual timeline of status changes

**Service Request Components**:
- `ServiceRequestForm.tsx`: Multi-step wizard container
- `FormContext.tsx`: React context for form state management
- `Step1LocationService.tsx`: Location and service selection step
- `Step2Timing.tsx`: Scheduling and timing step
- `Step3Details.tsx`: Job details and attachments step
- `Step4Review.tsx`: Review and submit step
- `LocationPicker.tsx`: Google Maps Places autocomplete integration
- `FileUpload.tsx`: File upload component with S3 integration
- `PricingDisplay.tsx`: Real-time pricing estimate display

**Profile Components**:
- `CustomerProfile.tsx`: Profile settings page with tabs
- `AccountInfoTab.tsx`: Account information editing
- `BillingInfoTab.tsx`: Billing information (placeholder)
- `NotificationPreferencesTab.tsx`: Notification settings

---

## Testing Strategy

### Unit Testing

Unit tests must be written for all tRPC procedures using Vitest, the testing framework already configured in the project. Each procedure requires tests covering successful execution with valid inputs, validation errors with invalid inputs, authentication failures with missing or invalid tokens, authorization failures with incorrect account types, and database constraint violations.

Authentication procedures require specific test cases for password hashing verification, duplicate email handling, token generation and validation, and session expiration handling. Service request procedures need tests for status transition validation, foreign key constraint handling, and permission checks ensuring customers can only access their own requests.

The pricing calculation engine requires tests with various location and service combinations, including scenarios with no eligible suppliers, single supplier, multiple suppliers with different rates, and suppliers with service exclusions. Edge cases such as locations with no coverage and invalid service type combinations must be tested.

### Integration Testing

Integration tests verify the complete flow from frontend form submission through backend processing and database storage. The customer registration flow requires testing from signup form submission through account creation, automatic login, and redirection to dashboard. The service request submission flow needs testing from form initialization through all four steps, pricing calculation, and final submission with database record creation.

Dashboard functionality requires integration testing of request list loading with various filters, request detail view with status history, and real-time update polling. File upload integration must be tested end-to-end from frontend file selection through S3 upload and metadata storage in the database.

### End-to-End Testing

End-to-end tests simulate complete user journeys using Playwright or Cypress. The primary customer journey test covers registration, login, profile update, service request submission, dashboard viewing, and request detail viewing. This test verifies the complete happy path through the system.

Error handling tests simulate various failure scenarios including network errors during form submission, validation errors at each form step, authentication failures during protected route access, and database errors during data persistence. These tests ensure graceful degradation and clear error messaging.

Cross-browser testing must be conducted on Chrome, Firefox, Safari, and Edge to ensure consistent functionality and appearance. Mobile device testing on iOS and Android devices verifies responsive design and touch interaction handling. Accessibility testing with screen readers and keyboard-only navigation ensures compliance with WCAG 2.1 AA standards.

---

## Success Criteria

Phase 1 will be considered complete when the following criteria are met:

**Customer User System**: Customers can successfully register new accounts through the dedicated signup page. The registration process validates all inputs, creates user records with correct account type and role, and automatically logs in the new user. Customers can log in with email and password, receiving a JWT token that grants access to customer-specific features. The profile management page allows customers to view and update their account information, with changes persisting correctly to the database.

**Service Request Submission**: Customers can access the service request form and progress through all four steps without errors. The location picker successfully integrates with Google Maps Places API and captures accurate coordinates and timezone information. Service type and response time selection triggers real-time pricing calculation, displaying accurate estimates based on supplier rates. The form validates all required fields and prevents submission with invalid data. Completed requests are stored in the database with correct status and all associated data.

**Pricing Engine**: The pricing calculation accurately identifies eligible suppliers based on geographic coverage and service availability. Suppliers with service exclusions or missing rates are correctly filtered out. The calculation returns minimum, maximum, and average rates along with supplier count. Pricing updates in real-time as customers change service parameters. Locations with no coverage display appropriate messaging and suggestions.

**Customer Dashboard**: The dashboard displays all customer requests organized by status category. Metrics cards show accurate counts and totals. Request cards display correct information with appropriate action buttons for each status. The request detail view shows complete information including status timeline, supplier details (when assigned), and pricing information. Real-time updates through polling display status changes without manual refresh. The dashboard is fully responsive and functional on mobile devices.

**Data Integrity**: All database tables have appropriate foreign key constraints with correct cascade behaviors. Status transitions follow the defined workflow and are recorded in the status history table. Customer data is properly isolated, with users only able to access their own requests. Database queries use indexes effectively, with no performance degradation as request count increases.

**Code Quality**: All code follows the established project conventions and style guide. TypeScript types are properly defined with no `any` types in production code. tRPC procedures have proper input validation using Zod schemas. React components follow best practices with appropriate use of hooks and context. No console errors or warnings appear during normal operation.

---

## Risk Assessment and Mitigation

### Technical Risks

**Risk**: Google Maps API integration may encounter rate limiting or authentication issues.  
**Mitigation**: Implement proper error handling with fallback to manual address entry. Monitor API usage and implement caching for frequently accessed locations. Test thoroughly with the Manus proxy authentication system.

**Risk**: Real-time pricing calculation may be slow with large numbers of suppliers.  
**Mitigation**: Implement database query optimization with proper indexes. Consider caching supplier coverage data for frequently requested locations. Add loading indicators to set user expectations during calculation.

**Risk**: File uploads to S3 may fail due to network issues or size limits.  
**Mitigation**: Implement chunked upload for large files. Add retry logic for failed uploads. Validate file size and type on both client and server. Provide clear error messages and upload progress indicators.

**Risk**: Database schema changes may cause data migration issues.  
**Mitigation**: Test migrations thoroughly on development and staging environments before production deployment. Create backup of production database before migration. Implement rollback procedures in case of migration failure.

### User Experience Risks

**Risk**: Multi-step form may have high abandonment rates.  
**Mitigation**: Implement auto-save to localStorage at each step. Allow users to save drafts and return later. Minimize required fields and provide clear progress indicators. Test form flow with real users and iterate based on feedback.

**Risk**: Pricing estimates may not match final costs, leading to customer dissatisfaction.  
**Mitigation**: Display clear disclaimers that estimates are not final quotes. Explain how pricing is calculated and what factors may affect final cost. Allow suppliers to adjust pricing during assignment acceptance.

**Risk**: Dashboard may be overwhelming with many requests.  
**Mitigation**: Implement effective filtering and sorting options. Use pagination or infinite scroll to limit initial load. Provide clear visual hierarchy and status indicators. Add search functionality for quick access to specific requests.

### Business Risks

**Risk**: Customers may submit requests for locations with no supplier coverage.  
**Mitigation**: Display coverage availability before allowing submission. Offer to notify customers when coverage becomes available in their area. Provide suggestions for alternative locations or service types.

**Risk**: Real-time pricing may reveal competitive information between suppliers.  
**Mitigation**: Display price ranges rather than specific supplier rates. Aggregate data to prevent identification of individual suppliers. Consider implementing blind bidding in future phases.

---

## Dependencies and Prerequisites

### External Services

**Google Maps JavaScript API**: Required for location selection, geocoding, and timezone detection. The Manus proxy authentication system must be properly configured and tested. API key quotas must be sufficient for expected usage volume.

**S3-Compatible Storage**: Required for file attachments. The existing storage infrastructure using `storagePut` and `storageGet` helpers must be functional. Bucket permissions must allow public read access for uploaded files.

**Email Service**: Required for account confirmation and notifications. The existing email infrastructure must be configured and tested. Email templates must be created for customer-specific notifications.

### Internal Systems

**Authentication System**: The existing JWT-based authentication must be fully functional. Token generation, validation, and refresh logic must work correctly. The authentication context provider must support customer account types.

**Supplier Rate System**: The supplier rate management system must be complete with accurate data. Coverage configuration must be properly set up for all active suppliers. The rate calculation queries must be optimized for performance.

**Database Infrastructure**: MySQL database must be properly configured with sufficient capacity. Backup and recovery procedures must be in place. Database migrations must be tested and ready for deployment.

---

## Post-Phase 1 Roadmap

Upon completion of Phase 1, the platform will have a functional customer interface for submitting service requests, but the requests will not yet be automatically matched with suppliers or assigned for fulfillment. Phase 2 will implement the matching algorithm and job distribution system, creating the connection between customer requests and supplier fulfillment.

**Phase 2: Job Distribution Engine** will implement the supplier matching algorithm that identifies eligible suppliers based on coverage and rates, ranks suppliers using multiple factors including completion percentage and acceptance rate, creates job assignments with appropriate expiration times, and implements the notification system to alert suppliers of new opportunities. This phase transforms submitted requests into actionable assignments.

**Phase 3: Supplier Job Management** will build the supplier-facing interface for viewing and accepting job assignments, tracking job progress through status updates, communicating with customers about job details, and marking jobs as complete with documentation. This phase enables suppliers to fulfill customer requests.

**Phase 4: Payment Processing** will integrate Stripe for customer payments and supplier payouts, implement automatic invoice generation, handle payment authorization and capture, and manage supplier payout schedules. This phase completes the financial transaction flow.

**Phase 5: Quality and Trust** will implement the customer review and rating system, build dispute resolution workflows, add verification badges for suppliers, and create performance analytics dashboards. This phase builds trust and accountability in the marketplace.

Each subsequent phase builds upon the foundation established in Phase 1, progressively adding functionality until the marketplace is fully operational with automated matching, payment processing, and quality management.

---

## Conclusion

Phase 1 establishes the essential foundation for the Orbidut marketplace by implementing the customer user system and service request infrastructure. Upon completion, customers will be able to register accounts, submit detailed service requests with location and timing specifications, receive real-time pricing estimates, and track their requests through a comprehensive dashboard. The underlying data models will support the complete job lifecycle, ready for the matching algorithm and supplier assignment features in Phase 2.

The implementation follows a logical sequence over two weeks, beginning with foundational authentication and data models before building the customer-facing interfaces. The multi-step service request form provides an intuitive experience for capturing all necessary job details while maintaining high completion rates. The customer dashboard delivers transparency and control through real-time status updates and detailed request information.

Success in Phase 1 depends on careful attention to data integrity, user experience, and integration with existing supplier systems. The comprehensive testing strategy ensures all functionality works correctly across browsers and devices. Risk mitigation strategies address potential technical and business challenges. Clear success criteria provide objective measures for phase completion.

With Phase 1 complete, the Orbidut platform will transition from a supplier-only system to a functional two-sided marketplace, ready for the matching algorithm and job distribution features that will connect customer requests with supplier fulfillment in Phase 2.
