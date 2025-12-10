# Missing Fields Analysis for Verification Review

## Tables Related to Supplier Verification

### 1. `suppliers` table (Basic Info)
| Field | Currently Displayed? | Notes |
|-------|---------------------|-------|
| id | ✅ Yes | Internal |
| companyName | ✅ Yes | |
| contactEmail | ✅ Yes | |
| contactPhone | ✅ Yes | |
| address | ✅ Yes | |
| city | ✅ Yes | |
| country | ✅ Yes | |
| taxId | ✅ Yes | |
| verificationStatus | ❌ NO | Legacy field (use supplierVerification.status instead) |
| isVerified | ❌ NO | Legacy boolean field |
| stripeAccountId | ❌ NO | Payment integration (not relevant for verification review) |
| isActive | ❌ NO | **MISSING - Should show if supplier account is active/inactive** |
| createdAt | ✅ Yes | In timeline |
| updatedAt | ❌ NO | **MISSING - Last updated timestamp** |

### 2. `supplierCompanyProfile` table
| Field | Currently Displayed? | Notes |
|-------|---------------------|-------|
| companyName | ✅ Yes | |
| registrationNumber | ✅ Yes | |
| yearFounded | ✅ Yes | |
| headquarters | ✅ Yes | |
| regionalOffices | ✅ Yes | JSON array |
| ownershipStructure | ✅ Yes | |
| parentCompany | ✅ Yes | |
| missionStatement | ✅ Yes | |
| coreValues | ✅ Yes | |
| companyOverview | ✅ Yes | |
| numberOfEmployees | ✅ Yes | |
| annualRevenue | ✅ Yes | |
| websiteUrl | ✅ Yes | Clickable link |
| linkedInUrl | ✅ Yes | Clickable link |
| primaryContactName | ✅ Yes | |
| primaryContactTitle | ✅ Yes | |
| primaryContactEmail | ✅ Yes | |
| primaryContactPhone | ✅ Yes | |
| createdAt | ❌ NO | **MISSING - Profile creation date** |
| updatedAt | ❌ NO | **MISSING - Profile last updated** |

### 3. `supplierVerification` table
| Field | Currently Displayed? | Notes |
|-------|---------------------|-------|
| status | ✅ Yes | Badge at top |
| submittedAt | ✅ Yes | In timeline |
| reviewedBy | ✅ Yes | Resolved to reviewer name/email |
| reviewedAt | ✅ Yes | In timeline |
| rejectionReason | ✅ Yes | Shown if rejected |
| adminNotes | ✅ Yes | Shown if present |
| approvedAt | ✅ Yes | In timeline |
| createdAt | ❌ NO | **MISSING - Verification record creation** |
| updatedAt | ❌ NO | **MISSING - Last status change** |

### 4. `verificationDocuments` table
| Field | Currently Displayed? | Notes |
|-------|---------------------|-------|
| documentType | ✅ Yes | |
| documentName | ✅ Yes | |
| fileUrl | ✅ Yes | View/download buttons |
| fileKey | ❌ NO | S3 internal (not needed for display) |
| fileSize | ✅ Yes | Formatted (KB/MB) |
| mimeType | ✅ Yes | |
| uploadedAt | ✅ Yes | |
| uploadedBy | ✅ Yes | Resolved to uploader name |
| expiryDate | ✅ Yes | For insurance docs |

### 5. `supplierCoverageCountries` table
| Field | Currently Displayed? | Notes |
|-------|---------------------|-------|
| countryCode | ✅ Yes | |
| isExcluded | ✅ Yes | Shown as badge variant |
| createdAt | ❌ NO | Not critical for review |

### 6. `supplierPriorityCities` table
| Field | Currently Displayed? | Notes |
|-------|---------------------|-------|
| countryCode | ✅ Yes | |
| cityName | ✅ Yes | |
| stateProvince | ✅ Yes | |
| placeId | ❌ NO | Google Maps internal ID (not needed) |
| formattedAddress | ✅ Yes | |
| latitude | ❌ NO | **COULD ADD - Show coordinates** |
| longitude | ❌ NO | **COULD ADD - Show coordinates** |
| createdAt | ❌ NO | Not critical |

### 7. `supplierUsers` table (NOT CURRENTLY FETCHED)
| Field | Should Display? | Notes |
|-------|----------------|-------|
| userId | ❌ NO | **MISSING - List all users associated with supplier** |
| role | ❌ NO | **MISSING - Show supplier_admin vs supplier_tech** |

## Summary of Actually Missing Important Fields

### Critical Missing Fields:
1. **suppliers.isActive** - Whether supplier account is active or suspended
2. **suppliers.updatedAt** - Last modification to supplier record
3. **supplierVerification.createdAt** - When verification process started
4. **supplierVerification.updatedAt** - Last status change timestamp
5. **supplierCompanyProfile.createdAt** - When profile was created
6. **supplierCompanyProfile.updatedAt** - When profile was last updated

### Optional But Useful:
7. **supplierUsers** - List of all users associated with this supplier (with roles)
8. **Priority city coordinates** - lat/long for mapping

### NOT Missing (Already Displayed):
- All contact information (email, phone from both suppliers and profile)
- All company profile fields
- All document metadata
- Coverage areas
- Reviewer information

## Conclusion

The user mentioned "signatories" but there is NO signatory field in the verification tables. The only signatory field (`clientSignatory`) is in `siteVisitReports` which is for job completion, not supplier verification.

**Action Items:**
1. Add isActive status indicator
2. Add all timestamp fields (createdAt/updatedAt for verification and profile)
3. Consider adding supplierUsers list to show all team members
4. Clarify with user what they mean by "signatories" in verification context
