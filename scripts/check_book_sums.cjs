const db = require('../server/config/db');

async function main() {
  try {
    const [[bookSums]] = await db.query("SELECT COUNT(*) as titles, SUM(total_copies) as total_c, SUM(available_copies) as avail_c FROM book");
    console.log('Book sums:', bookSums);

    const [[copySums]] = await db.query("SELECT COUNT(*) as copies, COUNT(*) FILTER (WHERE status = 'Available') as avail_copies FROM book_copy");
    console.log('Copy sums:', copySums);

    const [[issueSums]] = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE issue_status = 'Issued' OR status = 'Issued') as active_issues,
        COUNT(*) FILTER (WHERE (issue_status = 'Issued' OR status = 'Issued') AND due_date < CURRENT_DATE) as overdue_issues,
        COUNT(*) FILTER (WHERE issue_status = 'Returned' OR status = 'Returned') as returned_issues
      FROM book_issue
    `);
    console.log('Issue sums:', issueSums);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
