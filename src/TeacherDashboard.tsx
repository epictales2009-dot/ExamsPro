import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { 
  BookOpen, 
  CheckCircle2, 
  Users, 
  Clock, 
  Plus,
  Search,
  Bell,
  AlertTriangle,
  GraduationCap,
  Camera
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    submissions: 0,
    completed: 0
  });
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [needsReview, setNeedsReview] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Active Sessions
    const qSessions = query(collection(db, 'activeSessions'), where('status', '==', 'in-progress'), limit(5));
    const unsubSessions = onSnapshot(qSessions, (snap) => {
      setActiveSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Stats
    const qExams = query(collection(db, 'exams'), where('teacherId', '==', user.uid));
    const unsubExams = onSnapshot(qExams, (snap) => {
      const docs = snap.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        totalExams: snap.size,
        activeExams: docs.filter(d => d.status === 'active').length
      }));
      setRecentExams(snap.docs.slice(0, 4).map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Submissions & Violations
    const qSubmissions = query(collection(db, 'submissions'), limit(10));
    const unsubSubmissions = onSnapshot(qSubmissions, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStats(prev => ({ ...prev, submissions: snap.size }));
      setNeedsReview(docs.filter((d: any) => d.violations > 0).slice(0, 5));
    });

    return () => {
      unsubExams();
      unsubSubmissions();
    };
  }, [user]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 w-64"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
        </div>
      </header>

      <div className="mb-10">
        <h2 className="text-2xl font-bold">Welcome back, {profile?.displayName?.split(' ')[0]}!</h2>
        <p className="text-slate-500">Here's an overview of your examination activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Exams', value: stats.totalExams, icon: BookOpen, color: 'bg-indigo-500' },
          { label: 'Active Exams', value: stats.activeExams, icon: Clock, color: 'bg-emerald-500' },
          { label: 'Submissions', value: stats.submissions, icon: Users, color: 'bg-orange-500' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-purple-500' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions & Recent Exams */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/ai-generator')}
                className="w-full py-3 bg-brand text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors"
              >
                <Plus className="w-5 h-5" /> Create New Exam
              </button>
              <button className="w-full py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Manage Exams
              </button>
              <button className="w-full py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                View Results
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold">Recent Exams</h3>
              <button className="text-xs text-slate-400 font-medium">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentExams.map(exam => (
                <div key={exam.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{exam.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{exam.subject} • {exam.duration} min</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${exam.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {exam.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Needs Review */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold">
                <Camera className="w-5 h-5 text-brand" />
                <span>Live Monitoring</span>
                <span className="ml-2 px-2 py-0.5 bg-brand/10 text-brand rounded-full text-xs">{activeSessions.length} Active</span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {activeSessions.length > 0 ? activeSessions.map((session) => (
                <div key={session.id} className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-700" />
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/80 text-[8px] font-bold text-white rounded flex items-center gap-1">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" /> LIVE
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] font-bold text-white truncate">{session.studentName}</p>
                  </div>
                  <div className="absolute inset-0 bg-brand/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-3 py-1 bg-white text-brand text-[10px] font-bold rounded-lg shadow-lg">View Feed</button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-10 text-center text-slate-400 text-sm italic">
                  No active exam sessions at the moment.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>Needs Review</span>
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">{needsReview.length}</span>
              </div>
              <button className="text-xs text-slate-400 font-medium">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {needsReview.length > 0 ? needsReview.map((item: any) => (
                <div key={item.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold">{item.studentName}</p>
                      <p className="text-xs text-slate-400">{item.examTitle || 'Exam'}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                      {item.violations} Violations
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg mb-4 italic">
                    Latest: {item.violationLogs?.[item.violationLogs.length - 1]?.details || 'Multiple violations detected'}
                  </p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50">
                      <GraduationCap className="w-4 h-4" /> Grade
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-50">
                      Review
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-400">No submissions need review.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
