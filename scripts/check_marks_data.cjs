const { query } = require('../server/config/db');

async function checkMarksAndExams() {
  try {
    const [exams] = await query(`SELECT * FROM exam LIMIT 10`);
    console.log('=== EXAMS ===');
    console.log(exams);

    const [schedules] = await query(`SELECT * FROM exam_schedule LIMIT 10`);
    console.log('=== EXAM SCHEDULES ===');
    console.log(schedules);

    const [marksSample] = await query(`SELECT * FROM marks LIMIT 10`);
    console.log('=== MARKS SAMPLE ===');
    console.log(marksSample);

    const [resultsSample] = await query(`SELECT * FROM result LIMIT 10`);
    console.log('=== RESULTS SAMPLE ===');
    console.log(resultsSample);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkMarksAndExams();
