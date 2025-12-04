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
};

export type LegalDocumentType = keyof typeof LEGAL_TEMPLATES;
