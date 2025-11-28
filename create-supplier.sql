-- Get the user ID
SET @user_id = (SELECT id FROM users WHERE email = 'supplier@test.com');

-- Create supplier
INSERT INTO suppliers (companyName, contactEmail, contactPhone, country, verificationStatus, isActive)
VALUES ('Test Engineering Co', 'supplier@test.com', '+1234567890', 'US', 'verified', 1);

-- Get the supplier ID
SET @supplier_id = LAST_INSERT_ID();

-- Link user to supplier
INSERT INTO supplier_users (userId, supplierId, role)
VALUES (@user_id, @supplier_id, 'owner');

SELECT 'Supplier profile created successfully!' as message;
