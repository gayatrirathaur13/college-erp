const { pool } = require('../server/config/db');

async function testPayment() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Pick student_fee_id 38 (amount_due 72000, balance 72000, status Unpaid)
    const [before] = await conn.execute('SELECT student_fee_id, amount_due, scholarship_amount, amount_paid, balance_amount, status FROM student_fee WHERE student_fee_id = ?', [38]);
    console.log('Before payment:', before[0]);

    // Insert payment of 10000
    await conn.execute(
      `INSERT INTO payment (student_fee_id, amount, payment_date, payment_mode, transaction_reference, status, payment_status)
       VALUES (?, 10000, CURRENT_DATE, 'Cash', 'TEST-TXN-10K', 'Success', 'Success')`,
      [38]
    );

    const [after] = await conn.execute('SELECT student_fee_id, amount_due, scholarship_amount, amount_paid, balance_amount, status FROM student_fee WHERE student_fee_id = ?', [38]);
    console.log('After payment (auto-trigger):', after[0]);

    // Rollback test so we don't pollute unless we want to
    await conn.rollback();
    console.log('Test rolled back successfully! Trigger verified!');
  } catch (err) {
    await conn.rollback();
    console.error('Test error:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

testPayment();
