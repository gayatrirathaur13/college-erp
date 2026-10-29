# University ERP — Database Architecture & Setup Guide

> [!IMPORTANT]
> **POSTGRESQL & SUPABASE DATABASE ARCHITECTURE:**
> The primary, production-grade database schema and cross-module trigger architecture for this College ERP are built **strictly in PostgreSQL (Supabase)**.
> - **Primary PostgreSQL Schema (DDL, Triggers, RLS, 6-Day Timetable, 25-Scholar Cohort):** [`supabase/schema.sql`](file:///h:/Pros/sih/college-erp/supabase/schema.sql)
> - **PostgreSQL Views & Reporting:** [`database/views.sql`](file:///h:/Pros/sih/college-erp/database/views.sql)
> - **Supabase Complete Setup Guide:** [`docs/SUPABASE_SETUP_GUIDE.md`](file:///h:/Pros/sih/college-erp/docs/SUPABASE_SETUP_GUIDE.md)
>
> To deploy in Supabase: Simply open your **Supabase Dashboard** -> **SQL Editor** -> Paste and Run [`supabase/schema.sql`](file:///h:/Pros/sih/college-erp/supabase/schema.sql).

---

## 1. Directory Manifest

| File | Purpose |
| :--- | :--- |
| `schema.sql` | Complete DDL script creating all normalized tables for 8 modules + auth & audit logs. |
| `seed.sql` | Idempotent development seed records (Student, Faculty, Admin, sample leaves, payroll). |
| `csv_mapping.md` | Exhaustive column-by-column mapping of all 45 CSV files to MySQL schema. |
| `import_validation.md` | Data validation rules, format transformations, dependency hierarchy, and rollback strategy. |
| `import_csv.cjs` | Production-grade bulk import script with `--dry-run` validation and transaction safety. |

---

## 2. Review and Manual Execution in MySQL Workbench

Per non-negotiable safety rules, **no SQL commands or database alterations are executed automatically**. You can review and execute the scripts manually:

### Step 1: Open MySQL Workbench
1. Launch **MySQL Workbench** on your Windows system.
2. Connect to your local MySQL instance (e.g., `Local instance MySQL80` on port 3306).

### Step 2: Review and Execute Schema
1. In MySQL Workbench, go to **File** -> **Open SQL Script...** (or press `Ctrl+Shift+O`).
2. Navigate to and select `database/schema.sql`.
3. Review the DDL statements.
4. Execute the script by clicking the lightning bolt icon (**Execute**) or pressing `Ctrl+Shift+Enter`.
5. Refresh the **Schemas** pane on the left to verify the `college_erp` database and all 45+ tables have been created.

### Step 3: (Optional) Run Development Seed
If you wish to test with development prototype accounts without immediately importing the entire 29,400+ CSV records:
1. Open `database/seed.sql` in MySQL Workbench.
2. Execute the script.
3. This creates:
   - Student Account: `aarav.sharma@college.edu` or `CS2023001` (Password: `Student@2026`)
   - Faculty Account: `arvind.sharma@college.edu` or `FAC-CSE-001` (Password: `Faculty@2026`)
   - Admin Account: `admin@college.edu` (Password: `Admin@2026`)

---

## 3. CSV Import Procedure

### Step 1: Configure `.env`
Ensure your MySQL password is set in `server/.env` (or project root `.env`):
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=college_erp
```

### Step 2: Pre-Import Validation (Dry Run)
Before modifying the database, run the pre-flight dry run to parse and validate all 45 CSV files in dependency order:
```cmd
node database/import_csv.cjs --dry-run
```
Expected output:
```
Summary: Processed 45 CSV files, total 29401 records validated.
[DRY RUN COMPLETE] Schema alignment and CSV parse verified successfully.
No database modifications were made.
```

### Step 3: Execute Live Import (After Approval)
When you are ready to load the Google Sheets CSV records into MySQL:
```cmd
node database/import_csv.cjs
```
This utility:
- Wraps execution in an explicit database transaction.
- Loads data in strict foreign-key dependency order (Tier 1 through Tier 6).
- Automatically converts date formats (`M/D/YYYY` to ISO `YYYY-MM-DD`).
- Uses parameterized queries (`?`) in chunks of 250 for speed and safety.
- Rolls back completely if any fatal error occurs.

---

## 4. Post-Import Verification Queries

Run these queries in MySQL Workbench to confirm data integrity:

```sql
USE college_erp;

-- 1. Check record counts across primary tables
SELECT 'student' AS table_name, COUNT(*) AS count FROM student
UNION ALL
SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL
SELECT 'course', COUNT(*) FROM course
UNION ALL
SELECT 'subject', COUNT(*) FROM subject
UNION ALL
SELECT 'attendance_record', COUNT(*) FROM attendance_record
UNION ALL
SELECT 'marks', COUNT(*) FROM marks
UNION ALL
SELECT 'result', COUNT(*) FROM result
UNION ALL
SELECT 'book', COUNT(*) FROM book
UNION ALL
SELECT 'student_fee', COUNT(*) FROM student_fee
UNION ALL
SELECT 'placement', COUNT(*) FROM placement;

-- 2. Verify student academic details
SELECT s.student_id, s.roll_no, s.student_name, d.department_name, c.course_name
FROM student s
JOIN department d ON s.department_id = d.department_id
JOIN course c ON s.course_id = c.course_id
LIMIT 5;

-- 3. Verify attendance percentages
SELECT s.roll_no, s.student_name, sub.subject_code,
       COUNT(ar.record_id) AS total_marked,
       SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
       ROUND((SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) / COUNT(ar.record_id)) * 100, 2) AS attendance_pct
FROM attendance_record ar
JOIN student s ON ar.student_id = s.student_id
JOIN attendance_session ses ON ar.session_id = ses.session_id
JOIN subject sub ON ses.subject_id = sub.subject_id
GROUP BY s.student_id, sub.subject_id
LIMIT 5;
```
