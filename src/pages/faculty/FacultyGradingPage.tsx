import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface StudentMarkInput {
  student_id: number;
  roll_no: string;
  name: string;
  marks_obtained: number;
  grade_letter: string;
  status: 'Present' | 'Absent';
}

export const FacultyGradingPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const assignedSubjects = user?.department?.includes('Electronics')
    ? [
        { code: "ET301", name: "VLSI Design & Architecture", classSection: "B.Tech ENTC - Section A" },
        { code: "ET302", name: "Signals & Embedded Systems", classSection: "B.Tech ENTC - Section A" }
      ]
    : user?.department?.includes('Intelligence')
    ? [
        { code: "AI301", name: "Deep Learning & Neural Networks", classSection: "B.Tech AI&DS - Section A" },
        { code: "AI302", name: "Natural Language Processing", classSection: "B.Tech AI&DS - Section A" }
      ]
    : [
        { code: "CS302", name: "Database Management Systems", classSection: "B.Tech CSE - Section A" },
        { code: "CS301", name: "Data Structures & Algorithms", classSection: "B.Tech CSE - Section A" }
      ];

  const [selectedClass, setSelectedClass] = useState(assignedSubjects[0].classSection);
  const [selectedSubject, setSelectedSubject] = useState(`${assignedSubjects[0].code} - ${assignedSubjects[0].name}`);
  const [selectedExamType, setSelectedExamType] = useState<'Midterm' | 'Unit Test' | 'End-Semester' | 'Practical'>('Midterm');

  const maxMarksMap = {
    'Unit Test': 25,
    'Midterm': 50,
    'End-Semester': 60,
    'Practical': 50
  };

  const currentMaxMarks = maxMarksMap[selectedExamType];

  const calculateGrade = (score: number, max: number): string => {
    const pct = (score / max) * 100;
    if (pct >= 90) return 'O';
    if (pct >= 80) return 'A+';
    if (pct >= 70) return 'A';
    if (pct >= 60) return 'B+';
    if (pct >= 50) return 'B';
    return 'F';
  };

  const [marksRoster, setMarksRoster] = useState<StudentMarkInput[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadGrading() {
      try {
        setLoading(true);
        const res = await api.getFacultyGrading();
        if (isMounted && res.success && res.data && res.data.length > 0) {
          const mapped: StudentMarkInput[] = res.data.map((m: any) => ({
            student_id: m.student_id,
            roll_no: m.roll_no,
            name: m.name,
            marks_obtained: Math.min(Number(m.marks_obtained || 42), currentMaxMarks),
            grade_letter: m.grade_letter || calculateGrade(Number(m.marks_obtained || 42), currentMaxMarks),
            status: m.status === 'Absent' ? 'Absent' : 'Present'
          }));
          setMarksRoster(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch grading roster:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGrading();
    return () => { isMounted = false; };
  }, [currentMaxMarks]);

  const handleScoreChange = (student_id: number, val: string) => {
    setValidationError(null);
    const num = Number(val);

    if (num < 0 || num > currentMaxMarks) {
      setValidationError(`Invalid score: Marks must be between 0 and maximum possible marks (${currentMaxMarks}).`);
      return;
    }

    setMarksRoster(prev => prev.map(s => {
      if (s.student_id === student_id) {
        return {
          ...s,
          marks_obtained: num,
          grade_letter: calculateGrade(num, currentMaxMarks)
        };
      }
      return s;
    }));
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      await api.saveFacultyGrading({
        marks: marksRoster.map(s => ({
          student_id: s.student_id,
          marks_obtained: s.marks_obtained,
          grade_letter: s.grade_letter,
          status: s.status
        }))
      });
      setIsSubmitted(true);
      setIsSubmitModalOpen(false);
      setSuccessMessage(`Grades successfully sealed and submitted to Controller of Examinations for ${marksRoster.length} candidates.`);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save grades.');
      setIsSubmitModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-navy-800" />
            Digital Gradebook & Examination Grading
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official marks-entry registry for {user?.department || 'Department'} course sections with automatic grade mapping and score validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isSubmitted ? "success" : "warning"}>
            {isSubmitted ? "Submitted to COE Office" : "Draft In Progress"}
          </Badge>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Class & Assessment Filters */}
      <div className="erp-card p-6 bg-white space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wide">
            Gradebook Assessment Scope
          </h3>
          <p className="text-xs text-slate-500">Only assigned courses and authorized class sections are available for evaluation</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Class / Division *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-navy-950"
            >
              <option value="B.Tech CSE - Section A">B.Tech {user?.department || 'CSE'} - Section A (3rd Sem)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Authorized Subject *</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-navy-950"
            >
              {assignedSubjects.map(s => (
                <option key={s.code} value={`${s.code} - ${s.name}`}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Examination Category *</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-navy-950"
            >
              <option value="Midterm">Mid-Semester Exam (Max: 50)</option>
              <option value="Unit Test">Continuous Assessment / Unit Test (Max: 25)</option>
              <option value="End-Semester">End-Semester Final (Max: 60)</option>
              <option value="Practical">Laboratory Practical & Viva (Max: 50)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validation alert */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Roster Marks Table */}
      <div className="erp-card p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-navy-950">
              Student Marks Roster ({marksRoster.length} Candidates)
            </h3>
            <p className="text-xs text-slate-500">
              Assessment: <strong>{selectedExamType}</strong> • Maximum Evaluation Marks: <strong>{currentMaxMarks}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={isSubmitted || marksRoster.length === 0}
            className="px-4 py-2 bg-navy-950 hover:bg-navy-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSubmitted ? "Marks Finalized & Locked" : "Save & Finalize Grades"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-navy-800" />
            <span className="text-xs text-slate-500 ml-2">Loading enrolled candidates...</span>
          </div>
        ) : marksRoster.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center">No examination entries or students assigned for this subject.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBFD] border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="p-3 w-16">#</th>
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Candidate Name</th>
                  <th className="p-3">Marks Obtained (Max: {currentMaxMarks})</th>
                  <th className="p-3 text-center">Calculated Letter Grade</th>
                  <th className="p-3 text-center">Exam Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksRoster.map((student, idx) => (
                  <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-navy-950">{student.roll_no}</td>
                    <td className="p-3 font-semibold text-slate-800">{student.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={currentMaxMarks}
                          disabled={isSubmitted}
                          value={student.marks_obtained}
                          onChange={(e) => handleScoreChange(student.student_id, e.target.value)}
                          className="w-20 px-2.5 py-1 text-xs font-mono font-bold text-navy-950 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-navy-800 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <span className="text-slate-400 font-mono text-[11px]">/ {currentMaxMarks}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-xs">
                        {student.grade_letter}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="success">Present</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Confirm Examination Marks Finalization"
          subtitle="Controller of Examinations Official Grade Submission"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm & Seal Grades
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-700">
              You are finalizing grades for <strong>{marksRoster.length} students</strong> in:
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono text-slate-800">
              <div>Subject: {selectedSubject}</div>
              <div>Class: {selectedClass}</div>
              <div>Cycle: {selectedExamType} (Max: {currentMaxMarks})</div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Once submitted, marks are archived in PostgreSQL and forwarded to the Central Result Cell for semester SGPA calculation.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
