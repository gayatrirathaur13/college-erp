// College ERP Shared TypeScript Types (Matching Consolidated Master Design)

// --- AUTH & ROLES ---
export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT' | 'STAFF' | 'LIBRARIAN' | 'TPO';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  rollOrCode?: string;
}

// --- MODULE 1: STUDENT MANAGEMENT ---
export interface Student {
  student_id: number;
  roll_no: string;
  prn: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  category?: string;
  admission_year: number;
  current_year: number;
  current_semester: number;
  admission_status: 'Active' | 'Passout' | 'Suspended' | 'Detained' | 'Left';
  phone?: string;
  email: string;
  department_id: number;
  course_id: number;
  section_id?: number;
  department_name?: string;
  course_name?: string;
  section_name?: string;
}

export interface StudentAddress {
  student_address_id: number;
  student_id: number;
  address_type: 'Permanent' | 'Current' | 'Local';
  street_address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface StudentContact {
  contact_id: number;
  student_id: number;
  mobile_number: string;
  alternate_mobile?: string;
  personal_email?: string;
  institute_email?: string;
}

export interface Guardian {
  guardian_id: number;
  student_id: number;
  guardian_name: string;
  relation: string;
  occupation?: string;
  contact_number: string;
  email?: string;
}

export interface AcademicHistory {
  academic_history_id: number;
  student_id: number;
  qualification_level: string;
  institute_name: string;
  board_university: string;
  percentage_gpa: number;
  passing_year: number;
}

// --- MODULE 2: FACULTY & STAFF MANAGEMENT ---
export interface Department {
  department_id: number;
  department_name: string;
  location?: string;
  hod_faculty_id?: number;
  hod_name?: string;
  faculty_count?: number;
  student_count?: number;
}

export interface Designation {
  designation_id: number;
  designation_name: string;
  category: 'Teaching' | 'Non-Teaching';
}

export interface Faculty {
  faculty_id: number;
  faculty_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_no?: string;
  department_id: number;
  designation_id: number;
  joining_date: string;
  qualification?: string;
  status: 'Active' | 'On Leave' | 'Resigned' | 'Retired';
  department_name?: string;
  designation_name?: string;
}

export interface Staff {
  staff_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_no?: string;
  department_id: number;
  designation_id: number;
  joining_date: string;
  status: 'Active' | 'On Leave' | 'Resigned' | 'Retired';
  department_name?: string;
  designation_name?: string;
}

export interface Salary {
  payroll_id: number;
  employee_type: 'Faculty' | 'Staff';
  employee_id: number;
  employee_name?: string;
  basic_salary: number;
  allowance: number;
  deduction: number;
  net_salary: number;
  payment_date?: string;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  payment_mode: 'Bank Transfer' | 'Cheque' | 'Cash';
}

// --- MODULE 3: ACADEMIC & COURSE MANAGEMENT ---
export interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  course_type: 'UG' | 'PG' | 'Diploma' | 'Doctorate';
  duration_years: number;
  total_credits: number;
  department_id: number;
  status: 'Active' | 'Discontinued';
  department_name?: string;
}

export interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  subject_type: 'Theory' | 'Practical' | 'Elective' | 'Seminar';
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  status: 'Active' | 'Inactive';
}

export interface Semester {
  semester_id: number;
  semester_number: number;
  semester_name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

export interface CourseSubject {
  course_subject_id: number;
  course_id: number;
  subject_id: number;
  semester_id: number;
  subject_order: number;
  is_elective: boolean;
  academic_year: string;
  status: 'Active' | 'Inactive';
  subject_name?: string;
  subject_code?: string;
  course_name?: string;
}

export interface Section {
  section_id: number;
  section_name: string;
  batch_name?: string;
  course_id: number;
  semester_id: number;
  academic_year: string;
  room_no?: string;
  capacity: number;
  status: 'Active' | 'Inactive';
  course_name?: string;
}

export interface Timetable {
  timetable_id: number;
  section_id: number;
  subject_id: number;
  faculty_id: number;
  semester_id: number;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string;
  end_time: string;
  room_no: string;
  timetable_type: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar' | 'Workshop' | 'Practical' | 'Activity' | 'Mentorship' | string;
  subject_name?: string;
  faculty_name?: string;
  section_name?: string;
}

export interface FacultySubject {
  faculty_subject_id: number;
  faculty_id: number;
  subject_id: number;
  section_id: number;
  semester_id: number;
  teaching_role: 'Primary' | 'Assistant' | 'Lab Incharge';
  assigned_date: string;
  status: 'Active' | 'Inactive';
  faculty_name?: string;
  subject_name?: string;
}

// --- MODULE 4: ATTENDANCE MANAGEMENT ---
export interface Attendance {
  attendance_id: number;
  student_id: number;
  subject_id: number;
  faculty_id: number;
  section_id: number;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Late';
  student_name?: string;
  roll_no?: string;
  subject_name?: string;
}

export interface AttendanceSummary {
  attendance_summary_id: number;
  student_id: number;
  subject_id: number;
  total_classes: number;
  classes_attended: number;
  classes_absent: number;
  attendance_percentage: number;
  student_name?: string;
  roll_no?: string;
  subject_name?: string;
}

// --- MODULE 5: EXAMINATION & RESULT MANAGEMENT ---
export interface Exam {
  exam_id: number;
  exam_name: string;
  exam_type: 'Mid-Semester' | 'End-Semester' | 'Internal' | 'Practical';
  academic_year: string;
  semester_id: number;
  semester_name?: string;
}

export interface ExamSchedule {
  schedule_id: number;
  exam_id: number;
  subject_id: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string;
  max_marks: number;
  subject_name?: string;
}

export interface Marks {
  mark_id: number;
  schedule_id: number;
  student_id: number;
  marks_obtained: number;
  grade_letter?: string;
  grade_point?: number;
  status: 'Present' | 'Absent' | 'Malpractice';
  student_name?: string;
  roll_no?: string;
  subject_name?: string;
  max_marks?: number;
}

export interface Result {
  result_id: number;
  student_id: number;
  exam_id: number;
  result_date: string;
  sgpa: number;
  cgpa: number;
  overall_status: 'Pass' | 'Fail' | 'Withheld' | 'ATKT';
  student_name?: string;
  roll_no?: string;
  exam_name?: string;
}

// --- MODULE 6: LIBRARY MANAGEMENT ---
export interface BookCategory {
  category_id: number;
  category_name: string;
  description?: string;
}

export interface Author {
  author_id: number;
  author_name: string;
  email?: string;
  nationality?: string;
}

export interface Publisher {
  publisher_id: number;
  publisher_name: string;
  email?: string;
}

export interface Book {
  isbn: string;
  title: string;
  edition?: string;
  publication_year?: number;
  language: string;
  no_of_pages?: number;
  shelf_no?: string;
  rack_no?: string;
  shelf_location?: string;
  total_copies: number;
  available_copies: number;
  category_id: number;
  publisher_id: number;
  category_name?: string;
  publisher_name?: string;
  author_names?: string;
}

export interface BookCopy {
  copy_id: number;
  isbn: string;
  accession_no: string;
  purchase_date: string;
  status: 'Available' | 'Issued' | 'Lost' | 'Damaged';
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
}

export interface Librarian {
  librarian_id: number;
  staff_id: number;
  staff_name?: string;
}

export interface BookIssue {
  issue_id: number;
  isbn: string;
  copy_id: number;
  student_id: number;
  librarian_id: number;
  issue_date: string;
  due_date: string;
  issue_status: 'Issued' | 'Returned' | 'Overdue' | 'Lost';
  remarks?: string;
  book_title?: string;
  student_name?: string;
  accession_no?: string;
}

export interface BookReturn {
  return_id: number;
  issue_id: number;
  return_date: string;
  condition_on_return: 'Good' | 'Damaged' | 'Lost';
  days_late: number;
  remarks?: string;
}

export interface Fine {
  fine_id: number;
  student_id: number;
  return_id: number;
  fine_type: 'Late Return' | 'Damage' | 'Lost Book';
  fine_amount: number;
  fine_date: string;
  paid_date?: string;
  payment_status: 'Unpaid' | 'Paid' | 'Waived';
  student_name?: string;
}

// --- MODULE 7: FEES & FINANCE ---
export interface FeeStructure {
  fee_structure_id: number;
  course_id: number;
  semester_id: number;
  exam_id?: number;
  fee_type: 'Tuition' | 'Exam' | 'Hostel' | 'Library' | 'Laboratory' | 'Other';
  amount: number;
  course_name?: string;
  semester_name?: string;
}

export interface Scholarship {
  scholarship_id: number;
  name: string;
  type: 'Merit' | 'Need-based' | 'Sports' | 'Government' | 'Institutional';
  amount: number;
  start_date: string;
  end_date: string;
}

export interface StudentFee {
  student_fee_id: number;
  student_id: number;
  fee_structure_id: number;
  scholarship_id?: number;
  amount_due: number;
  amount_paid: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  student_name?: string;
  roll_no?: string;
  fee_type?: string;
}

export interface Payment {
  payment_id: number;
  student_fee_id: number;
  amount: number;
  payment_date: string;
  payment_mode: 'Online Gateway' | 'Demand Draft' | 'UPI' | 'Cash' | 'Bank Transfer';
  student_name?: string;
}

export interface FinanceFine {
  finance_fine_id: number;
  student_id: number;
  amount: number;
  reason: string;
  fine_date: string;
  payment_status: 'Pending' | 'Paid' | 'Waived';
  student_name?: string;
}

// --- MODULE 8: TRAINING, PLACEMENT & COMMUNICATION ---
export interface Company {
  company_id: number;
  company_name: string;
  industry_type?: string;
  location?: string;
  website?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface JobDrive {
  drive_id: number;
  company_id: number;
  job_role: string;
  job_type: 'Full-time' | 'Internship' | 'Internship + PPO';
  package: string;
  drive_date: string;
  description?: string;
  company_name?: string;
}

export interface Eligibility {
  eligibility_id: number;
  drive_id: number;
  minimum_cgpa: number;
  backlog_allowed: number;
  allowed_branch?: string;
  other_criteria?: string;
}

export interface Application {
  application_id: number;
  student_id: number;
  drive_id: number;
  application_date: string;
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected';
  student_name?: string;
  roll_no?: string;
  company_name?: string;
  job_role?: string;
}

export interface Interview {
  interview_id: number;
  application_id: number;
  round_no: number;
  interview_date: string;
  round_type: 'Online Assessment' | 'Technical Round 1' | 'Technical Round 2' | 'HR Round' | 'Group Discussion';
  feedback?: string;
  status: 'Scheduled' | 'Cleared' | 'Not Cleared' | 'Absent';
  student_name?: string;
  company_name?: string;
}

export interface Placement {
  placement_id: number;
  application_id: number;
  job_role: string;
  package: string;
  joining_date?: string;
  status: 'Offered' | 'Accepted' | 'Rejected';
  student_name?: string;
  company_name?: string;
}

export interface Training {
  training_id: number;
  training_name: string;
  provider: string;
  description?: string;
  start_date: string;
  end_date: string;
  enrolled_count?: number;
}

export interface TrainingEnrollment {
  enrollment_id: number;
  student_id: number;
  training_id: number;
  enrollment_date: string;
  status: 'Enrolled' | 'Completed' | 'Dropped';
  student_name?: string;
  training_name?: string;
}

export interface Announcement {
  announcement_id: number;
  posted_by: string;
  title: string;
  description: string;
  announcement_date: string;
  category?: 'Urgent' | 'Academic' | 'Placement' | 'General';
}
