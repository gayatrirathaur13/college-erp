import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Briefcase, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  User,
  KeyRound,
  Building,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Roll No or Faculty Code
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [designationId, setDesignationId] = useState<number>(1);
  const [sectionId, setSectionId] = useState<number>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic academic options from database
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    api.getRegistrationOptions()
      .then(res => {
        if (res.success && res.data) {
          setDepartments(res.data.departments || []);
          setDesignations(res.data.designations || []);
          setSections(res.data.sections || []);
          if (res.data.departments.length > 0) {
            setDepartmentId(res.data.departments[0].department_id);
          }
          if (res.data.designations.length > 0) {
            setDesignationId(res.data.designations[0].designation_id);
          }
          if (res.data.sections.length > 0) {
            setSectionId(res.data.sections[0].section_id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleRoleChange = (role: 'STUDENT' | 'FACULTY') => {
    setSelectedRole(role);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!identifier.trim()) {
      setErrorMessage(selectedRole === 'STUDENT' ? 'Please enter your student Roll Number.' : 'Please enter your Faculty Employee Code.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please create a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify confirmation.');
      return;
    }
    if (selectedRole === 'FACULTY' && !verificationCode.trim()) {
      setErrorMessage('Institutional Faculty Verification Key is required to create a faculty account.');
      return;
    }

    setIsLoading(true);

    try {
      if (selectedRole === 'STUDENT') {
        const res = await api.registerStudent({
          student_name: fullName.trim(),
          roll_no: identifier.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          department_id: departmentId,
          section_id: sectionId,
          current_year: 3,
          current_semester: 5
        });

        setIsLoading(false);
        setSuccessMessage(res.message || 'Student registration successful! You can now log in.');
      } else {
        const res = await api.registerFaculty({
          faculty_name: fullName.trim(),
          faculty_code: identifier.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          department_id: departmentId,
          designation_id: designationId,
          verification_code: verificationCode.trim()
        });

        setIsLoading(false);
        setSuccessMessage(res.message || 'Faculty registration authorized! You can now log in.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Registration failed. Please review your inputs.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBF0F9] via-[#F4F7FC] to-[#E8F0FE] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
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
            New Academic User Registration
          </p>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-8 shadow-[0px_10px_30px_rgba(112,144,176,0.14)] rounded-[24px] border border-white/80">
          <div className="mb-5">
            <label className="block text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-2.5 text-center">
              Select Registration Role
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left relative ${
                  selectedRole === 'STUDENT'
                    ? 'border-[#4D8DFF] bg-[#4D8DFF]/10 shadow-[0px_4px_16px_rgba(77,141,255,0.2)]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedRole === 'STUDENT' ? 'bg-[#4D8DFF] text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#2C3E50]">Student</span>
                  <span className="block text-[10px] text-[#718096]">Self-Registration</span>
                </div>
                {selectedRole === 'STUDENT' && (
                  <CheckCircle2 className="w-4 h-4 text-[#4D8DFF] absolute top-3 right-3" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('FACULTY')}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left relative ${
                  selectedRole === 'FACULTY'
                    ? 'border-[#4D8DFF] bg-[#4D8DFF]/10 shadow-[0px_4px_16px_rgba(77,141,255,0.2)]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedRole === 'FACULTY' ? 'bg-[#4D8DFF] text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#2C3E50]">Faculty</span>
                  <span className="block text-[10px] text-[#718096]">Verified Staff</span>
                </div>
                {selectedRole === 'FACULTY' && (
                  <CheckCircle2 className="w-4 h-4 text-[#4D8DFF] absolute top-3 right-3" />
                )}
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full mt-2 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Proceed to Sign In →
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#FF6B4A]/10 border border-[#FF6B4A]/20 flex items-start gap-2.5 text-xs text-[#FF6B4A] font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedRole === 'STUDENT' ? 'e.g. Aarav Rajesh Patil' : 'e.g. Dr. Rajesh K. Sharma'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#2C3E50] placeholder-slate-400 focus:bg-white focus:border-[#4D8DFF] focus:ring-2 focus:ring-[#4D8DFF]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                    {selectedRole === 'STUDENT' ? 'Roll Number *' : 'Faculty Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={selectedRole === 'STUDENT' ? 'e.g. 31085' : 'e.g. FAC-085'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-[#2C3E50] placeholder-slate-400 focus:bg-white focus:border-[#4D8DFF] focus:ring-2 focus:ring-[#4D8DFF]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                    Academic Department *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#2C3E50] focus:bg-white focus:border-[#4D8DFF] outline-none transition-all"
                  >
                    {departments.map((d: any) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name} ({d.branch_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                  Institutional Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={selectedRole === 'STUDENT' ? 'student@campus.edu' : 'faculty@campus.edu'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#2C3E50] placeholder-slate-400 focus:bg-white focus:border-[#4D8DFF] focus:ring-2 focus:ring-[#4D8DFF]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {selectedRole === 'FACULTY' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                        Designation *
                      </label>
                      <select
                        value={designationId}
                        onChange={(e) => setDesignationId(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#2C3E50] outline-none"
                      >
                        {designations.map((des: any) => (
                          <option key={des.designation_id} value={des.designation_id}>
                            {des.designation_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                        Verification Key *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="CAMPUS_FACULTY_2026"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-[#2C3E50] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Institutional security policy: Faculty registration requires verification key <code>CAMPUS_FACULTY_2026</code>.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#2C3E50] outline-none focus:bg-white focus:border-[#4D8DFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C3E50] mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#2C3E50] outline-none focus:bg-white focus:border-[#4D8DFF]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#4D8DFF] hover:bg-[#3A7AEB] text-white text-xs font-bold rounded-full shadow-[0px_6px_20px_rgba(77,141,255,0.35)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Registering Account in PostgreSQL...</span>
                  ) : (
                    <>
                      <span>Complete {selectedRole === 'STUDENT' ? 'Student Registration' : 'Faculty Verification'}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-600">
              Already have an institutional account?{' '}
              <Link to="/login" className="font-bold text-[#4D8DFF] hover:underline">
                Sign In
              </Link>
            </p>
            <p className="text-[11px] text-[#718096] flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4D8DFF]" />
              <span>ACID persistent registration • Bcrypt password protection</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
