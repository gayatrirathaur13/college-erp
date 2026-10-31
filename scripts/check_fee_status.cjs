const db = require('../server/config/db');

async function main() {
  try {
    const [feeStatus] = await db.query("SELECT DISTINCT status FROM student_fee");
    console.log('Distinct student_fee.status:', feeStatus);

    const [payStatus] = await db.query("SELECT DISTINCT status, payment_status FROM payment");
    console.log('Distinct payment statuses:', payStatus);

    const [sampleFee] = await db.query("SELECT * FROM student_fee LIMIT 5");
    console.log('Sample student_fee:', sampleFee);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
