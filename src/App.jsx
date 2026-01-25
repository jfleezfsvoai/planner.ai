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
  CalendarDays, ChevronDown, GraduationCap, Users, TrendingDown, Award, Globe,
  CheckCircle2, Circle, Gift, Palette
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
// Reverted to fixed ID to ensure access to previously saved data
const appId = 'default-planner-app';

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
    'urgent_important': { label: '紧急重要', color: 'text-red-600 bg-red-50 border-red-200', highlight: 'border-l-4 border-l-red-500 ring-1 ring-red-100' },
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

const getWeekDays = (baseDate) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust when day is sunday
    const sunday = new Date(d.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
        const next = new Date(sunday);
        next.setDate(sunday.getDate() + i);
        days.push(next);
    }
    return days;
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

const TaskCard = ({ task, onToggle, onDelete, onUpdate, moveTask, showWarning, categories, setCategories, showTime = true, format = 'standard' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editPriority, setEditPriority] = useState(task.priority || '');
  
  // Advanced Category Editing
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryColor, setCustomCategoryColor] = useState(CATEGORY_COLORS[0].value);
  
  const [dropPosition, setDropPosition] = useState(null); 
  const cardRef = useRef(null);
  
  // Find category color
  const catObj = categories.find(c => c.name === task.category);
  const categoryStyle = catObj ? catObj.color : 'bg-slate-100 text-slate-600 border-slate-200';
  
  // Priority Style
  const priorityConfig = PRIORITIES[task.priority] || {};
  const highlightStyle = priorityConfig.highlight || '';

  const handleSave = () => {
    if (editTitle.trim()) {
        let finalCategory = editCategory;
        // Update category list if new
        if (isCustomCategory) {
             const exists = categories.find(c => c.name === editCategory);
             if (!exists && editCategory.trim()) {
                 // Creating a new category via Edit
                 // In a real app we might propagate this up, but for now we rely on the parent or next sync
                 // Since setCategories is available:
                 if (setCategories) {
                     setCategories(prev => [...prev, { name: editCategory, color: customCategoryColor }]);
                 }
             }
        }
        
        onUpdate(task.id, { title: editTitle, category: editCategory, priority: editPriority }); 
    }
    setIsEditing(false);
    setIsCustomCategory(false);
  };

  const togglePriority = (key) => {
      if (editPriority === key) {
          setEditPriority(''); // Cancel selection
      } else {
          setEditPriority(key);
      }
  };

  const handleDragStart = (e) => { 
      e.dataTransfer.setData('text/plain', task.id); 
      e.dataTransfer.effectAllowed = 'move'; 
      e.target.style.opacity = '0.4';
  };
  
  const handleDragEnd = (e) => {
      e.target.style.opacity = '1';
      setDropPosition(null);
  };

  const handleDragOver = (e) => { 
      e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move'; 
      if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          if (e.clientY < midY) {
              setDropPosition('top');
          } else {
              setDropPosition('bottom');
          }
      }
  };

  const handleDragLeave = () => {
      setDropPosition(null);
  };
  
  const handleDrop = (e) => { 
      e.preventDefault(); 
      setDropPosition(null);
      const dragId = e.dataTransfer.getData('text/plain'); 
      if (dragId && dragId !== task.id.toString() && moveTask) { 
          moveTask(dragId, task.id, dropPosition); 
      } 
  };

  if (isEditing) {
      return (
        <div className="bg-white p-3 rounded-2xl border border-violet-200 shadow-md mb-2 animate-in fade-in zoom-in-95 duration-200">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-xs font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1 outline-none focus:border-violet-300" placeholder="任务名称" autoFocus />
            
            {/* Category Edit */}
            <div className="mb-3">
                 <div className="flex gap-2 items-center mb-2">
                     {isCustomCategory ? (
                        <div className="flex-1 flex flex-col gap-2">
                            <div className="relative">
                                <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="新类别名称" className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 pr-6 text-xs outline-none focus:border-violet-500" />
                                <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400"><X size={12}/></button>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {CATEGORY_COLORS.map((col) => (
                                    <button 
                                        key={col.id} 
                                        type="button" 
                                        onClick={() => setCustomCategoryColor(col.value)}
                                        className={`w-3 h-3 rounded-full border ${col.value.split(' ')[0]} ${customCategoryColor === col.value ? 'ring-1 ring-offset-1 ring-slate-400' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                     ) : (
                         <>
                            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded p-1.5 outline-none">
                                {(categories || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <button type="button" onClick={() => { setIsCustomCategory(true); setEditCategory(''); }} className="p-1.5 bg-slate-100 hover:bg-violet-100 text-violet-600 rounded"><Plus size={12}/></button>
                         </>
                     )}
                 </div>
            </div>

            {/* Priority Edit */}
            <div className="mb-3">
                 <label className="block text-[10px] font-bold text-slate-400 mb-1">Priority</label>
                 <div className="grid grid-cols-2 gap-1">
                    {Object.entries(PRIORITIES).map(([key, config]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => togglePriority(key)}
                            className={`text-[9px] px-1 py-1 rounded border transition-all truncate ${editPriority === key ? config.color + ' ring-1 ring-slate-200' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                            {config.label}
                        </button>
                    ))}
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
    <div 
        ref={cardRef}
        draggable 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave}
        onDrop={handleDrop} 
        className={`bg-white/80 backdrop-blur-sm p-3 rounded-2xl border transition-all group relative mb-2 cursor-grab active:cursor-grabbing 
        ${showWarning ? 'border-amber-300 shadow-amber-100' : 'border-slate-100 shadow-sm hover:border-violet-200'}
        ${highlightStyle}
        `}
    >
        {dropPosition === 'top' && (
            <div className="absolute -top-1 left-0 right-0 h-1 bg-violet-500 rounded-full z-10 pointer-events-none animate-in fade-in duration-150"></div>
        )}
        
      <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-300 hover:text-slate-400 cursor-grab active:cursor-grabbing"><GripVertical size={12} /></div>
        <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white' : 'border-slate-300 hover:border-violet-500 text-transparent'}`}>
          <CheckSquare size={10} fill={task.completed ? "currentColor" : "none"} />
        </button>
        <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
          <div className="flex justify-between items-start">
             {format === 'timeline' ? (
                 <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-xs font-bold truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${categoryStyle}`}>
                        {task.category}
                    </span>
                 </div>
             ) : (
                 <p className={`text-xs font-bold truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {task.title}
                 </p>
             )}
             {showWarning && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 animate-pulse" title="时间冲突" />}
          </div>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {format !== 'timeline' && (
               <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${categoryStyle}`}>{task.category}</span>
            )}
            {task.priority && priorityConfig.label && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${priorityConfig.color}`}>
                    {priorityConfig.label}
                </span>
            )}
            {format !== 'timeline' && showTime && task.time && <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono bg-slate-50 px-1 rounded"><Clock size={8} /> {task.time}</span>}
          </div>
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/80 rounded-lg backdrop-blur-sm">
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-slate-400 hover:text-violet-500 p-1" title="编辑"><Edit3 size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-slate-400 hover:text-red-500 p-1" title="删除"><Trash2 size={12} /></button>
        </div>
      </div>

      {dropPosition === 'bottom' && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-violet-500 rounded-full z-10 pointer-events-none animate-in fade-in duration-150"></div>
      )}
    </div>
  );
};

const HabitTracker = ({ habits, onUpdate, onAdd, onDelete }) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Generate all days in the current month
    const daysInMonth = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
        daysInMonth.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    
    const [newHabit, setNewHabit] = useState('');
    const [newHabitTarget, setNewHabitTarget] = useState(daysInMonth.length);

    const toggleHabit = (habitId, dateStr) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        const isCompleted = habit.completed?.includes(dateStr);
        let newCompleted = [...(habit.completed || [])];
        
        if (isCompleted) {
            newCompleted = newCompleted.filter(d => d !== dateStr);
        } else {
            newCompleted.push(dateStr);
        }
        onUpdate(habitId, { completed: newCompleted });
    };

    const handleUpdateField = (id, field, value) => {
        onUpdate(id, { [field]: value });
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if(!newHabit.trim()) return;
        onAdd({ 
            name: newHabit.trim(), 
            target: newHabitTarget || daysInMonth.length,
            reward: ''
        });
        setNewHabit('');
    };

    // Filter completions for current month to calculate progress correctly
    const getCurrentMonthCompletedCount = (completedDates) => {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        return (completedDates || []).filter(d => d.startsWith(prefix)).length;
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Habit Tracker ({today.toLocaleString('default', { month: 'long' })})</h3>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar pb-4">
                <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2 min-w-[150px] sticky left-0 bg-white z-20">习惯养成</th>
                            <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2 min-w-[80px]">目标</th>
                            <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2 min-w-[60px]">完成</th>
                            <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-2 min-w-[100px]">进度</th>
                            {daysInMonth.map((d, i) => (
                                <th key={i} className="text-center pb-4 px-1 min-w-[40px]">
                                    <div className={`flex flex-col items-center ${getLocalDateString(d) === getLocalDateString(today) ? 'text-violet-600 bg-violet-50 rounded-lg p-1' : 'text-slate-400'}`}>
                                        <span className="text-[9px] font-bold uppercase">{d.toLocaleDateString('default', {weekday: 'narrow'})}</span>
                                        <span className="text-xs font-bold">{d.getDate()}</span>
                                    </div>
                                </th>
                            ))}
                            <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider pb-4 px-4 min-w-[150px]">完成奖励</th>
                            <th className="w-10 pb-4"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {habits.map(habit => {
                            const completedCount = getCurrentMonthCompletedCount(habit.completed);
                            const target = habit.target || daysInMonth.length;
                            const progress = Math.min(100, Math.round((completedCount / target) * 100));

                            return (
                                <tr key={habit.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                    <td className="py-3 px-2 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{habit.name}</td>
                                    
                                    {/* Target Input */}
                                    <td className="py-3 px-2 text-center">
                                        <input 
                                            type="number" 
                                            value={habit.target || daysInMonth.length} 
                                            onChange={(e) => handleUpdateField(habit.id, 'target', parseInt(e.target.value))}
                                            className="w-12 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-violet-500 outline-none text-slate-600 font-medium"
                                        />
                                    </td>

                                    {/* Completed Count */}
                                    <td className="py-3 px-2 text-center font-bold text-emerald-600">{completedCount}</td>

                                    {/* Progress Bar */}
                                    <td className="py-3 px-2 text-center">
                                        <div className="flex items-center gap-2 justify-center">
                                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold">{progress}%</span>
                                        </div>
                                    </td>

                                    {/* Date Checkboxes */}
                                    {daysInMonth.map((d, i) => {
                                        const dateStr = getLocalDateString(d);
                                        const isDone = habit.completed?.includes(dateStr);
                                        return (
                                            <td key={i} className="text-center py-3 px-1">
                                                <button 
                                                    onClick={() => toggleHabit(habit.id, dateStr)}
                                                    className={`w-5 h-5 rounded flex items-center justify-center transition-all mx-auto ${isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-transparent hover:border-emerald-300'}`}
                                                >
                                                    <CheckSquare size={12} fill={isDone ? "currentColor" : "none"}/>
                                                </button>
                                            </td>
                                        );
                                    })}

                                    {/* Reward Input */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <Gift size={14} className={habit.reward ? "text-rose-400" : "text-slate-300"}/>
                                            <input 
                                                type="text" 
                                                value={habit.reward || ''} 
                                                onChange={(e) => handleUpdateField(habit.id, 'reward', e.target.value)}
                                                placeholder="Set reward..."
                                                className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none text-xs text-slate-600 placeholder-slate-300"
                                            />
                                        </div>
                                    </td>

                                    <td className="text-right py-3 px-2">
                                        <button onClick={() => onDelete(habit.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {habits.length === 0 && (
                            <tr><td colSpan={daysInMonth.length + 6} className="text-center text-slate-400 py-8 italic text-xs">Start building good habits today! Add one below.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <form onSubmit={handleAdd} className="mt-6 flex gap-3 border-t border-slate-50 pt-4">
                <input 
                    type="text" 
                    value={newHabit} 
                    onChange={e => setNewHabit(e.target.value)} 
                    placeholder="New habit name..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-emerald-500 transition-all"
                />
                <input 
                    type="number" 
                    value={newHabitTarget}
                    onChange={e => setNewHabitTarget(parseInt(e.target.value))}
                    placeholder="Target days"
                    className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-emerald-500 transition-all text-center"
                    title="Target Days"
                />
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2"><Plus size={16}/> Add Habit</button>
            </form>
        </div>
    );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate, defaultTime, categories, setCategories }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '工作');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryColor, setCustomCategoryColor] = useState(CATEGORY_COLORS[0].value);
  const [priority, setPriority] = useState(''); // Optional, default empty
  const [time, setTime] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTime(defaultTime || '');
      setCategory(categories[0]?.name || '工作');
      setPriority('');
      setIsCustomCategory(false);
      setCustomCategoryColor(CATEGORY_COLORS[0].value);
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
        const exists = categories.find(c => c.name === finalCategory);
        if (!exists) {
            setCategories([...categories, { name: finalCategory, color: customCategoryColor }]);
        }
    }

    onAdd({ title, category: finalCategory, time, date: defaultDate, priority });
    onClose();
  };

  const togglePriority = (key) => {
      if (priority === key) {
          setPriority('');
      } else {
          setPriority(key);
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="relative">
                          <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="新类别" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pr-8 text-sm outline-none focus:border-violet-500" autoFocus/>
                          <button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={14}/></button>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                          {CATEGORY_COLORS.map((col) => (
                              <button 
                                key={col.id} 
                                type="button" 
                                onClick={() => setCustomCategoryColor(col.value)}
                                className={`w-4 h-4 rounded-full border ${col.value.split(' ')[0]} ${customCategoryColor === col.value ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                              />
                          ))}
                      </div>
                    </div>
                  ) : (
                     <div className="flex gap-2 w-full items-start">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-violet-500 appearance-none">
                            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
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

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">优先级 (可选)</label>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRIORITIES).map(([key, config]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => togglePriority(key)}
                        className={`text-xs p-2 rounded-lg border transition-all text-center ${priority === key ? config.color + ' ring-2 ring-offset-1 ring-slate-200' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                        {config.label}
                    </button>
                ))}
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

const DayPreviewModal = ({ isOpen, onClose, dateStr, tasks, onToggle, onUpdate, onDelete, categories }) => {
    if (!isOpen) return null;
    const dayTasks = sortTasksByTime(tasks.filter(t => t.date === dateStr));
    
    // Inline edit states
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editCategory, setEditCategory] = useState('');

    const startEdit = (task) => {
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditCategory(task.category);
    };

    const saveEdit = () => {
        if (editTitle.trim()) {
            onUpdate(editingId, { title: editTitle, category: editCategory });
        }
        setEditingId(null);
    };

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
                            <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                                <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${task.completed ? 'bg-violet-500 border-violet-500 text-white' : 'bg-white border-slate-300'}`}>
                                    <CheckSquare size={12} fill={task.completed ? "currentColor" : "none"}/>
                                </button>
                                
                                {editingId === task.id ? (
                                    <div className="flex-1 space-y-2">
                                        <input 
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded p-1.5 text-sm outline-none focus:border-violet-500"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <select 
                                                value={editCategory}
                                                onChange={e => setEditCategory(e.target.value)}
                                                className="flex-1 text-xs bg-white border border-slate-200 rounded p-1 outline-none"
                                            >
                                                 {(categories || ['工作', '生活', '健康', '学习']).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <button onClick={saveEdit} className="p-1.5 bg-violet-500 text-white rounded hover:bg-violet-600"><Save size={12}/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <span className={`text-sm font-medium break-words ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-100 text-slate-500">{task.category}</span>
                                            {task.time && <span className="text-xs text-slate-400 font-mono">{task.time}</span>}
                                        </div>
                                    </div>
                                )}

                                {editingId !== task.id && (
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(task)} className="p-1 text-slate-400 hover:text-violet-500"><Edit3 size={14}/></button>
                                        <button onClick={() => onDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Views ---

const DashboardView = ({ tasks, onAddTask, user, openAddModal, toggleTask, deleteTask, onUpdate, moveTask, categoryColors, categories, habits, onUpdateHabit, onAddHabit, onDeleteHabit }) => {
    const todayStr = getLocalDateString(new Date());
    const todaysTasks = sortTasksByTime(tasks.filter(t => t.date === todayStr));
    const catStats = {};
    todaysTasks.forEach(t => { if(!catStats[t.category]) catStats[t.category] = { total: 0, completed: 0 }; catStats[t.category].total++; if(t.completed) catStats[t.category].completed++; });

    const containerHeight = "h-[28rem]";

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-24">
        <header>
            <h2 className="text-3xl font-black text-slate-800">Dashboard</h2>
            <p className="text-slate-500 font-medium">Welcome back, <span className="text-violet-600">{user?.email?.split('@')[0] || 'Commander'}</span></p>
        </header>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden ${containerHeight}`}>
                <div className="flex justify-between items-center p-6 pb-2 shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="text-rose-500"/> Today's Focus</h3>
                    <button onClick={() => openAddModal(todayStr)} className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-700"><Plus size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar space-y-2">
                    {todaysTasks.length === 0 ? <div className="text-center text-slate-400 py-10">No tasks for today.</div> : todaysTasks.map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} moveTask={moveTask} categoryColors={categoryColors} categories={categories} setCategories={null}/>
                    ))}
                </div>
            </div>
            
            <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-y-auto custom-scrollbar ${containerHeight}`}>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6"><PieChart className="text-blue-500"/> Analysis</h3>
                <div className="space-y-4">
                    {Object.entries(catStats).map(([cat, stat]) => (
                        <div key={cat}><div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{cat}</span><span>{stat.completed}/{stat.total}</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{width: `${(stat.completed/stat.total)*100}%`}}></div></div></div>
                    ))}
                </div>
            </div>
        </div>

        <HabitTracker habits={habits} onUpdate={onUpdateHabit} onAdd={onAddHabit} onDelete={onDeleteHabit} />
      </div>
    );
};

const WealthJarView = ({ balances, setBalances, wealthConfig, setWealthConfig, transactions = [], setTransactions }) => {
    // ... (Existing WealthJarView logic retained for brevity as it was perfect)
    const [income, setIncome] = useState('');
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });
    const [isCustomCat, setIsCustomCat] = useState(false);
    const [showGraph, setShowGraph] = useState(false);
    const [isAddJarOpen, setIsAddJarOpen] = useState(false);
    const [newJarForm, setNewJarForm] = useState({ label: '', percent: '' });
    const [editingTxId, setEditingTxId] = useState(null);
    const defaultTxCats = ['饮食', '交通', '购物', '订阅', '医疗', '其他'];
    const usedTxCats = Array.from(new Set([...defaultTxCats, ...transactions.map(t => t.category)]));
    const handleAddJar = (e) => { e.preventDefault(); const { label, percent } = newJarForm; if (!label || !percent) return; const newJar = { id: generateId(), label, percent: parseFloat(percent), color: 'bg-slate-100 text-slate-600' }; setWealthConfig({ ...wealthConfig, jars: [...wealthConfig.jars, newJar] }); setNewJarForm({ label: '', percent: '' }); setIsAddJarOpen(false); };
    const handleDistribute = (e) => { e.preventDefault(); const amt = parseFloat(income); if (isNaN(amt) || amt <= 0) return; const commit = wealthConfig.showCommitment ? (wealthConfig.commitment || 0) : 0; const netIncome = Math.max(0, amt - commit); const newBalances = { ...balances }; const newTransactions = [...transactions]; newTransactions.unshift({ id: Date.now(), amount: amt, category: '收入', remark: '手动录入', date: getLocalDateString(new Date()), type: 'income' }); if (wealthConfig.showCommitment && commit > 0) { newBalances.commitment = (newBalances.commitment || 0) + commit; newTransactions.unshift({ id: Date.now() + 1, amount: -commit, category: '固定开销', remark: '自动扣除', date: getLocalDateString(new Date()), type: 'expense' }); } wealthConfig.jars.forEach(jar => { const share = netIncome * (jar.percent / 100); newBalances[jar.id] = (newBalances[jar.id] || 0) + share; }); setBalances(newBalances); setTransactions(newTransactions); setIncome(''); };
    const submitTransaction = (e) => { e.preventDefault(); if(!expenseForm.amount || !expenseForm.category) return; let finalAmount = parseFloat(expenseForm.amount); if (expenseForm.category !== '收入') { finalAmount = -Math.abs(finalAmount); } else { finalAmount = Math.abs(finalAmount); } if (editingTxId) { const updated = transactions.map(t => t.id === editingTxId ? { ...t, ...expenseForm, amount: finalAmount } : t); setTransactions(updated); setEditingTxId(null); } else { const newTx = { id: Date.now(), ...expenseForm, amount: finalAmount }; setTransactions([newTx, ...transactions]); } setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) }); setIsCustomCat(false); };
    const deleteJar = (id) => { const newBalances = { ...balances }; delete newBalances[id]; setBalances(newBalances); setWealthConfig({ ...wealthConfig, jars: wealthConfig.jars.filter(j => j.id !== id) }); };
    const restoreCommitment = () => { const val = prompt("输入固定开销金额 (RM):", "2000"); if (val !== null) { setWealthConfig({ ...wealthConfig, showCommitment: true, commitment: parseFloat(val) || 0 }); } };
    const startEditTx = (tx) => { setEditingTxId(tx.id); setExpenseForm({ amount: Math.abs(tx.amount).toString(), category: tx.category, remark: tx.remark || '', date: tx.date }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const deleteTx = (id) => { setTransactions(transactions.filter(t => t.id !== id)); if (editingTxId === id) { setEditingTxId(null); setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) }); } };
    const getSavingsTotal = () => { let total = 0; wealthConfig.jars.forEach(jar => { const label = jar.label.toLowerCase(); if (label.includes('savings') || label.includes('invest') || label.includes('储蓄') || label.includes('投资')) { total += (balances[jar.id] || 0); } }); return total; };
    const netTransactionTotal = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const groupedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).reduce((groups, tx) => { const date = tx.date; if (!groups[date]) groups[date] = []; groups[date].push(tx); return groups; }, {});
    const barData = usedTxCats.map(cat => { const catTxs = transactions.filter(t => t.category === cat); const total = catTxs.reduce((acc, t) => acc + t.amount, 0); return { name: cat, value: total }; }).filter(d => d.value !== 0);
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

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, onUpdate, onDelete, categories }) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
    
    const [previewDate, setPreviewDate] = useState(null);

    return (
      <div className="flex flex-col animate-fade-in pb-20 md:pb-0">
        <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Calendar</h2>
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronLeft size={20}/></button><span className="px-4 py-2 font-bold text-slate-700 text-sm flex items-center">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition text-slate-400 hover:text-slate-800"><ChevronRight size={20}/></button></div>
        </div>
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (<div key={d} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>))}</div>
          <div className="grid grid-cols-7 auto-rows-auto bg-slate-50 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // Sort tasks for calendar view (Fix 2)
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
        <DayPreviewModal isOpen={!!previewDate} onClose={() => setPreviewDate(null)} dateStr={previewDate} tasks={tasks} onToggle={toggleTask} onUpdate={onUpdate} onDelete={onDelete} categories={categories} />
      </div>
    );
};

const TimelineView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, onUpdate, moveTask, categoryColors, categories, onCloneYesterday }) => {
    const hours = [...Array.from({length: 18}, (_, i) => i + 6), 0]; 
    const dateStr = getLocalDateString(currentDate);
    const [clonePickerOpen, setClonePickerOpen] = useState(false);
    
    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0 bg-white/50 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white rounded-t-3xl sticky top-0 z-10">
            {/* Removed "Timeline" Title */}
            <div>
               <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{currentDate.toLocaleDateString('default', {weekday: 'long'})}</h2>
               <p className="text-slate-500 font-bold text-lg">{currentDate.toLocaleDateString('default', {day: 'numeric', month: 'long'})}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex gap-2 relative">
                   {/* Clone Yesterday Button */}
                   <button 
                       onClick={() => onCloneYesterday(dateStr)} 
                       className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-violet-100 hover:text-violet-600 transition-all text-xs whitespace-nowrap"
                       title="Copy tasks from yesterday"
                   >
                       <Copy size={14}/> Yesterday
                   </button>
                   
                   {/* Clone From Button */}
                   <button 
                        onClick={() => setClonePickerOpen(!clonePickerOpen)} 
                        className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-violet-100 hover:text-violet-600 transition-all text-xs whitespace-nowrap"
                        title="Copy tasks from a specific date"
                   >
                       <CalendarDays size={14}/> From...
                   </button>
                   {clonePickerOpen && (
                       <input 
                         type="date" 
                         className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-50"
                         onChange={(e) => { 
                             if(e.target.value) {
                                 onCloneYesterday(dateStr, e.target.value); 
                                 setClonePickerOpen(false);
                             }
                         }}
                         autoFocus
                         onBlur={() => setTimeout(() => setClonePickerOpen(false), 200)}
                       />
                   )}
                </div>
                
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                    <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate()-1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronLeft size={16}/></button>
                    {/* Fixed width to min-w to avoid cutting off */}
                    <input 
                        type="date" 
                        value={dateStr}
                        onChange={(e) => setCurrentDate(new Date(e.target.value))}
                        className="bg-transparent font-bold text-xs px-1 outline-none text-slate-600 min-w-[100px] text-center cursor-pointer"
                    />
                    <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate()+1)))} className="p-2 hover:bg-white rounded-lg transition text-slate-400 shadow-sm"><ChevronRight size={16}/></button>
                </div>
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
                          {hourTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} moveTask={moveTask} categoryColors={categoryColors} categories={categories} setCategories={categories.setCategories} showWarning={false} showTime={false} format="timeline" />))}
                          {hourTasks.length < 5 && (
                              <button onClick={() => openAddModal(dateStr, timeLabel)} className="text-left text-slate-300 text-base font-medium hover:text-violet-500 flex items-center gap-2 w-full transition-all py-2 h-full"><Plus size={16} className="opacity-50"/> {hourTasks.length === 0 ? "Add focus" : "Add more..."}</button>
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

// --- FIXED: Review Components extracted to top level & Updated with Textarea and Checkbox ---
const ReviewInput = ({ value, onChange, placeholder, color, showCheckbox, disabled }) => {
    // Handle backward compatibility where value might be just a string
    const text = (value && typeof value === 'object') ? value.text : value;
    const checked = (value && typeof value === 'object') ? value.checked : false;

    if (disabled) return null;

    return (
        <div className="flex items-start gap-3 mb-2 group animate-in fade-in slide-in-from-top-2 duration-300">
           {showCheckbox && (
               <button
                 onClick={() => onChange({ text: text || '', checked: !checked })}
                 className={`mt-3 w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${checked ? `bg-${color}-500 border-${color}-500 text-white` : 'bg-white border-slate-300'}`}
               >
                 <CheckSquare size={12} fill={checked ? "currentColor" : "none"}/>
               </button>
           )}
           <textarea
             value={text || ''}
             onChange={(e) => onChange({ text: e.target.value, checked })}
             placeholder={placeholder}
             rows={1}
             onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
             className={`flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-${color}-500 focus:bg-white transition-all text-sm font-medium resize-none overflow-hidden min-h-[46px]`}
           />
        </div>
    );
};

const ReviewSection = ({ title, icon, color, data, field, onChange, count = 3, showCheckbox = false, sequentialUnlock = false }) => {
    return (
        <div className={`p-5 rounded-3xl border bg-white border-slate-100 shadow-sm`}>
            <h4 className={`font-black text-${color}-500 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs`}>{icon} {title}</h4>
            {Array.from({ length: count }).map((_, i) => {
                // Sequential unlock logic:
                // Item 0, 1, 2 (first 3) always shown
                // Item 3 (4th) shown if items 0, 1, 2 are all checked
                // Item 4 (5th) shown if item 3 is checked
                let isVisible = true;
                if (sequentialUnlock && i >= 3) {
                    if (i === 3) {
                        // Show 4th if first 3 are checked
                        const firstThreeChecked = data[0]?.checked && data[1]?.checked && data[2]?.checked;
                        if (!firstThreeChecked) isVisible = false;
                    } else if (i > 3) {
                        // Show subsequent items if previous one is checked
                        if (!data[i-1]?.checked) isVisible = false;
                    }
                }

                return (
                    <ReviewInput 
                        key={i} 
                        value={data[i]} 
                        onChange={(val) => onChange(field, i, val)} 
                        placeholder={`Item ${i+1}`} 
                        color={color} 
                        showCheckbox={showCheckbox}
                        disabled={!isVisible} 
                    />
                );
            })}
        </div>
    );
};

const ReviewView = ({ reviews, onUpdateReview, startYearDate }) => {
    const [activeTab, setActiveTab] = useState('daily');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0 - 11
    const [subCycle, setSubCycle] = useState(0); // 0, 1, 2
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));

    const dailyData = reviews?.daily?.[selectedDate] || { keep: [], improve: [], start: [], stop: [] };
    
    // Calculate global cycle ID: Month * 3 + subCycle + 1 (simplified mapping for UI)
    const activeGlobalCycleId = (selectedMonth * 3) + subCycle + 1;
    const cycleData = reviews?.cycle?.[activeGlobalCycleId] || { plan: [], do: [], adjust: [], check: [], aar: [] };
    const yearlyGoals = reviews?.yearly || { education: [], family: [], financial: [], business: [], health: [], breakthrough: [], experience: [] };

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
        const list = [...(dailyData[field] || [])];
        while (list.length <= idx) { list.push({ text: '', checked: false }); }
        list[idx] = val;
        const sanitizedList = list.map(item => item === undefined ? { text: '', checked: false } : item);
        const newData = { ...reviews, daily: { ...(reviews.daily || {}), [selectedDate]: { ...dailyData, [field]: sanitizedList } } };
        onUpdateReview(newData);
    };

    const handleCycleChange = (field, idx, val) => {
        const list = [...(cycleData[field] || [])];
        while (list.length <= idx) { list.push({ text: '', checked: false }); }
        list[idx] = val;
        const sanitizedList = list.map(item => item === undefined ? { text: '', checked: false } : item);
        const newData = { ...reviews, cycle: { ...(reviews.cycle || {}), [activeGlobalCycleId]: { ...cycleData, [field]: sanitizedList } } };
        onUpdateReview(newData);
    };

    const handleYearlyChange = (field, idx, val) => {
        const list = [...(yearlyGoals[field] || [])];
        // Allow up to 10 items to support potential expansion, logic handles visibility
        while (list.length <= idx) { list.push({ text: '', checked: false }); }
        list[idx] = val;
        const sanitizedList = list.map(item => item === undefined ? { text: '', checked: false } : item);
        const newData = { ...reviews, yearly: { ...yearlyGoals, [field]: sanitizedList } };
        onUpdateReview(newData);
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-fade-in">
            <header className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black text-slate-800">Review</h2><p className="text-slate-500 font-medium">Reflect and Evolve</p></div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {['daily', 'cycle', 'yearly'].map(t => (
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
            ) : activeTab === 'cycle' ? (
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
                            <ReviewSection title="Plan (计划)" icon={<Target size={14}/>} color="blue" data={cycleData.plan || []} field="plan" onChange={handleCycleChange} count={5} showCheckbox={true}/>
                            <ReviewSection title="Do (执行)" icon={<Zap size={14}/>} color="violet" data={cycleData.do || []} field="do" onChange={handleCycleChange} count={5}/>
                            <ReviewSection title="Adjust (调整)" icon={<RefreshCw size={14}/>} color="amber" data={cycleData.adjust || []} field="adjust" onChange={handleCycleChange} count={5}/>
                            <ReviewSection title="Check (检查)" icon={<ClipboardList size={14}/>} color="emerald" data={cycleData.check || []} field="check" onChange={handleCycleChange} count={5}/>
                        </div>
                        
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                             <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs"><Flag size={14} className="text-rose-400"/> AAR (After Action Review)</h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[0, 1, 2].map(i => (
                                    <input key={i} value={(cycleData.aar || [])[i]?.text || (cycleData.aar || [])[i] || ''} onChange={(e) => handleCycleChange('aar', i, { text: e.target.value, checked: false })} placeholder={`Key Insight ${i+1}...`} className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all text-sm text-white placeholder-slate-500"/>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <ReviewSection title="Education (学习)" icon={<GraduationCap size={16}/>} color="blue" data={yearlyGoals.education || []} field="education" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                         <ReviewSection title="Family (家庭)" icon={<Users size={16}/>} color="rose" data={yearlyGoals.family || []} field="family" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                         <ReviewSection title="Financial (财务)" icon={<DollarSign size={16}/>} color="emerald" data={yearlyGoals.financial || []} field="financial" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                         <ReviewSection title="Business (事业)" icon={<Briefcase size={16}/>} color="violet" data={yearlyGoals.business || []} field="business" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                         <ReviewSection title="Health (健康)" icon={<Heart size={16}/>} color="red" data={yearlyGoals.health || []} field="health" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                         <ReviewSection title="BreakThrough (突破)" icon={<TrendingUp size={16}/>} color="amber" data={yearlyGoals.breakthrough || []} field="breakthrough" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                         <ReviewSection title="Experience (体验)" icon={<Globe size={16}/>} color="cyan" data={yearlyGoals.experience || []} field="experience" onChange={handleYearlyChange} count={5} showCheckbox={true} sequentialUnlock={true}/>
                    </div>
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
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(getLocalDateString(new Date()));
  const [selectedTimeForAdd, setSelectedTimeForAdd] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  // Updated: categories now store objects {name, color}
  const [categories, setCategories] = useState([
      { name: '工作', color: 'bg-blue-100 text-blue-600 border-blue-200' },
      { name: '生活', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
      { name: '健康', color: 'bg-orange-100 text-orange-600 border-orange-200' },
      { name: '学习', color: 'bg-violet-100 text-violet-600 border-violet-200' }
  ]);
  const [tasks, setTasks] = useState([]);
  const [startYearDate, setStartYearDate] = useState(new Date().getFullYear() + '-01-01');
  const [wealthBalances, setWealthBalances] = useState({ commitment: 0 });
  const [wealthTransactions, setWealthTransactions] = useState([]);
  const [wealthConfig, setWealthConfig] = useState({ yearlyTarget: 100000, commitment: 2000, showCommitment: true, jars: [] });
  const [reviews, setReviews] = useState({ daily: {}, cycle: {}, yearly: {} });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // New: Habit Tracker State
  const [habits, setHabits] = useState([]);

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
          // Ensure categories are loaded and formatted correctly
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'categories'), d => {
              if (d.exists()) {
                  const list = d.data().list || [];
                  // Migration check: if strings, convert to objects
                  const formatted = list.map(c => typeof c === 'string' ? { name: c, color: 'bg-slate-100 text-slate-600 border-slate-200' } : c);
                  setCategories(formatted);
              }
          }, () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'habits'), d => d.exists() && setHabits(d.data().list || []), () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth_v2'), d => {
              if(d.exists()) { 
                const data = d.data(); 
                setWealthBalances(data.balances || {}); 
                setWealthTransactions(data.transactions || []); 
                if(data.config) setWealthConfig(data.config); 
              } else {
                getDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth')).then(v1 => {
                    if(v1.exists()) {
                        const oldData = v1.data();
                        setWealthBalances(oldData.balances || {});
                        setWealthTransactions(oldData.transactions || []);
                        if(oldData.config) setWealthConfig(oldData.config);
                    }
                });
              }
          }, () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'reviews'), d => d.exists() && setReviews(d.data() || { daily: {}, cycle: {}, yearly: {} }), () => {}));
          
          setIsLoaded(true);
          return () => unsubs.forEach(u => u());
      } else { loadLocalStorage(); }
  }, [user]);

  const saveData = (type, data) => { if(user) { setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', type), data); } else { localStorage.setItem(`planner_${type}`, JSON.stringify(data)); } };
  
  useEffect(() => { if(isLoaded) saveData('tasks', { list: tasks }); }, [tasks, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('categories', { list: categories }); }, [categories, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('habits', { list: habits }); }, [habits, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('wealth_v2', { balances: wealthBalances, transactions: wealthTransactions, config: wealthConfig }); }, [wealthBalances, wealthTransactions, wealthConfig, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('reviews', reviews); }, [reviews, isLoaded]);

  const loadLocalStorage = () => {
      try {
          const t = localStorage.getItem('planner_tasks'); if(t) setTasks(JSON.parse(t).list || []);
          
          const c = localStorage.getItem('planner_categories'); 
          if(c) {
              const list = JSON.parse(c).list || [];
              const formatted = list.map(item => typeof item === 'string' ? { name: item, color: 'bg-slate-100 text-slate-600 border-slate-200' } : item);
              setCategories(formatted);
          }
          
          const h = localStorage.getItem('planner_habits'); if(h) setHabits(JSON.parse(h).list || []);
          const w = localStorage.getItem('planner_wealth_v2'); if(w) { const d = JSON.parse(w); setWealthBalances(d.balances || {}); setWealthTransactions(d.transactions || []); if(d.config) setWealthConfig(d.config); }
          const r = localStorage.getItem('planner_reviews'); if(r) setReviews(JSON.parse(r) || { daily: {}, cycle: {}, yearly: {} });
          setIsLoaded(true);
      } catch(e) { console.error(e); }
  }
  
  const addTask = (newTask) => setTasks([...tasks, { id: Date.now(), completed: false, ...newTask }]);
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  
  // New: Update Task Logic for editing
  const updateTask = (id, updates) => setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));

  // New: Move Task Logic for Drag and Drop
  const moveTask = (dragId, targetId, position) => {
      const dragIndex = tasks.findIndex(t => t.id === dragId || t.id === parseInt(dragId));
      const targetIndex = tasks.findIndex(t => t.id === targetId || t.id === parseInt(targetId));
      
      if (dragIndex >= 0 && targetIndex >= 0 && dragIndex !== targetIndex) {
          const newTasks = [...tasks];
          const [draggedItem] = newTasks.splice(dragIndex, 1);
          
          let insertIndex = targetIndex;
          // If inserting 'below' the target, we need to adjust the index.
          // Note: if dragIndex < targetIndex, removing the item shifts the target index down by 1,
          // so we might need logic adjustment. But 'splice' modifies array in place.
          
          // Re-find target index after splice as it might have shifted
          const newTargetIndex = newTasks.findIndex(t => t.id === targetId || t.id === parseInt(targetId));
          
          if (position === 'bottom') {
              insertIndex = newTargetIndex + 1;
          } else {
              insertIndex = newTargetIndex;
          }
          
          newTasks.splice(insertIndex, 0, draggedItem);
          setTasks(newTasks);
      }
  };
  
  // Clone Function with Source Date
  const cloneYesterdayTasks = (targetDateStr, sourceDateStr) => {
      const sourceDate = sourceDateStr ? new Date(sourceDateStr) : new Date(new Date(targetDateStr).setDate(new Date(targetDateStr).getDate() - 1));
      const realSourceStr = sourceDateStr || getLocalDateString(sourceDate);
      
      const tasksToClone = tasks.filter(t => t.date === realSourceStr);
      if (tasksToClone.length === 0) { alert(`No tasks found on ${realSourceStr} to clone!`); return; }
      
      const clonedTasks = tasksToClone.map(t => ({
          ...t,
          id: generateId(), // New ID
          date: targetDateStr, // New Date
          completed: false // Reset completion
      }));
      
      setTasks(prev => [...prev, ...clonedTasks]);
      // alert(`Cloned ${clonedTasks.length} tasks from ${realSourceStr}`);
  };
  
  // Habit functions
  const updateHabit = (id, updates) => setHabits(habits.map(h => h.id === id ? { ...h, ...updates } : h));
  const addHabit = (habit) => setHabits([...habits, { id: generateId(), completed: [], ...habit }]);
  const deleteHabit = (id) => setHabits(habits.filter(h => h.id !== id));

  const openAddModal = (dateStr, timeStr) => { setSelectedDateForAdd(dateStr || getLocalDateString(new Date())); setSelectedTimeForAdd(timeStr || ''); setIsModalOpen(true); };

  // categoryColors is kept for backward compatibility if needed, but primary source is now categories state
  const catColors = {'工作': 'bg-blue-100 text-blue-600', '生活': 'bg-emerald-100 text-emerald-600', '健康': 'bg-orange-100 text-orange-600', '学习': 'bg-violet-100 text-violet-600', 'default': 'bg-slate-100 text-slate-600'};

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 shadow-2xl md:shadow-none transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-10 tracking-tight"><div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200"><Layout size={20} /></div>Planner<span className="text-violet-600">.AI</span></div>
          <nav className="space-y-1.5">{[{ id: 'focus', label: 'Dashboard', icon: Home }, { id: 'wealth', label: 'Wealth Jar', icon: Database }, { id: 'calendar', label: 'Calendar', icon: CalIcon }, { id: 'kanban', label: 'Timeline', icon: Trello }, { id: 'review', label: 'Review', icon: ClipboardList }].map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm tracking-wide ${view === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}><item.icon size={18} className={view === item.id ? "text-violet-300" : ""}/>{item.label}</button>
            ))}</nav>
        </div>
        <div className="mt-auto p-8">{user ? (<div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-900 truncate">{user.email ? user.email.split('@')[0] : 'Commander'}</div><button onClick={() => signOut(auth)} className="text-[10px] text-red-500 hover:underline">Log Out</button></div></div>) : 
            (<button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800"><LogIn size={14} /> Login</button>)}</div>
      </aside>
      <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-slate-50">
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 z-30"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={24} /></button><span className="font-black text-slate-800 tracking-widest text-sm uppercase">{view}</span><button onClick={() => openAddModal()} className="text-violet-600 p-2"><Plus size={24} /></button></header>
        <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar md:pb-10 relative">
          {view === 'focus' && <DashboardView tasks={tasks} onAddTask={addTask} user={user} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} moveTask={moveTask} categoryColors={catColors} categories={categories} habits={habits} onUpdateHabit={updateHabit} onAddHabit={addHabit} onDeleteHabit={deleteHabit} />}
          {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances} wealthConfig={wealthConfig} setWealthConfig={setWealthConfig} transactions={wealthTransactions} setTransactions={setWealthTransactions}/>}
          {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} onUpdate={updateTask} onDelete={deleteTask} categories={categories} />}
          {view === 'kanban' && <TimelineView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} moveTask={moveTask} categoryColors={catColors} categories={categories} onCloneYesterday={cloneYesterdayTasks} />}
          {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={setReviews} startYearDate={startYearDate}/>}
        </div>
      </main>
      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={selectedDateForAdd} defaultTime={selectedTimeForAdd} categories={categories} setCategories={setCategories}/>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }.animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }`}</style>
    </div>
  );
}
