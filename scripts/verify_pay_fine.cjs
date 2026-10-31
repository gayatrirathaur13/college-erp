const db = require('../server/config/db');

async function main() {
  try {
    const [res] = await db.query("SELECT routine_name FROM information_schema.routines WHERE routine_name = 'pay_library_fine'");
    console.log('Routine:', res);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

main();
