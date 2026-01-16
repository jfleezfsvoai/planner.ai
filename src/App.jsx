import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  Calendar as CalIcon, Layout, Trello, CheckSquare, 
  Plus, Clock, ChevronLeft, ChevronRight, X, Bell, 
  Search, Target, TrendingUp, ArrowRight, Lock, Trash2,
  Menu, Home, Database, Zap, Download, Activity, 
  Layers, Shield, BookOpen, DollarSign, PieChart, 
  Square, LogIn, LogOut, User, AlertTriangle, Briefcase, Heart, Coffee, Book,
  Bot, Settings, Edit3, MapPin, Sun, Navigation, Moon, RefreshCw, BarChart2
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

// --- Sub-Components ---

const SettingsIcon = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

const getIconForLabel = (label) => {
    const l = label ? label.toLowerCase() : '';
    if(l.includes('save') || l.includes('储蓄')) return <Shield size={20}/>;
    if(l.includes('invest') || l.includes('投资')) return <TrendingUp size={20}/>;
    if(l.includes('edu') || l.includes('教育')) return <Book size={20}/>;
    if(l.includes('emer') || l.includes('紧急')) return <AlertTriangle size={20}/>;
    if(l.includes('play') || l.includes('娱乐')) return <Heart size={20}/>;
    return <Layers size={20}/>;
};

// Horizontal Bar Chart for Category Analysis
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
              <div 
                className={`h-full transition-all duration-1000 ${isExpense ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
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
             {showWarning && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 animate-pulse" title="时间冲突" />}
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
            <Zap size={16} className="text-violet-500" fill="currentColor"/> 新任务
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">内容</label>
            <input 
              ref={inputRef}
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-violet-500 outline-none"
              placeholder="需要做什么？"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">类别</label>
              <div className="flex gap-2">
                 {isCustomCategory ? (
                   <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="新类别"
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
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">时间</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500"
              />
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
            <h2 className="text-2xl font-black text-slate-800">{isLogin ? '欢迎回来' : '创建账户'}</h2>
            <p className="text-slate-500 text-sm mt-1">跨设备同步您的数据</p>
          </div>
          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-bold">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="邮箱地址" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500" required />
            <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500" required />
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50">
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
             {isLogin ? "还没有账号？ " : "已有账号？ "}
             <button onClick={() => setIsLogin(!isLogin)} className="text-violet-600 font-bold hover:underline">{isLogin ? '注册' : '登录'}</button>
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
    
    const displayName = user?.email ? user.email.split('@')[0] : (user?.isAnonymous ? '指挥官' : '访客');

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
            const responseText = `先生，我已经为您全天的计划进行了编排。起床时间定在 ${wakeTimeStr}，建议 ${travelTimeStr} 出发以避开吉隆坡的早高峰。剩余空档已填补深度工作和健身。`;
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
            <h2 className="text-3xl font-black text-slate-800">仪表盘</h2>
            <p className="text-slate-500 font-medium">欢迎回来, <span className="text-violet-600">{displayName}</span></p>
        </header>
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-start gap-4 relative z-10">
                <div className="bg-cyan-900/50 p-3 rounded-2xl border border-cyan-500/30"><Bot className="text-cyan-400" size={28}/></div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg font-mono tracking-wide text-cyan-50">J.A.R.V.I.S. 协议</h3>
                    <p className="text-slate-400 text-xs mb-4">生活编排器 & 物流优化器</p>
                    {jarvisResponse && (
                        <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-4 text-cyan-100 text-sm font-mono animate-fade-in leading-relaxed">
                            <span className="text-cyan-400 mr-2 font-bold">JARVIS:</span> {jarvisResponse}
                        </div>
                    )}
                    <form onSubmit={handleJarvisPlan} className="flex gap-3">
                        <input type="text" value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder='例如: "明天 9:30am 到达 ING LIVE KL"' className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-all font-medium text-sm" />
                        <button type="submit" disabled={isProcessing} className="bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50 min-w-[120px] justify-center">
                            {isProcessing ? <Activity className="animate-spin" size={18}/> : '执行'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="text-rose-500"/> 今日焦点</h3>
                    <button onClick={() => openAddModal(todayStr)} className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700"><Plus size={16}/></button>
                </div>
                <div className="space-y-2">
                    {todaysTasks.length === 0 ? <div className="text-center text-slate-400 py-10">今日暂无任务。</div> : todaysTasks.map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} categoryColors={categoryColors} />
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><PieChart className="text-blue-500"/> 任务分析</h3>
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
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });
    const [isCustomCat, setIsCustomCat] = useState(false);
    const [showGraph, setShowGraph] = useState(false);
    const [isAddJarOpen, setIsAddJarOpen] = useState(false);
    const [newJarForm, setNewJarForm] = useState({ label: '', percent: '' });
    const [editingTxId, setEditingTxId] = useState(null); // Track transaction being edited

    const defaultTxCats = ['饮食', '交通', '购物', '订阅', '医疗', '其他'];
    const usedTxCats = Array.from(new Set([...defaultTxCats, ...transactions.map(t => t.category)]));

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

        newTransactions.unshift({ id: Date.now(), amount: amt, category: '收入', remark: '手动录入', date: getLocalDateString(new Date()), type: 'income' });
        if (wealthConfig.showCommitment && commit > 0) {
            newBalances.commitment = (newBalances.commitment || 0) + commit;
            newTransactions.unshift({ id: Date.now() + 1, amount: -commit, category: '固定开销', remark: '自动扣除', date: getLocalDateString(new Date()), type: 'expense' });
        }
        wealthConfig.jars.forEach(jar => {
            const share = netIncome * (jar.percent / 100);
            newBalances[jar.id] = (newBalances[jar.id] || 0) + share;
        });
        setBalances(newBalances);
        setTransactions(newTransactions);
        setIncome('');
    };

    // Consolidated add/edit logic
    const submitTransaction = (e) => {
        e.preventDefault();
        if(!expenseForm.amount || !expenseForm.category) return;
        
        let finalAmount = parseFloat(expenseForm.amount);
        // Automatic positive for income, negative for others
        if (expenseForm.category !== '收入') {
            finalAmount = -Math.abs(finalAmount);
        } else {
            finalAmount = Math.abs(finalAmount);
        }

        if (editingTxId) {
            // Update existing
            const updated = transactions.map(t => t.id === editingTxId ? { ...t, ...expenseForm, amount: finalAmount } : t);
            setTransactions(updated);
            setEditingTxId(null);
        } else {
            // Add new
            const newTx = { id: Date.now(), ...expenseForm, amount: finalAmount };
            setTransactions([newTx, ...transactions]);
        }
        
        setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });
        setIsCustomCat(false);
    };

    const deleteJar = (id) => {
        const newBalances = { ...balances };
        delete newBalances[id];
        setBalances(newBalances);
        setWealthConfig({ ...wealthConfig, jars: wealthConfig.jars.filter(j => j.id !== id) });
    };

    const restoreCommitment = () => {
        const val = prompt("输入固定开销金额 (RM):", "2000");
        if (val !== null) {
            setWealthConfig({ ...wealthConfig, showCommitment: true, commitment: parseFloat(val) || 0 });
        }
    };

    const startEditTx = (tx) => {
        setEditingTxId(tx.id);
        setExpenseForm({
            amount: Math.abs(tx.amount).toString(),
            category: tx.category,
            remark: tx.remark || '',
            date: tx.date
        });
        // If it's a custom category not in default list, ensure we handle it
        if (!defaultTxCats.includes(tx.category) && tx.category !== '收入' && tx.category !== '固定开销') {
            // It might be a custom one. We'll show it in select or can toggle isCustomCat
        }
        // Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteTx = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
        if (editingTxId === id) {
            setEditingTxId(null);
            setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });
        }
    };

    const getSavingsTotal = () => {
        let total = 0;
        wealthConfig.jars.forEach(jar => {
            const label = jar.label.toLowerCase();
            if (label.includes('savings') || label.includes('investment') || label.includes('储蓄') || label.includes('投资')) {
                total += (balances[jar.id] || 0);
            }
        });
        return total;
    };

    const netTransactionTotal = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const groupedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).reduce((groups, tx) => {
        const date = tx.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(tx);
        return groups;
    }, {});

    const barData = usedTxCats.map(cat => {
        const catTxs = transactions.filter(t => t.category === cat);
        const total = catTxs.reduce((acc, t) => acc + t.amount, 0);
        return { name: cat, value: total };
    }).filter(d => d.value !== 0);

    const savingsPlusInvestment = getSavingsTotal();

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">年度储蓄目标 (储蓄+投资)</div>
                        <div className="text-4xl font-black">RM {savingsPlusInvestment.toLocaleString()} <span className="text-slate-500 text-2xl font-bold"> / {wealthConfig.yearlyTarget.toLocaleString()}</span></div>
                    </div>
                    <button onClick={() => { const n = prompt("新目标:", wealthConfig.yearlyTarget); if(n) setWealthConfig({...wealthConfig, yearlyTarget: parseFloat(n)}); }} className="bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">编辑</button>
                </div>
                <div className="mt-6 w-full bg-white/10 rounded-full h-2"><div className="bg-emerald-400 h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (savingsPlusInvestment / wealthConfig.yearlyTarget) * 100)}%` }}></div></div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign className="text-emerald-500"/> 收入分配器</h3>
                <form onSubmit={handleDistribute} className="flex flex-col md:flex-row gap-4">
                    <input type="number" placeholder="输入收入 (RM)" value={income} onChange={e=>setIncome(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold text-lg"/>
                    {wealthConfig.showCommitment && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 font-bold min-w-[200px]">
                            <span className="text-xs uppercase whitespace-nowrap">固定开销:</span> 
                            <input type="number" value={wealthConfig.commitment} onChange={e => setWealthConfig({...wealthConfig, commitment: parseFloat(e.target.value)||0})} className="bg-transparent border-b border-rose-200 outline-none w-full text-right font-bold" />
                        </div>
                    )}
                    <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all">全部分配</button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wealthConfig.showCommitment ? (
                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex flex-col justify-between h-40 relative group">
                        <div className="flex justify-between items-start"><div className="font-bold text-rose-700">固定开销</div><Lock size={16} className="text-rose-400"/></div>
                        <div className="text-2xl font-black text-rose-800">RM {(balances.commitment||0).toLocaleString()}</div>
                    </div>
                ) : (
                    <button onClick={restoreCommitment} className="bg-rose-50/50 border-2 border-dashed border-rose-200 p-6 rounded-3xl flex flex-col items-center justify-center h-40 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold gap-2"><RefreshCw size={24}/> 恢复固定开销</button>
                )}
                {wealthConfig.jars.map(jar => (
                    <div key={jar.id} className="bg-white border border-slate-100 p-6 rounded-3xl flex flex-col justify-between h-40 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="flex justify-between items-start">
                            <div><div className="font-bold text-slate-700">{jar.label}</div><div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">{jar.percent}%</div></div>
                            <div className="p-2 bg-slate-50 rounded-full text-slate-400">{getIconForLabel(jar.label)}</div>
                        </div>
                        <div className="text-2xl font-black text-slate-800">RM {(balances[jar.id]||0).toLocaleString()}</div>
                        <button onClick={() => deleteJar(jar.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 p-1 rounded transition-all"><X size={16}/></button>
                    </div>
                ))}
                <button onClick={() => setIsAddJarOpen(true)} className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center h-40 text-slate-400 hover:border-violet-400 font-bold gap-2 transition-all"><Plus size={24}/> 添加存钱罐</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        {editingTxId ? <Edit3 size={18} className="text-amber-500"/> : <DollarSign size={18} className="text-slate-400"/>}
                        {editingTxId ? '编辑交易记录' : '记录收支'}
                    </h3>
                    <form onSubmit={submitTransaction} className="space-y-4">
                        <input type="number" placeholder="金额" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 ring-violet-100" />
                        <div className="flex gap-2">
                           {!isCustomCat ? (
                               <select 
                                 value={expenseForm.category} 
                                 onChange={e => e.target.value === 'NEW' ? setIsCustomCat(true) : setExpenseForm({...expenseForm, category: e.target.value})}
                                 className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                               >
                                 <option value="">选择类别</option>
                                 {usedTxCats.map(c => <option key={c} value={c}>{c}</option>)}
                                 <option value="NEW" className="font-bold text-violet-600">+ 新增类别</option>
                               </select>
                           ) : (
                               <div className="flex-1 relative">
                                   <input 
                                       type="text" 
                                       placeholder="新类别名称"
                                       value={expenseForm.category}
                                       onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                                       className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                                       autoFocus
                                   />
                                   <button type="button" onClick={() => setIsCustomCat(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={14}/></button>
                               </div>
                           )}
                        </div>
                        <input type="text" placeholder="备注" value={expenseForm.remark} onChange={e=>setExpenseForm({...expenseForm, remark: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                        <input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm, date: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                        <div className="flex gap-2">
                            {editingTxId && (
                                <button type="button" onClick={() => {setEditingTxId(null); setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });}} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all">取消</button>
                            )}
                            <button type="submit" className={`flex-[2] text-white font-bold py-3 rounded-xl transition-all shadow-lg ${editingTxId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                {editingTxId ? '保存修改' : '录入数据'}
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800">近期流水</h3>
                            <div className="text-xs font-bold text-slate-400 mt-1">余额变动: <span className={netTransactionTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{netTransactionTotal >= 0 ? '+' : ''} RM {netTransactionTotal.toLocaleString()}</span></div>
                        </div>
                        <button onClick={() => setShowGraph(!showGraph)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showGraph ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' : 'bg-slate-100 text-slate-600'}`}>
                            {showGraph ? <Layout size={14}/> : <BarChart2 size={14}/>} {showGraph ? '返回列表' : '分类统计'}
                        </button>
                    </div>

                    {showGraph ? (
                        <div className="py-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">各类别净额对比 (横向)</h4>
                            <HorizontalBarChart data={barData} />
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            {Object.keys(groupedTransactions).length === 0 ? <div className="text-center text-slate-400 py-10 italic">暂无收支记录。</div> : Object.entries(groupedTransactions).map(([date, txs]) => (
                                <div key={date} className="space-y-2">
                                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-1 border-b border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{date === getLocalDateString(new Date()) ? '今天' : date}</span>
                                    </div>
                                    <div className="space-y-1">
                                        {txs.map(tx => (
                                            <div key={tx.id} className="grid grid-cols-12 items-center p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                                                <div className="col-span-7">
                                                    <div className="font-bold text-slate-700 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                        {tx.category}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium pl-3.5">{tx.remark || '无备注'}</div>
                                                </div>
                                                <div className={`col-span-3 text-right font-black text-sm ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {tx.amount > 0 ? '+' : ''} RM {Math.abs(tx.amount).toFixed(2)}
                                                </div>
                                                <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => startEditTx(tx)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="编辑">
                                                        <Edit3 size={14}/>
                                                    </button>
                                                    <button onClick={() => deleteTx(tx.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="删除">
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isAddJarOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/50">
                        <h3 className="font-bold text-xl mb-6 text-slate-800">添加新存钱罐</h3>
                        <form onSubmit={handleAddJar} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">罐子名称</label>
                                <input className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-violet-500 bg-slate-50" value={newJarForm.label} onChange={e => setNewJarForm({...newJarForm, label: e.target.value})} placeholder="例如: 长期储蓄" autoFocus />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">分配比例 (%)</label>
                                <input type="number" className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-violet-500 bg-slate-50" value={newJarForm.percent} onChange={e => setNewJarForm({...newJarForm, percent: e.target.value})} placeholder="0 - 100" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddJarOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">取消</button>
                                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">创建罐子</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Memoized Row for Cycles Tracker to prevent IME issues
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
                    placeholder="任务描述..."
                    className={`flex-1 bg-transparent outline-none text-sm transition-all ${task.done ? 'text-slate-400 line-through' : 'text-slate-700 font-bold'}`} 
                />
                <button onClick={() => onDelete(cycleId, task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 size={14}/>
                </button>
            </div>
            <div className="col-span-3">
                <input 
                    type="text" 
                    placeholder="策略..." 
                    value={localPlan || ''} 
                    onChange={e => setLocalPlan(e.target.value)}
                    onBlur={e => handleBlur('plan', e.target.value)}
                    className="w-full bg-white/50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-violet-200 focus:bg-white transition-all" 
                />
            </div>
            <div className="col-span-3">
                <input 
                    type="text" 
                    placeholder="结果..." 
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
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Activity className="text-violet-600" /> 36 x 10 周期追踪</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">起始日期</span>
                            <input type="date" value={startYearDate} onChange={e => setStartYearDate(e.target.value)} className="bg-transparent font-bold outline-none text-xs text-slate-700"/>
                        </div>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><span>全年达成率</span><span className="text-violet-600">{progress}%</span></div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 transition-all duration-1000" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-12 gap-4 px-6 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-2 text-center">周期 / 日期</div>
                    <div className="col-span-4">任务内容</div>
                    <div className="col-span-3">执行策略</div>
                    <div className="col-span-3">复盘反馈</div>
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
                                        <div className="h-full flex items-center justify-center text-slate-300 text-xs italic font-medium py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">本周期暂无任务，开启你的 10 天挑战吧！</div>
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

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal }) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
        <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-800 tracking-tight">日历</h2>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronLeft size={20}/></button><span className="px-4 py-2 font-bold text-slate-700 text-sm flex items-center">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronRight size={20}/></button></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">{['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (<div key={d} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>))}</div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-50 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = dateStr === getLocalDateString(new Date());
              return (<div key={i} onClick={() => openAddModal(dateStr)} className="bg-white p-2 hover:bg-violet-50/30 transition-colors cursor-pointer group flex flex-col min-h-[100px] border-b border-r border-slate-50">
                  <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-violet-600 text-white' : 'text-slate-700'}`}>{day}</div>
                  <div className="space-y-1 overflow-hidden">{dayTasks.slice(0, 3).map(t => (<div key={t.id} className="text-[10px] px-2 py-1 rounded bg-slate-50 border border-slate-100 truncate text-slate-600">{t.title}</div>))}{dayTasks.length > 3 && <div className="text-[9px] text-slate-400 pl-1 font-bold">+ {dayTasks.length - 3} 更多</div>}</div>
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
            <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">每日焦点</h2><p className="text-slate-500 text-sm font-bold">{currentDate.toLocaleDateString('default', {weekday: 'long', month: 'long', day: 'numeric'})}</p></div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl"><button onClick={() => setCurrentDate(new Date(new Date().setDate(currentDate.getDate()-1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronLeft size={18}/></button><button onClick={() => setCurrentDate(new Date())} className="text-xs font-bold px-3 py-1.5 bg-white text-violet-600 rounded-lg shadow-sm">今天</button><button onClick={() => setCurrentDate(new Date(new Date().setDate(currentDate.getDate()+1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronRight size={18}/></button></div>
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
                      (<button onClick={() => openAddModal(dateStr, timeLabel)} className="text-left text-slate-300 text-sm font-medium hover:text-violet-500 flex items-center gap-2 py-2 w-full h-full"><Plus size={16} className="opacity-50"/> 添加焦点</button>)}
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
  const [wealthConfig, setWealthConfig] = useState({ yearlyTarget: 100000, commitment: 2000, showCommitment: true, jars: [] });
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
              } else {
                getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth')).then(v1 => {
                    if(v1.exists()) setWealthBalances(v1.data().balances || {});
                });
              }
              setIsLoaded(true);
          }, () => {}));
          return () => unsubs.forEach(u => u());
      } else { loadLocalStorage(); }
  }, [user]);

  const saveData = (type, data) => { if(user) { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', type), data); } else { localStorage.setItem(`planner_${type}`, JSON.stringify(data)); } };
  
  useEffect(() => { if(isLoaded && tasks.length >= 0) saveData('tasks', { list: tasks }); }, [tasks, isLoaded]);
  useEffect(() => { if(isLoaded && categories.length >= 0) saveData('categories', { list: categories }); }, [categories, isLoaded]);
  useEffect(() => { if(isLoaded && cyclesData.length >= 0) saveData('cycles', { list: cyclesData, startDate: startYearDate }); }, [cyclesData, startYearDate, isLoaded]);
  useEffect(() => { if(isLoaded && Object.keys(wealthBalances).length >= 0) saveData('wealth_v2', { balances: wealthBalances, transactions: wealthTransactions, config: wealthConfig }); }, [wealthBalances, wealthTransactions, wealthConfig, isLoaded]);

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

  const catColors = {'工作': 'bg-blue-100 text-blue-600', '生活': 'bg-emerald-100 text-emerald-600', '健康': 'bg-orange-100 text-orange-600', '学习': 'bg-violet-100 text-violet-600', 'default': 'bg-slate-100 text-slate-600'};

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 shadow-2xl md:shadow-none transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-10 tracking-tight"><div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200"><Layout size={20} /></div>Planner<span className="text-violet-600">.AI</span></div>
          <nav className="space-y-1.5">{[{ id: 'focus', label: '仪表盘', icon: Home }, { id: 'wealth', label: '存钱罐', icon: Database }, { id: 'calendar', label: '日历', icon: CalIcon }, { id: 'kanban', label: '焦点轴', icon: Trello }, { id: 'cycle', label: '36x10 周期追踪', icon: Activity }].map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm tracking-wide ${view === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><item.icon size={18} className={view === item.id ? "text-violet-300" : ""}/>{item.label}</button>
            ))}</nav>
        </div>
        <div className="mt-auto p-8">{user ? (<div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-900 truncate">{user.email ? user.email.split('@')[0] : '指挥官'}</div><button onClick={() => signOut(auth)} className="text-[10px] text-red-500 hover:underline">注销</button></div></div>) : 
            (<button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800"><LogIn size={14} /> 登录</button>)}</div>
      </aside>
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-slate-50">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 z-30"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={24} /></button><span className="font-black text-slate-800 tracking-widest text-sm uppercase">{view}</span><button onClick={() => openAddModal()} className="text-violet-600 p-2"><Plus size={24} /></button></header>
        <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar md:pb-10 relative">
          {view === 'focus' && <DashboardView tasks={tasks} onAddTask={addTask} user={user} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={catColors} />}
          {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances} wealthConfig={wealthConfig} setWealthConfig={setWealthConfig} transactions={wealthTransactions} setTransactions={setWealthTransactions}/>}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} />}
          {view === 'kanban' && <KanbanView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={catColors} />}
          {view === 'cycle' && <CycleTrackerView data={cyclesData} setData={setCyclesData} startYearDate={startYearDate} setStartYearDate={setStartYearDate}/>}
        </div>
      </main>
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={selectedDateForAdd} defaultTime={selectedTimeForAdd} categories={categories} setCategories={setCategories}/>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }.animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }`}</style>
    </div>
  );
}
