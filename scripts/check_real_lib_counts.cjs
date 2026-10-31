const db = require('../server/config/db');

async function main() {
  try {
    const [[books]] = await db.query("SELECT COUNT(*) AS c FROM book");
    const [[copies]] = await db.query("SELECT COUNT(*) AS c FROM book_copy");
    const [[availCopies]] = await db.query("SELECT COUNT(*) AS c FROM book_copy WHERE status = 'Available'");
    const [[activeIssues]] = await db.query("SELECT COUNT(*) AS c FROM book_issue WHERE status = 'Issued' OR issue_status = 'Issued'");
    const [[overdueIssues]] = await db.query("SELECT COUNT(*) AS c FROM book_issue WHERE (status = 'Issued' OR issue_status = 'Issued') AND due_date < CURRENT_DATE");
    const [[finesCount]] = await db.query("SELECT COUNT(*) AS c, SUM(fine_amount) AS total FROM fine WHERE payment_status = 'Pending'");

    console.log({
      books: books.c,
      copies: copies.c,
      availCopies: availCopies.c,
      activeIssues: activeIssues.c,
      overdueIssues: overdueIssues.c,
      finesCount: finesCount.c,
      finesTotal: finesCount.total
    });

    const [sampleOverdue] = await db.query(`
      SELECT bi.issue_id, bi.student_id, bi.copy_id, bi.issue_date, bi.due_date, bi.status, bi.issue_status,
             s.student_name, s.roll_no, b.title, b.isbn, bc.accession_no,
             f.fine_id, f.fine_amount, f.payment_status AS fine_payment_status
      FROM book_issue bi
      JOIN student s ON bi.student_id = s.student_id
      JOIN book_copy bc ON bi.copy_id = bc.copy_id
      JOIN book b ON bc.isbn = b.isbn
      LEFT JOIN fine f ON bi.issue_id = f.issue_id
      WHERE (bi.status = 'Issued' OR bi.issue_status = 'Issued') AND bi.due_date < CURRENT_DATE
      LIMIT 10
    `);
    console.log('Sample overdue with fine info:', sampleOverdue);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
