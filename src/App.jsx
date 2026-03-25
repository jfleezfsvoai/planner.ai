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
  CalendarDays, ChevronDown, GraduationCap, Users, Award, Globe,
  CheckCircle2, Circle, Gift, Palette, MousePointer2, 
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
      appId: "1:656607786498:web:8eabac0b0d5edd222ed91b"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CRITICAL: Fixed App ID for data persistence
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
const getIconForLabel = (label) => {
    const l = label ? label.toLowerCase() : '';
    if(l.includes('save') || l.includes('储蓄')) return <Shield size={20}/>;
    if(l.includes('invest') || l.includes('投资')) return <TrendingUp size={20}/>;
    if(l.includes('edu') || l.includes('教育')) return <Book size={20}/>;
    if(l.includes('emer') || l.includes('紧急')) return <AlertTriangle size={20}/>;
    if(l.includes('play') || l.includes('娱乐')) return <Heart size={20}/>;
    return <Layers size={20}/>;
};

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
              <span className={isExpense ? 'text-rose-500' : 'text-emerald-500'}>{isExpense ? '-' : '+'} RM {Math.abs(item.value).toLocaleString()}</span>
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

const TaskCard = ({ task, onToggle, onDelete, onUpdate, moveTask, showWarning, categories, setCategories, showTime = true, format = 'standard' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editPriority, setEditPriority] = useState(task.priority || '');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryColor, setCustomCategoryColor] = useState(CATEGORY_COLORS[0].value);
  const [dropPosition, setDropPosition] = useState(null); 
  const cardRef = useRef(null);
  
  const safeCategory = typeof task.category === 'string' ? task.category : 'Uncategorized';
  const catObj = (categories || []).find(c => (typeof c === 'object' ? c.name : c) === safeCategory);
  const categoryStyle = (catObj && typeof catObj === 'object') ? catObj.color : 'bg-slate-100 text-slate-600 border-slate-200';
  const priorityConfig = PRIORITIES[task.priority] || {};
  const highlightStyle = priorityConfig.highlight || '';

  const handleSave = () => {
    if (editTitle.trim()) {
        if (setCategories && isCustomCategory) {
          const existsIndex = categories.findIndex(c => c.name === editCategory);
          if (existsIndex > -1) {
              const newCats = [...categories];
              newCats[existsIndex] = { name: editCategory, color: customCategoryColor };
              setCategories(newCats);
          } else if (editCategory.trim()) {
              setCategories([...categories, { name: editCategory, color: customCategoryColor }]);
          }
        }
        onUpdate(task.id, { title: editTitle, category: editCategory, priority: editPriority }); 
    }
    setIsEditing(false); setIsCustomCategory(false);
  };

  const handleDragStart = (e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; e.target.style.opacity = '0.4'; };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; setDropPosition(null); };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (cardRef.current) { const rect = cardRef.current.getBoundingClientRect(); const midY = rect.top + rect.height / 2; setDropPosition(e.clientY < midY ? 'top' : 'bottom'); } };
  const handleDrop = (e) => { e.preventDefault(); setDropPosition(null); const dragId = e.dataTransfer.getData('text/plain'); if (dragId && dragId !== task.id.toString() && moveTask) { moveTask(dragId, task.id, dropPosition); } };

  if (isEditing) {
      return (
        <div className="bg-white p-3 rounded-2xl border border-violet-200 shadow-md mb-2 animate-in fade-in zoom-in-95 duration-200">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-xs font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1 outline-none focus:border-violet-300" placeholder="任务名称" autoFocus />
            <div className="mb-3">
              <div className="flex gap-2 items-center mb-2">
                {isCustomCategory ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="relative">
                      <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="类别名称" className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 pr-6 text-xs outline-none focus:border-violet-500" />
                      <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400"><X size={12}/></button>
                    </div>
                  </div>
                ) : (
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded p-1.5 outline-none">
                    {(categories || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                )}
                <button type="button" onClick={() => setIsCustomCategory(!isCustomCategory)} className="p-1.5 bg-slate-100 hover:bg-violet-100 text-violet-600 rounded"><Edit3 size={12}/></button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={14}/></button>
              <button onClick={handleSave} className="p-1.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600"><Save size={14}/></button>
            </div>
        </div>
      );
  }

  return (
    <div ref={cardRef} draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={handleDrop} className={`bg-white/80 backdrop-blur-sm p-3 rounded-2xl border transition-all group relative mb-2 cursor-grab active:cursor-grabbing ${showWarning ? 'border-amber-300 shadow-amber-100' : 'border-slate-100 shadow-sm hover:border-violet-200'} ${highlightStyle}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-300 group-hover:text-slate-400"><GripVertical size={12} /></div>
        <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white' : 'border-slate-300 hover:border-violet-500 text-transparent'}`}><CheckSquare size={10} fill={task.completed ? "currentColor" : "none"} /></button>
        <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
          <div className="flex justify-between items-start">
             <div className="flex flex-wrap items-center gap-2"><p className={`text-xs font-bold truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</p></div>
             {showWarning && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 animate-pulse" />}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${categoryStyle}`}>{safeCategory}</span>
            {task.priority && priorityConfig.label && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${priorityConfig.color}`}>{priorityConfig.label}</span>}
            {showTime && task.time && <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono bg-slate-50 px-1 rounded"><Clock size={8} /> {task.time}</span>}
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/80 rounded-lg backdrop-blur-sm">
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
    const [newHabit, setNewHabit] = useState(''); const [newHabitTarget, setNewHabitTarget] = useState(daysInMonth.length);
    const toggleHabit = (habitId, dateStr) => { const habit = habits.find(h => h.id === habitId); if (!habit) return; const isCompleted = habit.completed?.includes(dateStr); let newCompleted = [...(habit.completed || [])]; if (isCompleted) { newCompleted = newCompleted.filter(d => d !== dateStr); } else { newCompleted.push(dateStr); } onUpdate(habitId, { completed: newCompleted }); };
    const handleAdd = (e) => { e.preventDefault(); if(!newHabit.trim()) return; onAdd({ name: newHabit.trim(), target: newHabitTarget || daysInMonth.length, reward: '' }); setNewHabit(''); };
    const getCurrentMonthCompletedCount = (completedDates) => { const prefix = `${year}-${String(month + 1).padStart(2, '0')}`; return (completedDates || []).filter(d => d.startsWith(prefix)).length; };
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Habit Tracker</h3></div>
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2 min-w-[150px] sticky left-0 bg-white z-20">习惯养成</th>
                    <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2">目标</th>
                    <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2">完成</th>
                    {daysInMonth.map((d, i) => (<th key={i} className="text-center pb-4 px-1 min-w-[40px]"><span className="text-[9px] font-bold text-slate-400">{d.getDate()}</span></th>))}
                    <th className="w-10 pb-4"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {habits.map(habit => {
                    const completedCount = getCurrentMonthCompletedCount(habit.completed);
                    const target = habit.target || daysInMonth.length;
                    return (
                      <tr key={habit.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                        <td className="py-3 px-2 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-20">{habit.name}</td>
                        <td className="py-3 px-2 text-center text-slate-500">{target}</td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-600">{completedCount}</td>
                        {daysInMonth.map((d, i) => {
                          const dateStr = getLocalDateString(d);
                          const isDone = habit.completed?.includes(dateStr);
                          return (<td key={i} className="text-center py-3 px-1"><button onClick={() => toggleHabit(habit.id, dateStr)} className={`w-5 h-5 rounded flex items-center justify-center transition-all mx-auto ${isDone ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 hover:border-emerald-300'}`}><CheckSquare size={12} fill={isDone ? "currentColor" : "none"}/></button></td>);
                        })}
                        <td className="text-right py-3 px-2"><button onClick={() => onDelete(habit.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <form onSubmit={handleAdd} className="mt-6 flex gap-3 border-t border-slate-50 pt-4">
              <input type="text" value={newHabit} onChange={e => setNewHabit(e.target.value)} placeholder="新习惯名称..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-emerald-500"/>
              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"><Plus size={16}/> 添加</button>
            </form>
        </div>
    );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate, defaultTime, categories, setCategories }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '工作');
  const [priority, setPriority] = useState(''); 
  const [time, setTime] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setTime(defaultTime || ''); setCategory(categories.length > 0 ? categories[0].name : '工作'); setPriority('');
    }
  }, [isOpen, defaultTime, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault(); if (!title.trim()) return;
    onAdd({ title, category, time, date: defaultDate, priority });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/50">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Zap size={16} className="text-violet-500" fill="currentColor"/> 新任务</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div><label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">内容</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-violet-500 outline-none" placeholder="需要做什么？" autoFocus/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">类别</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500">{categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">时间</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500"/></div>
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">添加任务</button>
        </form>
      </div>
    </div>
  );
};

const DashboardView = ({ tasks, user, openAddModal, toggleTask, deleteTask, onUpdate, moveTask, categories, habits, onUpdateHabit, onAddHabit, onDeleteHabit, setCategories }) => {
    const todayStr = getLocalDateString(new Date());
    const todaysTasks = sortTasksByTime(tasks.filter(t => t.date === todayStr));
    const completedTasks = todaysTasks.filter(t => t.completed).length;
    const totalTasks = todaysTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
        <header><h2 className="text-3xl font-black text-slate-800">Dashboard</h2><p className="text-slate-500 font-medium">Welcome back, <span className="text-violet-600 font-bold">{user?.email?.split('@')[0] || 'Commander'}</span></p></header>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[28rem]`}>
                <div className="flex justify-between items-center p-6 pb-2"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="text-rose-500"/> Today's Focus</h3><button onClick={() => openAddModal(todayStr)} className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg"><Plus size={16}/></button></div>
                <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar space-y-2">{todaysTasks.length === 0 ? <div className="text-center text-slate-400 py-10 italic">暂无任务</div> : todaysTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} moveTask={moveTask} categories={categories} setCategories={setCategories}/>))}</div>
            </div>
            
            <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center h-[28rem]`}>
                <h3 className="font-black text-slate-800 mb-8 text-xl uppercase tracking-tighter">今日完成度</h3>
                <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                        <circle cx="88" cy="88" r="78" stroke="currentColor" strokeWidth="12" fill="transparent" 
                            className="text-violet-600 transition-all duration-1000 ease-out"
                            strokeDasharray={490}
                            strokeDashoffset={490 - (490 * completionRate) / 100}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">{completionRate}%</span>
                    </div>
                </div>
                <p className="mt-8 text-sm text-slate-500 font-bold">{completionRate === 100 ? "🎉 全部达成！" : "继续加油！"}</p>
            </div>
        </div>
        <HabitTracker habits={habits} onUpdate={onUpdateHabit} onAdd={onAddHabit} onDelete={onDeleteHabit} />
      </div>
    );
};

const WealthJarView = ({ balances, setBalances, wealthConfig, setWealthConfig, transactions = [], setTransactions }) => {
    const [income, setIncome] = useState('');
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });
    const [showGraph, setShowGraph] = useState(false);
    
    const handleDistribute = (e) => {
      e.preventDefault(); const amt = parseFloat(income); if (isNaN(amt) || amt <= 0) return;
      const commit = wealthConfig.showCommitment ? (wealthConfig.commitment || 0) : 0;
      const netIncome = Math.max(0, amt - commit);
      const newBalances = { ...balances };
      const newTransactions = [{ id: Date.now(), amount: amt, category: '收入', remark: '分配录入', date: getLocalDateString(new Date()), type: 'income' }, ...transactions];
      
      if (wealthConfig.showCommitment && commit > 0) {
        newBalances.commitment = (newBalances.commitment || 0) + commit;
      }
      
      wealthConfig.jars.forEach(jar => {
        const share = netIncome * (jar.percent / 100);
        newBalances[jar.id] = (newBalances[jar.id] || 0) + share;
      });
      setBalances(newBalances); setTransactions(newTransactions); setIncome('');
    };

    const submitTransaction = (e) => {
      e.preventDefault(); if(!expenseForm.amount || !expenseForm.category) return;
      let finalAmount = parseFloat(expenseForm.amount);
      if (expenseForm.category !== '收入') { finalAmount = -Math.abs(finalAmount); }
      const newTx = { id: Date.now(), ...expenseForm, amount: finalAmount };
      setTransactions([newTx, ...transactions]);
      setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">财富总览 (RM)</div>
                  <div className="text-4xl font-black">{Object.values(balances).reduce((a,b)=>a+b,0).toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign className="text-emerald-500"/> 收入分配器</h3>
              <form onSubmit={handleDistribute} className="flex flex-col md:flex-row gap-4">
                <input type="number" placeholder="输入收入 (RM)" value={income} onChange={e=>setIncome(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-bold"/>
                <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all">全部分配</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {wealthConfig.jars.map(jar => (
                  <div key={jar.id} className="bg-white border border-slate-100 p-6 rounded-3xl h-40 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-slate-700">{jar.label} <span className="text-[10px] text-slate-400 ml-1">({jar.percent}%)</span></div>
                      <div className="p-2 bg-slate-50 rounded-full text-slate-400">{getIconForLabel(jar.label)}</div>
                    </div>
                    <div className="text-2xl font-black text-slate-800">RM {(balances[jar.id]||0).toLocaleString()}</div>
                  </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">记录收支</h3>
                  <form onSubmit={submitTransaction} className="space-y-4">
                    <input type="number" placeholder="金额" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                    <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none">
                      <option value="">选择类别</option>
                      <option value="饮食">饮食</option><option value="交通">交通</option><option value="购物">购物</option><option value="订阅">订阅</option><option value="收入">收入</option>
                    </select>
                    <input type="text" placeholder="备注" value={expenseForm.remark} onChange={e=>setExpenseForm({...expenseForm, remark: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none" />
                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all">录入</button>
                  </form>
                </div>
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-4">近期流水</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div>
                          <div className="font-bold text-slate-700 text-sm">{tx.category} <span className="text-[10px] text-slate-400 ml-2">{tx.date}</span></div>
                          <div className="text-[10px] text-slate-400">{tx.remark}</div>
                        </div>
                        <div className={`font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {tx.amount > 0 ? '+' : ''} RM {Math.abs(tx.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
        </div>
    );
};

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, onUpdate, onDelete, categories }) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
    
    return (
      <div className="flex flex-col animate-fade-in pb-20">
        <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-800">Calendar</h2>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2"><ChevronLeft size={20}/></button>
            <span className="px-4 py-2 font-bold text-slate-700">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (<div key={d} className="py-4 text-center text-xs font-bold text-slate-400">{d}</div>))}</div>
          <div className="grid grid-cols-7 auto-rows-auto bg-slate-50 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.date === dateStr);
              return (
                <div key={i} className="bg-white p-2 min-h-[100px] flex flex-col group relative">
                  <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${dateStr === getLocalDateString(new Date()) ? 'bg-violet-600 text-white' : 'text-slate-700'}`}>{day}</div>
                  <div className="space-y-1 mt-1 overflow-hidden">{dayTasks.slice(0, 3).map(t => (<div key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 truncate">{t.title}</div>))}</div>
                  <button onClick={() => openAddModal(dateStr)} className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-violet-500 bg-violet-50 rounded-full transition-all"><Plus size={14}/></button>
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
            <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{currentDate.toLocaleDateString('default', {weekday: 'long'})}</h2>
               <p className="text-slate-500 font-bold">{currentDate.toLocaleDateString('default', {day: 'numeric', month: 'long'})}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onCloneYesterday(dateStr)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-violet-100 hover:text-violet-600 transition-all"><Copy size={14} className="inline mr-1"/> 昨日任务</button>
                <div className="flex items-center bg-slate-50 p-1 rounded-xl">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate()-1)))} className="p-2"><ChevronLeft size={16}/></button>
                    <span className="font-bold text-xs px-2">{dateStr}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate()+1)))} className="p-2"><ChevronRight size={16}/></button>
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {hours.map(hour => {
              const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
              const hourTasks = tasks.filter(t => t.date === dateStr && t.time && parseInt(t.time.split(':')[0]) === hour);
              return (
                <div key={hour} className="flex gap-4 p-4 rounded-2xl border bg-white border-slate-100 group">
                    <div className="w-16 flex-shrink-0 pt-1 font-black text-slate-300">{hour}:00</div>
                    <div className="flex-1 space-y-2">
                        {hourTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} categories={categories} showTime={false}/>))}
                        <button onClick={() => openAddModal(dateStr, timeLabel)} className="text-slate-300 hover:text-violet-500 text-xs flex items-center gap-1"><Plus size={14}/> 添加焦点</button>
                    </div>
                </div>
              );
            })}
        </div>
      </div>
    );
};

const ReviewView = ({ reviews, onUpdateReview }) => {
    const [activeTab, setActiveTab] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
    const dailyData = reviews?.daily?.[selectedDate] || { keep: [], improve: [], start: [], stop: [] };

    const handleDailyChange = (field, idx, val) => {
        const list = [...(dailyData[field] || [])];
        while (list.length <= idx) { list.push({ text: '', checked: false }); }
        list[idx] = val;
        const newData = { ...reviews, daily: { ...(reviews.daily || {}), [selectedDate]: { ...dailyData, [field]: list } } };
        onUpdateReview(newData);
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
              <div><h2 className="text-3xl font-black text-slate-800">Review</h2></div>
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                {['daily', 'cycle', 'yearly'].map(t => (<button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>{t}</button>))}
              </div>
            </header>
            
            <div className="flex justify-end items-center gap-3">
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl font-bold"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['keep', 'improve', 'start', 'stop'].map(field => (
                  <div key={field} className="p-6 rounded-3xl border bg-white border-slate-100 shadow-sm">
                    <h4 className="font-black text-slate-800 mb-4 uppercase text-xs">{field.toUpperCase()}</h4>
                    {[0, 1, 2].map(i => (
                      <textarea key={i} value={dailyData[field]?.[i]?.text || ''} 
                        onChange={e => handleDailyChange(field, i, { text: e.target.value, checked: false })}
                        placeholder={`Item ${i+1}`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white mb-2 text-sm min-h-[60px]"
                      />
                    ))}
                  </div>
                ))}
            </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState('focus'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(getLocalDateString(new Date()));
  const [selectedTimeForAdd, setSelectedTimeForAdd] = useState('');
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [categories, setCategories] = useState([
      { name: '工作', color: 'bg-blue-100 text-blue-600 border-blue-200' },
      { name: '生活', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
      { name: '健康', color: 'bg-orange-100 text-orange-600 border-orange-200' },
      { name: '学习', color: 'bg-violet-100 text-violet-600 border-violet-200' }
  ]);
  const [tasks, setTasks] = useState([]);
  const [wealthBalances, setWealthBalances] = useState({ commitment: 0 });
  const [wealthTransactions, setWealthTransactions] = useState([]);
  const [wealthConfig, setWealthConfig] = useState({ 
    yearlyTarget: 100000, 
    commitment: 2000, 
    showCommitment: true, 
    jars: [
      { id: 'save', label: '储蓄', percent: 10 },
      { id: 'invest', label: '投资', percent: 10 },
      { id: 'edu', label: '教育', percent: 10 },
      { id: 'play', label: '娱乐', percent: 10 },
      { id: 'life', label: '生活', percent: 60 }
    ] 
  });
  const [reviews, setReviews] = useState({ daily: {}, cycle: {}, yearly: {} });
  const [habits, setHabits] = useState([]);
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
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      if (!u) {
        // Load local data if anonymous failed or not yet logged in
        loadLocalStorage();
      }
    }); 
    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
      if (user) {
          const unsubs = [];
          const userBase = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'main');
          
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'tasks'), d => d.exists() && setTasks(d.data().list || []), () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'habits'), d => d.exists() && setHabits(d.data().list || []), () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth'), d => {
              if(d.exists()) { 
                const data = d.data(); 
                setWealthBalances(data.balances || {}); 
                setWealthTransactions(data.transactions || []);
                if(data.config) setWealthConfig(data.config);
              }
          }, () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'reviews'), d => d.exists() && setReviews(d.data() || {}), () => {}));
          
          setIsLoaded(true);
          return () => unsubs.forEach(u => u());
      }
  }, [user]);

  const saveData = (type, data) => {
    if(user) { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', type), data); }
    else { localStorage.setItem(`planner_${type}`, JSON.stringify(data)); }
  };
  
  useEffect(() => { if(isLoaded) saveData('tasks', { list: tasks }); }, [tasks, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('habits', { list: habits }); }, [habits, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('wealth', { balances: wealthBalances, transactions: wealthTransactions, config: wealthConfig }); }, [wealthBalances, wealthTransactions, wealthConfig, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('reviews', reviews); }, [reviews, isLoaded]);

  const loadLocalStorage = () => {
      try {
          const t = localStorage.getItem('planner_tasks'); if(t) setTasks(JSON.parse(t).list || []);
          const h = localStorage.getItem('planner_habits'); if(h) setHabits(JSON.parse(h).list || []);
          const w = localStorage.getItem('planner_wealth'); if(w) { const d = JSON.parse(w); setWealthBalances(d.balances || {}); setWealthTransactions(d.transactions || []); if(d.config) setWealthConfig(d.config); }
          const r = localStorage.getItem('planner_reviews'); if(r) setReviews(JSON.parse(r) || {});
          setIsLoaded(true);
      } catch(e) { console.error(e); }
  }
  
  const addTask = (newTask) => setTasks([...tasks, { id: Date.now(), completed: false, ...newTask }]);
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const updateTask = (id, updates) => setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));

  const moveTask = (dragId, targetId, position) => {
      const dragIndex = tasks.findIndex(t => t.id === parseInt(dragId));
      const targetIndex = tasks.findIndex(t => t.id === targetId);
      if (dragIndex >= 0 && targetIndex >= 0) {
          const newTasks = [...tasks];
          const [draggedItem] = newTasks.splice(dragIndex, 1);
          newTasks.splice(position === 'bottom' ? targetIndex : targetIndex, 0, draggedItem);
          setTasks(newTasks);
      }
  };
  
  const cloneYesterdayTasks = (targetDateStr) => {
      const yesterday = new Date(new Date(targetDateStr).setDate(new Date(targetDateStr).getDate() - 1));
      const sourceStr = getLocalDateString(yesterday);
      const tasksToClone = tasks.filter(t => t.date === sourceStr).map(t => ({ ...t, id: generateId(), date: targetDateStr, completed: false }));
      if (tasksToClone.length > 0) setTasks(prev => [...prev, ...tasksToClone]);
  };
  
  const updateHabit = (id, updates) => setHabits(habits.map(h => h.id === id ? { ...h, ...updates } : h));
  const addHabit = (habit) => setHabits([...habits, { id: generateId(), completed: [], ...habit }]);
  const deleteHabit = (id) => setHabits(habits.filter(h => h.id !== id));

  const openAddModal = (dateStr, timeStr) => { setSelectedDateForAdd(dateStr || getLocalDateString(new Date())); setSelectedTimeForAdd(timeStr || ''); setIsModalOpen(true); };

  const menuItems = [
    { id: 'focus', label: 'Dashboard', icon: Home },
    { id: 'wealth', label: 'Wealth Jar', icon: Database },
    { id: 'calendar', label: 'Calendar', icon: CalIcon },
    { id: 'kanban', label: 'Timeline', icon: Trello },
    { id: 'review', label: 'Review', icon: ClipboardList }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 shadow-2xl md:translate-x-0 md:static transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center gap-2 text-slate-900 font-black text-2xl mb-10 tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white"><Layout size={18} /></div>
            Planner<span className="text-violet-600">.AI</span>
          </div>
          <nav className="space-y-1">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${view === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-slate-50">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">{user.email ? user.email[0] : 'A'}</div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">{user.email || 'Anonymous'}</div>
                <button onClick={() => signOut(auth)} className="text-[10px] text-red-500 hover:underline">Log Out</button>
              </div>
            </div>
          ) : <div className="text-[10px] text-slate-400">Loading User...</div>}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
          <span className="font-black text-slate-800 uppercase text-xs">{view}</span>
          <button onClick={() => openAddModal()} className="text-violet-600"><Plus size={24} /></button>
        </header>
        <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar">
          {view === 'focus' && <DashboardView tasks={tasks} user={user} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} moveTask={moveTask} categories={categories} habits={habits} onUpdateHabit={updateHabit} onAddHabit={addHabit} onDeleteHabit={deleteHabit} setCategories={setCategories} />}
          {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances} wealthConfig={wealthConfig} setWealthConfig={setWealthConfig} transactions={wealthTransactions} setTransactions={setWealthTransactions}/>}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} onUpdate={updateTask} onDelete={deleteTask} categories={categories} />}
          {view === 'kanban' && <TimelineView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} categories={categories} onCloneYesterday={cloneYesterdayTasks} />}
          {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={setReviews}/>}
        </div>
      </main>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={selectedDateForAdd} defaultTime={selectedTimeForAdd} categories={categories} setCategories={setCategories}/>
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
      `}</style>
    </div>
  );
}