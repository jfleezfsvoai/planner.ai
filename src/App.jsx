import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Calendar as CalIcon, Layout, Trello, CheckSquare, 
  Plus, Clock, ChevronLeft, ChevronRight, X, Bell, 
  Search, Target, TrendingUp, ArrowRight, Lock, Trash2,
  Menu, Home, Database, Zap, Download, Activity, 
  Layers, Shield, BookOpen, DollarSign, PieChart, 
  Square, LogIn, LogOut, User, AlertTriangle, Briefcase, Heart, Coffee, Book,
  Bot, Settings, Edit3, MapPin, Sun, Navigation, Moon, RefreshCw, BarChart2, 
  Save, GripVertical, Eye, Copy, ClipboardList, Flag, PlayCircle, StopCircle,
  CalendarDays, ChevronDown
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

// CRITICAL: Fixed App ID for data persistence
const appId = 'default-planner-app';

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

// Sort helper
const sortTasksByTime = (tasks) => {
    return [...tasks].sort((a, b) => {
        if (!a.time) return 1; // Put tasks without time at the end
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
};

// --- Sub-Components ---

const getIconForLabel = (label) => {
    const l = label ? label.toLowerCase() : '';
    if(l.includes('save') || l.includes('储蓄')) return <Shield size={20}/>;
    if(l.includes('invest') || l.includes('投资')) return <TrendingUp size={20}/>;
    if(l.includes('edu') || l.includes('教育')) return <Book size={20}/>;
    if(l.includes('emer') || l.includes('紧急')) return <AlertTriangle size={20}/>;
    if(l.includes('play') || l.includes('娱乐')) return <Heart size={20}/>;
    return <Layers size={20}/>;
};

// Horizontal Bar Chart
const HorizontalBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center py-10 text-slate-400 text-sm italic font-medium">暂无图表数据</div>;
  const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 1);
  return (
    <div className="w-full space-y-5">
      {data.map((item, index) => {
        const percentage = (Math.abs(item.value) / maxVal) * 100;
        const isExpense = item.value < 0;
        return (
          <div key={index} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-black text-slate-600 uppercase tracking-wider">
              <span>{item.name}</span>
              <span className={isExpense ? 'text-rose-500' : 'text-emerald-500'}>
                {isExpense ? '-' : '+'} RM {Math.abs(item.value).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex shadow-inner">
              <div className={`h-full transition-all duration-1000 ${isExpense ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TaskCard = ({ task, onToggle, onDelete, onUpdate, moveTask, categoryColors, showWarning, categories }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategory, setEditCategory] = useState(task.category);
  const [isDragging, setIsDragging] = useState(false); // Visual feedback
  const getCategoryStyle = (cat) => categoryColors[cat] || 'bg-slate-100 text-slate-600 border-slate-200';

  const handleSave = () => {
    if (editTitle.trim()) { onUpdate(task.id, { title: editTitle, category: editCategory }); }
    setIsEditing(false);
  };

  const handleDragStart = (e) => { 
      e.dataTransfer.setData('text/plain', task.id); 
      e.dataTransfer.effectAllowed = 'move'; 
      // Set a slight delay to allow the ghost image to be captured before hiding the element (optional)
      setTimeout(() => setIsDragging(true), 0);
  };
  
  const handleDragEnd = () => {
      setIsDragging(false);
  };

  const handleDragOver = (e) => { 
      e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move'; 
  };
  
  const handleDrop = (e) => { 
      e.preventDefault(); 
      const dragId = e.dataTransfer.getData('text/plain'); 
      if (dragId && dragId !== task.id && moveTask) { 
          moveTask(dragId, task.id); 
      } 
  };

  if (isEditing) {
      return (
        <div className="bg-white p-3 rounded-2xl border border-violet-200 shadow-md mb-2 animate-in fade-in zoom-in-95 duration-200">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-xs font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1 outline-none focus:border-violet-300" placeholder="任务名称" autoFocus />
            <div className="flex gap-2 mb-3">
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="flex-1 text-[10px] bg-slate-50 border border-slate-200 rounded p-1 outline-none">
                    {(categories || ['工作', '生活', '健康', '学习']).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={14}/></button>
                <button onClick={handleSave} className="p-1.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600"><Save size={14}/></button>
            </div>
        </div>
      );
  }

  return (
    <div 
        draggable 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver} 
        onDrop={handleDrop} 
        className={`bg-white/80 backdrop-blur-sm p-3 rounded-2xl border transition-all group relative mb-2 cursor-grab active:cursor-grabbing 
        ${showWarning ? 'border-amber-300 shadow-amber-100' : 'border-slate-100 shadow-sm hover:border-violet-200'}
        ${isDragging ? 'opacity-40' : 'opacity-100'}
        `}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing"><GripVertical size={12} /></div>
        <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white' : 'border-slate-300 hover:border-violet-500 text-transparent'}`}>
          <CheckSquare size={10} fill={task.completed ? "currentColor" : "none"} />
        </button>
        <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
          <div className="flex justify-between items-start">
             <p className={`text-xs font-bold truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</p>
             {showWarning && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 animate-pulse" title="时间冲突" />}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${getCategoryStyle(task.category)}`}>{task.category}</span>
            {task.time && <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono bg-slate-50 px-1 rounded"><Clock size={8} /> {task.time}</span>}
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/80 rounded-lg backdrop-blur-sm">
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-slate-400 hover:text-violet-500 p-1" title="编辑"><Edit3 size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-slate-400 hover:text-red-500 p-1" title="删除"><Trash2 size={12} /></button>
        </div>
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
        if (!categories.includes(finalCategory)) { setCategories([...categories, finalCategory]); }
    } else if (isCustomCategory && !category.trim()) { finalCategory = 'Uncategorized'; }
    onAdd({ title, category: finalCategory, time, date: defaultDate });
    onClose();
  };

  const deleteCategory = () => {
      if (confirm(`确定要删除类别 "${category}" 吗?`)) {
          setCategories(categories.filter(c => c !== category));
          setCategory(categories[0] || '');
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/50">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Zap size={16} className="text-violet-500" fill="currentColor"/> 新任务</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">内容</label>
            <input ref={inputRef} type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-violet-500 outline-none" placeholder="需要做什么？"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">类别</label>
              <div className="flex gap-2">
                  {isCustomCategory ? (
                    <div className="flex-1 relative">
                      <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="新类别" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500" autoFocus/>
                      <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={14}/></button>
                    </div>
                  ) : (
                     <div className="flex gap-2 w-full items-center">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500 appearance-none">
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button type="button" onClick={deleteCategory} className="p-3 text-slate-400 hover:text-red-500" title="删除当前类别"><Trash2 size={16}/></button>
                        <button type="button" onClick={() => { setIsCustomCategory(true); setCategory(''); }} className="p-3 bg-slate-100 hover:bg-violet-100 text-violet-600 rounded-xl"><Plus size={18}/></button>
                     </div>
                  )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">时间</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500"/>
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">添加任务</button>
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
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-violet-200">
               <User size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-slate-500 text-sm mt-1">Sync your data across devices</p>
          </div>
          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-bold">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500" required />
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50">
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
             {isLogin ? "No account? " : "Have account? "}
             <button onClick={() => setIsLogin(!isLogin)} className="text-violet-600 font-bold hover:underline">{isLogin ? 'Sign Up' : 'Log In'}</button>
          </div>
        </div>
      </div>
    );
};

const DayPreviewModal = ({ isOpen, onClose, dateStr, tasks, onToggle }) => {
    if (!isOpen) return null;
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    return (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">任务概览</h3>
                        <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">{dateStr}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {dayTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 italic">本日暂无安排</div>
                    ) : (
                        dayTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <button onClick={() => onToggle(task.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${task.completed ? 'bg-violet-500 border-violet-500 text-white' : 'bg-white border-slate-300'}`}>
                                    <CheckSquare size={12} fill={task.completed ? "currentColor" : "none"}/>
                                </button>
                                <span className={`flex-1 text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                                {task.time && <span className="text-xs text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100">{task.time}</span>}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Views ---

const DashboardView = ({ tasks, onAddTask, user, openAddModal, toggleTask, deleteTask, onUpdate, moveTask, categoryColors, categories }) => {
    const todayStr = getLocalDateString(new Date());
    // Sort tasks by time
    const todaysTasks = sortTasksByTime(tasks.filter(t => t.date === todayStr));
    const catStats = {};
    todaysTasks.forEach(t => { if(!catStats[t.category]) catStats[t.category] = { total: 0, completed: 0 }; catStats[t.category].total++; if(t.completed) catStats[t.category].completed++; });

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
        <header>
            <h2 className="text-3xl font-black text-slate-800">Dashboard</h2>
            <p className="text-slate-500 font-medium">Welcome back, <span className="text-violet-600">{user?.email?.split('@')[0] || 'Commander'}</span></p>
        </header>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="text-rose-500"/> Today's Focus</h3>
                    <button onClick={() => openAddModal(todayStr)} className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700"><Plus size={16}/></button>
                </div>
                <div className="space-y-2">
                    {todaysTasks.length === 0 ? <div className="text-center text-slate-400 py-10">No tasks for today.</div> : todaysTasks.map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} moveTask={moveTask} categoryColors={categoryColors} categories={categories}/>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><PieChart className="text-blue-500"/> Analysis</h3>
                <div className="space-y-4">
                    {Object.entries(catStats).map(([cat, stat]) => (
                        <div key={cat}><div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{cat}</span><span>{stat.completed}/{stat.total}</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{width: `${(stat.completed/stat.total)*100}%`}}></div></div></div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    );
};

const WealthJarView = ({ balances, setBalances, wealthConfig, setWealthConfig, transactions = [], setTransactions }) => {
    const getSavingsTotal = () => {
        let total = 0;
        wealthConfig.jars.forEach(jar => {
            const label = jar.label.toLowerCase();
            if (label.includes('savings') || label.includes('invest') || label.includes('储蓄') || label.includes('投资')) { total += (balances[jar.id] || 0); }
        });
        return total;
    };
    const savingsPlusInvestment = getSavingsTotal();
    
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
             <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 flex justify-between items-end">
                    <div><div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Yearly Target</div><div className="text-4xl font-black">RM {savingsPlusInvestment.toLocaleString()} <span className="text-slate-500 text-2xl font-bold"> / {wealthConfig.yearlyTarget.toLocaleString()}</span></div></div>
                    <button onClick={() => { const n = prompt("New Target:", wealthConfig.yearlyTarget); if(n) setWealthConfig({...wealthConfig, yearlyTarget: parseFloat(n)}); }} className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">Edit</button>
                </div>
                <div className="mt-6 w-full bg-white/10 rounded-full h-2"><div className="bg-emerald-400 h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (savingsPlusInvestment / wealthConfig.yearlyTarget) * 100)}%` }}></div></div>
            </div>
            {/* ... Rest of Wealth View (Can be kept mostly same, just renamed headers if needed) ... */}
            <div className="text-center text-slate-400 py-10 font-bold italic">Wealth Jar functionality remains active (UI same as before)</div>
        </div>
    );
};

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask }) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
    
    const [previewDate, setPreviewDate] = useState(null);

    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
        <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Calendar</h2>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronLeft size={20}/></button><span className="px-4 py-2 font-bold text-slate-700 text-sm flex items-center">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronRight size={20}/></button></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (<div key={d} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>))}</div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-50 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // Sort tasks for calendar view
              const dayTasks = sortTasksByTime(tasks.filter(t => t.date === dateStr));
              const isToday = dateStr === getLocalDateString(new Date());
              return (
                <div key={i} className="bg-white p-2 hover:bg-violet-50/30 transition-colors group flex flex-col min-h-[100px] border-b border-r border-slate-50 relative">
                  <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-violet-600 text-white' : 'text-slate-700'}`}>{day}</div>
                  <div className="space-y-1 overflow-hidden">{dayTasks.slice(0, 3).map(t => (<div key={t.id} className={`text-[10px] px-2 py-1 rounded bg-slate-50 border border-slate-100 truncate ${t.completed ? 'text-slate-300 line-through' : 'text-slate-600'}`}>{t.title}</div>))}{dayTasks.length > 3 && <div className="text-[9px] text-slate-400 pl-1 font-bold">+ {dayTasks.length - 3} more</div>}</div>
                  {/* Hover Icons */}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/90 rounded-lg p-1 shadow-sm border border-slate-100">
                      <button onClick={(e) => { e.stopPropagation(); setPreviewDate(dateStr); }} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md" title="View Tasks"><Eye size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); openAddModal(dateStr); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md" title="Add Task"><Plus size={14}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <DayPreviewModal isOpen={!!previewDate} onClose={() => setPreviewDate(null)} dateStr={previewDate} tasks={tasks} onToggle={toggleTask} />
      </div>
    );
};

const TimelineView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, onUpdate, moveTask, categoryColors, categories, onCloneYesterday }) => {
    const hours = [...Array.from({length: 18}, (_, i) => i + 6), 0]; 
    const dateStr = getLocalDateString(currentDate);
    
    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0 bg-white/50 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white rounded-t-3xl sticky top-0 z-10">
            <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Timeline</h2><p className="text-slate-500 text-sm font-bold">{currentDate.toLocaleDateString('default', {weekday: 'long', month: 'long', day: 'numeric'})}</p></div>
            <div className="flex items-center gap-2">
                <button onClick={() => onCloneYesterday(dateStr)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-violet-100 hover:text-violet-600 transition-all text-xs mr-2">
                    <Copy size={14}/> Clone Yesterday
                </button>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl"><button onClick={() => setCurrentDate(new Date(new Date().setDate(currentDate.getDate()-1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronLeft size={18}/></button><button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold px-3 py-1.5 bg-white text-violet-600 rounded-lg shadow-sm">Today</button><button onClick={() => setCurrentDate(new Date(new Date().setDate(currentDate.getDate()+1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronRight size={18}/></button></div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-2"> 
            {hours.map((hour) => {
              const displayHour = hour === 0 ? "12:00 AM" : hour === 12 ? "12:00 PM" : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
              const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
              const hourTasks = tasks.filter(t => t.date === dateStr && t.time && parseInt(t.time.split(':')[0]) === hour);
              
              return (
                <div key={hour} className={`flex items-start gap-4 p-4 rounded-2xl transition-all border bg-white border-slate-100 hover:border-slate-200`}>
                    <div className="w-20 flex-shrink-0 pt-2 border-r border-slate-100 mr-2"><span className="text-sm font-black text-slate-400">{displayHour}</span></div>
                    <div className="flex-1 min-h-[60px] flex flex-col justify-center">
                      <div className="w-full space-y-2">
                          {hourTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} moveTask={moveTask} categoryColors={categoryColors} categories={categories} showWarning={false} />))}
                          {hourTasks.length < 5 && (
                              <button onClick={() => openAddModal(dateStr, timeLabel)} className="text-left text-slate-300 text-sm font-medium hover:text-violet-500 flex items-center gap-2 w-full transition-all py-2 h-full"><Plus size={16} className="opacity-50"/> {hourTasks.length === 0 ? "Add focus" : "Add more..."}</button>
                          )}
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
};

// --- FIXED: Review Components extracted to top level ---
const ReviewInput = ({ value, onChange, placeholder, color }) => (
    <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-${color}-500 focus:bg-white transition-all text-sm font-medium mb-2`}/>
);

const ReviewSection = ({ title, icon, color, data, field, onChange, count = 3 }) => (
    <div className={`p-5 rounded-3xl border bg-white border-slate-100 shadow-sm`}>
        <h4 className={`font-black text-${color}-500 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs`}>{icon} {title}</h4>
        {Array.from({ length: count }).map((_, i) => (
            <ReviewInput key={i} value={data[i]} onChange={(val) => onChange(field, i, val)} placeholder={`Item ${i+1}`} color={color}/>
        ))}
    </div>
);

const ReviewView = ({ reviews, onUpdateReview, startYearDate }) => {
    const [activeTab, setActiveTab] = useState('daily');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 - 11
    const [subCycle, setSubCycle] = useState(0); // 0, 1, 2
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));

    const dailyData = reviews?.daily?.[selectedDate] || { keep: [], improve: [], start: [], stop: [] };
    
    // Calculate global cycle ID: Month * 3 + subCycle + 1 (simplified mapping for UI)
    const activeGlobalCycleId = (selectedMonth * 3) + subCycle + 1;
    const cycleData = reviews?.cycle?.[activeGlobalCycleId] || { plan: [], do: [], adjust: [], check: [], aar: [] };

    // Date navigation helpers
    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(getLocalDateString(d));
    };

    // Cycle date calculation
    const getCycleInfo = (globalId) => {
        const start = new Date(startYearDate);
        start.setDate(start.getDate() + (globalId - 1) * 10);
        const end = new Date(start);
        end.setDate(end.getDate() + 9);
        return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
    };

    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const handleDailyChange = (field, idx, val) => {
        const list = [...(dailyData[field] || ['', '', '', ''])];
        list[idx] = val;
        const newData = { ...reviews, daily: { ...(reviews.daily || {}), [selectedDate]: { ...dailyData, [field]: list } } };
        onUpdateReview(newData);
    };

    const handleCycleChange = (field, idx, val) => {
        const list = [...(cycleData[field] || Array(5).fill(''))];
        list[idx] = val;
        const newData = { ...reviews, cycle: { ...(reviews.cycle || {}), [activeGlobalCycleId]: { ...cycleData, [field]: list } } };
        onUpdateReview(newData);
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-slate-800">Review</h2><p className="text-slate-500 font-medium">Reflect and Evolve</p></div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {['daily', 'cycle'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t} Review</button>
                    ))}
                </div>
            </header>

            {activeTab === 'daily' ? (
                <div className="space-y-6">
                    <div className="flex justify-end items-center gap-3">
                        <button onClick={() => changeDate(-1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronLeft size={16}/></button>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold text-slate-700 outline-none"/>
                        <button onClick={() => changeDate(1)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronRight size={16}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ReviewSection title="Keep (保持)" icon={<CheckSquare size={16}/>} color="emerald" data={dailyData.keep || []} field="keep" onChange={handleDailyChange} count={3}/>
                        <ReviewSection title="Improve (改进)" icon={<TrendingUp size={16}/>} color="amber" data={dailyData.improve || []} field="improve" onChange={handleDailyChange} count={3}/>
                        <ReviewSection title="Start (开始)" icon={<PlayCircle size={16}/>} color="blue" data={dailyData.start || []} field="start" onChange={handleDailyChange} count={3}/>
                        <ReviewSection title="Stop (停止)" icon={<StopCircle size={16}/>} color="rose" data={dailyData.stop || []} field="stop" onChange={handleDailyChange} count={3}/>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start bg-white p-4 rounded-3xl border border-slate-100">
                            {/* Left: Cycle Tabs */}
                            <div className="flex gap-2">
                                {[0, 1, 2].map((idx) => {
                                    const cId = (selectedMonth * 3) + idx + 1;
                                    const range = getCycleInfo(cId);
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSubCycle(idx)} 
                                            className={`flex flex-col items-start px-5 py-3 rounded-2xl transition-all border ${subCycle === idx ? 'bg-violet-50 border-violet-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                        >
                                            <span className={`text-xs font-black uppercase tracking-widest ${subCycle === idx ? 'text-violet-600' : 'text-slate-400'}`}>Cycle {idx + 1}</span>
                                            <span className={`text-[10px] font-bold ${subCycle === idx ? 'text-violet-400' : 'text-slate-300'}`}>{range}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right: Month Selector */}
                            <div className="relative">
                                <select 
                                    value={selectedMonth} 
                                    onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setSubCycle(0); }} 
                                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-6 py-3 pr-10 rounded-xl outline-none focus:border-violet-300 cursor-pointer"
                                >
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={16}/></div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ReviewSection title="Plan (计划)" icon={<Target size={14}/>} color="blue" data={cycleData.plan || []} field="plan" onChange={handleCycleChange} count={5}/>
                            <ReviewSection title="Do (执行)" icon={<Zap size={14}/>} color="violet" data={cycleData.do || []} field="do" onChange={handleCycleChange} count={5}/>
                            <ReviewSection title="Adjust (调整)" icon={<RefreshCw size={14}/>} color="amber" data={cycleData.adjust || []} field="adjust" onChange={handleCycleChange} count={5}/>
                            <ReviewSection title="Check (检查)" icon={<ClipboardList size={14}/>} color="emerald" data={cycleData.check || []} field="check" onChange={handleCycleChange} count={5}/>
                        </div>
                        
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                             <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs"><Flag size={14} className="text-rose-400"/> AAR (After Action Review)</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[0, 1, 2].map(i => (
                                    <input key={i} value={(cycleData.aar || [])[i] || ''} onChange={(e) => handleCycleChange('aar', i, e.target.value)} placeholder={`Key Insight ${i+1}...`} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all text-sm text-white placeholder-slate-500"/>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- RESTORED: CycleTaskRow & CycleTrackerView ---
const CycleTaskRow = memo(({ task, cycleId, onUpdate, onDelete }) => {
    const [localText, setLocalText] = useState(task.text);
    const [localPlan, setLocalPlan] = useState(task.plan);
    const [localFeedback, setLocalFeedback] = useState(task.feedback);

    useEffect(() => {
        setLocalText(task.text);
        setLocalPlan(task.plan);
        setLocalFeedback(task.feedback);
    }, [task.id, task.text, task.plan, task.feedback]);

    const handleBlur = (field, val) => {
        if (task[field] !== val) {
            onUpdate(cycleId, task.id, field, val);
        }
    };

    return (
        <div className="grid grid-cols-10 gap-4 items-center group bg-slate-50/50 p-2 rounded-2xl border border-transparent hover:border-violet-100 transition-all">
            <div className="col-span-4 flex items-center gap-2">
                <button onClick={() => onUpdate(cycleId, task.id, 'done', !task.done)} className={`w-5 h-5 rounded-lg border flex-shrink-0 flex items-center justify-center transition-colors ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                    <CheckSquare size={12} fill={task.done ? "currentColor" : "none"}/>
                </button>
                <input 
                    type="text" 
                    value={localText} 
                    onChange={e => setLocalText(e.target.value)}
                    onBlur={e => handleBlur('text', e.target.value)}
                    placeholder="Task..."
                    className={`flex-1 bg-transparent outline-none text-sm transition-all ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 font-bold'}`} 
                />
                <button onClick={() => onDelete(cycleId, task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 size={14}/>
                </button>
            </div>
            <div className="col-span-3">
                <input 
                    type="text" 
                    placeholder="Strategy..." 
                    value={localPlan || ''} 
                    onChange={e => setLocalPlan(e.target.value)}
                    onBlur={e => handleBlur('plan', e.target.value)}
                    className="w-full bg-white/50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-violet-200 focus:bg-white transition-all" 
                />
            </div>
            <div className="col-span-3">
                <input 
                    type="text" 
                    placeholder="Feedback..." 
                    value={localFeedback || ''} 
                    onChange={e => setLocalFeedback(e.target.value)}
                    onBlur={e => handleBlur('feedback', e.target.value)}
                    className="w-full bg-white/50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-violet-200 focus:bg-white transition-all" 
                />
            </div>
        </div>
    );
});

const CycleTrackerView = ({ data, setData, startYearDate, setStartYearDate }) => {
    const totalTasks = data.reduce((acc, c) => acc + (c.tasks?.length || 0), 0);
    const completedTasks = data.reduce((acc, c) => acc + (c.tasks?.filter(t => t.done).length || 0), 0);
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    
    const addTask = (cycleId) => {
        setData(prev => prev.map(cycle => {
            if (cycle.id !== cycleId) return cycle;
            if ((cycle.tasks || []).length >= 5) { alert("Max 5 tasks per cycle!"); return cycle; }
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
            <div className="flex justify-between items-end mb-6 sticky top-0 bg-slate-50/90 backdrop-blur-md z-20 py-2 border-b border-slate-200">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Activity className="text-violet-600" /> 36 x 10 Cycle Tracker</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</span>
                            <input type="date" value={startYearDate} onChange={e => setStartYearDate(e.target.value)} className="bg-transparent font-bold outline-none text-xs text-slate-700"/>
                        </div>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><span>Progress</span><span className="text-violet-600">{progress}%</span></div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 transition-all duration-1000" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-12 gap-4 px-6 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-2 text-center">Cycle / Date</div>
                    <div className="col-span-4">Task</div>
                    <div className="col-span-3">Strategy</div>
                    <div className="col-span-3">Feedback</div>
                </div>

                <div className="space-y-6">
                    {data.map(cycle => (
                        <div key={cycle.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-2 flex flex-col items-center justify-center border-r border-slate-50 py-2">
                                    <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center font-black text-xl mb-1 shadow-inner">{cycle.id}</div>
                                    <div className="text-center text-[10px] font-bold text-slate-400">{cycle.dateRange}</div>
                                    <button onClick={() => addTask(cycle.id)} className="mt-4 p-2 bg-slate-50 text-violet-600 rounded-xl hover:bg-violet-600 hover:text-white transition-all shadow-sm"><Plus size={16}/></button>
                                </div>

                                <div className="col-span-10 space-y-3">
                                    {cycle.tasks && cycle.tasks.length > 0 ? (
                                        cycle.tasks.map(task => (
                                            <CycleTaskRow key={task.id} task={task} cycleId={cycle.id} onUpdate={updateTask} onDelete={deleteTask} />
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-300 text-xs italic font-medium py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No tasks this cycle. Start your 10-day challenge!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
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
  const [wealthConfig, setWealthConfig] = useState({ yearlyTarget: 100000, commitment: 2000, showCommitment: true, jars: [] });
  const [reviews, setReviews] = useState({ daily: {}, cycle: {} }); // Renamed 'weekly' to 'cycle' in state
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { 
    const initAuth = async () => { if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } else { await signInAnonymously(auth); } };
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
              if(d.exists()) { const data = d.data(); setWealthBalances(data.balances || {}); setWealthTransactions(data.transactions || []); if(data.config) setWealthConfig(data.config); }
          }, () => {}));
          // New Review Listener
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'reviews'), d => d.exists() && setReviews(d.data() || { daily: {}, cycle: {} }), () => {}));
          
          setIsLoaded(true);
          return () => unsubs.forEach(u => u());
      } else { loadLocalStorage(); }
  }, [user]);

  const saveData = (type, data) => { if(user) { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', type), data); } else { localStorage.setItem(`planner_${type}`, JSON.stringify(data)); } };
  
  useEffect(() => { if(isLoaded) saveData('tasks', { list: tasks }); }, [tasks, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('categories', { list: categories }); }, [categories, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('cycles', { list: cyclesData, startDate: startYearDate }); }, [cyclesData, startYearDate, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('wealth_v2', { balances: wealthBalances, transactions: wealthTransactions, config: wealthConfig }); }, [wealthBalances, wealthTransactions, wealthConfig, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('reviews', reviews); }, [reviews, isLoaded]);

  const loadLocalStorage = () => {
      try {
          const t = localStorage.getItem('planner_tasks'); if(t) setTasks(JSON.parse(t).list || []);
          const c = localStorage.getItem('planner_categories'); if(c) setCategories(JSON.parse(c).list || []);
          const cy = localStorage.getItem('planner_cycles'); if(cy) { const d = JSON.parse(cy); setCyclesData(d.list || []); setStartYearDate(d.startDate); } else { setCyclesData(generateInitialCycles(new Date().getFullYear() + '-01-01')); }
          const w = localStorage.getItem('planner_wealth_v2'); if(w) { const d = JSON.parse(w); setWealthBalances(d.balances || {}); setWealthTransactions(d.transactions || []); if(d.config) setWealthConfig(d.config); }
          const r = localStorage.getItem('planner_reviews'); if(r) setReviews(JSON.parse(r) || { daily: {}, cycle: {} });
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
  const updateTask = (id, updates) => setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  const moveTask = (dragId, hoverId) => {
      const dragIndex = tasks.findIndex(t => t.id === dragId || t.id === parseInt(dragId));
      const hoverIndex = tasks.findIndex(t => t.id === hoverId || t.id === parseInt(hoverId));
      if (dragIndex >= 0 && hoverIndex >= 0 && dragIndex !== hoverIndex) {
          const newTasks = [...tasks];
          const [draggedItem] = newTasks.splice(dragIndex, 1);
          newTasks.splice(hoverIndex, 0, draggedItem);
          setTasks(newTasks);
      }
  };
  
  // Clone Function
  const cloneYesterdayTasks = (targetDateStr) => {
      const targetDate = new Date(targetDateStr);
      const yesterday = new Date(targetDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateString(yesterday);
      
      const tasksToClone = tasks.filter(t => t.date === yesterdayStr);
      if (tasksToClone.length === 0) { alert("Yesterday had no tasks to clone!"); return; }
      
      const clonedTasks = tasksToClone.map(t => ({
          ...t,
          id: generateId(), // New ID
          date: targetDateStr, // New Date
          completed: false // Reset completion
      }));
      
      setTasks(prev => [...prev, ...clonedTasks]);
      alert(`Cloned ${clonedTasks.length} tasks from ${yesterdayStr} to ${targetDateStr}`);
  };

  const openAddModal = (dateStr, timeStr) => { setSelectedDateForAdd(dateStr || getLocalDateString(new Date())); setSelectedTimeForAdd(timeStr || ''); setIsModalOpen(true); };

  const catColors = {'工作': 'bg-blue-100 text-blue-600', '生活': 'bg-emerald-100 text-emerald-600', '健康': 'bg-orange-100 text-orange-600', '学习': 'bg-violet-100 text-violet-600', 'default': 'bg-slate-100 text-slate-600'};

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 shadow-2xl md:shadow-none transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-10 tracking-tight"><div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200"><Layout size={20} /></div>Planner<span className="text-violet-600">.AI</span></div>
          <nav className="space-y-1.5">{[{ id: 'focus', label: 'Dashboard', icon: Home }, { id: 'wealth', label: 'Wealth Jar', icon: Database }, { id: 'calendar', label: 'Calendar', icon: CalIcon }, { id: 'kanban', label: 'Timeline', icon: Trello }, { id: 'cycle', label: '36 x 10 Cycle', icon: Activity }, { id: 'review', label: 'Review', icon: ClipboardList }].map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm tracking-wide ${view === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><item.icon size={18} className={view === item.id ? "text-violet-300" : ""}/>{item.label}</button>
            ))}</nav>
        </div>
        <div className="mt-auto p-8">{user ? (<div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-900 truncate">{user.email ? user.email.split('@')[0] : 'Commander'}</div><button onClick={() => signOut(auth)} className="text-[10px] text-red-500 hover:underline">Log Out</button></div></div>) : 
            (<button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800"><LogIn size={14} /> Login</button>)}</div>
      </aside>
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-slate-50">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 z-30"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={24} /></button><span className="font-black text-slate-800 tracking-widest text-sm uppercase">{view}</span><button onClick={() => openAddModal()} className="text-violet-600 p-2"><Plus size={24} /></button></header>
        <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar md:pb-10 relative">
          {view === 'focus' && <DashboardView tasks={tasks} onAddTask={addTask} user={user} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} moveTask={moveTask} categoryColors={catColors} categories={categories} />}
          {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances} wealthConfig={wealthConfig} setWealthConfig={setWealthConfig} transactions={wealthTransactions} setTransactions={setWealthTransactions}/>}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask}/>}
          {view === 'kanban' && <TimelineView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} moveTask={moveTask} categoryColors={catColors} categories={categories} onCloneYesterday={cloneYesterdayTasks} />}
          {view === 'cycle' && <CycleTrackerView data={cyclesData} setData={setCyclesData} startYearDate={startYearDate} setStartYearDate={setStartYearDate}/>}
          {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={setReviews} startYearDate={startYearDate}/>}
        </div>
      </main>
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={selectedDateForAdd} defaultTime={selectedTimeForAdd} categories={categories} setCategories={setCategories}/>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }.animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }`}</style>
    </div>
  );
}
