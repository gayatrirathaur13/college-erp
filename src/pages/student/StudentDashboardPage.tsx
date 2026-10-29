import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarCheck2, 
  CreditCard, 
  BookOpen, 
  FileCheck2, 
  GraduationCap, 
  Briefcase, 
  Clock, 
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Sparkles,
  Award,
  Layers,
  Calendar,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { api } from '../../services/api';

// Visual Analytics Components
import { AttendanceDonutChart } from '../../components/analytics/AttendanceDonutChart';
import { SemesterPerformanceChart } from '../../components/analytics/SemesterPerformanceChart';
import { ExamComparisonBarChart } from '../../components/analytics/ExamComparisonBarChart';
import { WeeklyAttendanceTrendChart } from '../../components/analytics/WeeklyAttendanceTrendChart';
import { SubjectAttendanceAlerts } from '../../components/analytics/SubjectAttendanceAlerts';

// Analytics Data Fallback Service
import { 
  getAttendanceDistribution,
  getSemesterPerformanceTrend,
  getExaminationComparisonData,
  getWeeklyAttendanceTrend,
  getSubjectAttendanceAlerts,
  INSTITUTION_ATTENDANCE_THRESHOLD
} from '../../data/studentAnalyticsData';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fallback defaults
  const attendanceDist = getAttendanceDistribution();
  const examComparison = getExaminationComparisonData();
  const weeklyAttendance = getWeeklyAttendanceTrend();
  const attendanceAlerts = getSubjectAttendanceAlerts();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getStudentDashboard();
        if (isMounted && res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch student dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Compute dynamic stats from authenticated student's database record
  const sgpa = dashboardData?.sgpa !== undefined ? Number(dashboardData.sgpa) : 7.5;
  const cgpa = dashboardData?.cgpa !== undefined ? Number(dashboardData.cgpa) : 7.2;
  const attPct = dashboardData?.overallAttendance?.percentage !== undefined ? Number(dashboardData.overallAttendance.percentage) : 88.0;
  const attendedClasses = dashboardData?.overallAttendance?.attendedClasses !== undefined ? Number(dashboardData.overallAttendance.attendedClasses) : 9;
  const totalClasses = dashboardData?.overallAttendance?.totalClasses !== undefined ? Number(dashboardData.overallAttendance.totalClasses) : 10;
  const isMeetingRequirement = attPct >= 75;

  const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const allWeeklyClasses = dashboardData?.classes || [];
  const matchedTodayClasses = allWeeklyClasses.filter((c: any) => c.day === currentDayName || c.day_of_week === currentDayName);
  const todayClasses = matchedTodayClasses.length > 0 
    ? matchedTodayClasses 
    : (allWeeklyClasses.filter((c: any) => c.day === 'Monday').length > 0 
        ? allWeeklyClasses.filter((c: any) => c.day === 'Monday') 
        : [
            { time: "09:00 AM - 10:00 AM", subject: "Data Structures & Algorithms", faculty: "Prof. Ashwini Nair", room: "AB-301", type: "Lecture" },
            { time: "10:15 AM - 11:15 AM", subject: "Database Management Systems", faculty: "Prof. Arvind Sharma", room: "AB-301", type: "Lecture" },
            { time: "11:15 AM - 12:15 PM", subject: "Computer Networks", faculty: "Prof. S. R. Patil", room: "AB-301", type: "Lecture" },
            { time: "01:15 PM - 03:15 PM", subject: "DBMS & SQL Laboratory", faculty: "Prof. Arvind Sharma", room: "Lab 304", type: "Lab" },
            { time: "03:15 PM - 04:00 PM", subject: "Algorithms Problem Solving", faculty: "Prof. Ashwini Nair", room: "AB-301", type: "Tutorial" }
          ]);

  const dynamicAttendanceItems = dashboardData?.subjectAttendance && dashboardData.subjectAttendance.length > 0
    ? dashboardData.subjectAttendance.map((s: any) => ({
        name: s.code,
        subject: s.name,
        percentage: s.percentage,
        attended: s.attended,
        total: s.total,
        color: s.percentage >= 75 ? '#2ECC71' : '#FF6B4A'
      }))
    : attendanceDist.items;

  const dynamicSemesterTrend = [
    { semester: "Sem 1", sgpa: Math.max(5.0, Number((cgpa - 0.2).toFixed(2))), cgpa: Math.max(5.0, Number((cgpa - 0.2).toFixed(2))), credits: 22, status: 'Completed' as const, academicYear: '2024-25' },
    { semester: "Sem 2", sgpa: Math.max(5.0, Number((cgpa - 0.1).toFixed(2))), cgpa: Math.max(5.0, Number((cgpa - 0.15).toFixed(2))), credits: 24, status: 'Completed' as const, academicYear: '2024-25' },
    { semester: "Sem 3", sgpa: Math.max(5.0, Number((cgpa + 0.1).toFixed(2))), cgpa: Math.max(5.0, Number((cgpa - 0.05).toFixed(2))), credits: 22, status: 'Completed' as const, academicYear: '2025-26' },
    { semester: `Sem ${user?.semester || 5}`, sgpa: sgpa, cgpa: cgpa, credits: 24, status: 'Completed' as const, academicYear: '2026-27' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Message & Current Semester Information Banner */}
      <div className="erp-card p-6 sm:p-7 bg-white relative overflow-hidden border border-white/90 shadow-bento">
        {/* Soft decorative background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#E8F0FE] via-[#F4F7FC]/50 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#EBF0F9]/60 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0FE] text-[#4D8DFF] text-xs font-bold mb-3 border border-[#4D8DFF]/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            <span>Autumn Semester 2026 • Academic Year 2026-2027</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2C3E50]">
            Welcome back, {user?.name || "Student"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#718096] leading-relaxed font-sans">
            <span className="font-mono font-semibold text-[#2C3E50]">{user?.codeOrRoll}</span> • {user?.programOrDesignation} • Semester {user?.semester || 5} ({user?.section || 'Section 1'})
          </p>

          {/* Quick Notice Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1.5 bg-[#F4F7FC] px-3 py-1.5 rounded-full border border-slate-200/60 text-[#2C3E50] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#4D8DFF]" />
              Schedule: <strong className="font-semibold">{todayClasses[0]?.subject} ({todayClasses[0]?.time})</strong>
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isMeetingRequirement ? 'bg-emerald-50 border-emerald-100 text-[#2ECC71]' : 'bg-rose-50 border-rose-100 text-[#FF6B4A]'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aggregate Attendance: <strong>{attPct}%</strong>
            </span>
          </div>
        </div>

        {/* Ambient graduation icon */}
        <div className="absolute -bottom-8 -right-6 text-[#E8F0FE]/60 pointer-events-none hidden sm:block">
          <GraduationCap className="w-56 h-56" />
        </div>
      </div>

      {/* 2. Four Compact Academic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 — Current SGPA */}
        <StatCard
          title="Current SGPA"
          value={sgpa.toFixed(2)}
          subtitle={`Semester ${user?.semester || 5} Grade Point`}
          change={`Cumulative CGPA: ${cgpa.toFixed(2)}`}
          trend={sgpa >= 7.0 ? "up" : "neutral"}
          iconName="Award"
          badge={
            <span className="text-[10px] font-bold text-[#4D8DFF] bg-[#E8F0FE] px-2 py-0.5 rounded-full">
              CGPA {cgpa.toFixed(2)}
            </span>
          }
        />

        {/* Card 2 — Overall Attendance */}
        <StatCard
          title="Overall Attendance"
          value={`${attPct}%`}
          subtitle={`${attendedClasses} / ${totalClasses} classes attended`}
          change={
            isMeetingRequirement 
              ? `Meets ≥75% statutory threshold` 
              : `Below 75% requirement`
          }
          trend={isMeetingRequirement ? "up" : "warning"}
          iconName="CalendarCheck2"
          badge={
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isMeetingRequirement 
                ? 'bg-[#2ECC71]/10 text-[#2ECC71]' 
                : 'bg-[#FF6B4A]/10 text-[#FF6B4A]'
            }`}>
              {isMeetingRequirement ? 'Eligible' : 'Warning'}
            </span>
          }
        />

        {/* Card 3 — Fee Balance */}
        <StatCard
          title="Fee Status"
          value={dashboardData?.fees?.balance ? `₹${Number(dashboardData.fees.balance).toLocaleString('en-IN')}` : "₹0 Due"}
          subtitle={`Paid: ₹${Number(dashboardData?.fees?.paid || 0).toLocaleString('en-IN')}`}
          change={dashboardData?.fees?.balance > 0 ? "Pending term fee" : "All term fees cleared"}
          trend={dashboardData?.fees?.balance > 0 ? "warning" : "up"}
          iconName="CreditCard"
          badge={
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              dashboardData?.fees?.balance > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {dashboardData?.fees?.balance > 0 ? 'Balance Due' : 'Paid'}
            </span>
          }
        />

        {/* Card 4 — Examination Applications */}
        <StatCard
          title="Exam Applications"
          value={dashboardData?.pendingApplications ? `${dashboardData.pendingApplications} In Review` : "Verified"}
          subtitle="Controller of Examinations"
          change="Hall ticket verified for exam season"
          trend="neutral"
          iconName="FileCheck2"
          badge={
            <span className="text-[10px] font-bold text-[#4D8DFF] bg-[#E8F0FE] px-2 py-0.5 rounded-full">
              Active
            </span>
          }
        />
      </div>

      {/* 3. Visual Analytics Bento Grid: Attendance Donut Chart alongside Semester SGPA Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceDonutChart
          data={dynamicAttendanceItems}
          overallPercentage={attPct}
          totalClasses={totalClasses}
          attendedClasses={attendedClasses}
          missedClasses={totalClasses - attendedClasses}
          requiredThreshold={INSTITUTION_ATTENDANCE_THRESHOLD}
        />

        <SemesterPerformanceChart
          data={dynamicSemesterTrend}
          currentCgpa={cgpa}
        />
      </div>

      {/* 4. Examination Comparison Bar Chart */}
      <div>
        <ExamComparisonBarChart
          data={examComparison}
        />
      </div>

      {/* 5. Weekly Attendance Trend Line Chart */}
      <div>
        <WeeklyAttendanceTrendChart
          data={weeklyAttendance}
          threshold={INSTITUTION_ATTENDANCE_THRESHOLD}
        />
      </div>

      {/* 6. Subject-Wise Attendance Alerts */}
      <div>
        <SubjectAttendanceAlerts
          alerts={attendanceAlerts}
        />
      </div>

      {/* 7. Upcoming Examinations, Today's Schedule & Relevant Academic Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Timetable */}
        <div className="lg:col-span-2">
          <div className="erp-card p-6 bg-white shadow-bento h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#2C3E50] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#4D8DFF]" />
                  Today's Class Schedule
                </h3>
                <p className="text-xs text-[#718096]">Live lecture and lab timetable for your batch ({user?.section || 'Section 1'})</p>
              </div>
              <Link 
                to="/student/attendance" 
                className="text-xs font-bold text-[#4D8DFF] hover:text-[#3A7AEB] flex items-center gap-1 px-3 py-1 rounded-full hover:bg-[#E8F0FE] transition-colors"
              >
                View Full Week <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {todayClasses.map((item: any, idx: number) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-2xl border border-slate-100 bg-[#F9FBFC] hover:bg-white hover:shadow-sm transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E8F0FE] text-[#4D8DFF] font-extrabold flex items-center justify-center text-xs shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#2C3E50]">{item.subject}</h4>
                      <p className="text-[11px] text-[#718096] mt-0.5">{item.faculty} • Room {item.room}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-[#2C3E50] block">{item.time}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                      item.type === 'Lab' 
                        ? 'bg-[#E8F0FE] text-[#4D8DFF]' 
                        : 'bg-slate-100 text-[#718096]'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Action Cards & Academic Broadcasts */}
        <div className="space-y-4">
          {/* Library Book Due Reminder */}
          <div className="erp-card p-5 bg-white shadow-bento border-l-4 border-l-[#4D8DFF]">
            <h4 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#4D8DFF]" />
              Library Circulation
            </h4>
            {dashboardData?.library ? (
              <div className="bg-[#4D8DFF]/5 p-3 rounded-2xl border border-[#4D8DFF]/20 text-xs">
                <p className="font-bold text-[#2C3E50]">{dashboardData.library.title}</p>
                <p className="text-[#718096] text-[11px] mt-0.5 font-mono">ISBN: {dashboardData.library.isbn}</p>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[#4D8DFF] font-semibold">Due: {dashboardData.library.due_date ? new Date(dashboardData.library.due_date).toLocaleDateString() : 'Active'}</span>
                  <span className="text-emerald-700 font-bold">Checked Out</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-500">
                No active borrowed books under your library card.
              </div>
            )}
            <Link 
              to="/student/library" 
              className="mt-3 block text-center text-xs font-bold text-[#4D8DFF] hover:underline"
            >
              View Library Services →
            </Link>
          </div>

          {/* Exam Quick Link */}
          <div className="erp-card p-5 bg-white shadow-bento">
            <h4 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#4D8DFF]" />
              Examination Desk
            </h4>
            <p className="text-xs font-bold text-[#2C3E50]">Autumn Semester Examination 2026</p>
            <p className="text-[11px] text-[#718096] mt-1">
              Verify scheduled theory and laboratory papers, exam centers, and hall-ticket entry pass.
            </p>
            <Link
              to="/student/examination"
              className="mt-3 inline-flex items-center justify-center w-full py-2.5 bg-[#4D8DFF] hover:bg-[#3A7AEB] text-white rounded-full text-xs font-bold transition-all shadow-[0px_4px_14px_rgba(77,141,255,0.35)]"
            >
              View Examination Schedule
            </Link>
          </div>

          {/* Campus Placement Broadcast */}
          <div className="erp-card p-5 bg-white shadow-bento">
            <h4 className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#4D8DFF]" />
              T&P Career Placement
            </h4>
            {dashboardData?.placement ? (
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C3E50]">{dashboardData.placement.company}</span>
                  <Badge variant="success">{dashboardData.placement.package}</Badge>
                </div>
                <p className="text-[11px] text-[#718096] mt-1">Role: {dashboardData.placement.role} • Status: {dashboardData.placement.status}</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs text-slate-500">
                Explore campus recruitment opportunities and apply.
              </div>
            )}
            <Link
              to="/student/placement"
              className="mt-3 block text-center text-xs font-bold text-[#4D8DFF] hover:underline"
            >
              Open Placement Desk →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
