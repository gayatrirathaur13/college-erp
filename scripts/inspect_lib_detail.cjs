const db = require('../server/config/db');

async function main() {
  try {
    const [retCols] = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'book_return' ORDER BY ordinal_position");
    console.log('Book Return columns:', retCols);

    const [copyCols] = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'book_copy' ORDER BY ordinal_position");
    console.log('Book Copy columns:', copyCols);

    const [fines] = await db.query("SELECT * FROM fine LIMIT 5");
    console.log('Sample fine:', fines);

    const [issues] = await db.query("SELECT * FROM book_issue LIMIT 5");
    console.log('Sample book_issue:', issues);

    const [payLibFine] = await db.query("SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_name ILIKE '%fine%'");
    console.log('Fine routines:', payLibFine);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
