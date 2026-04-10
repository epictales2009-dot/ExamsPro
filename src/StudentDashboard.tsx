import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { 
  BookOpen, 
  CheckCircle2, 
  BarChart3, 
  Clock, 
  Play, 
  ChevronRight,
  Search,
  Bell
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    available: 0,
    completed: 0,
    avgScore: 0,
    inProgress: 0
  });

  useEffect(() => {
    if (!user) return;

    // Fetch Active Exams
    const qExams = query(collection(db, 'exams'), where('status', '==', 'active'), limit(4));
    const unsubExams = onSnapshot(qExams, (snap) => {
      setAvailableExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStats(prev => ({ ...prev, available: snap.size }));
    });

    // Fetch Recent Submissions
    const qSubmissions = query(
      collection(db, 'submissions'), 
      where('studentId', '==', user.uid),
      where('status', '==', 'submitted'),
      orderBy('submittedAt', 'desc'),
      limit(4)
    );
    const unsubSubmissions = onSnapshot(qSubmissions, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentResults(docs);
      
      if (docs.length > 0) {
        const total = docs.reduce((acc, curr: any) => acc + (curr.percentage || 0), 0);
        setStats(prev => ({ 
          ...prev, 
          completed: snap.size,
          avgScore: Math.round(total / docs.length)
        }));
      }
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
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
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

      <div className="flex items-center gap-6 mb-10">
        <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-2xl font-bold text-white">
          {profile?.displayName?.[0]}
        </div>
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {profile?.displayName}!</h2>
          <p className="text-slate-500">{profile?.grade || 'Student'}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Available Exams', value: stats.available, icon: BookOpen, color: 'bg-indigo-500' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-500' },
          { label: 'Average Score', value: `${stats.avgScore}%`, icon: BarChart3, color: 'bg-orange-500' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-purple-500' }
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Exams */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold">
              <BookOpen className="w-5 h-5 text-brand" />
              <span>Available Exams</span>
            </div>
            <button className="text-sm text-slate-500 hover:text-brand font-medium">View All</button>
          </div>
          <div className="divide-y divide-slate-50">
            {availableExams.length > 0 ? availableExams.map((exam) => (
              <div key={exam.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold mb-1">{exam.title}</h4>
                  <p className="text-sm text-slate-500 capitalize">{exam.subject} • {exam.duration} min</p>
                </div>
                <button 
                  onClick={() => navigate(`/exam/${exam.id}`)}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-brand-dark transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" /> Start
                </button>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400">No exams available right now.</div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <span>Recent Results</span>
            </div>
            <button className="text-sm text-slate-500 hover:text-brand font-medium">View All</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentResults.length > 0 ? recentResults.map((result) => (
              <div key={result.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold mb-1">Exam</h4>
                  <p className="text-sm text-slate-500">
                    {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${result.percentage >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {result.percentage}%
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400">No results yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
