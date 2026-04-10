import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, FileUp, Info, Brain, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AIExamGenerator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [examDetails, setExamDetails] = useState({
    title: '',
    subject: '',
    duration: 60,
    difficulty: 'Medium',
    description: ''
  });
  const [objectives, setObjectives] = useState(['']);
  const [questionMix, setQuestionMix] = useState({
    mcq: 5,
    short: 3,
    essay: 2
  });
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      toast.success("File uploaded successfully");
    }
  };

  const handleAddObjective = () => setObjectives([...objectives, '']);
  const handleRemoveObjective = (index: number) => setObjectives(objectives.filter((_, i) => i !== index));

  const generateExam = async () => {
    if (!examDetails.title || !examDetails.subject) {
      toast.error("Please fill in basic exam details");
      return;
    }
    setGenerating(true);
    try {
      let prompt = `Generate an exam titled "${examDetails.title}" for the subject "${examDetails.subject}". 
      Difficulty: ${examDetails.difficulty}. 
      Objectives: ${objectives.join(', ')}. 
      Question Mix: ${questionMix.mcq} Multiple Choice, ${questionMix.short} Short Answer, ${questionMix.essay} Essay.`;

      if (file) {
        prompt += `\n\nIMPORTANT: I have uploaded a reference document. Please extract the core concepts and specific questions from the text provided and structure them into the exam. Ensure the questions match the content of the document.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    points: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });
      
      const data = JSON.parse(response.text);
      setGeneratedQuestions(data.questions);
      setStep(2);
      toast.success("Exam generated successfully!");
    } catch (error) {
      console.error("Generation Error:", error);
      toast.error("Failed to generate exam. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const saveExam = async () => {
    setIsSaving(true);
    try {
      const totalPoints = generatedQuestions.reduce((acc, q) => acc + q.points, 0);
      const examData = {
        ...examDetails,
        teacherId: auth.currentUser?.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        questions: generatedQuestions,
        questionCount: generatedQuestions.length,
        totalPoints
      };

      await addDoc(collection(db, 'exams'), examData);
      toast.success("Exam published successfully!");
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'exams');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Exam Generator</h1>
          <div className="flex items-center gap-2 text-slate-500">
            <Sparkles className="w-5 h-5 text-brand" />
            <span>AI-powered examination creation with automated marking scheme.</span>
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div 
              key={s} 
              className={`w-8 h-2 rounded-full transition-all ${step >= s ? 'bg-brand' : 'bg-slate-200'}`} 
            />
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Exam Details */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8 font-bold">
                <FileText className="w-5 h-5 text-brand" />
                <span>Basic Configuration</span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Exam Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Midterm Exam - Biology"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none"
                    value={examDetails.title}
                    onChange={(e) => setExamDetails({...examDetails, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Subject</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Biology, Mathematics"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none"
                    value={examDetails.subject}
                    onChange={(e) => setExamDetails({...examDetails, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Duration (minutes): {examDetails.duration}</label>
                  <input 
                    type="range" 
                    min="10" max="180" step="5"
                    className="w-full accent-brand"
                    value={examDetails.duration}
                    onChange={(e) => setExamDetails({...examDetails, duration: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Difficulty Level</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none"
                    value={examDetails.difficulty}
                    onChange={(e) => setExamDetails({...examDetails, difficulty: e.target.value})}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Learning Objectives */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8 font-bold">
                <Brain className="w-5 h-5 text-emerald-500" />
                <span>Learning Objectives</span>
              </div>
              <div className="space-y-4">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Objective ${i + 1}: e.g. "Understand the cell cycle and its phases"`}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none"
                      value={obj}
                      onChange={(e) => {
                        const newObjs = [...objectives];
                        newObjs[i] = e.target.value;
                        setObjectives(newObjs);
                      }}
                    />
                    <button 
                      onClick={() => handleRemoveObjective(i)}
                      className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={handleAddObjective}
                  className="flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-dark transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Objective
                </button>
              </div>
            </section>

            {/* Question Mix */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8 font-bold">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <span>Question Mix</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Multiple Choice', key: 'mcq', color: 'bg-indigo-50', text: 'text-indigo-600', pts: '1 pt each' },
                  { label: 'Short Answer', key: 'short', color: 'bg-emerald-50', text: 'text-emerald-600', pts: '2 pts each' },
                  { label: 'Essay', key: 'essay', color: 'bg-orange-50', text: 'text-orange-600', pts: '5 pts each' }
                ].map((type) => (
                  <div key={type.key} className={`${type.color} p-6 rounded-2xl border border-transparent`}>
                    <p className={`text-sm font-bold ${type.text} mb-4`}>{type.label}</p>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setQuestionMix({...questionMix, [type.key]: Math.max(0, questionMix[type.key as keyof typeof questionMix] - 1)})}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold">{questionMix[type.key as keyof typeof questionMix]}</span>
                      <button 
                        onClick={() => setQuestionMix({...questionMix, [type.key]: questionMix[type.key as keyof typeof questionMix] + 1})}
                        className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{type.pts}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Upload Reference */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-2 font-bold">
                <FileUp className="w-5 h-5 text-purple-500" />
                <span>Upload Reference Document (Optional)</span>
              </div>
              <p className="text-sm text-slate-500 mb-8">Upload a PDF, image, or document — AI will extract questions and generate answers based on its content.</p>
              <label className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-brand transition-colors cursor-pointer block">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                <FileUp className={`w-8 h-8 mx-auto mb-4 ${file ? 'text-brand' : 'text-slate-300'}`} />
                <p className="font-bold text-slate-600">
                  {file ? `Selected: ${file.name}` : 'Click to upload PDF, image, or Word doc'}
                </p>
                <p className="text-xs text-slate-400 mt-2">PDF, PNG, JPG, DOCX supported</p>
              </label>
            </section>

            <button 
              onClick={generateExam}
              disabled={generating}
              className={`w-full py-4 bg-brand text-white rounded-2xl font-bold text-lg shadow-lg shadow-brand/20 flex items-center justify-center gap-3 transition-all ${generating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand-dark'}`}
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Exam...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" /> Generate Exam
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900">Exam Generated Successfully</h3>
                <p className="text-sm text-emerald-700">Review the questions below before publishing.</p>
              </div>
            </div>

            <div className="space-y-6">
              {generatedQuestions.map((q, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase">
                      {q.type}
                    </span>
                    <span className="text-sm font-bold text-slate-400">{q.points} Points</span>
                  </div>
                  <h4 className="text-lg font-bold mb-6">{i + 1}. {q.question}</h4>
                  
                  {q.type === 'mcq' && (
                    <div className="grid md:grid-cols-2 gap-3">
                      {q.options.map((opt: string, j: number) => (
                        <div key={j} className={`p-4 rounded-xl border ${opt === q.correctAnswer ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type !== 'mcq' && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">Sample Correct Answer / Rubric</p>
                      <p className="text-sm text-slate-600">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Back to Edit
              </button>
              <button 
                onClick={saveExam}
                disabled={isSaving}
                className="flex-[2] py-4 bg-brand text-white rounded-2xl font-bold text-lg shadow-lg shadow-brand/20 flex items-center justify-center gap-3 transition-all hover:bg-brand-dark"
              >
                {isSaving ? "Publishing..." : "Publish Exam"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
