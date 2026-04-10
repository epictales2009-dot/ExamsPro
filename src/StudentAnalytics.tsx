import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useAuth } from './AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function StudentAnalytics() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'submissions'),
      where('studentId', '==', user.uid),
      where('status', '==', 'submitted'),
      orderBy('submittedAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setSubmissions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const stats = {
    avgScore: submissions.length ? Math.round(submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / submissions.length) : 0,
    totalExams: submissions.length,
    highestScore: submissions.length ? Math.max(...submissions.map(s => s.percentage || 0)) : 0,
    totalViolations: submissions.reduce((acc, s) => acc + (s.violations || 0), 0),
    classAverage: 72 // Mocked for now, in real app would be calculated from all submissions
  };

  const chartData = [...submissions].reverse().map((s, i) => ({
    name: `Exam ${i + 1}`,
    score: s.percentage || 0,
    classAvg: stats.classAverage,
    date: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : ''
  }));

  if (loading) return <div className="p-8">Loading analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">My Analytics</h1>
        <p className="text-slate-500">Track your academic progress and performance trends.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Average Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'bg-indigo-500' },
          { label: 'Exams Taken', value: stats.totalExams, icon: CheckCircle2, color: 'bg-emerald-500' },
          { label: 'Highest Score', value: `${stats.highestScore}%`, icon: Award, color: 'bg-orange-500' },
          { label: 'Security Alerts', value: stats.totalViolations, icon: AlertCircle, color: 'bg-red-500' }
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
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-lg">Performance Trend</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-brand" /> Score %
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                <Line type="monotone" dataKey="classAvg" stroke="#94A3B8" strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <h3 className="font-bold">Recent History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {submissions.map((s) => (
              <div key={s.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.percentage >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Exam Submission</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${s.percentage >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {s.percentage}%
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
