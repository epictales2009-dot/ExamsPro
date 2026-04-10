import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  BarChart3, 
  User, 
  LogOut, 
  Shield,
  PlusCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export default function Sidebar() {
  const { profile, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isAdmin = profile?.email === 'epictales2009@gmail.com';

  const menuItems = [];
  
  if (isAdmin) {
    menuItems.push(
      { icon: Shield, label: 'Admin Panel', path: '/roster' },
      { icon: LayoutDashboard, label: 'Teacher View', path: '/dashboard' }
    );
  }

  if (isTeacher) {
    menuItems.push(
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: BookOpen, label: 'My Exams', path: '/my-exams' },
      { icon: PlusCircle, label: 'Create Exam', path: '/create-exam' },
      { icon: Sparkles, label: 'AI Exam Generator', path: '/ai-generator' },
      { icon: Users, label: 'Student Roster', path: '/roster' }
    );
  } else if (!isAdmin) {
    menuItems.push(
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: BookOpen, label: 'Available Exams', path: '/exams' },
      { icon: FileText, label: 'My Results', path: '/results' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' }
    );
  }

  menuItems.push({ icon: User, label: 'Profile', path: '/profile' });

  return (
    <aside className="w-64 bg-[#0F172A] text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">ExamPro</span>
      </div>

      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-lg font-bold">
          {profile?.displayName?.[0] || 'U'}
        </div>
        <div>
          <p className="text-sm font-semibold truncate w-32">{profile?.displayName}</p>
          <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${isActive ? 'bg-brand text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-4"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
