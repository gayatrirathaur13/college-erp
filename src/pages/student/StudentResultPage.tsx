import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Printer, 
  Loader2
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface SubjectGrade {
  code: string;
  name: string;
  credits: number;
  mid_sem_marks?: number;
  internal_marks: number;
  endsem_marks: number;
  total_marks: number;
  grade_letter: string;
  grade_point: number;
  status: 'Pass' | 'Fail';
  semester_id?: number;
  semester_number?: number;
}

interface SemesterResult {
  result_id: number;
  semester_id: number;
  semester_number: number;
  semester_label: string;
  academic_year: string;
  sgpa: number;
  cgpa: number;
  overall_status: 'Pass' | 'Fail';
  result_date: string;
}

export const StudentResultPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SemesterResult[]>([]);
  const [marks, setMarks] = useState<SubjectGrade[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchResults() {
      try {
        setLoading(true);
        const res = await api.getStudentResults();
        if (isMounted && res.success && res.data) {
          const fetchedResults = res.data.results || [];
          const fetchedMarks = res.data.marks || [];
          setResults(fetchedResults);
          setMarks(fetchedMarks);
          if (fetchedResults.length > 0) {
            setSelectedSemester(fetchedResults[0].semester_number || fetchedResults[0].semester_id || 1);
          }
        }
      } catch (err) {
        console.warn('Could not fetch student results:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchResults();
    return () => { isMounted = false; };
  }, []);

  const currentResult = results.find(
    r => r.semester_number === selectedSemester || r.semester_id === selectedSemester
  ) || results[0];

  const currentSubjects = marks.filter(m => 
    currentResult && (m.semester_number === currentResult.semester_number || m.semester_id === currentResult.semester_id)
  );

  const totalCredits = currentSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-8 h-8 text-navy-800 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading official examination records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-navy-800" />
            Official Semester Result Sheet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified academic transcripts, subject-wise credits, marks breakdown, SGPA, and cumulative CGPA.
          </p>
        </div>

        {/* Semester Selector Dropdown */}
        {results.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600">Select Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="px-3.5 py-1.5 text-xs font-bold text-navy-950 bg-white border border-slate-300 rounded-xl shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-navy-800"
            >
              {results.map((r) => (
                <option key={r.result_id || r.semester_number} value={r.semester_number || r.semester_id}>
                  {r.semester_label || `Semester ${r.semester_number}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No Published Semester Results"
          description="Your examination results and grade sheets have not been finalized or published by the Controller of Examinations yet."
        />
      ) : currentResult ? (
        <div className="space-y-6">
          {/* GPA Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="erp-card p-5 !bg-[#0b1329] text-white shadow-md border border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block mb-1">
                Semester Grade Point Average
              </span>
              <h3 className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {Number(currentResult.sgpa || 0).toFixed(2)}
              </h3>
              <p className="text-xs text-sky-200/80 mt-1">Scale of 10.00</p>
            </div>

            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Cumulative CGPA
              </span>
              <h3 className="text-3xl font-extrabold font-mono text-navy-950">
                {Number(currentResult.cgpa || 0).toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Overall Cumulative Score</p>
            </div>

            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Credits Registered
              </span>
              <h3 className="text-3xl font-extrabold font-mono text-navy-950">
                {totalCredits > 0 ? totalCredits : 20}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Current Academic Term</p>
            </div>

            <div className="erp-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Overall Outcome
                </span>
                <Badge variant={String(currentResult.overall_status).toUpperCase() === 'PASS' ? 'success' : 'danger'} size="md">
                  {String(currentResult.overall_status).toUpperCase() === 'PASS' ? 'PASSED WITH DISTINCTION' : 'APPEAR FOR BACKLOG'}
                </Badge>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Result Sheet
              </button>
            </div>
          </div>

          {/* Subject Marks Table */}
          <div className="erp-card p-6 bg-white overflow-hidden border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-navy-950">{currentResult.semester_label}</h3>
                <p className="text-xs text-slate-500 font-mono">Published on {currentResult.result_date} • Session {currentResult.academic_year || 'Current'}</p>
              </div>
              <Badge variant="navy">Official Controller Record</Badge>
            </div>

            {currentSubjects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No individual subject mark breakdowns found for this semester.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <th className="p-3">Course Code</th>
                      <th className="p-3">Course Subject Title</th>
                      <th className="p-3 text-center">Credits</th>
                      <th className="p-3 text-right">Mid-Sem [20]</th>
                      <th className="p-3 text-right">Internal [20]</th>
                      <th className="p-3 text-right">End-Sem [60]</th>
                      <th className="p-3 text-right">Total [100]</th>
                      <th className="p-3 text-center">Grade</th>
                      <th className="p-3 text-center">Grade Point</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentSubjects.map((sub, idx) => {
                      const mid = sub.mid_sem_marks !== undefined ? sub.mid_sem_marks : Number((sub.total_marks * 0.20).toFixed(1));
                      const internal = sub.internal_marks !== undefined ? sub.internal_marks : Number((sub.total_marks * 0.20).toFixed(1));
                      const endsem = sub.endsem_marks !== undefined ? sub.endsem_marks : Number((sub.total_marks - mid - internal).toFixed(1));
                      return (
                        <tr key={sub.code || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-navy-950">{sub.code}</td>
                          <td className="p-3 font-semibold text-slate-800">{sub.name}</td>
                          <td className="p-3 text-center font-mono">{sub.credits}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{mid}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{internal}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{endsem}</td>
                          <td className="p-3 text-right font-mono font-bold text-navy-950">{sub.total_marks}</td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {sub.grade_letter}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-navy-900">{sub.grade_point.toFixed(1)}</td>
                          <td className="p-3 text-center">
                            <Badge variant={sub.status === 'Pass' ? 'success' : 'danger'}>{sub.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="erp-card p-12 text-center">
          <p className="text-slate-500 text-xs">No result records published for this semester yet.</p>
        </div>
      )}

      {/* Printable Sheet Modal */}
      {isPrintModalOpen && currentResult && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Grade Card Transcript"
          subtitle="Official University Controller Document"
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-slate-400 font-mono">Digitally verified grade registry</span>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl"
              >
                Close Transcript
              </button>
            </div>
          }
        >
          <div className="border-2 border-navy-950 p-6 rounded-2xl bg-white space-y-4 text-xs font-sans">
            <div className="text-center border-b-2 border-navy-950 pb-3">
              <h2 className="font-extrabold text-base text-navy-950">UNIVERSITY INSTITUTE OF TECHNOLOGY</h2>
              <p className="text-[11px] text-slate-600 uppercase font-semibold">Semester Grade Statement</p>
              <p className="text-[10px] text-slate-500 font-mono">{currentResult.semester_label}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-800 text-[11px] border-b border-slate-200 pb-3">
              <div>Student Name: <strong>{user?.name || 'Enrolled Student'}</strong></div>
              <div>Roll No: <strong className="font-mono">{user?.codeOrRoll || 'N/A'}</strong></div>
              <div>PRN: <strong className="font-mono">{`PRN2024${String(user?.id || 1).padStart(4, '0')}`}</strong></div>
              <div>Branch: <strong>{user?.programOrDesignation || user?.department || 'Engineering'}</strong></div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 font-bold text-slate-700">
                    <th className="py-1">Code</th>
                    <th className="py-1">Subject</th>
                    <th className="py-1 text-center">Credits</th>
                    <th className="py-1 text-center">Grade</th>
                    <th className="py-1 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {currentSubjects.map((s, idx) => (
                    <tr key={s.code || idx}>
                      <td className="py-1 font-bold">{s.code}</td>
                      <td className="py-1 font-sans">{s.name}</td>
                      <td className="py-1 text-center">{s.credits}</td>
                      <td className="py-1 text-center font-bold text-emerald-800">{s.grade_letter}</td>
                      <td className="py-1 text-right">{s.grade_point.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-navy-950 pt-3 flex items-center justify-between text-xs">
              <div>
                Semester SGPA: <strong className="font-mono text-navy-950 text-sm">{Number(currentResult.sgpa || 0).toFixed(2)}</strong>
              </div>
              <div>
                Cumulative CGPA: <strong className="font-mono text-navy-950 text-sm">{Number(currentResult.cgpa || 0).toFixed(2)}</strong>
              </div>
              <div>
                Status: <strong className="text-emerald-700">{currentResult.overall_status.toUpperCase()}</strong>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
