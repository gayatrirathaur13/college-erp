const { query } = require('../server/config/db');

async function run() {
  try {
    const [res] = await query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'faculty_leave')");
    console.log('faculty_leave exists:', res);

    if (res[0]?.exists) {
      const [rows] = await query("SELECT * FROM faculty_leave LIMIT 5");
      console.log('faculty_leave rows:', rows);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
