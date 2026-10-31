const { query } = require('../server/config/db');

async function checkCounts() {
  try {
    const [appCount] = await query("SELECT COUNT(*) FROM application");
    console.log('Total applications in DB:', appCount);

    const [plcCount] = await query("SELECT status, COUNT(*) FROM placement GROUP BY status");
    console.log('Placements by status in DB:', plcCount);

    const [driveCount] = await query("SELECT status, COUNT(*) FROM job_drive GROUP BY status");
    console.log('Drives by status in DB:', driveCount);

    const [feeCount] = await query("SELECT status, COUNT(*), SUM(amount_due) as due, SUM(amount_paid) as paid FROM student_fee GROUP BY status");
    console.log('Fees by status:', feeCount);

    const [libCount] = await query("SELECT COUNT(DISTINCT book_id) as books FROM book");
    console.log('Distinct books:', libCount);
    const [copyCount] = await query("SELECT status, COUNT(*) FROM book_copy GROUP BY status");
    console.log('Book copies by status:', copyCount);
    const [issueCount] = await query("SELECT status, COUNT(*) FROM book_issue GROUP BY status");
    console.log('Book issues by status:', issueCount);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkCounts();
