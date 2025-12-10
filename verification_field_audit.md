# Verification Field Coverage Audit

## Database Tables & Fields

### 1. **suppliers** table
- ✅ id
- ✅ companyName  
- ✅ contactEmail
- ✅ contactPhone
- ❌ address
- ❌ city
- ✅ country
- ❌ taxId
- ❌ verificationStatus (legacy field)
- ❌ isVerified (legacy field)
- ❌ stripeAccountId
- ❌ isActive
- ✅ createdAt
- ❌ updatedAt

### 2. **supplierCompanyProfile** table
- ✅ companyName (duplicate)
- ❌ registrationNumber
- ❌ yearFounded
- ❌ headquarters
- ❌ regionalOffices (JSON array)
- ❌ ownershipStructure (private/group/subsidiary)
- ❌ parentCompany
- ❌ missionStatement
- ❌ coreValues
- ❌ companyOverview
- ❌ numberOfEmployees
- ❌ annualRevenue
- ❌ websiteUrl
- ❌ linkedInUrl
- ❌ primaryContactName
- ❌ primaryContactTitle
- ❌ primaryContactEmail
- ❌ primaryContactPhone

### 3. **supplierVerification** table
- ✅ status
- ✅ submittedAt
- ❌ reviewedBy (user ID)
- ✅ reviewedAt
- ✅ rejectionReason
- ✅ adminNotes
- ✅ approvedAt
- ❌ createdAt
- ❌ updatedAt

### 4. **verificationDocuments** table
- ✅ documentType
- ✅ documentName (as fileUrl display)
- ✅ fileUrl
- ❌ fileKey
- ❌ fileSize
- ❌ mimeType
- ❌ uploadedAt
- ❌ uploadedBy
- ✅ expiryDate

### 5. **supplierCoverageCountries** table
- ❌ NOT FETCHED - Coverage areas not displayed

### 6. **supplierPriorityCities** table  
- ❌ NOT FETCHED - Priority cities not displayed

### 7. **supplierServiceCapabilities** (if exists)
- ❌ NOT FETCHED - Service capabilities not displayed

## Summary

**Currently Displayed:** 15 fields  
**Missing:** 35+ fields

**Missing Critical Information:**
1. **Company Profile** - registrationNumber, yearFounded, headquarters, ownershipStructure, numberOfEmployees, annualRevenue, websiteUrl, linkedInUrl
2. **Company Description** - missionStatement, coreValues, companyOverview  
3. **Primary Contact** - primaryContactName, primaryContactTitle, primaryContactEmail, primaryContactPhone
4. **Address** - address, city from suppliers table
5. **Coverage Areas** - All coverage countries and priority cities
6. **Document Metadata** - fileSize, mimeType, uploadedAt, uploadedBy
7. **Reviewer Info** - reviewedBy user name (only showing ID)

## Recommendation

Need to:
1. Fetch coverage areas and priority cities in getVerificationDetails
2. Add missing supplierCompanyProfile fields to display
3. Add supplier address/city fields
4. Show document metadata (size, upload date, uploader)
5. Resolve reviewedBy user ID to show admin name
6. Display regional offices (JSON field)
7. Add website/LinkedIn links as clickable
