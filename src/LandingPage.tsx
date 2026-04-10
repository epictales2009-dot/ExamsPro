import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Brain, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function LandingPage() {
  const navigate = useNavigate();

  // Check for existing session on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.role === 'teacher' && userData.status === 'pending') {
            // Stay on landing if pending
            return;
          }
          navigate('/dashboard');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (role: 'student' | 'teacher') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: role,
          status: role === 'teacher' ? 'pending' : 'approved',
          createdAt: new Date().toISOString(),
          grade: role === 'student' ? 'SHS2' : null
        });
      }
      
      const updatedSnap = await getDoc(userRef);
      const userData = updatedSnap.data();

      if (userData?.role === 'teacher' && userData?.status === 'pending') {
        toast.info("Teacher account pending approval", {
          description: "An administrator will review your access shortly."
        });
        return;
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white overflow-hidden font-sans">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 flex flex-col items-center text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand/20 blur-[120px] rounded-full opacity-50" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8"
        >
          <Shield className="w-4 h-4 text-brand" />
          <span>Secure & Trusted Platform</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-6"
        >
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-cyan-400">ExamPro</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-400 max-w-2xl mb-12"
        >
          Secure, Smart, and Reliable Online Examinations. Empowering educators and students worldwide.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button 
            onClick={() => handleLogin('student')}
            className="px-8 py-4 bg-brand hover:bg-brand-dark rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-brand/20"
          >
            Student Login <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleLogin('teacher')}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all border border-white/10"
          >
            Teacher Portal
          </button>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-6xl w-full">
          {[
            { icon: Shield, title: "Bank-Level Security", desc: "Advanced proctoring & violation detection" },
            { icon: Brain, title: "AI-Powered", desc: "Smart question processing & formatting" },
            { icon: Zap, title: "Lightning Fast", desc: "Seamless exam experience" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-6 bg-white text-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">About ExamPro</h2>
            <p className="text-slate-600">The most trusted platform for conducting secure online examinations</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-2xl font-bold mb-8">Why Choose ExamPro?</h3>
              <ul className="space-y-6">
                {[
                  "Secure browser lockdown during exams",
                  "AI-powered question processing",
                  "Real-time violation monitoring"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-700">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                ExamPro is designed to revolutionize the way educational institutions conduct examinations. Our platform combines cutting-edge security measures with an intuitive user interface to deliver a seamless examination experience.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                With AI-powered question processing, advanced proctoring capabilities, and comprehensive analytics, ExamPro ensures academic integrity while making exam management effortless for educators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-2xl font-bold mb-6">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span>ExamPro</span>
            </div>
            <p className="text-slate-400 max-w-sm">
              The most trusted platform for conducting secure online examinations. Empowering educators and students worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-slate-400">
              <li>info@exampro.com</li>
              <li>+1 (555) 123-4567</li>
              <li>Global Platform</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-slate-400">
              <li>About Us</li>
              <li>Features</li>
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/5 flex justify-between text-slate-500 text-sm">
          <p>© 2026 ExamPro. All rights reserved.</p>
          <p>Created and designed by <span className="text-white">Galaxy Design Studio</span></p>
        </div>
      </footer>
    </div>
  );
}
