import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { User, Mail, Shield, GraduationCap, Calendar, Edit2, Camera, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    grade: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        grade: profile.grade || ''
      });
    }
  }, [profile]);

  const handleUpdate = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-slate-500">Manage your personal information and account settings.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center text-3xl font-bold text-white mx-auto">
                {profile?.displayName?.[0]}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white border border-slate-100 rounded-full shadow-lg text-slate-400 hover:text-brand transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-xl font-bold mb-1">{profile?.displayName}</h2>
            <p className="text-sm text-slate-400 capitalize mb-6">{profile?.role}</p>
            
            <div className="pt-6 border-t border-slate-50 flex justify-around text-sm">
              <div>
                <p className="font-bold text-slate-800">12</p>
                <p className="text-xs text-slate-400 uppercase font-bold">Exams</p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div>
                <p className="font-bold text-slate-800">85%</p>
                <p className="text-xs text-slate-400 uppercase font-bold">Avg</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Shield className="w-4 h-4 text-brand" />
              <span>Account Status: <span className="text-emerald-500 font-bold capitalize">{profile?.status}</span></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Joined: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg">Personal Information</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-dark transition-colors"
              >
                <Edit2 className="w-4 h-4" /> {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none disabled:opacity-60"
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none opacity-60"
                      value={profile?.email || ''}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Grade / Level</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none disabled:opacity-60"
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none opacity-60"
                      value="Global"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-6 border-t border-slate-50"
                >
                  <button 
                    onClick={handleUpdate}
                    className="px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all"
                  >
                    Save Changes
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
