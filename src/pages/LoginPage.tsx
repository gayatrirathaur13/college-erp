import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Briefcase, 
  Building2,
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type PortalRole = 'STUDENT' | 'FACULTY' | 'STAFF';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<PortalRole>('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: PortalRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setIdentifier('');
    setPassword('');
  };

  const handleQuickFill = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage(
        selectedRole === 'STUDENT'
          ? 'Please enter your student email or roll number.'
          : selectedRole === 'FACULTY'
          ? 'Please enter your faculty email or employee code.'
          : 'Please enter your staff username or institutional email.'
      );
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      await login(selectedRole, identifier.trim(), password);
      setIsLoading(false);

      // Strict role-specific routing
      if (selectedRole === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (selectedRole === 'FACULTY') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (err: any) {
      setIsLoading(false);
      const displayMsg = err.message === 'Failed to fetch'
        ? 'Cannot connect to backend server. Please verify the Express backend is running on port 5000.'
        : (err.message || 'Login failed. Please verify credentials.');
      setErrorMessage(displayMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBF0F9] via-[#F4F7FC] to-[#E8F0FE] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Soft neumorphic ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#4D8DFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#E8F0FE] rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4D8DFF] to-[#5687F6] text-white shadow-[0px_8px_20px_rgba(77,141,255,0.35)] mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C3E50] tracking-tight">
            CAMPUS ERP PORTAL
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#718096] font-medium">
            Academic Management & Administrative System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-8 shadow-[0px_10px_30px_rgba(112,144,176,0.14)] rounded-[24px] border border-white/80">
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2.5 text-center">
              Select Your Portal Role
            </label>

            {/* THREE ROLE SELECTION CARDS: Student, Faculty, Staff */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* Student Role Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'STUDENT'
                    ? 'border-[#4D8DFF] bg-[#E8F0FE]/70 shadow-[0px_4px_14px_rgba(77,141,255,0.20)]'
                    : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${selectedRole === 'STUDENT' ? 'bg-[#4D8DFF] text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  {selectedRole === 'STUDENT' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4D8DFF]" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2C3E50] block">Student</span>
                  <span className="text-[9px] text-[#718096] block mt-0.5 truncate">Scholars Desk</span>
                </div>
              </button>

              {/* Faculty Role Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('FACULTY')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'FACULTY'
                    ? 'border-[#4D8DFF] bg-[#E8F0FE]/70 shadow-[0px_4px_14px_rgba(77,141,255,0.20)]'
                    : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${selectedRole === 'FACULTY' ? 'bg-[#4D8DFF] text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  {selectedRole === 'FACULTY' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4D8DFF]" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2C3E50] block">Faculty</span>
                  <span className="text-[9px] text-[#718096] block mt-0.5 truncate">Professors</span>
                </div>
              </button>

              {/* Staff Role Button */}
              <button
                type="button"
                onClick={() => handleRoleChange('STAFF')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  selectedRole === 'STAFF'
                    ? 'border-[#2ECC71] bg-[#EAFAF1]/80 shadow-[0px_4px_14px_rgba(46,204,113,0.20)]'
                    : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${selectedRole === 'STAFF' ? 'bg-[#2ECC71] text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  {selectedRole === 'STAFF' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2ECC71]" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2C3E50] block">Staff</span>
                  <span className="text-[9px] text-[#718096] block mt-0.5 truncate">TNP • Fin • Lib</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quick-fill helper chips for Student Role */}
          {selectedRole === 'STUDENT' && (
            <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-slate-400" />
                Select Demo Student (Unique Data):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('31001', 'Kavya@31001')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors text-left"
                  title="31001: Kavya (CSE, SGPA 8.45, 92.5% Attendance, Full Fee Paid)"
                >
                  31001 - Kavya (CSE)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('31002', 'Siddharth@31002')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors text-left"
                  title="31002: Siddharth (CSE, 73% Low Attendance Warning, Overdue Book)"
                >
                  31002 - Siddharth (Warning)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('31004', 'Rohan@31004')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors text-left"
                  title="31004: Rohan (CSE, SGPA 9.40, Amazon Placed 18.5 LPA)"
                >
                  31004 - Rohan (Amazon Placed)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('35001', 'Nidhi@35001')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors text-left"
                  title="35001: Nidhi (AI&DS, SGPA 8.85, Deep Learning & NLP)"
                >
                  35001 - Nidhi (AI&DS)
                </button>
              </div>
            </div>
          )}

          {/* Quick-fill helper chips for Faculty Role */}
          {selectedRole === 'FACULTY' && (
            <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-slate-400" />
                Select Faculty Account:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('FAC-001', 'Ashwini@FAC001')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors text-left"
                  title="Prof. Ashwini Nair: Computer Science & Engineering HOD"
                >
                  FAC-001 (Prof. Ashwini - CSE)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('FAC-002', 'Varun@FAC002')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors text-left"
                  title="Prof. Varun Pawar: Electronics and Telecommunication"
                >
                  FAC-002 (Prof. Varun - ENTC)
                </button>
              </div>
            </div>
          )}

          {/* Quick-fill helper chips for Staff Role */}
          {selectedRole === 'STAFF' && (
            <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-slate-400" />
                Quick Login (Staff Accounts):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('TNP-HEAD', 'TNP@Campus2026')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors truncate"
                  title="TNP Cell Head: TNP-HEAD / TNP@Campus2026"
                >
                  TNP Head
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('FINANCE-01', 'Finance@Campus2026')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors truncate"
                  title="Finance Officer: FINANCE-01 / Finance@Campus2026"
                >
                  Finance
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('LIB-001', 'Library@Campus2026')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors truncate"
                  title="Librarian: LIB-001 / Library@Campus2026"
                >
                  Librarian
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-[#FF6B4A]/10 border border-[#FF6B4A]/30 flex items-center gap-2 text-xs text-[#FF6B4A] font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                {selectedRole === 'STUDENT'
                  ? 'Student Email or Roll Number *'
                  : selectedRole === 'FACULTY'
                  ? 'Faculty Email or Faculty Code *'
                  : 'Staff Username or Email *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    selectedRole === 'STUDENT'
                      ? 'Enter roll number (e.g. 31001) or email'
                      : selectedRole === 'FACULTY'
                      ? 'Enter faculty email or faculty code'
                      : 'e.g. TNP-HEAD, FINANCE-01, LIB-001 or email'
                  }
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D8DFF] focus:bg-white text-[#2C3E50] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#2C3E50]">
                  Password *
                </label>
                <span className="text-[11px] text-[#4D8DFF] hover:underline cursor-pointer font-medium">
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4D8DFF] focus:bg-white text-[#2C3E50] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#2C3E50] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#4D8DFF] hover:bg-[#3A7AEB] text-white text-xs font-bold rounded-full shadow-[0px_6px_20px_rgba(77,141,255,0.35)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      Sign In to{' '}
                      {selectedRole === 'STUDENT'
                        ? 'Student Dashboard'
                        : selectedRole === 'FACULTY'
                        ? 'Faculty Workspace'
                        : 'Staff Portal'}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-600">
              New student or faculty?{' '}
              <Link to="/register" className="font-bold text-[#4D8DFF] hover:underline">
                Register Account
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-[#718096] flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4D8DFF]" />
              <span>Secure institutional portal • Encrypted session authentication</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
