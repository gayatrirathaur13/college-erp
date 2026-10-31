const { pool, query } = require('../config/db');

function formatTime12(tStr) {
  if (!tStr) return '';
  const parts = String(tStr).split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return String(tStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${period}`;
}

/**
 * Get Faculty Profile
 * GET /api/faculty/profile
 */
async function getProfile(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    const [faculties] = await query(
      `SELECT f.*, d.department_name, des.designation_name
       FROM faculty f
       JOIN department d ON f.department_id = d.department_id
       JOIN designation des ON f.designation_id = des.designation_id
       WHERE f.faculty_id = ?
       LIMIT 1`,
      [facultyId]
    );

    if (faculties.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    res.json({
      success: true,
      data: faculties[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Faculty Dashboard Overview
 * GET /api/faculty/dashboard
 */
async function getDashboard(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    const [timetable] = await query(
      `SELECT t.*, s.subject_name, s.subject_code, sec.section_name
       FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       JOIN section sec ON t.section_id = sec.section_id
       WHERE t.faculty_id = ?
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.start_time ASC`,
      [facultyId]
    );

    const [recentAttendance] = await query(
      `SELECT ses.session_id, ses.session_date, s.subject_code, s.subject_name, sec.section_name,
              COUNT(rec.record_id) AS total_students,
              SUM(CASE WHEN rec.status = 'Present' THEN 1 ELSE 0 END) AS present_count
       FROM attendance_session ses
       JOIN subject s ON ses.subject_id = s.subject_id
       JOIN section sec ON ses.section_id = sec.section_id
       LEFT JOIN attendance_record rec ON ses.session_id = rec.session_id
       WHERE ses.faculty_id = ?
       GROUP BY ses.session_id, ses.session_date, s.subject_code, s.subject_name, sec.section_name
       ORDER BY ses.session_date DESC
       LIMIT 5`,
      [facultyId]
    );

    res.json({
      success: true,
      data: {
        todayLectures: (timetable || []).map(t => {
          const s12 = formatTime12(t.start_time);
          const e12 = formatTime12(t.end_time);
          return {
            time: `${s12} - ${e12}`,
            subject: `${t.subject_name} (${t.subject_code})`,
            classSection: t.section_name,
            room: t.room_no,
            day: t.day_of_week,
            type: t.timetable_type || (t.room_no && t.room_no.toLowerCase().includes('lab') ? 'Lab' : 'Lecture'),
            status: "Scheduled"
          };
        }),
        recentAttendance: recentAttendance || []
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Roster for Attendance Marking & Past Logs
 * GET /api/faculty/attendance
 */
async function getAttendanceRoster(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    // Get faculty department
    const [fac] = await query('SELECT department_id FROM faculty WHERE faculty_id = ?', [facultyId]);
    const deptId = fac[0]?.department_id || 1;

    // Check if a specific section was requested
    const requestedSectionId = req.query.section_id ? parseInt(req.query.section_id, 10) : null;

    // Get faculty's assigned sections (from timetable or department cohort)
    let [assignedSections] = await query(
      `SELECT DISTINCT sec.section_id, sec.section_name
       FROM timetable t
       JOIN section sec ON t.section_id = sec.section_id
       WHERE t.faculty_id = ?
       ORDER BY sec.section_id ASC`,
      [facultyId]
    );

    if (!assignedSections || assignedSections.length === 0) {
      const [deptSections] = await query(
        `SELECT sec.section_id, sec.section_name
         FROM section sec
         JOIN faculty f ON sec.department_id = f.department_id
         WHERE f.faculty_id = ?
         ORDER BY sec.section_id ASC`,
        [facultyId]
      );
      assignedSections = deptSections || [];
    }

    // Get faculty's eligible assigned subjects (from timetable and faculty_subject_assignment)
    let [assignedSubjects] = await query(
      `SELECT DISTINCT s.subject_id, s.subject_code, s.subject_name
       FROM (
         SELECT subject_id FROM timetable WHERE faculty_id = ?
         UNION
         SELECT subject_id FROM faculty_subject_assignment WHERE faculty_id = ?
       ) assigned
       JOIN subject s ON assigned.subject_id = s.subject_id
       ORDER BY s.subject_code ASC`,
      [facultyId, facultyId]
    );

    if (!assignedSubjects || assignedSubjects.length === 0) {
      const [deptSubjects] = await query(
        `SELECT s.subject_id, s.subject_code, s.subject_name
         FROM subject s
         JOIN faculty f ON s.department_id = f.department_id
         WHERE f.faculty_id = ?
         ORDER BY s.subject_code ASC`,
        [facultyId]
      );
      assignedSubjects = deptSubjects || [];
    }

    const activeSectionId = requestedSectionId || assignedSections[0]?.section_id || 1;

    // Find students for active section
    const [students] = await query(
      `SELECT s.student_id, s.roll_no, s.student_name AS name, 'Present' as status
       FROM student s
       WHERE s.section_id = ?
       ORDER BY s.roll_no ASC`,
      [activeSectionId]
    );

    const [sessions] = await query(
      `SELECT ses.session_id AS id, ses.session_date AS date, sec.section_name AS division,
              CONCAT(sub.subject_code, ' - ', sub.subject_name) AS subject,
              ses.period,
              COUNT(rec.attendance_id) AS total_students,
              SUM(CASE WHEN rec.attendance_status = 'Present' OR rec.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
              SUM(CASE WHEN rec.attendance_status = 'Absent' OR rec.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
              ses.created_at AS saved_at,
              ses.is_locked,
              CASE 
                WHEN ses.is_locked = TRUE THEN FALSE
                WHEN ses.session_date < (CURRENT_DATE - INTERVAL '7 days') THEN FALSE
                ELSE TRUE 
              END AS can_edit
       FROM attendance_session ses
       JOIN subject sub ON ses.subject_id = sub.subject_id
       JOIN section sec ON ses.section_id = sec.section_id
       LEFT JOIN attendance_record rec ON ses.session_id = rec.session_id
       WHERE ses.faculty_id = ?
       GROUP BY ses.session_id, ses.session_date, sec.section_name, sub.subject_code, sub.subject_name, ses.period, ses.created_at, ses.is_locked
       ORDER BY ses.session_date DESC
       LIMIT 50`,
      [facultyId]
    );

    // Full timetable for this faculty
    const [facultyTimetable] = await query(
      `SELECT t.*, s.subject_name, s.subject_code, sec.section_name
       FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       JOIN section sec ON t.section_id = sec.section_id
       WHERE t.faculty_id = ?
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.start_time ASC`,
      [facultyId]
    );

    res.json({
      success: true,
      data: {
        roster: students || [],
        savedLogs: sessions || [],
        sections: assignedSections.length > 0 ? assignedSections : [{ section_id: 1, section_name: 'Section 1' }],
        subjects: assignedSubjects || [],
        timetable: (facultyTimetable || []).map(t => {
          const s12 = formatTime12(t.start_time);
          const e12 = formatTime12(t.end_time);
          return {
            time: `${s12} - ${e12}`,
            subject: `${t.subject_name} (${t.subject_code})`,
            classSection: t.section_name,
            room: t.room_no,
            day: t.day_of_week,
            type: t.timetable_type || (t.room_no && t.room_no.toLowerCase().includes('lab') ? 'Lab' : 'Lecture'),
            status: "Scheduled"
          };
        })
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save Attendance Session & Records with Transaction
 * POST /api/faculty/attendance
 * Idempotent: Repeated submissions for the same section/subject/date/period update existing records.
 */
async function saveAttendance(req, res, next) {
  let conn;
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    const { date, subject_id, section_id, period, topic, records, lock_attendance } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Student attendance records array is required.'
      });
    }

    const sessionDate = date || new Date().toISOString().split('T')[0];
    const sessionPeriod = period || 'Period 1';
    const subId = subject_id || 1;
    const secId = section_id || 1;

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Check if session exists for this subject, section, date, and period (concurrency lock)
    const [existingSessions] = await conn.execute(
      `SELECT session_id, session_date, is_locked, created_at FROM attendance_session
       WHERE subject_id = ? AND section_id = ? AND session_date = ? AND period = ?
       LIMIT 1 FOR UPDATE`,
      [subId, secId, sessionDate, sessionPeriod]
    );

    let sessionId;
    let isUpdate = false;

    if (existingSessions.length > 0) {
      const sess = existingSessions[0];
      const sessDate = new Date(sess.session_date);
      const isPastOneWeek = sessDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (sess.is_locked || isPastOneWeek) {
        await conn.rollback();
        conn.release();
        return res.status(403).json({
          success: false,
          message: 'Attendance for this session is locked. Records older than 7 days or locked by faculty cannot be altered.'
        });
      }

      sessionId = sess.session_id;
      isUpdate = true;
      await conn.execute(
        `UPDATE attendance_session 
         SET faculty_id = ?, topic_covered = ?, is_locked = COALESCE(?, is_locked) 
         WHERE session_id = ?`,
        [facultyId, topic || 'Curriculum Lecture Session', lock_attendance ? true : false, sessionId]
      );
    } else {
      const [sessResult] = await conn.execute(
        `INSERT INTO attendance_session (subject_id, faculty_id, section_id, session_date, period, topic_covered, is_locked)
         VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING session_id`,
        [subId, facultyId, secId, sessionDate, sessionPeriod, topic || 'Curriculum Lecture Session', lock_attendance ? true : false]
      );
      sessionId = sessResult[0]?.session_id || sessResult.insertId;
    }

    // Atomic multi-row upsert into attendance_record
    for (const rec of records) {
      const [existingRec] = await conn.execute(
        `SELECT attendance_id FROM attendance_record WHERE session_id = ? AND student_id = ?`,
        [sessionId, rec.student_id]
      );
      const attStatus = rec.status || 'Present';
      if (existingRec && existingRec.length > 0) {
        await conn.execute(
          `UPDATE attendance_record SET attendance_status = ?, status = ?, marked_at = NOW() WHERE attendance_id = ?`,
          [attStatus, attStatus, existingRec[0].attendance_id]
        );
      } else {
        await conn.execute(
          `INSERT INTO attendance_record (session_id, student_id, attendance_status, status, marked_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [sessionId, rec.student_id, attStatus, attStatus]
        );
      }
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: isUpdate 
        ? `Attendance records updated successfully for ${records.length} students (Session #${sessionId}).`
        : `Attendance session successfully logged for ${records.length} students (Session #${sessionId}).`,
      sessionId,
      isUpdate
    });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Get Grading Roster & Mark Sheets
 * GET /api/faculty/grading
 */
async function getGradingRoster(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    const [fac] = await query('SELECT department_id FROM faculty WHERE faculty_id = ?', [facultyId]);
    const deptId = fac[0]?.department_id || 1;

    const [marks] = await query(
      `SELECT m.mark_id, m.mid_sem, m.internal_marks, m.end_sem, m.marks_obtained, m.max_marks, m.grade_letter, m.status,
              s.student_id, s.roll_no, s.student_name AS name,
              sub.subject_code, sub.subject_name
       FROM marks m
       JOIN student s ON m.student_id = s.student_id
       JOIN exam_schedule es ON m.schedule_id = es.schedule_id
       JOIN subject sub ON es.subject_id = sub.subject_id
       WHERE s.department_id = ?
       ORDER BY s.roll_no ASC
       LIMIT 30`,
      [deptId]
    );

    res.json({
      success: true,
      data: marks || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save Student Marks (Uniform 20 Mid-Sem / 20 Internal / 60 End-Sem = 100 Total)
 * POST /api/faculty/grading
 */
async function saveGrading(req, res, next) {
  try {
    const { marks } = req.body;
    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({
        success: false,
        message: 'Marks array is required.'
      });
    }

    for (const m of marks) {
      const midSem = Number(m.mid_sem || 0);
      const internalMarks = Number(m.internal_marks || 0);
      const endSem = Number(m.end_sem || 0);
      const totalMarks = midSem + internalMarks + endSem;

      await query(
        `UPDATE marks 
         SET mid_sem = ?, internal_marks = ?, end_sem = ?, marks_obtained = ?, grade_letter = ?, status = ? 
         WHERE student_id = ?`,
        [midSem, internalMarks, endSem, totalMarks, m.grade_letter, m.status || 'Present', m.student_id]
      );
    }

    return res.json({
      success: true,
      message: `Successfully updated and sealed marks for ${marks.length} students.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Faculty Leave History
 * GET /api/faculty/leave
 */
async function getLeave(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    const [leaves] = await query(
      `SELECT l.leave_id AS id, l.leave_code, l.leave_type, l.start_date, l.end_date,
              l.days_count, l.reason, l.cover_faculty_name AS cover_faculty,
              l.status, l.applied_on, l.approver_comments
       FROM faculty_leave l
       WHERE l.faculty_id = ?
       ORDER BY l.applied_on DESC`,
      [facultyId]
    );

    res.json({
      success: true,
      data: leaves || []
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Apply for Faculty Leave
 * POST /api/faculty/leave
 */
async function applyLeave(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    const { leave_type, start_date, end_date, days_count, reason, cover_faculty } = req.body;
    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, and end date are required.'
      });
    }

    const leaveCode = `LV-2026-${Date.now().toString().slice(-4)}`;

    await query(
      `INSERT INTO faculty_leave (leave_code, faculty_id, leave_type, start_date, end_date, days_count, reason, cover_faculty_name, status, applied_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Request Sent', CURRENT_DATE)`,
      [leaveCode, facultyId, leave_type, start_date, end_date, days_count || 1, reason || 'Personal Leave', cover_faculty || null]
    );

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully.',
      data: {
        id: leaveCode,
        leave_code: leaveCode,
        leave_type,
        start_date,
        end_date,
        days_count,
        reason,
        cover_faculty,
        status: 'Request Sent',
        applied_on: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Faculty Payroll & Monthly Payslips
 * GET /api/faculty/payroll
 */
async function getPayroll(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID not associated with account.' });
    }

    const [payroll] = await query(
      `SELECT * FROM faculty_payroll
       WHERE faculty_id = ?
       ORDER BY year DESC, month DESC`,
      [facultyId]
    );

    res.json({
      success: true,
      data: (payroll || []).map(p => ({
        id: p.slip_id,
        slip_id: p.slip_id,
        month: p.month,
        year: p.year,
        basic_salary: Number(p.basic_salary),
        da_allowance: Number(p.da_allowance),
        hra_allowance: Number(p.hra_allowance),
        travel_allowance: Number(p.travel_allowance),
        academic_allowance: Number(p.academic_allowance),
        gross_salary: Number(p.gross_salary),
        pf_deduction: Number(p.pf_deduction),
        income_tax: Number(p.income_tax),
        professional_tax: Number(p.professional_tax),
        total_deductions: Number(p.total_deductions),
        net_salary: Number(p.net_salary),
        disbursement_date: p.disbursement_date,
        payment_mode: p.payment_mode,
        status: p.status
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Faculty Timetable with conflict resolution metadata
 * GET /api/faculty/timetable
 */
async function getTimetable(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID required.' });
    }

    const [timetable] = await query(
      `SELECT t.*, s.subject_name, s.subject_code, sec.section_name, d.department_name
       FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       JOIN section sec ON t.section_id = sec.section_id
       JOIN department d ON sec.department_id = d.department_id
       WHERE t.faculty_id = ?
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.start_time ASC`,
      [facultyId]
    );

    res.json({
      success: true,
      data: (timetable || []).map(t => ({
        ...t,
        start_time_12: formatTime12(t.start_time),
        end_time_12: formatTime12(t.end_time),
        time: `${formatTime12(t.start_time)} - ${formatTime12(t.end_time)}`
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Timetable Slot with Scheduling Conflict Detection
 * POST /api/faculty/timetable
 */
async function createTimetableEntry(req, res, next) {
  try {
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty ID required.' });
    }

    const { section_id, subject_id, semester_id, day_of_week, start_time, end_time, room_no, timetable_type } = req.body;

    if (!section_id || !subject_id || !day_of_week || !start_time || !end_time || !room_no) {
      return res.status(400).json({
        success: false,
        message: 'section_id, subject_id, day_of_week, start_time, end_time, and room_no are required.'
      });
    }

    // 1. Conflict Check: Section schedule overlap
    const [secConflict] = await query(
      `SELECT t.*, s.subject_name FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       WHERE t.section_id = ? AND t.day_of_week = ?
         AND NOT (t.end_time <= ? OR t.start_time >= ?)`,
      [section_id, day_of_week, start_time, end_time]
    );
    if (secConflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Scheduling Conflict: Section already has lecture '${secConflict[0].subject_name}' scheduled on ${day_of_week} (${formatTime12(secConflict[0].start_time)} - ${formatTime12(secConflict[0].end_time)}).`
      });
    }

    // 2. Conflict Check: Faculty schedule overlap
    const [facConflict] = await query(
      `SELECT t.*, s.subject_name FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       WHERE t.faculty_id = ? AND t.day_of_week = ?
         AND NOT (t.end_time <= ? OR t.start_time >= ?)`,
      [facultyId, day_of_week, start_time, end_time]
    );
    if (facConflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Faculty Scheduling Conflict: You already have lecture '${facConflict[0].subject_name}' assigned on ${day_of_week} (${formatTime12(facConflict[0].start_time)} - ${formatTime12(facConflict[0].end_time)}).`
      });
    }

    // 3. Conflict Check: Venue / Room overlap
    const [roomConflict] = await query(
      `SELECT t.*, s.subject_name, sec.section_name FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       JOIN section sec ON t.section_id = sec.section_id
       WHERE t.room_no = ? AND t.day_of_week = ?
         AND NOT (t.end_time <= ? OR t.start_time >= ?)`,
      [room_no, day_of_week, start_time, end_time]
    );
    if (roomConflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Venue Conflict: Room '${room_no}' is already occupied on ${day_of_week} (${formatTime12(roomConflict[0].start_time)} - ${formatTime12(roomConflict[0].end_time)}) by ${roomConflict[0].section_name}.`
      });
    }

    const [result] = await query(
      `INSERT INTO timetable (section_id, subject_id, faculty_id, semester_id, day_of_week, start_time, end_time, room_no, timetable_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [section_id, subject_id, facultyId, semester_id || 5, day_of_week, start_time, end_time, room_no, timetable_type || 'Lecture']
    );

    res.status(201).json({
      success: true,
      message: 'Timetable entry successfully created and committed to MySQL.',
      timetable_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Timetable Slot
 * PUT /api/faculty/timetable/:id
 */
async function updateTimetableEntry(req, res, next) {
  try {
    const timetableId = parseInt(req.params.id, 10);
    const facultyId = req.user.faculty_id;

    const { section_id, subject_id, semester_id, day_of_week, start_time, end_time, room_no, timetable_type } = req.body;

    // Check conflict excluding this slot
    const [secConflict] = await query(
      `SELECT t.*, s.subject_name FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       WHERE t.section_id = ? AND t.day_of_week = ? AND t.timetable_id != ?
         AND NOT (t.end_time <= ? OR t.start_time >= ?)`,
      [section_id, day_of_week, timetableId, start_time, end_time]
    );
    if (secConflict.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Scheduling Conflict: Section already has lecture '${secConflict[0].subject_name}' scheduled at this time.`
      });
    }

    await query(
      `UPDATE timetable 
       SET section_id = ?, subject_id = ?, semester_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room_no = ?, timetable_type = ?
       WHERE timetable_id = ? AND faculty_id = ?`,
      [section_id, subject_id, semester_id || 5, day_of_week, start_time, end_time, room_no, timetable_type || 'Lecture', timetableId, facultyId]
    );

    res.json({
      success: true,
      message: 'Timetable entry updated successfully in MySQL.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Timetable Slot
 * DELETE /api/faculty/timetable/:id
 */
async function deleteTimetableEntry(req, res, next) {
  try {
    const timetableId = parseInt(req.params.id, 10);
    const facultyId = req.user.faculty_id;

    await query(
      `DELETE FROM timetable WHERE timetable_id = ? AND faculty_id = ?`,
      [timetableId, facultyId]
    );

    res.json({
      success: true,
      message: 'Timetable entry deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Faculty Preview Mode: View Student Interface & Academic Record (Read-Only)
 * GET /api/faculty/preview-student/:studentId
 */
async function getStudentPreview(req, res, next) {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const facultyId = req.user.faculty_id;
    if (!facultyId) {
      return res.status(403).json({ success: false, message: 'Faculty access required.' });
    }

    const [students] = await query(
      `SELECT s.student_id, s.roll_no, s.prn, s.student_name, s.email, s.current_year, s.current_semester, s.branch,
              d.department_name, sec.section_name, c.course_name
       FROM student s
       JOIN department d ON s.department_id = d.department_id
       LEFT JOIN section sec ON s.section_id = sec.section_id
       LEFT JOIN course c ON c.department_id = s.department_id
       WHERE s.student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const student = students[0];

    // Live attendance summary using view
    const [attendance] = await query(
      `SELECT * FROM v_student_attendance_summary WHERE student_id = ?`,
      [studentId]
    );

    // Timetable
    const [timetable] = await query(
      `SELECT t.*, s.subject_name, s.subject_code, f.faculty_name, sec.section_name
       FROM timetable t
       JOIN subject s ON t.subject_id = s.subject_id
       JOIN faculty f ON t.faculty_id = f.faculty_id
       JOIN section sec ON t.section_id = sec.section_id
       JOIN student st ON st.section_id = t.section_id
       WHERE st.student_id = ?
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.start_time`,
      [studentId]
    );

    // Fee summary using view
    const [feeSummary] = await query(
      `SELECT * FROM v_student_fee_balance WHERE student_id = ?`,
      [studentId]
    );

    res.json({
      success: true,
      previewMode: true,
      notice: 'READ-ONLY DEMONSTRATION PREVIEW - Passwords & Private Auth Tokens Protected',
      student,
      attendance: attendance || [],
      timetable: (timetable || []).map(t => ({
        ...t,
        start_time_12: formatTime12(t.start_time),
        end_time_12: formatTime12(t.end_time),
        time: `${formatTime12(t.start_time)} - ${formatTime12(t.end_time)}`
      })),
      feeSummary: feeSummary[0] || null
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  getDashboard,
  getAttendanceRoster,
  saveAttendance,
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getStudentPreview,
  getGradingRoster,
  saveGrading,
  getLeave,
  applyLeave,
  getPayroll
};
