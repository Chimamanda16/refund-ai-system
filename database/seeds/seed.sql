-- Synthetic seed data. Re-runnable: wipes all application tables first.
-- Dates are relative to NOW() so "older than 30 days" scenarios stay true over time.
-- Scenario -> customer mapping is documented in the README.

TRUNCATE admin_notes, audit_logs, refund_messages, refund_request_items,
         refund_requests, order_items, orders, customers RESTART IDENTITY CASCADE;

INSERT INTO customers (id, name, email, phone, created_at) VALUES
  (1,  'Amara Okafor',     'amara.okafor@example.com',     '+1-555-0101', NOW() - INTERVAL '400 days'),
  (2,  'Daniel Brooks',    'daniel.brooks@example.com',    '+1-555-0102', NOW() - INTERVAL '320 days'),
  (3,  'Priya Nair',       'priya.nair@example.com',       '+1-555-0103', NOW() - INTERVAL '210 days'),
  (4,  'Marcus Chen',      'marcus.chen@example.com',      '+1-555-0104', NOW() - INTERVAL '600 days'),
  (5,  'Sofia Rossi',      'sofia.rossi@example.com',      NULL,          NOW() - INTERVAL '150 days'),
  (6,  'Jordan Whitfield', 'jordan.whitfield@example.com', '+1-555-0106', NOW() - INTERVAL '90 days'),
  (7,  'Elena Petrova',    'elena.petrova@example.com',    '+1-555-0107', NOW() - INTERVAL '260 days'),
  (8,  'Tomás Herrera',    'tomas.herrera@example.com',    '+1-555-0108', NOW() - INTERVAL '500 days'),
  (9,  'Grace Liu',        'grace.liu@example.com',        '+1-555-0109', NOW() - INTERVAL '180 days'),
  (10, 'Oliver Grant',     'oliver.grant@example.com',     NULL,          NOW() - INTERVAL '75 days'),
  (11, 'Fatima Al-Sayed',  'fatima.alsayed@example.com',   '+1-555-0111', NOW() - INTERVAL '240 days'),
  (12, 'Liam O''Connor',   'liam.oconnor@example.com',     '+1-555-0112', NOW() - INTERVAL '30 days'),
  (13, 'Hannah Weber',     'hannah.weber@example.com',     '+1-555-0113', NOW() - INTERVAL '120 days'),
  (14, 'Kenji Tanaka',     'kenji.tanaka@example.com',     '+1-555-0114', NOW() - INTERVAL '365 days'),
  (15, 'Nadia Hassan',     'nadia.hassan@example.com',     '+1-555-0115', NOW() - INTERVAL '200 days');

-- total_amount = SUM(quantity * unit_price) of the order's items.
INSERT INTO orders (id, customer_id, order_number, order_date, status, total_amount, currency) VALUES
  (1,  1,  'ORD-1001', NOW() - INTERVAL '9 days',  'delivered', 89.99,   'USD'),
  (2,  2,  'ORD-1002', NOW() - INTERVAL '12 days', 'delivered', 59.99,   'USD'),
  (3,  3,  'ORD-1003', NOW() - INTERVAL '52 days', 'delivered', 79.00,   'USD'),
  (4,  4,  'ORD-1004', NOW() - INTERVAL '14 days', 'delivered', 1948.99, 'USD'),
  (5,  5,  'ORD-1005', NOW() - INTERVAL '8 days',  'delivered', 74.50,   'USD'),
  (6,  6,  'ORD-1006', NOW() - INTERVAL '16 days', 'delivered', 129.99,  'USD'),
  (7,  7,  'ORD-1007', NOW() - INTERVAL '6 days',  'delivered', 249.00,  'USD'),
  (8,  8,  'ORD-0871', NOW() - INTERVAL '90 days', 'delivered', 59.99,   'USD'),
  (9,  8,  'ORD-0934', NOW() - INTERVAL '55 days', 'delivered', 24.99,   'USD'),
  (10, 8,  'ORD-0966', NOW() - INTERVAL '35 days', 'delivered', 34.00,   'USD'),
  (11, 8,  'ORD-1008', NOW() - INTERVAL '10 days', 'delivered', 44.99,   'USD'),
  (12, 9,  'ORD-1009', NOW() - INTERVAL '11 days', 'delivered', 86.49,   'USD'),
  (13, 10, 'ORD-1010', NOW() - INTERVAL '13 days', 'delivered', 64.00,   'USD'),
  (14, 11, 'ORD-1011', NOW() - INTERVAL '12 days', 'delivered', 39.99,   'USD'),
  (15, 12, 'ORD-1012', NOW() - INTERVAL '4 days',  'cancelled', 42.00,   'USD'),
  (16, 13, 'ORD-1013', NOW() - INTERVAL '10 days', 'delivered', 45.00,   'USD'),
  (17, 14, 'ORD-1014', NOW() - INTERVAL '18 days', 'delivered', 217.99,  'USD'),
  (18, 15, 'ORD-1015', NOW() - INTERVAL '19 days', 'delivered', 93.00,   'USD'),
  (19, 14, 'ORD-1016', NOW() - INTERVAL '3 days',  'shipped',   24.00,   'USD');

INSERT INTO order_items (id, order_id, product_name, sku, quantity, unit_price, is_final_sale) VALUES
  (1,  1,  'Wireless Earbuds Pro',               'AUD-EBP-001',    1, 89.99,   FALSE),
  (2,  2,  'Trail Runner Shoes - Clearance (42)', 'FTW-TRL-CLR-42', 1, 59.99,   TRUE),
  (3,  3,  '12-Speed Countertop Blender',         'KIT-BLD-012',    1, 79.00,   FALSE),
  (4,  4,  '65" OLED Smart TV',                   'TV-OLED-65',     1, 1899.00, FALSE),
  (5,  4,  'Tilting Wall Mount',                  'TV-MNT-TLT',     1, 49.99,   FALSE),
  (6,  5,  'Merino Wool Sweater - Navy / M',      'APP-SWT-NVY-M',  1, 74.50,   FALSE),
  (7,  6,  'Mechanical Gaming Keyboard',          'KEY-MECH-87',    1, 129.99,  FALSE),
  (8,  7,  'Smart Fitness Watch S3',              'WCH-FIT-S3',     1, 249.00,  FALSE),
  (9,  8,  'Bluetooth Speaker Max',               'AUD-SPK-MAX',    1, 59.99,   FALSE),
  (10, 9,  'USB-C Cable 3-Pack',                  'ACC-CBL-C3',     1, 24.99,   FALSE),
  (11, 10, 'Wireless Mouse',                      'ACC-MSE-WL',     1, 34.00,   FALSE),
  (12, 11, 'Portable Charger 20000mAh',           'PWR-BNK-20K',    1, 44.99,   FALSE),
  (13, 12, 'Adjustable Desk Lamp',                'LGT-DSK-01',     1, 34.50,   FALSE),
  (14, 12, 'Notebook Set (3-Pack)',               'STA-NTB-03',     2, 12.00,   FALSE),
  (15, 12, 'USB-C Hub 7-in-1',                    'ACC-HUB-07',     1, 27.99,   FALSE),
  (16, 13, 'Burr Coffee Grinder',                 'KIT-GRD-BUR',    1, 64.00,   FALSE),
  (17, 14, 'Non-Slip Yoga Mat',                   'FIT-YGM-06',     1, 39.99,   FALSE),
  (18, 15, 'Cotton Bath Towel Set',               'HOM-TWL-04',     1, 42.00,   FALSE),
  (19, 16, 'Bluetooth Speaker Mini',              'AUD-SPK-MINI',   1, 45.00,   FALSE),
  (20, 17, 'Ceramic Cookware Set (5-Piece)',      'KIT-CKW-05',     1, 119.00,  FALSE),
  (21, 17, 'Silicone Spatula Set',                'KIT-SPT-03',     1, 14.99,   FALSE),
  (22, 17, 'Chef Knife 8" - Final Sale',          'KIT-KNF-08-FS',  1, 39.00,   TRUE),
  (23, 17, 'Bamboo Cutting Board',                'KIT-CTB-BMB',    2, 22.50,   FALSE),
  (24, 18, 'Aluminium Laptop Stand',              'ACC-LPS-AL',     1, 59.00,   FALSE),
  (25, 18, 'Wireless Mouse',                      'ACC-MSE-WL',     1, 34.00,   FALSE),
  (26, 19, 'Insulated Water Bottle',              'HOM-BTL-INS',    1, 24.00,   FALSE);

-- Historical refund requests: customer 8 (refund history) and customer 15 (escalated).
INSERT INTO refund_requests
  (id, customer_id, order_id, requested_amount, reason, customer_message, status,
   ai_category, ai_confidence, ai_summary, ai_suspicious, policy_result, policy_reason,
   created_at, updated_at) VALUES
  (1, 8, 8, 59.99, 'damaged',
   'The speaker arrived with a cracked grille and the audio crackles at any volume.',
   'approved', 'damaged_item', 0.940, 'Customer reports physical damage and audio defect on arrival.', FALSE,
   'eligible', 'Damaged item reported within 30 days of delivery.',
   NOW() - INTERVAL '82 days', NOW() - INTERVAL '81 days'),
  (2, 8, 9, 24.99, 'not_as_described',
   'The cable does not support the fast-charging speed listed on the product page.',
   'approved', 'not_as_described', 0.880, 'Customer says cable does not meet advertised charging speed.', FALSE,
   'eligible', 'Item not as described, reported within 30 days.',
   NOW() - INTERVAL '48 days', NOW() - INTERVAL '47 days'),
  (3, 8, 10, 34.00, 'changed_mind',
   'I bought a duplicate mouse by mistake and would like to return it.',
   'denied', 'change_of_mind', 0.970, 'Customer bought a duplicate and wants to return it.', FALSE,
   'ineligible', 'Request submitted outside the 30-day return window.',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (4, 15, 18, 59.00, 'damaged',
   'The stand arrived bent and the hinge will not lock. This is the third damaged delivery I have had from you.',
   'escalated', 'damaged_item', 0.580, 'Bent laptop stand reported; claim references repeated damage that is not in our records.', TRUE,
   'needs_review', 'Low AI confidence and suspicious-claim flag; routed to a human reviewer.',
   NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days');

INSERT INTO refund_request_items (id, refund_request_id, order_item_id, requested_quantity, requested_amount) VALUES
  (1, 1, 9,  1, 59.99),
  (2, 2, 10, 1, 24.99),
  (3, 3, 11, 1, 34.00),
  (4, 4, 24, 1, 59.00);

INSERT INTO refund_messages (refund_request_id, sender_type, message, created_at) VALUES
  (1, 'customer', 'The speaker arrived with a cracked grille and the audio crackles at any volume.', NOW() - INTERVAL '82 days'),
  (1, 'system',   'Your refund of $59.99 has been approved.', NOW() - INTERVAL '81 days'),
  (2, 'customer', 'The cable does not support the fast-charging speed listed on the product page.', NOW() - INTERVAL '48 days'),
  (2, 'system',   'Your refund of $24.99 has been approved.', NOW() - INTERVAL '47 days'),
  (3, 'customer', 'I bought a duplicate mouse by mistake and would like to return it.', NOW() - INTERVAL '3 days'),
  (3, 'system',   'Your request was denied because the 30-day return window has passed.', NOW() - INTERVAL '3 days'),
  (4, 'customer', 'The stand arrived bent and the hinge will not lock. This is the third damaged delivery I have had from you.', NOW() - INTERVAL '4 days'),
  (4, 'system',   'Your request has been passed to a specialist for review.', NOW() - INTERVAL '3 days'),
  (4, 'admin',    'Could you send a photo of the stand and the outer packaging?', NOW() - INTERVAL '2 days');

INSERT INTO audit_logs (refund_request_id, actor_type, actor_id, action, previous_status, new_status, reason, metadata, created_at) VALUES
  (1, 'customer', '8',     'refund_request_created', NULL,      'pending',   NULL, '{"source": "seed"}', NOW() - INTERVAL '82 days'),
  (1, 'admin',    'maria', 'refund_approved',        'pending', 'approved',  'Damage confirmed from photos.', '{"source": "seed"}', NOW() - INTERVAL '81 days'),
  (2, 'customer', '8',     'refund_request_created', NULL,      'pending',   NULL, '{"source": "seed"}', NOW() - INTERVAL '48 days'),
  (2, 'admin',    'maria', 'refund_approved',        'pending', 'approved',  'Listing was misleading.', '{"source": "seed"}', NOW() - INTERVAL '47 days'),
  (3, 'customer', '8',     'refund_request_created', NULL,      'pending',   NULL, '{"source": "seed"}', NOW() - INTERVAL '3 days'),
  (3, 'system',   NULL,    'refund_denied',          'pending', 'denied',    'Outside 30-day window.', '{"source": "seed", "days_since_order": 32}', NOW() - INTERVAL '3 days'),
  (4, 'customer', '15',    'refund_request_created', NULL,      'pending',   NULL, '{"source": "seed"}', NOW() - INTERVAL '4 days'),
  (4, 'system',   NULL,    'refund_escalated',       'pending', 'escalated', 'Suspicious-claim flag and low confidence.', '{"source": "seed", "ai_confidence": 0.58}', NOW() - INTERVAL '3 days');

INSERT INTO admin_notes (refund_request_id, admin_name, note, created_at) VALUES
  (3, 'Maria Santos', 'Customer has two prior approved refunds. Denial follows policy; no exception recommended.', NOW() - INTERVAL '2 days'),
  (4, 'Maria Santos', 'No earlier damage claims on this account, so the "third damaged delivery" statement is unverified.', NOW() - INTERVAL '3 days'),
  (4, 'Maria Santos', 'Photos requested. Hold until the customer replies.', NOW() - INTERVAL '2 days');

-- Explicit ids were used above, so move each sequence past the highest id.
SELECT setval(pg_get_serial_sequence('customers', 'id'),             (SELECT MAX(id) FROM customers));
SELECT setval(pg_get_serial_sequence('orders', 'id'),                (SELECT MAX(id) FROM orders));
SELECT setval(pg_get_serial_sequence('order_items', 'id'),           (SELECT MAX(id) FROM order_items));
SELECT setval(pg_get_serial_sequence('refund_requests', 'id'),       (SELECT MAX(id) FROM refund_requests));
SELECT setval(pg_get_serial_sequence('refund_request_items', 'id'),  (SELECT MAX(id) FROM refund_request_items));
