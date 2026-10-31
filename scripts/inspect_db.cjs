const { query } = require('../server/config/db');

async function inspect() {
  try {
    const [tables] = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('=== TABLES IN SUPABASE ===');
    console.log(tables.map(r => r.table_name).join(', '));

    const [triggers] = await query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      ORDER BY event_object_table, trigger_name
    `);
    console.log('\n=== TRIGGERS IN SUPABASE ===');
    triggers.forEach(t => {
      console.log(`${t.event_object_table} -> ${t.trigger_name} (${t.event_manipulation})`);
    });

    // Check credentials sample across roles
    const [creds] = await query(`
      SELECT user_id, username, password, email, role, is_active 
      FROM user_account 
      LIMIT 15
    `);
    console.log('\n=== SAMPLE CREDENTIALS ===');
    console.log(JSON.stringify(creds, null, 2));

    // Also check marks columns
    const [marksCols] = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'marks'
    `);
    console.log('\n=== MARKS COLUMNS ===');
    console.log(marksCols.map(c => `${c.column_name}: ${c.data_type}`).join(', '));

    // Check exam_schedule / exam
    const [examCols] = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'exam_schedule'
    `);
    console.log('\n=== EXAM_SCHEDULE COLUMNS ===');
    console.log(examCols.map(c => `${c.column_name}: ${c.data_type}`).join(', '));

    // Check result
    const [resultCols] = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'result'
    `);
    console.log('\n=== RESULT COLUMNS ===');
    console.log(resultCols.map(c => `${c.column_name}: ${c.data_type}`).join(', '));

    // Check eligibility
    const [eligCols] = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'eligibility'
    `);
    console.log('\n=== ELIGIBILITY COLUMNS ===');
    console.log(eligCols.map(c => `${c.column_name}: ${c.data_type}`).join(', '));

    // Check job_drive
    const [driveCols] = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_drive'
    `);
    console.log('\n=== JOB_DRIVE COLUMNS ===');
    console.log(driveCols.map(c => `${c.column_name}: ${c.data_type}`).join(', '));

    // Check attendance_session
    const [attSessCols] = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_session'
    `);
    console.log('\n=== ATTENDANCE_SESSION COLUMNS ===');
    console.log(attSessCols.map(c => `${c.column_name}: ${c.data_type}`).join(', '));

    // Check if leave_application exists
    const [leaveTables] = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%leave%'
    `);
    console.log('\n=== LEAVE TABLES ===');
    console.log(leaveTables);

    // Check fine table
    const [fineCols] = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fine'
    `);
    console.log('\n=== FINE COLUMNS ===');
    console.log(fineCols.map(c => `${c.column_name}: ${c.data_type}`).join(', '));

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    process.exit(0);
  }
}

inspect();
