import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalIcon, Layout, Trello, CheckSquare, 
  Plus, Clock, ChevronLeft, ChevronRight, X, Bell, 
  Search, Target, TrendingUp, ArrowRight, Lock, Trash2,
  Menu, Home, Sun, Moon, MoreHorizontal, Database, 
  Zap, Download, Activity, Layers, Shield, BookOpen, 
  DollarSign, PieChart, Square, LogIn, LogOut, User,
  List, FileText
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

/**
 * --- Modern Future Planner ---
 * Style: Clean Tech / Future Minimalist (Light Mode)
 * Updates:
 * 1. Strategy: 10px rounded corners, larger containers.
 * 2. 36x10: Aligned Date Range column, Enter to add task, aligned textareas.
 * 3. Wealth Jar: Deduct commitment first, then split 30/30/20/20.
 */

// --- Firebase Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Utility: Get Local Date String (Fixes Timezone Issues) ---
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Sub-Components (Defined Outside App) ---

const TaskCard = ({ task, onToggle, onDelete, categoryColors }) => {
  const getCategoryStyle = (cat) => {
    return categoryColors[cat] || 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group relative mb-3">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onToggle(task.id)}
          className={`w-5 h-5 flex-shrink-0 rounded-lg border flex items-center justify-center transition-all duration-300 ${
            task.completed 
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white shadow-lg shadow-violet-200' 
              : 'border-slate-300 hover:border-violet-500 text-transparent'
          }`}
        >
          <CheckSquare size={14} fill={task.completed ? "currentColor" : "none"} />
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold tracking-wide truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${getCategoryStyle(task.category)}`}>
              {task.category}
            </span>
            {task.time && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock size={10} /> {task.time}
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
          title="Delete Task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('工作');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [time, setTime] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTime('');
      setCategory('工作');
      setIsCustomCategory(false);
      if(inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, category: category.trim() || '未分类', time, date: defaultDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 transition-transform border border-white/50">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Zap size={16} className="text-violet-500" fill="currentColor"/> 新建任务
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">内容</label>
            <input 
              ref={inputRef}
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all placeholder-slate-400 font-medium"
              placeholder="输入任务..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">分类</label>
              <div className="flex gap-2">
                 {isCustomCategory ? (
                   <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="输入类别名"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500 transition-colors font-medium text-slate-700"
                        autoFocus
                      />
                      <button 
                        type="button" 
                        onClick={() => { setIsCustomCategory(false); setCategory('工作'); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14}/>
                      </button>
                   </div>
                 ) : (
                    <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500 transition-colors font-medium text-slate-700 appearance-none"
                    >
                        <option>工作</option>
                        <option>生活</option>
                        <option>健康</option>
                        <option>学习</option>
                    </select>
                 )}
                 {!isCustomCategory && (
                   <button 
                    type="button"
                    onClick={() => { setIsCustomCategory(true); setCategory(''); }}
                    className="p-3 bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-600 rounded-xl transition-colors"
                    title="新建类别"
                   >
                     <Plus size={18}/>
                   </button>
                 )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">时间 (选填)</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500 transition-colors font-medium text-slate-700"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-200 active:scale-[0.98]">
            确认添加
          </button>
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
            <p className="text-slate-500 text-sm mt-1">Sync your planner data across devices</p>
          </div>
  
          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-bold">{error}</div>}
  
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
               <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500 transition-colors font-medium"
                  required
               />
            </div>
            <div>
               <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-violet-500 transition-colors font-medium"
                  required
               />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
  
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
             {isLogin ? "Don't have an account? " : "Already have an account? "}
             <button onClick={() => setIsLogin(!isLogin)} className="text-violet-600 font-bold hover:underline">
               {isLogin ? 'Sign Up' : 'Log In'}
             </button>
          </div>
        </div>
      </div>
    );
};

const WealthJarView = ({ balances, setBalances }) => {
    // Config only for the distributable jars
    const JARS_CONFIG = [
      { id: 'savings', label: 'Savings 储蓄', percent: 30, icon: Shield, color: 'text-violet-500', bg: 'bg-violet-50' },
      { id: 'investment', label: 'Investment 投资', percent: 30, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
      { id: 'education', label: 'Education 学习', percent: 20, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50' },
      { id: 'emergency', label: 'Emergency 应急', percent: 20, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ];
    
    const [inputAmount, setInputAmount] = useState('');
    const [commitmentAmount, setCommitmentAmount] = useState('');
    const targetAmount = 100000;
  
    const handleDistribute = (e) => {
      e.preventDefault();
      const income = parseFloat(inputAmount);
      const commit = parseFloat(commitmentAmount) || 0;
      
      if (isNaN(income) || income <= 0) return;
  
      const netIncome = Math.max(0, income - commit);
      const newBalances = { ...balances };

      // Add commitment directly to commitment jar
      newBalances.commitment = (newBalances.commitment || 0) + commit;

      // Distribute remainder
      JARS_CONFIG.forEach(jar => {
        newBalances[jar.id] += netIncome * (jar.percent / 100);
      });
  
      setBalances(newBalances);
      setInputAmount('');
      setCommitmentAmount('');
    };
  
    const handleReset = () => {
      if(confirm("确定要重置所有金额为 0 吗？")) {
          setBalances({ commitment: 0, savings: 0, investment: 0, education: 0, emergency: 0 });
      }
    }
  
    const currentSavings = balances.savings + balances.investment;
    const progressPercent = Math.min(100, (currentSavings / targetAmount) * 100);
    const progressValue = Math.round((currentSavings / targetAmount) * 100);
  
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
        <div className="flex justify-between items-end">
          <div>
             <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
               <Database className="text-violet-600" /> 
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">Wealth Jars</span>
             </h2>
             <p className="text-slate-500 mt-1 font-medium">智能财务分配系统</p>
          </div>
          <button onClick={handleReset} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium px-3 py-1 rounded-full hover:bg-slate-100">重置系统</button>
        </div>
  
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-100 border border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-100/50 to-blue-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           <form onSubmit={handleDistribute} className="flex flex-col gap-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">总收入 (RM)</label>
                    <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                        <input 
                        type="number" 
                        value={inputAmount}
                        onChange={e => setInputAmount(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-slate-800 focus:border-violet-500 outline-none transition-all placeholder-slate-300"
                        placeholder="0.00"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Commitment (扣除项)</label>
                    <div className="relative group">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={20} />
                        <input 
                        type="number" 
                        value={commitmentAmount}
                        onChange={e => setCommitmentAmount(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-2xl font-bold text-rose-600 focus:border-rose-500 outline-none transition-all placeholder-slate-300"
                        placeholder="0.00"
                        />
                    </div>
                </div>
              </div>
              <button onClick={handleDistribute} className="w-full px-10 py-5 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <Zap size={20} className="fill-white"/> 确认分配
              </button>
           </form>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Manual Commitment Jar Display */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[180px]">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl bg-rose-50 text-rose-500`}>
                         <Layers size={22} />
                      </div>
                      <div>
                         <div className="text-sm font-bold text-slate-700">Commitment 开销</div>
                         <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1 inline-block">Fixed</div>
                      </div>
                  </div>
               </div>
               <div>
                  <div className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Current Balance</div>
                  <div className="text-2xl font-black text-slate-800 tracking-tight">
                      <span className="text-sm text-slate-400 mr-1 font-normal">RM</span>
                      {balances.commitment ? balances.commitment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </div>
               </div>
            </div>

            {/* Configured Jars */}
            {JARS_CONFIG.map(jar => (
                <div key={jar.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[180px]">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${jar.bg} ${jar.color}`}>
                            <jar.icon size={22} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-700">{jar.label}</div>
                            <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1 inline-block">{jar.percent}%</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Current Balance</div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">
                        <span className="text-sm text-slate-400 mr-1 font-normal">RM</span>
                        {balances[jar.id].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                </div>
            ))}
        </div>
  
        <div className="bg-white border border-violet-100 rounded-3xl p-8 shadow-xl shadow-violet-50 relative overflow-hidden">
           <div className="flex justify-between items-end mb-4 relative z-10">
              <div>
                 <h3 className="text-violet-600 font-bold text-sm tracking-widest uppercase mb-1 flex items-center gap-2">
                    <Target size={16}/> Yearly Savings Target
                 </h3>
                 <p className="text-xs text-slate-400 font-medium">(Savings + Investment Only)</p>
              </div>
              <div className="text-right">
                 <div className="text-3xl font-black text-slate-800 tracking-tight">
                    RM {currentSavings.toLocaleString()} <span className="text-slate-300 text-xl font-medium">/ {targetAmount.toLocaleString()}</span>
                 </div>
              </div>
           </div>
  
           <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-900 relative transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(76,29,149,0.5)] flex items-center justify-end pr-2"
              >
                 <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                 {progressPercent > 5 && <span className="text-[10px] text-white font-bold relative z-10">{progressValue}%</span>}
              </div>
              {progressPercent <= 5 && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">{progressValue}%</span>}
           </div>
           
           <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
              <span>0%</span>
              <span className={progressPercent >= 100 ? "text-violet-600" : ""}>{progressPercent >= 100 ? 'GOAL ACHIEVED' : 'IN PROGRESS'}</span>
              <span>100%</span>
           </div>
        </div>
      </div>
    );
};

const CycleTrackerView = ({ data, setData, startYearDate, setStartYearDate }) => {
    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    const [stats, setStats] = useState({ total: 0, completed: 0, percent: 0 });
    useEffect(() => {
        let totalTasks = 0;
        let completedTasks = 0;
        data.forEach(cycle => {
            cycle.tasks.forEach(task => {
                if (task.text.trim() !== '') {
                    totalTasks++;
                    if (task.done) completedTasks++;
                }
            });
        });
        const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        setStats({ total: totalTasks, completed: completedTasks, percent });
    }, [data]);

    const handleDateChange = (e) => {
      const newDate = e.target.value;
      setStartYearDate(newDate);
    };
  
    const handleTaskTextChange = (cycleId, taskId, newText) => {
      setData(prev => prev.map(cycle => 
        cycle.id === cycleId ? { ...cycle, tasks: cycle.tasks.map(t => t.id === taskId ? { ...t, text: newText } : t) } : cycle
      ));
    };
  
    const toggleTask = (cycleId, taskId) => {
      setData(prev => prev.map(cycle => 
        cycle.id === cycleId ? { ...cycle, tasks: cycle.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t) } : cycle
      ));
    };
  
    const addTask = (cycleId) => {
      setData(prev => prev.map(cycle => 
        cycle.id === cycleId ? { ...cycle, tasks: [...cycle.tasks, { id: generateId(), text: '', done: false }] } : cycle
      ));
    };

    // Add task on Enter key
    const handleTaskKeyDown = (e, cycleId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask(cycleId);
        }
    };
  
    const deleteTask = (cycleId, taskId) => {
      setData(prev => prev.map(cycle => {
        if (cycle.id !== cycleId) return cycle;
        if (cycle.tasks.length <= 1) {
            return { ...cycle, tasks: cycle.tasks.map(t => t.id === taskId ? {...t, text: '', done: false} : t) };
        }
        return { ...cycle, tasks: cycle.tasks.filter(t => t.id !== taskId) };
      }));
    };
  
    const handleFieldChange = (cycleId, field, value) => {
      setData(prev => prev.map(cycle => cycle.id === cycleId ? { ...cycle, [field]: value } : cycle));
    };
  
    const exportToExcel = () => {
        let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr><th>周期</th><th>日期范围</th><th>任务清单</th><th>Action Plan</th><th>Review & Feedback</th></tr></thead><tbody>`;
        data.forEach(row => {
            const taskList = row.tasks.filter(t => t.text.trim()).map(t => `[${t.done ? '√' : ' '}] ${t.text}`).join("<br>"); 
            htmlContent += `<tr><td>${row.id}</td><td>${row.dateRange}</td><td>${taskList}</td><td>${row.actionPlan || ''}</td><td>${row.notes}</td></tr>`;
        });
        htmlContent += `</tbody></table></body></html>`;
        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `36x10_Plan_${startYearDate}.xls`;
        link.click();
    };

    return (
        <div className="h-full flex flex-col animate-fade-in pb-20">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 sticky top-0 bg-slate-50/95 backdrop-blur z-20 py-2 border-b border-slate-200/50">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Activity className="text-violet-600" /> 
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600">36 x 10 Cycles</span>
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-medium">
                        <span className="text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-md">{stats.completed} / {stats.total} Tasks Completed</span>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                            <span>Start:</span>
                            <input 
                                type="date" 
                                value={startYearDate} 
                                onChange={handleDateChange}
                                className="bg-transparent text-slate-700 outline-none w-[110px] font-bold cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm text-slate-400">
                             <span>Today:</span>
                             <span className="font-bold text-slate-700">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={exportToExcel} 
                    className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
                >
                    <Download size={16} /> Export .xls
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2"><TrendingUp size={12}/> Year Progress</span>
                    <span className="text-xl font-black text-violet-600">{stats.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.3)]" style={{ width: `${stats.percent}%` }}></div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white border border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm mb-4">
                    <div className="col-span-1 text-center">Cycle</div>
                    <div className="col-span-1 text-center">Date Range</div>
                    <div className="col-span-5">Task Protocol</div>
                    <div className="col-span-2">Action Plan</div>
                    <div className="col-span-3">Review & Feedback</div>
                </div>

                {data.map((row) => (
                    <div key={row.id} className="bg-white border border-slate-100 rounded-2xl p-5 md:grid md:grid-cols-12 md:gap-4 md:items-start hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-[1px] transition-all group duration-300">
                         {/* Cycle ID - Col 1 */}
                         <div className="col-span-1 flex items-start justify-center pt-2">
                             <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50 text-violet-600 font-bold text-sm shadow-sm">
                                {row.id}
                             </span>
                         </div>

                         {/* Date Range - Col 1 - Aligned with Header */}
                         <div className="col-span-1 flex items-start justify-center pt-2.5">
                            <span className="text-slate-500 text-[11px] font-bold text-center leading-tight">
                                {row.dateRange}
                            </span>
                         </div>

                         {/* Tasks - Col 5 */}
                         <div className="col-span-5 space-y-3 mb-5 md:mb-0">
                            {row.tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-3 group/task">
                                    <button onClick={() => toggleTask(row.id, task.id)} className="flex-shrink-0 transition-transform active:scale-90">
                                        {task.done ? (
                                            <CheckSquare className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-300 hover:text-violet-400 transition-colors" />
                                        )}
                                    </button>
                                    <input 
                                        type="text"
                                        value={task.text}
                                        onChange={(e) => handleTaskTextChange(row.id, task.id, e.target.value)}
                                        onKeyDown={(e) => handleTaskKeyDown(e, row.id)}
                                        placeholder="Add task..."
                                        className={`flex-1 bg-transparent border-b border-transparent hover:border-slate-100 focus:border-violet-300 outline-none text-sm py-1 transition-all font-medium ${task.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                    />
                                    <button onClick={() => deleteTask(row.id, task.id)} className="opacity-0 group-hover/task:opacity-100 text-slate-300 hover:text-red-400 transition-opacity"><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={() => addTask(row.id)} className="text-[11px] text-violet-500 hover:text-violet-700 flex items-center gap-1 font-bold mt-2 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors w-max"><Plus size={12}/> ADD ITEM</button>
                         </div>
                         
                         {/* Action Plan - Col 2 */}
                         <div className="col-span-2 pt-1">
                             <span className="md:hidden text-xs text-slate-400 font-bold block mb-1">Action Plan:</span>
                             <textarea 
                                rows="3"
                                placeholder="Plan..."
                                value={row.actionPlan || ''}
                                onChange={(e) => handleFieldChange(row.id, 'actionPlan', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 focus:border-violet-400 focus:bg-white outline-none resize-none transition-all placeholder-slate-400"
                             />
                         </div>

                         {/* Feedback - Col 3 */}
                         <div className="col-span-3 pt-1">
                             <span className="md:hidden text-xs text-slate-400 font-bold block mb-1">Review & Feedback:</span>
                             <textarea 
                                rows="3"
                                placeholder="Feedback..."
                                value={row.notes}
                                onChange={(e) => handleFieldChange(row.id, 'notes', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 focus:border-violet-400 focus:bg-white outline-none resize-none transition-all placeholder-slate-400"
                             />
                         </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

const FocusView = ({ tasks, user, annualGoals, openAddModal, toggleTask, deleteTask, categoryColors }) => {
    // Replaced toISOString with getLocalDateString to fix timezone offset (UTC vs Local)
    const todayStr = getLocalDateString(new Date());
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const pendingCount = todaysTasks.filter(t => !t.completed).length;
    const hour = new Date().getHours();
    let greeting = hour >= 18 ? "Good Evening" : hour >= 12 ? "Good Afternoon" : "Good Morning";

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 md:pb-0">
        <header className="flex justify-between items-end pb-4 border-b border-slate-100 md:border-none md:pb-0">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">{greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">{user ? (user.email.split('@')[0]) : 'Guest'}</span></h2>
            <p className="text-slate-500 font-medium text-lg">
              You have <span className="text-violet-600 font-bold">{pendingCount}</span> pending tasks today.
            </p>
          </div>
          <div className="hidden md:block text-right">
             <div className="text-5xl font-black text-slate-200">{new Date().getDate()}</div>
             <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'long', weekday: 'short' })}</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden flex flex-col min-h-[450px] relative transition-all hover:shadow-2xl hover:shadow-slate-200/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-100/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-sm relative z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg">
                <Target className="text-violet-500" size={24} /> Today's Focus
              </h3>
              <button 
                onClick={() => openAddModal(todayStr)}
                className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-violet-600 hover:scale-110 transition-all shadow-lg shadow-slate-200"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="p-8 flex-1 bg-white/50 relative z-10">
              {todaysTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                    <Layout size={32} className="text-slate-300" />
                  </div>
                  <p className="font-medium">No tasks yet. Stay focused.</p>
                  <button onClick={() => openAddModal(todayStr)} className="text-violet-600 font-bold hover:underline text-sm">Create New Task</button>
                </div>
              ) : (
                <div className="space-y-1">
                  {todaysTasks.map(task => (
                    <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} categoryColors={categoryColors} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-violet-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="relative z-10">
                  <div className="text-violet-100 text-xs font-bold uppercase mb-3 tracking-widest">Efficiency</div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tight">
                      {todaysTasks.length ? Math.round(((todaysTasks.length - pendingCount) / todaysTasks.length) * 100) : 0}
                    </span>
                    <span className="text-xl font-medium mb-2 opacity-80">%</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-1.5 mt-6 overflow-hidden">
                    <div 
                      style={{ width: `${todaysTasks.length ? Math.round(((todaysTasks.length - pendingCount) / todaysTasks.length) * 100) : 0}%` }} 
                      className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-100/50 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
                    <Target size={20} />
                  </div>
                  <div className="text-sm font-bold text-slate-700 uppercase tracking-wide">Objectives</div>
                </div>
                <div className="space-y-4">
                  {annualGoals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="text-sm text-slate-600 flex items-start gap-3 group">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 transition-colors ${goal.completed ? 'bg-emerald-400' : 'bg-slate-200 group-hover:bg-violet-400'}`}></div>
                      <span className={`font-medium transition-colors ${goal.completed ? 'line-through opacity-50' : 'group-hover:text-slate-800'}`}>{goal.text}</span>
                    </div>
                  ))}
                  {annualGoals.length === 0 && <div className="text-xs text-slate-400 italic">No objectives set.</div>}
                </div>
              </div>
          </div>
        </div>
      </div>
    );
};

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];

    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Calendar</h2>
            <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-wide">{year} • {new Date(year, month).toLocaleString('default', { month: 'long' })}</p>
          </div>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition">TODAY</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 flex-1 flex flex-col overflow-hidden min-h-[500px]">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-50 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              // Manually construct local date string to match Task storage format
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = dateStr === getLocalDateString(new Date());

              return (
                <div key={i} onClick={() => openAddModal(dateStr)} className="bg-white p-3 hover:bg-violet-50/30 transition-colors cursor-pointer group relative flex flex-col min-h-[80px]">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isToday ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 scale-110' : 'text-slate-700 group-hover:bg-slate-100'}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1.5 overflow-hidden">
                    {dayTasks.slice(0, 3).map(t => (
                        <div key={t.id} className={`text-[10px] px-2 py-1 rounded-md truncate font-medium flex items-center gap-1.5 border ${t.completed ? 'bg-slate-50 text-slate-400 border-transparent line-through' : 'bg-white border-violet-100 text-slate-600 shadow-sm'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-slate-300' : 'bg-violet-500'}`}></div>
                             {t.title}
                        </div>
                    ))}
                    {dayTasks.length > 3 && <div className="text-[10px] text-slate-400 pl-1 font-bold">+ {dayTasks.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
};

const BoardView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, categoryColors }) => {
    const curr = new Date(currentDate); 
    const first = curr.getDate() - curr.getDay(); 
    const weekDays = [...Array(7)].map((_, i) => new Date(curr.setDate(first + i) && curr));
    curr.setTime(currentDate.getTime());

    const changeWeek = (offset) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + offset * 7);
      setCurrentDate(d);
    };

    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
        <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">Weekly Board</h2>
               <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-wide">Kanban Overview</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
               <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400"><ChevronLeft size={20}/></button>
               <button onClick={() => changeWeek(1)} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400"><ChevronRight size={20}/></button>
            </div>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="h-full flex gap-6 min-w-[1200px] pb-6 px-1">
            {weekDays.map((day, i) => {
              // Replaced toISOString with getLocalDateString to ensure column matches local date
              const dateStr = getLocalDateString(day);
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = dateStr === getLocalDateString(new Date());
              return (
                <div key={i} className={`flex-1 min-w-[280px] rounded-[2rem] flex flex-col transition-all ${isToday ? 'bg-violet-50/50 border-2 border-violet-100' : 'bg-white border border-slate-100'}`}>
                  <div className="p-5 border-b border-slate-50 flex justify-between items-center rounded-t-[2rem]">
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${isToday ? 'text-violet-600' : 'text-slate-400'}`}>{day.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                      <div className={`text-2xl font-black ${isToday ? 'text-violet-900' : 'text-slate-800'}`}>{day.getDate()}</div>
                    </div>
                    <button onClick={() => openAddModal(dateStr)} className="w-8 h-8 rounded-full hover:bg-white text-slate-400 hover:text-violet-600 transition-all flex items-center justify-center shadow-sm border border-transparent hover:border-slate-100"><Plus size={18} /></button>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    {dayTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} categoryColors={categoryColors} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
};

const YearlyView = ({ currentDate, monthlyGoals, addMonthlyGoal, toggleMonthlyGoal, updateMonthlyGoalText, handleMonthlyBlur, handleMonthlyEnter, deleteMonthlyGoal, setMonthlyGoals }) => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const months = [...Array(12)].map((_, i) => i);
    
    let yearlyTotal = 0, yearlyCompleted = 0;
    for(let i=0; i<12; i++) {
        const key = `${currentYear}-${i}`;
        const g = monthlyGoals[key] || [];
        yearlyTotal += g.length;
        yearlyCompleted += g.filter(x=>x.completed).length;
    }
    const yearlyProgress = yearlyTotal ? Math.round((yearlyCompleted/yearlyTotal)*100) : 0;

    return (
        <div className="h-full flex flex-col animate-fade-in overflow-y-auto pb-24 md:pb-8 pr-1 custom-scrollbar">
             <div className="flex justify-between items-center mb-8 flex-shrink-0">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Strategic Map {currentYear}</h2>
             </div>

             {/* Progress HUD */}
             <div className="bg-slate-900 rounded-3xl p-10 mb-10 relative overflow-hidden shadow-2xl shadow-slate-200 flex-shrink-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/30 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                <div className="relative z-10 text-white">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <div className="text-violet-300 font-bold text-xs uppercase tracking-widest mb-2">Annual Execution</div>
                            <div className="text-5xl font-black tracking-tighter">{yearlyProgress}%</div>
                        </div>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div style={{width: `${yearlyProgress}%`}} className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-1000"></div>
                    </div>
                </div>
             </div>

             {/* Monthly Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                 {months.map(m => {
                     const isSelected = m === currentMonth;
                     const key = `${currentYear}-${m}`;
                     const goals = monthlyGoals[key] || [];
                     const completed = goals.filter(g=>g.completed).length;
                     const total = goals.length;
                     const prog = total ? Math.round((completed/total)*100) : 0;

                     return (
                         <div key={m} className={`bg-white rounded-[10px] p-8 min-h-[350px] flex flex-col transition-shadow duration-300 border ${isSelected ? 'border-violet-200 shadow-xl shadow-violet-100 ring-1 ring-violet-100' : 'border-slate-100 hover:shadow-lg hover:shadow-slate-100'}`}>
                             <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50">
                                 <span className={`text-lg font-bold ${isSelected ? 'text-violet-700' : 'text-slate-700'}`}>{new Date(currentYear, m).toLocaleString('default', {month:'long'})}</span>
                                 <button onClick={() => addMonthlyGoal(currentYear, m)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-violet-600 transition-colors"><Plus size={18}/></button>
                             </div>
                             {total > 0 && <div className="h-1.5 w-full bg-slate-50 rounded-full mb-4 overflow-hidden"><div style={{width:`${prog}%`}} className="h-full bg-violet-500 rounded-full"></div></div>}
                             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                 {goals.map(g => (
                                     <div key={g.id} className="flex gap-3 group items-start">
                                         <button onClick={() => toggleMonthlyGoal(currentYear, m, g.id)} className={`w-4 h-4 rounded border mt-0.5 flex-shrink-0 transition-colors ${g.completed ? 'bg-violet-500 border-violet-500' : 'border-slate-300 hover:border-violet-400'}`}></button>
                                         {g.isNew ? (
                                             <input autoFocus className="bg-transparent border-b border-violet-300 text-slate-800 outline-none w-full text-sm font-medium pb-1" 
                                                 value={g.text} 
                                                 onChange={(e)=>updateMonthlyGoalText(currentYear, m, g.id, e.target.value)}
                                                 onBlur={(e) => handleMonthlyBlur(currentYear, m, g.id, e.target.value)}
                                                 onKeyDown={(e) => handleMonthlyEnter(currentYear, m, g.id, e)}
                                                 placeholder="Type goal..."
                                             />
                                         ) : (
                                             <div className="flex-1 relative group/item">
                                                <span 
                                                    onClick={() => setMonthlyGoals(prev => ({...prev, [`${currentYear}-${m}`]: prev[`${currentYear}-${m}`].map(item => item.id === g.id ? {...item, isNew: true} : item)}))}
                                                    className={`text-sm font-medium transition-colors cursor-text block pr-6 ${g.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}
                                                >
                                                    {g.text}
                                                </span>
                                                <button onClick={() => deleteMonthlyGoal(currentYear, m, g.id)} className="absolute right-0 top-1 opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"><X size={14}/></button>
                                             </div>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )
                 })}
             </div>
        </div>
    )
};

// --- Main Application Component ---

export default function App() {
  const [view, setView] = useState('focus'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // Replaced toISOString with getLocalDateString for Modal Date State
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(getLocalDateString(new Date()));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  // Default to 1 task per container
  const generateInitialCycles = (startStr) => {
      const cycles = [];
      const startDate = new Date(startStr);
      for (let i = 0; i < 36; i++) {
        const cycleStart = new Date(startDate);
        cycleStart.setDate(startDate.getDate() + (i * 10));
        const cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 9);
        const formatDate = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
        cycles.push({
          id: i + 1,
          dateRange: `${formatDate(cycleStart)} - ${formatDate(cycleEnd)}`,
          tasks: [ { id: generateId(), text: '', done: false } ],
          notes: '', actionPlan: '' 
        });
      }
      return cycles;
  };

  const [tasks, setTasks] = useState([]);
  const [annualGoals, setAnnualGoals] = useState([]);
  const [monthlyGoals, setMonthlyGoals] = useState({});
  const [wealthBalances, setWealthBalances] = useState({ commitment: 0, savings: 0, investment: 0, education: 0, emergency: 0 });
  const [cyclesData, setCyclesData] = useState([]);
  const [startYearDate, setStartYearDate] = useState(new Date().getFullYear() + '-01-01');
  const [newAnnualGoalInput, setNewAnnualGoalInput] = useState('');

  // Lock ref for preventing blur conflicts
  const ignoreBlurRef = useRef(false);

  // --- Auth & Data Effects ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) loadFromLocalStorage();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (user) {
          const unsubs = [];
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tasks'), (doc) => { if (doc.exists()) setTasks(doc.data().list || []); }));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'goals'), (doc) => { if (doc.exists()) { const d = doc.data(); setAnnualGoals(d.annual || []); setMonthlyGoals(d.monthly || {}); } }));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth'), (doc) => { if (doc.exists()) setWealthBalances(doc.data().balances || { commitment: 0, savings: 0, investment: 0, education: 0, emergency: 0 }); }));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'cycles'), (doc) => { if (doc.exists()) { setCyclesData(doc.data().list || []); setStartYearDate(doc.data().startDate || new Date().getFullYear() + '-01-01'); } else { const initial = generateInitialCycles(new Date().getFullYear() + '-01-01'); setCyclesData(initial); } }));
          return () => unsubs.forEach(u => u());
      } else { loadFromLocalStorage(); }
  }, [user]);

  const loadFromLocalStorage = () => {
      try {
          const t = localStorage.getItem('modern_tasks'); setTasks(t ? JSON.parse(t) : []);
          const ag = localStorage.getItem('modern_annual_goals'); setAnnualGoals(ag ? JSON.parse(ag) : []);
          const mg = localStorage.getItem('modern_monthly_goals'); setMonthlyGoals(mg ? JSON.parse(mg) : {});
          const wb = localStorage.getItem('wealth_balances'); setWealthBalances(wb ? JSON.parse(wb) : { commitment: 0, savings: 0, investment: 0, education: 0, emergency: 0 });
          const cd = localStorage.getItem('tracker_data'); setCyclesData(cd ? JSON.parse(cd) : generateInitialCycles(new Date().getFullYear() + '-01-01'));
          const sd = localStorage.getItem('tracker_startDate'); if(sd) setStartYearDate(sd);
      } catch(e) { console.error(e); }
  };

  const saveData = (type, data) => {
      if (user) {
         if (type === 'tasks') setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tasks'), { list: data });
         if (type === 'goals') setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'goals'), { annual: annualGoals, monthly: monthlyGoals });
         if (type === 'wealth') setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth'), { balances: data });
         if (type === 'cycles') setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'cycles'), { list: data, startDate: startYearDate });
      } else {
         if (type === 'tasks') localStorage.setItem('modern_tasks', JSON.stringify(data));
         if (type === 'goals') { localStorage.setItem('modern_annual_goals', JSON.stringify(annualGoals)); localStorage.setItem('modern_monthly_goals', JSON.stringify(monthlyGoals)); }
         if (type === 'wealth') localStorage.setItem('wealth_balances', JSON.stringify(data));
         if (type === 'cycles') { localStorage.setItem('tracker_data', JSON.stringify(data)); localStorage.setItem('tracker_startDate', startYearDate); }
      }
  };

  useEffect(() => { if(tasks.length > 0 || user) saveData('tasks', tasks); }, [tasks]);
  useEffect(() => { if(annualGoals.length > 0 || Object.keys(monthlyGoals).length > 0 || user) saveData('goals', null); }, [annualGoals, monthlyGoals]);
  useEffect(() => { saveData('wealth', wealthBalances); }, [wealthBalances]);
  useEffect(() => { if(cyclesData.length > 0 || user) saveData('cycles', cyclesData); }, [cyclesData, startYearDate]);

  const categoryColors = {
    '工作': 'bg-blue-100 text-blue-600',
    '生活': 'bg-emerald-100 text-emerald-600',
    '健康': 'bg-orange-100 text-orange-600',
    '学习': 'bg-violet-100 text-violet-600',
  };

  const addTask = (newTask) => setTasks([...tasks, { id: Date.now(), completed: false, ...newTask }]);
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  // Replaced toISOString with getLocalDateString for Modal Opening
  const openAddModal = (dateStr) => { setSelectedDateForAdd(dateStr || getLocalDateString(new Date())); setIsModalOpen(true); };

  const addAnnualGoal = () => {
    if (!newAnnualGoalInput.trim() || annualGoals.length >= 10) return;
    setAnnualGoals([...annualGoals, { id: Date.now(), text: newAnnualGoalInput, completed: false, category: '工作' }]);
    setNewAnnualGoalInput('');
  };
  const toggleAnnualGoal = (id) => setAnnualGoals(annualGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const deleteAnnualGoal = (id) => setAnnualGoals(annualGoals.filter(g => g.id !== id));

  // --- Optimized Monthly Goal Handlers ---
  const addMonthlyGoal = (year, month) => {
    const key = `${year}-${month}`;
    setMonthlyGoals(prev => {
        const current = prev[key] || [];
        if (current.length >= 10) return prev;
        return { ...prev, [key]: [...current, { id: Date.now(), text: '', completed: false, isNew: true }] };
    });
  };

  const updateMonthlyGoalText = (year, month, id, text) => {
    const key = `${year}-${month}`;
    setMonthlyGoals(prev => ({ 
        ...prev, 
        [key]: (prev[key]||[]).map(g => g.id === id ? { ...g, text } : g) 
    }));
  };

  const handleMonthlyEnter = (year, month, id, e) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          // Lock blur to prevent double update / vibration
          ignoreBlurRef.current = true;
          
          const key = `${year}-${month}`;
          setMonthlyGoals(prev => {
              const current = prev[key] || [];
              const updated = current.map(g => g.id === id ? { ...g, isNew: false } : g);
              const currentGoal = current.find(g => g.id === id);
              if (updated.length < 10 && currentGoal && currentGoal.text.trim()) {
                  updated.push({ id: Date.now(), text: '', completed: false, isNew: true });
              }
              return { ...prev, [key]: updated };
          });

          // Release lock shortly
          setTimeout(() => ignoreBlurRef.current = false, 100);
      }
  };

  const handleMonthlyBlur = (year, month, id, text) => {
      // If locked (due to Enter), skip blur logic
      if (ignoreBlurRef.current) return;

      if (!text.trim()) {
          deleteMonthlyGoal(year, month, id);
      } else {
          const key = `${year}-${month}`;
          setMonthlyGoals(prev => ({ 
              ...prev, 
              [key]: (prev[key]||[]).map(g => g.id === id ? { ...g, isNew: false } : g) 
          }));
      }
  };

  const toggleMonthlyGoal = (year, month, id) => {
    const key = `${year}-${month}`;
    setMonthlyGoals(prev => ({ ...prev, [key]: (prev[key]||[]).map(g => g.id === id ? { ...g, completed: !g.completed } : g) }));
  };
  
  const deleteMonthlyGoal = (year, month, id) => {
    const key = `${year}-${month}`;
    setMonthlyGoals(prev => ({ ...prev, [key]: (prev[key]||[]).filter(g => g.id !== id) }));
  };
  
  // Calculate total assets for sidebar
  const totalAssets = wealthBalances.savings + wealthBalances.investment;

  // --- Main Layout ---
  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-violet-100 selection:text-violet-900">
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-10 tracking-tight">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
              <Layout size={20} />
            </div>
            Planner<span className="text-violet-600">.AI</span>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'focus', label: 'Dashboard', icon: Home },
              { id: 'wealth', label: 'Wealth Jar', icon: Database }, 
              { id: 'cycle', label: '36x10 Cycles', icon: Activity },
              { id: 'calendar', label: 'Calendar', icon: CalIcon },
              { id: 'board', label: 'Kanban', icon: Trello },
              { id: 'yearly', label: 'Strategy', icon: TrendingUp },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm tracking-wide ${
                  view === item.id 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} className={view === item.id ? "text-violet-300" : ""}/>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-4">
             {/* User Profile / Login */}
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                {user ? (
                   <div className="flex items-center gap-3 overflow-hidden">
                       <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold">
                           {user.email[0].toUpperCase()}
                       </div>
                       <div className="flex-1 min-w-0">
                           <div className="text-xs font-bold text-slate-900 truncate">{user.email.split('@')[0]}</div>
                           <button onClick={() => signOut(auth)} className="text-[10px] text-red-500 hover:underline flex items-center gap-1">Log Out <LogOut size={10}/></button>
                       </div>
                   </div>
                ) : (
                   <button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors">
                       <LogIn size={14} /> Log In / Sign Up
                   </button>
                )}
             </div>

             {/* Total Assets Card (Replaces Pro Tip) */}
             <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-900/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-violet-800/20 transition-all"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                        <PieChart size={14} /> Total Assets
                    </div>
                    <div className="text-2xl font-black text-white tracking-tight">
                         <span className="text-xs text-slate-500 mr-1 font-normal">RM</span>
                         {totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                     <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                        Derived from Savings & Investment
                    </p>
                </div>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-slate-50">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={24} /></button>
          <span className="font-black text-slate-800 uppercase tracking-widest text-sm">{view}</span>
          <button onClick={() => openAddModal()} className="text-violet-600 p-2"><Plus size={24} /></button>
        </header>

        <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar md:pb-10 relative">
          {view === 'focus' && <FocusView tasks={tasks} user={user} annualGoals={annualGoals} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={categoryColors} />}
          {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances}/>}
          {view === 'cycle' && <CycleTrackerView data={cyclesData} setData={setCyclesData} startYearDate={startYearDate} setStartYearDate={setStartYearDate}/>}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} />}
          {view === 'board' && <BoardView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} categoryColors={categoryColors} />}
          {view === 'yearly' && <YearlyView currentDate={currentDate} monthlyGoals={monthlyGoals} addMonthlyGoal={addMonthlyGoal} toggleMonthlyGoal={toggleMonthlyGoal} updateMonthlyGoalText={updateMonthlyGoalText} handleMonthlyBlur={handleMonthlyBlur} handleMonthlyEnter={handleMonthlyEnter} deleteMonthlyGoal={deleteMonthlyGoal} setMonthlyGoals={setMonthlyGoals} />}
        </div>
      </main>

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTask}
        defaultDate={selectedDateForAdd}
      />
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
}