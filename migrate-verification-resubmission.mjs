import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('Starting verification resubmission migration...\n');
  
  // Find suppliers with only 3 legal documents (missing the 2 new ones)
  const [incompleteSuppliers] = await conn.execute(`
    SELECT 
      sv.supplierId,
      s.companyName,
      u.email,
      COUNT(DISTINCT vd.documentType) as docCount
    FROM supplierVerification sv
    JOIN suppliers s ON sv.supplierId = s.id
    LEFT JOIN supplierUsers su ON s.id = su.supplierId
    LEFT JOIN users u ON su.userId = u.id
    LEFT JOIN verificationDocuments vd ON sv.supplierId = vd.supplierId
      AND vd.documentType IN ('dpa_signed', 'nda_signed', 'non_compete_signed', 'background_verification_signed', 'right_to_work_signed')
    WHERE sv.status IN ('pending_review', 'in_progress')
    GROUP BY sv.supplierId, s.companyName, u.email
    HAVING docCount < 5 AND docCount > 0
  `);
  
  console.log(`Found ${incompleteSuppliers.length} suppliers with incomplete legal documents:\n`);
  
  for (const supplier of incompleteSuppliers) {
    console.log(`- ${supplier.companyName} (${supplier.email}): ${supplier.docCount}/5 documents`);
    
    // Update verification status to resubmission_required
    await conn.execute(`
      UPDATE supplierVerification
      SET 
        status = 'resubmission_required',
        rejectionReason = 'New legal documents required',
        adminNotes = 'Two new mandatory legal agreements have been added to the verification process: Background Verification Policy and Right to Work Policy. Please sign these additional documents to complete your verification.',
        reviewedAt = NOW()
      WHERE supplierId = ?
    `, [supplier.supplierId]);
    
    console.log(`  ✓ Updated status to resubmission_required`);
  }
  
  console.log(`\n✅ Migration complete! ${incompleteSuppliers.length} suppliers marked for resubmission.`);
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  await conn.end();
}
