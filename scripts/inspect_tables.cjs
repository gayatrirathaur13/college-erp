const { query } = require('../server/config/db');

async function inspectTables() {
  try {
    const credTables = ['student_credentials', 'faculty_credentials', 'staff_credentials', 'user_account'];
    for (const tbl of credTables) {
      const [cols] = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tbl]);
      console.log(`\n=== ${tbl} COLUMNS ===`);
      console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
      
      const [sample] = await query(`SELECT * FROM ${tbl} LIMIT 3`);
      console.log(`Sample from ${tbl}:`, sample);
    }

    const otherTables = ['marks', 'exam_schedule', 'exam', 'result', 'eligibility', 'job_drive', 'attendance_session', 'attendance_record', 'fine'];
    for (const tbl of otherTables) {
      const [cols] = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tbl]);
      console.log(`\n=== ${tbl} COLUMNS ===`);
      console.log(cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
    }

    // Inspect function definition of trg_marks_grade
    const [func] = await query(`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_name LIKE '%marks%' OR routine_name LIKE '%grade%' OR routine_name LIKE '%eligibility%'
    `);
    console.log('\n=== RELEVANT FUNCTIONS ===');
    for (const f of func) {
      console.log(`Function: ${f.routine_name}`);
      console.log(f.routine_definition);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

inspectTables();
