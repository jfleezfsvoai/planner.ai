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
  Check, Edit, Repeat
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection } from "firebase/firestore";

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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-planner-app';

// --- Constants ---
const PRIORITIES = {
    'urgent_important': { label: {zh: '紧急重要', en: 'Urgent & Important'}, color: 'bg-rose-500 text-white' },
    'important_not_urgent': { label: {zh: '重要不紧急', en: 'Important, Not Urgent'}, color: 'bg-amber-500 text-white' }
};

const LABEL_COLORS = [
    'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300',
    'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300',
    'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300',
    'bg-cyan-100 text-cyan-600 border-cyan-200 dark:bg-cyan-500/20 dark:border-cyan-500/30 dark:text-cyan-300',
    'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300',
    'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300',
    'bg-pink-100 text-pink-600 border-pink-200 dark:bg-pink-500/20 dark:border-pink-500/30 dark:text-pink-300'
];

// --- Utils ---
const getLocalDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Sub-Components ---

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate, categories, onAddCategory, prefilledTime = "", t }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || t('工作', 'Work'));
  const [priority, setPriority] = useState('');
  const [time, setTime] = useState(prefilledTime);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => { 
      if (isOpen) { 
          setTitle(''); 
          setTime(prefilledTime); 
          setPriority('');
          setIsRecurring(false);
      } 
  }, [isOpen, prefilledTime]);
  
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, category, priority, time, date: defaultDate, recurring: isRecurring ? 'daily' : 'none' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white dark:border-slate-700 animate-in zoom-in-95 duration-200">
        <div className="p-8 pb-0 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('新建任务', 'New Task')}</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-1">{t('任务描述', 'Task Description')}</label>
            <input 
              type="text" value={title} onChange={e => setTitle(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-base outline-none focus:border-indigo-500 dark:text-slate-100 transition-all"
              placeholder={t('需要做什么？', 'What needs to be done?')} autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 ml-1">{t('分类', 'Category')}</label>
              <div className="flex gap-2">
                <select 
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none dark:text-slate-100"
                >
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <button 
                  type="button" onClick={() => setShowNewCatInput(!showNewCatInput)}
                  className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors"
                >
                  <Plus size={20}/>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 ml-1">{t('时间', 'Time')}</label>
              <input 
                type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none dark:text-slate-100"
              />
            </div>
          </div>

          {showNewCatInput && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex gap-2 animate-in fade-in slide-in-from-top-2">
              <input 
                value={newCatName} onChange={e => setNewCatName(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/30 rounded-lg px-3 text-sm outline-none dark:text-slate-100"
                placeholder={t('输入新分类名称', 'New category name')}
              />
              <button 
                type="button" onClick={() => { if(newCatName) { onAddCategory(newCatName); setNewCatName(''); setShowNewCatInput(false); setCategory(newCatName); } }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                {t('添加', 'Add')}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-1">{t('优先级 (可选)', 'Priority (Optional)')}</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRIORITIES).map(([key, val]) => (
                <button 
                  key={key} type="button" onClick={() => setPriority(priority === key ? '' : key)}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all ${priority === key ? val.color + ' border-transparent shadow-md' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {val.label[t('zh', 'en')]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
              <button 
                  type="button" 
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isRecurring ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-500'}`}
              >
                  {isRecurring && <Check size={14} strokeWidth={4} />}
              </button>
              <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <Repeat size={14}/> {t('每日循环', 'Daily Recurring')}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('将此任务自动复制到未来30天', 'Duplicate task for the next 30 days')}</p>
              </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all text-base mt-4">
            {t('创建任务', 'Create Task')}
          </button>
        </form>
      </div>
    </div>
  );
};

const HabitTrackerComponent = ({ habits, onUpdate, onAdd, onDelete, t }) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', goal: '', frequency: daysInMonth });

    const toggleDay = (habitId, day) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDone = habit.completedDays || [];
        const newDone = currentDone.includes(dateStr) 
            ? currentDone.filter(d => d !== dateStr) 
            : [...currentDone, dateStr];
        onUpdate(habitId, { completedDays: newDone });
    };

    const handleAddHabit = () => {
        if (newHabit.name) {
            onAdd({ 
                name: newHabit.name, 
                goal: newHabit.goal, 
                frequency: Number(newHabit.frequency) || daysInMonth, 
                completedDays: [] 
            });
            setIsAddModalOpen(false);
            setNewHabit({ name: '', goal: '', frequency: daysInMonth });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 flex flex-col gap-6 w-full transition-colors relative">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center"><Activity size={24}/></div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('习惯追踪', 'Habit Tracker')}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{currentYear} {t('年', 'Year')} {currentMonth + 1} {t('月', 'Month')}</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"
                >
                    <Plus size={18}/> {t('添加习惯', 'Add Habit')}
                </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full border-separate border-spacing-y-3 min-w-[1000px]">
                    <thead>
                        <tr className="text-xs font-bold text-slate-400">
                            <th className="text-left px-4 sticky left-0 bg-white dark:bg-slate-800 z-10">{t('习惯', 'Habit')}</th>
                            <th className="text-center px-4 w-32">{t('目标', 'Goal')}</th>
                            <th className="text-left px-4 w-56">{t('进度', 'Progress')}</th>
                            <th className="px-4">
                                <div className="flex gap-1">
                                    {daysArray.map(d => (
                                        <div key={d} className="w-8 h-8 flex items-center justify-center shrink-0 font-medium">{d}</div>
                                    ))}
                                </div>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => {
                            const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
                            const monthCompletions = (habit.completedDays || []).filter(d => d.startsWith(currentMonthKey)).length;
                            const freq = habit.frequency || habit.target || 1;
                            const progressPercentage = Math.min(100, (monthCompletions / freq) * 100);
                            
                            return (
                                <tr key={habit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                                    <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 rounded-l-xl">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{habit.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block px-3 py-1.5 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-lg border border-amber-100 dark:border-amber-500/30 shadow-sm text-xs truncate max-w-[120px]" title={habit.goal || t('未设定', 'Not Set')}>
                                            {habit.goal || t('未设定', 'Not Set')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 w-8 text-right">{Math.round(progressPercentage)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {daysArray.map(d => {
                                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                const isDone = (habit.completedDays || []).includes(dateStr);
                                                return (
                                                    <button 
                                                        key={d} 
                                                        onClick={() => toggleDay(habit.id, d)}
                                                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-emerald-300'}`}
                                                    >
                                                        {isDone && <Check size={14} strokeWidth={3}/>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="pr-4 py-3 rounded-r-xl">
                                        <button onClick={() => onDelete(habit.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-white dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">{t('添加新习惯', 'Add New Habit')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400">{t('习惯', 'Habit')}</label>
                                <input 
                                    type="text" value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none dark:text-slate-100 mt-1 focus:border-emerald-500 transition-colors" 
                                    placeholder={t('例如: 健身', 'e.g. Workout')} 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400">{t('最终目标 (文字)', 'Ultimate Goal (Text)')}</label>
                                <input 
                                    type="text" value={newHabit.goal} onChange={e => setNewHabit({...newHabit, goal: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none dark:text-slate-100 mt-1 focus:border-emerald-500 transition-colors" 
                                    placeholder={t('例如: 减脂10斤', 'e.g. Lose 5kg')}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400">{t('每月预期进度 (频次)', 'Monthly Target Frequency')}</label>
                                <input 
                                    type="number" value={newHabit.frequency} onChange={e => setNewHabit({...newHabit, frequency: e.target.value})} 
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none dark:text-slate-100 mt-1 focus:border-emerald-500 transition-colors" 
                                    placeholder={t('例如: 30', 'e.g. 30')}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">{t(`提示: 本月共有 ${daysInMonth} 天`, `Note: ${daysInMonth} days this month`)}</p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    {t('取消', 'Cancel')}
                                </button>
                                <button onClick={handleAddHabit} className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30">
                                    {t('添加', 'Add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TaskCard = ({ task, onToggle, onDelete, onUpdateTask, categories, t }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task?.title || '');
  const [editCategory, setEditCategory] = useState(task?.category || categories[0]?.name);
  const [editPriority, setEditPriority] = useState(task?.priority || '');

  const priorityInfo = PRIORITIES[task?.priority];
  const catObj = categories.find(c => c.name === task?.category) || { color: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300' };

  const isUrgentHighlight = task?.priority === 'urgent_important' && !task?.completed;

  const handleSave = () => {
      if (editTitle.trim()) {
          onUpdateTask(task.id, { title: editTitle, category: editCategory, priority: editPriority });
      }
      setIsEditing(false);
  };

  const handleDragStart = (e) => {
      e.dataTransfer.setData('taskId', task.id);
  };

  if (isEditing) {
      return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-300 dark:border-indigo-600 p-4 shadow-md transition-all">
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-base font-bold mb-3 border-b outline-none bg-transparent dark:text-white" autoFocus />
              <div className="flex gap-2 mb-3">
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="flex-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none dark:text-white">
                      {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="flex-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none dark:text-white">
                      <option value="">{t('无优先级', 'No Priority')}</option>
                      {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label[t('zh','en')]}</option>)}
                  </select>
              </div>
              <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">{t('取消', 'Cancel')}</button>
                  <button onClick={handleSave} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">{t('保存', 'Save')}</button>
              </div>
          </div>
      );
  }

  return (
    <div 
        draggable={true} 
        onDragStart={handleDragStart}
        className={`bg-white dark:bg-slate-800 rounded-xl border p-4 shadow-sm hover:shadow-md transition-all group relative cursor-move
        ${task?.completed ? 'opacity-50 grayscale border-slate-200 dark:border-slate-700' : 
          (isUrgentHighlight ? 'border-rose-500 border-2 bg-rose-50/50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700')}`}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onToggle(task.id)}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task?.completed ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-400'}`}
        >
          {task?.completed && <Check size={14} strokeWidth={4} />}
        </button>
        <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
          <h4 className={`text-base font-bold truncate ${task?.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{task?.title}</h4>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${catObj.color}`}>{task?.category || t('未分类', 'Uncategorized')}</span>
            {priorityInfo && <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${priorityInfo.color}`}>{priorityInfo.label[t('zh', 'en')]}</span>}
            {task?.time && <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1"><Clock size={12}/>{task.time}</span>}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><Edit size={16}/></button>
          <button onClick={() => onDelete(task.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
        </div>
      </div>
    </div>
  );
};

// --- Views ---

const DashboardView = ({ tasks, user, categories, openAddModal, goToTimeline, toggleTask, deleteTask, onUpdateTask, habits, onUpdateHabit, onAddHabit, onDeleteHabit, t }) => {
  const today = getLocalDateString(new Date());
  const todayTasks = tasks.filter(t => t.date === today);
  const completedCount = todayTasks.filter(t => t.completed).length;
  const progressValue = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
      
      {/* 1. Progress Bar Card */}
      <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 shadow-xl transition-colors">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 text-slate-200 rounded-xl flex items-center justify-center"><Target size={20}/></div>
                <h3 className="text-lg font-bold text-white">{t('今日任务达成率', "Today's Progress")}</h3>
            </div>
            <span className="text-3xl font-black text-white">{Math.round(progressValue)}%</span>
        </div>
        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-800">
            <div 
                className="h-full bg-white transition-all duration-700"
                style={{ width: `${progressValue}%` }}
            />
        </div>
      </div>

      {/* 2. Today's Tasks Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm flex flex-col transition-colors">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('今日任务列表', "Today's Tasks")}</h4>
            <button onClick={() => goToTimeline(today)} className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors" title={t("前往时间轴添加", "Go to timeline")}><Plus size={20}/></button>
        </div>
        <div className="flex flex-col gap-3">
            {todayTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium">
                    {t('今天暂无任务，去添加一个吧。', 'No tasks today, add one.')}
                </div>
            ) : (
                todayTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)
            )}
        </div>
      </div>

      {/* 3. Habit Tracker Card */}
      <HabitTrackerComponent habits={habits} onUpdate={onUpdateHabit} onAdd={onAddHabit} onDelete={onDeleteHabit} t={t} />

    </div>
  );
};

const CalendarView = ({ tasks, t, goToTimeline, toggleTask, deleteTask, categories, onUpdateTask }) => {
  const [curr, setCurr] = useState(new Date());
  const [viewingDate, setViewingDate] = useState(null); // 日期模态框状态

  const year = curr.getFullYear(); const month = curr.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const slots = [...Array(startDay).fill(null), ...Array(days).fill(0).map((_, i) => i + 1)];

  const modalTasks = viewingDate ? tasks.filter(t => t.date === viewingDate) : [];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in pb-10">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <header className="p-8 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{curr.toLocaleString(t('zh-CN', 'en-US'), { month: 'long', year: 'numeric' })}</h2>
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors cursor-pointer overflow-hidden shadow-sm">
                    <CalIcon size={20} />
                    <input
                        type="month"
                        value={`${year}-${String(month + 1).padStart(2, '0')}`}
                        onChange={(e) => {
                            if (e.target.value) {
                                const [y, m] = e.target.value.split('-');
                                setCurr(new Date(y, m - 1, 1));
                            }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title={t("选择月份", "Select Month")}
                    />
                </div>
            </div>
            <div className="flex items-center bg-white dark:bg-slate-700 p-1.5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                <button onClick={() => setCurr(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors dark:text-slate-300"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurr(new Date())} className="px-6 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg">{t('返回今天', 'Today')}</button>
                <button onClick={() => setCurr(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors dark:text-slate-300"><ChevronRight size={20}/></button>
            </div>
        </header>
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          {[
            t('周日', 'Sun'), t('周一', 'Mon'), t('周二', 'Tue'), t('周三', 'Wed'), t('周四', 'Thu'), t('周五', 'Fri'), t('周六', 'Sat')
          ].map(d => <div key={d} className="py-4 text-center text-sm font-bold text-slate-500 dark:text-slate-400">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-700 gap-px">
          {slots.map((day, i) => {
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = dateStr === getLocalDateString(new Date());
            return (
              <div 
                key={i} 
                onClick={() => day && setViewingDate(dateStr)}
                className={`bg-white dark:bg-slate-800 min-h-[140px] p-4 transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 group relative ${day ? 'cursor-pointer' : ''} ${!day ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
              >
                {day && (
                  <>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-base font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>{day}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); goToTimeline(dateStr); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                            title={t("去时间轴添加任务", "Go to Timeline")}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-1.5">
                      {dayTasks.slice(0, 4).map(tData => (
                        <div key={tData.id} className={`text-xs font-medium p-1.5 px-2.5 rounded-md bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 truncate ${tData.completed ? 'line-through opacity-40' : ''}`}>{tData.title}</div>
                      ))}
                      {dayTasks.length > 4 && <div className="text-xs font-bold text-indigo-500 pl-1 mt-1">+{dayTasks.length - 4} {t('更多', 'More')}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 每日任务详情弹窗 */}
      {viewingDate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setViewingDate(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-8 pb-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {new Date(viewingDate).toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{t('日程安排', 'Daily Schedule')}</p>
                    </div>
                    <button onClick={() => setViewingDate(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                    {modalTasks.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-medium flex flex-col items-center gap-3">
                            <Target size={40} className="opacity-20" />
                            {t('这一天没有任务安排', 'No tasks scheduled for this day.')}
                        </div>
                    ) : (
                        modalTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-700 shrink-0">
                    <button 
                        onClick={() => { goToTimeline(viewingDate); setViewingDate(null); }}
                        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
                    >
                        <Plus size={18} /> {t('前往时间轴规划任务', 'Go to Timeline to Add Task')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const TimelineView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, onUpdateTask, categories, t }) => {
  const hours = Array.from({ length: 19 }, (_, i) => i + 6); // 6:00 AM to 12:00 AM(next day)
  
  // 渲染两天的时间轴 (当前日期 和 下一天)
  const daysToShow = [
      currentDate, 
      new Date(currentDate.getTime() + 86400000)
  ];
  
  // 日期导航列表 (-3 到 +3 天)
  const navDays = Array.from({length: 7}, (_, i) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 3 + i);
      return d;
  });

  const handleDrop = (e, dateStr, hourValue) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      if(taskId) {
          onUpdateTask(taskId, { date: dateStr, time: hourValue });
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in pb-10">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 relative transition-colors">
        
        {/* 顶部日期导航 */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft size={24}/></button>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mx-4">
                {navDays.map((d, i) => {
                    const isSelected = d.toDateString() === currentDate.toDateString();
                    return (
                        <button 
                            key={i} 
                            onClick={() => setCurrentDate(d)}
                            className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                        >
                            <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'short' })}</span>
                            <span className="text-lg font-bold">{d.getDate()}</span>
                        </button>
                    );
                })}
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronRight size={24}/></button>
        </div>

        {/* 双日表头 */}
        <div className="grid grid-cols-[80px_1fr_1fr] gap-6 mb-6">
            <div></div>
            {daysToShow.map((d, i) => (
                <div key={i} className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{d.toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'long' })}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">{d.toLocaleDateString(t('zh-CN', 'en-US'), { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            ))}
        </div>

        {/* 时间槽 */}
        <div className="space-y-6">
            {hours.map(hour => {
                let timeLabel;
                if (hour === 24 || hour === 0) timeLabel = '12:00 AM';
                else if (hour === 12) timeLabel = '12:00 PM';
                else if (hour > 12) timeLabel = `${hour - 12}:00 PM`;
                else timeLabel = `${hour}:00 AM`;

                const hourValue = hour === 24 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`;
                const matchHour = hour === 24 ? 0 : hour;

                return (
                    <div key={hour} className="grid grid-cols-[80px_1fr_1fr] gap-6 group items-start min-h-[100px]">
                        {/* 左侧时间刻度 */}
                        <div className="pt-2 text-right shrink-0">
                            <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{timeLabel}</span>
                        </div>
                        
                        {/* 两天的卡槽 */}
                        {daysToShow.map((d, dayIndex) => {
                            const dateStr = getLocalDateString(d);
                            const hourTasks = tasks.filter(taskObj => taskObj.date === dateStr && taskObj.time && parseInt(taskObj.time.split(':')[0]) === matchHour);

                            return (
                                <div 
                                    key={dayIndex}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, dateStr, hourValue)}
                                    className="flex-1 border-l-2 border-slate-200 dark:border-slate-700 pl-4 pb-4 relative transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30 rounded-r-xl"
                                >
                                    <div className="absolute top-3 -left-[7px] w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600 group-hover:bg-indigo-500 border-2 border-white dark:border-slate-800 transition-all" />
                                    <div className="space-y-3">
                                        {hourTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)}
                                        <button 
                                            onClick={() => openAddModal(dateStr, hourValue)}
                                            className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 text-sm font-bold flex items-center justify-center gap-2 transition-all opacity-40 hover:opacity-100"
                                        >
                                            <Plus size={18}/> {t(`添加任务至 ${timeLabel}`, `Add task to ${timeLabel}`)}
                                        </button>
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

  const daily = { 
    keep: ['', '', ''], improve: ['', '', ''], start: ['', '', ''], stop: ['', '', ''], 
    ...(reviews?.daily?.[date] || {}) 
  };
  const cycle = { plan: '', execute: '', adjust: '', check: '', ...(reviews?.cycle || {}) };
  const yearly = { 
    finance: ['', '', ''], health: ['', '', ''], family: ['', '', ''], business: ['', '', ''], 
    investment: ['', '', ''], social: ['', '', ''], education: ['', '', ''], breakthrough: ['', '', ''], 
    ...(reviews?.yearly || {}) 
  };

  const updateDaily = (field, idx, val) => {
    const newList = Array.isArray(daily[field]) ? [...daily[field]] : ['', '', ''];
    newList[idx] = val;
    onUpdateReview({ ...reviews, daily: { ...(reviews.daily || {}), [date]: { ...daily, [field]: newList } } });
  };
  const updateCycle = (field, val) => onUpdateReview({ ...reviews, cycle: { ...cycle, [field]: val } });
  const updateYearly = (cat, idx, val) => {
    const newList = Array.isArray(yearly[cat]) ? [...yearly[cat]] : ['', '', ''];
    newList[idx] = val;
    onUpdateReview({ ...reviews, yearly: { ...(reviews.yearly || {}), [cat]: newList } });
  };

  const dailyCategories = [
      {f:'keep', l: t('Keep (保持)', 'Keep'), c:'emerald', i: CheckCircle2}, 
      {f:'improve', l: t('Improve (改进)', 'Improve'), c:'amber', i: TrendingUp}, 
      {f:'start', l: t('Start (开始)', 'Start'), c:'indigo', i: PlayCircle}, 
      {f:'stop', l: t('Stop (停止)', 'Stop'), c:'rose', i: StopCircle}
  ];

  const cycleCategories = [
      {f:'plan', l: t('Plan (规划)', 'Plan'), c:'blue', i: MapPin}, 
      {f:'execute', l: t('Execute (执行)', 'Execute'), c:'rose', i: PlayCircle}, 
      {f:'adjust', l: t('Adjust (调整)', 'Adjust'), c:'amber', i: Settings}, 
      {f:'check', l: t('Check (检查)', 'Check'), c:'emerald', i: Search}
  ];

  const yearlyCategories = [
    {k:'finance', l: t('Finance / 财务', 'Finance'), i: Wallet, c: 'emerald'}, 
    {k:'health', l: t('Health / 健康', 'Health'), i: HeartPulse, c: 'rose'}, 
    {k:'family', l: t('Family / 亲友', 'Family'), i: Users2, c: 'amber'}, 
    {k:'business', l: t('Business / 事业', 'Business'), i: Briefcase, c: 'blue'},
    {k:'investment', l: t('Investment / 投资', 'Investment'), i: TrendingUp, c: 'indigo'}, 
    {k:'social', l: t('Social / 社交', 'Social'), i: Users, c: 'cyan'}, 
    {k:'education', l: t('Education / 教育', 'Education'), i: GraduationCap, c: 'violet'}, 
    {k:'breakthrough', l: t('Breakthrough / 突破', 'Breakthrough'), i: Rocket, c: 'orange'}
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-in fade-in">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('Review', 'Review')}</h2>
        <div className="flex items-center gap-4 flex-wrap">
            <input 
                type="date" value={date} onChange={e => setDate(e.target.value)} 
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 font-bold outline-none text-slate-700 dark:text-slate-200 focus:border-indigo-400 transition-colors"
            />
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
            {[ {id: 'daily', label: t('每日', 'Daily')}, {id: 'cycle', label: t('周期', 'Cycle')}, {id: 'yearly', label: t('年度', 'Yearly')} ].map(tabItem => (
                <button 
                    key={tabItem.id} onClick={() => setTab(tabItem.id)} 
                    className={`px-8 py-2.5 rounded-lg text-sm font-bold uppercase transition-all ${tab === tabItem.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    {tabItem.label}
                </button>
            ))}
            </div>
        </div>
      </header>

      {tab === 'daily' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {dailyCategories.map(x => {
            const Icon = x.i;
            return (
                <div key={x.f} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6 transition-colors">
                <h4 className={`text-lg font-bold text-${x.c}-600 dark:text-${x.c}-400 flex items-center gap-3`}>
                    <div className={`p-2 bg-${x.c}-50 dark:bg-${x.c}-500/10 rounded-xl`}><Icon size={24} /></div> {x.l}
                </h4>
                <div className="space-y-4">
                    {[0,1,2].map(i => (
                    <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-300 dark:text-slate-600">{i+1}.</span>
                        <input 
                            value={String(daily[x.f]?.[i] || '')} onChange={e => updateDaily(x.f, i, e.target.value)}
                            placeholder={t('添加记录...', 'Add record...')}
                            className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-400 dark:text-slate-100 transition-colors"
                        />
                    </div>
                    ))}
                </div>
                </div>
            );
        })}
        </div>
      )}

      {tab === 'cycle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cycleCategories.map(x => {
            const Icon = x.i;
            return (
                <div key={x.f} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors">
                <h4 className={`text-lg font-bold text-${x.c}-600 dark:text-${x.c}-400 mb-6 flex items-center gap-3`}>
                    <div className={`p-2 bg-${x.c}-50 dark:bg-${x.c}-500/10 rounded-xl`}><Icon size={24} /></div> {x.l}
                </h4>
                <textarea 
                    value={String(cycle[x.f] || '')} onChange={e => updateCycle(x.f, e.target.value)}
                    className="w-full flex-1 min-h-[180px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 text-base leading-relaxed outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-400 dark:text-slate-100 transition-colors resize-none"
                    placeholder={t(`记录您的心得与计划...`, `Record your thoughts and plans...`)}
                />
                </div>
            );
          })}
        </div>
      )}

      {tab === 'yearly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {yearlyCategories.map(cat => {
            const Icon = cat.i;
            return (
                <div key={cat.k} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`p-3 bg-${cat.c}-50 dark:bg-${cat.c}-500/10 text-${cat.c}-600 dark:text-${cat.c}-400 rounded-xl`}><Icon size={24} /></div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{cat.l}</h4>
                </div>
                <div className="space-y-4">
                    {[0,1,2].map(i => (
                    <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-300 dark:text-slate-600">{i+1}.</span>
                        <input 
                        value={String(yearly[cat.k]?.[i] || '')} onChange={e => updateYearly(cat.k, i, e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-400 dark:text-slate-100 transition-colors"
                        placeholder={t("设定您的年度目标...", "Set your yearly goals...")}
                        />
                    </div>
                    ))}
                </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState('focus');
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledTime, setPrefilledTime] = useState("");
  const [targetDate, setTargetDate] = useState(getLocalDateString(new Date()));
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Theme and Language State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lang, setLang] = useState('zh');
  const t = (zh, en) => lang === 'zh' ? zh : en;

  // Data
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([
    { name: '工作', color: 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300' },
    { name: '生活', color: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300' },
    { name: '学习', color: 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300' }
  ]);
  const [habits, setHabits] = useState([]);
  const [reviews, setReviews] = useState({ daily: {}, cycle: {}, yearly: {} });

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth).catch(() => {});
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const userPath = (c) => doc(db, 'artifacts', appId, 'users', user.uid, c, 'data');
    const unsubs = [
      onSnapshot(userPath('tasks'), d => d.exists() && setTasks(d.data().list || []), () => {}),
      onSnapshot(userPath('habits'), d => d.exists() && setHabits(d.data().list || []), () => {}),
      onSnapshot(userPath('categories'), d => d.exists() && setCategories(d.data().list || []), () => {}),
      onSnapshot(userPath('reviews'), d => d.exists() && setReviews(d.data() || {}), () => {})
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  const saveData = (c, data) => { if (user) setDoc(doc(db, 'artifacts', appId, 'users', user.uid, c, 'data'), data); };

  const handleGoToTimeline = (dateStr) => {
    setCurrentDate(new Date(dateStr));
    setView('timeline');
  };

  const handleAddTask = (taskData) => {
    if (taskData.recurring === 'daily') {
        const newTasks = [];
        for(let i=0; i<30; i++) {
            const d = new Date(taskData.date);
            d.setDate(d.getDate() + i);
            newTasks.push({ 
                id: generateId(), 
                completed: false, 
                title: taskData.title,
                category: taskData.category,
                priority: taskData.priority,
                time: taskData.time,
                date: getLocalDateString(d) 
            });
        }
        const n = [...tasks, ...newTasks];
        setTasks(n); saveData('tasks', { list: n });
    } else {
        const n = [...tasks, { id: generateId(), completed: false, ...taskData }];
        setTasks(n); saveData('tasks', { list: n });
    }
  };

  const handleUpdateTask = (id, updates) => {
      const n = tasks.map(t => t.id === id ? {...t, ...updates} : t);
      setTasks(n); saveData('tasks', { list: n });
  };

  const handleAddCategory = (name) => {
      const randomColor = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
      const n = [...categories, { name, color: randomColor }];
      setCategories(n); saveData('categories', { list: n });
  };

  const menuItems = [
    { id: 'focus', icon: Home, label: t('仪表盘', 'Dashboard') },
    { id: 'calendar', icon: CalIcon, label: t('日历', 'Calendar') },
    { id: 'timeline', icon: Trello, label: t('时间轴', 'Timeline') },
    { id: 'review', icon: ClipboardList, label: t('复盘', 'Review') },
    { id: 'finance', icon: DollarSign, label: t('理财', 'Finance') }
  ];

  return (
    <div className={`flex flex-col h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. Global Top Bar (Logo + Toggles + Auth) */}
      <div className="px-8 pt-6 pb-4 flex justify-between items-center max-w-7xl mx-auto w-full shrink-0">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold text-2xl tracking-tight">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md"><Zap size={20}/></div>
              Planner.AI
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme & Lang Toggles */}
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-4">
                <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-bold text-xs transition-colors">
                    {lang === 'zh' ? 'EN' : '中'}
                </button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
                </button>
            </div>

            {user && !user.isAnonymous ? (
                <button onClick={() => signOut(auth)} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-bold text-sm transition-colors">
                    <LogOut size={16}/>
                    <span>{t('退出', 'Logout')}</span>
                </button>
            ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors">
                    {t('登录云端', 'Cloud Login')}
                </button>
            )}
          </div>
      </div>

      {/* 2. Navigation Card (Only Menu) */}
      <div className="px-6 pb-0 shrink-0 w-full">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3 flex justify-center mx-auto max-w-5xl transition-colors">
              <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full justify-start md:justify-center">
                  {menuItems.map(m => {
                    const Icon = m.icon;
                    return (
                        <button 
                            key={m.id} 
                            onClick={() => setView(m.id)} 
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${view === m.id ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            <Icon size={18}/> {m.label}
                        </button>
                    )
                  })}
              </nav>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto h-full">
            {view === 'focus' && (
                <DashboardView 
                    t={t}
                    tasks={tasks} user={user} categories={categories} 
                    habits={habits}
                    onUpdateHabit={(id, up) => { const n = habits.map(h => h.id === id ? {...h, ...up} : h); setHabits(n); saveData('habits', { list: n }); }}
                    onAddHabit={(h) => { const n = [...habits, { id: generateId(), ...h }]; setHabits(n); saveData('habits', { list: n }); }}
                    onDeleteHabit={(id) => { const n = habits.filter(h => h.id !== id); setHabits(n); saveData('habits', { list: n }); }}
                    openAddModal={(d) => { setTargetDate(d); setPrefilledTime(""); setIsAddModalOpen(true); }} 
                    goToTimeline={handleGoToTimeline}
                    toggleTask={(id) => { const n = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t); setTasks(n); saveData('tasks', { list: n }); }} 
                    deleteTask={(id) => { const n = tasks.filter(t => t.id !== id); setTasks(n); saveData('tasks', { list: n }); }} 
                    onUpdateTask={handleUpdateTask}
                />
            )}
            {view === 'calendar' && (
                <CalendarView 
                    tasks={tasks} 
                    t={t} 
                    goToTimeline={handleGoToTimeline}
                    categories={categories}
                    toggleTask={(id) => { const n = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t); setTasks(n); saveData('tasks', { list: n }); }}
                    deleteTask={(id) => { const n = tasks.filter(t => t.id !== id); setTasks(n); saveData('tasks', { list: n }); }}
                    onUpdateTask={handleUpdateTask}
                />
            )}
            {view === 'timeline' && (
                <TimelineView 
                    t={t}
                    currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} categories={categories}
                    openAddModal={(d, timeStr) => { setTargetDate(d); setPrefilledTime(timeStr); setIsAddModalOpen(true); }} 
                    toggleTask={(id) => { const n = tasks.map(task => task.id === id ? {...task, completed: !task.completed} : task); setTasks(n); saveData('tasks', { list: n }); }} 
                    deleteTask={(id) => { const n = tasks.filter(task => task.id !== id); setTasks(n); saveData('tasks', { list: n }); }} 
                    onUpdateTask={handleUpdateTask}
                />
            )}
            {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={(r) => { setReviews(r); saveData('reviews', r); }} t={t} />}
            {view === 'finance' && (
                <div className="flex items-center justify-center h-full animate-in fade-in pb-20">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-16 text-center flex flex-col items-center gap-5 transition-colors">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                            <DollarSign size={40} className="text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-500 dark:text-slate-400">
                            {t('理财模块准备就绪，等待开发...', 'Finance Module Ready for Development...')}
                        </h2>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* Add Task Modal */}
      <AddTaskModal 
        t={t}
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddTask} 
        defaultDate={targetDate} 
        categories={categories}
        prefilledTime={prefilledTime}
        onAddCategory={handleAddCategory}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} t={t} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border: 2px solid transparent; background-clip: content-box; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// --- Auth Modal ---
const AuthModal = ({ isOpen, onClose, t }) => {
    const [isLogin, setIsLogin] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
    if (!isOpen) return null;
    const handleAuth = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try { if (isLogin) await signInWithEmailAndPassword(auth, email, password); else await createUserWithEmailAndPassword(auth, email, password); onClose(); }
        catch (err) { setError(err.code === 'auth/operation-not-allowed' ? `Error: Project [${firebaseConfig.projectId}] has Email login disabled.` : err.message); }
        finally { setLoading(false); }
    };
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-10 border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-900 dark:bg-slate-700 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg"><Lock size={28} /></div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('身份验证', 'Authentication')}</h2>
          </div>
          {error && <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs p-4 rounded-xl mb-6 font-medium border border-rose-100 dark:border-rose-500/20 text-center">{error}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder={t('邮箱', 'Email')} value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none focus:border-indigo-400 dark:text-slate-100 transition-colors" required />
            <input type="password" placeholder={t('密码', 'Password')} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none focus:border-indigo-400 dark:text-slate-100 transition-colors" required />
            <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 text-sm mt-2">
                {loading && <RefreshCw className="animate-spin" size={18}/>}
                {loading ? t('处理中...', 'Processing...') : (isLogin ? t('登 录', 'Login') : t('注 册', 'Sign Up'))}
            </button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-6 hover:underline">{isLogin ? t('创建账号', 'Create Account') : t('返回登录', 'Back to Login')}</button>
          <button onClick={onClose} className="w-full text-center text-xs font-bold text-slate-400 dark:text-slate-500 mt-4">{t('取消', 'Cancel')}</button>
        </div>
      </div>
    );
};