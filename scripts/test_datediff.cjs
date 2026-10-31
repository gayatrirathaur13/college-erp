const db = require('../server/config/db');

async function main() {
  try {
    const [res] = await db.query("SELECT DATEDIFF(CURRENT_DATE, CURRENT_DATE - 5) as diff");
    console.log('DATEDIFF test:', res);
  } catch (err) {
    console.log('DATEDIFF error:', err.message);
  }
  process.exit(0);
}

main();
