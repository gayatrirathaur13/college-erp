const db = require('../server/config/db');

async function main() {
  try {
    const [payCols] = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payment' ORDER BY ordinal_position");
    console.log('Payment columns:', payCols);

    const [feeCols] = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_fee' ORDER BY ordinal_position");
    console.log('Student Fee columns:', feeCols);

    const [trigs] = await db.query("SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers WHERE event_object_table IN ('payment', 'student_fee')");
    console.log('Triggers:', trigs);

    const [routines] = await db.query("SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_name ILIKE '%payment%'");
    console.log('Routines:', routines);

    const [bookCols] = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'book' ORDER BY ordinal_position");
    console.log('Book columns:', bookCols);

    const [issueCols] = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'book_issue' ORDER BY ordinal_position");
    console.log('Book Issue columns:', issueCols);

    const [fineCols] = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'fine' ORDER BY ordinal_position");
    console.log('Fine columns:', fineCols);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
