import { createClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any)?.env || {};

// Retrieve credentials safely from environment variables (supports VITE and NEXT_PUBLIC prefixes)
const supabaseUrl = 
  metaEnv.VITE_SUPABASE_URL || 
  metaEnv.NEXT_PUBLIC_SUPABASE_URL || 
  'https://zkfpncueeexdpqtyrjbz.supabase.co';

const supabaseAnonKey = 
  metaEnv.VITE_SUPABASE_ANON_KEY || 
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || 
  metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_uVUguiu0veLb-CazbES7Bg_ak0F_DDR';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project') &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes('placeholder') &&
    !supabaseAnonKey.includes('your-supabase')
  );
};

// Authoritative Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// =============================================================================
// RECTIVE POSTGRESQL / SUPABASE DATA STORE & TRIGGER ENGINE
// Supports 6 Days Timetable (Mon-Sat, 09:00 AM - 04:00 PM) & Enrolled Scholars Roster
// =============================================================================

export interface StudentRecord {
  id: number;
  roll_no: string;
  prn: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  course_name: string;
  department_name: string;
  section_name: string;
  current_semester: number;
  gender: string;
  sgpa: number;
  cgpa: number;
  attendance_pct: number;
  fees_due: number;
  placement_status: 'Not Applied' | 'Applied' | 'Shortlisted' | 'Placed';
  timetable: Array<{
    day: string;
    day_of_week?: string;
    time: string;
    start_time?: string;
    end_time?: string;
    subject: string;
    subject_name?: string;
    code: string;
    subject_code?: string;
    faculty: string;
    faculty_name?: string;
    room: string;
    room_no?: string;
    type: string;
    timetable_type?: string;
    section_name?: string;
  }>;
  subjects: Array<{
    code: string;
    name: string;
    credits: number;
    attended: number;
    total: number;
    percentage: number;
    marks_obtained: number;
    max_marks: number;
    grade_letter: string;
    grade_point: number;
  }>;
  feeBills: Array<{
    id: string;
    semester: string;
    category: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    due_date: string;
    status: 'Paid' | 'Partially Paid' | 'Due';
  }>;
  feePayments: Array<{
    receipt_no: string;
    date: string;
    amount: number;
    fee_type: string;
    mode: string;
    status: string;
  }>;
  borrowedBooks: Array<{
    issue_id: string;
    title: string;
    author: string;
    isbn: string;
    accession_no: string;
    issue_date: string;
    due_date: string;
    status: 'Issued' | 'Overdue';
    fine_amount: number;
  }>;
  returnedBooks: Array<{
    return_id: string;
    title: string;
    isbn: string;
    returned_date: string;
    condition: string;
    fine_paid: number;
  }>;
  examApplications: Array<{
    app_id: string;
    type: string;
    semester: string;
    subject_code?: string;
    submission_date: string;
    fee_status: string;
    approval_status: string;
  }>;
  placementApplications: Array<{
    app_id: string;
    company_name: string;
    job_role: string;
    package: string;
    applied_date: string;
    status: string;
    interview_date?: string;
  }>;
}

// -----------------------------------------------------------------------------
// MASTER WEEKLY TIMETABLE: 6 DAYS (MONDAY TO SATURDAY, 09:00 AM TO 04:00 PM)
// -----------------------------------------------------------------------------
export const MASTER_CSE_TIMETABLE = [
  // MONDAY (09:00 AM - 04:00 PM)
  { day: 'Monday', day_of_week: 'Monday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Data Structures & Algorithms', subject_name: 'Data Structures & Algorithms', code: 'CS301', subject_code: 'CS301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Monday', day_of_week: 'Monday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'Database Management Systems', subject_name: 'Database Management Systems', code: 'CS302', subject_code: 'CS302', faculty: 'Prof. Arvind Sharma', faculty_name: 'Prof. Arvind Sharma', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Monday', day_of_week: 'Monday', time: '11:15 AM - 12:15 PM', start_time: '11:15:00', end_time: '12:15:00', subject: 'Computer Networks', subject_name: 'Computer Networks', code: 'CS303', subject_code: 'CS303', faculty: 'Prof. S. R. Patil', faculty_name: 'Prof. S. R. Patil', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Monday', day_of_week: 'Monday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'DBMS & SQL Advanced Laboratory', subject_name: 'DBMS & SQL Advanced Laboratory', code: 'CS302-P', subject_code: 'CS302-P', faculty: 'Prof. Arvind Sharma', faculty_name: 'Prof. Arvind Sharma', room: 'Lab 304', room_no: 'Lab 304', type: 'Lab', timetable_type: 'Lab', section_name: 'Section A (Div 1)' },
  { day: 'Monday', day_of_week: 'Monday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Algorithms Problem Solving Tutorial', subject_name: 'Algorithms Problem Solving Tutorial', code: 'CS301-T', subject_code: 'CS301-T', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', type: 'Tutorial', timetable_type: 'Tutorial', section_name: 'Section A (Div 1)' },

  // TUESDAY (09:00 AM - 04:00 PM)
  { day: 'Tuesday', day_of_week: 'Tuesday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Computer Networks', subject_name: 'Computer Networks', code: 'CS303', subject_code: 'CS303', faculty: 'Prof. S. R. Patil', faculty_name: 'Prof. S. R. Patil', room: 'AB-302', room_no: 'AB-302', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Tuesday', day_of_week: 'Tuesday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'Software Engineering & Agile', subject_name: 'Software Engineering & Agile', code: 'CS305', subject_code: 'CS305', faculty: 'Prof. Aditi Roy', faculty_name: 'Prof. Aditi Roy', room: 'AB-302', room_no: 'AB-302', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Tuesday', day_of_week: 'Tuesday', time: '11:15 AM - 12:15 PM', start_time: '11:15:00', end_time: '12:15:00', subject: 'Theory of Computation', subject_name: 'Theory of Computation', code: 'CS304', subject_code: 'CS304', faculty: 'Prof. Vivek Patil', faculty_name: 'Prof. Vivek Patil', room: 'AB-302', room_no: 'AB-302', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Tuesday', day_of_week: 'Tuesday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Data Structures & Algorithms Lab', subject_name: 'Data Structures & Algorithms Lab', code: 'CS301-P', subject_code: 'CS301-P', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Lab 301', room_no: 'Lab 301', type: 'Lab', timetable_type: 'Lab', section_name: 'Section A (Div 1)' },
  { day: 'Tuesday', day_of_week: 'Tuesday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Software Engineering Case Studies', subject_name: 'Software Engineering Case Studies', code: 'CS305-T', subject_code: 'CS305-T', faculty: 'Prof. Aditi Roy', faculty_name: 'Prof. Aditi Roy', room: 'AB-302', room_no: 'AB-302', type: 'Tutorial', timetable_type: 'Tutorial', section_name: 'Section A (Div 1)' },

  // WEDNESDAY (09:00 AM - 04:00 PM)
  { day: 'Wednesday', day_of_week: 'Wednesday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Theory of Computation', subject_name: 'Theory of Computation', code: 'CS304', subject_code: 'CS304', faculty: 'Prof. Vivek Patil', faculty_name: 'Prof. Vivek Patil', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Wednesday', day_of_week: 'Wednesday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'Data Structures & Algorithms', subject_name: 'Data Structures & Algorithms', code: 'CS301', subject_code: 'CS301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Wednesday', day_of_week: 'Wednesday', time: '11:15 AM - 12:15 PM', start_time: '11:15:00', end_time: '12:15:00', subject: 'Database Management Systems', subject_name: 'Database Management Systems', code: 'CS302', subject_code: 'CS302', faculty: 'Prof. Arvind Sharma', faculty_name: 'Prof. Arvind Sharma', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Wednesday', day_of_week: 'Wednesday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Computer Networks Socket Lab', subject_name: 'Computer Networks Socket Lab', code: 'CS303-P', subject_code: 'CS303-P', faculty: 'Prof. S. R. Patil', faculty_name: 'Prof. S. R. Patil', room: 'Lab 302', room_no: 'Lab 302', type: 'Lab', timetable_type: 'Lab', section_name: 'Section A (Div 1)' },
  { day: 'Wednesday', day_of_week: 'Wednesday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Microcontroller & IoT Systems', subject_name: 'Microcontroller & IoT Systems', code: 'EC301-OE', subject_code: 'EC301-OE', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },

  // THURSDAY (09:00 AM - 04:00 PM)
  { day: 'Thursday', day_of_week: 'Thursday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Software Engineering & Agile', subject_name: 'Software Engineering & Agile', code: 'CS305', subject_code: 'CS305', faculty: 'Prof. Aditi Roy', faculty_name: 'Prof. Aditi Roy', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Thursday', day_of_week: 'Thursday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'Computer Networks', subject_name: 'Computer Networks', code: 'CS303', subject_code: 'CS303', faculty: 'Prof. S. R. Patil', faculty_name: 'Prof. S. R. Patil', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Thursday', day_of_week: 'Thursday', time: '11:15 AM - 12:15 PM', start_time: '11:15:00', end_time: '12:15:00', subject: 'Theory of Computation', subject_name: 'Theory of Computation', code: 'CS304', subject_code: 'CS304', faculty: 'Prof. Vivek Patil', faculty_name: 'Prof. Vivek Patil', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Thursday', day_of_week: 'Thursday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Web Development & Cloud Lab', subject_name: 'Web Development & Cloud Lab', code: 'CS306-P', subject_code: 'CS306-P', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Lab 305', room_no: 'Lab 305', type: 'Lab', timetable_type: 'Lab', section_name: 'Section A (Div 1)' },
  { day: 'Thursday', day_of_week: 'Thursday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Embedded Sensors & Wireless Protocols', subject_name: 'Embedded Sensors & Wireless Protocols', code: 'EC302-OE', subject_code: 'EC302-OE', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'Lab 305', room_no: 'Lab 305', type: 'Lab', timetable_type: 'Lab', section_name: 'Section A (Div 1)' },

  // FRIDAY (09:00 AM - 04:00 PM)
  { day: 'Friday', day_of_week: 'Friday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Database Management Systems', subject_name: 'Database Management Systems', code: 'CS302', subject_code: 'CS302', faculty: 'Prof. Arvind Sharma', faculty_name: 'Prof. Arvind Sharma', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Friday', day_of_week: 'Friday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'Data Structures & Algorithms', subject_name: 'Data Structures & Algorithms', code: 'CS301', subject_code: 'CS301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Friday', day_of_week: 'Friday', time: '11:15 AM - 12:15 PM', start_time: '11:15:00', end_time: '12:15:00', subject: 'Software Engineering & Agile', subject_name: 'Software Engineering & Agile', code: 'CS305', subject_code: 'CS305', faculty: 'Prof. Aditi Roy', faculty_name: 'Prof. Aditi Roy', room: 'AB-301', room_no: 'AB-301', type: 'Lecture', timetable_type: 'Lecture', section_name: 'Section A (Div 1)' },
  { day: 'Friday', day_of_week: 'Friday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Capstone Project Lab & Review', subject_name: 'Capstone Project Lab & Review', code: 'PRJ-301', subject_code: 'PRJ-301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Project Lab 2', room_no: 'Project Lab 2', type: 'Lab', timetable_type: 'Lab', section_name: 'Section A (Div 1)' },
  { day: 'Friday', day_of_week: 'Friday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Faculty Mentorship & Doubts Session', subject_name: 'Faculty Mentorship & Doubts Session', code: 'CS-MENT', subject_code: 'CS-MENT', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', type: 'Mentorship', timetable_type: 'Mentorship', section_name: 'Section A (Div 1)' },

  // SATURDAY (09:00 AM - 04:00 PM)
  { day: 'Saturday', day_of_week: 'Saturday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Competitive Programming & DSA Coding', subject_name: 'Competitive Programming & DSA Coding', code: 'CS-CP1', subject_code: 'CS-CP1', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Lab 301', room_no: 'Lab 301', type: 'Practical', timetable_type: 'Practical', section_name: 'Section A (Div 1)' },
  { day: 'Saturday', day_of_week: 'Saturday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'IoT & Embedded Industry Seminar', subject_name: 'IoT & Embedded Industry Seminar', code: 'EC-IND', subject_code: 'EC-IND', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'Auditorium', room_no: 'Auditorium', type: 'Seminar', timetable_type: 'Seminar', section_name: 'Section A (Div 1)' },
  { day: 'Saturday', day_of_week: 'Saturday', time: '11:15 AM - 12:15 PM', start_time: '11:15:00', end_time: '12:15:00', subject: 'AI & Cloud Computing Innovations', subject_name: 'AI & Cloud Computing Innovations', code: 'AI-SEMINAR', subject_code: 'AI-SEMINAR', faculty: 'Prof. Vivek Patil', faculty_name: 'Prof. Vivek Patil', room: 'Auditorium', room_no: 'Auditorium', type: 'Seminar', timetable_type: 'Seminar', section_name: 'Section A (Div 1)' },
  { day: 'Saturday', day_of_week: 'Saturday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Hardware Hackathon & IoT Sprint Lab', subject_name: 'Hardware Hackathon & IoT Sprint Lab', code: 'EC-HACK', subject_code: 'EC-HACK', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'Innovation Hub', room_no: 'Innovation Hub', type: 'Workshop', timetable_type: 'Workshop', section_name: 'Section A (Div 1)' },
  { day: 'Saturday', day_of_week: 'Saturday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Student Council & Club Activities', subject_name: 'Student Council & Club Activities', code: 'CO-CURR', subject_code: 'CO-CURR', faculty: 'Student Council', faculty_name: 'Student Council', room: 'Sports Complex', room_no: 'Sports Complex', type: 'Activity', timetable_type: 'Activity', section_name: 'Section A (Div 1)' }
];

// FACULTY TEACHING TIMETABLE: Prof. Ashwini Nair (Monday to Saturday, 09:00 AM - 04:00 PM)
export const MASTER_FACULTY_TIMETABLE = [
  // Monday
  { day: 'Monday', day_of_week: 'Monday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Data Structures & Algorithms (CS301)', subject_name: 'Data Structures & Algorithms', subject_code: 'CS301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lecture', timetable_type: 'Lecture', status: 'Completed' },
  { day: 'Monday', day_of_week: 'Monday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Algorithms Problem Solving Tutorial (CS301-T)', subject_name: 'Algorithms Problem Solving Tutorial', subject_code: 'CS301-T', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Tutorial', timetable_type: 'Tutorial', status: 'Upcoming' },

  // Tuesday
  { day: 'Tuesday', day_of_week: 'Tuesday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Data Structures & Algorithms Lab (CS301-P)', subject_name: 'Data Structures & Algorithms Lab', subject_code: 'CS301-P', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Lab 301', room_no: 'Lab 301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lab', timetable_type: 'Lab', status: 'Upcoming' },

  // Wednesday
  { day: 'Wednesday', day_of_week: 'Wednesday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'Data Structures & Algorithms (CS301)', subject_name: 'Data Structures & Algorithms', subject_code: 'CS301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lecture', timetable_type: 'Lecture', status: 'Upcoming' },

  // Thursday
  { day: 'Thursday', day_of_week: 'Thursday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Web Development & Cloud Lab (CS306-P)', subject_name: 'Web Development & Cloud Lab', subject_code: 'CS306-P', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Lab 305', room_no: 'Lab 305', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lab', timetable_type: 'Lab', status: 'Upcoming' },

  // Friday
  { day: 'Friday', day_of_week: 'Friday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'Data Structures & Algorithms (CS301)', subject_name: 'Data Structures & Algorithms', subject_code: 'CS301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lecture', timetable_type: 'Lecture', status: 'Upcoming' },
  { day: 'Friday', day_of_week: 'Friday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Capstone Project Lab & Review (PRJ-301)', subject_name: 'Capstone Project Lab & Review', subject_code: 'PRJ-301', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Project Lab 2', room_no: 'Project Lab 2', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lab', timetable_type: 'Lab', status: 'Upcoming' },
  { day: 'Friday', day_of_week: 'Friday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Faculty Mentorship & Doubts Session (CS-MENT)', subject_name: 'Faculty Mentorship & Doubts Session', subject_code: 'CS-MENT', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Mentorship', timetable_type: 'Mentorship', status: 'Upcoming' },

  // Saturday
  { day: 'Saturday', day_of_week: 'Saturday', time: '09:00 AM - 10:00 AM', start_time: '09:00:00', end_time: '10:00:00', subject: 'Competitive Programming & DSA Coding (CS-CP1)', subject_name: 'Competitive Programming & DSA Coding', subject_code: 'CS-CP1', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'Lab 301', room_no: 'Lab 301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Practical', timetable_type: 'Practical', status: 'Upcoming' },
  { day: 'Saturday', day_of_week: 'Saturday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Student Project Mentoring & Review', subject_name: 'Student Project Mentoring & Review', subject_code: 'CS-REV', faculty: 'Prof. Ashwini Nair', faculty_name: 'Prof. Ashwini Nair', room: 'AB-301', room_no: 'AB-301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Mentorship', timetable_type: 'Mentorship', status: 'Upcoming' }
];

// FACULTY TEACHING TIMETABLE: Prof. Varun Pawar (Associate Professor - E&TC / IoT Interdisciplinary)
export const MASTER_FACULTY_TIMETABLE_VARUN = [
  // Wednesday
  { day: 'Wednesday', day_of_week: 'Wednesday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Microcontroller & IoT Systems (EC301-OE)', subject_name: 'Microcontroller & IoT Systems', subject_code: 'EC301-OE', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'AB-301', room_no: 'AB-301', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lecture', timetable_type: 'Lecture', status: 'Upcoming' },

  // Thursday
  { day: 'Thursday', day_of_week: 'Thursday', time: '03:15 PM - 04:00 PM', start_time: '15:15:00', end_time: '16:00:00', subject: 'Embedded Sensors & Wireless Protocols (EC302-OE)', subject_name: 'Embedded Sensors & Wireless Protocols', subject_code: 'EC302-OE', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'Lab 305', room_no: 'Lab 305', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Lab', timetable_type: 'Lab', status: 'Upcoming' },

  // Saturday
  { day: 'Saturday', day_of_week: 'Saturday', time: '10:15 AM - 11:15 AM', start_time: '10:15:00', end_time: '11:15:00', subject: 'IoT & Embedded Industry Seminar (EC-IND)', subject_name: 'IoT & Embedded Industry Seminar', subject_code: 'EC-IND', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'Auditorium', room_no: 'Auditorium', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Seminar', timetable_type: 'Seminar', status: 'Upcoming' },
  { day: 'Saturday', day_of_week: 'Saturday', time: '01:15 PM - 03:15 PM', start_time: '13:15:00', end_time: '15:15:00', subject: 'Hardware Hackathon & IoT Sprint Lab (EC-HACK)', subject_name: 'Hardware Hackathon & IoT Sprint Lab', subject_code: 'EC-HACK', faculty: 'Prof. Varun Pawar', faculty_name: 'Prof. Varun Pawar', room: 'Innovation Hub', room_no: 'Innovation Hub', classSection: 'B.Tech CSE - Section A', section_name: 'Section A (Div 1)', type: 'Workshop', timetable_type: 'Workshop', status: 'Upcoming' }
];

// Helper to generate distinct subjects for CSE students
const makeCseSubjects = (attPct: number, marksBase: number) => {
  const f = attPct / 100;
  const gradeFromPct = (p: number) => (p >= 90 ? 'O' : p >= 80 ? 'A+' : p >= 70 ? 'A' : p >= 60 ? 'B+' : 'B');
  const gpFromPct = (p: number) => (p >= 90 ? 10 : p >= 80 ? 9 : p >= 70 ? 8 : p >= 60 ? 7 : 6);

  const sub1Marks = Math.min(100, Math.round(marksBase + (Math.random() * 6 - 3)));
  const sub2Marks = Math.min(100, Math.round(marksBase - 2 + (Math.random() * 6 - 3)));
  const sub3Marks = Math.min(100, Math.round(marksBase - 4 + (Math.random() * 6 - 3)));
  const sub4Marks = Math.min(100, Math.round(marksBase + 1 + (Math.random() * 6 - 3)));
  const sub5Marks = Math.min(100, Math.round(marksBase + 3 + (Math.random() * 6 - 3)));

  return [
    { code: 'CS301', name: 'Data Structures & Algorithms', credits: 4, attended: Math.round(24 * f), total: 24, percentage: Number((f * 100).toFixed(1)), marks_obtained: sub1Marks, max_marks: 100, grade_letter: gradeFromPct(sub1Marks), grade_point: gpFromPct(sub1Marks) },
    { code: 'CS302', name: 'Database Management Systems', credits: 4, attended: Math.round(24 * Math.max(0.65, f - 0.03)), total: 24, percentage: Number((Math.max(0.65, f - 0.03) * 100).toFixed(1)), marks_obtained: sub2Marks, max_marks: 100, grade_letter: gradeFromPct(sub2Marks), grade_point: gpFromPct(sub2Marks) },
    { code: 'CS303', name: 'Computer Networks', credits: 4, attended: Math.round(24 * Math.max(0.60, f - 0.05)), total: 24, percentage: Number((Math.max(0.60, f - 0.05) * 100).toFixed(1)), marks_obtained: sub3Marks, max_marks: 100, grade_letter: gradeFromPct(sub3Marks), grade_point: gpFromPct(sub3Marks) },
    { code: 'CS304', name: 'Theory of Computation', credits: 3, attended: Math.round(20 * f), total: 20, percentage: Number((f * 100).toFixed(1)), marks_obtained: sub4Marks, max_marks: 100, grade_letter: gradeFromPct(sub4Marks), grade_point: gpFromPct(sub4Marks) },
    { code: 'CS305', name: 'Software Engineering & Agile', credits: 3, attended: Math.round(20 * Math.min(1, f + 0.02)), total: 20, percentage: Number((Math.min(1, f + 0.02) * 100).toFixed(1)), marks_obtained: sub5Marks, max_marks: 100, grade_letter: gradeFromPct(sub5Marks), grade_point: gpFromPct(sub5Marks) }
  ];
};

// -----------------------------------------------------------------------------
// 25 ACTIVE ENROLLED SCHOLARS IN SECTION A (CSE) + ENTC & AI&DS SCHOLARS
// -----------------------------------------------------------------------------
const INITIAL_STUDENTS: Record<string, StudentRecord> = {
  '31001': {
    id: 1,
    roll_no: '31001',
    prn: 'F24CE001',
    name: 'Kavya Mohan Kulkarni',
    email: 'f24ce001@student.example.edu',
    phone: '9876500101',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.45,
    cgpa: 8.20,
    attendance_pct: 92.5,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(92.5, 86),
    feeBills: [
      { id: 'BILL-SEM5-31001', semester: 'Semester 5', category: 'Tuition & Development Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' },
      { id: 'BILL-SEM4-31001', semester: 'Semester 4', category: 'Tuition & Development Fee', total_amount: 65000, paid_amount: 65000, due_amount: 0, due_date: '2025-01-30', status: 'Paid' }
    ],
    feePayments: [
      { receipt_no: 'REC-2025-00142', date: '2025-08-15', amount: 68000, fee_type: 'Semester 5 Tuition Fee', mode: 'Online UPI (GPay)', status: 'Success' }
    ],
    borrowedBooks: [
      { issue_id: 'ISS-2025-041', title: 'Introduction to Algorithms (CLRS 3rd Ed.)', author: 'Cormen, Leiserson, Rivest', isbn: '978-0262033848', accession_no: 'ACC-CLRS-003', issue_date: '2026-10-20', due_date: '2026-11-04', status: 'Issued', fine_amount: 0 }
    ],
    returnedBooks: [
      { return_id: 'RET-2025-019', title: 'The C Programming Language', isbn: '978-0131103627', returned_date: '2026-09-28', condition: 'Good', fine_paid: 0 }
    ],
    examApplications: [
      { app_id: 'EXAM-REG-SEM5-01', type: 'Regular Semester 5 Examination', semester: 'Semester 5', submission_date: '2026-10-05', fee_status: 'Paid', approval_status: 'Approved' }
    ],
    placementApplications: [
      { app_id: 'PL-ACC-01', company_name: 'Accenture Interactive', job_role: 'Associate Software Engineer', package: '6.50 LPA', applied_date: '2026-10-02', status: 'Shortlisted', interview_date: '2026-11-05' }
    ]
  },

  '31002': {
    id: 2,
    roll_no: '31002',
    prn: 'F24CE002',
    name: 'Siddharth Eknath Nale',
    email: 'f24ce002@student.example.edu',
    phone: '9876500102',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 6.82,
    cgpa: 7.15,
    attendance_pct: 73.0,
    fees_due: 33000.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(73.0, 68),
    feeBills: [
      { id: 'BILL-SEM5-31002', semester: 'Semester 5', category: 'Tuition & Development Fee', total_amount: 68000, paid_amount: 35000, due_amount: 33000, due_date: '2025-09-30', status: 'Partially Paid' }
    ],
    feePayments: [
      { receipt_no: 'REC-2025-00219', date: '2025-08-20', amount: 35000, fee_type: 'Semester 5 (1st Installment)', mode: 'NetBanking (SBI)', status: 'Success' }
    ],
    borrowedBooks: [
      { issue_id: 'ISS-2025-018', title: 'Database System Concepts (6th Edition)', author: 'Silberschatz, Korth', isbn: '978-0073523323', accession_no: 'ACC-DBMS-012', issue_date: '2026-10-05', due_date: '2026-10-20', status: 'Overdue', fine_amount: 15.00 }
    ],
    returnedBooks: [],
    examApplications: [
      { app_id: 'EXAM-REG-SEM5-02', type: 'Regular Semester 5 Examination', semester: 'Semester 5', submission_date: '2026-10-08', fee_status: 'Paid', approval_status: 'Approved' }
    ],
    placementApplications: [
      { app_id: 'PL-TCS-02', company_name: 'Tata Consultancy Services', job_role: 'Ninja Developer', package: '4.00 LPA', applied_date: '2026-10-12', status: 'Applied' }
    ]
  },

  '31003': {
    id: 3,
    roll_no: '31003',
    prn: 'F24CE003',
    name: 'Om Pankaj Tiwari',
    email: 'f24ce003@student.example.edu',
    phone: '9876500103',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.60,
    cgpa: 7.55,
    attendance_pct: 88.0,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(88.0, 78),
    feeBills: [
      { id: 'BILL-SEM5-31003', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }
    ],
    feePayments: [
      { receipt_no: 'REC-2025-00108', date: '2025-08-18', amount: 68000, fee_type: 'Semester 5 Tuition Fee', mode: 'Credit Card', status: 'Success' }
    ],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: [
      { app_id: 'PL-TCS-03', company_name: 'Tata Consultancy Services', job_role: 'Systems Engineer', package: '7.00 LPA', applied_date: '2026-10-10', status: 'Applied' }
    ]
  },

  '31004': {
    id: 4,
    roll_no: '31004',
    prn: 'F24CE004',
    name: 'Rohan Anand Iyer',
    email: 'f24ce004@student.example.edu',
    phone: '9876500104',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 9.40,
    cgpa: 9.18,
    attendance_pct: 96.0,
    fees_due: 0.0,
    placement_status: 'Placed',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(96.0, 94),
    feeBills: [
      { id: 'BILL-SEM5-31004', semester: 'Semester 5', category: 'Tuition & Development Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }
    ],
    feePayments: [
      { receipt_no: 'REC-2025-00109', date: '2025-08-10', amount: 68000, fee_type: 'Semester 5 Tuition Fee', mode: 'Credit Card (Full Payment)', status: 'Success' }
    ],
    borrowedBooks: [
      { issue_id: 'ISS-2025-072', title: 'Computer Networks (5th Edition)', author: 'Tanenbaum & Wetherall', isbn: '978-0132126953', accession_no: 'ACC-NET-005', issue_date: '2026-10-22', due_date: '2026-11-06', status: 'Issued', fine_amount: 0 }
    ],
    returnedBooks: [],
    examApplications: [
      { app_id: 'EXAM-REG-SEM5-04', type: 'Regular Semester 5 Examination', semester: 'Semester 5', submission_date: '2026-10-02', fee_status: 'Paid', approval_status: 'Approved' }
    ],
    placementApplications: [
      { app_id: 'PL-AMZ-01', company_name: 'Amazon AWS', job_role: 'Software Development Engineer (SDE-1)', package: '18.50 LPA', applied_date: '2026-09-15', status: 'Selected', interview_date: '2026-10-10' }
    ]
  },

  '31005': {
    id: 5,
    roll_no: '31005',
    prn: 'F24CE005',
    name: 'Ananya Rajesh Deshmukh',
    email: 'f24ce005@student.example.edu',
    phone: '9876500105',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.92,
    cgpa: 8.75,
    attendance_pct: 94.0,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(94.0, 89),
    feeBills: [{ id: 'BILL-SEM5-31005', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00105', date: '2025-08-11', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: [{ app_id: 'PL-DESH-01', company_name: 'Amazon AWS', job_role: 'Cloud Associate', package: '14.00 LPA', applied_date: '2026-09-20', status: 'Shortlisted' }]
  },

  '31006': {
    id: 6,
    roll_no: '31006',
    prn: 'F24CE006',
    name: 'Aditya Suresh Sharma',
    email: 'f24ce006@student.example.edu',
    phone: '9876500106',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.80,
    cgpa: 7.65,
    attendance_pct: 84.5,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(84.5, 76),
    feeBills: [{ id: 'BILL-SEM5-31006', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00106', date: '2025-08-12', amount: 68000, fee_type: 'Tuition Fee', mode: 'NetBanking', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31007': {
    id: 7,
    roll_no: '31007',
    prn: 'F24CE007',
    name: 'Priya Nitin Joshi',
    email: 'f24ce007@student.example.edu',
    phone: '9876500107',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.55,
    cgpa: 8.40,
    attendance_pct: 91.0,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(91.0, 85),
    feeBills: [{ id: 'BILL-SEM5-31007', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00107', date: '2025-08-14', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31008': {
    id: 8,
    roll_no: '31008',
    prn: 'F24CE008',
    name: 'Harshil Manish Mehta',
    email: 'f24ce008@student.example.edu',
    phone: '9876500108',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.20,
    cgpa: 7.10,
    attendance_pct: 78.5,
    fees_due: 25000.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(78.5, 71),
    feeBills: [{ id: 'BILL-SEM5-31008', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 43000, due_amount: 25000, due_date: '2025-09-30', status: 'Partially Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00108A', date: '2025-08-16', amount: 43000, fee_type: 'Tuition Fee (Part)', mode: 'NetBanking', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31009': {
    id: 9,
    roll_no: '31009',
    prn: 'F24CE009',
    name: 'Riya Sameer Kadam',
    email: 'f24ce009@student.example.edu',
    phone: '9876500109',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.70,
    cgpa: 8.60,
    attendance_pct: 93.5,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(93.5, 87),
    feeBills: [{ id: 'BILL-SEM5-31009', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00109A', date: '2025-08-18', amount: 68000, fee_type: 'Tuition Fee', mode: 'Credit Card', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31010': {
    id: 10,
    roll_no: '31010',
    prn: 'F24CE010',
    name: 'Tanmay Sanjay Shinde',
    email: 'f24ce010@student.example.edu',
    phone: '9876500110',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.45,
    cgpa: 7.30,
    attendance_pct: 82.0,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(82.0, 74),
    feeBills: [{ id: 'BILL-SEM5-31010', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00110', date: '2025-08-19', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31011': {
    id: 11,
    roll_no: '31011',
    prn: 'F24CE011',
    name: 'Ishita Deepak Verma',
    email: 'f24ce011@student.example.edu',
    phone: '9876500111',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 9.15,
    cgpa: 9.02,
    attendance_pct: 95.0,
    fees_due: 0.0,
    placement_status: 'Placed',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(95.0, 92),
    feeBills: [{ id: 'BILL-SEM5-31011', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00111', date: '2025-08-11', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: [{ app_id: 'PL-TCS-11', company_name: 'Tata Consultancy Services', job_role: 'Digital Specialist', package: '8.50 LPA', applied_date: '2026-09-18', status: 'Selected' }]
  },

  '31012': {
    id: 12,
    roll_no: '31012',
    prn: 'F24CE012',
    name: 'Varun Nitin Patil',
    email: 'f24ce012@student.example.edu',
    phone: '9876500112',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 6.95,
    cgpa: 7.00,
    attendance_pct: 76.0,
    fees_due: 18000.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(76.0, 69),
    feeBills: [{ id: 'BILL-SEM5-31012', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 50000, due_amount: 18000, due_date: '2025-09-30', status: 'Partially Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00112', date: '2025-08-21', amount: 50000, fee_type: 'Tuition Fee', mode: 'NetBanking', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31013': {
    id: 13,
    roll_no: '31013',
    prn: 'F24CE013',
    name: 'Sneha Vilas Jadhav',
    email: 'f24ce013@student.example.edu',
    phone: '9876500113',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.30,
    cgpa: 8.22,
    attendance_pct: 89.0,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(89.0, 83),
    feeBills: [{ id: 'BILL-SEM5-31013', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00113', date: '2025-08-15', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31014': {
    id: 14,
    roll_no: '31014',
    prn: 'F24CE014',
    name: 'Aryan Pradeep Nair',
    email: 'f24ce014@student.example.edu',
    phone: '9876500114',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 8.10,
    cgpa: 7.98,
    attendance_pct: 86.5,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(86.5, 80),
    feeBills: [{ id: 'BILL-SEM5-31014', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00114', date: '2025-08-16', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31015': {
    id: 15,
    roll_no: '31015',
    prn: 'F24CE015',
    name: 'Meera Ravindra Shah',
    email: 'f24ce015@student.example.edu',
    phone: '9876500115',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.65,
    cgpa: 8.50,
    attendance_pct: 90.5,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(90.5, 86),
    feeBills: [{ id: 'BILL-SEM5-31015', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00115', date: '2025-08-17', amount: 68000, fee_type: 'Tuition Fee', mode: 'Credit Card', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31016': {
    id: 16,
    roll_no: '31016',
    prn: 'F24CE016',
    name: 'Kunal Ashok Bhosale',
    email: 'f24ce016@student.example.edu',
    phone: '9876500116',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 6.75,
    cgpa: 6.90,
    attendance_pct: 74.0,
    fees_due: 30000.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(74.0, 66),
    feeBills: [{ id: 'BILL-SEM5-31016', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 38000, due_amount: 30000, due_date: '2025-09-30', status: 'Partially Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00116', date: '2025-08-22', amount: 38000, fee_type: 'Tuition Fee', mode: 'NetBanking', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31017': {
    id: 17,
    roll_no: '31017',
    prn: 'F24CE017',
    name: 'Pooja Mahesh Choudhary',
    email: 'f24ce017@student.example.edu',
    phone: '9876500117',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.80,
    cgpa: 8.65,
    attendance_pct: 92.0,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(92.0, 87),
    feeBills: [{ id: 'BILL-SEM5-31017', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00117', date: '2025-08-14', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31018': {
    id: 18,
    roll_no: '31018',
    prn: 'F24CE018',
    name: 'Sahil Ramesh Gokhale',
    email: 'f24ce018@student.example.edu',
    phone: '9876500118',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.95,
    cgpa: 7.85,
    attendance_pct: 85.0,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(85.0, 79),
    feeBills: [{ id: 'BILL-SEM5-31018', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00118', date: '2025-08-18', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31019': {
    id: 19,
    roll_no: '31019',
    prn: 'F24CE019',
    name: 'Neha Chandrakant More',
    email: 'f24ce019@student.example.edu',
    phone: '9876500119',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.90,
    cgpa: 8.78,
    attendance_pct: 93.0,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(93.0, 88),
    feeBills: [{ id: 'BILL-SEM5-31019', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00119', date: '2025-08-15', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31020': {
    id: 20,
    roll_no: '31020',
    prn: 'F24CE020',
    name: 'Pranav Hemant Tambe',
    email: 'f24ce020@student.example.edu',
    phone: '9876500120',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.35,
    cgpa: 7.25,
    attendance_pct: 80.0,
    fees_due: 15000.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(80.0, 72),
    feeBills: [{ id: 'BILL-SEM5-31020', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 53000, due_amount: 15000, due_date: '2025-09-30', status: 'Partially Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00120', date: '2025-08-20', amount: 53000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31021': {
    id: 21,
    roll_no: '31021',
    prn: 'F24CE021',
    name: 'Divya Sunil Waghmare',
    email: 'f24ce021@student.example.edu',
    phone: '9876500121',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.25,
    cgpa: 8.15,
    attendance_pct: 88.5,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(88.5, 82),
    feeBills: [{ id: 'BILL-SEM5-31021', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00121', date: '2025-08-16', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31022': {
    id: 22,
    roll_no: '31022',
    prn: 'F24CE022',
    name: 'Gaurav Anil Gaikwad',
    email: 'f24ce022@student.example.edu',
    phone: '9876500122',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.05,
    cgpa: 7.00,
    attendance_pct: 77.0,
    fees_due: 20000.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(77.0, 70),
    feeBills: [{ id: 'BILL-SEM5-31022', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 48000, due_amount: 20000, due_date: '2025-09-30', status: 'Partially Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00122', date: '2025-08-22', amount: 48000, fee_type: 'Tuition Fee', mode: 'NetBanking', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31023': {
    id: 23,
    roll_no: '31023',
    prn: 'F24CE023',
    name: 'Shruti Jagdish Mane',
    email: 'f24ce023@student.example.edu',
    phone: '9876500123',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.60,
    cgpa: 8.48,
    attendance_pct: 91.5,
    fees_due: 0.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(91.5, 86),
    feeBills: [{ id: 'BILL-SEM5-31023', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00123', date: '2025-08-14', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31024': {
    id: 24,
    roll_no: '31024',
    prn: 'F24CE024',
    name: 'Sanket Sunil Kale',
    email: 'f24ce024@student.example.edu',
    phone: '9876500124',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.70,
    cgpa: 7.55,
    attendance_pct: 83.0,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(83.0, 76),
    feeBills: [{ id: 'BILL-SEM5-31024', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00124', date: '2025-08-19', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '31025': {
    id: 25,
    roll_no: '31025',
    prn: 'F24CE025',
    name: 'Aniket Dilip Pawar',
    email: 'f24ce025@student.example.edu',
    phone: '9876500125',
    branch: 'Computer Science & Engineering',
    course_name: 'B.Tech in Computer Science and Engineering',
    department_name: 'Computer Science Department',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 8.00,
    cgpa: 7.90,
    attendance_pct: 87.0,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: makeCseSubjects(87.0, 80),
    feeBills: [{ id: 'BILL-SEM5-31025', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }],
    feePayments: [{ receipt_no: 'REC-2025-00125', date: '2025-08-15', amount: 68000, fee_type: 'Tuition Fee', mode: 'UPI', status: 'Success' }],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: []
  },

  '32001': {
    id: 26,
    roll_no: '32001',
    prn: 'F24ET001',
    name: 'Viraj Pankaj Kale',
    email: 'f24et001@student.example.edu',
    phone: '9876500201',
    branch: 'Electronics & Telecommunication',
    course_name: 'B.Tech in Electronics & Telecommunication',
    department_name: 'Electronics and Telecommunication',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Male',
    sgpa: 7.10,
    cgpa: 7.05,
    attendance_pct: 81.0,
    fees_due: 20000.0,
    placement_status: 'Shortlisted',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: [
      { code: 'ET301', name: 'VLSI Design & Architecture', credits: 4, attended: 19, total: 24, percentage: 79.2, marks_obtained: 72, max_marks: 100, grade_letter: 'A', grade_point: 8 },
      { code: 'ET302', name: 'Signals & Embedded Systems', credits: 4, attended: 20, total: 24, percentage: 83.3, marks_obtained: 70, max_marks: 100, grade_letter: 'A', grade_point: 8 }
    ],
    feeBills: [
      { id: 'BILL-SEM5-32001', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 65000, paid_amount: 45000, due_amount: 20000, due_date: '2025-09-30', status: 'Partially Paid' }
    ],
    feePayments: [
      { receipt_no: 'REC-2025-00334', date: '2025-08-25', amount: 45000, fee_type: 'Semester 5 Partial Payment', mode: 'Demand Draft', status: 'Success' }
    ],
    borrowedBooks: [],
    returnedBooks: [],
    examApplications: [],
    placementApplications: [
      { app_id: 'PL-TI-01', company_name: 'Texas Instruments', job_role: 'VLSI Design Engineer', package: '12.00 LPA', applied_date: '2026-10-01', status: 'Shortlisted', interview_date: '2026-11-12' }
    ]
  },

  '35001': {
    id: 27,
    roll_no: '35001',
    prn: 'F24AI001',
    name: 'Nidhi Vishwas Dhumal',
    email: 'f24ai001@student.example.edu',
    phone: '9876500301',
    branch: 'Artificial Intelligence & Data Science',
    course_name: 'B.Tech in Artificial Intelligence & Data Science',
    department_name: 'Artificial Intelligence and Data Science',
    section_name: 'Section A (Div 1)',
    current_semester: 5,
    gender: 'Female',
    sgpa: 8.85,
    cgpa: 8.70,
    attendance_pct: 89.5,
    fees_due: 0.0,
    placement_status: 'Applied',
    timetable: MASTER_CSE_TIMETABLE,
    subjects: [
      { code: 'AI301', name: 'Deep Learning & Neural Networks', credits: 4, attended: 21, total: 24, percentage: 87.5, marks_obtained: 88, max_marks: 100, grade_letter: 'A+', grade_point: 9 },
      { code: 'AI302', name: 'Natural Language Processing', credits: 4, attended: 22, total: 24, percentage: 91.7, marks_obtained: 90, max_marks: 100, grade_letter: 'O', grade_point: 10 }
    ],
    feeBills: [
      { id: 'BILL-SEM5-35001', semester: 'Semester 5', category: 'Tuition Fee', total_amount: 68000, paid_amount: 68000, due_amount: 0, due_date: '2025-09-30', status: 'Paid' }
    ],
    feePayments: [
      { receipt_no: 'REC-2025-00455', date: '2025-08-12', amount: 68000, fee_type: 'Semester 5 Tuition Fee', mode: 'Online UPI', status: 'Success' }
    ],
    borrowedBooks: [
      { issue_id: 'ISS-2025-099', title: 'Artificial Intelligence: A Modern Approach', author: 'Russell & Norvig', isbn: '978-0136042594', accession_no: 'ACC-AI-002', issue_date: '2026-10-18', due_date: '2026-11-02', status: 'Issued', fine_amount: 0 }
    ],
    returnedBooks: [],
    examApplications: [],
    placementApplications: [
      { app_id: 'PL-NV-01', company_name: 'Nvidia Corporation', job_role: 'AI Solutions Engineer', package: '14.00 LPA', applied_date: '2026-10-15', status: 'Applied' }
    ]
  }
};

// Global Centralized Library Catalog
export interface LibraryBook {
  id: number;
  isbn: string;
  title: string;
  author_names: string;
  category_name: string;
  shelf_no: string;
  rack_no: string;
  total_copies: number;
  available_copies: number;
}

export const CENTRAL_LIBRARY_BOOKS: LibraryBook[] = [
  { id: 1, isbn: '978-0131103627', title: 'The C Programming Language (2nd Ed)', author_names: 'Brian W. Kernighan, Dennis M. Ritchie', category_name: 'Programming', shelf_no: 'A-12', rack_no: 'R-03', total_copies: 15, available_copies: 11 },
  { id: 2, isbn: '978-0262033848', title: 'Introduction to Algorithms (CLRS 3rd Ed)', author_names: 'Thomas H. Cormen, Charles E. Leiserson', category_name: 'Core Algorithms', shelf_no: 'B-04', rack_no: 'R-01', total_copies: 20, available_copies: 14 },
  { id: 3, isbn: '978-0073523323', title: 'Database System Concepts (6th Ed)', author_names: 'Abraham Silberschatz, Henry F. Korth', category_name: 'Databases', shelf_no: 'C-08', rack_no: 'R-02', total_copies: 18, available_copies: 9 },
  { id: 4, isbn: '978-0132126953', title: 'Computer Networks (5th Ed)', author_names: 'Andrew S. Tanenbaum, David J. Wetherall', category_name: 'Networking', shelf_no: 'D-02', rack_no: 'R-04', total_copies: 12, available_copies: 8 },
  { id: 5, isbn: '978-0136042594', title: 'Artificial Intelligence: A Modern Approach', author_names: 'Stuart Russell, Peter Norvig', category_name: 'AI & Data Science', shelf_no: 'E-01', rack_no: 'R-01', total_copies: 10, available_copies: 4 },
  { id: 6, isbn: '978-0132350884', title: 'Clean Code: A Handbook of Agile Craftsmanship', author_names: 'Robert C. Martin', category_name: 'Software Eng', shelf_no: 'F-05', rack_no: 'R-02', total_copies: 8, available_copies: 6 }
];

// In-Memory Reactive State Store with localStorage persistence and automatic schema upgrades
const STORE_VERSION = 'v4_matched_schedule_and_salary_fix';

class ReactiveSupabaseStore {
  private students: Record<string, StudentRecord>;
  private libraryBooks: LibraryBook[];

  constructor() {
    const version = localStorage.getItem('supabase_store_version');
    const saved = localStorage.getItem('supabase_students_store');

    if (version === STORE_VERSION && saved) {
      try {
        this.students = JSON.parse(saved);
        // Verify timetable length, ensure 6-day coverage
        const first = Object.values(this.students)[0];
        if (!first || first.timetable.length < 20) {
          this.students = { ...INITIAL_STUDENTS };
        }
      } catch {
        this.students = { ...INITIAL_STUDENTS };
      }
    } else {
      // Clean upgrade to 6-day timetable and 25-scholar cohort
      this.students = { ...INITIAL_STUDENTS };
      localStorage.setItem('supabase_store_version', STORE_VERSION);
    }

    const savedBooks = localStorage.getItem('supabase_books_store');
    if (savedBooks) {
      try {
        this.libraryBooks = JSON.parse(savedBooks);
      } catch {
        this.libraryBooks = [...CENTRAL_LIBRARY_BOOKS];
      }
    } else {
      this.libraryBooks = [...CENTRAL_LIBRARY_BOOKS];
    }

    this.save();
  }

  private save() {
    try {
      localStorage.setItem('supabase_students_store', JSON.stringify(this.students));
      localStorage.setItem('supabase_books_store', JSON.stringify(this.libraryBooks));
      localStorage.setItem('supabase_store_version', STORE_VERSION);
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  getStudent(identifier: string): StudentRecord {
    const cleanId = String(identifier).trim().toLowerCase();
    for (const [roll, student] of Object.entries(this.students)) {
      if (
        roll.toLowerCase() === cleanId ||
        student.email.toLowerCase() === cleanId ||
        student.prn.toLowerCase() === cleanId
      ) {
        return student;
      }
    }
    return this.students['31001'];
  }

  getAllStudents(): StudentRecord[] {
    return Object.values(this.students);
  }

  // Returns all enrolled scholars in Section A (25 students)
  getEnrolledRoster(sectionName?: string) {
    const all = this.getAllStudents();
    const filtered = sectionName && sectionName !== 'All'
      ? all.filter(s => s.section_name.toLowerCase().includes(sectionName.toLowerCase()) || s.branch.includes('Computer'))
      : all.filter(s => s.department_name.includes('Computer'));

    return (filtered.length > 0 ? filtered : all).map(s => ({
      student_id: s.id,
      roll_no: s.roll_no,
      name: s.name,
      email: s.email,
      gender: s.gender,
      attendance_pct: s.attendance_pct,
      status: s.attendance_pct >= 75 ? 'Present' : 'Absent',
      sgpa: s.sgpa,
      department: s.department_name,
      section_name: s.section_name
    }));
  }

  // Returns faculty timetable (Monday to Saturday, 09:00 AM - 04:00 PM)
  getFacultyTimetableSlots(facultyCodeOrName?: string) {
    const q = (facultyCodeOrName || '').toLowerCase();
    if (q.includes('fac-002') || q.includes('pawar') || q.includes('varun') || q.includes('etc') || q.includes('telecom')) {
      return MASTER_FACULTY_TIMETABLE_VARUN;
    }
    return MASTER_FACULTY_TIMETABLE;
  }

  // Returns student weekly timetable (Monday to Saturday, 09:00 AM - 04:00 PM)
  getWeeklyTimetable() {
    return MASTER_CSE_TIMETABLE;
  }

  // TRIGGER SIMULATION 1: Attendance marking updates student attendance summary & overall %
  recordAttendance(subjectCode: string, studentRoll: string, status: 'Present' | 'Absent') {
    const student = this.getStudent(studentRoll);
    if (!student) return;

    student.subjects = student.subjects.map(sub => {
      if (sub.code === subjectCode) {
        const total = sub.total + 1;
        const attended = sub.attended + (status === 'Present' ? 1 : 0);
        const percentage = Number(((attended / total) * 100).toFixed(1));
        return { ...sub, total, attended, percentage };
      }
      return sub;
    });

    // Recalculate overall attendance percentage
    const totalAttended = student.subjects.reduce((acc, s) => acc + s.attended, 0);
    const totalClasses = student.subjects.reduce((acc, s) => acc + s.total, 0);
    student.attendance_pct = totalClasses > 0 ? Number(((totalAttended / totalClasses) * 100).toFixed(1)) : 85.0;

    this.save();
  }

  // TRIGGER SIMULATION 2: Grade updating recalculates SGPA and CGPA in real time
  updateGrade(studentRoll: string, subjectCode: string, marksObtained: number, maxMarks: number = 100) {
    const student = this.getStudent(studentRoll);
    if (!student) return;

    const pct = (marksObtained / maxMarks) * 100;
    const gradeLetter = pct >= 90 ? 'O' : pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'B+' : pct >= 50 ? 'B' : 'F';
    const gradePoint = pct >= 90 ? 10 : pct >= 80 ? 9 : pct >= 70 ? 8 : pct >= 60 ? 7 : pct >= 50 ? 6 : 0;

    student.subjects = student.subjects.map(sub => {
      if (sub.code === subjectCode) {
        return { ...sub, marks_obtained: marksObtained, max_marks: maxMarks, grade_letter: gradeLetter, grade_point: gradePoint };
      }
      return sub;
    });

    // Recalculate SGPA
    const totalCreds = student.subjects.reduce((acc, s) => acc + s.credits, 0);
    const weightedPoints = student.subjects.reduce((acc, s) => acc + s.credits * s.grade_point, 0);
    if (totalCreds > 0) {
      student.sgpa = Number((weightedPoints / totalCreds).toFixed(2));
      student.cgpa = Number(((student.cgpa * 4 + student.sgpa) / 5).toFixed(2));
    }

    this.save();
  }

  // TRIGGER SIMULATION 3: Fee Payment updates invoice balance and clearance status immediately
  recordFeePayment(studentRoll: string, billId: string, amount: number, paymentMode: string = 'Online UPI') {
    const student = this.getStudent(studentRoll);
    if (!student) return;

    student.feeBills = student.feeBills.map(bill => {
      if (bill.id === billId || !billId) {
        const paid_amount = Math.min(bill.total_amount, bill.paid_amount + amount);
        const due_amount = Math.max(0, bill.total_amount - paid_amount);
        const status = due_amount === 0 ? 'Paid' : 'Partially Paid';
        return { ...bill, paid_amount, due_amount, status };
      }
      return bill;
    });

    const receipt_no = `REC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    student.feePayments.unshift({
      receipt_no,
      date: new Date().toISOString().split('T')[0],
      amount,
      fee_type: 'Semester 5 Tuition Installment',
      mode: paymentMode,
      status: 'Success'
    });

    // Recalculate global fees due
    student.fees_due = student.feeBills.reduce((acc, b) => acc + b.due_amount, 0);
    this.save();
  }

  // TRIGGER SIMULATION 4: Book Issue/Return updates available copies and overdue fines
  issueBook(studentRoll: string, bookId: number): boolean {
    const book = this.libraryBooks.find(b => b.id === bookId);
    if (!book || book.available_copies <= 0) return false;

    const student = this.getStudent(studentRoll);
    if (!student) return false;

    book.available_copies -= 1;
    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    student.borrowedBooks.unshift({
      issue_id: `ISS-${Date.now()}`,
      title: book.title,
      author: book.author_names,
      isbn: book.isbn,
      accession_no: `ACC-${book.isbn.slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
      issue_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'Issued',
      fine_amount: 0
    });

    this.save();
    return true;
  }

  returnBook(studentRoll: string, issueId: string) {
    const student = this.getStudent(studentRoll);
    if (!student) return;

    const issueIndex = student.borrowedBooks.findIndex(b => b.issue_id === issueId);
    if (issueIndex === -1) return;

    const [returned] = student.borrowedBooks.splice(issueIndex, 1);
    const book = this.libraryBooks.find(b => b.isbn === returned.isbn);
    if (book) {
      book.available_copies = Math.min(book.total_copies, book.available_copies + 1);
    }

    student.returnedBooks.unshift({
      return_id: `RET-${Date.now()}`,
      title: returned.title,
      isbn: returned.isbn,
      returned_date: new Date().toISOString().split('T')[0],
      condition: 'Good',
      fine_paid: returned.fine_amount
    });

    this.save();
  }

  // TRIGGER SIMULATION 5: Placement Selection updates offer record & student placement status
  updatePlacementStatus(studentRoll: string, driveName: string, status: string, packageLpa?: string) {
    const student = this.getStudent(studentRoll);
    if (!student) return;

    student.placementApplications = student.placementApplications.map(app => {
      if (app.company_name.toLowerCase().includes(driveName.toLowerCase())) {
        return { ...app, status };
      }
      return app;
    });

    if (status === 'Selected' || status === 'Placed') {
      student.placement_status = 'Placed';
    }

    this.save();
  }

  getLibraryCatalog() {
    return this.libraryBooks;
  }
}

export const reactiveDb = new ReactiveSupabaseStore();
