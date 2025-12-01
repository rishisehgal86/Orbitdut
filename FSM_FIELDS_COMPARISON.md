# FSM Fields Comparison: FieldPulse vs Orbidut

## Current Orbidut RequestService Form Fields

### Contact Information
- customerName
- customerEmail
- customerPhone

### Service Details
- serviceType
- description
- estimatedDuration

### Location Information
- address
- city
- country
- postalCode
- latitude
- longitude
- timezone

### Scheduling
- scheduledDate
- scheduledTime

## Missing FSM Fields from FieldPulse

### Site Information (from FieldPulse)
- ✅ siteName (MISSING)
- ✅ siteAddress (have as "address")
- ✅ siteCity (have as "city")
- ✅ siteState (MISSING)
- ✅ sitePostalCode (have as "postalCode")
- ✅ siteCountry (have as "country")
- ✅ siteContactName (MISSING)
- ✅ siteContactNumber (MISSING)
- ✅ siteLatitude (have as "latitude")
- ✅ siteLongitude (have as "longitude")
- ✅ siteTimezone (have as "timezone")

### Technical Requirements (from FieldPulse)
- ✅ accessInstructions (MISSING)
- ✅ specialRequirements (MISSING - have "description")
- ✅ equipmentNeeded (MISSING)
- ✅ toolsRequired (in FieldPulse form)
- ✅ deviceDetails (in FieldPulse form)
- ✅ scopeOfWork (in FieldPulse form)

### Booking Details (from FieldPulse)
- ✅ bookingType (full_day, hourly, multi_day) - MISSING
- ✅ hoursRequired (in FieldPulse form)
- ✅ isRecurring (MISSING)
- ✅ recurrencePattern (MISSING)

### Time Negotiation (from FieldPulse)
- ✅ requestedStartTime (in FieldPulse form)
- ✅ isTimeFlexible (in FieldPulse form)
- ✅ proposedStartTime (MISSING - set by supplier)
- ✅ confirmedStartTime (MISSING - after agreement)

### Project/Ticket Information (from FieldPulse)
- ✅ projectName (in FieldPulse form)
- ✅ changeNumber (in FieldPulse form)
- ✅ incidentNumber (in FieldPulse form)
- ✅ siteId (in FieldPulse form)

### Communication (from FieldPulse)
- ✅ videoConferenceLink (in FieldPulse form)
- ✅ notes (in FieldPulse form)

### Status Indicators (from FieldPulse)
- ✅ downTime (boolean - is this critical/urgent?)

## Fields to Add to Orbidut Form

### Priority 1: Essential FSM Fields
1. **siteName** - Name of the location/facility
2. **siteState** - State/province for address
3. **siteContactName** - On-site contact person
4. **siteContactNumber** - On-site contact phone
5. **accessInstructions** - How to access the site (gate codes, building entry, etc.)
6. **specialRequirements** - Any special requirements or constraints
7. **equipmentNeeded** - Equipment the engineer should bring
8. **bookingType** - full_day, hourly, multi_day
9. **isTimeFlexible** - Can the time be adjusted?

### Priority 2: Optional Enhancement Fields
10. **projectName** - Project or initiative name
11. **changeNumber** - Change management ticket number
12. **incidentNumber** - Incident ticket number
13. **toolsRequired** - Specific tools needed
14. **deviceDetails** - Details about devices to work on
15. **scopeOfWork** - Detailed scope of work
16. **videoConferenceLink** - For remote support/coordination
17. **internalNotes** - Additional notes
18. **downTime** - Is this causing downtime? (urgent flag)

## Implementation Strategy

1. **Keep existing Orbidut fields** - They already work with Google Maps and marketplace pricing
2. **Add Priority 1 fields** - Essential for FSM workflow
3. **Add Priority 2 fields** - Optional but valuable for complex jobs
4. **Organize in sections** - Group fields logically for better UX
5. **Make most fields optional** - Only require critical information
6. **Update backend API** - Ensure createJob mutation accepts all new fields

## Form Sections (Proposed)

1. **Contact Information** (existing)
   - customerName, customerEmail, customerPhone

2. **Service Details** (existing + enhanced)
   - serviceType, description, estimatedDuration
   - bookingType, isTimeFlexible
   - downTime (urgent flag)

3. **Site Location** (existing + enhanced)
   - siteName (NEW)
   - address, city, state (NEW), country, postalCode
   - latitude, longitude, timezone
   - siteContactName (NEW), siteContactNumber (NEW)

4. **Site Access & Requirements** (NEW SECTION)
   - accessInstructions (NEW)
   - specialRequirements (NEW)
   - equipmentNeeded (NEW)
   - toolsRequired (NEW)
   - deviceDetails (NEW)

5. **Project/Ticket Information** (NEW SECTION - Optional)
   - projectName (NEW)
   - changeNumber (NEW)
   - incidentNumber (NEW)
   - scopeOfWork (NEW)
   - videoConferenceLink (NEW)
   - internalNotes (NEW)

6. **Scheduling** (existing)
   - scheduledDate, scheduledTime
   - Display: localTimeDisplay, utcTimeDisplay
