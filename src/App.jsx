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

// --- Sub-Components (Helpers) ---

const getIconForLabel = (label) => {
    const l = label ? label.toLowerCase() : '';
    if(l.includes('save') || l.includes('储蓄')) return <Shield size={24}/>;
    if(l.includes('invest') || l.includes('投资')) return <TrendingUp size={24}/>;
    if(l.includes('edu') || l.includes('教育')) return <Book size={24}/>;
    if(l.includes('emer') || l.includes('紧急')) return <AlertTriangle size={24}/>;
    if(l.includes('play') || l.includes('娱乐')) return <Heart size={24}/>;
    return <Layers size={24}/>;
};

const HorizontalBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center py-10 text-slate-500 text-lg italic font-medium">暂无统计数据</div>;
  const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <div className="w-full space-y-7">
      {data.map((item, index) => {
        const percentage = (Math.abs(item.value) / maxVal) * 100;
        const isExpense = item.value < 0;
        return (
          <div key={index} className="space-y-2.5">
            <div className="flex justify-between items-center text-sm font-black text-slate-950 uppercase tracking-wider">
              <span>{item.name}</span>
              <span className={isExpense ? 'text-rose-600' : 'text-emerald-600'}>
                {isExpense ? '-' : '+'} RM {Math.abs(item.value).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-5 rounded-full overflow-hidden flex shadow-inner border border-slate-100">
              <div 
                className={`h-full transition-all duration-1000 ${isExpense ? 'bg-rose-500' : 'bg-emerald-500'}`}
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
  const getCategoryStyle = (cat) => categoryColors[cat] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <div className={`bg-white p-5 rounded-3xl border transition-all group relative mb-4 ${showWarning ? 'border-amber-400 shadow-xl shadow-amber-50' : 'border-slate-200 shadow-sm hover:border-violet-300'}`}>
      <div className="flex items-start gap-5">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${
            task.completed 
              ? 'bg-[#A020F0] border-[#A020F0] text-white shadow-lg shadow-purple-200' 
              : 'border-slate-300 hover:border-[#A020F0] text-transparent'
          }`}
        >
          <CheckSquare size={18} fill={task.completed ? "currentColor" : "none"} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
             <p className={`text-lg font-black truncate transition-colors leading-snug ${task.completed ? 'text-slate-400 line-through' : 'text-slate-950'}`}>
                {task.title}
             </p>
             {showWarning && <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 animate-pulse" title="时间冲突" />}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border-2 ${getCategoryStyle(task.category)}`}>
              {task.category}
            </span>
            {task.time && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-black bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <Clock size={12} /> {task.time}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all absolute top-4 right-4"
        >
          <Trash2 size={20} />
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
    }
    onAdd({ title, category: finalCategory, time, date: defaultDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-2xl font-black text-slate-950 flex items-center gap-3">
            <Zap size={24} className="text-violet-600" fill="currentColor"/> 新增任务
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2"><X size={28}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">任务描述</label>
            <input 
              ref={inputRef}
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-lg font-bold focus:border-violet-500 outline-none transition-all"
              placeholder="需要执行什么内容？"
            />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">任务分类</label>
              <div className="flex gap-2">
                 {isCustomCategory ? (
                   <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="新分类"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-violet-500"
                        autoFocus
                      />
                      <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><X size={20}/></button>
                   </div>
                 ) : (
                    <div className="flex gap-2 w-full">
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-violet-500 appearance-none cursor-pointer"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button type="button" onClick={() => { setIsCustomCategory(true); setCategory(''); }} className="p-4 bg-slate-100 hover:bg-violet-100 text-violet-600 rounded-2xl transition-all"><Plus size={24}/></button>
                    </div>
                 )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">执行时间</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-950 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl text-xl tracking-widest mt-4">确认发布</button>
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
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden p-12 border border-white/50 relative">
          <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2"><X size={32}/></button>
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white mb-8 shadow-2xl shadow-violet-200">
               <User size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-950">{isLogin ? '欢迎回来' : '开启未来'}</h2>
            <p className="text-slate-500 text-base font-bold mt-2">云端实时同步您的所有数据</p>
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl mb-6 text-center font-black border border-red-100">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-6">
            <input type="email" placeholder="电子邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 text-lg font-bold outline-none focus:border-violet-500" required />
            <input type="password" placeholder="通行密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-5 text-lg font-bold outline-none focus:border-violet-500" required />
            <button type="submit" disabled={loading} className="w-full bg-slate-950 text-white font-black py-5 rounded-[1.5rem] hover:bg-black transition-all disabled:opacity-50 text-xl shadow-xl">
              {loading ? '处理中...' : (isLogin ? '立即登录' : '创建账户')}
            </button>
          </form>
          <div className="mt-10 text-center text-sm text-slate-500 font-bold">
             {isLogin ? "还没有加入我们？ " : "已经是成员？ "}
             <button onClick={() => setIsLogin(!isLogin)} className="text-violet-600 font-black hover:underline">{isLogin ? '注册新账号' : '立即登录'}</button>
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
            let eventName = aiInput.replace(timeRegex, '').replace(/tomorrow|today|明天|今天|arrive|start|at|by/gi, '').trim() || "活动";
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
            tasksToAdd.push({ id: generateId(), title: `📍 锚点活动: ${eventName}`, time: anchorTimeStr, category: '工作', date: targetDate });
            const travelHour = anchorHour - 1;
            const travelTimeStr = fmt(travelHour, anchorMin);
            tasksToAdd.push({ id: generateId(), title: `🚗 前往目的地 (交通缓冲)`, time: travelTimeStr, category: '生活', date: targetDate });
            const prepTimeStr = fmt(travelHour, anchorMin - 45);
            tasksToAdd.push({ id: generateId(), title: `🚿 洗漱与着装准备`, time: prepTimeStr, category: '生活', date: targetDate });
            const wakeTimeStr = fmt(travelHour, anchorMin - 45 - 15);
            tasksToAdd.push({ id: generateId(), title: `☀️ 起床洗漱`, time: wakeTimeStr, category: '健康', date: targetDate });
            tasksToAdd.push({ id: generateId(), title: `🌙 晚间复盘与日记`, time: "22:00", category: '健康', date: targetDate });
            if (anchorHour >= 12) tasksToAdd.push({ id: generateId(), title: `🧠 深度工作: 核心项目`, time: "09:00", category: '工作', date: targetDate });
            const isLunchBusy = (anchorHour === 12) || (travelHour === 12);
            if (!isLunchBusy) tasksToAdd.push({ id: generateId(), title: `🍱 午餐休息`, time: "12:30", category: '生活', date: targetDate });
            if (anchorHour < 12) {
                tasksToAdd.push({ id: generateId(), title: `💼 杂务处理与邮件`, time: "14:00", category: '工作', date: targetDate });
                tasksToAdd.push({ id: generateId(), title: `💪 健身训练 / 运动`, time: "17:00", category: '健康', date: targetDate });
            } else if (anchorHour < 16) {
                tasksToAdd.push({ id: generateId(), title: `💪 健身训练 / 运动`, time: "17:30", category: '健康', date: targetDate });
            }
            tasksToAdd.forEach(t => onAddTask(t));
            const responseText = `先生，我已经为您编排了 ${eventName} 的全天行程。起床设定在 ${wakeTimeStr}，建议 ${travelTimeStr} 出发以避开路上的拥堵。`;
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
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-24">
        <header>
            <h2 className="text-5xl font-black text-slate-950 tracking-tight">仪表盘</h2>
            <p className="text-slate-600 font-bold text-xl mt-2">欢迎回来, <span className="text-violet-600">{displayName}</span></p>
        </header>
        <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-start gap-8 relative z-10">
                <div className="bg-cyan-900/50 p-5 rounded-[2rem] border-2 border-cyan-500/30 shadow-inner"><Bot className="text-cyan-400" size={48}/></div>
                <div className="flex-1">
                    <h3 className="font-black text-3xl font-mono tracking-wide text-cyan-50">J.A.R.V.I.S. 协议</h3>
                    <p className="text-slate-400 text-base font-bold mb-8">顶尖生活编排系统 | 全局物流调度优化</p>
                    {jarvisResponse && (
                        <div className="bg-cyan-950/50 border-2 border-cyan-500/30 p-6 rounded-3xl mb-8 text-cyan-100 text-lg font-mono animate-fade-in leading-relaxed shadow-inner">
                            <span className="text-cyan-400 mr-2 font-black">JARVIS:</span> {jarvisResponse}
                        </div>
                    )}
                    <form onSubmit={handleJarvisPlan} className="flex gap-4">
                        <input type="text" value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder='例如: "明天 9:30am 活动 at KLCC"' className="flex-1 bg-slate-900 border-2 border-slate-800 rounded-[1.5rem] px-7 py-5 text-white outline-none focus:border-cyan-500 transition-all font-bold text-lg shadow-inner" />
                        <button type="submit" disabled={isProcessing} className="bg-cyan-600 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-cyan-500 transition-all disabled:opacity-50 min-w-[160px] text-xl shadow-lg flex items-center justify-center">
                            {isProcessing ? <Activity className="animate-spin" size={28}/> : '执 行'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm p-10 min-h-[600px]">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black text-slate-950 flex items-center gap-4"><Target className="text-rose-600" size={36}/> 今日核心任务</h3>
                    <button onClick={() => openAddModal(todayStr)} className="bg-slate-950 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-black transition-all shadow-xl"><Plus size={24}/></button>
                </div>
                <div className="space-y-5">
                    {todaysTasks.length === 0 ? <div className="text-center text-slate-500 py-32 text-xl font-bold italic">暂无任务安排，设定一个目标开始吧</div> : todaysTasks.map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} categoryColors={categoryColors} />
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-sm p-10">
                <h3 className="text-2xl font-black text-slate-950 flex items-center gap-4 mb-10"><PieChart className="text-blue-600" size={32}/> 效率透视</h3>
                <div className="space-y-8">
                    {Object.entries(catStats).map(([cat, stat]) => (
                        <div key={cat} className="space-y-3">
                            <div className="flex justify-between text-base font-black text-slate-900"><span>{cat}</span><span>{stat.completed} / {stat.total}</span></div>
                            <div className="w-full bg-slate-200 rounded-full h-4 border border-slate-100"><div className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-sm" style={{width: `${(stat.completed/stat.total)*100}%`}}></div></div>
                        </div>
                    ))}
                    {Object.keys(catStats).length === 0 && <p className="text-slate-500 text-lg font-bold italic">等待数据录入...</p>}
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
    const [editingTxId, setEditingTxId] = useState(null);

    const defaultTxCats = ['饮食', '交通', '购物', '订阅', '医疗', '其他'];
    const usedTxCats = Array.from(new Set([...defaultTxCats, ...transactions.map(t => t.category)]));

    const handleAddJar = (e) => {
        e.preventDefault();
        const { label, percent } = newJarForm;
        if (!label || !percent) return;
        const newJar = { id: generateId(), label, percent: parseFloat(percent), color: 'bg-slate-100 text-slate-700' };
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

        newTransactions.unshift({ id: Date.now(), amount: amt, category: '收入', remark: '分配录入', date: getLocalDateString(new Date()), type: 'income' });
        if (wealthConfig.showCommitment && commit > 0) {
            newBalances.commitment = (newBalances.commitment || 0) + commit;
            newTransactions.unshift({ id: Date.now() + 1, amount: -commit, category: '固定开销', remark: '自动结算', date: getLocalDateString(new Date()), type: 'expense' });
        }
        wealthConfig.jars.forEach(jar => {
            const share = netIncome * (jar.percent / 100);
            newBalances[jar.id] = (newBalances[jar.id] || 0) + share;
        });
        setBalances(newBalances);
        setTransactions(newTransactions);
        setIncome('');
    };

    const submitTransaction = (e) => {
        e.preventDefault();
        if(!expenseForm.amount || !expenseForm.category) return;
        let finalAmount = parseFloat(expenseForm.amount);
        if (expenseForm.category !== '收入' && !expenseForm.category.includes('收入')) { 
            finalAmount = -Math.abs(finalAmount); 
        } else { 
            finalAmount = Math.abs(finalAmount); 
        }

        if (editingTxId) {
            const updated = transactions.map(t => t.id === editingTxId ? { ...t, ...expenseForm, amount: finalAmount } : t);
            setTransactions(updated);
            setEditingTxId(null);
        } else {
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
        if (val !== null) { setWealthConfig({ ...wealthConfig, showCommitment: true, commitment: parseFloat(val) || 0 }); }
    };

    const startEditTx = (tx) => {
        setEditingTxId(tx.id);
        setExpenseForm({ amount: Math.abs(tx.amount).toString(), category: tx.category, remark: tx.remark || '', date: tx.date });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteTx = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
        if (editingTxId === id) { setEditingTxId(null); setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) }); }
    };

    const getSavingsTotal = () => {
        let total = 0;
        wealthConfig.jars.forEach(jar => {
            const label = jar.label.toLowerCase();
            // Match keywords Savings, Investment, 储蓄, 投资
            if (label.includes('save') || label.includes('invest') || label.includes('储蓄') || label.includes('投资')) {
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
        <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-24">
            <div className="bg-slate-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] mb-3">年度资产累积 (储蓄+投资)</div>
                        <div className="text-6xl font-black">RM {savingsPlusInvestment.toLocaleString()} <span className="text-slate-600 text-3xl font-bold"> / {wealthConfig.yearlyTarget.toLocaleString()}</span></div>
                    </div>
                    <button onClick={() => { const n = prompt("重设目标金额:", wealthConfig.yearlyTarget); if(n) setWealthConfig({...wealthConfig, yearlyTarget: parseFloat(n)}); }} className="bg-white/10 px-6 py-3 rounded-2xl text-sm font-black hover:bg-white/20 transition-all border border-white/10">编辑目标</button>
                </div>
                <div className="mt-10 w-full bg-white/10 rounded-full h-5 border border-white/5 shadow-inner"><div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.6)]" style={{ width: `${Math.min(100, (savingsPlusInvestment / wealthConfig.yearlyTarget) * 100)}%` }}></div></div>
            </div>
            
            <div className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-sm">
                <h3 className="text-3xl font-black text-slate-950 mb-8 flex items-center gap-4"><DollarSign className="text-emerald-600" size={36}/> 资金智能分配</h3>
                <form onSubmit={handleDistribute} className="flex flex-col md:flex-row gap-8">
                    <input type="number" placeholder="输入本期实收收入 (RM)" value={income} onChange={e=>setIncome(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-3xl px-7 py-5 outline-none focus:border-emerald-500 font-black text-2xl" />
                    {wealthConfig.showCommitment && (
                        <div className="flex items-center gap-4 px-7 py-5 bg-rose-50 rounded-3xl border-2 border-rose-100 text-rose-600 font-black min-w-[260px]">
                            <span className="text-sm uppercase tracking-widest">固定开销:</span> 
                            <input type="number" value={wealthConfig.commitment} onChange={e => setWealthConfig({...wealthConfig, commitment: parseFloat(e.target.value)||0})} className="bg-transparent border-b-2 border-rose-200 outline-none w-full text-right font-black text-2xl" />
                        </div>
                    )}
                    <button type="submit" className="bg-slate-950 text-white px-12 py-5 rounded-[1.5rem] font-black hover:bg-black transition-all text-xl shadow-xl">确认分配</button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wealthConfig.showCommitment ? (
                    <div className="bg-rose-50 border-2 border-rose-100 p-10 rounded-[2.5rem] flex flex-col justify-between h-56 relative group shadow-sm">
                        <div className="flex justify-between items-start"><div className="font-black text-rose-800 text-xl tracking-tight">固定开销</div><Lock size={24} className="text-rose-400"/></div>
                        <div className="text-4xl font-black text-rose-950">RM {(balances.commitment||0).toLocaleString()}</div>
                    </div>
                ) : (
                    <button onClick={restoreCommitment} className="bg-rose-50/50 border-2 border-dashed border-rose-200 p-10 rounded-[2.5rem] flex flex-col items-center justify-center h-56 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all font-black gap-4 text-xl"><RefreshCw size={40}/> 恢复固定开销罐</button>
                )}
                {wealthConfig.jars.map(jar => (
                    <div key={jar.id} className="bg-white border-2 border-slate-100 p-10 rounded-[2.5rem] flex flex-col justify-between h-56 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="flex justify-between items-start">
                            <div><div className="font-black text-slate-950 text-xl tracking-tight">{jar.label}</div><div className="text-sm bg-slate-100 px-3 py-1 rounded-xl inline-block mt-2 font-black text-slate-600">{jar.percent}%</div></div>
                            <div className="p-4 bg-slate-50 rounded-3xl text-slate-500 border border-slate-100 shadow-inner">{getIconForLabel(jar.label)}</div>
                        </div>
                        <div className="text-4xl font-black text-slate-950">RM {(balances[jar.id]||0).toLocaleString()}</div>
                        <button onClick={() => deleteJar(jar.id)} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 p-3 rounded-2xl transition-all border border-transparent hover:border-red-100"><X size={24}/></button>
                    </div>
                ))}
                <button onClick={() => setIsAddJarOpen(true)} className="border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center h-56 text-slate-400 hover:border-violet-400 hover:text-violet-600 transition-all font-black gap-4 text-xl"><Plus size={40}/> 添加存钱罐</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 bg-white rounded-[3rem] border-2 border-slate-100 p-10 shadow-sm h-fit">
                    <h3 className="font-black text-slate-950 text-2xl mb-8 flex items-center gap-4">
                        {editingTxId ? <Edit3 size={28} className="text-amber-500"/> : <DollarSign size={28} className="text-emerald-600"/>}
                        {editingTxId ? '修正交易信息' : '记录一笔收支'}
                    </h3>
                    <form onSubmit={submitTransaction} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">金额 (RM)</label>
                            <input type="number" placeholder="0.00" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-violet-500 font-black text-2xl" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">所属类别</label>
                            <div className="flex gap-2">
                            {!isCustomCat ? (
                                <select 
                                    value={expenseForm.category} 
                                    onChange={e => e.target.value === 'NEW' ? setIsCustomCat(true) : setExpenseForm({...expenseForm, category: e.target.value})}
                                    className="flex-1 p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none font-black text-base cursor-pointer"
                                >
                                    <option value="">选择类别</option>
                                    <option value="收入" className="text-emerald-600 font-black">💰 收入 (加钱)</option>
                                    {usedTxCats.filter(c => c !== '收入').map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="NEW" className="font-black text-violet-600">+ 自定义新分类</option>
                                </select>
                            ) : (
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        placeholder="输入分类名称"
                                        value={expenseForm.category}
                                        onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none font-black"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setIsCustomCat(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2"><X size={24}/></button>
                                </div>
                            )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">备注说明</label>
                            <input type="text" placeholder="记录一下细节..." value={expenseForm.remark} onChange={e=>setExpenseForm({...expenseForm, remark: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">日期</label>
                            <input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm, date: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none font-bold" />
                        </div>
                        <div className="flex gap-4 pt-4">
                            {editingTxId && (
                                <button type="button" onClick={() => {setEditingTxId(null); setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });}} className="flex-1 bg-slate-200 text-slate-700 font-black py-5 rounded-[1.5rem] hover:bg-slate-300 transition-all">取消</button>
                            )}
                            <button type="submit" className={`flex-[2] text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl text-lg ${editingTxId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-950 hover:bg-black'}`}>
                                {editingTxId ? '确认更新' : '录入记录'}
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="lg:col-span-2 bg-white rounded-[3rem] border-2 border-slate-100 p-10 shadow-sm min-h-[600px]">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-3xl font-black text-slate-950 tracking-tight">近期收支明细</h3>
                            <div className="text-base font-black text-slate-500 mt-2 uppercase tracking-widest">当前账户净值变动: <span className={netTransactionTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{netTransactionTotal >= 0 ? '+' : ''} RM {netTransactionTotal.toLocaleString()}</span></div>
                        </div>
                        <button onClick={() => setShowGraph(!showGraph)} className={`px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-3 transition-all ${showGraph ? 'bg-[#A020F0] text-white shadow-2xl shadow-purple-200' : 'bg-slate-100 text-slate-900 border-2 border-slate-200'}`}>
                            {showGraph ? <Layout size={20}/> : <BarChart2 size={20}/>} {showGraph ? '查看清单' : '分类统计图'}
                        </button>
                    </div>

                    {showGraph ? (
                        <div className="py-8">
                            <HorizontalBarChart data={barData} />
                        </div>
                    ) : (
                        <div className="space-y-10 max-h-[700px] overflow-y-auto custom-scrollbar pr-5">
                            {Object.keys(groupedTransactions).length === 0 ? <div className="text-center text-slate-400 py-32 italic text-2xl font-bold">空空如也，开始记账吧</div> : Object.entries(groupedTransactions).map(([date, txs]) => (
                                <div key={date} className="space-y-4">
                                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-3 border-b-2 border-slate-100 mb-4">
                                        <span className="text-sm font-black text-slate-950 uppercase tracking-[0.3em]">{date === getLocalDateString(new Date()) ? '今日流水' : date}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {txs.map(tx => (
                                            <div key={tx.id} className="grid grid-cols-12 items-center p-5 bg-slate-50/50 hover:bg-slate-50 rounded-[2rem] transition-all border-2 border-transparent hover:border-slate-200 group shadow-sm">
                                                <div className="col-span-7">
                                                    <div className="font-black text-slate-950 text-lg flex items-center gap-3">
                                                        <span className="w-3 h-3 rounded-full bg-violet-500 shadow-sm shadow-violet-200"></span>
                                                        {tx.category}
                                                    </div>
                                                    <div className="text-sm text-slate-600 font-bold pl-6 mt-1">{tx.remark || '无备注信息'}</div>
                                                </div>
                                                <div className={`col-span-3 text-right font-black text-xl ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {tx.amount > 0 ? '+' : ''} RM {Math.abs(tx.amount).toFixed(2)}
                                                </div>
                                                <div className="col-span-2 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => startEditTx(tx)} className="p-3 text-slate-400 hover:text-amber-500 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-amber-100" title="修改"><Edit3 size={20}/></button>
                                                    <button onClick={() => deleteTx(tx.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-rose-100" title="移除"><Trash2 size={20}/></button>
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] p-12 w-full max-w-lg shadow-2xl border border-white/50">
                        <h3 className="font-black text-3xl mb-10 text-slate-950 tracking-tight">创建新存钱罐</h3>
                        <form onSubmit={handleAddJar} className="space-y-8">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">罐子标签 (如: 退休基金)</label>
                                <input className="w-full border-2 border-slate-100 rounded-[1.5rem] p-5 outline-none focus:border-violet-500 bg-slate-50 font-black text-lg shadow-inner" value={newJarForm.label} onChange={e => setNewJarForm({...newJarForm, label: e.target.value})} placeholder="输入名称..." autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">自动分配比例 (%)</label>
                                <input type="number" className="w-full border-2 border-slate-100 rounded-[1.5rem] p-5 outline-none focus:border-violet-500 bg-slate-50 font-black text-lg shadow-inner" value={newJarForm.percent} onChange={e => setNewJarForm({...newJarForm, percent: e.target.value})} placeholder="0 - 100" />
                            </div>
                            <div className="flex gap-5 pt-4">
                                <button type="button" onClick={() => setIsAddJarOpen(false)} className="flex-1 py-5 text-slate-500 font-black hover:bg-slate-100 rounded-[1.5rem] transition-all text-lg">取 消</button>
                                <button type="submit" className="flex-1 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl text-xl">确认创建</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Memoized Row for Cycles Tracker to solve IME focus jumping
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
        if (task[field] !== val) { onUpdate(cycleId, task.id, field, val); }
    };

    return (
        <div className="grid grid-cols-12 gap-6 items-center group bg-slate-50/70 p-4 rounded-[2rem] border-2 border-transparent hover:border-violet-200 transition-all hover:shadow-md">
            <div className="col-span-5 flex items-center gap-4">
                <button onClick={() => onUpdate(cycleId, task.id, 'done', !task.done)} className={`w-8 h-8 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.done ? 'bg-[#A020F0] border-[#A020F0] text-white shadow-md shadow-purple-100' : 'bg-white border-slate-300'}`}>
                    <CheckSquare size={20} fill={task.done ? "currentColor" : "none"}/>
                </button>
                <input 
                    type="text" 
                    value={localText} 
                    onChange={e => setLocalText(e.target.value)}
                    onBlur={e => handleBlur('text', e.target.value)}
                    placeholder="任务描述..."
                    className={`flex-1 bg-transparent outline-none text-lg transition-all ${task.done ? 'text-slate-400 line-through' : 'text-slate-950 font-black'}`} 
                />
                <button onClick={() => onDelete(cycleId, task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-2">
                    <Trash2 size={22}/>
                </button>
            </div>
            <div className="col-span-3">
                <input 
                    type="text" 
                    placeholder="执行策略..." 
                    value={localPlan || ''} 
                    onChange={e => setLocalPlan(e.target.value)}
                    onBlur={e => handleBlur('plan', e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-violet-300 transition-all shadow-sm" 
                />
            </div>
            <div className="col-span-4">
                <input 
                    type="text" 
                    placeholder="结果复盘反馈..." 
                    value={localFeedback || ''} 
                    onChange={e => setLocalFeedback(e.target.value)}
                    onBlur={e => handleBlur('feedback', e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-violet-300 transition-all shadow-sm" 
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
            if ((cycle.tasks || []).length >= 5) { alert("Max 5 tasks!"); return cycle; }
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
            <div className="flex justify-between items-end mb-12 sticky top-0 bg-slate-50/95 backdrop-blur-md z-20 py-6 border-b-2 border-slate-200">
                <div>
                    <h2 className="text-5xl font-black text-slate-950 flex items-center gap-6"><Activity className="text-violet-600" size={48} /> 36 x 10 周期追踪</h2>
                    <div className="flex items-center gap-4 mt-5">
                        <div className="bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-4">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">起始坐标</span>
                            <input type="date" value={startYearDate} onChange={e => setStartYearDate(e.target.value)} className="bg-transparent font-black outline-none text-base text-slate-950"/>
                        </div>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="flex justify-between text-sm font-black text-slate-950 mb-3 uppercase tracking-[0.2em]"><span>年度总进度</span><span className="text-violet-600">{progress}%</span></div>
                    <div className="h-5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner border border-slate-100">
                        <div className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 transition-all duration-1000 shadow-lg" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-5">
                <div className="grid grid-cols-12 gap-8 px-8 mb-8 text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                    <div className="col-span-2 text-center">周期 ID / 时间</div>
                    <div className="col-span-5">核心目标任务 (电紫色控制)</div>
                    <div className="col-span-3">执行路线图</div>
                    <div className="col-span-2 text-right">状态记录</div>
                </div>

                <div className="space-y-10">
                    {data.map(cycle => (
                        <div key={cycle.id} className="bg-white border-2 border-slate-100 rounded-[3.5rem] p-10 shadow-sm hover:shadow-xl transition-all">
                            <div className="grid grid-cols-12 gap-10">
                                <div className="col-span-2 flex flex-col items-center justify-center border-r-2 border-slate-50 py-6">
                                    <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center font-black text-3xl mb-3 shadow-inner">{cycle.id}</div>
                                    <div className="text-center text-xs font-black text-slate-500 tracking-wider mb-8">{cycle.dateRange}</div>
                                    <button onClick={() => addTask(cycle.id)} className="p-4 bg-slate-950 text-white rounded-[1.5rem] hover:bg-black transition-all shadow-2xl scale-110"><Plus size={28}/></button>
                                </div>

                                <div className="col-span-10 space-y-5">
                                    {cycle.tasks && cycle.tasks.length > 0 ? (
                                        cycle.tasks.map(task => (
                                            <CycleTaskRow key={task.id} task={task} cycleId={cycle.id} onUpdate={updateTask} onDelete={deleteTask} />
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-lg font-bold py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">本阶段协议未初始化。点击左侧按钮开启。</div>
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
        <div className="flex justify-between items-center mb-10"><h2 className="text-5xl font-black text-slate-950 tracking-tight">日历</h2>
          <div className="flex gap-3 bg-white p-2.5 rounded-3xl border-2 border-slate-100 shadow-sm"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2.5 hover:bg-slate-50 rounded-2xl transition text-slate-400 hover:text-slate-950"><ChevronLeft size={32}/></button><span className="px-8 py-2 font-black text-slate-950 text-lg flex items-center tracking-tight">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2.5 hover:bg-slate-50 rounded-2xl transition text-slate-400 hover:text-slate-950"><ChevronRight size={32}/></button></div>
        </div>
        <div className="bg-white rounded-[3rem] shadow-2xl border-2 border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b-2 border-slate-100 bg-slate-50/50">{['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (<div key={d} className="py-7 text-center text-xs font-black text-slate-500 uppercase tracking-[0.3em]">{d}</div>))}</div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-100/20 gap-[2px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = dateStr === getLocalDateString(new Date());
              return (<div key={i} onClick={() => openAddModal(dateStr)} className="bg-white p-4 hover:bg-violet-50/30 transition-all cursor-pointer group flex flex-col min-h-[140px] border-b border-r border-slate-50">
                  <div className={`text-lg font-black w-10 h-10 flex items-center justify-center rounded-2xl mb-3 ${isToday ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-950'}`}>{day}</div>
                  <div className="space-y-2 overflow-hidden">{dayTasks.slice(0, 3).map(t => (<div key={t.id} className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 truncate text-slate-950 font-black shadow-sm">{t.title}</div>))}{dayTasks.length > 3 && <div className="text-[11px] text-slate-500 pl-2 font-black">+ {dayTasks.length - 3} 更多</div>}</div>
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
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0 bg-white/50 rounded-[3rem] border-2 border-slate-100 shadow-sm">
        <div className="flex justify-between items-center p-10 border-b-2 border-slate-100 bg-white rounded-t-[3rem] sticky top-0 z-10 shadow-sm">
            <div><h2 className="text-4xl font-black text-slate-950 tracking-tight">全天候时间轴</h2><p className="text-slate-600 text-lg font-black mt-2 uppercase tracking-[0.2em]">{currentDate.toLocaleDateString('default', {weekday: 'long', month: 'long', day: 'numeric'})}</p></div>
            <div className="flex items-center gap-4 bg-slate-100 p-2.5 rounded-3xl"><button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate()-1)))} className="p-4 hover:bg-white rounded-2xl transition text-slate-500 hover:text-slate-950 shadow-sm"><ChevronLeft size={24}/></button><button onClick={() => setCurrentDate(new Date())} className="text-base font-black px-7 py-3 bg-white text-violet-600 rounded-2xl shadow-lg border border-violet-100">今日</button><button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate()+1)))} className="p-4 hover:bg-white rounded-2xl transition text-slate-500 hover:text-slate-950 shadow-sm"><ChevronRight size={24}/></button></div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="space-y-6"> 
            {hours.map((hour) => {
              const ampm = hour >= 12 ? 'pm' : 'am'; const hour12 = hour > 12 ? hour - 12 : hour;
              const displayHour = `${hour12}:00 ${ampm.toUpperCase()}`; const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
              const hourTasks = tasks.filter(t => t.date === dateStr && t.time && parseInt(t.time.split(':')[0]) === hour);
              const isCurrentHour = isToday && hour === new Date().getHours();
              return (<div key={hour} className={`flex items-start gap-8 p-8 rounded-[2.5rem] transition-all border-2 ${isCurrentHour ? 'bg-violet-50/50 border-violet-200 ring-8 ring-violet-50' : 'bg-white border-slate-50 hover:border-slate-100 hover:shadow-xl'}`}>
                   <div className="w-28 flex-shrink-0 pt-2 border-r-2 border-slate-100 mr-2"><span className={`text-lg font-black ${isCurrentHour ? 'text-violet-600' : 'text-slate-400'}`}>{displayHour}</span></div>
                   <div className="flex-1 min-h-[100px] flex flex-col justify-center">
                      {hourTasks.length > 0 ? (<div className="space-y-4 w-full">{hourTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} categoryColors={categoryColors} showWarning={hourTasks.length > 1} />))}</div>) : 
                      (<button onClick={() => openAddModal(dateStr, timeLabel)} className="text-left text-slate-300 text-lg font-black hover:text-violet-500 flex items-center gap-5 py-6 w-full h-full group"><Plus size={32} className="opacity-50 group-hover:scale-125 transition-transform"/> 指令部署</button>)}
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
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
      else { await signInAnonymously(auth); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); if(!u) loadLocalStorage(); }); 
    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
      if (user) {
          const unsubs = [];
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tasks'), d => d.exists() && setTasks(d.data().list || [])));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'categories'), d => d.exists() && setCategories(d.data().list || ['工作', '生活', '健康', '学习'])));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'cycles'), d => {
              if(d.exists()) { setCyclesData(d.data().list || []); setStartYearDate(d.data().startDate || new Date().getFullYear() + '-01-01'); } 
              else { setCyclesData(generateInitialCycles(new Date().getFullYear() + '-01-01')); }
          }));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth_v2'), d => {
              if(d.exists()) { 
                const data = d.data(); setWealthBalances(data.balances || {}); setWealthTransactions(data.transactions || []); if(data.config) setWealthConfig(data.config);
              } else {
                getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth')).then(v1 => { if(v1.exists()) setWealthBalances(v1.data().balances || {}); });
              }
              setIsLoaded(true);
          }));
          return () => unsubs.forEach(u => u());
      } else { loadLocalStorage(); }
  }, [user]);

  const saveData = (type, data) => { if(user) { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', type), data); } else { localStorage.setItem(`planner_${type}`, JSON.stringify(data)); } };
  
  useEffect(() => { if(isLoaded) saveData('tasks', { list: tasks }); }, [tasks, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('categories', { list: categories }); }, [categories, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('cycles', { list: cyclesData, startDate: startYearDate }); }, [cyclesData, startYearDate, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('wealth_v2', { balances: wealthBalances, transactions: wealthTransactions, config: wealthConfig }); }, [wealthBalances, wealthTransactions, wealthConfig, isLoaded]);

  const loadLocalStorage = () => {
      try {
          const t = localStorage.getItem('planner_tasks'); if(t) setTasks(JSON.parse(t).list || []);
          const c = localStorage.getItem('planner_categories'); if(c) setCategories(JSON.parse(c).list || []);
          const cy = localStorage.getItem('planner_cycles'); if(cy) { const d = JSON.parse(cy); setCyclesData(d.list || []); setStartYearDate(d.startDate); } 
          else { setCyclesData(generateInitialCycles(new Date().getFullYear() + '-01-01')); }
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
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-950 overflow-hidden antialiased">
      <aside className={`fixed inset-y-0 left-0 z-40 w-96 bg-white border-r-4 border-slate-100 shadow-2xl md:shadow-none transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-12">
          <div className="flex items-center gap-5 text-slate-950 font-black text-4xl mb-16 tracking-tighter"><div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-violet-200"><Layout size={32} /></div>Planner<span className="text-violet-600">.AI</span></div>
          <nav className="space-y-3">{[{ id: 'focus', label: '指挥中心', icon: Home }, { id: 'wealth', label: '资产调度', icon: Database }, { id: 'calendar', label: '星历坐标', icon: CalIcon }, { id: 'kanban', label: '时间轴线', icon: Trello }, { id: 'cycle', label: '周期演化', icon: Activity }].map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-5 px-7 py-5 rounded-3xl transition-all font-black text-lg tracking-tight ${view === item.id ? 'bg-slate-950 text-white shadow-2xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}><item.icon size={26} className={view === item.id ? "text-violet-400" : ""}/>{item.label}</button>
            ))}</nav>
        </div>
        <div className="mt-auto p-12">{user ? (<div className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-inner"><div className="w-14 h-14 bg-violet-600 text-white rounded-full flex items-center justify-center font-black text-2xl shadow-lg">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div className="flex-1 min-w-0"><div className="text-base font-black text-slate-950 truncate">{user.email ? user.email.split('@')[0] : '匿名特工'}</div><button onClick={() => signOut(auth)} className="text-sm font-black text-red-500 hover:underline">注销连接</button></div></div>) : 
            (<button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-4 bg-slate-950 text-white py-5 rounded-3xl font-black text-lg hover:bg-black shadow-2xl"><LogIn size={24} /> 建立连接</button>)}</div>
      </aside>
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-slate-50">
        <header className="md:hidden flex items-center justify-between p-8 bg-white border-b-4 border-slate-100 z-30"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={36} /></button><span className="font-black text-slate-950 tracking-widest text-xl uppercase">{view}</span><button onClick={() => openAddModal()} className="text-violet-600 p-2"><Plus size={36} /></button></header>
        <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar relative">
          {view === 'focus' && <DashboardView tasks={tasks} onAddTask={addTask} user={user} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={{'工作': 'bg-blue-100 text-blue-700 border-blue-200', '生活': 'bg-emerald-100 text-emerald-700 border-emerald-200', '健康': 'bg-orange-100 text-orange-700 border-orange-200', '学习': 'bg-violet-100 text-violet-700 border-violet-200'}} />}
          {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances} wealthConfig={wealthConfig} setWealthConfig={setWealthConfig} transactions={wealthTransactions} setTransactions={setWealthTransactions}/>}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} />}
          {view === 'kanban' && <KanbanView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={{'工作': 'bg-blue-100 text-blue-700 border-blue-200', '生活': 'bg-emerald-100 text-emerald-700 border-emerald-200', '健康': 'bg-orange-100 text-orange-700 border-orange-200', '学习': 'bg-violet-100 text-violet-700 border-violet-200'}} />}
          {view === 'cycle' && <CycleTrackerView data={cyclesData} setData={setCyclesData} startYearDate={startYearDate} setStartYearDate={setStartYearDate}/>}
        </div>
      </main>
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={selectedDateForAdd} defaultTime={selectedTimeForAdd} categories={categories} setCategories={setCategories}/>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; border: 3px solid #f8fafc; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }`}</style>
    </div>
  );
}
