const { query } = require('../server/config/db');

async function inspectTriggers() {
  try {
    const [routines] = await query(`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_name LIKE '%book%' OR routine_name LIKE '%fine%' OR routine_name LIKE '%payment%'
    `);
    for (const r of routines) {
      console.log(`\n=== ROUTINE: ${r.routine_name} ===`);
      console.log(r.routine_definition);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
inspectTriggers();
