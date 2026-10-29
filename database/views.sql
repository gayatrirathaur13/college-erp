-- =============================================================================
-- UNIVERSITY ERP DATABASE VIEWS (PostgreSQL / Supabase Standard)
-- Relational Views for Reporting, Analytics & Cross-Module Aggregation
-- =============================================================================

-- 1. Student Attendance Summary View
-- Computes real-time subject-wise session count, attendance turnout, and percentage.
CREATE OR REPLACE VIEW v_student_attendance_summary AS
SELECT 
  s.id AS student_id,
  s.roll_no,
  s.name AS student_name,
  d.name AS department_name,
  sec.name AS section_name,
  sub.id AS subject_id,
  sub.code AS subject_code,
  sub.name AS subject_name,
  COUNT(ar.id) AS total_sessions,
  SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS attended_sessions,
  SUM(CASE WHEN ar.status = 'Absent' THEN 1 ELSE 0 END) AS absent_sessions,
  ROUND((SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(ar.id), 0)) * 100, 2) AS attendance_pct
FROM students s
JOIN departments d ON s.department_id = d.id
JOIN sections sec ON s.section_id = sec.id
LEFT JOIN attendance_records ar ON s.id = ar.student_id
LEFT JOIN attendance_sessions ses ON ar.session_id = ses.id
LEFT JOIN subjects sub ON ses.subject_id = sub.id
GROUP BY s.id, s.roll_no, s.name, d.name, sec.name, sub.id, sub.code, sub.name;

-- 2. Student Fee Ledger & Outstanding Balance View
-- Computes total invoices billed, payments received, and pending balances in INR.
CREATE OR REPLACE VIEW v_student_fee_balance AS
SELECT 
  s.id AS student_id,
  s.roll_no,
  s.name AS student_name,
  d.name AS department_name,
  COALESCE(SUM(sf.total_amount), 0) AS total_invoiced,
  COALESCE(SUM(sf.paid_amount), 0) AS total_paid,
  COALESCE(SUM(sf.due_amount), 0) AS outstanding_balance,
  CASE 
    WHEN COALESCE(SUM(sf.due_amount), 0) <= 0 THEN 'Clear'
    WHEN COALESCE(SUM(sf.paid_amount), 0) > 0 THEN 'Partial'
    ELSE 'Due'
  END AS payment_standing
FROM students s
JOIN departments d ON s.department_id = d.id
LEFT JOIN student_fees sf ON s.id = sf.student_id
GROUP BY s.id, s.roll_no, s.name, d.name;

-- 3. Faculty Teaching Workload View
-- Summarizes allocated sections, distinct subjects taught, and total weekly teaching slots.
CREATE OR REPLACE VIEW v_faculty_workload AS
SELECT 
  f.id AS faculty_id,
  f.faculty_code,
  f.name AS faculty_name,
  d.name AS department_name,
  f.designation,
  COUNT(DISTINCT t.section_id) AS sections_count,
  COUNT(DISTINCT t.subject_id) AS subjects_taught,
  COUNT(t.id) AS weekly_lectures_count
FROM faculty f
JOIN departments d ON f.department_id = d.id
LEFT JOIN timetables t ON f.id = t.faculty_id
GROUP BY f.id, f.faculty_code, f.name, d.name, f.designation;

-- 4. Weekly 6-Day Timetable Schedule View (Monday to Saturday, 09:00 AM - 04:00 PM)
CREATE OR REPLACE VIEW v_weekly_timetable AS
SELECT 
  t.id AS timetable_id,
  t.day_of_week,
  t.start_time,
  t.end_time,
  t.room_no,
  t.type AS timetable_type,
  sub.code AS subject_code,
  sub.name AS subject_name,
  f.id AS faculty_id,
  f.name AS faculty_name,
  sec.id AS section_id,
  sec.name AS section_name
FROM timetables t
JOIN subjects sub ON t.subject_id = sub.id
JOIN faculty f ON t.faculty_id = f.id
JOIN sections sec ON t.section_id = sec.id
ORDER BY 
  CASE t.day_of_week 
    WHEN 'Monday' THEN 1 
    WHEN 'Tuesday' THEN 2 
    WHEN 'Wednesday' THEN 3 
    WHEN 'Thursday' THEN 4 
    WHEN 'Friday' THEN 5 
    WHEN 'Saturday' THEN 6 
    ELSE 7 
  END, 
  t.start_time;

-- 5. Active Faculty Enrolled Scholars View
CREATE OR REPLACE VIEW v_faculty_enrolled_students AS
SELECT 
  s.id AS student_id,
  s.roll_no,
  s.name AS student_name,
  s.email,
  s.gender,
  s.attendance_pct,
  s.sgpa,
  s.cgpa,
  s.fees_due,
  s.placement_status,
  sec.id AS section_id,
  sec.name AS section_name,
  d.id AS department_id,
  d.name AS department_name
FROM students s
JOIN sections sec ON s.section_id = sec.id
JOIN departments d ON s.department_id = d.id;

-- 6. Library Overdue Books View
-- Identifies unreturned book loans past due date with daily fine accrual calculation in PostgreSQL.
CREATE OR REPLACE VIEW v_library_overdue_books AS
SELECT 
  bi.id AS issue_id,
  s.id AS student_id,
  s.roll_no,
  s.name AS student_name,
  s.email AS student_email,
  b.title AS book_title,
  b.isbn,
  bi.issue_date,
  bi.due_date,
  GREATEST(0, (CURRENT_DATE - bi.due_date)) AS days_overdue,
  GREATEST(0, (CURRENT_DATE - bi.due_date) * 5) AS estimated_fine_inr
FROM book_issues bi
JOIN books b ON bi.book_id = b.id
JOIN students s ON bi.student_id = s.id
WHERE bi.status = 'Issued' AND bi.due_date < CURRENT_DATE;
