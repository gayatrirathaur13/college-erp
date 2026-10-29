import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Award, 
  CalendarOff, 
  Receipt, 
  Clock, 
  Calendar, 
  ArrowRight,
  UserCheck,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { api } from '../../services/api';

export const FacultyDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [todayLectures, setTodayLectures] = useState<any[]>([
    { time: "09:00 AM - 10:00 AM", subject: "Data Structures & Algorithms (CS301)", classSection: "B.Tech CSE - Section A", room: "AB-301", status: "Completed" },
    { time: "10:15 AM - 11:15 AM", subject: "Database Management Systems (CS302)", classSection: "B.Tech CSE - Section A", room: "AB-301", status: "Completed" },
    { time: "01:15 PM - 03:15 PM", subject: "DBMS Advanced Laboratory (CS302P)", classSection: "B.Tech CSE - Section A", room: "Lab 304", status: "Upcoming" },
    { time: "03:15 PM - 04:00 PM", subject: "Algorithms Tutorial & Mentorship (CS301-T)", classSection: "B.Tech CSE - Section A", room: "AB-301", status: "Upcoming" }
  ]);

  useEffect(() => {
    let isMounted = true;
    api.getFacultyDashboard()
      .then(res => {
        if (isMounted && res.success && res.data?.todayLectures && res.data.todayLectures.length > 0) {
          setTodayLectures(res.data.todayLectures);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="erp-card p-6 sm:p-7 bg-gradient-to-r from-navy-950 via-navy-900 to-[#1E3E62] text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 text-ice-200 border border-navy-700 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Faculty Academic Workspace • Autumn Semester 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome, {user?.name || "Professor"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 font-mono">
            {user?.codeOrRoll} • {user?.programOrDesignation} • {user?.department}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-ice-200">
              <Calendar className="w-3.5 h-3.5 text-ice-300" />
              Duty Session: <strong>Today, Oct 10, 2026</strong>
            </span>
            <Link
              to="/faculty/attendance"
              className="flex items-center gap-1.5 bg-ice-500 hover:bg-ice-600 text-navy-950 px-3.5 py-1.5 rounded-lg font-bold transition-all shadow-sm"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Take Class Attendance Now
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Classes"
          value="4 Lectures"
          change="09:00 AM - 04:00 PM Schedule"
          trend="neutral"
          iconName="Clock"
        />
        <StatCard
          title="Enrolled Scholars"
          value="25 Students"
          change="Section A (Div 1) Cohort"
          trend="up"
          iconName="UserCheck"
        />
        <StatCard
          title="Leave Balances"
          value="18 Days"
          change="CL: 6 • SL: 8 • EL: 4"
          trend="up"
          iconName="CalendarOff"
        />
        <StatCard
          title="Latest Net Salary"
          value="₹1,27,000"
          change="Disbursed for Oct 2026"
          trend="up"
          iconName="Receipt"
        />
      </div>

      {/* Bento Grid: Today's Assigned Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule & Grading Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Teaching Schedule */}
          <div className="erp-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-navy-700" />
                  Today's Teaching Schedule
                </h3>
                <p className="text-xs text-slate-500">Your assigned lecture and practical laboratory hours</p>
              </div>
              <Link 
                to="/faculty/attendance" 
                className="text-xs font-semibold text-navy-800 hover:text-navy-950 flex items-center gap-1"
              >
                Mark Attendance →
              </Link>
            </div>

            <div className="space-y-3">
              {todayLectures.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-[#FAFCFD] flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                      {item.time}
                    </span>
                    <h4 className="font-bold text-sm text-navy-950 mt-1">{item.subject}</h4>
                    <p className="text-xs text-slate-500">{item.classSection} • Venue: {item.room}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === 'Completed' ? 'success' : 'warning'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marks Grading Deadlines */}
          <div className="erp-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Award className="w-4 h-4 text-navy-700" />
                  Gradebook Evaluation Tasks
                </h3>
                <p className="text-xs text-slate-500">Examination marks-entry cycles awaiting submission</p>
              </div>
              <Link
                to="/faculty/grading"
                className="text-xs font-semibold text-navy-800 hover:text-navy-950"
              >
                Open Gradebook →
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy-950">CS302 - Database Systems (Mid-Term)</h4>
                  <p className="text-[11px] text-slate-500">B.Tech CSE Section A (65 Students) • Max Marks: 50</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-amber-700 font-bold block">Due Oct 25, 2026</span>
                  <Badge variant="warning">Draft Pending</Badge>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy-950">CS301 - Data Structures (Unit Test 1)</h4>
                  <p className="text-[11px] text-slate-500">B.Tech CSE Section A • Max Marks: 25</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-emerald-700 font-bold block">Submitted</span>
                  <Badge variant="success">Finalized</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Leave & Payroll Quick Widgets */}
        <div className="space-y-6">
          {/* Leave Quick Summary */}
          <div className="erp-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarOff className="w-4 h-4 text-navy-700" />
                Leave Balances
              </h4>
              <Link to="/faculty/leave" className="text-xs font-bold text-navy-800 hover:underline">
                Apply →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Casual</span>
                <span className="font-extrabold text-navy-950 text-base font-mono">6</span>
                <span className="text-[9px] text-slate-500 block">Days Left</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Sick</span>
                <span className="font-extrabold text-navy-950 text-base font-mono">8</span>
                <span className="text-[9px] text-slate-500 block">Days Left</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Earned</span>
                <span className="font-extrabold text-navy-950 text-base font-mono">4</span>
                <span className="text-[9px] text-slate-500 block">Days Left</span>
              </div>
            </div>
          </div>

          {/* Payslip Quick Summary */}
          <div className="erp-card p-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-navy-700" />
                Latest Salary Credit
              </h4>
              <Badge variant="success">PAID</Badge>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Month:</span>
                <span className="font-bold text-navy-950">October 2026</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Basic Pay:</span>
                <span className="font-mono">₹1,10,000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Allowances:</span>
                <span className="font-mono">+₹35,000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Deductions:</span>
                <span className="font-mono text-rose-600">-₹18,000</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-navy-950">
                <span>Net Pay:</span>
                <span className="font-mono text-emerald-800 text-sm">₹1,27,000</span>
              </div>
            </div>

            <Link
              to="/faculty/payroll"
              className="mt-3 block text-center text-xs font-bold text-navy-900 hover:text-navy-700"
            >
              Download Official Payslip →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
