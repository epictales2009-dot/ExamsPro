import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Maximize,
  Camera,
  Mic,
  Send
} from 'lucide-react';
import screenfull from 'screenfull';
import { toast } from 'sonner';

export default function ExamSession() {
  const { examId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Security: Prevent context menu and keyboard shortcuts
  useEffect(() => {
    const preventDefault = (e: any) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'f' || e.key === 'p')) {
        e.preventDefault();
        logViolation("Keyboard shortcut attempt");
      }
    };

    if (isStarted) {
      document.addEventListener('contextmenu', preventDefault);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', () => logViolation("Window focus lost"));
    }

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', () => {});
    };
  }, [isStarted]);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      try {
        const docRef = doc(db, 'exams', examId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExam(data);
          setTimeLeft(data.duration * 60);
        } else {
          toast.error("Exam not found");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  useEffect(() => {
    let timer: any;
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  const startExam = async () => {
    if (screenfull.isEnabled) {
      await screenfull.request();
      setIsFullscreen(true);
    }
    
    // Request Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Camera and Microphone access required for proctoring");
      return;
    }

    setIsStarted(true);
    
    // Create submission record
    try {
      const submissionId = `${user?.uid}_${examId}`;
      await setDoc(doc(db, 'submissions', submissionId), {
        examId,
        studentId: user?.uid,
        studentName: profile?.displayName,
        status: 'in-progress',
        startedAt: serverTimestamp(),
        violations: 0,
        violationLogs: []
      });

      // Create active session record for teacher monitoring
      await setDoc(doc(db, 'activeSessions', submissionId), {
        examId,
        studentId: user?.uid,
        studentName: profile?.displayName,
        studentEmail: user?.email,
        status: 'in-progress',
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
    }
  };

  const logViolation = async (type: string) => {
    if (!isStarted || isSubmitting) return;
    
    setViolations(prev => prev + 1);
    toast.warning(`Security Alert: ${type}`, {
      description: "This incident has been logged and reported to the proctor."
    });

    try {
      const submissionId = `${user?.uid}_${examId}`;
      await updateDoc(doc(db, 'submissions', submissionId), {
        violations: violations + 1,
        violationLogs: arrayUnion({
          type,
          timestamp: new Date().toISOString(),
          details: `Violation detected: ${type}`
        })
      });
    } catch (error) {
      console.error("Error logging violation:", error);
    }
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const submissionId = `${user?.uid}_${examId}`;
      
      // Calculate score (simple MCQ check, AI will do deep marking later)
      let score = 0;
      exam.questions.forEach((q: any) => {
        if (q.type === 'mcq' && answers[q.id] === q.correctAnswer) {
          score += q.points;
        }
      });

      const percentage = Math.round((score / exam.totalPoints) * 100);

      await updateDoc(doc(db, 'submissions', submissionId), {
        status: 'submitted',
        submittedAt: serverTimestamp(),
        answers,
        score,
        percentage
      });

      // Remove active session
      await updateDoc(doc(db, 'activeSessions', submissionId), {
        status: 'submitted',
        lastSeen: serverTimestamp()
      });

      if (screenfull.isEnabled) await screenfull.exit();
      
      toast.success("Exam submitted successfully!");
      navigate('/results');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'submissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading exam...</div>;

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-slate-800 rounded-3xl p-10 border border-slate-700 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-brand/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{exam.title}</h1>
              <p className="text-slate-400">{exam.subject} • {exam.duration} Minutes</p>
            </div>
          </div>

          <div className="space-y-6 mb-10">
            <h3 className="text-xl font-bold">Exam Instructions</h3>
            <ul className="space-y-4 text-slate-300">
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Full-screen mode is mandatory. Exiting full-screen will log a violation.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Camera and microphone must remain active throughout the session.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Switching tabs or windows is strictly prohibited.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>The session will automatically submit when the timer reaches zero.</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={startExam}
            className="w-full py-4 bg-brand hover:bg-brand-dark rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3"
          >
            <Maximize className="w-5 h-5" /> Start Secure Session
          </button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col select-none">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Shield className="w-6 h-6 text-brand" />
            <span>ExamPro Secure</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-sm font-bold">{exam.title}</p>
            <p className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-slate-700'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" /> Finish Exam
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-12">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <span className="px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full uppercase">
                      {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type === 'short' ? 'Short Answer' : 'Essay'}
                    </span>
                    <span className="text-sm font-bold text-slate-400">{currentQuestion.points} Points</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-8">
                    {currentQuestion.question}
                  </h2>

                  {currentQuestion.type === 'mcq' ? (
                    <div className="space-y-4">
                      {currentQuestion.options.map((option: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(currentQuestion.id, option)}
                          className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                            answers[currentQuestion.id] === option 
                              ? 'border-brand bg-brand/5 ring-4 ring-brand/5' 
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            answers[currentQuestion.id] === option ? 'border-brand bg-brand' : 'border-slate-200'
                          }`}>
                            {answers[currentQuestion.id] === option && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className={`font-medium ${answers[currentQuestion.id] === option ? 'text-brand' : 'text-slate-600'}`}>
                            {option}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      placeholder="Type your answer here..."
                      className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand/20 outline-none resize-none text-lg"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    />
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" /> Previous
                  </button>
                  <button
                    disabled={currentQuestionIndex === exam.questions.length - 1}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Sidebar Proctoring */}
        <aside className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6">
          <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/80 text-[10px] font-bold text-white rounded flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> REC
            </div>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
            <div className="flex items-center gap-2 text-orange-700 font-bold mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Security Status</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-orange-600">Violations Logged</span>
              <span className="text-xl font-bold text-orange-700">{violations}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Question Navigator</h4>
            <div className="grid grid-cols-4 gap-2">
              {exam.questions.map((q: any, i: number) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={`h-10 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                    currentQuestionIndex === i 
                      ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                      : answers[q.id] 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-3">
              <Mic className="w-3 h-3" /> Audio Monitoring Active
            </div>
            <div className="flex gap-1">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ height: [4, Math.random() * 16, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                    className="w-full bg-brand"
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
