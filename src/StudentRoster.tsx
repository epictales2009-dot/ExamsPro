import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronRight,
  GraduationCap,
  Mail,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function StudentRoster() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');

  const isAdmin = profile?.email === 'epictales2009@gmail.com';

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setStudents(allUsers.filter(u => u.role === 'student'));
      setTeachers(allUsers.filter(u => u.role === 'teacher'));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApproveTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, 'users', teacherId), { status: 'approved' });
      toast.success("Teacher approved successfully");
    } catch (error) {
      toast.error("Failed to approve teacher");
    }
  };

  const handleRejectTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, 'users', teacherId), { status: 'rejected' });
      toast.success("Teacher access rejected");
    } catch (error) {
      toast.error("Failed to reject teacher");
    }
  };

  const filteredList = (activeTab === 'students' ? students : teachers).filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Directory</h1>
          <p className="text-slate-500">Manage students and teacher access permissions.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'students' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Students
          </button>
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'teachers' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Teachers
          </button>
        </div>
      </header>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand/20 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm">
          <Filter className="w-5 h-5" /> Filter
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role / Grade</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {filteredList.map((user) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={user.id} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                        {user.displayName?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.displayName}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600 capitalize">
                        {user.role} {user.grade ? `(${user.grade})` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 w-fit ${
                      user.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      user.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {user.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {user.status === 'pending' && <Clock className="w-3 h-3" />}
                      {user.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {isAdmin && user.role === 'teacher' && user.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApproveTeacher(user.id)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleRejectTeacher(user.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredList.length === 0 && (
          <div className="p-20 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
