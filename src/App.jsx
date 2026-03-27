import React, { useState, useEffect, memo } from 'react';
import { 
  Calendar as CalIcon, Home, Trello, Plus, Clock, ChevronLeft, ChevronRight, X, 
  Target, TrendingUp, ArrowRight, Trash2, Zap, Activity, DollarSign, PieChart, 
  LogIn, LogOut, AlertTriangle, Briefcase, HeartPulse, Wallet, Rocket, Users2,
  Check, Edit, Repeat, UserPlus, ShieldCheck, EyeOff, ArrowUpRight, ArrowDownRight,
  PiggyBank, CreditCard, ListOrdered, Landmark, Moon, Sun, Eye, RefreshCw, Search, MapPin, CheckCircle2
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

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

// Secondary App for Admin to create staff without logging out
const secondaryApp = getApps().find(a => a.name === "StaffCreatorApp") || initializeApp(firebaseConfig, "StaffCreatorApp");
const secondaryAuth = getAuth(secondaryApp);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'lifechanger-pro-main';

// --- Constants ---
const ADMIN_EMAILS = ["gohyuenwei@gmail.com", "jfleezfsvoai@gmail.com"];

const PRIORITIES = {
    'urgent_important': { label: {zh: '紧急重要', en: 'Urgent & Important'}, color: 'bg-rose-500 text-white' },
    'important_not_urgent': { label: {zh: '重要不紧急', en: 'Important, Not Urgent'}, color: 'bg-amber-500 text-white' }
};

const LABEL_COLORS = [
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
];

const MALAYSIA_BANKS = ["Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong", "AmBank", "UOB", "Bank Islam", "Standard Chartered", "OCBC", "HSBC", "Cash / 其他"];

// --- Utils ---
const getLocalDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Components ---

const LoginPage = ({ t, isDarkMode, setIsDarkMode, lang, setLang, authError }) => {
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [error, setError] = useState(''); 
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (authError) setError(authError);
    }, [authError]);

    const handleAuth = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try { 
            await signInWithEmailAndPassword(auth, email.trim(), password); 
        } catch (err) { 
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError(t('查无此人或密码错误，请确认账号', 'Invalid credentials or user not found.'));
            } else {
                setError(err.message);
            }
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className={`flex flex-col h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <div className="absolute top-6 right-8 flex items-center gap-2 z-50">
                <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors">{lang === 'zh' ? 'EN' : '中'}</button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-10 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white mb-6 shadow-md">
                            <Zap size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Planner.AI</h2>
                        <p className="text-sm text-slate-500 mt-2">{t('私人助理 & 旗舰规划', 'Elite Personal Assistant')}</p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm p-4 rounded-lg mb-6 border border-rose-200 dark:border-rose-800 text-center flex items-center justify-center gap-2">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('邮箱地址', 'Email Address')}</label>
                            <input type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-base outline-none focus:border-indigo-500 dark:text-white transition-all shadow-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('安全密码', 'Password')}</label>
                            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-base outline-none focus:border-indigo-500 dark:text-white transition-all shadow-sm" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-lg shadow-md hover:bg-indigo-700 transition-all flex justify-center items-center gap-3 text-lg mt-4">
                            {loading ? <RefreshCw className="animate-spin" size={24}/> : <>{t('进入系统', 'LOGIN NOW')}<ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const StaffManagerModal = ({ isOpen, onClose, staffList, t }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    if (!isOpen) return null;

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        setLoading(true); setStatus({ type: '', msg: '' });
        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
            const newUid = userCredential.user.uid;
            await signOut(secondaryAuth);

            const updatedList = [...staffList, { email: email.toLowerCase().trim(), uid: newUid }];
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_registry', 'whitelist'), { list: updatedList });

            setStatus({ type: 'success', msg: t('账号创建成功！已永久写入 Firestore。', 'Account created & saved to Firestore!') });
            setEmail(''); setPassword('');
        } catch (err) {
            setStatus({ type: 'error', msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStaff = async (staffEmail) => {
        const updatedList = staffList.filter(s => s.email !== staffEmail);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff_registry', 'whitelist'), { list: updatedList });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center"><UserPlus size={20}/></div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('添加与管理员工', 'Manage Staff Accounts')}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X size={18}/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    <form onSubmit={handleCreateStaff} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('员工邮箱', 'Staff Email')}</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none focus:border-indigo-500 dark:text-white shadow-sm" placeholder="staff@company.com" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('设置登录密码', 'Set Password')}</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none focus:border-indigo-500 dark:text-white shadow-sm" placeholder="••••••••" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold text-base shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-2">
                            {loading ? <RefreshCw size={20} className="animate-spin"/> : <UserPlus size={20}/>} 
                            {t('创建账号并授权', 'Create & Authorize')}
                        </button>
                    </form>

                    {status.msg && <div className={`p-4 rounded-lg text-sm font-medium text-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>{status.msg}</div>}

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('当前已有员工 (存入 Firestore)', 'Active Staff List')}</h4>
                        {staffList.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 font-medium border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">{t('暂无员工', 'No Staff')}</div>
                        ) : (
                            staffList.map((s, idx) => {
                                const emailStr = typeof s === 'string' ? s : (s?.email || 'Unknown');
                                return (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-md flex items-center justify-center font-bold text-sm">{emailStr[0]?.toUpperCase() || 'U'}</div>
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{emailStr}</span>
                                        </div>
                                        <button onClick={() => handleRemoveStaff(emailStr)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title={t('从系统移除', 'Remove from system')}><Trash2 size={18}/></button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate, categories, onAddCategory, prefilledTime = "", t }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || t('工作', 'Work'));
  const [priority, setPriority] = useState('');
  const [time, setTime] = useState(prefilledTime);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => { if (isOpen) { setTitle(''); setTime(prefilledTime); setPriority(''); setIsRecurring(false); } }, [isOpen, prefilledTime]);
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault(); if (!title.trim()) return;
    onAdd({ title, category, priority, time, date: defaultDate, recurring: isRecurring ? 'daily' : 'none' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('新建计划', 'New Plan')}</h3>
          <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('任务描述', 'Description')}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none focus:border-indigo-500 dark:text-white shadow-sm" placeholder={t('需要完成什么？', 'Task details...')} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('分类', 'Category')}</label>
              <div className="flex gap-2">
                <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white">
                  {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewCatInput(!showNewCatInput)} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"><Plus size={18}/></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('时间', 'Time')}</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white" />
            </div>
          </div>

          {showNewCatInput && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex gap-2 animate-in slide-in-from-top-2">
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 text-sm outline-none dark:text-white" placeholder={t('新分类名称', 'New Category Name')} />
              <button type="button" onClick={() => { if(newCatName) { onAddCategory(newCatName); setNewCatName(''); setShowNewCatInput(false); setCategory(newCatName); } }} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium">{t('添加', 'Add')}</button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('优先级', 'Priority')}</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PRIORITIES).map(([key, val]) => (
                <button key={key} type="button" onClick={() => setPriority(priority === key ? '' : key)} className={`p-3 rounded-lg text-sm font-medium border transition-all ${priority === key ? val.color + ' border-transparent shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{val.label[t('zh', 'en')]}</button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isRecurring ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>{isRecurring && <Check size={14} strokeWidth={3} />}</button>
              <div>
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-2"><Repeat size={14}/> {t('每日循环', 'Daily Recurring')}</h4>
                  <p className="text-xs text-slate-500">{t('将此任务自动排期到未来30天', 'Copy to next 30 days')}</p>
              </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-lg shadow-sm hover:bg-indigo-700 transition-all text-base mt-4">{t('保存', 'Save Task')}</button>
        </form>
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
    const catObj = categories.find(c => c.name === task?.category) || { color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' };
    const isUrgentHighlight = task?.priority === 'urgent_important' && !task?.completed;
  
    const handleSave = () => {
        if (editTitle.trim()) onUpdateTask(task.id, { title: editTitle, category: editCategory, priority: editPriority });
        setIsEditing(false);
    };
  
    if (isEditing) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-indigo-500 p-4 shadow-md animate-in zoom-in-95 duration-200">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-base font-semibold mb-3 border-b border-indigo-200 dark:border-indigo-800 outline-none bg-transparent dark:text-white pb-1" autoFocus />
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm outline-none dark:text-white">
                        {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm outline-none dark:text-white">
                        <option value="">{t('无优先级', 'No Priority')}</option>
                        {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label[t('zh','en')]}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors">{t('取消', 'Cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-all">{t('保存', 'Save')}</button>
                </div>
            </div>
        );
    }
  
    return (
      <div draggable onDragStart={e => e.dataTransfer.setData('taskId', task.id)} className={`bg-white dark:bg-slate-800 rounded-lg border p-4 shadow-sm hover:shadow-md transition-all group relative cursor-move
          ${task?.completed ? 'opacity-50 border-slate-200 dark:border-slate-700' : 
            (isUrgentHighlight ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700')}`}>
        <div className="flex items-start gap-4">
          <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-6 h-6 rounded border flex items-center justify-center transition-all ${task?.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-400'}`}>
            {task?.completed && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
            <h4 className={`text-base font-medium truncate ${task?.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{task?.title}</h4>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded font-medium border ${catObj.color}`}>{task?.category || t('未分类', 'Draft')}</span>
              {priorityInfo && <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityInfo.color}`}>{priorityInfo.label[t('zh', 'en')]}</span>}
              {task?.time && <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock size={12}/>{task.time}</span>}
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={16}/></button>
            <button onClick={() => onDelete(task.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col gap-6 w-full transition-colors relative">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center"><Activity size={20}/></div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">{t('习惯追踪', 'Habit Tracker')}</h4>
                        <p className="text-sm text-slate-500">{currentYear} / {currentMonth + 1}</p>
                    </div>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-all shadow-sm"><Plus size={18}/> {t('添加习惯', 'Add Habit')}</button>
            </div>
            <div className="overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <th className="text-left py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10">{t('习惯', 'Habit')}</th>
                            <th className="text-left py-3 px-4 w-32">{t('目标', 'Goal')}</th>
                            <th className="text-left py-3 px-4 w-48">{t('进度', 'Progress')}</th>
                            <th className="py-3 px-4">
                                <div className="flex gap-1">
                                    {daysArray.map(d => <div key={d} className="w-8 h-8 flex items-center justify-center shrink-0 font-medium">{d}</div>)}
                                </div>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => {
                            const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
                            const monthCompletions = (habit.completedDays || []).filter(d => d.startsWith(currentMonthKey)).length;
                            const freq = habit.frequency || 1;
                            const progressPercentage = Math.min(100, (monthCompletions / freq) * 100);
                            return (
                                <tr key={habit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors last:border-0">
                                    <td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-10">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{habit.name}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="inline-block text-sm text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{habit.goal || '-'}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                                            </div>
                                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 w-8 text-right">{Math.round(progressPercentage)}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1">
                                            {daysArray.map(d => {
                                                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                const isDone = (habit.completedDays || []).includes(dateStr);
                                                return (
                                                    <button key={d} onClick={() => toggleDay(habit.id, d)} className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center border transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}>
                                                        {isDone && <Check size={14} strokeWidth={3}/>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                        <button onClick={() => onDelete(habit.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{t('添加新习惯', 'New Habit')}</h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('习惯名称', 'Habit Name')}</label>
                                <input type="text" value={newHabit.name} onChange={e => setNewHabit({...newHabit, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none dark:text-white focus:border-emerald-500 transition-all" placeholder={t('例如: 健身', 'e.g. Workout')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('目标 (可选)', 'Goal')}</label>
                                <input type="text" value={newHabit.goal} onChange={e => setNewHabit({...newHabit, goal: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none dark:text-white focus:border-emerald-500 transition-all" placeholder={t('例如: 减脂', 'e.g. Health')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('每月目标天数', 'Target Days/Month')}</label>
                                <input type="number" value={newHabit.frequency} onChange={e => setNewHabit({...newHabit, frequency: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none dark:text-white focus:border-emerald-500 transition-all" />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-lg font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition-colors">{t('取消', 'Cancel')}</button>
                                <button onClick={handleAddHabit} className="flex-1 py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all">{t('保存', 'Save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 4. Main Views ---
const DashboardView = ({ tasks, categories, habits, onUpdateHabit, onAddHabit, onDeleteHabit, goToTimeline, toggleTask, deleteTask, onUpdateTask, t }) => {
    const today = getLocalDateString(new Date());
    const todayTasks = tasks.filter(t => t.date === today);
    const completedCount = todayTasks.filter(t => t.completed).length;
    const progressValue = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-10">
        <div className="bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-800">
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 text-indigo-400 rounded-lg flex items-center justify-center"><Target size={20}/></div>
                  <h3 className="text-xl font-semibold text-white">{t('今日进度', "Today's Progress")}</h3>
              </div>
              <span className="text-3xl font-bold text-white">{Math.round(progressValue)}%</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressValue}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">{t('今日任务', "Today's Tasks")}</h4>
              <button onClick={() => goToTimeline(today)} className="bg-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors"><Plus size={20}/></button>
          </div>
          <div className="flex flex-col gap-3">
              {todayTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">{t('暂时没有任务，去添加一个吧。', 'No tasks today. Add one!')}</div>
              ) : (
                 todayTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)
              )}
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <header className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{curr.toLocaleString(t('zh-CN', 'en-US'), { month: 'long', year: 'numeric' })}</h2>
                  <div className="relative w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors overflow-hidden">
                      <CalIcon size={20} />
                      <input type="month" value={`${year}-${String(month + 1).padStart(2, '0')}`} onChange={(e) => { if (e.target.value) { const [y, m] = e.target.value.split('-'); setCurr(new Date(y, m - 1, 1)); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
              </div>
              <div className="flex items-center bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <button onClick={() => setCurr(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300"><ChevronLeft size={20}/></button>
                  <button onClick={() => setCurr(new Date())} className="px-6 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('今天', 'Today')}</button>
                  <button onClick={() => setCurr(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-600 dark:text-slate-300"><ChevronRight size={20}/></button>
              </div>
          </header>
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {[t('周日', 'Sun'), t('周一', 'Mon'), t('周二', 'Tue'), t('周三', 'Wed'), t('周四', 'Thu'), t('周五', 'Fri'), t('周六', 'Sat')].map(d => <div key={d} className="py-4 text-center text-xs font-semibold text-slate-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 bg-slate-200 dark:bg-slate-800 gap-[1px]">
            {slots.map((day, i) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isToday = dateStr === getLocalDateString(new Date());
              return (
                <div key={i} onClick={() => day && setViewingDate(dateStr)} className={`bg-white dark:bg-slate-900 min-h-[140px] p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative ${day ? 'cursor-pointer' : 'bg-slate-50/50 dark:bg-slate-900'}`}>
                  {day && <>
                      <div className="flex justify-between items-start mb-2">
                          <span className={`text-base font-semibold w-8 h-8 flex items-center justify-center rounded-md transition-all ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}`}>{day}</span>
                          <button onClick={(e) => { e.stopPropagation(); goToTimeline(dateStr); }} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"><Plus size={18} /></button>
                      </div>
                      <div className="space-y-1.5">
                          {dayTasks.slice(0, 4).map(tData => <div key={tData.id} className={`text-xs font-medium p-1.5 px-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 truncate ${tData.completed ? 'line-through opacity-50' : ''}`}>{tData.title}</div>)}
                          {dayTasks.length > 4 && <div className="text-xs font-semibold text-indigo-500 pl-1">+{dayTasks.length - 4} {t('更多', 'More')}</div>}
                      </div>
                  </>}
                </div>
              );
            })}
          </div>
        </div>
        {viewingDate && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setViewingDate(null)}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{new Date(viewingDate).toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                          <p className="text-sm text-slate-500 mt-1">{t('日程安排', 'Schedule')}</p>
                      </div>
                      <button onClick={() => setViewingDate(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 hover:text-slate-700 transition-colors"><X size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                      {tasks.filter(t => t.date === viewingDate).length === 0 ? <div className="text-center py-10 text-slate-400 font-medium">{t('无安排', 'No tasks')}</div> :
                        tasks.filter(t => t.date === viewingDate).map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)}
                  </div>
                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <button onClick={() => { goToTimeline(viewingDate); setViewingDate(null); }} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-sm flex justify-center items-center gap-2 hover:bg-indigo-700 transition-all"><Plus size={20} /> {t('添加计划', 'Add Plan')}</button>
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
    const navDays = Array.from({length: 7}, (_, i) => { const d = new Date(currentDate); d.setDate(d.getDate() - 3 + i); return d; });
    const handleDrop = (e, dateStr, hourValue) => { e.preventDefault(); const taskId = e.dataTransfer.getData('taskId'); if(taskId) onUpdateTask(taskId, { date: dateStr, time: hourValue }); };
    
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in pb-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 relative">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={24}/></button>
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
                  {navDays.map((d, i) => {
                      const isSelected = d.toDateString() === currentDate.toDateString();
                      return (
                          <button key={i} onClick={() => setCurrentDate(d)} className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                              <span className="text-xs font-semibold uppercase mb-1">{d.toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'short' })}</span>
                              <span className="text-lg font-bold">{d.getDate()}</span>
                          </button>
                      );
                  })}
              </div>
              <button onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight size={24}/></button>
          </div>
          
          <div className="grid grid-cols-[80px_1fr_1fr] gap-6 mb-8">
              <div></div>
              {daysToShow.map((d, i) => (
                  <div key={i} className="text-center">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{d.toLocaleDateString(t('zh-CN', 'en-US'), { weekday: 'long' })}</h3>
                      <p className="text-slate-500 text-sm mt-1">{d.toLocaleDateString(t('zh-CN', 'en-US'), { day: 'numeric', month: 'short' })}</p>
                  </div>
              ))}
          </div>

          <div className="space-y-6">
              {hours.map(hour => {
                  let timeLabel; if (hour === 24 || hour === 0) timeLabel = '12:00 AM'; else if (hour === 12) timeLabel = '12:00 PM'; else if (hour > 12) timeLabel = `${hour - 12}:00 PM`; else timeLabel = `${hour}:00 AM`;
                  const hourValue = hour === 24 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`;
                  const matchHour = hour === 24 ? 0 : hour;
                  
                  return (
                      <div key={hour} className="grid grid-cols-[80px_1fr_1fr] gap-6 group items-start min-h-[100px]">
                          <div className="pt-2 text-right shrink-0">
                              <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">{timeLabel}</span>
                          </div>
                          {daysToShow.map((d, dayIndex) => {
                              const dateStr = getLocalDateString(d);
                              const hourTasks = tasks.filter(taskObj => taskObj.date === dateStr && taskObj.time && parseInt(taskObj.time.split(':')[0]) === matchHour);
                              return (
                                  <div key={dayIndex} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, dateStr, hourValue)} className="flex-1 border-l-2 border-slate-200 dark:border-slate-800 pl-4 pb-6 relative transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-r-xl">
                                      <div className="absolute top-3 -left-[7px] w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 border-2 border-white dark:border-slate-900 transition-all" />
                                      <div className="space-y-3">
                                          {hourTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} categories={categories} t={t} />)}
                                          
                                          <button onClick={() => openAddModal(dateStr, hourValue)} className="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all opacity-40 hover:opacity-100 text-sm font-medium flex items-center justify-center gap-2">
                                              <Plus size={16}/> {t('添加任务', 'Add Task')}
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
        <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-in fade-in">
          <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('复盘', 'Review')}</h2>
            <div className="flex items-center gap-4 flex-wrap justify-center">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 font-medium outline-none text-slate-700 dark:text-white focus:border-indigo-500 transition-colors" />
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                {[ {id: 'daily', label: t('每日', 'Daily')}, {id: 'cycle', label: t('周期', 'Cycle')}, {id: 'yearly', label: t('年度', 'Yearly')} ].map(tabItem => (
                    <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${tab === tabItem.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{tabItem.label}</button>
                ))}
                </div>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tab === 'daily' && dailyCategories.map(x => {
                const Icon = x.i;
                return (
                    <div key={x.f} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                        <h4 className={`text-base font-bold text-${x.c}-600 dark:text-${x.c}-400 flex items-center gap-3`}><div className={`p-2 bg-${x.c}-50 dark:bg-${x.c}-900/30 rounded-lg`}><Icon size={20} /></div> {x.l}</h4>
                        <div className="space-y-3">
                            {[0,1,2].map(i => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-400">{i+1}.</span>
                                <input value={String(daily[x.f]?.[i] || '')} onChange={e => updateDaily(x.f, i, e.target.value)} placeholder={t('添加记录...', 'Add record...')} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 dark:text-white transition-colors" />
                            </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {tab === 'cycle' && cycleCategories.map(x => {
                const Icon = x.i;
                return (
                    <div key={x.f} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                      <h4 className={`text-base font-bold text-${x.c}-600 dark:text-${x.c}-400 mb-4 flex items-center gap-3`}><div className={`p-2 bg-${x.c}-50 dark:bg-${x.c}-900/30 rounded-lg`}><Icon size={20} /></div> {x.l}</h4>
                      <textarea value={String(cycle[x.f] || '')} onChange={e => updateCycle(x.f, e.target.value)} className="w-full flex-1 min-h-[160px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-base leading-relaxed outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 dark:text-white transition-colors resize-none" placeholder={t(`记录心得...`, `Record plans...`)} />
                    </div>
                );
            })}
            {tab === 'yearly' && yearlyCategories.map(cat => {
                const Icon = cat.i;
                return (
                    <div key={cat.k} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 bg-${cat.c}-50 dark:bg-${cat.c}-900/30 text-${cat.c}-600 dark:text-${cat.c}-400 rounded-lg`}><Icon size={24} /></div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">{cat.l}</h4>
                      </div>
                      <div className="space-y-3">
                        {[0,1,2].map(i => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-400">{i+1}.</span>
                            <input value={String(yearly[cat.k]?.[i] || '')} onChange={e => updateYearly(cat.k, i, e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 dark:text-white transition-colors" placeholder={t("核心目标...", "Set goal...")} />
                          </div>
                        ))}
                      </div>
                    </div>
                );
            })}
          </div>
        </div>
      );
};

// --- NEW 6. FinanceVault Component ---
const FinanceVault = ({ t, viewedUserId, user, isAdmin }) => {
    const [financeData, setFinanceData] = useState({
        balance: 0,
        income: 0,
        expense: 0,
        transactions: [],
        savingsJars: [], 
        commitments: [] 
    });

    const [txAmount, setTxAmount] = useState('');
    const [txType, setTxType] = useState('expense');
    const [txCategory, setTxCategory] = useState('餐饮 Food');
    const [txNote, setTxNote] = useState('');
    const [txDate, setTxDate] = useState(getLocalDateString(new Date()));

    const [isJarModalOpen, setIsJarModalOpen] = useState(false);
    const [jarForm, setJarForm] = useState({ name: '', target: '', bank: MALAYSIA_BANKS[0] });
    
    const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
    const [commitForm, setCommitForm] = useState({ name: '', amount: '' });

    const [fundJarId, setFundJarId] = useState(null);
    const [fundAmount, setFundAmount] = useState('');

    const incomeCategories = ['工资 Salary', '投资 Investment', '兼职 Side Hustle', '其他 Other'];
    const expenseCategories = ['餐饮 Food', '交通 Transport', '购物 Shopping', '居住 Housing', '娱乐 Entertainment', '其他 Other'];

    useEffect(() => {
        if (!viewedUserId) return;
        const financeRef = doc(db, 'artifacts', appId, 'users', viewedUserId, 'finance', 'data');
        const unsub = onSnapshot(financeRef, (d) => {
            if (d.exists()) {
                setFinanceData(d.data());
            } else {
                setFinanceData({ balance: 0, income: 0, expense: 0, transactions: [], savingsJars: [], commitments: [] });
            }
        });
        return () => unsub();
    }, [viewedUserId]);

    const updateFinance = async (newData) => {
        setFinanceData(newData);
        if (user && viewedUserId) {
            await setDoc(doc(db, 'artifacts', appId, 'users', viewedUserId, 'finance', 'data'), newData);
        }
    };

    const handleAddTransaction = (e) => {
        e.preventDefault();
        if (!txAmount || isNaN(txAmount)) return;
        const amt = parseFloat(txAmount);
        const newTx = { id: generateId(), amount: amt, type: txType, category: txCategory, note: txNote, date: txDate, timestamp: Date.now() };
        const updatedTx = [newTx, ...financeData.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        const newIncome = txType === 'income' ? financeData.income + amt : financeData.income;
        const newExpense = txType === 'expense' ? financeData.expense + amt : financeData.expense;
        updateFinance({ ...financeData, transactions: updatedTx, income: newIncome, expense: newExpense, balance: newIncome - newExpense });
        setTxAmount(''); setTxNote('');
    };

    const handleDeleteTransaction = (id) => {
        const txToDelete = financeData.transactions.find(t => t.id === id);
        if (!txToDelete) return;
        const updatedTx = financeData.transactions.filter(t => t.id !== id);
        const newIncome = txToDelete.type === 'income' ? financeData.income - txToDelete.amount : financeData.income;
        const newExpense = txToDelete.type === 'expense' ? financeData.expense - txToDelete.amount : financeData.expense;
        updateFinance({ ...financeData, transactions: updatedTx, income: newIncome, expense: newExpense, balance: newIncome - newExpense });
    };

    const currentMonthPrefix = getLocalDateString(new Date()).slice(0, 7);
    const monthlyTxs = financeData.transactions.filter(t => t.date.startsWith(currentMonthPrefix));
    
    const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalCommitments = (financeData.commitments || []).reduce((s, c) => s + c.amount, 0);
    
    const safeToSpend = monthlyIncome - monthlyExpense - totalCommitments;

    const categoryTotals = {};
    monthlyTxs.filter(t => t.type === 'expense').forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount; });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 4);

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-800 text-white relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 opacity-80"><Wallet size={16}/> <span className="font-medium text-sm">{t('总净资产', 'Total Net Worth')}</span></div>
                    <div className="text-2xl font-bold">${financeData.balance.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400"><ArrowUpRight size={16}/> <span className="font-medium text-sm">{t('本月总收入', 'Monthly Income')}</span></div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">${monthlyIncome.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400"><Repeat size={16}/> <span className="font-medium text-sm">{t('本月固定扣费', 'Commitments')}</span></div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">${totalCommitments.toLocaleString()}</div>
                </div>
                <div className={`rounded-2xl p-5 shadow-sm border ${safeToSpend >= 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${safeToSpend >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}><Target size={16}/> <span className="font-bold text-sm">{t('本月剩余可用', 'Safe to Spend')}</span></div>
                    <div className={`text-2xl font-bold ${safeToSpend >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>${safeToSpend.toLocaleString()}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Edit3 size={20} className="text-indigo-500"/> {t('快速记账', 'Quick Log')}</h3>
                    <form onSubmit={handleAddTransaction} className="space-y-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button type="button" onClick={() => {setTxType('expense'); setTxCategory(expenseCategories[0]);}} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${txType === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600' : 'text-slate-500'}`}>{t('支出 Expense', 'Expense')}</button>
                            <button type="button" onClick={() => {setTxType('income'); setTxCategory(incomeCategories[0]);}} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${txType === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}>{t('收入 Income', 'Income')}</button>
                        </div>
                        <div className="flex gap-4">
                            <input type="number" value={txAmount} onChange={e=>setTxAmount(e.target.value)} placeholder="0.00" className="w-2/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-2xl font-bold outline-none focus:border-indigo-500 dark:text-white" required />
                            <input type="date" value={txDate} onChange={e=>setTxDate(e.target.value)} className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm outline-none focus:border-indigo-500 dark:text-white" required />
                        </div>
                        <select value={txCategory} onChange={e=>setTxCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 text-sm outline-none dark:text-white focus:border-indigo-500">
                            {(txType === 'expense' ? expenseCategories : incomeCategories).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="text" value={txNote} onChange={e=>setTxNote(e.target.value)} placeholder={t("添加备注 (可选)", "Add note (optional)")} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 text-sm outline-none focus:border-indigo-500 dark:text-white" />
                        <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mt-2">{t('记一笔', 'Save Transaction')}</button>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><ListOrdered size={20} className="text-indigo-500"/> {t('最近交易', 'Recent Transactions')}</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[350px] pr-2">
                        {financeData.transactions.length === 0 ? <p className="text-center text-slate-400 mt-10">{t('暂无交易记录', 'No transactions yet.')}</p> : 
                            financeData.transactions.slice(0, 15).map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                                            {tx.type === 'income' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{tx.category}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tx.date} {tx.note && `• ${tx.note}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                                            {tx.type === 'income' ? '+' : '-'}${tx.amount}
                                        </span>
                                        <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><CreditCard size={20} className="text-indigo-500"/> {t('每月固定支出', 'Monthly Commitments')}</h3>
                        <button onClick={() => setIsCommitmentModalOpen(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-md"><Plus size={16}/> {t('添加', 'Add')}</button>
                    </div>
                    <div className="space-y-3">
                        {(!financeData.commitments || financeData.commitments.length === 0) ? <p className="text-slate-400 text-sm text-center py-4">{t('未设定固定支出', 'No monthly commitments.')}</p> : 
                            financeData.commitments.map(sub => (
                                <div key={sub.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center"><Repeat size={14}/></div>
                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{sub.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-slate-800 dark:text-white">${sub.amount}/mo</span>
                                        <button onClick={() => {
                                            const updated = financeData.commitments.filter(s => s.id !== sub.id);
                                            updateFinance({...financeData, commitments: updated});
                                        }} className="text-slate-400 hover:text-rose-500"><X size={16}/></button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><PieChart size={20} className="text-indigo-500"/> {t('本月非固定支出分类', 'Flexible Expenses')}</h3>
                    <div className="space-y-5">
                        {sortedCategories.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">{t('本月暂无其他支出', 'No expenses logged.')}</p> : 
                            sortedCategories.map(([cat, amt], i) => {
                                const pct = Math.round((amt / monthlyExpense) * 100) || 0;
                                const barColors = ['bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                                return (
                                    <div key={cat}>
                                        <div className="flex justify-between text-sm mb-1.5 font-medium">
                                            <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                                            <span className="text-slate-800 dark:text-white font-bold">${amt} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${barColors[i % barColors.length]}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Landmark size={20} className="text-indigo-500"/> {t('分配储蓄罐', 'Savings Jars')}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t('把收入分配到您的各个银行账户', 'Allocate your income into banks')}</p>
                    </div>
                    <button onClick={() => setIsJarModalOpen(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-md"><Plus size={16}/> {t('新建储蓄罐', 'New Jar')}</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(!financeData.savingsJars || financeData.savingsJars.length === 0) ? <p className="text-slate-400 text-sm col-span-full text-center py-6">{t('点击上方按钮建立第一个储蓄罐吧', 'Set up a savings jar to start allocating.')}</p> : 
                        financeData.savingsJars.map(jar => {
                            const pct = Math.min(100, (jar.current / jar.target) * 100) || 0;
                            return (
                                <div key={jar.id} className="border border-slate-200 dark:border-slate-700 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 relative group flex flex-col justify-between">
                                    <button onClick={() => {
                                        const updated = financeData.savingsJars.filter(g => g.id !== jar.id);
                                        updateFinance({...financeData, savingsJars: updated});
                                    }} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                    
                                    <div>
                                        <span className="inline-block px-2 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-600 mb-3">{jar.bank}</span>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{jar.name}</h4>
                                        <p className="text-sm text-slate-500 mb-4">${jar.current.toLocaleString()} / ${jar.target.toLocaleString()}</p>
                                        
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-5">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => setFundJarId(jar.id)} className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                                        {t('存入资金', 'Add Funds')}
                                    </button>
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            {isJarModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('新建储蓄罐', 'New Savings Jar')}</h3>
                            <button onClick={() => setIsJarModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if(!jarForm.name || !jarForm.target) return;
                            const newJar = { id: generateId(), name: jarForm.name, target: parseFloat(jarForm.target), current: 0, bank: jarForm.bank };
                            updateFinance({...financeData, savingsJars: [...(financeData.savingsJars||[]), newJar]});
                            setJarForm({ name: '', target: '', bank: MALAYSIA_BANKS[0] });
                            setIsJarModalOpen(false);
                        }} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('储蓄罐名称', 'Jar Name')}</label>
                                <input value={jarForm.name} onChange={e=>setJarForm({...jarForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500" required placeholder="e.g. Dream House" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('目标金额', 'Target Amount')}</label>
                                <input type="number" value={jarForm.target} onChange={e=>setJarForm({...jarForm, target: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500" required placeholder="10000" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('存入银行', 'Bank')}</label>
                                <select value={jarForm.bank} onChange={e=>setJarForm({...jarForm, bank: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500">
                                    {MALAYSIA_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-bold mt-4 hover:bg-indigo-700">{t('创建', 'Create')}</button>
                        </form>
                    </div>
                </div>
            )}

            {isCommitmentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('添加每月固定支出', 'Add Commitment')}</h3>
                            <button onClick={() => setIsCommitmentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if(!commitForm.name || !commitForm.amount) return;
                            const newSub = { id: generateId(), name: commitForm.name, amount: parseFloat(commitForm.amount) };
                            updateFinance({...financeData, commitments: [...(financeData.commitments||[]), newSub]});
                            setCommitForm({ name: '', amount: '' });
                            setIsCommitmentModalOpen(false);
                        }} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('支出名称', 'Name')}</label>
                                <input value={commitForm.name} onChange={e=>setCommitForm({...commitForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500" required placeholder="e.g. Car Loan" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('每月金额', 'Monthly Amount')}</label>
                                <input type="number" value={commitForm.amount} onChange={e=>setCommitForm({...commitForm, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500" required placeholder="500" />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-bold mt-4 hover:bg-indigo-700">{t('保存', 'Save')}</button>
                        </form>
                    </div>
                </div>
            )}

            {fundJarId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('存入资金', 'Add Funds')}</h3>
                            <button onClick={() => {setFundJarId(null); setFundAmount('');}} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if(!fundAmount || isNaN(fundAmount)) return;
                            const amt = parseFloat(fundAmount);
                            const updated = financeData.savingsJars.map(g => g.id === fundJarId ? {...g, current: g.current + amt} : g);
                            updateFinance({...financeData, savingsJars: updated});
                            setFundJarId(null); setFundAmount('');
                        }} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('存入金额', 'Amount')}</label>
                                <input type="number" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-2xl font-bold outline-none dark:text-white focus:border-indigo-500" required placeholder="0.00" autoFocus />
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white py-3.5 rounded-lg font-bold mt-4 hover:bg-emerald-700">{t('确认存入', 'Confirm')}</button>
                        </form>
                    </div>
                </div>
            )}
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
  const [authError, setAuthError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
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
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDarkMode]);

  useEffect(() => {
    let unsubRegistry = () => {};
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
        if (u) {
            const isAdm = ADMIN_EMAILS.includes(u.email?.toLowerCase());
            setIsAdmin(isAdm);
            
            if (isAdm) {
                setViewedUserId(u.uid);
                const registryRef = doc(db, 'artifacts', appId, 'public', 'data', 'staff_registry', 'whitelist');
                unsubRegistry = onSnapshot(registryRef, (d) => {
                    if (d.exists()) {
                        setStaffRegistry(d.data().list || []);
                    }
                });
                setUser(u);
                setAuthLoading(false);
            } else {
                // Staff logging in - Check Authorization using exact correct path
                const userMappingRef = doc(db, 'artifacts', appId, 'public', 'data', 'staff_registry', 'whitelist');
                unsubRegistry = onSnapshot(userMappingRef, (d) => {
                    const currentList = d.exists() ? d.data().list || [] : [];
                    if (!currentList.find(x => x.uid === u.uid)) {
                        // Unauthorized or Deleted! Kick them out!
                        signOut(auth);
                        setUser(null);
                        setAuthError(lang === 'zh' ? '您的账号已被管理员移除' : 'Your account has been removed by admin.');
                        setAuthLoading(false);
                    } else {
                        setViewedUserId(u.uid);
                        setUser(u);
                        setAuthLoading(false);
                    }
                });
            }
        } else {
            setUser(null);
            setAuthLoading(false);
        }
    });
    return () => {
        unsubAuth();
        unsubRegistry();
    };
  }, [lang]);

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
  if (!user) return <LoginPage t={t} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} lang={lang} setLang={setLang} authError={authError} />;

  const menuItems = [
    { id: 'focus', icon: Home, label: t('仪表盘', 'Dashboard') },
    { id: 'calendar', icon: CalIcon, label: t('日历', 'Calendar') },
    { id: 'timeline', icon: Trello, label: t('时间轴', 'Timeline') },
    { id: 'review', icon: ClipboardList, label: t('复盘', 'Review') },
    { id: 'finance', icon: DollarSign, label: t('理财', 'Finance') }
  ];

  return (
    <div className={`flex flex-col h-screen w-full font-sans overflow-hidden transition-colors duration-500 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100`}>
      <div className="px-6 md:px-10 pt-6 pb-4 flex justify-between items-center max-w-7xl mx-auto w-full shrink-0">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold