const { query } = require('../server/config/db');

async function applyDbFixes() {
  console.log('--- Applying Supabase Schema Updates & Triggers ---');

  // 1. Add mid_sem, internal_marks, end_sem to marks table if not present
  try {
    await query(`
      ALTER TABLE marks 
      ADD COLUMN IF NOT EXISTS mid_sem NUMERIC(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS internal_marks NUMERIC(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS end_sem NUMERIC(5,2) DEFAULT 0;
    `);
    console.log('✓ marks table columns (mid_sem, internal_marks, end_sem) ensured.');

    // Backfill existing marks with 20/20/60 ratio if they are 0
    await query(`
      UPDATE marks 
      SET 
        mid_sem = ROUND((marks_obtained * 0.20)::numeric, 1),
        internal_marks = ROUND((marks_obtained * 0.20)::numeric, 1),
        end_sem = ROUND((marks_obtained - (ROUND((marks_obtained * 0.20)::numeric, 1) * 2))::numeric, 1)
      WHERE (mid_sem = 0 AND internal_marks = 0 AND end_sem = 0) AND marks_obtained > 0;
    `);
    console.log('✓ Existing marks backfilled with 20/20/60 distribution.');

    // 2. Update trigger function fn_marks_grade
    await query(`
      CREATE OR REPLACE FUNCTION fn_marks_grade()
      RETURNS trigger AS $$
      DECLARE pct numeric;
      BEGIN
        IF NEW.mid_sem IS NOT NULL OR NEW.internal_marks IS NOT NULL OR NEW.end_sem IS NOT NULL THEN
          NEW.marks_obtained := COALESCE(NEW.mid_sem, 0) + COALESCE(NEW.internal_marks, 0) + COALESCE(NEW.end_sem, 0);
        END IF;
        
        NEW.max_marks := COALESCE(NEW.max_marks, 100);
        
        IF NEW.marks_obtained < 0 OR NEW.marks_obtained > NEW.max_marks THEN
          RAISE EXCEPTION 'marks_obtained (%) must be between 0 and max_marks (%)', NEW.marks_obtained, NEW.max_marks;
        END IF;

        pct := NEW.marks_obtained * 100.0 / NEW.max_marks;
        NEW.grade_point  := round(pct / 10, 1);
        NEW.grade_letter := CASE 
          WHEN pct >= 90 THEN 'O' 
          WHEN pct >= 80 THEN 'A+' 
          WHEN pct >= 70 THEN 'A'
          WHEN pct >= 60 THEN 'B' 
          WHEN pct >= 50 THEN 'C'
          WHEN pct >= 40 THEN 'D' 
          ELSE 'F' 
        END;
        NEW.status := CASE WHEN pct >= 40 THEN 'Pass' ELSE 'Fail' END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ fn_marks_grade trigger function updated with official brackets (O >= 90, A+ >= 80, A >= 70, B >= 60).');

    // 3. Create faculty_leave table
    await query(`
      CREATE TABLE IF NOT EXISTS faculty_leave (
        leave_id SERIAL PRIMARY KEY,
        leave_code VARCHAR(50) UNIQUE,
        faculty_id INTEGER REFERENCES faculty(faculty_id) ON DELETE CASCADE,
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_count INTEGER DEFAULT 1,
        reason TEXT,
        cover_faculty_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Request Sent',
        applied_on DATE DEFAULT CURRENT_DATE,
        approver_comments TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ faculty_leave table created in Supabase.');

    // Insert sample initial faculty leave records if empty
    const [existingLeaves] = await query('SELECT count(*) as count FROM faculty_leave');
    if (parseInt(existingLeaves[0]?.count || '0', 10) === 0) {
      await query(`
        INSERT INTO faculty_leave (leave_code, faculty_id, leave_type, start_date, end_date, days_count, reason, cover_faculty_name, status, applied_on)
        VALUES 
        ('LV-2026-1001', 1, 'Casual Leave', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days', 2, 'Attending IEEE AI Workshop', 'Prof. Ramesh Sharma', 'Request Sent', CURRENT_DATE),
        ('LV-2026-1002', 1, 'Medical Leave', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '13 days', 3, 'Viral Fever & Medical Rest', 'Prof. Anita Deshmukh', 'Approved', CURRENT_DATE - INTERVAL '16 days');
      `);
      console.log('✓ Initial faculty leave records seeded.');
    }

    // 4. Ensure attendance_session has is_locked column
    await query(`
      ALTER TABLE attendance_session
      ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
    `);
    console.log('✓ attendance_session is_locked column ensured.');

    // 5. Check job_drive and eligibility sequence/connection
    await query(`
      ALTER TABLE job_drive
      ADD COLUMN IF NOT EXISTS package_lpa NUMERIC(6,2);
    `);
    console.log('✓ job_drive package_lpa ensured.');

    // Sync package_lpa from package if null
    await query(`
      UPDATE job_drive 
      SET package_lpa = substring(package from '([0-9]+\.?[0-9]*)')::numeric
      WHERE package_lpa IS NULL AND package ~ '[0-9]';
    `);
    console.log('✓ job_drive package_lpa synchronized.');

    console.log('\n--- ALL SUPABASE SCHEMA UPDATES COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Database migration error:', err);
  } finally {
    process.exit(0);
  }
}

applyDbFixes();
