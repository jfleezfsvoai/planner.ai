import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Calendar as CalIcon, Layout, Trello, CheckSquare, 
  Plus, Clock, ChevronLeft, ChevronRight, X, Bell, 
  Search, Target, TrendingUp, ArrowRight, Lock, Unlock, Trash2,
  Menu, Home, Database, Zap, Download, Activity, 
  Layers, Shield, BookOpen, DollarSign, PieChart, 
  Square, LogIn, LogOut, User, AlertTriangle, Briefcase, Heart, Coffee, Book,
  Bot, Settings, Edit3, MapPin, Sun, Navigation, Moon, RefreshCw, BarChart2, 
  Save, GripVertical, Eye, Copy, ClipboardList, Flag, PlayCircle, StopCircle,
  CalendarDays, ChevronDown, GraduationCap, Users, TrendingDown, Award, Globe,
  CheckCircle2, Circle, Gift, Palette, Aperture, MousePointer2, 
  Triangle, Box, Circle as CircleIcon, HeartPulse, Wallet, Rocket, Users2,
  Check, Edit, Repeat, UserPlus, ShieldCheck, EyeOff
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, getDocs } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAxCBk-P9pYRIh0MjUig9-QXZsSV429gw4",
  authDomain: "lifechanger-pro-df565.firebaseapp.com",
  projectId: "lifechanger-pro-df565",
  storageBucket: "lifechanger-pro-df565.firebasestorage.app",
  messagingSenderId: "398287679515",
  appId: "1:398287679515:web:e269077f9b3c985f3488be",
  measurementId: "G-X243VMNBBQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Critical Fix: Must use environmental appId for correct permissions
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lifechanger-pro-main';

// --- Constants ---
const ADMIN_EMAILS = ["gohyuenwei@gmail.com", "jfleezfsvoai@gmail.com"];

const PRIORITIES = {
    'urgent_important': { label: {zh: '紧急重要', en: 'Urgent & Important'}, color: 'bg-rose-500 text-white' },
    'important_not_urgent': { label: {zh: '重要不紧急', en: 'Important, Not Urgent'}, color: 'bg-amber-500 text-white' }
};

const LABEL_COLORS = [
    'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300',
    'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300',
    'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300',
    'bg-cyan-100 text-cyan-600 border-cyan-200 dark:bg-cyan-500/20 dark:border-cyan-500/30 dark:text-cyan-300'
];

// --- Utils ---
const getLocalDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- 1. LoginPage Component ---
const LoginPage = ({ t, isDarkMode, setIsDarkMode, lang, setLang }) => {
    const [isLogin, setIsLogin] = useState(true); 
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [error, setError] = useState(''); 
    const [loading, setLoading] = useState(false);
    
    const handleAuth = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try { 
            if (isLogin) await signInWithEmailAndPassword(auth, email.trim(), password); 
            else await createUserWithEmailAndPassword(auth, email.trim(), password); 
        } catch (err) { 
            if (isLogin && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password')) {
                setError(t('查无此人，请创建新账号', 'No users found, please register'));
            } else {
                setError(err.message);
            }
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className={`flex flex-col h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <div className="absolute top-6 right-8 flex items-center gap-2 z-50">
                <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-bold text-xs transition-colors">{lang === 'zh' ? 'EN' : '中'}</button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
            </div>
            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
                <div className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl w-full max-w-lg p-16 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500 relative z-10">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-200 dark:shadow-none"><Zap size={44} fill="currentColor" /></div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Planner.AI</h2>
                        <p className="text-xs text-slate-400 font-bold mt-4 uppercase tracking-[0.4em]">{t('私人助理 & 旗舰规划', 'ELITE PERSONAL ASSISTANT')}</p>
                    </div>
                    {error && <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm p-5 rounded-2xl mb-8 border border-rose-100 dark:border-rose-800 text-center font-bold flex items-center justify-center gap-2"><AlertTriangle size={18} /> {error}</div>}
                    <form onSubmit={handleAuth} className="space-y-6">
                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-base outline-none focus:border-indigo-500 dark:text-white transition-all shadow-inner" required />
                        <input type="password" placeholder="Security Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-base outline-none focus:border-indigo-500 dark:text-white transition-all shadow-inner" required />
                        <button type="submit" disabled={loading} className="w-full h-20 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-500/30 dark:shadow-none hover:from-indigo-700 hover:to-violet-700 hover:-translate-y-1 transition-all flex justify-center items-center gap-4 text-xl mt-8">
                            {loading ? <RefreshCw className="animate-spin" size={28}/> : <>{isLogin ? t('进入系统', 'LOGIN NOW') : t('注册账号', 'CREATE ACCESS')}<ArrowRight size={24} /></>}
                        </button>
                    </form>
                    <div className="mt-12 flex justify-end">
                        <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-lg font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors underline-offset-8 hover:underline">
                            {isLogin ? t('注册新账号', 'Register') : t('返回登录', 'Back')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. Shared TaskCard Component ---
const TaskCard = memo(({ task, onToggle, onDelete, onUpdateTask, categories, t }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task?.title || '');
    const [editCategory, setEditCategory] = useState(task?.category || categories[0]?.name);
    const [editPriority, setEditPriority] = useState(task?.priority || '');
  
    const priorityInfo = PRIORITIES[task?.priority];
    const catObj = categories.find(c => c.name === task?.category) || { color: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' };
    const isUrgentHighlight = task?.priority === 'urgent_important' && !task?.completed;
  
    const handleSave = () => {
        if (editTitle.trim()) onUpdateTask(task.id, { title: editTitle, category: editCategory, priority: editPriority });
        setIsEditing(false);
    };
  
    if (isEditing) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-indigo-500 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-lg font-black mb-4 border-b-2 border-indigo-100 dark:border-indigo-900 outline-none bg-transparent dark:text-white p-2" autoFocus />
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none dark:text-white">
                        {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs outline-none dark:text-white">
                        <option value="">{t('默认优先级', 'Default Priority')}</option>
                        {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label[t('zh','en')]}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">{t('取消', 'Cancel')}</button>
                    <button onClick={handleSave} className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-all">{t('更新', 'Update')}</button>
                </div>
            </div>
        );
    }
  
    return (
      <div draggable onDragStart={e => e.dataTransfer.setData('taskId', task.id)} className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm hover:shadow-xl transition-all group relative cursor-move
          ${task?.completed ? 'opacity-40 grayscale border-slate-100 dark:border-slate-800' : 
            (isUrgentHighlight ? 'border-rose-500 border-2 bg-rose-50/20 dark:bg-rose-900/10 ring-4 ring-rose-500/5' : 'border-slate-100 dark:border-slate-800')}`}>
        <div className="flex items-center gap-5">
          <button onClick={() => onToggle(task.id)} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${task?.completed ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}>
            {task?.completed && <Check size={18} strokeWidth={4} />}
          </button>
          <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
            <h4 className={`text-base font-black truncate tracking-tight ${task?.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{task?.title}</h4>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase border ${catObj.color}`}>{task?.category || t('未分类', 'Draft')}</span>
              {priorityInfo && <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase ${priorityInfo.color}`}>{priorityInfo.label[t('zh', 'en')]}</span>}
              {task?.time && <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 ml-1"><Clock size={12}/>{task.time}</span>}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="p-2.5 text-slate-400 hover:text-indigo-500 transition-colors"><Edit size={18}/></button>
            <button onClick={() => onDelete(task.id)} className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
          </div>
        </div>
      </div>
    );
});

// --- 3. HabitTrackerComponent ---
const HabitTrackerComponent = ({ habits, onUpdate, onAdd, onDelete, t }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', goal: '', frequency: daysInMonth });

    const toggleDay = (habitId, day) => {
        const habit = habits.find(h => h.id === habitId); if (!habit) return;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDone = habit.completedDays || [];
        const newDone = currentDone.includes(dateStr) ? currentDone.filter(d => d !== dateStr) : [...currentDone, dateStr];
        onUpdate(habitId, { completedDays: newDone });
    };

    const handleAddHabit = () => {
        if (newHabit.name) {
            onAdd({ name: newHabit.name, goal: newHabit.goal, frequency: Number(newHabit.frequency) || daysInMonth, completedDays: [] });
            setIsAddModalOpen(false); setNewHabit({ name: '', goal: '', frequency: daysInMonth });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 flex flex-col gap-8 w-full transition-colors relative">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner"><Activity size={32}/></div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('习惯追踪', 'Habit Tracker')}</h4>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{currentYear} / {currentMonth + 1} MO</p>
                    </div>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-3 bg-emerald-600 text-white px-7 py-4 rounded-3xl font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 dark:shadow-none"><Plus size={20}/> {t('添加习惯', 'Add Habit')}</button>
            </div>
            <div className="overflow-x-auto custom-scrollbar pb-4">
                <table className="w-full border-separate border-spacing-y-4 min-w-[1000px]">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="text-left px-6 sticky left-0 bg-white dark:bg-slate-900 z-10">{t('习惯', 'Habit')}</th>
                            <th className="text-center px-4 w-32">{t('目标', 'Goal')}</th>
                            <th className="text-left px-6 w-64">{t('当月进度', 'Monthly Progress')}</th>
                            <th className="px-4">
                                <div className="flex gap-2">
                                    {daysArray.map(d => <div key={d} className="w-10 h-10 flex items-center justify-center shrink-0 font-black opacity-50">{d}</div>)}
                                </div>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => {
                            const monthCompletions = (habit.completedDays || []).filter(d => d.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length;
                            const freq = habit.frequency || 1;
                            const progressPercentage = Math.min(100, (monthCompletions / freq) * 100);
                            return (
                                <tr key={habit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-10 rounded-l-3xl">
                                        <span className="text-base font-black text-slate-700 dark:text-slate-200">{habit.name}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-block px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-black rounded-xl border border-amber-100 dark:border-amber-900/50 shadow-sm text-xs truncate max-w-[140px]">{habit.goal || '---'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner border border-slate-50 dark:border-slate-700">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${progressPercentage}%` }} />
                                            </div>
                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 w-12 text-right">{Math.round(progressPercentage)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex gap-2">
                                            {daysArray.map(d => {
                                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                const isDone = (habit.completedDays || []).includes(dateStr);
                                                return (
                                                    <button key={d} onClick={() => toggleDay(habit.id, d)} className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border-2 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100 scale-110' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-300 hover:scale-105'}`}>
                                                        {isDone && <Check size={18} strokeWidth={4}/>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="pr-4 py-3 rounded-r-xl"><button onClick={() => onDelete(habit.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">{t('添加新习惯', 'Habit Builder')}</h3>
                        <div className="space-y-5">
                            <input type="text" value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm outline-none dark:text-white focus:border-emerald-500 transition-all shadow-inner" placeholder="Habit Name" />
                            <input type="text" value={newHabit.goal} onChange={e => setNewHabit({...newHabit, goal: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm outline-none dark:text-white focus:border-emerald-500 transition-all shadow-inner" placeholder="Ultimate Goal" />
                            <input type="number" value={newHabit.frequency} onChange={e => setNewHabit({...newHabit, frequency: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm outline-none dark:text-white focus:border-emerald-500 transition-all shadow-inner" />
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4.5 rounded-2xl font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">{t('取消', 'Cancel')}</button>
                                <button onClick={handleAddHabit} className="flex-1 py-4.5 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl transition-all">{t('添加', 'Add')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 4. Main Views (Dashboard, Calendar, Timeline, Review, Admin) ---
const DashboardView = ({ tasks, categories, habits, onUpdateHabit, onAddHabit, onDeleteHabit, goToTimeline, toggleTask, deleteTask, onUpdateTask, t }) => {
    const today = getLocalDateString(new Date());
    const todayTasks = tasks.filter(t => t.date === today);
    const completedCount = todayTasks.filter(t => t.completed).length;
    const progressValue = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-10">
        <div className="bg-slate-950 rounded-[3rem] p-10 shadow-2xl border border-slate-900">
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 text-indigo-400 rounded-2xl flex items-center justify-center"><Target size={24}/></div>
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase">{t('今日任务达成率', "Daily objective")}</h3>
              </div>
              <span className="text-4xl font-black text-white italic">{Math.round(progressValue)}%</span>
          </div>
          <div className="h-5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-1">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressValue}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
              <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{t('今日任务', "Agenda")}</h4>
              <button onClick={() => goToTimeline(today)} className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><Plus size={24}/></button>
          </div>
          <div className="flex flex-col gap-4">
              {todayTasks.length === 0 ? <div className="text-center py-20 text-slate-300 font-black italic">{t('暂时没有任务', 'NO ACTIVE TASKS')}</div> : 
                 todayTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)}
          </div>
        </div>
        <HabitTrackerComponent habits={habits} onUpdate={onUpdateHabit} onAdd={onAddHabit} onDelete={onDeleteHabit} t={t} />
      </div>
    );
};

const CalendarView = ({ tasks, t, goToTimeline, toggleTask, deleteTask, categories, onUpdateTask }) => {
    const [curr, setCurr] = useState(new Date());
    const [viewingDate, setViewingDate] = useState(null);
    const year = curr.getFullYear(); const month = curr.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const slots = [...Array(startDay).fill(null), ...Array(days).fill(0).map((_, i) => i + 1)];
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in pb-10">
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <header className="p-12 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-4">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{curr.toLocaleString(t('zh-CN', 'en-US'), { month: 'long', year: 'numeric' })}</h2>
                  <div className="relative w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg cursor-pointer overflow-hidden"><CalIcon size={24} /><input type="month" value={`${year}-${String(month + 1).padStart(2, '0')}`} onChange={(e) => { if (e.target.value) { const [y, m] = e.target.value.split('-'); setCurr(new Date(y, m - 1, 1)); } }} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
              </div>
              <div className="flex bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl">
                  <button onClick={() => setCurr(new Date(year, month - 1, 1))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><ChevronLeft size={24}/></button>
                  <button onClick={() => setCurr(new Date())} className="px-8 py-3 text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">{t('今天', 'TODAY')}</button>
                  <button onClick={() => setCurr(new Date(year, month + 1, 1))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><ChevronRight size={24}/></button>
              </div>
          </header>
          <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">{[t('周日', 'SUN'), t('周一', 'MON'), t('周二', 'TUE'), t('周三', 'WED'), t('周四', 'THU'), t('周五', 'FRI'), t('周六', 'SAT')].map(d => <div key={d} className="py-6 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</div>)}</div>
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800 gap-[1px]">
            {slots.map((day, i) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = dateStr === getLocalDateString(new Date());
              return (
                <div key={i} onClick={() => day && setViewingDate(dateStr)} className={`bg-white dark:bg-slate-900 min-h-[160px] p-6 transition-all hover:bg-indigo-50/20 group relative ${day ? 'cursor-pointer' : 'bg-slate-50/50 dark:bg-slate-950'}`}>
                  {day && <>
                      <span className={`text-xl font-black w-10 h-10 flex items-center justify-center rounded-2xl transition-all shadow-sm mb-4 ${isToday ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>{day}</span>
                      <div className="space-y-2">{dayTasks.slice(0, 3).map(tData => <div key={tData.id} className={`text-[10px] font-bold p-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 truncate ${tData.completed ? 'line-through opacity-30' : ''}`}>{tData.title}</div>)}</div>
                  </>}
                </div>
              );
            })}
          </div>
        </div>
        {viewingDate && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xl z-[200] flex items-center justify-center p-6" onClick={() => setViewingDate(null)}>
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                  <div className="p-10 pb-8 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
                      <div><h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{new Date(viewingDate).toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'long', month: 'long', day: 'numeric' })}</h3><p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.3em] mt-1">{t('日程详情', 'Intelligence Report')}</p></div>
                      <button onClick={() => setViewingDate(null)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
                  </div>
                  <div className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                      {tasks.filter(t => t.date === viewingDate).length === 0 ? <div className="text-center py-20 text-slate-300 font-black italic">{t('今日无任务', 'CLEAN SLATE')}</div> :
                        tasks.filter(t => t.date === viewingDate).map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)}
                  </div>
                  <div className="p-10 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <button onClick={() => { goToTimeline(viewingDate); setViewingDate(null); }} className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-xl flex justify-center items-center gap-3 hover:bg-indigo-700 transition-all"><Plus size={24} /> {t('在此日期添加计划', 'DEPLOY NEW PLAN')}</button>
                  </div>
              </div>
          </div>
        )}
      </div>
    );
};

const TimelineView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, onUpdateTask, categories, t }) => {
    const hours = Array.from({ length: 19 }, (_, i) => i + 6);
    const daysToShow = [currentDate, new Date(currentDate.getTime() + 86400000)];
    const navDays = Array.from({length: 9}, (_, i) => { const d = new Date(currentDate); d.setDate(d.getDate() - 4 + i); return d; });
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in pb-10">
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 relative">
          <div className="flex items-center justify-between mb-10 pb-10 border-b border-slate-50 dark:border-slate-800">
              <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"><ChevronLeft size={28}/></button>
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-4">
                  {navDays.map((d, i) => {
                      const isSelected = d.toDateString() === currentDate.toDateString();
                      return (<button key={i} onClick={() => setCurrentDate(d)} className={`flex flex-col items-center justify-center min-w-[75px] py-4 rounded-3xl transition-all ${isSelected ? 'bg-slate-950 text-white shadow-2xl scale-110' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400'}`}><span className="text-[10px] font-black uppercase tracking-tighter mb-1">{d.toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'short' })}</span><span className="text-xl font-black">{d.getDate()}</span></button>);
                  })}
              </div>
              <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"><ChevronRight size={28}/></button>
          </div>
          <div className="grid grid-cols-[100px_1fr_1fr] gap-10 mb-10">
              <div></div>
              {daysToShow.map((d, i) => (<div key={i} className="text-center"><h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{d.toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'long' })}</h3><p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">{d.toLocaleDateString(t('zh-CN', 'en-US'), { day: 'numeric', month: 'short' })}</p></div>))}
          </div>
          <div className="space-y-8">
              {hours.map(hour => {
                  let timeLabel; if (hour === 24 || hour === 0) timeLabel = '12:00 AM'; else if (hour === 12) timeLabel = '12:00 PM'; else if (hour > 12) timeLabel = `${hour - 12}:00 PM`; else timeLabel = `${hour}:00 AM`;
                  const hourValue = hour === 24 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`;
                  const matchHour = hour === 24 ? 0 : hour;
                  return (
                      <div key={hour} className="grid grid-cols-[100px_1fr_1fr] gap-10 group items-start min-h-[120px]">
                          <div className="pt-4 text-right shrink-0"><span className="text-xs font-black text-slate-300 dark:text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">{timeLabel}</span></div>
                          {daysToShow.map((d, dayIndex) => {
                              const dateStr = getLocalDateString(d);
                              const hourTasks = tasks.filter(taskObj => taskObj.date === dateStr && taskObj.time && parseInt(taskObj.time.split(':')[0]) === matchHour);
                              return (
                                  <div key={dayIndex} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const tid = e.dataTransfer.getData('taskId'); if(tid) onUpdateTask(tid, { date: dateStr, time: hourValue }); }} className="flex-1 border-l-2 border-slate-100 dark:border-slate-800 pl-8 pb-8 relative transition-colors hover:bg-slate-50/30 dark:hover:bg-slate-800/20 rounded-r-3xl">
                                      <div className="absolute top-5 -left-[7px] w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500 border-2 border-white dark:border-slate-700 transition-all shadow-sm" />
                                      <div className="space-y-4">
                                          {hourTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)}
                                          <button onClick={() => openAddModal(dateStr, hourValue)} className="w-full py-5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 transition-all opacity-40 hover:opacity-100 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3"><Plus size={16}/> {t('添加任务', 'DEPLOY')}</button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  );
              })}
          </div>
        </div>
      </div>
    );
};

const ReviewView = ({ reviews, onUpdateReview, t }) => {
    const [tab, setTab] = useState('daily');
    const [date, setDate] = useState(getLocalDateString(new Date()));
    const daily = { keep: ['', '', ''], improve: ['', '', ''], start: ['', '', ''], stop: ['', '', ''], ...(reviews?.daily?.[date] || {}) };
    const cycle = { plan: '', execute: '', adjust: '', check: '', ...(reviews?.cycle || {}) };
    const yearly = { finance: ['', '', ''], health: ['', '', ''], family: ['', '', ''], business: ['', '', ''], investment: ['', '', ''], social: ['', '', ''], education: ['', '', ''], breakthrough: ['', '', ''], ...(reviews?.yearly || {}) };
    const updateDaily = (field, idx, val) => { const newList = Array.isArray(daily[field]) ? [...daily[field]] : ['', '', '']; newList[idx] = val; onUpdateReview({ ...reviews, daily: { ...(reviews.daily || {}), [date]: { ...daily, [field]: newList } } }); };
    const updateCycle = (field, val) => onUpdateReview({ ...reviews, cycle: { ...cycle, [field]: val } });
    const updateYearly = (cat, idx, val) => { const newList = Array.isArray(yearly[cat]) ? [...yearly[cat]] : ['', '', '']; newList[idx] = val; onUpdateReview({ ...reviews, yearly: { ...(reviews.yearly || {}), [cat]: newList } }); };
    const dailyCategories = [{f:'keep', l: t('Keep (保持)', 'Keep'), c:'emerald', i: CheckCircle2}, {f:'improve', l: t('Improve (改进)', 'Improve'), c:'amber', i: TrendingUp}, {f:'start', l: t('Start (开始)', 'Start'), c:'indigo', i: PlayCircle}, {f:'stop', l: t('Stop (停止)', 'Stop'), c:'rose', i: StopCircle}];
    const cycleCategories = [{f:'plan', l: t('Plan (规划)', 'Plan'), c:'blue', i: MapPin}, {f:'execute', l: t('Execute (执行)', 'Execute'), c:'rose', i: PlayCircle}, {f:'adjust', l: t('Adjust (调整)', 'Adjust'), c:'amber', i: Settings}, {f:'check', l: t('Check (检查)', 'Check'), c:'emerald', i: Search}];
    const yearlyCategories = [{k:'finance', l: t('Finance / 财务', 'Finance'), i: Wallet, c: 'emerald'}, {k:'health', l: t('Health / 健康', 'Health'), i: HeartPulse, c: 'rose'}, {k:'family', l: t('Family / 亲友', 'Family'), i: Users2, c: 'amber'}, {k:'business', l: t('Business / 事业', 'Business'), i: Briefcase, c: 'blue'}, {k:'investment', l: t('Investment / 投资', 'Investment'), i: TrendingUp, c: 'indigo'}, {k:'social', l: t('Social / 社交', 'Social'), i: Users, c: 'cyan'}, {k:'education', l: t('Education / 教育', 'Education'), i: GraduationCap, c: 'violet'}, {k:'breakthrough', l: t('Breakthrough / 突破', 'Breakthrough'), i: Rocket, c: 'orange'}];
    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-10 animate-in fade-in">
          <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('深度复盘', 'The Review')}</h2>
            <div className="flex items-center gap-4 flex-wrap justify-center">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-black outline-none text-slate-700 dark:text-white focus:border-indigo-500 transition-colors" />
                <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                {[ {id: 'daily', label: t('每日', 'Daily')}, {id: 'cycle', label: t('周期', 'Cycle')}, {id: 'yearly', label: t('年度', 'Yearly')} ].map(tabItem => (
                    <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={`px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${tab === tabItem.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{tabItem.label}</button>
                ))}
                </div>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {tab === 'daily' && dailyCategories.map(x => (
                <div key={x.f} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-8">
                    <h4 className={`text-sm font-black text-${x.c}-600 dark:text-${x.c}-400 flex items-center gap-4 uppercase tracking-widest`}><div className={`p-3 bg-${x.c}-50 dark:bg-${x.c}-950/40 rounded-2xl shadow-inner`}><x.i size={24} /></div> {x.l}</h4>
                    <div className="space-y-4">
                        {[0,1,2].map(i => (
                        <div key={i} className="flex items-center gap-5">
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 italic">{i+1}</span>
                            <input value={String(daily[x.f]?.[i] || '')} onChange={e => updateDaily(x.f, i, e.target.value)} placeholder={t('添加记录...', 'Add record...')} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4.5 text-base outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 dark:text-white transition-all shadow-inner" />
                        </div>
                        ))}
                    </div>
                </div>
            ))}
            {tab === 'cycle' && cycleCategories.map(x => (
                <div key={x.f} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                  <h4 className={`text-sm font-black text-${x.c}-600 dark:text-${x.c}-400 mb-8 flex items-center gap-4 uppercase tracking-widest`}><div className={`p-3 bg-${x.c}-50 dark:bg-${x.c}-950/40 rounded-2xl shadow-inner`}><x.i size={24} /></div> {x.l}</h4>
                  <textarea value={String(cycle[x.f] || '')} onChange={e => updateCycle(x.f, e.target.value)} className="w-full flex-1 min-h-[200px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 text-lg leading-relaxed outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-50 dark:text-white transition-colors resize-none shadow-inner" placeholder={t(`记录心得...`, `Record plans...`)} />
                </div>
            ))}
            {tab === 'yearly' && yearlyCategories.map(cat => (
                <div key={cat.k} className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-10">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 bg-${cat.c}-50 dark:bg-${cat.c}-950/40 text-${cat.c}-600 dark:text-${cat.c}-400 rounded-2xl shadow-inner`}><cat.i size={32} /></div>
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">{cat.l}</h4>
                  </div>
                  <div className="space-y-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="flex items-center gap-5">
                        <span className="text-[10px] font-black text-slate-200 dark:text-slate-800 italic">{i+1}</span>
                        <input value={String(yearly[cat.k]?.[i] || '')} onChange={e => updateYearly(cat.k, i, e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-5 text-base outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 dark:text-white transition-all shadow-inner" placeholder={t("核心目标...", "Set goal...")} />
                      </div>
                    ))}
                  </div>
                </div>
            ))}
          </div>
        </div>
      );
};

const UserManagementView = ({ t }) => {
    const [staffList, setStaffList] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    useEffect(() => {
        const staffRef = doc(db, 'artifacts', appId, 'public', 'data', 'staff_management', 'registry');
        const unsub = onSnapshot(staffRef, (d) => {
            if (d.exists()) setStaffList(d.data().list || []);
        });
        return () => unsub();
    }, []);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true); setStatus({ type: '', msg: '' });
        try {
            const updatedList = [...staffList, { email: email.toLowerCase().trim(), uid: generateId() }];
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_management', 'registry'), { list: updatedList });
            setStatus({ type: 'success', msg: t('授权成功，请告知员工自行注册', 'Authorized. Tell staff to register.') });
            setEmail(''); setPassword('');
        } catch(e) { setStatus({ type: 'error', msg: e.message }); }
        finally { setLoading(false); }
    };

    const handleRemoveStaff = async (staffEmail) => {
        const updatedList = staffList.filter(s => s.email !== staffEmail);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_management', 'registry'), { list: updatedList });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-12 shadow-sm">
                <div className="flex items-center gap-4 mb-10"><div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl"><ShieldCheck size={32}/></div><div><h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('员工管理中心', 'Staff Control')}</h2></div></div>
                <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem]">
                    <input value={email} onChange={e => setEmail(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm outline-none dark:text-white" placeholder="Authorized Staff Email" required />
                    <button type="submit" disabled={loading} className="bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700">{t('授权邮箱', 'Authorize Email')}</button>
                </form>
                {status.msg && <div className={`p-5 rounded-2xl mb-8 text-sm font-bold text-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{status.msg}</div>}
                <div className="space-y-4">{staffList.map(s => (<div key={s.email} className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center font-black uppercase">{s.email[0]}</div><span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.email}</span></div><button onClick={() => handleRemoveStaff(s.email)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20}/></button></div>))}</div>
            </div>
        </div>
    );
};

// --- 5. Main App Logic ---
export default function App() {
  const [view, setView] = useState('focus');
  const [user, setUser] = useState(null);
  const [viewedUserId, setViewedUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffRegistry, setStaffRegistry] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledTime, setPrefilledTime] = useState("");
  const [targetDate, setTargetDate] = useState(getLocalDateString(new Date()));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState('zh');
  const t = (zh, en) => lang === 'zh' ? zh : en;

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([{ name: '工作', color: 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300' },{ name: '生活', color: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300' },{ name: '学习', color: 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300' }]);
  const [habits, setHabits] = useState([]);
  const [reviews, setReviews] = useState({ daily: {}, cycle: {}, yearly: {} });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u) {
            const isAdm = ADMIN_EMAILS.includes(u.email?.toLowerCase());
            setIsAdmin(isAdm);
            setViewedUserId(u.uid);
            if (isAdm) {
                const registryRef = doc(db, 'artifacts', appId, 'public', 'data', 'staff_management', 'registry');
                onSnapshot(registryRef, (d) => {
                    if (d.exists()) {
                        // Admin needs UID mapping, if staff registered, we'd find their actual UID
                        // For now we map based on what's in registry
                        setStaffRegistry(d.data().list || []);
                    }
                });
            }
        }
        setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user || !viewedUserId) return;
    const path = (c) => doc(db, 'artifacts', appId, 'users', viewedUserId, c, 'data');
    const unsubs = [
      onSnapshot(path('tasks'), d => d.exists() && setTasks(d.data().list || []), (e) => {}),
      onSnapshot(path('habits'), d => d.exists() && setHabits(d.data().list || []), (e) => {}),
      onSnapshot(path('categories'), d => d.exists() && setCategories(d.data().list || []), (e) => {}),
      onSnapshot(path('reviews'), d => d.exists() && setReviews(d.data() || {}), (e) => {})
    ];
    return () => unsubs.forEach(u => u());
  }, [viewedUserId, user]);

  const saveData = (c, data) => { if (user && viewedUserId) setDoc(doc(db, 'artifacts', appId, 'users', viewedUserId, c, 'data'), data); };
  const isFinanceLocked = isAdmin && viewedUserId !== user?.uid;

  if (authLoading) return <div className="flex h-screen w-full items-center justify-center dark:bg-slate-950"><RefreshCw className="animate-spin text-indigo-600" size={48} /></div>;
  if (!user) return <LoginPage t={t} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} lang={lang} setLang={setLang} />;

  const menuItems = [
    { id: 'focus', icon: Home, label: t('仪表盘', 'Dashboard') },
    { id: 'calendar', icon: CalIcon, label: t('日历', 'Calendar') },
    { id: 'timeline', icon: Trello, label: t('时间轴', 'Timeline') },
    { id: 'review', icon: ClipboardList, label: t('复盘', 'Review') },
    { id: 'finance', icon: DollarSign, label: t('理财', 'Finance') }
  ];
  if(isAdmin) menuItems.push({ id: 'admin', icon: ShieldCheck, label: t('管理中心', 'Admin') });

  return (
    <div className={`flex flex-col h-screen w-full font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <div className="px-10 pt-8 pb-4 flex justify-between items-center max-w-7xl mx-auto w-full shrink-0">
          <div className="flex items-center gap-4 text-slate-900 dark:text-white font-black text-3xl tracking-tighter italic uppercase"><div className="w-12 h-12 bg-indigo-600 rounded-[1.4rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100"><Zap size={24}/></div>Planner.AI</div>
          <div className="flex items-center gap-5">
            {isAdmin && (
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
                    <Eye size={18} className="text-indigo-600 ml-2" />
                    <select value={viewedUserId} onChange={(e) => setViewedUserId(e.target.value)} className="bg-transparent text-xs font-black uppercase outline-none pr-4 cursor-pointer">
                        <option value={user.uid}>{t('我的数据 (Admin)', 'My Data')}</option>
                        {staffRegistry.map(s => <option key={s.email} value={s.uid}>{s.email}</option>)}
                    </select>
                </div>
            )}
            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-6">
                <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2 text-slate-500 font-black text-xs">{lang === 'zh' ? 'EN' : '中'}</button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500">{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
            </div>
            <button onClick={() => signOut(auth)} className="bg-rose-50 dark:bg-rose-900/20 text-rose-500 px-5 py-3 rounded-2xl border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 transition-all font-black text-xs group"><LogOut size={16}/></button>
          </div>
      </div>
      <div className="px-6 pb-2 shrink-0 w-full"><div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm px-6 py-4 flex justify-center mx-auto max-w-5xl"><nav className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full justify-start md:justify-center">
        {menuItems.map(m => (<button key={m.id} onClick={() => setView(m.id)} className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl font-black text-xs transition-all uppercase tracking-widest ${view === m.id ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><m.icon size={18}/> {m.label}</button>))}
      </nav></div></div>
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto h-full">
            {view === 'finance' && isFinanceLocked ? (
                <div className="flex items-center justify-center h-full animate-in fade-in pb-20"><div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-20 text-center flex flex-col items-center gap-6"><div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center text-rose-500 shadow-inner"><EyeOff size={48} /></div><h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-widest italic">{t('隐私锁定', 'PRIVACY LOCKED')}</h2><p className="text-slate-400 font-bold max-w-xs">{t('管理员无法查看员工的财务隐私数据。', 'Admins cannot view staff financial data.')}</p></div></div>
            ) : (
                <>
                    {view === 'focus' && <DashboardView t={t} tasks={tasks} categories={categories} habits={habits} onUpdateHabit={(id, up) => { const n = habits.map(h => h.id === id ? {...h, ...up} : h); setHabits(n); saveData('habits', { list: n }); }} onAddHabit={(h) => { const n = [...habits, { id: generateId(), ...h }]; setHabits(n); saveData('habits', { list: n }); }} onDeleteHabit={(id) => { const n = habits.filter(h => h.id !== id); setHabits(n); saveData('habits', { list: n }); }} goToTimeline={(d) => { setCurrentDate(new Date(d)); setView('timeline'); }} toggleTask={(id) => { const n = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t); setTasks(n); saveData('tasks', { list: n }); }} deleteTask={(id) => { const n = tasks.filter(t => t.id !== id); setTasks(n); saveData('tasks', { list: n }); }} onUpdateTask={(id, up) => { const n = tasks.map(t => t.id === id ? {...t, ...up} : t); setTasks(n); saveData('tasks', { list: n }); }} />}
                    {view === 'calendar' && <CalendarView tasks={tasks} t={t} goToTimeline={(d) => { setCurrentDate(new Date(d)); setView('timeline'); }} categories={categories} toggleTask={(id) => { const n = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t); setTasks(n); saveData('tasks', { list: n }); }} deleteTask={(id) => { const n = tasks.filter(t => t.id !== id); setTasks(n); saveData('tasks', { list: n }); }} onUpdateTask={(id, up) => { const n = tasks.map(t => t.id === id ? {...t, ...up} : t); setTasks(n); saveData('tasks', { list: n }); }} />}
                    {view === 'timeline' && <TimelineView t={t} currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} categories={categories} openAddModal={(d, timeStr) => { setTargetDate(d); setPrefilledTime(timeStr); setIsAddModalOpen(true); }} toggleTask={(id) => { const n = tasks.map(task => task.id === id ? {...task, completed: !task.completed} : task); setTasks(n); saveData('tasks', { list: n }); }} deleteTask={(id) => { const n = tasks.filter(task => task.id !== id); setTasks(n); saveData('tasks', { list: n }); }} onUpdateTask={(id, up) => { const n = tasks.map(t => t.id === id ? {...t, ...up} : t); setTasks(n); saveData('tasks', { list: n }); }} />}
                    {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={(r) => { setReviews(r); saveData('reviews', r); }} t={t} />}
                    {view === 'admin' && isAdmin && <UserManagementView t={t} />}
                    {view === 'finance' && <div className="flex items-center justify-center h-full animate-in fade-in pb-20"><div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-20 text-center flex flex-col items-center gap-6"><div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center text-emerald-500 shadow-inner"><DollarSign size={48} /></div><h2 className="text-3xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Finance Module</h2></div></div>}
                </>
            )}
        </div>
      </main>
      <AddTaskModal t={t} isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={(taskData) => {
          let n = [];
          if (taskData.recurring === 'daily') {
              const newTasks = [];
              for(let i=0; i<30; i++) {
                  const d = new Date(taskData.date); d.setDate(d.getDate() + i);
                  newTasks.push({ id: generateId(), completed: false, ...taskData, date: getLocalDateString(d) });
              }
              n = [...tasks, ...newTasks];
          } else { n = [...tasks, { id: generateId(), completed: false, ...taskData }]; }
          setTasks(n); saveData('tasks', { list: n });
      }} defaultDate={targetDate} categories={categories} prefilledTime={prefilledTime} onAddCategory={(name) => { const n = [...categories, { name, color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)] }]; setCategories(n); saveData('categories', { list: n }); }} />
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }.no-scrollbar::-webkit-scrollbar { display: none; }.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}