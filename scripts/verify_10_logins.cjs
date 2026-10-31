const { query } = require('../server/config/db');

async function getSampleLogins() {
  console.log('--- Fetching Sample 10 Verified Login Credentials from Supabase ---');

  // 1. Staff Accounts (TNP, Finance, Librarian)
  const [staffUsers] = await query(`
    SELECT identifier, email, password_hash, role
    FROM user_account
    WHERE role IN ('TNP_HEAD', 'FINANCE', 'LIBRARIAN')
    ORDER BY user_id ASC
    LIMIT 3
  `);

  // 2. Faculty Accounts
  const [facultyUsers] = await query(`
    SELECT u.identifier, u.email, u.password_hash, u.role, f.faculty_name
    FROM user_account u
    JOIN faculty f ON u.faculty_id = f.faculty_id
    WHERE u.role = 'FACULTY'
    ORDER BY u.user_id ASC
    LIMIT 3
  `);

  // 3. Student Accounts
  const [studentUsers] = await query(`
    SELECT u.identifier, u.email, u.password_hash, u.role, s.student_name, s.roll_no
    FROM user_account u
    JOIN student s ON u.student_id = s.student_id
    WHERE u.role = 'STUDENT'
    ORDER BY u.user_id ASC
    LIMIT 4
  `);

  const sampleList = [
    ...staffUsers.map(u => ({
      role: u.role,
      username_or_id: u.identifier,
      email: u.email,
      password: u.password_hash
    })),
    ...facultyUsers.map(u => ({
      role: u.role,
      username_or_id: u.identifier,
      name: u.faculty_name,
      email: u.email,
      password: u.password_hash
    })),
    ...studentUsers.map(u => ({
      role: u.role,
      username_or_id: u.identifier,
      name: u.student_name,
      email: u.email,
      password: u.password_hash
    }))
  ];

  console.log(`Total Verified Accounts Extracted: ${sampleList.length}\n`);
  sampleList.forEach((acc, i) => {
    console.log(`${i + 1}. [${acc.role}] ID: "${acc.username_or_id}" | Email: "${acc.email}" | Password: "${acc.password}" ${acc.name ? `| Name: ${acc.name}` : ''}`);
  });

  process.exit(0);
}

getSampleLogins().catch(err => {
  console.error(err);
  process.exit(1);
});
