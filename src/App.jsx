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
  Triangle, Box, Circle as CircleIcon
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

// --- Global Error Handler ---
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error("Global Crash:", message, error);
  };
}

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyBOa0GCtfFfv-UOeA9j-pM4YKJD9msovV0",
      authDomain: "of-10-days.firebaseapp.com",
      projectId: "of-10-days",
      storageBucket: "of-10-days.firebasestorage.app",
      messagingSenderId: "656607786498",
      appId: "1:656607786498:web:5443936c673d6bd82ed91b"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// App ID for environment compliance
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-planner-app';

// --- Constants & Utilities ---
const CATEGORY_COLORS = [
    { id: 'blue', value: 'bg-blue-100 text-blue-600 border-blue-200', label: 'Blue' },
    { id: 'emerald', value: 'bg-emerald-100 text-emerald-600 border-emerald-200', label: 'Green' },
    { id: 'orange', value: 'bg-orange-100 text-orange-600 border-orange-200', label: 'Orange' },
    { id: 'violet', value: 'bg-violet-100 text-violet-600 border-violet-200', label: 'Purple' },
    { id: 'rose', value: 'bg-rose-100 text-rose-600 border-rose-200', label: 'Red' },
    { id: 'amber', value: 'bg-amber-100 text-amber-600 border-amber-200', label: 'Yellow' },
    { id: 'cyan', value: 'bg-cyan-100 text-cyan-600 border-cyan-200', label: 'Cyan' },
    { id: 'slate', value: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Gray' },
];

const PRIORITIES = {
    'urgent_important': { label: '紧急重要', color: 'text-red-700 bg-red-50 border-red-300', highlight: 'border-2 border-red-500 bg-red-50/80 shadow-[0_0_10px_rgba(239,68,68,0.2)]' },
    'important_not_urgent': { label: '重要不紧急', color: 'text-amber-600 bg-amber-50 border-amber-200', highlight: '' },
    'urgent_not_important': { label: '不重要紧急', color: 'text-blue-600 bg-blue-50 border-blue-200', highlight: '' },
    'not_urgent_not_important': { label: '不重要不紧急', color: 'text-slate-500 bg-slate-50 border-slate-200', highlight: '' },
};

const getLocalDateString = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const sortTasksByTime = (tasks) => {
    return [...tasks].sort((a, b) => {
        if (!a.time) return 1; 
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
};

// --- Sub-Components ---

const TaskCard = ({ task, onToggle, onDelete, onUpdate, categories, setCategories, showTime = true, format = 'standard' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editPriority, setEditPriority] = useState(task.priority || '');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const cardRef = useRef(null);
  
  const safeCategory = typeof task.category === 'string' ? task.category : 'Uncategorized';
  const catObj = (categories || []).find(c => (typeof c === 'object' ? c.name : c) === safeCategory);
  const categoryStyle = (catObj && typeof catObj === 'object') ? catObj.color : 'bg-slate-100 text-slate-600 border-slate-200';
  const priorityConfig = PRIORITIES[task.priority] || {};

  const handleSave = () => {
    if (editTitle.trim()) {
        if (setCategories && isCustomCategory) {
             const existsIndex = categories.findIndex(c => c.name === editCategory);
             if (existsIndex === -1 && editCategory.trim()) {
                 setCategories([...categories, { name: editCategory, color: CATEGORY_COLORS[0].value }]);
             }
        }
        onUpdate(task.id, { title: editTitle, category: editCategory, priority: editPriority }); 
    }
    setIsEditing(false); setIsCustomCategory(false);
  };

  if (isEditing) {
      return (
        <div className="bg-white p-3 rounded-2xl border border-violet-200 shadow-md mb-2 animate-in fade-in zoom-in-95">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-xs font-bold text-slate-700 mb-2 border-b outline-none" placeholder="任务名称" autoFocus />
            <div className="flex gap-2 items-center mb-3">
                {isCustomCategory ? (
                    <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="新类别" className="flex-1 bg-slate-50 border rounded p-1.5 text-xs outline-none" />
                ) : (
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="flex-1 text-xs bg-slate-50 border rounded p-1.5 outline-none">
                        {(categories || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                )}
                <button onClick={() => setIsCustomCategory(!isCustomCategory)} className="p-1.5 bg-slate-100 rounded hover:bg-violet-50 text-violet-600"><Edit3 size={12}/></button>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded"><X size={14}/></button>
                <button onClick={handleSave} className="p-1.5 bg-violet-500 text-white rounded hover:bg-violet-600"><Save size={14}/></button>
            </div>
        </div>
      );
  }

  return (
    <div ref={cardRef} className={`bg-white/80 backdrop-blur-sm p-3 rounded-2xl border transition-all group relative mb-2 ${priorityConfig.highlight || 'border-slate-100 shadow-sm hover:border-violet-200'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-300 group-hover:text-slate-400"><GripVertical size={12} /></div>
        <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-violet-500 border-transparent text-white' : 'border-slate-300 hover:border-violet-500 text-transparent'}`}><CheckSquare size={10} fill={task.completed ? "currentColor" : "none"} /></button>
        <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
          <p className={`text-xs font-bold truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${categoryStyle}`}>{safeCategory}</span>
            {task.priority && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${priorityConfig.color}`}>{priorityConfig.label}</span>}
            {showTime && task.time && <span className="text-[9px] text-slate-400 font-mono bg-slate-50 px-1 rounded"> {task.time}</span>}
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/80 rounded-lg">
            <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-violet-500 p-1"><Edit3 size={12} /></button>
            <button onClick={() => onDelete(task.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
};

const HabitTracker = ({ habits, onUpdate, onAdd, onDelete }) => {
    const today = new Date(); const year = today.getFullYear(); const month = today.getMonth();
    const daysInMonth = []; const date = new Date(year, month, 1);
    while (date.getMonth() === month) { daysInMonth.push(new Date(date)); date.setDate(date.getDate() + 1); }
    const [newHabit, setNewHabit] = useState('');
    const toggleHabit = (habitId, dateStr) => { 
        const habit = habits.find(h => h.id === habitId); if (!habit) return; 
        const isCompleted = habit.completed?.includes(dateStr); 
        let newCompleted = [...(habit.completed || [])]; 
        if (isCompleted) newCompleted = newCompleted.filter(d => d !== dateStr); 
        else newCompleted.push(dateStr); 
        onUpdate(habitId, { completed: newCompleted }); 
    };
    const handleAdd = (e) => { e.preventDefault(); if(!newHabit.trim()) return; onAdd({ name: newHabit.trim(), target: daysInMonth.length, reward: '' }); setNewHabit(''); };
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Habit Tracker</h3></div>
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2 min-w-[150px] sticky left-0 bg-white z-20">习惯养成</th>
                    <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2">完成数</th>
                    {daysInMonth.map((d, i) => (<th key={i} className="text-center pb-4 px-1 min-w-[40px]"><span className="text-[9px] font-bold text-slate-400">{d.getDate()}</span></th>))}
                    <th className="w-10 pb-4"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {habits.map(habit => { 
                    const completedCount = (habit.completed || []).length;
                    return ( 
                      <tr key={habit.id} className="group hover:bg-slate-50 transition-colors border-b last:border-0">
                        <td className="py-3 px-2 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-20">{habit.name}</td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-600">{completedCount}</td>
                        {daysInMonth.map((d, i) => { 
                          const dateStr = getLocalDateString(d); 
                          const isDone = habit.completed?.includes(dateStr); 
                          return (<td key={i} className="text-center py-3 px-1"><button onClick={() => toggleHabit(habit.id, dateStr)} className={`w-5 h-5 rounded flex items-center justify-center transition-all mx-auto ${isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-slate-200 hover:border-emerald-300'}`}><CheckSquare size={12} fill={isDone ? "currentColor" : "none"}/></button></td>); 
                        })}
                        <td className="text-right py-3 px-2"><button onClick={() => onDelete(habit.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></td>
                      </tr> 
                    ); 
                  })}
                </tbody>
              </table>
            </div>
            <form onSubmit={handleAdd} className="mt-6 flex gap-3 border-t pt-4">
              <input type="text" value={newHabit} onChange={e => setNewHabit(e.target.value)} placeholder="新习惯..." className="flex-1 bg-slate-50 border rounded-xl px-4 py-2.5 outline-none text-sm"/>
              <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800"><Plus size={16}/> Add</button>
            </form>
        </div>
    );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate, defaultTime, categories }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '工作');
  const [time, setTime] = useState('');
  useEffect(() => { if (isOpen) { setTitle(''); setTime(defaultTime || ''); setCategory(categories[0]?.name || '工作'); } }, [isOpen, defaultTime]);
  if (!isOpen) return null;
  const handleSubmit = (e) => { e.preventDefault(); if (!title.trim()) return; onAdd({ title, category, time, date: defaultDate }); onClose(); };
  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-sm:max-w-none max-w-sm overflow-hidden border">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2">新任务</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none focus:ring-1" placeholder="要做什么？" autoFocus/>
          <div className="grid grid-cols-2 gap-4">
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none">{categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none"/>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg">添加任务</button>
        </form>
      </div>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
    if (!isOpen) return null;
    const handleAuth = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { if (isLogin) { await signInWithEmailAndPassword(auth, email, password); } else { await createUserWithEmailAndPassword(auth, email, password); } onClose(); } catch (err) { setError(err.message.replace('Firebase: ', '')); } finally { setLoading(false); } };
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
          <div className="text-center mb-6"><div className="w-12 h-12 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg"><User size={24} /></div><h2 className="text-2xl font-black text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2></div>
          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 text-center">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3.5 text-sm outline-none" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-3.5 text-sm outline-none" required />
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl">{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}</button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-500">
            {isLogin ? "No account? " : "Have account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-violet-600 font-bold hover:underline">{isLogin ? 'Sign Up' : 'Log In'}</button>
          </div>
        </div>
      </div>
    );
};

const DashboardView = ({ tasks, user, openAddModal, toggleTask, deleteTask, onUpdate, categories, habits, onUpdateHabit, onAddHabit, onDeleteHabit, setCategories }) => {
    const todayStr = getLocalDateString(new Date());
    const todaysTasks = sortTasksByTime(tasks.filter(t => t.date === todayStr));
    const completedTasks = todaysTasks.filter(t => t.completed).length;
    const totalTasks = todaysTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
        <header><h2 className="text-3xl font-black text-slate-800">Dashboard</h2><p className="text-slate-500 font-medium">Hello, <span className="text-violet-600 font-bold">{user?.email?.split('@')[0] || 'Commander'}</span></p></header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[28rem] overflow-hidden`}>
                <div className="flex justify-between items-center p-6 pb-2 shrink-0"><h3 className="font-bold text-slate-800 flex items-center gap-2 tracking-tighter uppercase"><Target className="text-rose-500"/> Today's Focus</h3><button onClick={() => openAddModal(todayStr)} className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg"><Plus size={16}/></button></div>
                <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar space-y-2">{todaysTasks.length === 0 ? <div className="text-center text-slate-400 py-10 italic">No tasks yet.</div> : todaysTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} categories={categories} setCategories={setCategories}/>))}</div>
            </div>
            <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center h-[28rem]`}>
                <h3 className="font-black text-slate-800 mb-8 text-xl uppercase tracking-tighter">Completion</h3>
                <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                        <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-violet-600 transition-all duration-1000" strokeDasharray={490} strokeDashoffset={490 - (490 * completionRate) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-5xl font-black text-slate-900 tracking-tighter">{completionRate}%</span></div>
                </div>
            </div>
        </div>
        <HabitTracker habits={habits} onUpdate={onUpdateHabit} onAdd={onAddHabit} onDelete={onDeleteHabit} />
      </div>
    );
};

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal }) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
    
    return (
      <div className="flex flex-col animate-fade-in pb-20">
        <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Calendar</h2>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2"><ChevronLeft size={20}/></button><span className="px-4 py-2 font-bold text-slate-700 text-sm flex items-center">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2"><ChevronRight size={20}/></button></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (<div key={d} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>))}</div>
          <div className="grid grid-cols-7 auto-rows-auto bg-slate-50 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.date === dateStr);
              return (
                <div key={i} className="bg-white p-2 hover:bg-violet-50/30 transition-colors group flex flex-col min-h-[100px] border-b border-r border-slate-50 relative">
                  <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${dateStr === getLocalDateString(new Date()) ? 'bg-violet-600 text-white' : 'text-slate-700'}`}>{day}</div>
                  <div className="space-y-1 mt-1 overflow-hidden">{dayTasks.slice(0, 3).map(t => (<div key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 truncate`}>{t.title}</div>))}</div>
                  <button onClick={() => openAddModal(dateStr)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-violet-600 text-white p-1 rounded-full"><Plus size={14}/></button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
};

const TimelineView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, onUpdate, categories, onCloneYesterday }) => {
    const hours = Array.from({length: 18}, (_, i) => i + 6); 
    const dateStr = getLocalDateString(currentDate);
    
    return (
      <div className="h-full flex flex-col animate-fade-in bg-white/50 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
            <div><h2 className="text-3xl font-black text-slate-800 tracking-tighter">{currentDate.toLocaleDateString('default', {weekday: 'long'})}</h2><p className="text-slate-500 font-bold">{currentDate.toLocaleDateString('default', {day: 'numeric', month: 'long'})}</p></div>
            <div className="flex items-center gap-4">
                <button onClick={() => onCloneYesterday(dateStr)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-violet-100 hover:text-violet-600 transition-all text-xs"><Copy size={14} className="inline mr-1"/> Yesterday</button>
                <div className="flex items-center bg-slate-50 p-1 rounded-xl">
                    <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate()-1)))} className="p-2"><ChevronLeft size={16}/></button>
                    <span className="font-bold text-xs px-2 text-slate-600">{dateStr}</span>
                    <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate()+1)))} className="p-2"><ChevronRight size={16}/></button>
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
            {hours.map((hour) => {
              const displayHour = hour === 12 ? "12:00 PM" : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
              const hourTasks = tasks.filter(t => t.date === dateStr && t.time && parseInt(t.time.split(':')[0]) === hour);
              return (
                <div key={hour} className="flex gap-4 p-4 rounded-2xl border bg-white border-slate-100 group transition-all">
                    <div className="w-16 pt-2 border-r border-slate-100 mr-2 text-sm font-black text-slate-400">{displayHour}</div>
                    <div className="flex-1 min-h-[60px] flex flex-col justify-center space-y-2">
                        {hourTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} categories={categories} showTime={false} format="timeline" />))}
                        <button onClick={() => openAddModal(dateStr, `${hour.toString().padStart(2, '0')}:00`)} className="text-slate-300 hover:text-violet-500 text-sm flex items-center gap-2 transition-all"><Plus size={14}/> Add task</button>
                    </div>
                </div>
              );
            })}
        </div>
      </div>
    );
};

// --- Review Components ---

const ReviewInput = ({ value, onChange, placeholder, color, showCheckbox, disabled }) => {
    const text = (value && typeof value === 'object') ? value.text : value;
    const checked = (value && typeof value === 'object') ? value.checked : false;
    if (disabled) return null;
    return (
        <div className="flex items-start gap-3 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
           {showCheckbox && (
               <button onClick={() => onChange({ text: text || '', checked: !checked })} className={`mt-3 w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${checked ? `bg-${color}-500 border-${color}-500 text-white` : 'bg-white border-slate-300'}`}><CheckSquare size={12} fill={checked ? "currentColor" : "none"}/></button>
           )}
           <textarea value={text || ''} onChange={(e) => onChange({ text: e.target.value, checked })} placeholder={placeholder} rows={1} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className={`flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-${color}-500 transition-all text-sm font-medium resize-none overflow-hidden min-h-[46px]`} />
        </div>
    );
};

const ReviewSection = ({ title, icon, color, data, field, onChange, count = 3, showCheckbox = false, sequentialUnlock = false }) => {
    return (
        <div className="p-5 rounded-3xl border bg-white border-slate-100 shadow-sm">
            <h4 className={`font-black text-${color}-500 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs`}>{icon} {title}</h4>
            {Array.from({ length: count }).map((_, i) => {
                let isVisible = true;
                if (sequentialUnlock && i >= 3) {
                    if (i === 3) { if (!(data[0]?.checked && data[1]?.checked && data[2]?.checked)) isVisible = false; }
                    else if (i > 3) { if (!data[i-1]?.checked) isVisible = false; }
                }
                return (<ReviewInput key={i} value={data[i]} onChange={(val) => onChange(field, i, val)} placeholder={`Point ${i+1}`} color={color} showCheckbox={showCheckbox} disabled={!isVisible} />);
            })}
        </div>
    );
};

const ReviewView = ({ reviews, onUpdateReview }) => {
    const [activeTab, setActiveTab] = useState('daily');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [subCycle, setSubCycle] = useState(0);
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
    
    const dailyData = reviews?.daily?.[selectedDate] || { keep: [], improve: [], start: [], stop: [] };
    const activeGlobalCycleId = (selectedMonth * 3) + subCycle + 1;
    const cycleData = reviews?.cycle?.[activeGlobalCycleId] || { blocks: [{ plan: '', execute: '', adjust: '', check: '' }] };
    const yearlyGoals = reviews?.yearly || { education: [], family: [], financial: [], business: [], health: [], breakthrough: [], experience: [] };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleDailyChange = (field, idx, val) => {
        const list = [...(dailyData[field] || [])];
        while (list.length <= idx) list.push({ text: '', checked: false });
        list[idx] = val;
        onUpdateReview({ ...reviews, daily: { ...(reviews.daily || {}), [selectedDate]: { ...dailyData, [field]: list } } });
    };

    const handleCycleChange = (newBlocks) => {
        onUpdateReview({ ...reviews, cycle: { ...(reviews.cycle || {}), [activeGlobalCycleId]: { ...cycleData, blocks: newBlocks } } });
    };

    const handleBlockChange = (index, field, val) => {
        const blocks = cycleData.blocks || [{ plan: '', execute: '', adjust: '', check: '' }];
        const newBlocks = [...blocks];
        newBlocks[index] = { ...newBlocks[index], [field]: val.text || val };
        handleCycleChange(newBlocks);
    };

    const handleYearlyChange = (field, idx, val) => {
        const list = [...(yearlyGoals[field] || [])];
        while (list.length <= idx) list.push({ text: '', checked: false });
        list[idx] = val;
        onUpdateReview({ ...reviews, yearly: { ...yearlyGoals, [field]: list } });
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-slate-800">Review</h2></div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {['daily', 'cycle', 'yearly'].map(t => (<button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t} Review</button>))}
                </div>
            </header>

            {activeTab === 'daily' && (
                <div className="space-y-6">
                    <div className="flex justify-end items-center gap-3">
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold outline-none"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ReviewSection title="Keep (保持)" icon={<CheckSquare size={16}/>} color="emerald" data={dailyData.keep || []} field="keep" onChange={handleDailyChange}/>
                        <ReviewSection title="Improve (改进)" icon={<TrendingUp size={16}/>} color="amber" data={dailyData.improve || []} field="improve" onChange={handleDailyChange}/>
                        <ReviewSection title="Start (开始)" icon={<PlayCircle size={16}/>} color="blue" data={dailyData.start || []} field="start" onChange={handleDailyChange}/>
                        <ReviewSection title="Stop (停止)" icon={<StopCircle size={16}/>} color="rose" data={dailyData.stop || []} field="stop" onChange={handleDailyChange}/>
                    </div>
                </div>
            )}

            {activeTab === 'cycle' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100">
                        <div className="flex gap-2">
                            {[0, 1, 2].map((idx) => (
                                <button key={idx} onClick={() => setSubCycle(idx)} className={`px-5 py-3 rounded-2xl transition-all border ${subCycle === idx ? 'bg-violet-50 border-violet-200 shadow-sm' : 'bg-white border-transparent'}`}>
                                    <span className={`text-xs font-black uppercase ${subCycle === idx ? 'text-violet-600' : 'text-slate-400'}`}>Cycle {idx + 1}</span>
                                </button>
                            ))}
                        </div>
                        <select value={selectedMonth} onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setSubCycle(0); }} className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-6 py-3 rounded-xl outline-none">
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>
                    <div className="space-y-4">
                        {(cycleData.blocks || []).map((block, i) => (
                            <div key={i} className="p-6 rounded-3xl border bg-white border-slate-100 shadow-sm relative">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-black text-slate-400 uppercase tracking-wider text-xs flex items-center gap-2"><Target size={14} className="text-violet-500"/> Block {i + 1}</h4>
                                    <button onClick={() => handleCycleChange(cycleData.blocks.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-blue-500 uppercase ml-1">Plan</label><ReviewInput value={block.plan} onChange={(v) => handleBlockChange(i, 'plan', v)} placeholder="What's the plan?" color="blue" /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-violet-500 uppercase ml-1">Execute</label><ReviewInput value={block.execute} onChange={(v) => handleBlockChange(i, 'execute', v)} placeholder="How did it go?" color="violet" /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-amber-500 uppercase ml-1">Adjust</label><ReviewInput value={block.adjust} onChange={(v) => handleBlockChange(i, 'adjust', v)} placeholder="What to change?" color="amber" /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-emerald-500 uppercase ml-1">Check</label><ReviewInput value={block.check} onChange={(v) => handleBlockChange(i, 'check', v)} placeholder="Results?" color="emerald" /></div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => handleCycleChange([...(cycleData.blocks || []), { plan: '', execute: '', adjust: '', check: '' }])} className="w-full py-4 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-violet-300 transition-all flex items-center justify-center gap-2"><Plus size={16}/> Add New Block</button>
                    </div>
                </div>
            )}

            {activeTab === 'yearly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ReviewSection title="Education" icon={<GraduationCap size={16}/>} color="blue" data={yearlyGoals.education || []} field="education" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                    <ReviewSection title="Family" icon={<Users size={16}/>} color="rose" data={yearlyGoals.family || []} field="family" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                    <ReviewSection title="Financial" icon={<DollarSign size={16}/>} color="emerald" data={yearlyGoals.financial || []} field="financial" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                    <ReviewSection title="Business" icon={<Briefcase size={16}/>} color="violet" data={yearlyGoals.business || []} field="business" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                    <ReviewSection title="Health" icon={<Heart size={16}/>} color="red" data={yearlyGoals.health || []} field="health" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                    <ReviewSection title="BreakThrough" icon={<TrendingUp size={16}/>} color="amber" data={yearlyGoals.breakthrough || []} field="breakthrough" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                    <ReviewSection title="Experience" icon={<Globe size={16}/>} color="cyan" data={yearlyGoals.experience || []} field="experience" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                </div>
            )}
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState('focus'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  
  const [categories, setCategories] = useState([{ name: '工作', color: 'bg-blue-100 text-blue-600' }, { name: '生活', color: 'bg-emerald-100 text-emerald-600' }]);
  const [tasks, setTasks] = useState([]);
  const [reviews, setReviews] = useState({ daily: {}, cycle: {}, yearly: {} });
  const [habits, setHabits] = useState([]);

  // Fallback Local Storage Loader
  const loadFromLocalStorage = () => {
    try {
        const t = localStorage.getItem('planner_tasks'); if(t) setTasks(JSON.parse(t).list || []);
        const h = localStorage.getItem('planner_habits'); if(h) setHabits(JSON.parse(h).list || []);
        const r = localStorage.getItem('planner_reviews'); if(r) setReviews(JSON.parse(r) || {});
        const c = localStorage.getItem('planner_categories'); if(c) setCategories(JSON.parse(c).list || []);
    } catch(e) { console.error("Local load failed", e); }
    setIsInitialLoadDone(true);
  };

  useEffect(() => { 
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Firebase Auth Restricted (Anonymous disabled). Using Local Mode.", err.code);
        if (!auth.currentUser) loadFromLocalStorage();
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u);
      if (!u) loadFromLocalStorage();
    }); 
    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
      if (user) {
          const unsubs = [];
          const userPath = (coll) => doc(db, 'artifacts', appId, 'users', user.uid, coll, 'data');
          
          let modulesRead = 0;
          const inc = () => { modulesRead++; if(modulesRead >= 4) setIsInitialLoadDone(true); };

          unsubs.push(onSnapshot(userPath('tasks'), d => { if(d.exists()) setTasks(d.data().list || []); inc(); }, inc));
          unsubs.push(onSnapshot(userPath('categories'), d => { if(d.exists()) setCategories(d.data().list || []); inc(); }, inc));
          unsubs.push(onSnapshot(userPath('habits'), d => { if(d.exists()) setHabits(d.data().list || []); inc(); }, inc));
          unsubs.push(onSnapshot(userPath('reviews'), d => { if(d.exists()) setReviews(d.data() || {}); inc(); }, inc));

          return () => unsubs.forEach(u => u());
      }
  }, [user]);

  const saveData = (type, data) => {
    if (!isInitialLoadDone) return;
    if (user) {
        setDoc(doc(db, 'artifacts', appId, 'users', user.uid, type, 'data'), data).catch(e => console.warn("Sync Error", e));
    } else {
        localStorage.setItem(`planner_v3_${type}`, JSON.stringify(data));
    }
  };

  useEffect(() => { saveData('tasks', { list: tasks }); }, [tasks]);
  useEffect(() => { saveData('categories', { list: categories }); }, [categories]);
  useEffect(() => { saveData('habits', { list: habits }); }, [habits]);
  useEffect(() => { saveData('reviews', reviews); }, [reviews]);

  const addTask = (newTask) => setTasks([...tasks, { id: Date.now(), completed: false, ...newTask }]);
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const updateTask = (id, updates) => setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));

  const cloneYesterdayTasks = (dateStr) => {
      const yesterday = new Date(new Date(dateStr).setDate(new Date(dateStr).getDate() - 1));
      const sourceStr = getLocalDateString(yesterday);
      const tasksToClone = tasks.filter(t => t.date === sourceStr);
      if (tasksToClone.length === 0) return;
      setTasks(prev => [...prev, ...tasksToClone.map(t => ({ ...t, id: generateId(), date: dateStr, completed: false }))]);
  };

  const menuItems = [
    { id: 'focus', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: CalIcon },
    { id: 'kanban', label: 'Timeline', icon: Trello },
    { id: 'review', label: 'Review', icon: ClipboardList }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r shadow-2xl md:shadow-none transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-10 tracking-tight">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><Layout size={20} /></div>
            Planner.AI
          </div>
          <nav className="space-y-1.5">{menuItems.map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm ${view === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><item.icon size={18}/>{item.label}</button>
            ))}</nav>
        </div>
        <div className="mt-auto p-8">
            {!isInitialLoadDone ? (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 italic"><RefreshCw size={12} className="animate-spin" /> Fetching your Cloud data...</div>
            ) : user ? (
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">{user.email ? user.email[0] : 'U'}</div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{user.email?.split('@')[0]}</div>
                        <button onClick={() => signOut(auth)} className="text-[10px] text-red-500 hover:underline">Log Out</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"><LogIn size={14} /> Login to Cloud</button>
            )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b z-30"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={24} /></button><span className="font-black text-slate-800 uppercase text-xs">{view}</span><button onClick={() => setIsModalOpen(true)} className="text-violet-600 p-2"><Plus size={24} /></button></header>
        <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar relative">
          {view === 'focus' && <DashboardView tasks={tasks} user={user} openAddModal={(d) => { setView('kanban'); setCurrentDate(new Date(d)); }} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} categories={categories} habits={habits} onUpdateHabit={(id, u) => setHabits(habits.map(h => h.id === id ? {...h, ...u} : h))} onAddHabit={(h) => setHabits([...habits, {id: generateId(), completed: [], ...h}])} onDeleteHabit={(id) => setHabits(habits.filter(h => h.id !== id))} setCategories={setCategories} />}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={(d) => { setView('kanban'); setCurrentDate(new Date(d)); }} />}
          {view === 'kanban' && <TimelineView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={(d, t) => setIsModalOpen(true)} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} categories={categories} onCloneYesterday={cloneYesterdayTasks} />}
          {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={setReviews}/>}
        </div>
      </main>
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={getLocalDateString(currentDate)} categories={categories} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }`}</style>
    </div>
  );
}