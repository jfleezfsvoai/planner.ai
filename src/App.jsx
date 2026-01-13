import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalIcon, Layout, Trello, CheckSquare, 
  Plus, Clock, ChevronLeft, ChevronRight, X, Bell, 
  Search, Target, TrendingUp, ArrowRight, Lock, Trash2,
  Menu, Home, Database, Zap, Download, Activity, 
  Layers, Shield, BookOpen, DollarSign, PieChart, 
  Square, LogIn, LogOut, User, AlertTriangle, Briefcase, Heart, Coffee, Book,
  Bot, Settings, Edit3, MapPin, Sun, Navigation, Moon
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
      appId: "1:656607786498:web:8eabac0b0d5edd222ed91b"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CRITICAL: Restore Dynamic App ID to ensure we find the original data path
const appId = typeof __app_id !== 'undefined' ? __app_id : 'future-planner-production';

// --- Utilities ---
const getLocalDateString = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Sub-Components (Helpers) ---

const SettingsIcon = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

const getIconForLabel = (label) => {
    const l = label ? label.toLowerCase() : '';
    if(l.includes('save') || l.includes('bank')) return <Shield size={20}/>;
    if(l.includes('invest') || l.includes('stock')) return <TrendingUp size={20}/>;
    if(l.includes('edu') || l.includes('book')) return <Book size={20}/>;
    if(l.includes('emer') || l.includes('safe')) return <AlertTriangle size={20}/>;
    if(l.includes('play') || l.includes('fun')) return <Heart size={20}/>;
    return <Layers size={20}/>;
};

const PieChartComponent = ({ data, total }) => {
    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };
    if (total === 0) return (
        <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">No Data</div>
    );
    return (
        <div className="relative w-48 h-48">
            <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
                {data.map((slice, index) => {
                    const percent = slice.value / total;
                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                    cumulativePercent += percent;
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
                    return (
                        <path key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.02" />
                    );
                })}
            </svg>
        </div>
    );
};

const TaskCard = ({ task, onToggle, onDelete, categoryColors, showWarning }) => {
  const getCategoryStyle = (cat) => categoryColors[cat] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <div className={`bg-white/80 backdrop-blur-sm p-3 rounded-2xl border transition-all group relative mb-2 ${showWarning ? 'border-amber-300 shadow-amber-100' : 'border-slate-100 shadow-sm hover:border-violet-200'}`}>
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
            task.completed 
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white' 
              : 'border-slate-300 hover:border-violet-500 text-transparent'
          }`}
        >
          <CheckSquare size={10} fill={task.completed ? "currentColor" : "none"} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
             <p className={`text-xs font-bold truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {task.title}
             </p>
             {showWarning && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 animate-pulse" title="Time Conflict" />}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${getCategoryStyle(task.category)}`}>
              {task.category}
            </span>
            {task.time && (
              <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono bg-slate-50 px-1 rounded">
                <Clock size={8} /> {task.time}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all absolute top-2 right-2"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate, defaultTime, categories, setCategories }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('工作');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [time, setTime] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTime(defaultTime || '');
      setCategory(categories[0] || '工作');
      setIsCustomCategory(false);
      if(inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen, defaultTime, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    let finalCategory = category;
    if (isCustomCategory && category.trim()) {
        finalCategory = category.trim();
        if (!categories.includes(finalCategory)) {
            setCategories([...categories, finalCategory]);
        }
    } else if (isCustomCategory && !category.trim()) {
        finalCategory = 'Uncategorized';
    }
    onAdd({ title, category: finalCategory, time, date: defaultDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/50">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Zap size={16} className="text-violet-500" fill="currentColor"/> New Task
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Content</label>
            <input 
              ref={inputRef}
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-violet-500 outline-none"
              placeholder="What needs to be done?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
              <div className="flex gap-2">
                 {isCustomCategory ? (
                   <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="New Category"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500"
                        autoFocus
                      />
                      <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={14}/></button>
                   </div>
                 ) : (
                    <div className="flex gap-2 w-full">
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500 appearance-none"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button type="button" onClick={() => { setIsCustomCategory(true); setCategory(''); }} className="p-3 bg-slate-100 hover:bg-violet-100 text-violet-600 rounded-xl"><Plus size={18}/></button>
                    </div>
                 )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Time</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">Add Task</button>
        </form>
      </div>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    if (!isOpen) return null;
    const handleAuth = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      try {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
        onClose();
      } catch (err) {
        setError(err.message.replace('Firebase: ', ''));
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 border border-white/50 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-violet-200">
               <User size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-slate-500 text-sm mt-1">Sync your planner data across devices</p>
          </div>
          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-bold">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500" required />
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50">
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
             {isLogin ? "Don't have an account? " : "Already have an account? "}
             <button onClick={() => setIsLogin(!isLogin)} className="text-violet-600 font-bold hover:underline">{isLogin ? 'Sign Up' : 'Log In'}</button>
          </div>
        </div>
      </div>
    );
};

// --- Views ---

const DashboardView = ({ tasks, onAddTask, user, openAddModal, toggleTask, deleteTask, categoryColors }) => {
    const todayStr = getLocalDateString(new Date());
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const [aiInput, setAiInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [jarvisResponse, setJarvisResponse] = useState(null);
    
    // Safety check for user display name
    const displayName = user?.email ? user.email.split('@')[0] : (user?.isAnonymous ? 'Commander' : 'Guest');

    const handleJarvisPlan = (e) => {
        e.preventDefault();
        if(!aiInput.trim()) return;
        setIsProcessing(true);
        setJarvisResponse(null);
        setTimeout(() => {
            const timeRegex = /(\d{1,2})[:.]?(\d{2})?\s*(am|pm|AM|PM)?/i;
            const timeMatch = aiInput.match(timeRegex);
            const isTomorrow = aiInput.toLowerCase().includes('tomorrow') || aiInput.toLowerCase().includes('明天');
            const targetDate = isTomorrow ? getTomorrowDateString() : getLocalDateString(new Date());
            let eventName = aiInput.replace(timeRegex, '').replace(/tomorrow|today|明天|今天|arrive|start|at|by/gi, '').trim() || "Event";
            let anchorHour = 14; let anchorMin = 0;
            if (timeMatch) {
                let h = parseInt(timeMatch[1]);
                let m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : '';
                if (meridian === 'pm' && h !== 12) h += 12;
                if (meridian === 'am' && h === 12) h = 0;
                anchorHour = h; anchorMin = m;
            }
            const fmt = (h, m) => {
                let hh = h, mm = m;
                while (mm < 0) { hh--; mm += 60; }
                while (hh < 0) { hh += 24; }
                return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
            };
            const tasksToAdd = [];
            const anchorTimeStr = fmt(anchorHour, anchorMin);
            tasksToAdd.push({ id: generateId(), title: `📍 Anchor: ${eventName}`, time: anchorTimeStr, category: '工作', date: targetDate });
            const travelHour = anchorHour - 1;
            const travelTimeStr = fmt(travelHour, anchorMin);
            tasksToAdd.push({ id: generateId(), title: `🚗 Travel to Location (KL Traffic Buffer)`, time: travelTimeStr, category: '生活', date: targetDate });
            const prepTimeStr = fmt(travelHour, anchorMin - 45);
            tasksToAdd.push({ id: generateId(), title: `🚿 Shower & Prep`, time: prepTimeStr, category: '生活', date: targetDate });
            const wakeTimeStr = fmt(travelHour, anchorMin - 45 - 15);
            tasksToAdd.push({ id: generateId(), title: `☀️ Wake Up`, time: wakeTimeStr, category: '健康', date: targetDate });
            tasksToAdd.push({ id: generateId(), title: `🌙 Wind Down & Journal`, time: "22:00", category: '健康', date: targetDate });
            if (anchorHour >= 12) tasksToAdd.push({ id: generateId(), title: `🧠 Deep Work: Priority Project`, time: "09:00", category: '工作', date: targetDate });
            const isLunchBusy = (anchorHour === 12) || (travelHour === 12);
            if (!isLunchBusy) tasksToAdd.push({ id: generateId(), title: `🍱 Lunch Break`, time: "12:30", category: '生活', date: targetDate });
            if (anchorHour < 12) {
                tasksToAdd.push({ id: generateId(), title: `💼 Admin & Emails`, time: "14:00", category: '工作', date: targetDate });
                tasksToAdd.push({ id: generateId(), title: `💪 Gym / Exercise`, time: "17:00", category: '健康', date: targetDate });
            } else if (anchorHour < 16) {
                tasksToAdd.push({ id: generateId(), title: `💪 Gym / Exercise`, time: "17:30", category: '健康', date: targetDate });
            }
            tasksToAdd.forEach(t => onAddTask(t));
            const responseText = `Sir, I've orchestrated your entire day around ${eventName}. Wake up is set for ${wakeTimeStr}. Departure is at ${travelTimeStr} to beat KL traffic. I've filled your gaps with Deep Work and Gym sessions.`;
            setJarvisResponse(responseText);
            setAiInput('');
            setIsProcessing(false);
        }, 1500);
    };

    const catStats = {};
    todaysTasks.forEach(t => {
        if(!catStats[t.category]) catStats[t.category] = { total: 0, completed: 0 };
        catStats[t.category].total++;
        if(t.completed) catStats[t.category].completed++;
    });

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
        <header>
            <h2 className="text-3xl font-black text-slate-800">Dashboard</h2>
            <p className="text-slate-500 font-medium">Welcome back, <span className="text-violet-600">{displayName}</span></p>
        </header>
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-start gap-4 relative z-10">
                <div className="bg-cyan-900/50 p-3 rounded-2xl border border-cyan-500/30"><Bot className="text-cyan-400" size={28}/></div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg font-mono tracking-wide text-cyan-50">J.A.R.V.I.S. PROTOCOL</h3>
                    <p className="text-slate-400 text-xs mb-4">Life Orchestrator & Logistics Optimizer</p>
                    {jarvisResponse && (
                        <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-4 text-cyan-100 text-sm font-mono animate-fade-in leading-relaxed">
                            <span className="text-cyan-400 mr-2 font-bold">JARVIS:</span> {jarvisResponse}
                        </div>
                    )}
                    <form onSubmit={handleJarvisPlan} className="flex gap-3">
                        <input type="text" value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder='e.g. "Tomorrow 9:30am arrive ING LIVE KL"' className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-all font-medium text-sm" />
                        <button type="submit" disabled={isProcessing} className="bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50 min-w-[120px] justify-center">
                            {isProcessing ? <Activity className="animate-spin" size={18}/> : 'EXECUTE'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="text-rose-500"/> Today's Focus</h3>
                    <button onClick={() => openAddModal(todayStr)} className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700"><Plus size={16}/></button>
                </div>
                <div className="space-y-2">
                    {todaysTasks.length === 0 ? <div className="text-center text-slate-400 py-10">No tasks for today.</div> : todaysTasks.map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} categoryColors={categoryColors} />
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><PieChart className="text-blue-500"/> Task Analysis</h3>
                <div className="space-y-4">
                    {Object.entries(catStats).map(([cat, stat]) => (
                        <div key={cat}>
                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{cat}</span><span>{stat.completed}/{stat.total}</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{width: `${(stat.completed/stat.total)*100}%`}}></div></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
};

const WealthJarView = ({ balances, setBalances, wealthConfig, setWealthConfig, transactions = [], setTransactions }) => {
    const [income, setIncome] = useState('');
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'Food', remark: '', date: getLocalDateString(new Date()) });
    const [showGraph, setShowGraph] = useState(false);
    const [isAddJarOpen, setIsAddJarOpen] = useState(false);
    const [newJarForm, setNewJarForm] = useState({ label: '', percent: '' });

    const handleAddJar = (e) => {
        e.preventDefault();
        const { label, percent } = newJarForm;
        if (!label || !percent) return;
        const newJar = { id: generateId(), label, percent: parseFloat(percent), color: 'bg-slate-100 text-slate-600' };
        setWealthConfig({ ...wealthConfig, jars: [...wealthConfig.jars, newJar] });
        setNewJarForm({ label: '', percent: '' });
        setIsAddJarOpen(false);
    };

    const handleDistribute = (e) => {
        e.preventDefault();
        const amt = parseFloat(income);
        if (isNaN(amt) || amt <= 0) return;
        const commit = wealthConfig.showCommitment ? (wealthConfig.commitment || 0) : 0;
        const netIncome = Math.max(0, amt - commit);
        const newBalances = { ...balances };
        const newTransactions = [...transactions]; 
        newTransactions.unshift({ id: Date.now(), amount: amt, category: 'Income 收入', remark: 'Manual Entry', date: getLocalDateString(new Date()), type: 'income' });
        if (wealthConfig.showCommitment && commit > 0) {
            newBalances.commitment = (newBalances.commitment || 0) + commit;
            newTransactions.unshift({ id: Date.now() + 1, amount: -commit, category: 'Commitment 扣除', remark: 'Auto Deduction', date: getLocalDateString(new Date()), type: 'expense' });
        }
        wealthConfig.jars.forEach(jar => {
            const share = netIncome * (jar.percent / 100);
            newBalances[jar.id] = (newBalances[jar.id] || 0) + share;
        });
        setBalances(newBalances);
        setTransactions(newTransactions);
        setIncome('');
    };

    const addTransaction = (e) => {
        e.preventDefault();
        if(!expenseForm.amount) return;
        const newTx = { id: Date.now(), ...expenseForm, amount: -Math.abs(parseFloat(expenseForm.amount)) };
        setTransactions([newTx, ...transactions]);
        setExpenseForm({ amount: '', category: 'Food', remark: '', date: getLocalDateString(new Date()) });
    };

    const deleteCommitment = () => {
        const balance = balances.commitment || 0;
        if(balance > 0) {
            const targetLabel = prompt(`Commitment jar has RM${balance}. Move to which jar? (Enter Jar Name exactly)`);
            const targetJar = wealthConfig.jars.find(j => j.label === targetLabel);
            if(targetJar) {
                 const newBalances = {...balances};
                 newBalances[targetJar.id] = (newBalances[targetJar.id] || 0) + balance;
                 newBalances.commitment = 0;
                 setBalances(newBalances);
            } else { return; }
        }
        setWealthConfig({ ...wealthConfig, showCommitment: false, commitment: 0 });
    };

    const deleteJar = (id) => {
        const jarBalance = balances[id] || 0;
        if (jarBalance > 0) {
            const targetLabel = prompt(`This jar has RM${jarBalance}. Move to which jar? (Enter Jar Name exactly)`);
            const targetJar = wealthConfig.jars.find(j => j.label === targetLabel);
            if(targetJar) {
                const newBalances = {...balances};
                newBalances[targetJar.id] = (newBalances[targetJar.id] || 0) + jarBalance;
                delete newBalances[id];
                setBalances(newBalances);
            } else { return; }
        }
        setWealthConfig({ ...wealthConfig, jars: wealthConfig.jars.filter(j => j.id !== id) });
    };

    const netTransactionTotal = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const graphData = transactions.filter(tx => tx.amount < 0).reduce((acc, tx) => {
            const existing = acc.find(item => item.name === tx.category);
            const val = Math.abs(tx.amount);
            if (existing) existing.value += val;
            else acc.push({ name: tx.category, value: val, color: '#' + Math.floor(Math.random()*16777215).toString(16) });
            return acc;
        }, []);
    const totalExpense = graphData.reduce((acc, item) => acc + item.value, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Yearly Savings Target</div>
                        <div className="text-4xl font-black">RM {((balances.savings||0) + (balances.investment||0)).toLocaleString()} <span className="text-slate-500 text-2xl font-bold"> / {wealthConfig.yearlyTarget.toLocaleString()}</span></div>
                    </div>
                    <button onClick={() => { const n = prompt("New Target:", wealthConfig.yearlyTarget); if(n) setWealthConfig({...wealthConfig, yearlyTarget: parseFloat(n)}); }} className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold">Edit Target</button>
                </div>
                <div className="mt-6 w-full bg-white/10 rounded-full h-2"><div className="bg-emerald-400 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (((balances.savings||0) + (balances.investment||0)) / wealthConfig.yearlyTarget) * 100)}%` }}></div></div>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign className="text-emerald-500"/> Income Distributor</h3>
                <form onSubmit={handleDistribute} className="flex flex-col md:flex-row gap-4">
                    <input type="number" placeholder="Income (RM)" value={income} onChange={e=>setIncome(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-lg"/>
                    {wealthConfig.showCommitment && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 font-bold min-w-[200px]">
                            <span className="text-xs uppercase whitespace-nowrap">Commitment:</span> 
                            <input type="number" value={wealthConfig.commitment} onChange={e => setWealthConfig({...wealthConfig, commitment: parseFloat(e.target.value)||0})} className="bg-transparent border-b border-rose-200 outline-none w-full text-right font-bold" />
                        </div>
                    )}
                    <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700">Distribute</button>
                </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wealthConfig.showCommitment && (
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex flex-col justify-between h-40 relative group">
                        <div className="flex justify-between items-start"><div className="font-bold text-rose-700">Commitment</div><Lock size={16} className="text-rose-400"/></div>
                        <div className="text-2xl font-black text-rose-800">RM {(balances.commitment||0).toLocaleString()}</div>
                        <button onClick={deleteCommitment} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-rose-400 hover:bg-rose-100 p-1 rounded transition-all"><X size={16}/></button>
                    </div>
                )}
                {wealthConfig.jars.map(jar => (
                    <div key={jar.id} className="bg-white border border-slate-100 p-6 rounded-3xl flex flex-col justify-between h-40 shadow-sm hover:shadow-md relative group">
                        <div className="flex justify-between items-start">
                            <div><div className="font-bold text-slate-700">{jar.label}</div><div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">{jar.percent}%</div></div>
                            <div className="p-2 bg-slate-50 rounded-full text-slate-400">{getIconForLabel(jar.label)}</div>
                        </div>
                        <div className="text-2xl font-black text-slate-800">RM {(balances[jar.id]||0).toLocaleString()}</div>
                        <button onClick={() => deleteJar(jar.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 p-1 rounded transition-all"><X size={16}/></button>
                    </div>
                ))}
                <button onClick={() => setIsAddJarOpen(true)} className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center h-40 text-slate-400 hover:border-violet-400 font-bold gap-2"><Plus size={24}/> Add Jar</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-800 mb-4">Add Daily Expense</h3>
                    <form onSubmit={addTransaction} className="space-y-4">
                        <input type="number" placeholder="Amount" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                        <input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm, date: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                        <input type="text" placeholder="Category (e.g. Food)" value={expenseForm.category} onChange={e=>setExpenseForm({...expenseForm, category: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                        <input type="text" placeholder="Remark" value={expenseForm.remark} onChange={e=>setExpenseForm({...expenseForm, remark: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-700">Record Transaction</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
                            <div className="text-xs font-bold text-slate-400 mt-1">Net Balance: <span className={netTransactionTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{netTransactionTotal >= 0 ? '+' : ''} RM {netTransactionTotal.toLocaleString()}</span></div>
                        </div>
                        <button onClick={() => setShowGraph(!showGraph)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 flex items-center gap-2"><PieChart size={14}/> {showGraph ? 'LIST' : 'GRAPH'}</button>
                    </div>
                    {showGraph ? (
                        <div className="flex flex-col items-center py-8">
                            <PieChartComponent data={graphData} total={totalExpense} />
                            <div className="mt-4 text-xl font-black">Total Spent: RM {totalExpense.toLocaleString()}</div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {transactions.length === 0 ? <div className="text-center text-slate-400 py-10">No records.</div> : transactions.map(tx => (
                                <div key={tx.id} className="grid grid-cols-4 items-center p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-sm">
                                    <div className="col-span-1 font-mono text-slate-400 text-xs">{tx.date}</div>
                                    <div className="col-span-2 font-bold text-slate-700"><div>{tx.category}</div><div className="text-[10px] text-slate-400 font-normal">{tx.remark}</div></div>
                                    <div className={`col-span-1 text-right font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.amount > 0 ? '+' : ''} RM {tx.amount.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {isAddJarOpen && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold text-lg mb-4">Add New Jar</h3>
                        <form onSubmit={handleAddJar} className="space-y-4">
                            <input className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-violet-500" value={newJarForm.label} onChange={e => setNewJarForm({...newJarForm, label: e.target.value})} placeholder="Jar Name" autoFocus />
                            <input type="number" className="w-full border border-slate-200 rounded-xl p-2 outline-none focus:border-violet-500" value={newJarForm.percent} onChange={e => setNewJarForm({...newJarForm, percent: e.target.value})} placeholder="Percent %" />
                            <div className="flex gap-2"><button type="button" onClick={() => setIsAddJarOpen(false)} className="flex-1 py-2 text-slate-500">Cancel</button><button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold">Add</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const CycleTrackerView = ({ data, setData, startYearDate, setStartYearDate }) => {
    const totalTasks = data.reduce((acc, c) => acc + (c.tasks?.length || 0), 0);
    const completedTasks = data.reduce((acc, c) => acc + (c.tasks?.filter(t => t.done).length || 0), 0);
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const addTask = (cycleId) => {
        setData(prev => prev.map(cycle => {
            if (cycle.id !== cycleId) return cycle;
            if ((cycle.tasks || []).length >= 5) { alert("Max 5!"); return cycle; }
            return { ...cycle, tasks: [...(cycle.tasks || []), { id: generateId(), text: '', done: false, plan: '', feedback: '' }] };
        }));
    };
    const updateTask = (cycleId, taskId, field, val) => {
        setData(prev => prev.map(c => c.id === cycleId ? { ...c, tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, [field]: val } : t) } : c));
    };
    const deleteTask = (cycleId, taskId) => {
        setData(prev => prev.map(c => c.id === cycleId ? { ...c, tasks: (c.tasks || []).filter(t => t.id !== taskId) } : c));
    };
    return (
        <div className="h-full flex flex-col animate-fade-in pb-20">
            <div className="flex justify-between items-end mb-6 sticky top-0 bg-slate-50 z-20 py-2 border-b border-slate-200">
                <div><h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><Activity className="text-violet-600" /> 36 x 10 Cycles</h2>
                <div className="flex items-center gap-4 mt-2"><div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2"><span className="text-xs font-bold text-slate-400 uppercase">Start</span><input type="date" value={startYearDate} onChange={e => setStartYearDate(e.target.value)} className="bg-transparent font-bold outline-none text-sm"/></div></div></div>
                <div className="w-1/3"><div className="flex justify-between text-xs font-bold mb-1"><span>Progress</span><span className="text-violet-600">{progress}%</span></div><div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-1000" style={{width: `${progress}%`}}></div></div></div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                {data.map(cycle => (
                    <div key={cycle.id} className="bg-white border border-slate-100 rounded-2xl p-6 grid grid-cols-12 gap-6 items-start shadow-sm">
                        <div className="col-span-2 flex flex-col items-center border-r border-slate-50"><div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center font-black text-xl mb-2">{cycle.id}</div><div className="text-center text-[10px] font-bold text-slate-500">{cycle.dateRange}</div></div>
                        <div className="col-span-4 space-y-3 pt-2">
                            {(cycle.tasks || []).map(task => (
                                <div key={task.id} className="flex items-center gap-2 group">
                                    <button onClick={() => updateTask(cycle.id, task.id, 'done', !task.done)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}><CheckSquare size={12} fill={task.done ? "currentColor" : "none"}/></button>
                                    <input type="text" value={task.text} onChange={e => updateTask(cycle.id, task.id, 'text', e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask(cycle.id)} className={`flex-1 bg-transparent border-b border-transparent focus:border-violet-400 outline-none text-sm ${task.done ? 'text-slate-400 line-through' : 'font-medium'}`} />
                                    <button onClick={() => deleteTask(cycle.id, task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><X size={14}/></button>
                                </div>
                            ))}
                            {(cycle.tasks || []).length < 5 && <button onClick={() => addTask(cycle.id)} className="text-xs font-bold text-violet-500">+ Start Task</button>}
                        </div>
                        <div className="col-span-3 space-y-3 pt-2">{(cycle.tasks || []).map(task => (<div key={task.id} className="h-8"><input type="text" placeholder="Plan..." value={task.plan || ''} onChange={e => updateTask(cycle.id, task.id, 'plan', e.target.value)} className="w-full bg-slate-50 rounded-lg px-3 py-1 text-xs outline-none focus:bg-white" /></div>))}</div>
                        <div className="col-span-3 space-y-3 pt-2">{(cycle.tasks || []).map(task => (<div key={task.id} className="h-8"><input type="text" placeholder="Review..." value={task.feedback || ''} onChange={e => updateTask(cycle.id, task.id, 'feedback', e.target.value)} className="w-full bg-slate-50 rounded-lg px-3 py-1 text-xs outline-none focus:bg-white" /></div>))}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal }) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
        <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Calendar</h2>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronLeft size={20}/></button><span className="px-4 py-2 font-bold text-slate-700 text-sm flex items-center">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronRight size={20}/></button></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (<div key={d} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>))}</div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-50 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = dateStr === getLocalDateString(new Date());
              return (<div key={i} onClick={() => openAddModal(dateStr)} className="bg-white p-2 hover:bg-violet-50/30 transition-colors cursor-pointer group flex flex-col min-h-[100px] border-b border-r border-slate-50">
                  <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-violet-600 text-white' : 'text-slate-700'}`}>{day}</div>
                  <div className="space-y-1 overflow-hidden">{dayTasks.slice(0, 3).map(t => (<div key={t.id} className="text-[10px] px-2 py-1 rounded bg-slate-50 border border-slate-100 truncate text-slate-600">{t.title}</div>))}{dayTasks.length > 3 && <div className="text-[9px] text-slate-400 pl-1 font-bold">+ {dayTasks.length - 3} more</div>}</div>
                </div>);
            })}
          </div>
        </div>
      </div>
    );
};

const KanbanView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, categoryColors }) => {
    const hours = Array.from({length: 18}, (_, i) => i + 6); const dateStr = getLocalDateString(currentDate);
    const isToday = dateStr === getLocalDateString(new Date());
    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0 bg-white/50 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white rounded-t-3xl sticky top-0 z-10">
            <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Daily Focus</h2><p className="text-slate-500 text-sm font-bold">{currentDate.toLocaleDateString('default', {weekday: 'long', month: 'long', day: 'numeric'})}</p></div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl"><button onClick={() => setCurrentDate(new Date(new Date().setDate(currentDate.getDate()-1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronLeft size={18}/></button><button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold px-3 py-1.5 bg-white text-violet-600 rounded-lg shadow-sm">Today</button><button onClick={() => setCurrentDate(new Date(new Date().setDate(currentDate.getDate()+1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronRight size={18}/></button></div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-2"> 
            {hours.map((hour) => {
              const ampm = hour >= 12 ? 'pm' : 'am'; const hour12 = hour > 12 ? hour - 12 : hour;
              const displayHour = `${hour12}:00 ${ampm.toUpperCase()}`; const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
              const hourTasks = tasks.filter(t => t.date === dateStr && t.time && parseInt(t.time.split(':')[0]) === hour);
              const isCurrentHour = isToday && hour === new Date().getHours();
              return (<div key={hour} className={`flex items-start gap-4 p-4 rounded-2xl transition-all border ${isCurrentHour ? 'bg-violet-50/40 border-violet-100 ring-1 ring-violet-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                   <div className="w-20 flex-shrink-0 pt-2 border-r border-slate-100 mr-2"><span className={`text-sm font-black ${isCurrentHour ? 'text-violet-600' : 'text-slate-400'}`}>{displayHour}</span></div>
                   <div className="flex-1 min-h-[60px] flex flex-col justify-center">
                      {hourTasks.length > 0 ? (<div className="space-y-2 w-full">{hourTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} categoryColors={categoryColors} showWarning={hourTasks.length > 1} />))}</div>) : 
                      (<button onClick={() => openAddModal(dateStr, timeLabel)} className="text-left text-slate-300 text-sm font-medium hover:text-violet-500 flex items-center gap-2 py-2 w-full h-full"><Plus size={16} className="opacity-50"/> Add focus</button>)}
                   </div>
                </div>);
            })}
          </div>
        </div>
      </div>
    );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState('focus'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(getLocalDateString(new Date()));
  const [selectedTimeForAdd, setSelectedTimeForAdd] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState(['工作', '生活', '健康', '学习']);
  const [tasks, setTasks] = useState([]);
  const [cyclesData, setCyclesData] = useState([]);
  const [startYearDate, setStartYearDate] = useState(new Date().getFullYear() + '-01-01');
  const [wealthBalances, setWealthBalances] = useState({ commitment: 0 });
  const [wealthTransactions, setWealthTransactions] = useState([]);
  const [wealthConfig, setWealthConfig] = useState({ yearlyTarget: 100000, commitment: 2000, showCommitment: true, jars: [{ id: 'savings', label: 'Savings 储蓄', percent: 50 }, { id: 'investment', label: 'Investment 投资', percent: 50 }] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { 
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); if(!u) loadLocalStorage(); }); 
    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
      if (user) {
          const unsubs = [];
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tasks'), d => d.exists() && setTasks(d.data().list || []), () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'categories'), d => d.exists() && setCategories(d.data().list || ['工作', '生活', '健康', '学习']), () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'cycles'), d => {
              if(d.exists()) { setCyclesData(d.data().list || []); setStartYearDate(d.data().startDate || new Date().getFullYear() + '-01-01'); } else { setCyclesData(generateInitialCycles(new Date().getFullYear() + '-01-01')); }
          }, () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth_v2'), d => {
              if(d.exists()) { 
                const data = d.data(); 
                setWealthBalances(data.balances || {}); 
                setWealthTransactions(data.transactions || []); 
                if(data.config) setWealthConfig(data.config);
                setIsLoaded(true);
              } else {
                getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth')).then(v1 => {
                    if(v1.exists()) setWealthBalances(v1.data().balances || {});
                    setIsLoaded(true);
                });
              }
          }, () => {}));
          return () => unsubs.forEach(u => u());
      } else { loadLocalStorage(); }
  }, [user]);

  const saveData = (type, data) => { if(user) { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', type), data); } else { localStorage.setItem(`planner_${type}`, JSON.stringify(data)); } };
  
  useEffect(() => { if(isLoaded && tasks.length > 0) saveData('tasks', { list: tasks }); }, [tasks, isLoaded]);
  useEffect(() => { if(isLoaded && categories.length > 0) saveData('categories', { list: categories }); }, [categories, isLoaded]);
  useEffect(() => { if(isLoaded && cyclesData.length > 0) saveData('cycles', { list: cyclesData, startDate: startYearDate }); }, [cyclesData, startYearDate, isLoaded]);
  useEffect(() => { if(isLoaded && Object.keys(wealthBalances).length > 0) saveData('wealth_v2', { balances: wealthBalances, transactions: wealthTransactions, config: wealthConfig }); }, [wealthBalances, wealthTransactions, wealthConfig, isLoaded]);

  const loadLocalStorage = () => {
      try {
          const t = localStorage.getItem('planner_tasks'); if(t) setTasks(JSON.parse(t).list || []);
          const c = localStorage.getItem('planner_categories'); if(c) setCategories(JSON.parse(c).list || []);
          const cy = localStorage.getItem('planner_cycles'); if(cy) { const d = JSON.parse(cy); setCyclesData(d.list || []); setStartYearDate(d.startDate); } else { setCyclesData(generateInitialCycles(new Date().getFullYear() + '-01-01')); }
          const w = localStorage.getItem('planner_wealth_v2'); if(w) { const d = JSON.parse(w); setWealthBalances(d.balances || {}); setWealthTransactions(d.transactions || []); if(d.config) setWealthConfig(d.config); }
          setIsLoaded(true);
      } catch(e) { console.error(e); }
  }
  const generateInitialCycles = (startStr) => {
      const cycles = []; const startDate = new Date(startStr);
      for (let i = 0; i < 36; i++) {
        const cs = new Date(startDate); cs.setDate(startDate.getDate() + (i * 10)); const ce = new Date(cs); ce.setDate(cs.getDate() + 9);
        cycles.push({ id: i + 1, dateRange: `${cs.getMonth()+1}/${cs.getDate()} - ${ce.getMonth()+1}/${ce.getDate()}`, tasks: [] });
      }
      return cycles;
  };
  const addTask = (newTask) => setTasks([...tasks, { id: Date.now(), completed: false, ...newTask }]);
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const openAddModal = (dateStr, timeStr) => { setSelectedDateForAdd(dateStr || getLocalDateString(new Date())); setSelectedTimeForAdd(timeStr || ''); setIsModalOpen(true); };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 shadow-2xl md:shadow-none transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-10 tracking-tight"><div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200"><Layout size={20} /></div>Planner<span className="text-violet-600">.AI</span></div>
          <nav className="space-y-1.5">{[{ id: 'focus', label: 'Dashboard', icon: Home }, { id: 'wealth', label: 'Wealth Jar', icon: Database }, { id: 'calendar', label: 'Calendar', icon: CalIcon }, { id: 'kanban', label: 'Kanban', icon: Trello }, { id: 'cycle', label: '36 x 10 Cycles', icon: Activity }].map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm tracking-wide ${view === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><item.icon size={18} className={view === item.id ? "text-violet-300" : ""}/>{item.label}</button>
            ))}</nav>
        </div>
        <div className="mt-auto p-8">{user ? (<div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-900 truncate">{user.email ? user.email.split('@')[0] : 'Commander'}</div><button onClick={() => signOut(auth)} className="text-[10px] text-red-500 hover:underline">Log Out</button></div></div>) : 
            (<button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800"><LogIn size={14} /> Log In</button>)}</div>
      </aside>
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-slate-50">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 z-30"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={24} /></button><span className="font-black text-slate-800 tracking-widest text-sm uppercase">{view}</span><button onClick={() => openAddModal()} className="text-violet-600 p-2"><Plus size={24} /></button></header>
        <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar md:pb-10 relative">
          {view === 'focus' && <DashboardView tasks={tasks} onAddTask={addTask} user={user} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={{'工作': 'bg-blue-100 text-blue-600', '生活': 'bg-emerald-100 text-emerald-600', '健康': 'bg-orange-100 text-orange-600', '学习': 'bg-violet-100 text-violet-600', 'default': 'bg-slate-100 text-slate-600'}} />}
          {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances} wealthConfig={wealthConfig} setWealthConfig={setWealthConfig} transactions={wealthTransactions} setTransactions={setWealthTransactions}/>}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} />}
          {view === 'kanban' && <KanbanView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={{'工作': 'bg-blue-100 text-blue-600', '生活': 'bg-emerald-100 text-emerald-600', '健康': 'bg-orange-100 text-orange-600', '学习': 'bg-violet-100 text-violet-600', 'default': 'bg-slate-100 text-slate-600'}} />}
          {view === 'cycle' && <CycleTrackerView data={cyclesData} setData={setCyclesData} startYearDate={startYearDate} setStartYearDate={setStartYearDate}/>}
        </div>
      </main>
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={selectedDateForAdd} defaultTime={selectedTimeForAdd} categories={categories} setCategories={setCategories}/>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }.animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }`}</style>
    </div>
  );
}
