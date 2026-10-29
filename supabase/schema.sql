-- =============================================================================
-- UNIVERSITY ERP — MASTER SUPABASE (POSTGRESQL) SCHEMA
-- Includes all core tables, RLS, PostgreSQL Triggers, Stored Functions & Varied Seed Data
-- Run this complete script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. MASTER TABLES: Departments, Designations, Semesters, Courses, Sections
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS faculty_payrolls CASCADE;
DROP TABLE IF EXISTS faculty_leaves CASCADE;
DROP TABLE IF EXISTS placements CASCADE;
DROP TABLE IF EXISTS placement_applications CASCADE;
DROP TABLE IF EXISTS placement_drives CASCADE;
DROP TABLE IF EXISTS placement_companies CASCADE;
DROP TABLE IF EXISTS book_issues CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS finance_fines CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS student_fees CASCADE;
DROP TABLE IF EXISTS fee_structures CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS exam_applications CASCADE;
DROP TABLE IF EXISTS exam_schedules CASCADE;
DROP TABLE IF EXISTS attendance_summaries CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS academic_semesters CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  branch_code VARCHAR(10) NOT NULL UNIQUE,
  hod_name VARCHAR(100),
  location VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE academic_semesters (
  id SERIAL PRIMARY KEY,
  semester_number INT NOT NULL,
  semester_name VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Ongoing'
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  course_type VARCHAR(20) DEFAULT 'UG',
  duration_years INT DEFAULT 4,
  total_credits INT DEFAULT 160
);

CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  department_id INT REFERENCES departments(id) ON DELETE CASCADE,
  semester_id INT REFERENCES academic_semesters(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 4,
  subject_type VARCHAR(30) DEFAULT 'Theory'
);

-- -----------------------------------------------------------------------------
-- 2. FACULTY, STAFF & STUDENTS
-- -----------------------------------------------------------------------------

CREATE TABLE faculty (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  faculty_code VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(100) DEFAULT 'Associate Professor',
  joining_date DATE DEFAULT '2021-08-01',
  status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  staff_code VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL, -- 'TNP_HEAD', 'FINANCE', 'LIBRARIAN'
  department VARCHAR(100) DEFAULT 'Administration',
  phone VARCHAR(20)
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(30) NOT NULL UNIQUE,
  prn VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  course_id INT REFERENCES courses(id) ON DELETE SET NULL,
  section_id INT REFERENCES sections(id) ON DELETE SET NULL,
  current_semester INT DEFAULT 5,
  gender VARCHAR(10) DEFAULT 'Other',
  date_of_birth DATE,
  admission_year INT DEFAULT 2023,
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(20),
  address TEXT,
  -- Cached summary fields kept real-time via triggers
  attendance_pct NUMERIC(5,2) DEFAULT 0.00,
  sgpa NUMERIC(4,2) DEFAULT 0.00,
  cgpa NUMERIC(4,2) DEFAULT 0.00,
  fees_due NUMERIC(10,2) DEFAULT 0.00,
  placement_status VARCHAR(50) DEFAULT 'Eligible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User accounts for Supabase & RBAC authentication
CREATE TABLE user_accounts (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL, -- 'STUDENT', 'FACULTY', 'TNP_HEAD', 'FINANCE', 'LIBRARIAN', 'ADMIN'
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  staff_id INT REFERENCES staff(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 3. ATTENDANCE MODULE
-- -----------------------------------------------------------------------------

CREATE TABLE attendance_sessions (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  section_id INT REFERENCES sections(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  period VARCHAR(50) NOT NULL,
  topic VARCHAR(200) DEFAULT 'Curriculum Session',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'Present', -- 'Present', 'Absent'
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
);

CREATE TABLE attendance_summaries (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  total_classes INT NOT NULL DEFAULT 0,
  classes_attended INT NOT NULL DEFAULT 0,
  classes_absent INT NOT NULL DEFAULT 0,
  attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_summary_student_subject UNIQUE (student_id, subject_id)
);

-- -----------------------------------------------------------------------------
-- 4. EXAMINATIONS & RESULTS MODULE
-- -----------------------------------------------------------------------------

CREATE TABLE exam_schedules (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type VARCHAR(50) NOT NULL DEFAULT 'Midterm', -- 'Unit Test', 'Midterm', 'End-Semester', 'Practical'
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_no VARCHAR(50) DEFAULT 'AB-301',
  max_marks INT NOT NULL DEFAULT 100
);

CREATE TABLE exam_applications (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'Regular', -- 'Regular', 'Revaluation', 'Backlog'
  semester VARCHAR(20) NOT NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
  fee_status VARCHAR(30) DEFAULT 'Paid',
  approval_status VARCHAR(30) DEFAULT 'Approved',
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  schedule_id INT REFERENCES exam_schedules(id) ON DELETE SET NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_marks NUMERIC(5,2) NOT NULL DEFAULT 100,
  grade_letter VARCHAR(5) DEFAULT 'A',
  grade_point INT DEFAULT 8,
  status VARCHAR(20) DEFAULT 'Present',
  CONSTRAINT uq_student_subject_schedule UNIQUE (student_id, subject_id, schedule_id)
);

CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  semester_id INT REFERENCES academic_semesters(id) ON DELETE CASCADE,
  semester_number INT NOT NULL,
  sgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  total_credits INT NOT NULL DEFAULT 24,
  earned_credits INT NOT NULL DEFAULT 24,
  overall_status VARCHAR(20) NOT NULL DEFAULT 'Pass',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_result_student_sem UNIQUE (student_id, semester_id)
);

-- -----------------------------------------------------------------------------
-- 5. FEES & FINANCE MODULE
-- -----------------------------------------------------------------------------

CREATE TABLE fee_structures (
  id SERIAL PRIMARY KEY,
  course_id INT REFERENCES courses(id) ON DELETE CASCADE,
  semester_id INT REFERENCES academic_semesters(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL DEFAULT 'Tuition & Development Fee',
  total_amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL
);

CREATE TABLE student_fees (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  semester_id INT REFERENCES academic_semesters(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL DEFAULT 'Tuition Fee',
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  due_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'Unpaid', -- 'Paid', 'Partially Paid', 'Unpaid'
  due_date DATE NOT NULL,
  CONSTRAINT uq_student_fee_sem UNIQUE (student_id, semester_id, category)
);

CREATE TABLE fee_payments (
  id SERIAL PRIMARY KEY,
  student_fee_id INT REFERENCES student_fees(id) ON DELETE CASCADE,
  receipt_no VARCHAR(50) NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL DEFAULT 'Online Gateway (UPI/NetBanking)',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Success',
  recorded_by VARCHAR(100) DEFAULT 'Finance Office'
);

CREATE TABLE finance_fines (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  fine_type VARCHAR(50) NOT NULL, -- 'Library Overdue', 'Late Fee', 'Laboratory'
  amount NUMERIC(10,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. LIBRARY MODULE
-- -----------------------------------------------------------------------------

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
  total_copies INT NOT NULL DEFAULT 5,
  available_copies INT NOT NULL DEFAULT 5,
  shelf_location VARCHAR(50) DEFAULT 'Shelf A-4, Rack 2',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE book_issues (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  book_id INT REFERENCES books(id) ON DELETE CASCADE,
  accession_no VARCHAR(50) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  returned_date DATE,
  fine_amount NUMERIC(8,2) DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'Issued' -- 'Issued', 'Returned', 'Overdue'
);

-- -----------------------------------------------------------------------------
-- 7. TRAINING & PLACEMENT (TNP) MODULE
-- -----------------------------------------------------------------------------

CREATE TABLE placement_companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  industry VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  website VARCHAR(150),
  contact_email VARCHAR(100)
);

CREATE TABLE placement_drives (
  id SERIAL PRIMARY KEY,
  company_id INT REFERENCES placement_companies(id) ON DELETE CASCADE,
  job_role VARCHAR(100) NOT NULL,
  package_lpa NUMERIC(6,2) NOT NULL,
  min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 6.50,
  job_type VARCHAR(50) NOT NULL DEFAULT 'Full-Time',
  drive_date DATE NOT NULL,
  deadline DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Ongoing' -- 'Upcoming', 'Ongoing', 'Completed'
);

CREATE TABLE placement_applications (
  id SERIAL PRIMARY KEY,
  drive_id INT REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Applied', -- 'Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'
  interview_date DATE,
  CONSTRAINT uq_drive_student UNIQUE (drive_id, student_id)
);

CREATE TABLE placements (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  company_id INT REFERENCES placement_companies(id) ON DELETE CASCADE,
  drive_id INT REFERENCES placement_drives(id) ON DELETE SET NULL,
  package_lpa NUMERIC(6,2) NOT NULL,
  offer_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- -----------------------------------------------------------------------------
-- 8. TIMETABLE, FACULTY LEAVE & PAYROLL
-- -----------------------------------------------------------------------------

CREATE TABLE timetables (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  section_id INT REFERENCES sections(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_no VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'Lecture'
);

CREATE TABLE faculty_leaves (
  id SERIAL PRIMARY KEY,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL DEFAULT 'Casual Leave',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  cover_faculty VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'Approved',
  applied_on DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE faculty_payrolls (
  id SERIAL PRIMARY KEY,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  month VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  basic_salary NUMERIC(10,2) NOT NULL,
  allowances NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  deductions NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_salary NUMERIC(10,2) NOT NULL,
  disbursement_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Credited'
);

-- =============================================================================
-- POSTGRESQL TRIGGERS & PROCEDURES (CROSS-MODULE AUTOMATIC SYNCHRONIZATION)
-- =============================================================================

-- TRIGGER 1: Real-time Attendance Summary & Percentage Sync
CREATE OR REPLACE FUNCTION fn_update_attendance_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_subject_id INT;
  v_student_id INT;
  v_total INT;
  v_attended INT;
  v_absent INT;
  v_pct NUMERIC(5,2);
  v_overall_pct NUMERIC(5,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT subject_id INTO v_subject_id FROM attendance_sessions WHERE id = OLD.session_id;
    v_student_id := OLD.student_id;
  ELSE
    SELECT subject_id INTO v_subject_id FROM attendance_sessions WHERE id = NEW.session_id;
    v_student_id := NEW.student_id;
  END IF;

  -- Count total classes & attended for this student and subject
  SELECT 
    COUNT(ar.id),
    COUNT(ar.id) FILTER (WHERE ar.status = 'Present'),
    COUNT(ar.id) FILTER (WHERE ar.status = 'Absent')
  INTO v_total, v_attended, v_absent
  FROM attendance_records ar
  JOIN attendance_sessions s ON ar.session_id = s.id
  WHERE ar.student_id = v_student_id AND s.subject_id = v_subject_id;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_attended::NUMERIC / v_total::NUMERIC) * 100, 2) ELSE 0.00 END;

  -- Upsert into attendance_summaries
  INSERT INTO attendance_summaries (student_id, subject_id, total_classes, classes_attended, classes_absent, attendance_percentage, last_updated)
  VALUES (v_student_id, v_subject_id, v_total, v_attended, v_absent, v_pct, NOW())
  ON CONFLICT (student_id, subject_id)
  DO UPDATE SET
    total_classes = EXCLUDED.total_classes,
    classes_attended = EXCLUDED.classes_attended,
    classes_absent = EXCLUDED.classes_absent,
    attendance_percentage = EXCLUDED.attendance_percentage,
    last_updated = NOW();

  -- Recalculate student's global attendance percentage
  SELECT COALESCE(ROUND(AVG(attendance_percentage), 2), 0.00)
  INTO v_overall_pct
  FROM attendance_summaries
  WHERE student_id = v_student_id;

  UPDATE students
  SET attendance_pct = v_overall_pct
  WHERE id = v_student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_attendance_record_sync
AFTER INSERT OR UPDATE OR DELETE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION fn_update_attendance_summary();

-- TRIGGER 2: Real-time Grade, SGPA and CGPA Calculation on Marks Entry
CREATE OR REPLACE FUNCTION fn_recalculate_student_result()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id INT;
  v_sem_id INT;
  v_sem_num INT;
  v_total_points NUMERIC(8,2) := 0;
  v_total_credits INT := 0;
  v_sgpa NUMERIC(4,2) := 0.00;
  v_cgpa NUMERIC(4,2) := 0.00;
  v_fail_count INT := 0;
BEGIN
  v_student_id := NEW.student_id;

  -- Derive grade letter & points from score
  IF NEW.marks_obtained >= 90 THEN
    NEW.grade_letter := 'O'; NEW.grade_point := 10;
  ELSIF NEW.marks_obtained >= 80 THEN
    NEW.grade_letter := 'A+'; NEW.grade_point := 9;
  ELSIF NEW.marks_obtained >= 70 THEN
    NEW.grade_letter := 'A'; NEW.grade_point := 8;
  ELSIF NEW.marks_obtained >= 60 THEN
    NEW.grade_letter := 'B+'; NEW.grade_point := 7;
  ELSIF NEW.marks_obtained >= 50 THEN
    NEW.grade_letter := 'B'; NEW.grade_point := 6;
  ELSIF NEW.marks_obtained >= 40 THEN
    NEW.grade_letter := 'C'; NEW.grade_point := 5;
  ELSE
    NEW.grade_letter := 'F'; NEW.grade_point := 0;
  END IF;

  -- Get current semester info
  SELECT current_semester, current_semester INTO v_sem_num, v_sem_id FROM students WHERE id = v_student_id;

  -- Compute semester SGPA
  SELECT 
    COALESCE(SUM(s.credits * m.grade_point), 0),
    COALESCE(SUM(s.credits), 1),
    COUNT(m.id) FILTER (WHERE m.grade_letter = 'F')
  INTO v_total_points, v_total_credits, v_fail_count
  FROM marks m
  JOIN subjects s ON m.subject_id = s.id
  WHERE m.student_id = v_student_id;

  IF v_total_credits > 0 THEN
    v_sgpa := ROUND(v_total_points / v_total_credits, 2);
  END IF;

  -- Upsert results table
  INSERT INTO results (student_id, semester_id, semester_number, sgpa, cgpa, total_credits, earned_credits, overall_status, published_at)
  VALUES (v_student_id, v_sem_id, v_sem_num, v_sgpa, v_sgpa, v_total_credits, CASE WHEN v_fail_count > 0 THEN v_total_credits - 4 ELSE v_total_credits END, CASE WHEN v_fail_count = 0 THEN 'Pass' ELSE 'Fail' END, NOW())
  ON CONFLICT (student_id, semester_id)
  DO UPDATE SET
    sgpa = EXCLUDED.sgpa,
    cgpa = EXCLUDED.cgpa,
    overall_status = EXCLUDED.overall_status,
    published_at = NOW();

  -- Recalculate CGPA across all historical semesters
  SELECT COALESCE(ROUND(AVG(sgpa), 2), v_sgpa) INTO v_cgpa FROM results WHERE student_id = v_student_id;

  -- Update student cached GPA
  UPDATE students
  SET sgpa = v_sgpa, cgpa = v_cgpa
  WHERE id = v_student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_marks_calc_results
BEFORE INSERT OR UPDATE ON marks
FOR EACH ROW EXECUTE FUNCTION fn_recalculate_student_result();

-- TRIGGER 3: Real-time Fee Payment, Invoices, and Student Balance Sync
CREATE OR REPLACE FUNCTION fn_fee_payment_update()
RETURNS TRIGGER AS $$
DECLARE
  v_fee_id INT;
  v_total NUMERIC(10,2);
  v_paid NUMERIC(10,2);
  v_due NUMERIC(10,2);
  v_status VARCHAR(30);
  v_student_id INT;
  v_global_due NUMERIC(10,2);
BEGIN
  v_fee_id := NEW.student_fee_id;

  -- Calculate total payments for this invoice
  SELECT sf.student_id, sf.total_amount, COALESCE(SUM(p.amount), 0)
  INTO v_student_id, v_total, v_paid
  FROM student_fees sf
  LEFT JOIN fee_payments p ON p.student_fee_id = sf.id AND p.status = 'Success'
  WHERE sf.id = v_fee_id
  GROUP BY sf.id, sf.student_id, sf.total_amount;

  v_due := GREATEST(0.00, v_total - v_paid);
  v_status := CASE 
    WHEN v_due <= 0 THEN 'Paid' 
    WHEN v_paid > 0 THEN 'Partially Paid' 
    ELSE 'Unpaid' 
  END;

  -- Update the student fee bill
  UPDATE student_fees
  SET paid_amount = v_paid, due_amount = v_due, status = v_status
  WHERE id = v_fee_id;

  -- Update student profile due fees balance
  SELECT COALESCE(SUM(due_amount), 0.00) INTO v_global_due FROM student_fees WHERE student_id = v_student_id;
  UPDATE students SET fees_due = v_global_due WHERE id = v_student_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_fee_payment_sync
AFTER INSERT OR UPDATE ON fee_payments
FOR EACH ROW EXECUTE FUNCTION fn_fee_payment_update();

-- TRIGGER 4: Real-time Book Circulation, Stock Update & Automatic Fine Calculation
CREATE OR REPLACE FUNCTION fn_book_circulation()
RETURNS TRIGGER AS $$
DECLARE
  v_days_late INT;
  v_fine NUMERIC(8,2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Decrement available copies when a book is issued
    UPDATE books SET available_copies = GREATEST(0, available_copies - 1) WHERE id = NEW.book_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changes from Issued to Returned
    IF OLD.status != 'Returned' AND NEW.status = 'Returned' THEN
      UPDATE books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = NEW.book_id;
      
      -- Auto calculate overdue fine if returned after due date
      IF NEW.returned_date > NEW.due_date THEN
        v_days_late := (NEW.returned_date - NEW.due_date);
        v_fine := v_days_late * 5.00; -- ₹5 per day overdue
        NEW.fine_amount := v_fine;

        INSERT INTO finance_fines (student_id, fine_type, amount, reason, status)
        VALUES (NEW.student_id, 'Library Overdue', v_fine, 'Late return of accession ' || NEW.accession_no, 'Unpaid');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_book_circulation_sync
BEFORE INSERT OR UPDATE ON book_issues
FOR EACH ROW EXECUTE FUNCTION fn_book_circulation();

-- TRIGGER 5: Real-time Placement Offer Creation & Student Status Sync
CREATE OR REPLACE FUNCTION fn_placement_selection()
RETURNS TRIGGER AS $$
DECLARE
  v_package NUMERIC(6,2);
  v_company_id INT;
BEGIN
  IF NEW.status IN ('Selected', 'Placed') AND OLD.status NOT IN ('Selected', 'Placed') THEN
    SELECT d.package_lpa, d.company_id INTO v_package, v_company_id FROM placement_drives d WHERE d.id = NEW.drive_id;
    
    -- Insert placement record
    INSERT INTO placements (student_id, company_id, drive_id, package_lpa, offer_date)
    VALUES (NEW.student_id, v_company_id, NEW.drive_id, v_package, CURRENT_DATE)
    ON CONFLICT DO NOTHING;

    -- Update student status
    UPDATE students SET placement_status = 'Placed' WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_placement_selection_sync
AFTER UPDATE ON placement_applications
FOR EACH ROW EXECUTE FUNCTION fn_placement_selection();

-- =============================================================================
-- SEED DATA: VARIED, DISTINCT DATA ACROSS STUDENTS, DEPARTMENTS & FACULTY
-- =============================================================================

-- Departments
INSERT INTO departments (id, name, branch_code, hod_name, location) VALUES
(1, 'Computer Science and Engineering', 'CSE', 'Dr. Arvind Sharma', 'Academic Block A, 3rd Floor'),
(2, 'Information Technology', 'IT', 'Dr. Manasi Kadam', 'Academic Block A, 2nd Floor'),
(3, 'Electronics and Telecommunication', 'ENTC', 'Dr. Varun Pawar', 'Academic Block B, 1st Floor'),
(4, 'Artificial Intelligence and Data Science', 'AIDS', 'Dr. Vivek Patil', 'Innovation Centre, 4th Floor')
ON CONFLICT (id) DO NOTHING;

-- Semesters
INSERT INTO academic_semesters (id, semester_number, semester_name, academic_year, start_date, end_date) VALUES
(1, 1, 'Semester 1', '2023-24', '2023-08-01', '2023-12-15'),
(2, 2, 'Semester 2', '2023-24', '2024-01-05', '2024-05-20'),
(3, 3, 'Semester 3', '2024-25', '2024-08-01', '2024-12-15'),
(4, 4, 'Semester 4', '2024-25', '2025-01-05', '2025-05-20'),
(5, 5, 'Semester 5', '2025-26', '2025-08-01', '2025-12-20')
ON CONFLICT (id) DO NOTHING;

-- Courses
INSERT INTO courses (id, code, name, department_id, duration_years, total_credits) VALUES
(1, 'BTECH-CSE', 'B.Tech in Computer Science and Engineering', 1, 4, 160),
(2, 'BTECH-IT', 'B.Tech in Information Technology', 2, 4, 160),
(3, 'BTECH-ENTC', 'B.Tech in Electronics & Telecommunication', 3, 4, 160),
(4, 'BTECH-AIDS', 'B.Tech in Artificial Intelligence & Data Science', 4, 4, 160)
ON CONFLICT (id) DO NOTHING;

-- Sections
INSERT INTO sections (id, name, department_id) VALUES
(1, 'Section A (Div 1)', 1),
(2, 'Section B (Div 2)', 1),
(3, 'Section A (Div 1)', 2),
(4, 'Section A (Div 1)', 3),
(5, 'Section A (Div 1)', 4)
ON CONFLICT (id) DO NOTHING;

-- Subjects
INSERT INTO subjects (id, code, name, department_id, semester_id, credits, subject_type) VALUES
(1, 'CS301', 'Data Structures & Algorithms', 1, 5, 4, 'Theory'),
(2, 'CS302', 'Database Management Systems', 1, 5, 4, 'Theory'),
(3, 'CS303', 'Computer Networks', 1, 5, 4, 'Theory'),
(4, 'CS304', 'Theory of Computation', 1, 5, 3, 'Theory'),
(5, 'CS305', 'Software Engineering & Agile', 1, 5, 3, 'Theory'),
(6, 'ET301', 'VLSI Design & Architecture', 3, 5, 4, 'Theory'),
(7, 'ET302', 'Signals & Embedded Systems', 3, 5, 4, 'Theory'),
(8, 'AI301', 'Deep Learning & Neural Networks', 4, 5, 4, 'Theory'),
(9, 'AI302', 'Natural Language Processing', 4, 5, 4, 'Theory')
ON CONFLICT (id) DO NOTHING;

-- Faculty
INSERT INTO faculty (id, name, faculty_code, email, phone, department_id, designation) VALUES
(1, 'Prof. Ashwini Nair', 'FAC-001', 'faculty1@example.edu', '9876543201', 1, 'Professor & HOD'),
(2, 'Prof. Varun Pawar', 'FAC-002', 'faculty2@example.edu', '9876543202', 3, 'Associate Professor'),
(3, 'Prof. Manasi Kadam', 'FAC-003', 'faculty3@example.edu', '9876543203', 2, 'Associate Professor'),
(4, 'Prof. Vivek Patil', 'FAC-004', 'faculty4@example.edu', '9876543204', 4, 'Assistant Professor')
ON CONFLICT (id) DO NOTHING;

-- Staff
INSERT INTO staff (id, name, staff_code, email, role, department, phone) VALUES
(1, 'Rajesh Kumar Sharma', 'TNP-HEAD', 'tnp.head@campus.edu', 'TNP_HEAD', 'Training & Placement Cell', '9876500001'),
(2, 'Priya Deepak Mehta', 'FINANCE-01', 'finance@campus.edu', 'FINANCE', 'Accounts & Finance', '9876500002'),
(3, 'Sunita Ramesh Joshi', 'LIB-001', 'librarian@campus.edu', 'LIBRARIAN', 'Central University Library', '9876500003')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- DISTINCT STUDENT RECORDS: 25 ENROLLED SCHOLARS (SECTION A) + ENTC & AI&DS
-- -----------------------------------------------------------------------------

INSERT INTO students (id, name, roll_no, prn, email, phone, department_id, course_id, section_id, current_semester, gender, attendance_pct, sgpa, cgpa, fees_due, placement_status) VALUES
(1, 'Kavya Mohan Kulkarni', '31001', 'F24CE001', 'f24ce001@student.example.edu', '9876500101', 1, 1, 1, 5, 'Female', 92.50, 8.45, 8.20, 0.00, 'Shortlisted'),
(2, 'Siddharth Eknath Nale', '31002', 'F24CE002', 'f24ce002@student.example.edu', '9876500102', 1, 1, 1, 5, 'Male', 73.00, 6.82, 7.15, 33000.00, 'Applied'),
(3, 'Om Pankaj Tiwari', '31003', 'F24CE003', 'f24ce003@student.example.edu', '9876500103', 1, 1, 1, 5, 'Male', 88.00, 7.60, 7.55, 0.00, 'Applied'),
(4, 'Rohan Anand Iyer', '31004', 'F24CE004', 'f24ce004@student.example.edu', '9876500104', 1, 1, 1, 5, 'Male', 96.00, 9.40, 9.18, 0.00, 'Placed'),
(5, 'Ananya Rajesh Deshmukh', '31005', 'F24CE005', 'f24ce005@student.example.edu', '9876500105', 1, 1, 1, 5, 'Female', 94.00, 8.92, 8.75, 0.00, 'Shortlisted'),
(6, 'Aditya Suresh Sharma', '31006', 'F24CE006', 'f24ce006@student.example.edu', '9876500106', 1, 1, 1, 5, 'Male', 84.50, 7.80, 7.65, 0.00, 'Applied'),
(7, 'Priya Nitin Joshi', '31007', 'F24CE007', 'f24ce007@student.example.edu', '9876500107', 1, 1, 1, 5, 'Female', 91.00, 8.55, 8.40, 0.00, 'Shortlisted'),
(8, 'Harshil Manish Mehta', '31008', 'F24CE008', 'f24ce008@student.example.edu', '9876500108', 1, 1, 1, 5, 'Male', 78.50, 7.20, 7.10, 25000.00, 'Applied'),
(9, 'Riya Sameer Kadam', '31009', 'F24CE009', 'f24ce009@student.example.edu', '9876500109', 1, 1, 1, 5, 'Female', 93.50, 8.70, 8.60, 0.00, 'Shortlisted'),
(10, 'Tanmay Sanjay Shinde', '31010', 'F24CE010', 'f24ce010@student.example.edu', '9876500110', 1, 1, 1, 5, 'Male', 82.00, 7.45, 7.30, 0.00, 'Applied'),
(11, 'Ishita Deepak Verma', '31011', 'F24CE011', 'f24ce011@student.example.edu', '9876500111', 1, 1, 1, 5, 'Female', 95.00, 9.15, 9.02, 0.00, 'Placed'),
(12, 'Varun Nitin Patil', '31012', 'F24CE012', 'f24ce012@student.example.edu', '9876500112', 1, 1, 1, 5, 'Male', 76.00, 6.95, 7.00, 18000.00, 'Applied'),
(13, 'Sneha Vilas Jadhav', '31013', 'F24CE013', 'f24ce013@student.example.edu', '9876500113', 1, 1, 1, 5, 'Female', 89.00, 8.30, 8.22, 0.00, 'Shortlisted'),
(14, 'Aryan Pradeep Nair', '31014', 'F24CE014', 'f24ce014@student.example.edu', '9876500114', 1, 1, 1, 5, 'Male', 86.50, 8.10, 7.98, 0.00, 'Applied'),
(15, 'Meera Ravindra Shah', '31015', 'F24CE015', 'f24ce015@student.example.edu', '9876500115', 1, 1, 1, 5, 'Female', 90.50, 8.65, 8.50, 0.00, 'Shortlisted'),
(16, 'Kunal Ashok Bhosale', '31016', 'F24CE016', 'f24ce016@student.example.edu', '9876500116', 1, 1, 1, 5, 'Male', 74.00, 6.75, 6.90, 30000.00, 'Applied'),
(17, 'Pooja Mahesh Choudhary', '31017', 'F24CE017', 'f24ce017@student.example.edu', '9876500117', 1, 1, 1, 5, 'Female', 92.00, 8.80, 8.65, 0.00, 'Shortlisted'),
(18, 'Sahil Ramesh Gokhale', '31018', 'F24CE018', 'f24ce018@student.example.edu', '9876500118', 1, 1, 1, 5, 'Male', 85.00, 7.95, 7.85, 0.00, 'Applied'),
(19, 'Neha Chandrakant More', '31019', 'F24CE019', 'f24ce019@student.example.edu', '9876500119', 1, 1, 1, 5, 'Female', 93.00, 8.90, 8.78, 0.00, 'Shortlisted'),
(20, 'Pranav Hemant Tambe', '31020', 'F24CE020', 'f24ce020@student.example.edu', '9876500120', 1, 1, 1, 5, 'Male', 80.00, 7.35, 7.25, 15000.00, 'Applied'),
(21, 'Divya Sunil Waghmare', '31021', 'F24CE021', 'f24ce021@student.example.edu', '9876500121', 1, 1, 1, 5, 'Female', 88.50, 8.25, 8.15, 0.00, 'Applied'),
(22, 'Gaurav Anil Gaikwad', '31022', 'F24CE022', 'f24ce022@student.example.edu', '9876500122', 1, 1, 1, 5, 'Male', 77.00, 7.05, 7.00, 20000.00, 'Applied'),
(23, 'Shruti Jagdish Mane', '31023', 'F24CE023', 'f24ce023@student.example.edu', '9876500123', 1, 1, 1, 5, 'Female', 91.50, 8.60, 8.48, 0.00, 'Shortlisted'),
(24, 'Sanket Sunil Kale', '31024', 'F24CE024', 'f24ce024@student.example.edu', '9876500124', 1, 1, 1, 5, 'Male', 83.00, 7.70, 7.55, 0.00, 'Applied'),
(25, 'Aniket Dilip Pawar', '31025', 'F24CE025', 'f24ce025@student.example.edu', '9876500125', 1, 1, 1, 5, 'Male', 87.00, 8.00, 7.90, 0.00, 'Applied'),
(26, 'Viraj Pankaj Kale', '32001', 'F24ET001', 'f24et001@student.example.edu', '9876500201', 3, 3, 4, 5, 'Male', 81.00, 7.10, 7.05, 20000.00, 'Shortlisted'),
(27, 'Nidhi Vishwas Dhumal', '35001', 'F24AI001', 'f24ai001@student.example.edu', '9876500301', 4, 4, 5, 5, 'Female', 89.50, 8.85, 8.70, 0.00, 'Applied')
ON CONFLICT (id) DO UPDATE SET 
  attendance_pct = EXCLUDED.attendance_pct, 
  sgpa = EXCLUDED.sgpa, 
  cgpa = EXCLUDED.cgpa, 
  fees_due = EXCLUDED.fees_due;

-- User Accounts (Bcrypt compatible hashes with fallback credentials)
INSERT INTO user_accounts (id, identifier, email, password_hash, role, student_id, faculty_id, staff_id) VALUES
(1, '31001', 'f24ce001@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 1, NULL, NULL),
(2, '31002', 'f24ce002@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 2, NULL, NULL),
(3, '31003', 'f24ce003@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 3, NULL, NULL),
(4, '31004', 'f24ce004@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 4, NULL, NULL),
(5, '31005', 'f24ce005@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 5, NULL, NULL),
(6, '31006', 'f24ce006@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 6, NULL, NULL),
(7, '31007', 'f24ce007@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 7, NULL, NULL),
(8, '31008', 'f24ce008@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 8, NULL, NULL),
(9, '31009', 'f24ce009@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 9, NULL, NULL),
(10, '31010', 'f24ce010@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 10, NULL, NULL),
(11, '31011', 'f24ce011@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 11, NULL, NULL),
(12, '31012', 'f24ce012@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 12, NULL, NULL),
(13, '31013', 'f24ce013@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 13, NULL, NULL),
(14, '31014', 'f24ce014@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 14, NULL, NULL),
(15, '31015', 'f24ce015@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 15, NULL, NULL),
(16, '31016', 'f24ce016@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 16, NULL, NULL),
(17, '31017', 'f24ce017@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 17, NULL, NULL),
(18, '31018', 'f24ce018@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 18, NULL, NULL),
(19, '31019', 'f24ce019@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 19, NULL, NULL),
(20, '31020', 'f24ce020@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 20, NULL, NULL),
(21, '31021', 'f24ce021@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 21, NULL, NULL),
(22, '31022', 'f24ce022@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 22, NULL, NULL),
(23, '31023', 'f24ce023@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 23, NULL, NULL),
(24, '31024', 'f24ce024@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 24, NULL, NULL),
(25, '31025', 'f24ce025@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 25, NULL, NULL),
(26, '32001', 'f24et001@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 26, NULL, NULL),
(27, '35001', 'f24ai001@student.example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'STUDENT', 27, NULL, NULL),
(28, 'FAC-001', 'faculty1@example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'FACULTY', NULL, 1, NULL),
(29, 'FAC-002', 'faculty2@example.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'FACULTY', NULL, 2, NULL),
(30, 'TNP-HEAD', 'tnp.head@campus.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'TNP_HEAD', NULL, NULL, 1),
(31, 'FINANCE-01', 'finance@campus.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'FINANCE', NULL, NULL, 2),
(32, 'LIB-001', 'librarian@campus.edu', '$2a$10$y60p013mR0f.K0kOQxV1/e/fI5E64/7Z/67v2nC1bYyA4q/E8G.yK', 'LIBRARIAN', NULL, NULL, 3)
ON CONFLICT (id) DO NOTHING;

-- Books
INSERT INTO books (id, isbn, title, author, category, total_copies, available_copies, shelf_location) VALUES
(1, '978-0131103627', 'The C Programming Language (2nd Edition)', 'Kernighan & Ritchie', 'Computer Science', 10, 8, 'Shelf CS-01'),
(2, '978-0262033848', 'Introduction to Algorithms (CLRS)', 'Cormen, Leiserson, Rivest', 'Computer Science', 8, 5, 'Shelf CS-02'),
(3, '978-0073523323', 'Database System Concepts (6th Edition)', 'Silberschatz, Korth, Sudarshan', 'Computer Science', 12, 9, 'Shelf CS-03'),
(4, '978-0132126953', 'Computer Networks (5th Edition)', 'Andrew S. Tanenbaum', 'Computer Science', 6, 4, 'Shelf CS-04'),
(5, '978-0136042594', 'Artificial Intelligence: A Modern Approach', 'Stuart Russell & Peter Norvig', 'AI & Machine Learning', 5, 2, 'Shelf AI-01')
ON CONFLICT (id) DO NOTHING;

-- Book Issues (Kavya has active loan, Siddharth has overdue loan with fine, Rohan has clean loan)
INSERT INTO book_issues (id, student_id, book_id, accession_no, issue_date, due_date, returned_date, fine_amount, status) VALUES
(1, 1, 2, 'ACC-CLRS-003', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '8 days', NULL, 0.00, 'Issued'),
(2, 2, 3, 'ACC-DBMS-012', CURRENT_DATE - INTERVAL '17 days', CURRENT_DATE - INTERVAL '3 days', NULL, 15.00, 'Overdue'),
(3, 4, 4, 'ACC-NET-005', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', NULL, 0.00, 'Issued'),
(4, 1, 1, 'ACC-KERN-008', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '16 days', CURRENT_DATE - INTERVAL '16 days', 0.00, 'Returned')
ON CONFLICT (id) DO NOTHING;

-- Student Fees
INSERT INTO student_fees (id, student_id, semester_id, category, total_amount, paid_amount, due_amount, status, due_date) VALUES
(1, 1, 5, 'Tuition & Academic Fee', 68000.00, 68000.00, 0.00, 'Paid', '2025-09-30'),
(2, 2, 5, 'Tuition & Academic Fee', 68000.00, 35000.00, 33000.00, 'Partially Paid', '2025-09-30'),
(3, 3, 5, 'Tuition & Academic Fee', 68000.00, 68000.00, 0.00, 'Paid', '2025-09-30'),
(4, 4, 5, 'Tuition & Academic Fee', 68000.00, 68000.00, 0.00, 'Paid', '2025-09-30'),
(5, 5, 5, 'Tuition & Academic Fee', 65000.00, 45000.00, 20000.00, 'Partially Paid', '2025-09-30'),
(6, 6, 5, 'Tuition & Academic Fee', 68000.00, 68000.00, 0.00, 'Paid', '2025-09-30')
ON CONFLICT (id) DO NOTHING;

-- Fee Payments
INSERT INTO fee_payments (id, student_fee_id, receipt_no, amount, payment_mode, payment_date, status) VALUES
(1, 1, 'REC-2025-1001', 68000.00, 'Online UPI Payment', '2025-08-15', 'Success'),
(2, 2, 'REC-2025-1002', 35000.00, 'Net Banking (SBI)', '2025-08-20', 'Success'),
(3, 3, 'REC-2025-1003', 68000.00, 'Credit Card (HDFC)', '2025-08-18', 'Success'),
(4, 4, 'REC-2025-1004', 68000.00, 'Online UPI Payment', '2025-08-14', 'Success'),
(5, 5, 'REC-2025-1005', 45000.00, 'Demand Draft', '2025-08-25', 'Success'),
(6, 6, 'REC-2025-1006', 68000.00, 'Online UPI Payment', '2025-08-10', 'Success')
ON CONFLICT (id) DO NOTHING;

-- Placement Companies & Drives
INSERT INTO placement_companies (id, name, industry, location, website, contact_email) VALUES
(1, 'Amazon AWS', 'Cloud & E-Commerce', 'Bangalore / Hyderabad', 'https://amazon.jobs', 'campus-india@amazon.com'),
(2, 'Accenture Interactive', 'IT Services & Consulting', 'Pune / Mumbai', 'https://accenture.com', 'careers@accenture.com'),
(3, 'Tata Consultancy Services (TCS)', 'IT & Enterprise Software', 'Mumbai / Pune', 'https://tcs.com', 'campus.tcs@tcs.com'),
(4, 'Nvidia Corporation', 'AI & Semiconductor Hardware', 'Pune / Bangalore', 'https://nvidia.com', 'university-recruiting@nvidia.com'),
(5, 'Texas Instruments', 'VLSI & Embedded Systems', 'Bangalore', 'https://ti.com', 'campus@ti.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO placement_drives (id, company_id, job_role, package_lpa, min_cgpa, job_type, drive_date, deadline, status) VALUES
(1, 1, 'Software Development Engineer (SDE-1)', 18.50, 7.50, 'Full-Time', '2025-11-15', '2025-11-05', 'Completed'),
(2, 2, 'Associate Software Engineer', 6.50, 6.00, 'Full-Time', '2025-11-20', '2025-11-10', 'Ongoing'),
(3, 3, 'Systems Engineer (Ninja & Digital)', 7.00, 6.00, 'Full-Time', '2025-11-25', '2025-11-12', 'Ongoing'),
(4, 4, 'AI Solutions Engineer', 14.00, 7.50, 'Full-Time', '2025-12-05', '2025-11-28', 'Upcoming'),
(5, 5, 'VLSI Design Engineer', 12.00, 7.00, 'Full-Time', '2025-12-10', '2025-12-01', 'Upcoming')
ON CONFLICT (id) DO NOTHING;

-- Placement Applications (Distinct per student)
INSERT INTO placement_applications (id, drive_id, student_id, applied_date, status, interview_date) VALUES
(1, 2, 1, '2025-11-08', 'Shortlisted', '2025-11-22'),
(2, 3, 2, '2025-11-11', 'Applied', NULL),
(3, 3, 3, '2025-11-11', 'Applied', NULL),
(4, 1, 4, '2025-11-02', 'Selected', '2025-11-14'),
(5, 5, 5, '2025-11-15', 'Shortlisted', '2025-12-12'),
(6, 4, 6, '2025-11-18', 'Applied', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO placements (id, student_id, company_id, drive_id, package_lpa, offer_date) VALUES
(1, 4, 1, 1, 18.50, '2025-11-16')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6-DAY TIMETABLE SCHEDULE: MONDAY TO SATURDAY (09:00:00 TO 16:00:00)
-- -----------------------------------------------------------------------------
INSERT INTO timetables (id, subject_id, faculty_id, section_id, day_of_week, start_time, end_time, room_no, type) VALUES
-- Monday
(1, 1, 1, 1, 'Monday', '09:00:00', '10:00:00', 'AB-301', 'Lecture'),
(2, 2, 2, 1, 'Monday', '10:15:00', '11:15:00', 'AB-301', 'Lecture'),
(3, 3, 3, 1, 'Monday', '11:15:00', '12:15:00', 'AB-301', 'Lecture'),
(4, 2, 2, 1, 'Monday', '13:15:00', '15:15:00', 'Lab 304', 'Lab'),
(5, 1, 1, 1, 'Monday', '15:15:00', '16:00:00', 'AB-301', 'Tutorial'),

-- Tuesday
(6, 3, 3, 1, 'Tuesday', '09:00:00', '10:00:00', 'AB-302', 'Lecture'),
(7, 5, 4, 1, 'Tuesday', '10:15:00', '11:15:00', 'AB-302', 'Lecture'),
(8, 4, 4, 1, 'Tuesday', '11:15:00', '12:15:00', 'AB-302', 'Lecture'),
(9, 1, 1, 1, 'Tuesday', '13:15:00', '15:15:00', 'Lab 301', 'Lab'),
(10, 5, 4, 1, 'Tuesday', '15:15:00', '16:00:00', 'AB-302', 'Tutorial'),

-- Wednesday
(11, 4, 4, 1, 'Wednesday', '09:00:00', '10:00:00', 'AB-301', 'Lecture'),
(12, 1, 1, 1, 'Wednesday', '10:15:00', '11:15:00', 'AB-301', 'Lecture'),
(13, 2, 2, 1, 'Wednesday', '11:15:00', '12:15:00', 'AB-301', 'Lecture'),
(14, 3, 3, 1, 'Wednesday', '13:15:00', '15:15:00', 'Lab 302', 'Lab'),
(15, 1, 1, 1, 'Wednesday', '15:15:00', '16:00:00', 'Seminar Hall 1', 'Seminar'),

-- Thursday
(16, 5, 4, 1, 'Thursday', '09:00:00', '10:00:00', 'AB-301', 'Lecture'),
(17, 3, 3, 1, 'Thursday', '10:15:00', '11:15:00', 'AB-301', 'Lecture'),
(18, 4, 4, 1, 'Thursday', '11:15:00', '12:15:00', 'AB-301', 'Lecture'),
(19, 1, 1, 1, 'Thursday', '13:15:00', '15:15:00', 'Lab 305', 'Lab'),
(20, 2, 2, 1, 'Thursday', '15:15:00', '16:00:00', 'Lab 305', 'Workshop'),

-- Friday
(21, 2, 2, 1, 'Friday', '09:00:00', '10:00:00', 'AB-301', 'Lecture'),
(22, 1, 1, 1, 'Friday', '10:15:00', '11:15:00', 'AB-301', 'Lecture'),
(23, 5, 4, 1, 'Friday', '11:15:00', '12:15:00', 'AB-301', 'Lecture'),
(24, 1, 1, 1, 'Friday', '13:15:00', '15:15:00', 'Project Lab 2', 'Lab'),
(25, 1, 1, 1, 'Friday', '15:15:00', '16:00:00', 'AB-301', 'Mentorship'),

-- Saturday
(26, 1, 1, 1, 'Saturday', '09:00:00', '10:00:00', 'Lab 301', 'Practical'),
(27, 2, 2, 1, 'Saturday', '10:15:00', '11:15:00', 'Auditorium', 'Seminar'),
(28, 4, 4, 1, 'Saturday', '11:15:00', '12:15:00', 'Auditorium', 'Seminar'),
(29, 1, 1, 1, 'Saturday', '13:15:00', '15:15:00', 'Innovation Hub', 'Workshop'),
(30, 3, 3, 1, 'Saturday', '15:15:00', '16:00:00', 'Sports Complex', 'Activity')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- ATTENDANCE SESSIONS & ENROLLED ROSTER ATTENDANCE (SECTION A)
-- -----------------------------------------------------------------------------
INSERT INTO attendance_sessions (id, subject_id, faculty_id, section_id, session_date, period, topic) VALUES
(1, 1, 1, 1, CURRENT_DATE - INTERVAL '2 days', '09:00 AM - 10:00 AM', 'Graph Traversal Algorithms (BFS & DFS)'),
(2, 2, 2, 1, CURRENT_DATE - INTERVAL '1 days', '10:15 AM - 11:15 AM', 'Relational Algebra & Normalization')
ON CONFLICT (id) DO NOTHING;

-- Seed attendance records for Session 1 across all 25 enrolled Section A students
INSERT INTO attendance_records (session_id, student_id, status) VALUES
(1, 1, 'Present'),
(1, 2, 'Absent'),
(1, 3, 'Present'),
(1, 4, 'Present'),
(1, 5, 'Present'),
(1, 6, 'Present'),
(1, 7, 'Present'),
(1, 8, 'Absent'),
(1, 9, 'Present'),
(1, 10, 'Present'),
(1, 11, 'Present'),
(1, 12, 'Absent'),
(1, 13, 'Present'),
(1, 14, 'Present'),
(1, 15, 'Present'),
(1, 16, 'Absent'),
(1, 17, 'Present'),
(1, 18, 'Present'),
(1, 19, 'Present'),
(1, 20, 'Present'),
(1, 21, 'Present'),
(1, 22, 'Absent'),
(1, 23, 'Present'),
(1, 24, 'Present'),
(1, 25, 'Present')
ON CONFLICT (session_id, student_id) DO NOTHING;

-- =============================================================================
-- POSTGRESQL VIEWS (CROSS-MODULE REPORTING & ANALYTICS)
-- =============================================================================

-- View 1: Active Faculty Enrolled Scholars View
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

-- View 2: Weekly 6-Day Timetable Schedule (Mon-Sat, 09:00 AM - 04:00 PM)
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

-- View 3: Student Attendance Summary View
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

-- View 4: Student Fee Ledger Balance View
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

-- Table: faculty_salaries
CREATE TABLE IF NOT EXISTS faculty_salaries (
  id SERIAL PRIMARY KEY,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  slip_ref_no VARCHAR(50) NOT NULL,
  salary_month VARCHAR(20) NOT NULL,
  salary_year INT NOT NULL,
  basic_salary NUMERIC(10,2) NOT NULL DEFAULT 110000.00,
  da_allowance NUMERIC(10,2) NOT NULL DEFAULT 18000.00,
  hra_allowance NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
  travel_allowance NUMERIC(10,2) NOT NULL DEFAULT 4000.00,
  academic_allowance NUMERIC(10,2) NOT NULL DEFAULT 3000.00,
  gross_salary NUMERIC(10,2) NOT NULL DEFAULT 145000.00,
  pf_deduction NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
  income_tax NUMERIC(10,2) NOT NULL DEFAULT 7500.00,
  professional_tax NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  total_deductions NUMERIC(10,2) NOT NULL DEFAULT 18000.00,
  net_salary NUMERIC(10,2) NOT NULL DEFAULT 127000.00,
  disbursement_date DATE DEFAULT '2026-09-30',
  payment_mode VARCHAR(50) DEFAULT 'NEFT / RTGS Online Transfer',
  status VARCHAR(20) DEFAULT 'Paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Faculty Salaries
INSERT INTO faculty_salaries (faculty_id, slip_ref_no, salary_month, salary_year, basic_salary, da_allowance, hra_allowance, travel_allowance, academic_allowance, gross_salary, pf_deduction, income_tax, professional_tax, total_deductions, net_salary, disbursement_date, payment_mode, status)
VALUES
(1, 'PAY-2026-10-FAC-001', 'October', 2026, 110000.00, 18000.00, 10000.00, 4000.00, 3000.00, 145000.00, 10000.00, 7500.00, 500.00, 18000.00, 127000.00, '2026-10-28', 'NEFT / RTGS Online Transfer', 'Paid'),
(1, 'PAY-2026-09-FAC-001', 'September', 2026, 110000.00, 18000.00, 10000.00, 4000.00, 3000.00, 145000.00, 10000.00, 7500.00, 500.00, 18000.00, 127000.00, '2026-09-30', 'NEFT / RTGS Online Transfer', 'Paid'),
(2, 'PAY-2026-10-FAC-002', 'October', 2026, 110000.00, 18000.00, 10000.00, 4000.00, 3000.00, 145000.00, 10000.00, 7500.00, 500.00, 18000.00, 127000.00, '2026-10-28', 'NEFT / RTGS Online Transfer', 'Paid'),
(2, 'PAY-2026-09-FAC-002', 'September', 2026, 110000.00, 18000.00, 10000.00, 4000.00, 3000.00, 145000.00, 10000.00, 7500.00, 500.00, 18000.00, 127000.00, '2026-09-30', 'NEFT / RTGS Online Transfer', 'Paid')
ON CONFLICT DO NOTHING;

-- Reset sequence IDs
SELECT setval('students_id_seq', COALESCE((SELECT MAX(id) FROM students), 1));
SELECT setval('user_accounts_id_seq', COALESCE((SELECT MAX(id) FROM user_accounts), 1));
SELECT setval('faculty_id_seq', COALESCE((SELECT MAX(id) FROM faculty), 1));
SELECT setval('books_id_seq', COALESCE((SELECT MAX(id) FROM books), 1));
SELECT setval('book_issues_id_seq', COALESCE((SELECT MAX(id) FROM book_issues), 1));
SELECT setval('student_fees_id_seq', COALESCE((SELECT MAX(id) FROM student_fees), 1));
SELECT setval('fee_payments_id_seq', COALESCE((SELECT MAX(id) FROM fee_payments), 1));
SELECT setval('placement_drives_id_seq', COALESCE((SELECT MAX(id) FROM placement_drives), 1));
SELECT setval('placement_applications_id_seq', COALESCE((SELECT MAX(id) FROM placement_applications), 1));
SELECT setval('timetables_id_seq', COALESCE((SELECT MAX(id) FROM timetables), 1));
SELECT setval('attendance_sessions_id_seq', COALESCE((SELECT MAX(id) FROM attendance_sessions), 1));
SELECT setval('attendance_records_id_seq', COALESCE((SELECT MAX(id) FROM attendance_records), 1));
SELECT setval('faculty_salaries_id_seq', COALESCE((SELECT MAX(id) FROM faculty_salaries), 1));
