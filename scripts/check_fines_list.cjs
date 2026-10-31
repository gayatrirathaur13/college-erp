const db = require('../server/config/db');

async function main() {
  try {
    const [fines] = await db.query(`
      SELECT f.fine_id, f.student_id, f.issue_id, f.fine_type, f.fine_amount, f.fine_date, f.paid_date, f.payment_status,
             s.student_name, s.roll_no,
             bi.due_date, b.title
      FROM fine f
      JOIN student s ON f.student_id = s.student_id
      LEFT JOIN book_issue bi ON f.issue_id = bi.issue_id
      LEFT JOIN book_copy bc ON bi.copy_id = bc.copy_id
      LEFT JOIN book b ON bc.isbn = b.isbn
      ORDER BY f.fine_id DESC
      LIMIT 10
    `);
    console.log('Recent fines in DB:', fines);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
