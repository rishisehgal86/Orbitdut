// Sample legal document templates for supplier verification

export const LEGAL_TEMPLATES = {
  dpa: {
    title: "Data Processing Agreement (DPA)",
    content: `
# DATA PROCESSING AGREEMENT

**Effective Date:** [Current Date]

**Between:** Orbidut Ltd ("Data Controller")  
**And:** [Supplier Company Name] ("Data Processor")

## 1. DEFINITIONS

1.1 "Personal Data" means any information relating to an identified or identifiable natural person.

1.2 "Processing" means any operation performed on Personal Data, including collection, storage, use, and disclosure.

1.3 "Data Subject" means the individual to whom Personal Data relates.

## 2. SCOPE AND PURPOSE

2.1 This Agreement governs the Processing of Personal Data by the Data Processor on behalf of the Data Controller in connection with the provision of field service management services.

2.2 The Data Processor shall Process Personal Data only on documented instructions from the Data Controller.

## 3. DATA PROCESSOR OBLIGATIONS

3.1 The Data Processor shall:
- Process Personal Data only as instructed by the Data Controller
- Ensure personnel are bound by confidentiality obligations
- Implement appropriate technical and organizational security measures
- Assist the Data Controller in responding to Data Subject requests
- Notify the Data Controller of any Personal Data breaches within 24 hours

3.2 The Data Processor shall not transfer Personal Data outside the UK/EU without prior written consent.

## 4. SECURITY MEASURES

4.1 The Data Processor shall implement measures including:
- Encryption of Personal Data in transit and at rest
- Regular security assessments and penetration testing
- Access controls and authentication mechanisms
- Secure backup and disaster recovery procedures

## 5. SUB-PROCESSORS

5.1 The Data Processor may engage sub-processors only with prior written authorization from the Data Controller.

5.2 The Data Processor remains fully liable for any sub-processor's acts or omissions.

## 6. DATA SUBJECT RIGHTS

6.1 The Data Processor shall assist the Data Controller in responding to requests from Data Subjects exercising their rights under applicable data protection laws.

## 7. AUDIT RIGHTS

7.1 The Data Controller may audit the Data Processor's compliance with this Agreement upon reasonable notice.

## 8. DATA RETENTION AND DELETION

8.1 Upon termination of services, the Data Processor shall delete or return all Personal Data to the Data Controller within 30 days.

## 9. LIABILITY AND INDEMNIFICATION

9.1 The Data Processor shall indemnify the Data Controller against any losses arising from breach of this Agreement.

## 10. TERM AND TERMINATION

10.1 This Agreement remains in effect for the duration of the service agreement between the parties.

10.2 Either party may terminate this Agreement upon material breach by the other party.

---

**By signing below, the Data Processor acknowledges and agrees to be bound by the terms of this Data Processing Agreement.**

**Supplier Representative:**  
Name: [Auto-filled from profile]  
Title: [To be provided]  
Date: [Auto-filled on signature]  
Signature: [Digital signature]
    `.trim(),
  },
  
  nda: {
    title: "Non-Disclosure Agreement (NDA)",
    content: `
# NON-DISCLOSURE AGREEMENT

**Effective Date:** [Current Date]

**Between:** Orbidut Ltd ("Disclosing Party")  
**And:** [Supplier Company Name] ("Receiving Party")

## 1. DEFINITION OF CONFIDENTIAL INFORMATION

1.1 "Confidential Information" means all information disclosed by the Disclosing Party to the Receiving Party, including but not limited to:
- Customer data, contact information, and service requests
- Business processes, pricing structures, and commercial terms
- Technical information, software, and proprietary systems
- Marketing strategies and business plans
- Any information marked as "Confidential" or reasonably understood to be confidential

## 2. OBLIGATIONS OF RECEIVING PARTY

2.1 The Receiving Party shall:
- Maintain Confidential Information in strict confidence
- Use Confidential Information solely for the purpose of providing services under the service agreement
- Not disclose Confidential Information to third parties without prior written consent
- Protect Confidential Information with the same degree of care used for its own confidential information (but no less than reasonable care)

2.2 The Receiving Party may disclose Confidential Information only to employees, contractors, and advisors who:
- Have a legitimate need to know
- Are bound by confidentiality obligations at least as restrictive as those in this Agreement

## 3. EXCEPTIONS

3.1 Confidential Information does not include information that:
- Is or becomes publicly available through no breach of this Agreement
- Was rightfully in the Receiving Party's possession prior to disclosure
- Is independently developed by the Receiving Party without use of Confidential Information
- Is required to be disclosed by law or court order (with prior notice to Disclosing Party)

## 4. RETURN OF CONFIDENTIAL INFORMATION

4.1 Upon request or termination of the service agreement, the Receiving Party shall:
- Promptly return or destroy all Confidential Information
- Certify in writing that all Confidential Information has been returned or destroyed
- Permanently delete all electronic copies from systems and backups

## 5. NO LICENSE OR OWNERSHIP

5.1 This Agreement does not grant the Receiving Party any license or ownership rights to Confidential Information.

5.2 All Confidential Information remains the sole property of the Disclosing Party.

## 6. REMEDIES

6.1 The Receiving Party acknowledges that breach of this Agreement may cause irreparable harm for which monetary damages are inadequate.

6.2 The Disclosing Party is entitled to seek injunctive relief in addition to any other available remedies.

## 7. TERM

7.1 This Agreement remains in effect for the duration of the service agreement and for 5 years thereafter.

7.2 Confidentiality obligations survive termination of this Agreement.

## 8. MISCELLANEOUS

8.1 This Agreement is governed by the laws of England and Wales.

8.2 Any amendments must be in writing and signed by both parties.

---

**By signing below, the Receiving Party acknowledges and agrees to be bound by the terms of this Non-Disclosure Agreement.**

**Supplier Representative:**  
Name: [Auto-filled from profile]  
Title: [To be provided]  
Date: [Auto-filled on signature]  
Signature: [Digital signature]
    `.trim(),
  },
  
  nonCompete: {
    title: "Non-Compete Agreement",
    content: `
# NON-COMPETE AGREEMENT

**Effective Date:** [Current Date]

**Between:** Orbidut Ltd ("Company")  
**And:** [Supplier Company Name] ("Supplier")

## 1. PURPOSE

1.1 This Agreement protects the Company's legitimate business interests while the Supplier provides field service management services through the Orbidut platform.

## 2. NON-COMPETE OBLIGATIONS

2.1 During the term of the service agreement and for 12 months thereafter, the Supplier agrees not to:

**Direct Customer Solicitation:**
- Directly solicit or accept service requests from customers introduced through the Orbidut platform outside of the platform
- Bypass the Orbidut platform to provide services directly to Orbidut customers
- Encourage Orbidut customers to engage services outside the platform

**Platform Circumvention:**
- Share contact information with customers for the purpose of arranging off-platform services
- Offer discounted rates to customers for services provided outside the platform
- Use customer information obtained through Orbidut for marketing competing services

## 3. PERMITTED ACTIVITIES

3.1 This Agreement does NOT prohibit the Supplier from:
- Providing services through other platforms or marketplaces
- Accepting direct customers not introduced through Orbidut
- Continuing existing customer relationships that pre-date the Orbidut service agreement
- Competing generally in the field service industry

3.2 The restrictions apply only to customers specifically introduced to the Supplier through the Orbidut platform.

## 4. GEOGRAPHIC SCOPE

4.1 This Agreement applies to services provided within the United Kingdom and any other territories where the Supplier provides services through the Orbidut platform.

## 5. CUSTOMER DEFINITION

5.1 "Orbidut Customer" means any customer with whom the Supplier had contact or about whom the Supplier received Confidential Information through the Orbidut platform.

## 6. REASONABLENESS

6.1 The Supplier acknowledges that the restrictions in this Agreement are reasonable and necessary to protect the Company's legitimate business interests.

6.2 The restrictions are limited in scope, duration, and geography to what is reasonably necessary.

## 7. REMEDIES

7.1 Breach of this Agreement may result in:
- Immediate suspension or termination of the Supplier's access to the Orbidut platform
- Injunctive relief to prevent further breaches
- Monetary damages, including disgorgement of profits from prohibited activities
- Recovery of legal fees and costs

## 8. SEVERABILITY

8.1 If any provision of this Agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.

8.2 Any unenforceable provision shall be modified to the minimum extent necessary to make it enforceable.

## 9. SURVIVAL

9.1 The obligations in this Agreement survive termination of the service agreement for the periods specified herein.

## 10. GOVERNING LAW

10.1 This Agreement is governed by the laws of England and Wales.

10.2 The parties submit to the exclusive jurisdiction of the courts of England and Wales.

---

**By signing below, the Supplier acknowledges and agrees to be bound by the terms of this Non-Compete Agreement.**

**Supplier Representative:**  
Name: [Auto-filled from profile]  
Title: [To be provided]  
Date: [Auto-filled on signature]  
Signature: [Digital signature]
    `.trim(),
  },

  backgroundVerification: {
    title: "Background Verification Policy",
    content: `
# BACKGROUND VERIFICATION POLICY

**Effective Date:** [Current Date]

**Between:** Orbidut Ltd ("Company")  
**And:** [Supplier Company Name] ("Supplier")

## 1. PURPOSE

1.1 This Policy establishes the Supplier's commitment to conducting comprehensive background checks on all engineers and personnel assigned to provide services through the Orbidut platform.

1.2 The purpose is to ensure the safety, security, and trustworthiness of all service providers accessing customer premises and sensitive information.

## 2. BACKGROUND CHECK REQUIREMENTS

2.1 The Supplier agrees to conduct the following background checks on ALL engineers before assignment to any Orbidut customer:

**Criminal Background Checks:**
- National criminal record check (DBS check in UK or equivalent)
- Verification of no convictions for theft, fraud, violence, or other relevant offenses
- International criminal checks where applicable

**Employment History Verification:**
- Verification of previous employment for at least the past 5 years
- Confirmation of job titles, dates of employment, and reasons for leaving
- Professional reference checks from at least 2 previous employers

**Identity Verification:**
- Government-issued photo ID verification (passport, driver's license)
- Proof of address verification
- Right to work documentation (see separate Right to Work Policy)

**Professional Qualifications:**
- Verification of claimed certifications, licenses, and qualifications
- Confirmation of technical skills and competencies
- Trade-specific registrations where required

## 3. TIMING AND FREQUENCY

3.1 Background checks must be completed BEFORE an engineer's first assignment through the Orbidut platform.

3.2 Background checks must be renewed every 2 years for ongoing engineers.

3.3 Additional checks may be required if there is reasonable cause for concern.

## 4. RECORD KEEPING

4.1 The Supplier shall maintain records of all background checks for a minimum of 7 years.

4.2 The Supplier shall provide proof of background checks to Orbidut upon request within 48 hours.

4.3 Records must include:
- Date of check
- Type of check performed
- Result/outcome
- Name of checking authority or service used
- Expiry date (where applicable)

## 5. DISQUALIFYING FACTORS

5.1 The Supplier agrees NOT to assign engineers to Orbidut customers if they have:
- Unspent criminal convictions for theft, fraud, violence, or dishonesty
- False or misleading information on their application
- Failed to provide required documentation
- Adverse findings that pose a risk to customer safety or security

## 6. ONGOING MONITORING

6.1 The Supplier shall implement a system to:
- Monitor for any criminal charges or convictions of active engineers
- Respond immediately to any adverse findings
- Remove engineers from the platform if they become ineligible

## 7. SUPPLIER RESPONSIBILITIES

7.1 The Supplier is solely responsible for:
- Costs of all background checks
- Accuracy and completeness of checks
- Compliance with applicable data protection and employment laws
- Making final hiring and assignment decisions

7.2 The Supplier warrants that all background checks are conducted by reputable, accredited checking services.

## 8. AUDIT RIGHTS

8.1 Orbidut reserves the right to:
- Audit the Supplier's background checking procedures
- Request evidence of background checks for any engineer
- Require removal of any engineer who fails to meet standards
- Conduct independent background checks

## 9. NON-COMPLIANCE

9.1 Failure to comply with this Policy may result in:
- Immediate suspension of the Supplier's account
- Termination of the service agreement
- Liability for any damages arising from inadequate background checks
- Reporting to relevant authorities

## 10. LIABILITY AND INDEMNIFICATION

10.1 The Supplier agrees to indemnify and hold harmless Orbidut, its customers, and their property against any claims, damages, or losses arising from:
- Failure to conduct required background checks
- Assignment of engineers who should have been disqualified
- Negligent or inadequate background checking procedures
- Criminal acts or misconduct by engineers

## 11. DATA PROTECTION

11.1 The Supplier shall comply with all applicable data protection laws when conducting background checks.

11.2 Background check information shall be processed lawfully, fairly, and transparently.

## 12. GOVERNING LAW

12.1 This Policy is governed by the laws of England and Wales.

---

**By signing below, the Supplier acknowledges and agrees to comply with this Background Verification Policy and accepts full responsibility for conducting thorough background checks on all engineers.**

**Supplier Representative:**  
Name: [Auto-filled from profile]  
Title: [To be provided]  
Date: [Auto-filled on signature]  
Signature: [Digital signature]
    `.trim(),
  },

  rightToWork: {
    title: "Right to Work Policy",
    content: `
# RIGHT TO WORK POLICY

**Effective Date:** [Current Date]

**Between:** Orbidut Ltd ("Company")  
**And:** [Supplier Company Name] ("Supplier")

## 1. PURPOSE

1.1 This Policy establishes the Supplier's obligation to verify and guarantee that all engineers have legal authorization to work in the countries where they provide services through the Orbidut platform.

1.2 The Supplier accepts full responsibility and liability for any violations of immigration or employment laws.

## 2. RIGHT TO WORK VERIFICATION REQUIREMENTS

2.1 The Supplier shall verify that EVERY engineer has legal authorization to work by:

**For UK-Based Services:**
- Conducting compliant Right to Work checks as required by UK immigration law
- Verifying British citizenship, settled status, or valid work visa
- Checking share codes for those with biometric residence permits
- Maintaining copies of acceptable Right to Work documents

**For International Services:**
- Verifying citizenship or valid work authorization for each country where services are provided
- Ensuring compliance with local immigration and employment laws
- Obtaining necessary work permits, visas, or authorizations
- Verifying that work authorization covers the specific type of service being provided

## 3. ACCEPTABLE DOCUMENTATION

3.1 The Supplier must obtain and verify original documents from List A or List B as specified in UK Right to Work guidance, or equivalent documentation for other jurisdictions.

3.2 Documents must be:
- Original (not photocopies, unless certified)
- Valid and current
- Checked in the physical presence of the engineer (or via approved digital verification)
- Properly recorded with dates and checker details

## 4. TIMING AND FREQUENCY

4.1 Right to Work checks must be completed BEFORE an engineer's first assignment.

4.2 Follow-up checks are required:
- Before expiry of time-limited work authorization
- Every 12 months for engineers with temporary work status
- Immediately upon any change in immigration status

4.3 The Supplier must not assign engineers whose work authorization has expired or is about to expire.

## 5. RECORD KEEPING

5.1 The Supplier shall maintain secure records of all Right to Work checks, including:
- Copies of original documents checked
- Date of check
- Name of person who conducted the check
- Method of verification
- Expiry dates (where applicable)

5.2 Records must be retained for at least 7 years after the engineer's last assignment.

5.3 Records must be provided to Orbidut or relevant authorities within 48 hours upon request.

## 6. GEOGRAPHIC SCOPE

6.1 This Policy applies to ALL countries and jurisdictions where the Supplier provides services through the Orbidut platform.

6.2 The Supplier is responsible for understanding and complying with the specific Right to Work requirements in each jurisdiction.

6.3 The Supplier shall not assign engineers to provide services in any country where they lack legal work authorization.

## 7. CROSS-BORDER SERVICES

7.1 For engineers traveling across borders to provide services, the Supplier must:
- Verify work authorization in both origin and destination countries
- Obtain necessary business visitor permits or work visas
- Comply with tax and social security obligations in all relevant jurisdictions
- Ensure engineers carry proper documentation when traveling

## 8. SUPPLIER WARRANTIES AND REPRESENTATIONS

8.1 The Supplier warrants that:
- All engineers assigned to Orbidut customers have valid Right to Work authorization
- All Right to Work checks are conducted in accordance with applicable laws
- All documentation is genuine and has been properly verified
- No engineer will be assigned if their work authorization is in doubt

## 9. RESPONSIBILITY AND LIABILITY

9.1 The Supplier accepts FULL RESPONSIBILITY AND LIABILITY for:
- Conducting compliant Right to Work checks
- Ensuring all engineers have valid work authorization
- Any civil penalties imposed for employing illegal workers
- Any criminal liability for immigration violations
- Any damages, costs, or losses incurred by Orbidut or its customers
- Legal fees and defense costs arising from immigration violations

9.2 The Supplier is an independent contractor and is solely responsible for the employment status and work authorization of its engineers.

## 10. INDEMNIFICATION

10.1 The Supplier shall indemnify, defend, and hold harmless Orbidut, its officers, directors, employees, customers, and affiliates from and against:
- All claims, penalties, fines, or sanctions related to Right to Work violations
- Government investigations or enforcement actions
- Third-party claims arising from immigration violations
- All costs, expenses, and legal fees incurred

## 11. AUDIT AND INSPECTION RIGHTS

11.1 Orbidut reserves the right to:
- Audit the Supplier's Right to Work checking procedures at any time
- Request proof of work authorization for any engineer
- Require immediate removal of any engineer lacking valid authorization
- Conduct independent verification checks
- Report suspected violations to relevant authorities

## 12. NON-COMPLIANCE CONSEQUENCES

12.1 Failure to comply with this Policy will result in:
- Immediate suspension of the Supplier's account
- Removal of all affected engineers from the platform
- Termination of the service agreement for cause
- Pursuit of all available legal remedies
- Reporting to immigration authorities

12.2 The Supplier shall be liable for all penalties, fines, and damages resulting from non-compliance.

## 13. CHANGES IN WORK AUTHORIZATION

13.1 The Supplier must immediately notify Orbidut if:
- An engineer's work authorization expires or is revoked
- An engineer's immigration status changes
- There is any doubt about an engineer's Right to Work
- The Supplier becomes aware of any immigration violations

## 14. TRAINING AND COMPLIANCE

14.1 The Supplier shall ensure that personnel responsible for Right to Work checks are properly trained and competent.

14.2 The Supplier shall maintain up-to-date knowledge of immigration law requirements in all relevant jurisdictions.

## 15. DATA PROTECTION

15.1 The Supplier shall handle all Right to Work documentation in compliance with applicable data protection laws.

15.2 Documents containing personal data shall be stored securely and accessed only by authorized personnel.

## 16. GOVERNING LAW

16.1 This Policy is governed by the laws of England and Wales.

16.2 Nothing in this Policy limits the Supplier's obligations under the immigration laws of any jurisdiction where services are provided.

---

**By signing below, the Supplier acknowledges and agrees to comply with this Right to Work Policy and accepts FULL RESPONSIBILITY AND LIABILITY for verifying that all engineers have legal authorization to work in the countries where they provide services.**

**Supplier Representative:**  
Name: [Auto-filled from profile]  
Title: [To be provided]  
Date: [Auto-filled on signature]  
Signature: [Digital signature]
    `.trim(),
  },
};

export type LegalDocumentType = keyof typeof LEGAL_TEMPLATES;
