const { query } = require('../server/config/db');

async function inspectLib() {
  try {
    const libTables = ['book', 'book_copy', 'book_issue', 'book_return', 'fine', 'librarian'];
    for (const tbl of libTables) {
      const [cols] = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tbl]);
      console.log(`\n=== ${tbl} COLUMNS ===`);
      console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
      const [sample] = await query(`SELECT * FROM ${tbl} LIMIT 2`);
      console.log(`Sample:`, sample);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
inspectLib();
