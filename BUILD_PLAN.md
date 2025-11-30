# Orbidut Marketplace - Build Plan

**Document Version:** 1.0  
**Last Updated:** November 30, 2025  
**Status:** Rate Management System Complete - Ready for Phase 1

---

## Executive Summary

This document outlines the complete implementation plan for building the Orbidut marketplace platform. The plan is organized into 9 sequential phases spanning approximately 12 weeks, with each phase building upon the previous one to create a fully functional marketplace connecting customers with service suppliers.

**Current Status:** The supplier rate management system is complete, including geographic coverage, service availability, response time configuration, and comprehensive rate management tools. The platform is now ready to implement the customer-facing job request system.

**MVP Milestone:** Week 6 - End-to-end job flow (request → assignment → completion)  
**Full Launch:** Week 9 - Automated payment processing integrated

---

## Phase 1: Foundation (Weeks 1-2)

The foundation phase establishes the core data models and user systems required for all subsequent features. Without these components, no job requests or assignments can occur.

### 1.1 Customer User System

**Objective:** Enable customers to register, authenticate, and manage their profiles on the platform.

**Current State:** The application currently supports supplier and admin roles. Customer role exists in the schema but lacks full implementation.

**Implementation Tasks:**

The customer registration flow must be implemented with a dedicated signup page similar to the existing supplier signup. This includes creating a customer-specific signup form that collects essential information such as company name, contact details, and billing information. The authentication system already supports role-based access through JWT tokens, so the primary work involves creating the customer-specific UI components and ensuring proper role assignment during registration.

Customer profile management requires a dedicated dashboard where customers can view and update their account information, manage billing details, and configure notification preferences. This profile system should mirror the supplier profile structure but focus on customer-specific needs such as service history and preferred locations.

**Dependencies:** None - this is the starting point.

**Deliverable:** Customers can register, log in, and manage their profiles.

---

### 1.2 Service Request Data Model

**Objective:** Create the database schema to support the complete job lifecycle from request to completion.

**Database Tables Required:**

The **serviceRequests** table serves as the primary record for all customer job requests. Each request captures the customer identifier, service location (using the same geographic data structure as supplier coverage), requested service type (L1_EUC, L1_NETWORK, or SMART_HANDS), response time requirement (4h, 24h, 48h, 72h, or 96h), detailed job description, urgency level, estimated budget, and timestamps for creation and updates. The request status field tracks the job through its complete lifecycle.

The **jobAssignments** table creates the link between service requests and suppliers. When the matching algorithm identifies eligible suppliers, assignment records are created with a pending status. This table tracks which suppliers have been offered the job, their acceptance or rejection decisions, and timestamps for all status changes. Only one assignment per request can be in an accepted or active state at any time.

The **jobStatusHistory** table maintains a complete audit trail of all status changes throughout the job lifecycle. Each status transition is recorded with the timestamp, the user who triggered the change, and optional notes explaining the transition. This history is essential for dispute resolution and performance analytics.

**Job Status Workflow:**

The job lifecycle follows a defined state machine with the following transitions:

- **draft:** Customer is composing the request but has not submitted
- **submitted:** Customer has submitted the request; system is matching suppliers
- **matched:** System has identified eligible suppliers and created assignments
- **assigned:** A supplier has accepted the job
- **in_progress:** Supplier has started work on the job
- **completed:** Supplier has marked the job as finished
- **invoiced:** Invoice has been generated and sent to customer
- **paid:** Customer has paid the invoice
- **cancelled:** Job was cancelled before completion
- **disputed:** Customer or supplier has flagged an issue requiring admin review

**Foreign Key Relationships:**

All tables must include proper foreign key constraints with appropriate cascade behaviors. Service requests link to the customers table with CASCADE DELETE (if a customer account is deleted, their requests are removed). Job assignments link to both service requests and suppliers, with CASCADE DELETE for requests and SET NULL for suppliers (preserving assignment history even if supplier account is removed). Job status history links to service requests with CASCADE DELETE to maintain referential integrity.

**Indexes for Performance:**

Critical indexes must be created on frequently queried fields including customer_id, supplier_id, status, service_type, and created_at timestamps. Composite indexes should be added for common query patterns such as (status, created_at) for dashboard views and (supplier_id, status) for supplier job lists.

**Dependencies:** Customer User System (1.1) must be complete.

**Deliverable:** Database schema supports the complete job lifecycle with proper constraints and indexes.

---

## Phase 2: Customer Experience (Weeks 3-4)

This phase creates the customer-facing interface for requesting services and tracking job progress. The customer experience is the primary driver of marketplace activity.

### 2.1 Service Request Form

**Objective:** Enable customers to submit service requests with all necessary details for supplier matching and pricing.

**Form Structure:**

The service request form should be implemented as a multi-step wizard to reduce cognitive load and improve completion rates. The first step focuses on location selection, leveraging the existing Google Places API integration used in supplier coverage management. Customers can search for and select their service location, with the system automatically capturing coordinates, timezone, and geographic identifiers.

The second step presents service type selection with clear descriptions of each service offering. For each service type, the form should display the available response time options along with real-time price estimates. The pricing calculation queries the supplier rate database, filtering by the selected location and service type, and returns the price range across all eligible suppliers. This transparency helps customers understand costs before submitting their request.

The third step collects job-specific details including a description field for explaining the issue or requirements, urgency indicators (routine, urgent, emergency), preferred scheduling windows, and any special instructions. The form should include file upload capability for customers to attach relevant documents, diagrams, or photos that help suppliers understand the request.

The final step provides a comprehensive review of all entered information, displays the estimated price range, shows the number of suppliers who can fulfill this request, and presents terms of service for acceptance. Customers can save the request as a draft at any point and return to complete it later.

**Real-Time Price Calculation:**

When the customer selects a location, service type, and response time, the system must query the supplier rates database to calculate pricing. The calculation should identify all suppliers whose coverage includes the requested location, filter out suppliers who have excluded the requested service type or response time, retrieve the rates from eligible suppliers, and display the minimum, maximum, and average rates. This provides customers with realistic pricing expectations while maintaining competitive dynamics among suppliers.

**Validation and Error Handling:**

The form must validate that the selected location is within at least one supplier's coverage area. If no suppliers service the location, the form should display a clear message indicating the area is not yet covered and offer to notify the customer when coverage becomes available. Similarly, if the selected service type or response time combination has no available suppliers, the form should suggest alternative options.

**Dependencies:** Service Request Data Model (1.2) must be complete.

**Deliverable:** Customers can submit complete service requests with real-time pricing and supplier availability information.

---

### 2.2 Customer Dashboard

**Objective:** Provide customers with a centralized view of all their service requests and job status.

**Dashboard Components:**

The customer dashboard should open with a summary card section displaying key metrics including total requests submitted, active jobs in progress, completed jobs, and total spending. These metrics provide immediate context about the customer's platform usage.

The main content area presents a tabbed interface for organizing requests by status. The "Active Requests" tab shows all jobs in submitted, matched, assigned, or in-progress states. Each request card displays the service type icon, location, requested response time, current status with visual indicator, assigned supplier name (if applicable), and quick action buttons. The "Completed Jobs" tab shows finished work with completion dates, final costs, and links to invoices and reviews. The "Drafts" tab displays saved but unsubmitted requests for easy resumption.

**Request Detail View:**

Clicking any request card navigates to a detailed view showing the complete request information, a visual timeline of status changes with timestamps, assigned supplier profile and contact information (if assigned), real-time status updates from the supplier, uploaded documents and attachments, invoice details (if invoiced), and action buttons appropriate to the current status (cancel, modify, approve completion, submit payment, leave review).

**Real-Time Updates:**

The dashboard should implement polling or websocket connections to display real-time status updates. When a supplier accepts a job, starts work, or marks completion, the customer dashboard should update immediately without requiring a page refresh. This creates a responsive, modern user experience.

**Dependencies:** Service Request Form (2.1) must be complete.

**Deliverable:** Customers can view and manage all their service requests from a centralized dashboard.

---

## Phase 3: Job Distribution Engine (Week 5)

The job distribution engine is the core matching algorithm that connects customer requests with qualified suppliers. This automated system is essential for marketplace scalability.

### 3.1 Supplier Matching Algorithm

**Objective:** Automatically identify and rank suppliers who can fulfill each service request.

**Matching Logic:**

When a customer submits a service request, the system must immediately execute the matching algorithm. The first filter identifies all suppliers whose geographic coverage includes the requested location. This query checks both the supplierCountryCoverage table (for country-level coverage) and supplierPriorityCities table (for city-specific coverage). Suppliers with global coverage or regional coverage that includes the request location are included in the candidate pool.

The second filter removes suppliers who have excluded the requested service type for that specific location. This query checks the supplierServiceExclusions table for any records matching the supplier, location, and service type combination. Suppliers who have marked this service as unavailable are eliminated from consideration.

The third filter removes suppliers who have excluded the specific response time requested. This query checks the supplierResponseTimeExclusions table for any records matching the supplier, location, service type, and response time combination. Suppliers who cannot meet the requested response time are eliminated.

The fourth filter verifies that the supplier has configured a rate for this specific combination. The query checks the supplierRates table for a record with a non-null, non-zero rateUsdCents value. Suppliers who have not set pricing are excluded to ensure only ready-to-serve suppliers receive job assignments.

**Ranking Algorithm:**

After filtering, the remaining suppliers must be ranked to determine assignment priority. The ranking algorithm should consider multiple factors weighted by importance. The primary factor is rate completion percentage (suppliers with more comprehensive rate configurations demonstrate commitment and reliability). Secondary factors include historical acceptance rate (percentage of offered jobs the supplier has accepted), average response time to job offers, customer rating and review scores (once the review system is implemented), and current workload (number of active jobs to ensure capacity).

The ranking formula combines these factors into a composite score, with configurable weights allowing the platform to adjust matching behavior over time. Initially, rate completion and acceptance rate should be weighted most heavily.

**Assignment Creation:**

For each matched and ranked supplier, the system creates a jobAssignment record with status "pending". The assignment includes the service request ID, supplier ID, offered price (from the supplier's rate configuration), assignment timestamp, and expiration timestamp (jobs should expire if not accepted within a reasonable timeframe, such as 24 hours for routine jobs or 1 hour for emergency requests).

The system can implement different assignment strategies. The "first-come-first-served" strategy offers the job to the top-ranked supplier exclusively, moving to the next supplier only if the first declines or the offer expires. The "competitive bidding" strategy offers the job to multiple suppliers simultaneously, allowing the customer to choose from multiple acceptances. The "automatic assignment" strategy assigns the job to the top-ranked supplier without requiring explicit acceptance, suitable for established supplier relationships.

**Dependencies:** Service Request Data Model (1.2) and Customer Dashboard (2.2) must be complete.

**Deliverable:** Service requests are automatically matched with qualified suppliers and job assignments are created.

---

### 3.2 Notification System

**Objective:** Notify suppliers of new job opportunities and keep all parties informed of status changes.

**Notification Channels:**

The notification system should support multiple delivery channels to ensure suppliers receive timely alerts. Email notifications provide detailed information and serve as a permanent record. In-app notifications appear in the supplier dashboard as badges and alerts. SMS notifications (optional, for high-urgency jobs) provide immediate alerts even when suppliers are not actively using the platform. Push notifications (for future mobile app) enable real-time alerts on mobile devices.

**Notification Types:**

Different events trigger different notification templates. When a new job is assigned, the supplier receives a "New Job Opportunity" notification containing the service type, location, response time requirement, customer details (name, contact), job description, offered price, and a direct link to accept or decline. When a job offer is about to expire, a reminder notification is sent. When a customer updates job details, an "Updated Job Information" notification is sent to the assigned supplier. When a customer cancels a job, a "Job Cancelled" notification informs the supplier.

**Supplier Notification Preferences:**

Suppliers should be able to configure their notification preferences through their profile settings. Preferences include which channels to use for each notification type (email, in-app, SMS), quiet hours when notifications should be suppressed, and notification frequency (immediate, hourly digest, daily digest). These preferences ensure suppliers receive timely information without being overwhelmed.

**Implementation Approach:**

The notification system should be implemented as a queue-based architecture. When an event occurs (job assigned, status changed), the system adds a notification task to a queue. A background worker processes the queue, renders the appropriate template, and sends notifications through the configured channels. This asynchronous approach prevents notification delivery from blocking the main application flow.

**Dependencies:** Supplier Matching Algorithm (3.1) must be complete.

**Deliverable:** Suppliers receive timely notifications of job opportunities and status changes through multiple channels.

---

## Phase 4: Supplier Job Management (Week 6)

This phase creates the supplier-facing interface for managing job assignments, accepting work, and updating job status. This completes the core marketplace loop.

### 4.1 Supplier Job Inbox

**Objective:** Provide suppliers with a centralized interface for managing all job assignments across different status states.

**Inbox Structure:**

The supplier job inbox should be implemented as a tabbed interface with three primary views. The "Available Jobs" tab displays all pending job assignments that require supplier action. Each job card shows the service type, location, customer name, response time requirement, offered price, time remaining before offer expires, and prominent "Accept" and "Decline" buttons. This tab should be sorted by urgency and expiration time to help suppliers prioritize.

The "Active Jobs" tab displays all accepted jobs that are currently in progress. Each job card shows the service type, location, customer contact information, current status (assigned, en-route, on-site, completing), time since acceptance, and action buttons for updating status. This tab should be sorted by scheduled start time or customer priority.

The "Completed Jobs" tab displays the supplier's job history including completed, invoiced, and paid jobs. Each job card shows the service type, location, completion date, final invoice amount, payment status, and customer rating (if provided). This tab serves as a portfolio and performance record.

**Filtering and Search:**

The inbox should include robust filtering capabilities to help suppliers manage large volumes of jobs. Filters should include service type (L1_EUC, L1_NETWORK, SMART_HANDS), location (by region or specific city), response time requirement, price range, and date range. A search bar allows suppliers to find specific jobs by customer name, location, or job ID.

**Bulk Actions:**

For suppliers managing multiple job assignments, bulk action capabilities improve efficiency. Suppliers should be able to select multiple pending jobs and accept or decline them simultaneously. Similarly, suppliers should be able to update the status of multiple active jobs at once (for example, marking multiple jobs as "en-route" when beginning a service route).

**Dependencies:** Notification System (3.2) must be complete.

**Deliverable:** Suppliers can view and manage all job assignments from a centralized inbox interface.

---

### 4.2 Job Actions

**Objective:** Enable suppliers to accept jobs, update status, and provide progress updates to customers.

**Accept/Decline Workflow:**

When a supplier clicks "Accept" on a pending job, the system should display a confirmation dialog showing the job details, offered price, and expected response time. Upon confirmation, the system updates the jobAssignment status to "accepted", updates the serviceRequest status to "assigned", creates a jobStatusHistory record, sends a notification to the customer, and removes the job from other suppliers' pending lists (if using exclusive assignment strategy).

When a supplier clicks "Decline" on a pending job, the system should optionally request a decline reason (not interested, outside expertise, scheduling conflict, price too low, other). This feedback helps improve the matching algorithm. Upon confirmation, the system updates the jobAssignment status to "declined", creates a jobStatusHistory record, and triggers the matching algorithm to offer the job to the next ranked supplier (if using sequential assignment strategy).

**Status Update Workflow:**

Once a job is accepted, the supplier can update its status through the job detail view. The available status transitions depend on the current state. From "assigned" status, the supplier can transition to "en-route" (indicating they are traveling to the service location) or "cancelled" (if circumstances prevent fulfillment). From "en-route" status, the supplier can transition to "on-site" (indicating they have arrived at the location). From "on-site" status, the supplier can transition to "completed" (indicating the work is finished).

Each status update should include optional fields for notes (explaining the update or any issues encountered), estimated completion time (for in-progress jobs), and photo uploads (documenting work progress or completion). These updates are immediately visible to the customer through their dashboard, providing transparency and building trust.

**Completion Workflow:**

When a supplier marks a job as "completed", the system should prompt for completion details including actual time spent (for time-based billing), materials used (for cost tracking), completion notes (describing work performed), and completion evidence (photos, test results, or reports). The system then updates the serviceRequest status to "completed", creates a jobStatusHistory record, sends a notification to the customer requesting completion approval, and triggers the invoice generation process.

**Notes and Communication:**

Throughout the job lifecycle, suppliers should be able to add notes and updates that are visible to the customer. This creates a communication thread attached to the job, reducing the need for external communication channels. Notes should support text, file attachments, and timestamps. Both suppliers and customers can add notes, creating a bidirectional communication channel.

**Dependencies:** Supplier Job Inbox (4.1) must be complete.

**Deliverable:** Suppliers can accept jobs, update status throughout the job lifecycle, and communicate with customers.

---

## Phase 5: Job Lifecycle & Communication (Week 7)

This phase enhances the job management experience with automated notifications, timeline visualization, and optional real-time messaging between customers and suppliers.

### 5.1 Status Updates

**Objective:** Provide automated notifications and visual tracking of job progress for both customers and suppliers.

**Automated Notifications:**

Every status change in the job lifecycle should trigger appropriate notifications to relevant parties. When a supplier accepts a job, the customer receives a notification with supplier details and expected timeline. When a supplier updates status to "en-route", the customer receives a notification with estimated arrival time. When a supplier marks a job as "on-site", the customer receives a notification confirming the supplier has arrived. When a supplier completes the job, the customer receives a notification requesting completion approval and review.

These notifications should be sent through the customer's preferred channels (email, in-app, SMS) and include all relevant context such as job details, current status, next expected action, and direct links to view the job in their dashboard.

**Timeline Visualization:**

Both the customer and supplier job detail views should include a visual timeline showing the complete job history. The timeline displays each status change as a node on a vertical or horizontal line, with timestamps, the user who triggered the change, and any associated notes or attachments. Future expected milestones (such as scheduled completion time) can be displayed as upcoming nodes to set expectations.

The timeline should use visual indicators to show status: completed steps in green with checkmarks, the current step highlighted in blue, upcoming steps in gray, and any issues or delays marked in amber or red. This provides an at-a-glance understanding of job progress.

**Expected Completion Tracking:**

When a supplier accepts a job, they should provide an expected completion date and time based on the response time requirement. The system tracks this expectation and displays countdown timers or progress indicators. If the expected completion time is approaching without a status update, the system can send reminder notifications to the supplier. If the completion time passes without the job being marked complete, the system flags the job as "overdue" and may notify both the supplier and customer.

**Dependencies:** Job Actions (4.2) must be complete.

**Deliverable:** Automated notifications keep all parties informed, and visual timelines provide clear job progress tracking.

---

### 5.2 Messaging System (Optional but Recommended)

**Objective:** Enable direct communication between customers and assigned suppliers within the platform.

**In-App Chat Interface:**

The messaging system should be implemented as a chat interface embedded in the job detail view. When viewing a job, both the customer and supplier see a message thread specific to that job. The chat interface displays message history with timestamps and sender identification, a text input field for composing new messages, file attachment capability for sharing photos, documents, or diagrams, and real-time delivery indicators (sent, delivered, read).

Messages should be stored in a dedicated database table with foreign keys to the service request and user who sent the message. Each message record includes the sender ID, recipient ID, message text, attachment URLs (if any), timestamp, and read status.

**Real-Time Delivery:**

To provide a modern messaging experience, the system should implement real-time message delivery using WebSocket connections or server-sent events. When a user sends a message, it is immediately delivered to the recipient if they are currently viewing the job detail page. If the recipient is not online, they receive a notification through their preferred channels (email, push notification) alerting them to the new message.

**Message Notifications:**

Unread messages should be indicated through badge counts on the job card in the inbox or dashboard. When a new message arrives, a notification is sent to the recipient with the sender's name, a preview of the message text, and a direct link to view the full conversation. Users can configure notification preferences to control how frequently they receive message alerts.

**Moderation and Safety:**

All messages should be stored and accessible to platform administrators for moderation purposes. If a customer or supplier reports inappropriate communication, administrators can review the message history and take appropriate action. The system should also implement basic content filtering to detect and flag potentially abusive or inappropriate language.

**Alternative: External Communication:**

If implementing a full messaging system is deemed too complex for the initial launch, the platform can facilitate external communication by providing verified contact information. When a job is accepted, the customer and supplier receive each other's email addresses and phone numbers, allowing them to communicate directly. However, this approach reduces platform visibility into the communication and makes dispute resolution more challenging.

**Dependencies:** Status Updates (5.1) must be complete.

**Deliverable:** Customers and suppliers can communicate directly within the platform, reducing friction and improving coordination.

---

## Phase 6: Invoicing & Payment (Weeks 8-9)

This phase implements the financial transaction layer, enabling automated invoicing and payment processing through Stripe integration.

### 6.1 Invoice Generation

**Objective:** Automatically generate accurate invoices when jobs are completed, reflecting the agreed-upon rates and any adjustments.

**Invoice Data Model:**

The invoices table should capture all information necessary for financial record-keeping and payment processing. Each invoice record includes the service request ID (foreign key), customer ID (foreign key), supplier ID (foreign key), invoice number (unique, auto-generated), issue date, due date (typically 30 days from issue), line items (stored as JSON or in a separate invoiceLineItems table), subtotal amount, tax amount (if applicable), total amount, currency (USD), payment status (unpaid, paid, overdue, cancelled), payment date (when paid), and payment method (Stripe, manual, other).

**Automatic Invoice Creation:**

When a supplier marks a job as "completed", the system should automatically generate an invoice. The invoice generation process retrieves the agreed-upon rate from the jobAssignment record, calculates the total based on the rate and any quantity or time multipliers, applies any applicable taxes based on the customer's location, generates a unique invoice number following a consistent format (such as INV-YYYYMMDD-XXXXX), creates the invoice record in the database, and sends the invoice to the customer via email and in-app notification.

**Invoice Line Items:**

Each invoice should clearly itemize the charges. The primary line item is the service charge, showing the service type, response time, location, rate per unit (hour or service), quantity or duration, and line total. Additional line items may include travel charges (if applicable), materials or parts (if supplied by the supplier), rush fees (for expedited service), and taxes or fees. The invoice should also display the subtotal, total tax, and grand total.

**Customer Invoice Review:**

Before payment is processed, customers should have the opportunity to review and approve the invoice. The customer dashboard displays pending invoices with a clear call-to-action to review. The invoice detail view shows all line items, the job details and completion evidence, and options to approve and pay, dispute the invoice, or request clarification from the supplier. This approval workflow ensures customers are satisfied with the work before payment is processed.

**Invoice Adjustments:**

In some cases, the final invoice amount may differ from the originally quoted rate. This can occur when the actual time spent differs from the estimate, additional materials were required, or the scope of work changed during execution. When creating the invoice, the supplier should be able to add adjustment line items with explanations. Significant adjustments (such as increases over 20% of the original quote) should require customer approval before the invoice is finalized.

**Dependencies:** Job Actions (4.2) must be complete.

**Deliverable:** Invoices are automatically generated when jobs are completed, providing clear itemization and customer review workflow.

---

### 6.2 Payment Integration

**Objective:** Process customer payments securely through Stripe and track payment status.

**Stripe Setup:**

The Orbidut project can enable Stripe integration using the `webdev_add_feature` tool with the "stripe" feature flag. This automatically configures the necessary environment variables, installs the Stripe SDK, and sets up webhook endpoints for payment event handling. The Stripe integration should be configured in test mode initially to allow thorough testing before processing real payments.

**Payment Flow:**

When a customer approves an invoice and clicks "Pay Now", the system initiates the Stripe payment flow. The frontend creates a Stripe Checkout Session by calling a tRPC procedure that uses the Stripe API to create a session with the invoice amount, currency, customer email, and success/cancel URLs. The customer is redirected to the Stripe-hosted checkout page where they enter payment information securely. After successful payment, Stripe redirects the customer back to the success URL with the session ID. The system retrieves the payment details from Stripe, updates the invoice status to "paid", records the payment date and transaction ID, and sends confirmation notifications to both customer and supplier.

**Payment Status Tracking:**

The invoices table tracks payment status through its lifecycle. An invoice starts in "unpaid" status when generated. When the customer initiates payment, the status updates to "processing". Upon successful payment confirmation from Stripe, the status updates to "paid". If payment fails, the status updates to "failed" with error details. If the due date passes without payment, the status updates to "overdue". If the invoice is cancelled (due to job cancellation or dispute resolution), the status updates to "cancelled".

**Stripe Webhooks:**

Stripe sends webhook events for various payment lifecycle events. The application should implement webhook handlers for key events including payment_intent.succeeded (payment completed successfully), payment_intent.payment_failed (payment attempt failed), charge.refunded (payment was refunded), and checkout.session.completed (checkout session finished). These webhooks ensure the application's payment status remains synchronized with Stripe's records even if the customer closes their browser during the payment process.

**Payment History:**

Both customers and suppliers should have access to complete payment history. The customer dashboard includes a "Payments" section showing all invoices, their status, payment dates, and amounts. Customers can download invoice PDFs and payment receipts. The supplier dashboard includes a "Revenue" section showing all paid invoices, total earnings, pending payments, and payout status. This transparency builds trust and simplifies financial record-keeping for both parties.

**Dependencies:** Invoice Generation (6.1) and Stripe feature must be enabled.

**Deliverable:** Customers can securely pay invoices through Stripe, and payment status is automatically tracked and synchronized.

---

### 6.3 Supplier Payouts

**Objective:** Track amounts owed to suppliers and facilitate regular payouts for completed and paid jobs.

**Payout Data Model:**

The payouts table tracks all financial transfers from the platform to suppliers. Each payout record includes the supplier ID (foreign key), payout amount, currency, payout date, payout method (Stripe Connect, bank transfer, other), transaction ID or reference number, status (pending, processing, completed, failed), and a list of invoice IDs included in this payout (stored as JSON array or in a separate payoutInvoices junction table).

**Payout Calculation:**

The platform must determine how much to pay each supplier based on completed and paid jobs. The calculation process identifies all invoices for the supplier with status "paid" and not yet included in a payout, sums the total amounts, applies the platform commission (a percentage of each transaction, such as 10-15%), calculates the net amount owed to the supplier, and creates a payout record with status "pending".

**Payout Schedule:**

Suppliers should be paid on a regular schedule to ensure predictable cash flow. Common payout schedules include weekly (every Monday for the previous week's completed jobs), bi-weekly (every other Monday), or monthly (first business day of each month). The platform should allow suppliers to configure their preferred payout schedule and minimum payout threshold (for example, only process payouts when the amount exceeds $100 to reduce transaction fees).

**Payout Methods:**

The primary payout method should be Stripe Connect, which enables automated transfers to supplier bank accounts. Suppliers complete a Stripe Connect onboarding process to verify their identity and link their bank account. Once connected, the platform can initiate transfers programmatically. Alternative payout methods for suppliers who cannot use Stripe Connect include direct bank transfer (requires manual processing), PayPal (requires integration), or check (requires manual processing and mailing).

**Payout Dashboard:**

Suppliers should have visibility into their earnings and payout status through a dedicated dashboard section. The "Earnings" page displays total revenue (sum of all paid invoices), platform commission (total fees deducted), net earnings (amount paid out or pending payout), and pending balance (amount earned but not yet paid out). The page also shows a table of all payouts with dates, amounts, status, and transaction references. Suppliers can download payout statements for accounting purposes.

**Tax Reporting:**

For suppliers in the United States, the platform must issue Form 1099-K if annual gross payments exceed IRS thresholds. The system should track annual payment totals per supplier and flag suppliers who will require tax forms. At year-end, the platform generates 1099-K forms with the supplier's total gross payments and provides them electronically and by mail as required by law.

**Dependencies:** Payment Integration (6.2) must be complete.

**Deliverable:** Suppliers receive regular payouts for completed work, with full visibility into earnings and payout status.

---

## Phase 7: Quality & Trust (Week 10)

This phase implements systems for quality control, customer feedback, and dispute resolution to maintain marketplace integrity.

### 7.1 Rating & Review System

**Objective:** Enable customers to rate and review suppliers after job completion, creating accountability and helping future customers make informed decisions.

**Review Data Model:**

The reviews table captures customer feedback for completed jobs. Each review record includes the job ID (foreign key), customer ID (foreign key), supplier ID (foreign key), overall rating (1-5 stars), category ratings (quality of work, communication, timeliness, professionalism - each 1-5 stars), review text (optional, customer's written feedback), response text (optional, supplier's response to the review), review date, response date, and status (published, flagged, removed).

**Review Submission Flow:**

After a job is marked as "completed" and the invoice is paid, the customer receives a notification requesting a review. The review form displays the job details as a reminder, a 5-star rating selector for overall satisfaction, optional category-specific ratings for detailed feedback, a text area for written comments (optional but encouraged), and a checkbox to make the review public (visible on the supplier's profile). Upon submission, the review is saved with status "published" and the supplier receives a notification.

**Review Display:**

Supplier profiles should prominently display their aggregate ratings and recent reviews. The profile header shows the overall average rating (calculated from all reviews), total number of reviews, and a breakdown of ratings by category. Below this, individual reviews are displayed in reverse chronological order, showing the customer's name (or "Anonymous" if requested), overall rating, review text, review date, and the supplier's response (if provided). Reviews can be filtered by rating (5-star, 4-star, etc.) or sorted by most recent, most helpful, or highest/lowest rating.

**Supplier Response:**

Suppliers should be able to respond to reviews to address concerns, thank customers, or provide context. When a supplier views a review, they see a "Respond" button that opens a text field for composing a response. Responses are limited in length (such as 500 characters) to encourage concise communication. Once posted, the response appears directly below the review. Suppliers can edit their response within 24 hours of posting but cannot delete it, ensuring accountability.

**Review Moderation:**

The platform should implement basic review moderation to prevent abuse. Reviews are automatically flagged if they contain profanity, personal attacks, or contact information. Flagged reviews are held for admin review before publication. Both customers and suppliers can report reviews they believe violate platform policies. Administrators can review reported content and take action including publishing the review, requesting edits, or removing the review if it violates terms of service.

**Impact on Matching:**

Supplier ratings should influence the job matching algorithm. Suppliers with higher average ratings receive priority in job assignments, all else being equal. The matching algorithm can incorporate rating as a weighted factor in the ranking score. This creates a positive feedback loop where high-quality suppliers receive more jobs, incentivizing all suppliers to maintain high standards.

**Dependencies:** Payment Integration (6.2) must be complete (reviews are requested after payment).

**Deliverable:** Customers can rate and review suppliers, creating transparency and accountability in the marketplace.

---

### 7.2 Dispute Resolution

**Objective:** Provide a structured process for handling conflicts between customers and suppliers, with admin oversight and resolution options.

**Dispute Data Model:**

The disputes table tracks all formal disputes raised on the platform. Each dispute record includes the job ID (foreign key), raised by (customer or supplier), reason category (work quality, pricing disagreement, timeline issues, communication problems, payment issues, other), description (detailed explanation of the issue), evidence (file attachments such as photos, documents, or correspondence), status (open, under review, resolved, closed), assigned admin (admin user reviewing the dispute), resolution notes (admin's explanation of the resolution), resolution action (refund issued, payment adjusted, no action, supplier warning, customer warning), created date, and resolved date.

**Dispute Initiation:**

Either customers or suppliers can raise a dispute through the job detail page. A "Report Issue" button opens a dispute form where the user selects a reason category from a predefined list, provides a detailed description of the issue, uploads supporting evidence (photos, screenshots, documents), and submits the dispute. Upon submission, the dispute status is set to "open", both parties receive notifications that a dispute has been raised, and the job status is updated to "disputed" to prevent further status changes until resolution.

**Admin Review Process:**

Platform administrators review disputes through a dedicated admin interface. The dispute queue shows all open disputes sorted by age or priority. When an admin opens a dispute, they see the complete job history including all status changes, notes, and messages, the dispute details and evidence from both parties, the customer and supplier profiles including their history and ratings, and action options (request more information, issue refund, adjust payment, close without action, issue warning, suspend account).

The admin can communicate with both parties through the dispute interface, requesting additional information or clarification. All communication is logged and visible to both parties. Once the admin has gathered sufficient information, they determine an appropriate resolution and document their decision in the resolution notes.

**Resolution Actions:**

Common dispute resolutions include issuing a full or partial refund to the customer (if work was unsatisfactory or incomplete), adjusting the invoice amount (if pricing was disputed), requiring the supplier to redo or complete the work, closing the dispute without action (if the complaint was unfounded), issuing a warning to the customer or supplier (if policies were violated), or suspending an account (for serious or repeated violations). The chosen action is executed through the admin interface, updating relevant records (invoices, payments, account status).

**Post-Resolution:**

After a dispute is resolved, both parties receive detailed notifications explaining the resolution and any actions taken. The job status is updated from "disputed" to reflect the outcome (such as "completed" if resolved satisfactorily, or "cancelled" if refunded). The dispute record remains in the system for audit purposes and to track patterns of issues with specific customers or suppliers. Repeated disputes involving the same party may trigger additional review or account restrictions.

**Dispute Prevention:**

The best dispute resolution is dispute prevention. The platform should implement features to reduce disputes including clear terms of service and expectations, detailed job descriptions and scope definitions, transparent pricing and invoicing, real-time communication channels, photo documentation of work, and completion approval workflows. By setting clear expectations and facilitating communication, many potential disputes can be resolved informally before escalating to formal dispute resolution.

**Dependencies:** Payment Integration (6.2) must be complete.

**Deliverable:** A structured dispute resolution process handles conflicts fairly with admin oversight and multiple resolution options.

---

## Phase 8: Admin Tools (Week 11)

This phase creates the administrative interface for platform oversight, supplier management, and business analytics.

### 8.1 Admin Dashboard

**Objective:** Provide platform administrators with comprehensive visibility into marketplace operations and performance.

**Dashboard Overview:**

The admin dashboard should open with a high-level metrics section displaying key performance indicators. These metrics include total active jobs (currently in progress), total jobs completed (all-time and this month), total revenue processed (all-time and this month), active customers (customers with at least one job in the last 30 days), active suppliers (suppliers with at least one accepted job in the last 30 days), average job completion time, average customer rating, and open disputes requiring attention.

**Job Monitoring:**

The admin interface includes a comprehensive job monitoring view showing all jobs across the platform. The job list displays columns for job ID, customer name, supplier name, service type, location, status, created date, and last updated date. Admins can filter jobs by status, date range, service type, or search by customer/supplier name. Clicking any job opens the complete job detail view with full history, messages, and the ability to take admin actions (cancel job, reassign to different supplier, adjust pricing, contact parties).

**Supplier Performance Metrics:**

A dedicated supplier analytics section provides insights into supplier performance. The supplier list shows each supplier's name, total jobs completed, acceptance rate (percentage of offered jobs accepted), average rating, total revenue generated, and account status. Admins can sort by any metric to identify top performers or problematic suppliers. Clicking a supplier opens their detailed profile with complete job history, customer reviews, rate configuration status, coverage areas, and admin actions (approve/suspend account, adjust commission rate, send message).

**Revenue Tracking:**

The financial analytics section displays revenue metrics including total gross revenue (sum of all paid invoices), platform commission earned (total fees collected), net revenue paid to suppliers, revenue by service type (breakdown showing which services generate most revenue), revenue by region (geographic distribution of revenue), and revenue trends over time (daily, weekly, monthly charts). These metrics help the platform understand business performance and identify growth opportunities.

**Customer Analytics:**

Understanding customer behavior helps optimize the platform. The customer analytics section shows total registered customers, active customers (with jobs in last 30 days), customer retention rate (percentage who return for additional jobs), average jobs per customer, average spend per customer, and customer acquisition sources (if tracking is implemented). Admins can identify high-value customers and understand usage patterns.

**System Health Monitoring:**

The dashboard should include system health indicators such as average API response time, error rate (percentage of requests resulting in errors), database query performance, background job queue length, and notification delivery success rate. Alerts should be displayed for any metrics exceeding acceptable thresholds, enabling proactive issue resolution.

**Dependencies:** All previous phases must be complete to have data to monitor.

**Deliverable:** Administrators have comprehensive visibility into platform operations, performance, and health.

---

### 8.2 Supplier Verification

**Objective:** Implement a vetting process for new suppliers to ensure quality and legitimacy before they can accept jobs.

**Verification Data Model:**

The supplierVerification table tracks the verification status and submitted documents for each supplier. Each verification record includes the supplier ID (foreign key), verification status (pending, under review, approved, rejected), business name, business registration number, business address, contact person name and title, phone number, email address, insurance certificate URL (uploaded document), business license URL (uploaded document), certifications URLs (array of uploaded documents), submitted date, reviewed date, reviewed by (admin user ID), rejection reason (if rejected), and notes (admin comments).

**Supplier Onboarding Flow:**

When a new supplier registers, they initially have limited access to the platform. They can configure their profile, coverage, and rates, but cannot accept jobs until verified. A prominent banner in their dashboard prompts them to complete verification. The verification form collects business information (name, registration number, address, contact details), requests document uploads (business license, insurance certificate, relevant certifications), and includes a terms of service agreement checkbox. Upon submission, the verification status is set to "under review" and admins receive a notification.

**Admin Verification Process:**

Administrators review supplier verification requests through a dedicated queue in the admin interface. The verification review page displays the supplier's submitted information and uploaded documents, their configured rates and coverage (to assess readiness), their profile description and service offerings, and action buttons (approve, reject, request more information). Admins verify that the business information is legitimate and complete, uploaded documents are valid and current, insurance coverage meets platform requirements (minimum liability limits), certifications are relevant to offered services, and rates are reasonable and competitive.

**Approval and Rejection:**

If the verification is approved, the admin clicks "Approve" and the supplier's status is updated to "approved". The supplier receives a congratulatory notification and can immediately begin accepting jobs. Their profile is marked as "Verified" with a badge, increasing customer trust. If the verification is rejected, the admin selects a rejection reason (incomplete information, invalid documents, insufficient insurance, other) and provides explanatory notes. The supplier receives a notification with the rejection reason and instructions for resubmission. They can update their information and resubmit for review.

**Ongoing Compliance:**

Verification is not a one-time process. The platform should track expiration dates for insurance certificates and business licenses. When a document is approaching expiration (such as 30 days before), the supplier receives a reminder notification to upload an updated document. If a document expires without renewal, the supplier's account may be temporarily suspended until compliance is restored. This ongoing monitoring ensures all active suppliers maintain required credentials.

**Verification Badge:**

Verified suppliers should display a "Verified" badge on their profile and in job assignment notifications. This badge signals to customers that the supplier has been vetted by the platform, increasing trust and acceptance rates. The badge can be accompanied by a tooltip explaining what verification entails (business registration confirmed, insurance verified, credentials checked).

**Dependencies:** Admin Dashboard (8.1) must be complete.

**Deliverable:** A structured verification process ensures only legitimate, qualified suppliers can accept jobs on the platform.

---

## Phase 9: Optimization & Scale (Week 12+)

This phase implements advanced features that enhance the marketplace experience and support growth beyond the initial launch.

### 9.1 Advanced Matching

**Objective:** Implement sophisticated matching strategies that increase job fulfillment rates and optimize pricing.

**Multi-Supplier Bidding:**

Instead of automatically assigning jobs to the top-ranked supplier, the platform can implement a competitive bidding system. When a customer submits a request, the system identifies all qualified suppliers and sends the job opportunity to multiple suppliers simultaneously. Each supplier can review the job details and submit a bid including their proposed price, estimated completion time, and a brief pitch explaining their qualifications. The customer receives all bids and can compare suppliers based on price, ratings, response time, and pitch quality. The customer selects their preferred supplier, and the job is assigned.

This bidding approach increases competition, potentially lowering prices for customers while giving suppliers more control over their pricing. However, it adds complexity and may slow down job assignment, making it less suitable for urgent requests.

**Priority and Rush Jobs:**

Some customer requests require faster-than-normal response times or higher priority. The platform can implement a "rush job" designation that offers premium pricing to suppliers. When a customer marks a request as rush, the system applies a multiplier to the standard rates (such as 1.5x or 2x), making the job more attractive to suppliers. Rush jobs are highlighted in the supplier inbox and may trigger more aggressive notifications (SMS, push notifications). This ensures urgent customer needs are met while compensating suppliers for prioritizing the work.

**Bulk Job Requests:**

Enterprise customers may need to submit multiple related jobs at once, such as deploying equipment to 50 locations. The platform can implement a bulk request feature where customers upload a CSV file with job details for each location. The system processes the file, creates individual service requests for each location, runs the matching algorithm for each request, and provides the customer with a summary of total cost and assigned suppliers. Bulk requests may qualify for volume discounts, incentivizing larger contracts.

**Supplier Availability Calendar:**

To improve matching accuracy, suppliers can maintain an availability calendar indicating when they can accept new jobs. Suppliers mark dates or time periods when they are unavailable (due to vacation, existing commitments, or capacity constraints). The matching algorithm considers availability when assigning jobs, avoiding assignments to suppliers who are unavailable. This reduces declined jobs and improves acceptance rates.

**Geographic Routing Optimization:**

For suppliers who accept multiple jobs in the same region, the platform can implement route optimization. When a supplier has multiple active jobs, the system can suggest an optimal route that minimizes travel time and distance. This feature requires integration with mapping APIs to calculate routes and travel times. Optimized routing increases supplier efficiency and profitability while reducing environmental impact.

**Dependencies:** All core features must be stable and operational.

**Deliverable:** Advanced matching features increase job fulfillment rates, optimize pricing, and improve efficiency for both customers and suppliers.

---

### 9.2 Analytics & Insights

**Objective:** Provide data-driven insights to suppliers, customers, and administrators to support decision-making and continuous improvement.

**Supplier Performance Dashboards:**

Suppliers should have access to comprehensive analytics about their performance on the platform. The supplier analytics dashboard displays key metrics including total jobs completed (all-time and by time period), acceptance rate (percentage of offered jobs accepted), average completion time (compared to committed response time), customer satisfaction (average rating and review sentiment), revenue trends (daily, weekly, monthly charts), top service types (which services generate most revenue), geographic distribution (which regions generate most jobs), and competitive benchmarking (how their metrics compare to platform averages).

These insights help suppliers understand their performance, identify strengths and weaknesses, and make data-driven decisions about pricing, coverage, and service offerings.

**Market Rate Benchmarking:**

The platform has visibility into all supplier rates across different locations and service types. This data can be aggregated and anonymized to provide market insights. Suppliers can view benchmark reports showing average rates by service type and region, rate ranges (25th, 50th, 75th percentiles), rate trends over time (are rates increasing or decreasing), and how their rates compare to the market. This transparency helps suppliers price competitively while ensuring profitability.

Customers can also benefit from rate benchmarking. When requesting a service, the platform can display the typical price range for similar jobs in their area, helping them understand if quoted prices are reasonable.

**Customer Demand Forecasting:**

By analyzing historical job request patterns, the platform can forecast future demand. The forecasting model considers factors such as time of year (seasonal patterns), day of week (weekday vs. weekend patterns), geographic trends (growing vs. declining regions), and service type trends (which services are increasing in demand). These forecasts help suppliers plan capacity, adjust coverage, and optimize pricing. The platform can proactively notify suppliers of anticipated demand increases in their coverage areas, enabling them to prepare.

**Churn Prediction:**

The platform can implement machine learning models to predict which customers or suppliers are at risk of churning (leaving the platform). Risk factors include declining usage frequency, negative reviews or disputes, long periods of inactivity, and reduced acceptance rates (for suppliers). When a user is flagged as at-risk, the platform can trigger retention interventions such as personalized outreach from the customer success team, promotional offers or discounts, surveys to understand concerns, or feature recommendations to increase engagement.

**A/B Testing Framework:**

To continuously improve the platform, implement an A/B testing framework that allows testing different features, UI designs, or algorithms with subsets of users. For example, test different matching algorithms to see which produces higher acceptance rates, test different notification strategies to see which increases engagement, or test different pricing displays to see which increases conversion. The framework tracks metrics for each variant and determines statistical significance, enabling data-driven product decisions.

**Dependencies:** Sufficient historical data must exist (typically 3-6 months of operations).

**Deliverable:** Comprehensive analytics and insights support decision-making for all platform stakeholders and enable continuous improvement.

---

## Critical Path Summary

The following table summarizes the critical path through the implementation phases, highlighting key milestones and dependencies:

| Week | Phase | Key Deliverable | Dependency |
|------|-------|----------------|------------|
| 1-2 | Foundation | Customer accounts and job data models | None (starting point) |
| 3-4 | Customer Experience | Customers can submit service requests | Foundation complete |
| 5 | Job Distribution | Requests automatically matched to suppliers | Customer Experience complete |
| 6 | Supplier Job Management | Suppliers can accept and complete jobs | Job Distribution complete |
| 7 | Job Lifecycle | Automated status tracking and communication | Supplier Job Management complete |
| 8-9 | Invoicing & Payment | Automated payment processing via Stripe | Job Lifecycle complete |
| 10 | Quality & Trust | Reviews and dispute resolution | Payment complete |
| 11 | Admin Tools | Platform oversight and supplier verification | All core features complete |
| 12+ | Optimization | Advanced features and analytics | Stable operations |

**MVP Milestone (Week 6):** The platform supports the complete end-to-end job flow from customer request through supplier completion. Manual payment processing is acceptable at this stage.

**Full Launch (Week 9):** Automated payment processing is integrated, enabling the platform to operate at scale without manual intervention.

**Maturity (Week 12+):** Advanced features optimize the marketplace experience and support continued growth.

---

## Implementation Principles

Throughout the implementation of all phases, the following principles should guide decision-making:

**Start Simple, Iterate:** Launch with the minimum viable feature set and enhance based on real user feedback. Avoid over-engineering features before validating user needs.

**Data Integrity First:** Implement proper foreign key constraints, indexes, and validation rules from the beginning. Data quality issues are exponentially harder to fix later.

**Security by Default:** Every feature should consider security implications. Implement proper authentication, authorization, input validation, and data encryption from the start.

**Mobile-Friendly Design:** All interfaces should be responsive and functional on mobile devices. Many suppliers will manage jobs from their phones while in the field.

**Performance Matters:** Monitor query performance and API response times from day one. Optimize slow queries before they become bottlenecks at scale.

**Clear Communication:** Every status change, action, or error should be communicated clearly to users through appropriate channels. Uncertainty and confusion drive user frustration.

**Measure Everything:** Instrument the application to track key metrics from the beginning. You cannot improve what you do not measure.

**Plan for Failure:** Implement proper error handling, logging, and recovery mechanisms. Systems will fail; the question is how gracefully they recover.

---

## Next Steps

With the supplier rate management system complete, the immediate next step is to begin **Phase 1: Foundation (Weeks 1-2)**.

**Recommended Starting Point:** Phase 1.1 - Customer User System

This involves implementing customer registration, authentication, and profile management. Once customers can create accounts, we can proceed to building the service request data model and customer-facing request submission interface.

**Before Beginning Implementation:**

1. Review this build plan with all stakeholders to ensure alignment on priorities and timeline
2. Set up project tracking (such as a Kanban board or sprint planning) to monitor progress through each phase
3. Establish testing protocols to ensure quality at each phase
4. Define success metrics for each phase to validate that deliverables meet requirements

This build plan provides a clear roadmap for transforming Orbidut from a supplier management platform into a fully functional marketplace. Each phase builds upon the previous one, ensuring a logical progression from foundation to advanced features.

---

**Document End**
