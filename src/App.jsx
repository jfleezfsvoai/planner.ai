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
  Check, Edit, Repeat, UserPlus, ShieldCheck, EyeOff
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, getDocs } from "firebase/firestore";

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

// 初始化双核 App：用于 Admin 注册员工而不被登出
const secondaryApp = getApps().find(a => a.name === "StaffCreatorApp") || initializeApp(firebaseConfig, "StaffCreatorApp");
const secondaryAuth = getAuth(secondaryApp);

// Critical Fix: Must use environmental appId for correct permissions
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lifechanger-pro-main';

// --- Constants ---
const ADMIN_EMAILS = ["gohyuenwei@gmail.com", "jfleezfsvoai@gmail.com"];

const PRIORITIES = {
    'urgent_important': { label: {zh: '紧急重要', en: 'Urgent & Important'}, color: 'bg-rose-500 text-white' },
    'important_not_urgent': { label: {zh: '重要不紧急', en: 'Important, Not Urgent'}, color: 'bg-amber-500 text-white' }
};

const LABEL_COLORS = [
    'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300',
    'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300',
    'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300',
    'bg-cyan-100 text-cyan-600 border-cyan-200 dark:bg-cyan-500/20 dark:border-cyan-500/30 dark:text-cyan-300'
];

const MALAYSIA_BANKS = ["Maybank", "CIMB Bank", "Public Bank", "RHB Bank", "Hong Leong", "AmBank", "UOB", "Bank Islam", "Standard Chartered", "OCBC", "HSBC", "Cash / 其他"];

const SOLID_BGS = [
    "bg-indigo-600", "bg-emerald-600", "bg-rose-600", "bg-amber-600", "bg-slate-800"
];
const GRADIENT_BGS = [
    "bg-gradient-to-br from-slate-800 to-slate-900",
    "bg-gradient-to-br from-indigo-500 to-purple-700",
    "bg-gradient-to-br from-emerald-500 to-teal-700",
    "bg-gradient-to-br from-rose-500 to-orange-500",
    "bg-gradient-to-br from-blue-500 to-cyan-600"
];
const METALLIC_BGS = [
    "bg-gradient-to-br from-yellow-600 via-amber-700 to-yellow-900", 
    "bg-gradient-to-br from-slate-400 via-slate-600 to-slate-800",   
    "bg-gradient-to-br from-orange-600 via-orange-800 to-stone-900", 
    "bg-gradient-to-br from-rose-500 via-rose-700 to-rose-950",      
    "bg-gradient-to-br from-zinc-600 via-zinc-800 to-zinc-950"       
];

// --- Utils ---
const getLocalDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDaysArray = (startStr, endStr) => {
    if (!startStr || !endStr) return [];
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const [ey, em, ed] = endStr.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const arr = [];
    let curr = new Date(start);
    let limit = 0;
    while(curr <= end && limit < 32) {
        arr.push(getLocalDateString(curr));
        curr.setDate(curr.getDate() + 1);
        limit++;
    }
    return arr;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- 1. LoginPage Component ---
const LoginPage = ({ t, isDarkMode, setIsDarkMode, lang, setLang, authError }) => {
    const [isLogin, setIsLogin] = useState(true); 
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState(''); 
    const [error, setError] = useState(''); 
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (authError) setError(authError);
    }, [authError]);

    const handleAuth = async (e) => {
        e.preventDefault(); 
        setError(''); 
        setLoading(true);
        try { 
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email.trim(), password); 
            } else {
                await createUserWithEmailAndPassword(auth, email.trim(), password);
            }
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

    const handleToggleMode = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setError('');
    };

    return (
        <div className={`flex flex-col h-screen w-full font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
            <div className="absolute top-6 right-8 flex items-center gap-2 z-50">
                <button 
                    onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} 
                    className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors"
                >
                    {lang === 'zh' ? 'EN' : '中'}
                </button>
                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
                </button>
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
                            <input 
                                type="email" 
                                placeholder="name@company.com" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-base outline-none focus:border-indigo-500 dark:text-white transition-all shadow-sm" 
                                required 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('安全密码', 'Password')}</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-base outline-none focus:border-indigo-500 dark:text-white transition-all shadow-sm" 
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-lg shadow-md hover:bg-indigo-700 transition-all flex justify-center items-center gap-3 text-lg mt-4"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={24}/> : <>{isLogin ? t('进入系统', 'LOGIN NOW') : t('注册账号', 'CREATE ACCESS')}<ArrowRight size={20} /></>}
                        </button>
                    </form>

                    <div className="mt-8 flex justify-center">
                        <button type="button" onClick={handleToggleMode} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline transition-colors">
                            {isLogin ? t('注册新账号', 'Create new account') : t('返回登录', 'Back to login')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StaffManagerModal = ({ isOpen, onClose, globalStaffRegistry, myStaffRegistry, currentUser, t }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setStatus({ type: '', msg: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCloseModal = () => {
        onClose();
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        setLoading(true); 
        setStatus({ type: '', msg: '' });
        
        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
            const newUid = userCredential.user.uid;
            await signOut(secondaryAuth);

            const updatedList = [...globalStaffRegistry, { email: email.toLowerCase().trim(), uid: newUid, adminEmail: currentUser.email }];
            await setDoc(doc(db, 'artifacts', appId, 'public', 'staff_registry'), { list: updatedList });

            setStatus({ type: 'success', msg: t('账号创建成功！员工可立刻登录。', 'Account created! Staff can login now.') });
            setEmail(''); 
            setPassword('');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                try {
                    const userCredential = await signInWithEmailAndPassword(secondaryAuth, email.trim(), password);
                    const existingUid = userCredential.user.uid;
                    await signOut(secondaryAuth);
                    
                    const filteredList = globalStaffRegistry.filter(s => s.email !== email.toLowerCase().trim());
                    const updatedList = [...filteredList, { email: email.toLowerCase().trim(), uid: existingUid, adminEmail: currentUser.email }];
                    
                    await setDoc(doc(db, 'artifacts', appId, 'public', 'staff_registry'), { list: updatedList });

                    setStatus({ type: 'success', msg: t('账号已存在，已成功重新激活并归入您的管理中！', 'Account exists. Re-authorized to your team successfully!') });
                    setEmail(''); 
                    setPassword('');
                } catch (loginErr) {
                    setStatus({ type: 'error', msg: t('该邮箱已被注册，且密码不匹配。请在后台彻底删除或使用旧密码。', 'Email in use with wrong password. Use correct password.') });
                }
            } else {
                setStatus({ type: 'error', msg: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStaff = async (staffEmail) => {
        const updatedList = globalStaffRegistry.filter(s => s.email !== staffEmail);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'staff_registry'), { list: updatedList });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={handleCloseModal}>
            <div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center"><UserPlus size={20}/></div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('添加与管理您的员工', 'Manage Your Staff')}</h3>
                    </div>
                    <button onClick={handleCloseModal} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X size={18}/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    <form onSubmit={handleCreateStaff} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('员工邮箱', 'Staff Email')}</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                autoComplete="off"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none focus:border-indigo-500 dark:text-white shadow-sm" 
                                placeholder="staff@company.com" 
                                required 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('设置登录密码', 'Set Password')}</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                autoComplete="new-password"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none focus:border-indigo-500 dark:text-white shadow-sm" 
                                placeholder="••••••••" 
                                required 
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold text-base shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-2">
                            {loading ? <RefreshCw size={20} className="animate-spin"/> : <UserPlus size={20}/>} 
                            {t('创建并归入名下', 'Create & Authorize')}
                        </button>
                    </form>

                    {status.msg && (
                        <div className={`p-4 rounded-lg text-sm font-medium text-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                            {status.msg}
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('您名下的员工', 'Your Active Staff')}</h4>
                        {myStaffRegistry.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 font-medium border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">{t('暂无您的专属员工', 'No Staff assigned to you.')}</div>
                        ) : (
                            myStaffRegistry.map((s, idx) => {
                                const emailStr = typeof s === 'string' ? s : (s?.email || 'Unknown');
                                return (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-md flex items-center justify-center font-bold text-sm">
                                                {emailStr[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{emailStr}</span>
                                        </div>
                                        <button onClick={() => handleRemoveStaff(emailStr)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                            <Trash2 size={18}/>
                                        </button>
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

  useEffect(() => { 
      if (isOpen) { 
          setTitle(''); 
          setTime(prefilledTime); 
          setPriority(''); 
          setIsRecurring(false); 
          setNewCatName('');
          setShowNewCatInput(false);
      } 
  }, [isOpen, prefilledTime]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
      onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault(); 
    if (!title.trim()) return;
    onAdd({ title, category, priority, time, date: defaultDate, recurring: isRecurring ? 'daily' : 'none' });
    handleCloseModal();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={handleCloseModal}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('新建计划', 'New Plan')}</h3>
          <button onClick={handleCloseModal} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X size={18}/></button>
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


// --- Shared TaskCard Component ---
const TaskCard = memo(({ task, onToggle, onDelete, onUpdateTask, onReorderDrop, categories, t }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task?.title || '');
    const [editCategory, setEditCategory] = useState(task?.category || categories[0]?.name);
    const [editPriority, setEditPriority] = useState(task?.priority || '');
    const [editRecurring, setEditRecurring] = useState(task?.recurring === 'daily');
    const [editComment, setEditComment] = useState(task?.comment || '');
    const [dragOverPos, setDragOverPos] = useState(null);

    useEffect(() => {
        if (isEditing) {
            setEditTitle(task?.title || '');
            setEditCategory(task?.category || categories[0]?.name);
            setEditPriority(task?.priority || '');
            setEditRecurring(task?.recurring === 'daily');
            setEditComment(task?.comment || '');
        }
    }, [isEditing, task, categories]);
  
    const priorityInfo = PRIORITIES[task?.priority];
    const catObj = categories.find(c => c.name === task?.category) || { color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400' };
    const isUrgentHighlight = task?.priority === 'urgent_important' && !task?.completed;
  
    const handleSave = () => {
        if (!editTitle.trim()) return;
        const updates = { 
            title: editTitle, 
            category: editCategory, 
            priority: editPriority, 
            recurring: editRecurring ? 'daily' : 'none',
            comment: editComment.trim()
        };
        
        if (task?.recurring === 'daily' && !editRecurring) {
            updates.cancelRecurring = true;
        } else if (task?.recurring !== 'daily' && editRecurring) {
            updates.makeRecurring = true;
        }
        
        onUpdateTask(task.id, updates);
        setIsEditing(false);
    };
  
    if (isEditing) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-indigo-500 p-4 shadow-md animate-in zoom-in-95 duration-200 w-full min-w-0">
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full text-base font-semibold mb-3 border-b border-indigo-200 dark:border-indigo-800 outline-none bg-transparent dark:text-white pb-1" autoFocus />
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm outline-none dark:text-white">
                        {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={editPriority} onChange={e => setEditPriority(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm outline-none dark:text-white">
                        <option value="">{t('无优先级', 'No Priority')}</option>
                        {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label[t('zh','en')]}</option>)}
                    </select>
                </div>
                <textarea 
                    value={editComment} 
                    onChange={e => setEditComment(e.target.value)} 
                    placeholder={t('添加备注 (Optional)', 'Add comment (Optional)')} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-xs outline-none dark:text-white mb-3 resize-none h-16 custom-scrollbar break-words"
                />
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setEditRecurring(!editRecurring)} className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${editRecurring ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}`}>
                            {editRecurring && <Check size={12} strokeWidth={3} />}
                        </button>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('每日循环', 'Daily Recurring')}</span>
                    </div>
                    {task?.recurring === 'daily' && !editRecurring && (
                        <span className="text-xs font-semibold text-rose-500 animate-pulse">{t('将取消未来重复', 'Will cancel future tasks')}</span>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors">{t('取消', 'Cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-all">{t('保存', 'Save')}</button>
                </div>
            </div>
        );
    }
  
    return (
      <div 
          draggable 
          onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
          onDragOver={e => {
              if (!onReorderDrop) return;
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              setDragOverPos(y < rect.height / 2 ? 'top' : 'bottom');
          }}
          onDragLeave={() => setDragOverPos(null)}
          onDrop={e => {
              if (!onReorderDrop) return;
              e.preventDefault();
              e.stopPropagation();
              setDragOverPos(null);
              const draggedId = e.dataTransfer.getData('taskId');
              if (draggedId && draggedId !== task.id) {
                  onReorderDrop(draggedId, task.id, dragOverPos, task.date, task.time);
              }
          }}
          className={`w-full min-w-0 bg-white dark:bg-slate-800 rounded-lg border p-4 shadow-sm hover:shadow-md transition-all group relative ${task?.completed ? 'opacity-50 border-slate-200 dark:border-slate-700' : (isUrgentHighlight ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-900/20' : 'border-slate-200 dark:border-slate-700')}`}
      >
        {dragOverPos === 'top' && <div className="absolute -top-1.5 left-0 right-0 h-1.5 bg-indigo-500 rounded-full z-50 pointer-events-none shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
        {dragOverPos === 'bottom' && <div className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-indigo-500 rounded-full z-50 pointer-events-none shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}

        <div className="flex items-start gap-3 w-full">
          <button onClick={() => onToggle(task.id)} className={`mt-0.5 shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all ${task?.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-400'}`}>
            {task?.completed && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="flex-1 min-w-0 overflow-hidden" onDoubleClick={() => setIsEditing(true)}>
            <h4 className={`text-base font-medium truncate block w-full ${task?.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`} title={task?.title}>{task?.title}</h4>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded font-medium border whitespace-nowrap ${catObj.color}`}>{task?.category || t('未分类', 'Draft')}</span>
              {priorityInfo && <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${priorityInfo.color}`}>{priorityInfo.label[t('zh', 'en')]}</span>}
              {task?.time && <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap"><Clock size={12}/>{task.time}</span>}
              {task?.recurring === 'daily' && <span className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1"><Repeat size={12}/></span>}
            </div>
            {task?.comment && (
                <div className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-md border border-slate-100 dark:border-slate-700/50 italic break-words whitespace-pre-wrap">
                    {task.comment}
                </div>
            )}
          </div>
          <div className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity pl-1">
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-700"><Edit size={16}/></button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2 size={16}/></button>
            <div className="p-1 text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing">
                <GripVertical size={16} />
            </div>
          </div>
        </div>
      </div>
    );
});

// --- 3. HabitTrackerComponent ---
const HabitTrackerComponent = ({ habits, onUpdate, onAdd, onDelete, onCloneHabits, t }) => {
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

    const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newHabit, setNewHabit] = useState({ name: '', goal: '', frequency: daysInMonth });
    
    // States for Clone History Modal
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [cloneYear, setCloneYear] = useState(selectedYear);
    const [cloneMonth, setCloneMonth] = useState(selectedMonth === 0 ? 11 : selectedMonth - 1);

    const years = Array.from({length: 10}, (_, i) => today.getFullYear() - 5 + i);
    const months = Array.from({length: 12}, (_, i) => i);

    useEffect(() => {
        if (isAddModalOpen) {
            setNewHabit({ name: '', goal: '', frequency: daysInMonth });
        }
    }, [isAddModalOpen, daysInMonth]);

    const displayedHabits = habits.filter(h => {
         if (h.targetMonth) return h.targetMonth === currentMonthKey;
         const hasCompletionsThisMonth = (h.completedDays || []).some(d => d.startsWith(currentMonthKey));
         if (hasCompletionsThisMonth) return true;
         const realCurrentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
         return currentMonthKey === realCurrentMonthKey;
    });

    const toggleDay = (habitId, day) => {
        const habit = habits.find(h => h.id === habitId); if (!habit) return;
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const currentDone = habit.completedDays || [];
        const newDone = currentDone.includes(dateStr) ? currentDone.filter(d => d !== dateStr) : [...currentDone, dateStr];
        onUpdate(habitId, { completedDays: newDone });
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setNewHabit({ name: '', goal: '', frequency: daysInMonth });
    };

    const handleAddHabit = () => {
        if (newHabit.name) {
            onAdd({ name: newHabit.name, goal: newHabit.goal, frequency: Number(newHabit.frequency) || daysInMonth, targetMonth: currentMonthKey, completedDays: [] });
            handleCloseModal();
        }
    };

    // Calculate habits from the selected clone source month
    const sourceMonthKey = `${cloneYear}-${String(cloneMonth + 1).padStart(2, '0')}`;
    const sourceHabits = habits.filter(h => h.targetMonth === sourceMonthKey || (!h.targetMonth && (h.completedDays || []).some(d => d?.startsWith?.(sourceMonthKey))));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col gap-6 w-full h-full transition-colors relative">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center"><Activity size={20}/></div>
                    <div className="flex flex-row items-center gap-3">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">{t('习惯追踪', 'Habit Tracker')}</h4>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 w-fit">
                            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 outline-none cursor-pointer dark:bg-slate-800">
                                {years.map(y => <option key={y} value={y}>{y} {t('年', 'Year')}</option>)}
                            </select>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-xs font-semibold text-slate-600 dark:text-slate-400 outline-none cursor-pointer dark:bg-slate-800">
                                {months.map(m => <option key={m} value={m}>{String(m + 1).padStart(2, '0')} {t('月', 'Month')}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => {
                        setCloneYear(selectedMonth === 0 ? selectedYear - 1 : selectedYear);
                        setCloneMonth(selectedMonth === 0 ? 11 : selectedMonth - 1);
                        setIsCloneModalOpen(true);
                    }} className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-lg font-medium text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-sm">
                        <Copy size={16}/> {t('克隆习惯', 'Clone')}
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-all shadow-sm">
                        <Plus size={18}/> {t('添加习惯', 'Add Habit')}
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar pb-2 flex-1 max-h-[50vh] min-h-[300px]">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <th className="text-left py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 whitespace-nowrap min-w-[120px]">{t('习惯', 'Habit')}</th>
                            <th className="text-left py-3 px-4 w-32 whitespace-nowrap">{t('目标', 'Goal')}</th>
                            <th className="text-left py-3 px-4 w-48 whitespace-nowrap">{t('当月进度', 'Progress')}</th>
                            <th className="py-3 px-4">
                                <div className="flex gap-1">
                                    {daysArray.map(d => <div key={d} className="w-8 h-8 flex items-center justify-center shrink-0 font-medium">{d}</div>)}
                                </div>
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedHabits.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-10 text-slate-400 font-medium">{t('本月没有任何习惯追踪', 'No habits tracked for this month.')}</td></tr>
                        ) : displayedHabits.map(habit => {
                            const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
                            const monthCompletions = (habit.completedDays || []).filter(d => d?.startsWith?.(currentMonthKey)).length;
                            const freq = habit.frequency || 1;
                            const progressPercentage = Math.min(100, (monthCompletions / freq) * 100);
                            return (
                                <tr key={habit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors last:border-0">
                                    <td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-10 whitespace-nowrap">
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
                                                const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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

            {/* Smart Clone Modal */}
            {isCloneModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={() => setIsCloneModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Copy size={18} className="text-indigo-500" /> {t('克隆历史习惯', 'Clone Habits')}</h3>
                            <button onClick={() => setIsCloneModalOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"><X size={18}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('选择要复制的月份', 'Select Month to Clone')}</label>
                                <div className="flex gap-2">
                                    <select value={cloneYear} onChange={e => setCloneYear(Number(e.target.value))} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500">
                                        {years.map(y => <option key={y} value={y}>{y} {t('年', 'Year')}</option>)}
                                    </select>
                                    <select value={cloneMonth} onChange={e => setCloneMonth(Number(e.target.value))} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500">
                                        {months.map(m => <option key={m} value={m}>{String(m + 1).padStart(2, '0')} {t('月', 'Month')}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('将复制以下习惯', 'Habits to be cloned')}:</h4>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {sourceHabits.length === 0 ? (
                                        <p className="text-center text-sm text-slate-400 py-4">{t('该月份没有记录', 'No habits found.')}</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {sourceHabits.map(h => (
                                                <li key={h.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                    <span className="truncate">{h.name}</span>
                                                    {h.goal && <span className="text-xs text-slate-400 truncate border-l border-slate-300 dark:border-slate-600 pl-2 ml-1">{h.goal}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    if (sourceHabits.length === 0) return;
                                    const habitsToClone = sourceHabits.map(h => ({
                                        name: h.name,
                                        goal: h.goal,
                                        frequency: daysInMonth, // Match new month's day count
                                        targetMonth: currentMonthKey,
                                        completedDays: []
                                    }));
                                    if (onCloneHabits) onCloneHabits(habitsToClone);
                                    setIsCloneModalOpen(false);
                                }}
                                disabled={sourceHabits.length === 0}
                                className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-lg shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {t('确认克隆', 'Confirm Clone')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Habit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4" onClick={handleCloseModal}>
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
                                <button onClick={handleCloseModal} className="flex-1 py-3 rounded-lg font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition-colors">{t('取消', 'Cancel')}</button>
                                <button onClick={handleAddHabit} className="flex-1 py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all">{t('保存', 'Save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- NEW 4. Finance Vault (RM Currency, Custom Categories, Image Backgrounds, Simplified Tx UI) ---
const FinanceVault = ({ t, viewedUserId, user, isAdmin }) => {
    const defaultIncomeCategories = ['工资 Salary', '投资 Investment', '兼职 Side Hustle', '其他 Other'];
    const defaultExpenseCategories = ['餐饮 Food', '交通 Transport', '购物 Shopping', '居住 Housing', '娱乐 Entertainment', '其他 Other'];

    const [financeData, setFinanceData] = useState({
        balance: 0,
        income: 0,
        expense: 0,
        transactions: [],
        savingsJars: [], 
        commitments: [],
        customIncomeCategories: [],
        customExpenseCategories: []
    });

    const incomeCategories = [...defaultIncomeCategories, ...(financeData.customIncomeCategories || [])];
    const expenseCategories = [...defaultExpenseCategories, ...(financeData.customExpenseCategories || [])];

    const [txAmount, setTxAmount] = useState('');
    const [txType, setTxType] = useState('expense');
    const [txCategory, setTxCategory] = useState(expenseCategories[0]);
    const [txNote, setTxNote] = useState('');
    const [txDate, setTxDate] = useState(getLocalDateString(new Date()));
    
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [isJarModalOpen, setIsJarModalOpen] = useState(false);
    const [editJarId, setEditJarId] = useState(null);
    const [jarForm, setJarForm] = useState({ name: '', target: '', bank: MALAYSIA_BANKS[0], account: '', bgColor: GRADIENT_BGS[0], bgImage: '' });
    const [bgType, setBgType] = useState('gradient');
    
    const [viewJarHistory, setViewJarHistory] = useState(null);

    const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
    const [commitForm, setCommitForm] = useState({ name: '', amount: '' });

    const [fundJarId, setFundJarId] = useState(null);
    const [fundAmount, setFundAmount] = useState('');

    useEffect(() => {
        if (!viewedUserId) return;
        const financeRef = doc(db, 'artifacts', appId, 'users', viewedUserId, 'finance', 'data');
        const unsub = onSnapshot(financeRef, (d) => {
            if (d.exists()) {
                const data = d.data();
                setFinanceData({
                    balance: data.balance || 0,
                    income: data.income || 0,
                    expense: data.expense || 0,
                    transactions: data.transactions || [],
                    savingsJars: data.savingsJars || [],
                    commitments: data.commitments || [],
                    customIncomeCategories: data.customIncomeCategories || [],
                    customExpenseCategories: data.customExpenseCategories || []
                });
            } else {
                setFinanceData({ balance: 0, income: 0, expense: 0, transactions: [], savingsJars: [], commitments: [], customIncomeCategories: [], customExpenseCategories: [] });
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

    const handleAddCategory = () => {
        if(!newCategoryName.trim()) return;
        let updatedData = { ...financeData };
        if(txType === 'income') {
            updatedData.customIncomeCategories = [...(updatedData.customIncomeCategories || []), newCategoryName];
        } else {
            updatedData.customExpenseCategories = [...(updatedData.customExpenseCategories || []), newCategoryName];
        }
        updateFinance(updatedData);
        setTxCategory(newCategoryName);
        setNewCategoryName('');
        setShowAddCategory(false);
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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
                setJarForm({ ...jarForm, bgImage: dataUrl, bgColor: '' });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSaveJar = (e) => {
        e.preventDefault();
        if(!jarForm.name || !jarForm.target) return;
        
        if (editJarId) {
            const updated = financeData.savingsJars.map(g => g.id === editJarId ? { ...g, ...jarForm, target: parseFloat(jarForm.target) } : g);
            updateFinance({...financeData, savingsJars: updated});
        } else {
            const newJar = { id: generateId(), name: jarForm.name, target: parseFloat(jarForm.target), current: 0, bank: jarForm.bank, account: jarForm.account, bgColor: jarForm.bgColor, bgImage: jarForm.bgImage, history: [] };
            updateFinance({...financeData, savingsJars: [...(financeData.savingsJars||[]), newJar]});
        }
        closeJarModal();
    };

    const handleEditJar = (jar) => {
        setJarForm({ name: jar.name, target: jar.target, bank: jar.bank || MALAYSIA_BANKS[0], account: jar.account || '', bgColor: jar.bgColor || GRADIENT_BGS[0], bgImage: jar.bgImage || '' });
        
        if (SOLID_BGS.includes(jar.bgColor)) setBgType('solid');
        else if (METALLIC_BGS.includes(jar.bgColor)) setBgType('metallic');
        else setBgType('gradient');

        setEditJarId(jar.id);
        setIsJarModalOpen(true);
    };

    const handleAddFund = (e) => {
        e.preventDefault();
        if(!fundAmount || isNaN(fundAmount)) return;
        const amt = parseFloat(fundAmount);

        const updatedJars = financeData.savingsJars.map(g => {
            if(g.id === fundJarId) {
                const newBalance = g.current + amt;
                const historyItem = { id: generateId(), date: getLocalDateString(new Date()), time: new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}), amount: amt, balanceAfter: newBalance };
                return { ...g, current: newBalance, history: [historyItem, ...(g.history || [])] };
            }
            return g;
        });

        updateFinance({...financeData, savingsJars: updatedJars});
        closeFundModal();
    };

    const closeJarModal = () => { 
        setIsJarModalOpen(false); 
        setEditJarId(null);
        setJarForm({ name: '', target: '', bank: MALAYSIA_BANKS[0], account: '', bgColor: GRADIENT_BGS[0], bgImage: '' });
        setBgType('gradient');
    };
    const closeCommitModal = () => { setIsCommitmentModalOpen(false); setCommitForm({ name: '', amount: '' }); };
    const closeFundModal = () => { setFundJarId(null); setFundAmount(''); };

    // Calculations for the current month
    const currentMonthPrefix = getLocalDateString(new Date()).slice(0, 7);
    const monthlyTxs = financeData.transactions.filter(t => t.date.startsWith(currentMonthPrefix));
    const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthlyExpense = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalCommitments = financeData.commitments.reduce((s, c) => s + c.amount, 0);
    const safeToSpend = monthlyIncome - monthlyExpense - totalCommitments;

    const categoryTotals = {};
    monthlyTxs.filter(t => t.type === 'expense').forEach(t => { categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount; });
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 4);

    // Group transactions by date for a cleaner UI
    const groupedTxs = {};
    financeData.transactions.forEach(tx => {
        if(!groupedTxs[tx.date]) groupedTxs[tx.date] = [];
        groupedTxs[tx.date].push(tx);
    });
    const sortedDates = Object.keys(groupedTxs).sort((a,b) => new Date(b) - new Date(a));

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-10">
            {/* Top Row: Flow & Disposable Income Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-800 text-white relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 opacity-80"><Wallet size={16}/> <span className="font-medium text-sm">{t('总净资产', 'Total Net Worth')}</span></div>
                    <div className="text-2xl font-bold">RM {financeData.balance.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400"><ArrowUpRight size={16}/> <span className="font-medium text-sm">{t('本月总收入', 'Monthly Income')}</span></div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">RM {monthlyIncome.toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400"><Repeat size={16}/> <span className="font-medium text-sm">{t('本月固定扣费', 'Commitments')}</span></div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">RM {totalCommitments.toLocaleString()}</div>
                </div>
                <div className={`rounded-2xl p-5 shadow-sm border ${safeToSpend >= 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50'}`}>
                    <div className={`flex items-center gap-2 mb-1 ${safeToSpend >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}><Target size={16}/> <span className="font-bold text-sm">{t('本月剩余可用', 'Safe to Spend')}</span></div>
                    <div className={`text-2xl font-bold ${safeToSpend >= 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>RM {safeToSpend.toLocaleString()}</div>
                </div>
            </div>

            {/* Middle Grid: Quick Log & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Edit3 size={20} className="text-indigo-500"/> {t('快速记账', 'Quick Log')}</h3>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button type="button" onClick={() => {setTxType('expense'); setTxCategory(expenseCategories[0]); setShowAddCategory(false);}} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${txType === 'expense' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600' : 'text-slate-500'}`}>{t('支出 Expense', 'Expense')}</button>
                                <button type="button" onClick={() => {setTxType('income'); setTxCategory(incomeCategories[0]); setShowAddCategory(false);}} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${txType === 'income' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}>{t('收入 Income', 'Income')}</button>
                            </div>
                            <div className="flex gap-4">
                                <input type="number" value={txAmount} onChange={e=>setTxAmount(e.target.value)} placeholder="0.00" className="w-2/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-2xl font-bold outline-none focus:border-indigo-500 dark:text-white" required />
                                <input type="date" value={txDate} onChange={e=>setTxDate(e.target.value)} className="w-1/3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm outline-none focus:border-indigo-500 dark:text-white" required />
                            </div>
                            <div className="flex gap-2">
                                <select value={txCategory} onChange={e=>setTxCategory(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 text-sm outline-none dark:text-white focus:border-indigo-500">
                                    {(txType === 'expense' ? expenseCategories : incomeCategories).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <button type="button" onClick={() => setShowAddCategory(!showAddCategory)} className="p-3.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"><Plus size={18}/></button>
                            </div>

                            {showAddCategory && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex gap-2 animate-in slide-in-from-top-2">
                                  <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 text-sm outline-none dark:text-white" placeholder={t('新类别名称', 'New Category')} />
                                  <button type="button" onClick={handleAddCategory} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium">{t('添加', 'Add')}</button>
                                </div>
                            )}

                            <input type="text" value={txNote} onChange={e=>setTxNote(e.target.value)} placeholder={t("添加备注 (可选)", "Add note (optional)")} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 text-sm outline-none focus:border-indigo-500 dark:text-white" />
                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mt-2">{t('记一笔', 'Save Transaction')}</button>
                        </form>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><ListOrdered size={20} className="text-indigo-500"/> {t('最近交易', 'Recent Transactions')}</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 max-h-[400px] pr-2">
                        {sortedDates.length === 0 ? <p className="text-center text-slate-400 mt-10">{t('暂无交易记录', 'No transactions yet.')}</p> : 
                            sortedDates.slice(0, 10).map(date => (
                                <div key={date} className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-400 sticky top-0 bg-white dark:bg-slate-900 py-1 z-10">{date}</h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                                        {groupedTxs[date].map((tx, idx) => (
                                            <div key={tx.id} className={`flex justify-between items-center p-3 group ${idx !== groupedTxs[date].length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                                                        {tx.type === 'income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{tx.category}</span>
                                                        {tx.note && <span className="text-[10px] text-slate-500">{tx.note}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                                                        {tx.type === 'income' ? '+' : '-'}RM {tx.amount}
                                                    </span>
                                                    <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* Commitments & Analytics */}
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
                                        <span className="font-bold text-slate-800 dark:text-white">RM {sub.amount}/mo</span>
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
                                            <span className="text-slate-800 dark:text-white font-bold">RM {amt} ({pct}%)</span>
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

            {/* Savings Jars */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Landmark size={20} className="text-indigo-500"/> {t('分配储蓄罐', 'Savings Jars')}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t('把收入分配到您的各个银行账户，支持自定义背景', 'Allocate income & set backgrounds')}</p>
                    </div>
                    <button onClick={() => setIsJarModalOpen(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-md"><Plus size={16}/> {t('新建储蓄罐', 'New Jar')}</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(!financeData.savingsJars || financeData.savingsJars.length === 0) ? <p className="text-slate-400 text-sm col-span-full text-center py-6">{t('点击上方按钮建立第一个储蓄罐吧', 'Set up a savings jar to start allocating.')}</p> : 
                        financeData.savingsJars.map(jar => {
                            const pct = Math.min(100, (jar.current / jar.target) * 100) || 0;
                            // Render intelligent background: Image with overlay, OR selected color.
                            return (
                                <div key={jar.id} className={`relative p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group flex flex-col justify-between min-h-[240px] ${jar.bgImage ? 'bg-slate-950' : (jar.bgColor || GRADIENT_BGS[0])}`}>
                                    {/* Image with intelligent dark fade overlay */}
                                    {jar.bgImage && (
                                        <>
                                            <img src={jar.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 transition-transform duration-700 group-hover:scale-105" alt="bg" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/20 z-0 pointer-events-none" />
                                        </>
                                    )}
                                    {/* Default slight dim for solid/gradient colors to ensure white text readability */}
                                    {!jar.bgImage && <div className="absolute inset-0 bg-black/10 dark:bg-black/20 z-0 pointer-events-none" />}

                                    <div className="relative z-10 flex justify-between items-start mb-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-block px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-md shadow-sm w-fit">{jar.bank}</span>
                                            {jar.account && <span className="text-xs font-mono font-bold text-white/90 drop-shadow-md">{jar.account}</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm p-1.5 rounded-lg">
                                            <button onClick={() => setViewJarHistory(jar)} title={t('历史记录', 'History')} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"><History size={14}/></button>
                                            <button onClick={() => handleEditJar(jar)} title={t('编辑', 'Edit')} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"><Edit size={14}/></button>
                                            <button onClick={() => { const updated = financeData.savingsJars.filter(g => g.id !== jar.id); updateFinance({...financeData, savingsJars: updated}); }} title={t('删除', 'Delete')} className="p-1.5 text-white/80 hover:text-rose-400 hover:bg-white/20 rounded-md transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <h4 className="text-xl font-bold text-white mb-1 drop-shadow-md">{jar.name}</h4>
                                        <p className="text-sm text-white/90 mb-4 drop-shadow-md font-medium">RM {jar.current.toLocaleString()} / RM {jar.target.toLocaleString()}</p>
                                        
                                        <div className="h-2.5 w-full bg-black/30 rounded-full overflow-hidden mb-5 backdrop-blur-sm border border-white/10">
                                            <div className="h-full bg-white rounded-full transition-all shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${pct}%` }} />
                                        </div>
                                        <button onClick={() => setFundJarId(jar.id)} className="w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-lg text-sm font-bold text-white transition-colors shadow-sm">
                                            {t('存入资金', 'Add Funds')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            {/* Custom Modals for Finance */}
            {isJarModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={closeJarModal}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editJarId ? t('编辑储蓄罐', 'Edit Savings Jar') : t('新建储蓄罐', 'New Savings Jar')}</h3>
                            <button onClick={closeJarModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSaveJar} className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
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
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('银行账号 (可选)', 'Account Number')}</label>
                                <input type="text" value={jarForm.account} onChange={e=>setJarForm({...jarForm, account: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm outline-none dark:text-white focus:border-indigo-500 font-mono" placeholder="e.g. 1122334455" />
                            </div>
                            
                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('外观设计', 'Visual Design')}</label>
                                
                                <div className="flex gap-2 mb-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                    <button type="button" onClick={()=>setBgType('gradient')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${bgType==='gradient' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t('渐变 Gradient', 'Gradient')}</button>
                                    <button type="button" onClick={()=>setBgType('metallic')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${bgType==='metallic' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t('金属 Metallic', 'Metallic')}</button>
                                    <button type="button" onClick={()=>setBgType('solid')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${bgType==='solid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}>{t('单色 Solid', 'Solid')}</button>
                                </div>
                                
                                <div className="grid grid-cols-5 gap-2">
                                    {(bgType === 'solid' ? SOLID_BGS : bgType === 'metallic' ? METALLIC_BGS : GRADIENT_BGS).map(bg => (
                                        <button key={bg} type="button" onClick={() => setJarForm({...jarForm, bgColor: bg, bgImage: ''})} className={`w-full aspect-square rounded-lg border-2 ${bg} ${jarForm.bgColor === bg && !jarForm.bgImage ? 'border-indigo-500 scale-105 shadow-md' : 'border-transparent hover:scale-105 transition-transform'}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('自定义背景图 (覆盖颜色)', 'Custom Photo (Overrides Color)')}</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center justify-center gap-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <ImageIcon size={18} className="text-indigo-500" />
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">{jarForm.bgImage ? t('已上传图片 (点击更换)', 'Image Uploaded (Click to change)') : t('上传风景照', 'Upload Photo')}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                    {jarForm.bgImage && (
                                        <button type="button" onClick={() => setJarForm({...jarForm, bgImage: ''})} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-bold mt-6 hover:bg-indigo-700">{editJarId ? t('保存修改', 'Save Changes') : t('创建储蓄罐', 'Create')}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Jar History Modal */}
            {viewJarHistory && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setViewJarHistory(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{viewJarHistory.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{t('存入记录明细', 'Deposit History')}</p>
                            </div>
                            <button onClick={() => setViewJarHistory(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                            {(!viewJarHistory.history || viewJarHistory.history.length === 0) ? <p className="text-center text-slate-400 font-medium py-6">{t('暂无存入记录', 'No deposit history.')}</p> : 
                                viewJarHistory.history.map((record, i) => (
                                    <div key={record.id || i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><ArrowDownRight size={16}/></div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{record.date}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{record.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">+ RM {record.amount}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{t('余额:', 'Bal:')} RM {record.balanceAfter}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {isCommitmentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={closeCommitModal}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('添加每月固定支出', 'Add Commitment')}</h3>
                            <button onClick={closeCommitModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if(!commitForm.name || !commitForm.amount) return;
                            const newSub = { id: generateId(), name: commitForm.name, amount: parseFloat(commitForm.amount) };
                            updateFinance({...financeData, commitments: [...(financeData.commitments||[]), newSub]});
                            closeCommitModal();
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={closeFundModal}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('存入资金', 'Add Funds')}</h3>
                            <button onClick={closeFundModal} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleAddFund} className="p-6 space-y-4">
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

// --- Views (Dashboard, Calendar, Timeline, Review) ---
const DashboardView = ({ tasks, categories, habits, onUpdateHabit, onAddHabit, onDeleteHabit, onCloneHabits, goToTimeline, toggleTask, deleteTask, onUpdateTask, t }) => {
    const today = getLocalDateString(new Date());
    const todayTasks = tasks
        .filter(t => t.date === today)
        .sort((a, b) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
    const completedCount = todayTasks.filter(t => t.completed).length;
    const progressValue = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-10">
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col shadow-sm h-full">
              <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">{t('今日任务', "Today's Tasks")}</h4>
                  <button onClick={() => goToTimeline(today)} className="bg-indigo-600 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors"><Plus size={20}/></button>
              </div>
              <div className="flex flex-col gap-3 flex-1 min-w-0 overflow-y-auto custom-scrollbar pr-2 pb-2 max-h-[50vh] min-h-[300px]">
                  {todayTasks.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 font-medium">{t('暂时没有任务，去添加一个吧。', 'No tasks today. Add one!')}</div>
                  ) : (
                     todayTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} onReorderDrop={undefined} categories={categories} t={t} />)
                  )}
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col min-w-0 h-full">
                <HabitTrackerComponent habits={habits} onUpdate={onUpdateHabit} onAdd={onAddHabit} onDelete={onDeleteHabit} onCloneHabits={onCloneHabits} t={t} />
            </div>
        </div>
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
                        tasks.filter(t => t.date === viewingDate).map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} onReorderDrop={undefined} categories={categories} t={t} />)}
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

const TimelineView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, onUpdateTask, onReorderTask, categories, t }) => {
    const [dropPrompt, setDropPrompt] = useState(null);
    const [dropTime, setDropTime] = useState('09:00');
    const hours = Array.from({ length: 19 }, (_, i) => i + 6);
    const daysToShow = [currentDate, new Date(currentDate.getTime() + 86400000)];
    const navDays = Array.from({length: 7}, (_, i) => { const d = new Date(currentDate); d.setDate(d.getDate() - 3 + i); return d; });
    const handleDrop = (e, dateStr, hourValue) => { e.preventDefault(); const taskId = e.dataTransfer.getData('taskId'); if(taskId) onUpdateTask(taskId, { date: dateStr, time: hourValue }); };
    
    return (
      <div className="max-w-6xl mx-auto animate-in fade-in pb-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 relative">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={24}/></button>
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
                  {navDays.map((d, i) => {
                      const isSelected = d.toDateString() === currentDate.toDateString();
                      return (
                          <button 
                              key={i} 
                              onClick={() => setCurrentDate(d)} 
                              onDragOver={e => e.preventDefault()}
                              onDrop={e => {
                                  e.preventDefault();
                                  const taskId = e.dataTransfer.getData('taskId');
                                  if (taskId) {
                                      setDropPrompt({ taskId, date: getLocalDateString(d) });
                                      setDropTime('09:00');
                                  }
                              }}
                              className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                          >
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
                                  <div key={dayIndex} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, dateStr, hourValue)} className="min-w-0 flex-1 border-l-2 border-slate-200 dark:border-slate-800 pl-4 pb-6 relative transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-r-xl">
                                      <div className="absolute top-3 -left-[7px] w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 border-2 border-white dark:border-slate-900 transition-all" />
                                      <div className="space-y-3 w-full min-w-0">
                                          {hourTasks.map(tData => <TaskCard key={tData.id} task={tData} onToggle={toggleTask} onDelete={deleteTask} onUpdateTask={onUpdateTask} onReorderDrop={onReorderTask} categories={categories} t={t} />)}
                                          
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
        
        {dropPrompt && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setDropPrompt(null)}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('移动任务', 'Move Task')}</h3>
                    <p className="text-sm text-slate-500 mb-6">{t('将任务移动到:', 'Moving task to:')} <span className="font-bold text-indigo-600 dark:text-indigo-400">{dropPrompt.date}</span></p>
                    <div className="space-y-1.5 mb-6">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('选择时间', 'Select Time')}</label>
                        <input type="time" value={dropTime} onChange={e => setDropTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-base outline-none focus:border-indigo-500 dark:text-white shadow-sm" autoFocus />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDropPrompt(null)} className="flex-1 py-3 rounded-lg font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition-colors">{t('取消', 'Cancel')}</button>
                        <button onClick={() => { onUpdateTask(dropPrompt.taskId, { date: dropPrompt.date, time: dropTime }); setDropPrompt(null); }} className="flex-1 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all">{t('确认', 'Confirm')}</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

const ReviewView = ({ reviews, onUpdateReview, t }) => {
    const [tab, setTab] = useState('daily');
    const [date, setDate] = useState(getLocalDateString(new Date()));
    
    // Cycle States
    const [activeCycle, setActiveCycle] = useState(() => {
        const d = new Date().getDate();
        return d <= 10 ? 1 : d <= 20 ? 2 : 3;
    });

    useEffect(() => {
        if (date) {
           const d = parseInt(date.split('-')[2], 10);
           setActiveCycle(d <= 10 ? 1 : d <= 20 ? 2 : 3);
        }
    }, [date]);

    const cycleYear = parseInt(date.split('-')[0], 10);
    const cycleMonth = parseInt(date.split('-')[1], 10);
    const daysInMonth = new Date(cycleYear, cycleMonth, 0).getDate();
    const cycleRanges = { 1: [1, 10], 2: [11, 20], 3: [21, daysInMonth] };
    const cycleMinDate = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-${String(cycleRanges[activeCycle]?.[0] || 1).padStart(2, '0')}`;
    const cycleMaxDate = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-${String(cycleRanges[activeCycle]?.[1] || 10).padStart(2, '0')}`;
    
    const cycleKey = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-C${activeCycle}`;
    const cycleTasks = reviews.cycleTasks?.[cycleKey] || [];
    
    const [newCTaskName, setNewCTaskName] = useState('');
    const [newCTaskDetails, setNewCTaskDetails] = useState('');
    const [newCTaskStart, setNewCTaskStart] = useState('');
    const [newCTaskEnd, setNewCTaskEnd] = useState('');

    useEffect(() => {
        setNewCTaskStart(cycleMinDate);
        setNewCTaskEnd(cycleMinDate);
    }, [cycleMinDate]);

    const handleAddCycleTask = (e) => {
        e.preventDefault();
        if (!newCTaskName.trim()) return;
        const newTask = {
            id: generateId(),
            name: newCTaskName,
            details: newCTaskDetails,
            startDate: newCTaskStart,
            endDate: newCTaskEnd,
            completed: false
        };
        const existing = reviews.cycleTasks?.[cycleKey] || [];
        onUpdateReview({ ...reviews, cycleTasks: { ...(reviews.cycleTasks || {}), [cycleKey]: [...existing, newTask] } });
        setNewCTaskName('');
        setNewCTaskDetails('');
        setNewCTaskStart(cycleMinDate);
        setNewCTaskEnd(cycleMinDate);
    };

    const toggleCycleTask = (taskId) => {
        const updated = cycleTasks.map(t => t.id === taskId ? {...t, completed: !t.completed} : t);
        onUpdateReview({ ...reviews, cycleTasks: { ...(reviews.cycleTasks || {}), [cycleKey]: updated } });
    };

    const deleteCycleTask = (taskId) => {
        const updated = cycleTasks.filter(t => t.id !== taskId);
        onUpdateReview({ ...reviews, cycleTasks: { ...(reviews.cycleTasks || {}), [cycleKey]: updated } });
    };

    const renderTaskDays = (startDate, endDate) => {
        if (!startDate || !endDate) return null;
        const daysArr = getDaysArray(startDate, endDate);
        const todayStr = getLocalDateString(new Date());
        return (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
                {daysArr.map(dStr => {
                    const dayNum = parseInt(dStr.split('-')[2], 10);
                    const isPassed = dStr < todayStr;
                    return (
                        <div 
                            key={dStr} 
                            title={dStr}
                            className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-md border transition-all ${
                                isPassed 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 line-through dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-500' 
                                : 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-400'
                            }`}
                        >
                            {dayNum}
                        </div>
                    )
                })}
            </div>
        );
    };

    const daily = { keep: ['', '', ''], improve: ['', '', ''], start: ['', '', ''], stop: ['', '', ''], ...(reviews?.daily?.[date] || {}) };
    const yearly = { finance: ['', '', ''], health: ['', '', ''], family: ['', '', ''], business: ['', '', ''], investment: ['', '', ''], social: ['', '', ''], education: ['', '', ''], breakthrough: ['', '', ''], ...(reviews?.yearly || {}) };
    const updateDaily = (field, idx, val) => { const newList = Array.isArray(daily[field]) ? [...daily[field]] : ['', '', '']; newList[idx] = val; onUpdateReview({ ...reviews, daily: { ...(reviews.daily || {}), [date]: { ...daily, [field]: newList } } }); };
    const updateYearly = (cat, idx, val) => { const newList = Array.isArray(yearly[cat]) ? [...yearly[cat]] : ['', '', '']; newList[idx] = val; onUpdateReview({ ...reviews, yearly: { ...(reviews.yearly || {}), [cat]: newList } }); };
    const dailyCategories = [{f:'keep', l: t('Keep (保持)', 'Keep'), c:'emerald', i: CheckCircle2}, {f:'improve', l: t('Improve (改进)', 'Improve'), c:'amber', i: TrendingUp}, {f:'start', l: t('Start (开始)', 'Start'), c:'indigo', i: PlayCircle}, {f:'stop', l: t('Stop (停止)', 'Stop'), c:'rose', i: StopCircle}];
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

          <div className="w-full">
            {tab === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dailyCategories.map(x => {
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
                </div>
            )}

            {tab === 'cycle' && (
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Repeat size={20} className="text-indigo-500"/>
                                {t('周期任务规划', 'Cycle Planning')}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {t('将每月分为三个周期，精细化执行长线任务。', 'Break down monthly goals into 3 execution cycles.')}
                            </p>
                        </div>
                        <select 
                            value={activeCycle} 
                            onChange={e => setActiveCycle(Number(e.target.value))}
                            className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-lg px-4 py-2.5 font-bold outline-none text-indigo-700 dark:text-indigo-400 focus:border-indigo-500 transition-colors shadow-sm"
                        >
                            <option value={1}>Cycle 1 (1 - 10{t('号','th')})</option>
                            <option value={2}>Cycle 2 (11 - 20{t('号','th')})</option>
                            <option value={3}>Cycle 3 (21 - {daysInMonth}{t('号','th')})</option>
                        </select>
                    </div>

                    <form onSubmit={handleAddCycleTask} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-3 space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('任务名称', 'Task Name')}</label>
                                <input value={newCTaskName} onChange={e=>setNewCTaskName(e.target.value)} required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 dark:text-white shadow-sm" placeholder={t('例: 开发核心模块', 'Task name...')} />
                            </div>
                            <div className="md:col-span-4 space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('执行细节 / 备注', 'Details')}</label>
                                <input value={newCTaskDetails} onChange={e=>setNewCTaskDetails(e.target.value)} required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 dark:text-white shadow-sm" placeholder={t('例: 完成数据库设计与API接口', 'Details...')} />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('开始日期', 'Start Date')}</label>
                                <input type="date" min={cycleMinDate} max={cycleMaxDate} value={newCTaskStart} onChange={e=>setNewCTaskStart(e.target.value)} required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 dark:text-white shadow-sm" />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t('结束日期', 'End Date')}</label>
                                <input type="date" min={newCTaskStart || cycleMinDate} max={cycleMaxDate} value={newCTaskEnd} onChange={e=>setNewCTaskEnd(e.target.value)} required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 dark:text-white shadow-sm" />
                            </div>
                            <div className="md:col-span-1 flex items-end">
                                <button type="submit" className="w-full h-[42px] bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md"><Plus size={20} strokeWidth={3} /></button>
                            </div>
                        </div>
                    </form>

                    <div className="space-y-4 flex-1">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">{t('本周期任务列表', 'Cycle Task List')}</h4>
                        {cycleTasks.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                <Target className="mx-auto text-slate-400 mb-3" size={32} />
                                <p className="text-slate-500 font-medium text-sm">{t('此周期暂无任务，请在上方的表单中添加', 'No tasks for this cycle yet.')}</p>
                            </div>
                        ) : (
                            cycleTasks.map(task => (
                                <div key={task.id} className={`bg-white dark:bg-slate-800 border rounded-xl p-5 flex gap-4 items-start shadow-sm transition-all hover:shadow-md ${task.completed ? 'border-slate-200 dark:border-slate-700 opacity-60' : 'border-indigo-100 dark:border-indigo-500/30'}`}>
                                    <button onClick={() => toggleCycleTask(task.id)} className={`mt-0.5 shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-400'}`}>
                                        {task.completed && <Check size={14} strokeWidth={3} />}
                                    </button>
                                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
                                        <div className="min-w-0">
                                            <h4 className={`text-base font-bold truncate ${task.completed ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{task.name}</h4>
                                            {renderTaskDays(task.startDate, task.endDate)}
                                        </div>
                                        <div className="min-w-0 flex items-center">
                                            <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                                <p className={`text-sm ${task.completed ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'} whitespace-pre-wrap break-words`}>{task.details}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteCycleTask(task.id)} className="p-2 mt-0.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors shrink-0"><Trash2 size={18}/></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {tab === 'yearly' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {yearlyCategories.map(cat => {
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
                                        <input value={String(yearly[cat.k]?.[i] || '')} onChange={e => updateYearly(cat.k, i, e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 dark:text-white transition-colors" placeholder={t("RM 核心目标...", "RM Set goal...")} />
                                    </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
        </div>
      );
};

export default function App() {
  const [view, setView] = useState('focus');
  const [user, setUser] = useState(null);
  const [viewedUserId, setViewedUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalStaffRegistry, setGlobalStaffRegistry] = useState([]);
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
  const [reviews, setReviews] = useState({ daily: {}, cycleTasks: {}, yearly: {} });

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); } 
    else { document.documentElement.classList.remove('dark'); }
  }, [isDarkMode]);

  // Handle Authentication and Data Access Control
  useEffect(() => {
    let unsubRegistry = () => {};
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
        if (u) {
            const isAdm = ADMIN_EMAILS.includes(u.email?.toLowerCase());
            setIsAdmin(isAdm);
            
            if (isAdm) {
                const savedViewedId = localStorage.getItem('planner_viewed_userId');
                setViewedUserId(savedViewedId || u.uid);
                
                const registryRef = doc(db, 'artifacts', appId, 'public', 'staff_registry');
                unsubRegistry = onSnapshot(registryRef, (d) => {
                    if (d.exists()) {
                        setGlobalStaffRegistry(d.data().list || []);
                    }
                });
                setUser(u);
                setAuthLoading(false);
            } else {
                const registryRef = doc(db, 'artifacts', appId, 'public', 'staff_registry');
                unsubRegistry = onSnapshot(registryRef, (d) => {
                    const currentList = d.exists() ? d.data().list || [] : [];
                    if (!currentList.find(x => x.email === u.email)) {
                        signOut(auth);
                        setUser(null);
                        setAuthError('unauthorized');
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
  }, []); 

  // Synchronize Firestore Data based on viewedUserId
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

  const handleToggleTask = (id) => {
      const n = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
      setTasks(n); saveData('tasks', { list: n });
  };

  const handleDeleteTask = (id) => {
      const n = tasks.filter(t => t.id !== id);
      setTasks(n); saveData('tasks', { list: n });
  };

  const handleUpdateTask = (id, up) => {
      let n = [...tasks];
      if (up.cancelRecurring) {
          const taskToCancel = n.find(t => t.id === id);
          if (taskToCancel) {
              n = n.filter(t => {
                  const isFuture = t.date > taskToCancel.date;
                  const isSameGroup = taskToCancel.groupId ? t.groupId === taskToCancel.groupId : (t.title === taskToCancel.title && t.recurring === 'daily');
                  return !(isFuture && isSameGroup); 
              });
          }
          delete up.cancelRecurring;
      } else if (up.makeRecurring) {
          const taskToMake = n.find(t => t.id === id);
          if (taskToMake) {
              const groupId = generateId();
              up.groupId = groupId;
              const newTasks = [];
              for(let i=1; i<=30; i++) {
                  const d = new Date(taskToMake.date); d.setDate(d.getDate() + i);
                  newTasks.push({ ...taskToMake, ...up, id: generateId(), date: getLocalDateString(d), completed: false });
              }
              n = [...n, ...newTasks];
          }
          delete up.makeRecurring;
      }
      n = n.map(t => t.id === id ? { ...t, ...up } : t);
      setTasks(n); 
      saveData('tasks', { list: n });
  };

  const handleReorderTask = (draggedId, targetId, position, targetDate, targetTime) => {
      let n = [...tasks];
      const draggedIdx = n.findIndex(t => t.id === draggedId);
      if (draggedIdx === -1) return;

      const draggedTask = { ...n[draggedIdx], date: targetDate, time: targetTime };
      n.splice(draggedIdx, 1);

      const targetIdx = n.findIndex(t => t.id === targetId);
      if (targetIdx !== -1) {
          n.splice(position === 'top' ? targetIdx : targetIdx + 1, 0, draggedTask);
      } else {
          n.push(draggedTask);
      }

      setTasks(n);
      saveData('tasks', { list: n });
  };

  const myStaffRegistry = isAdmin && user ? globalStaffRegistry.filter(s => s.adminEmail === user.email || !s.adminEmail) : [];

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
          <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold text-2xl"><div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md"><Zap size={20}/></div>Planner.AI</div>
          <div className="flex items-center gap-4">
            {isAdmin && (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg shadow-sm">
                        <Eye size={16} className="text-indigo-600 ml-1" />
                        <select 
                            value={viewedUserId} 
                            onChange={(e) => {
                                const newId = e.target.value;
                                setViewedUserId(newId);
                                localStorage.setItem('planner_viewed_userId', newId);
                            }} 
                            className="bg-transparent text-sm font-semibold outline-none pr-2 cursor-pointer dark:text-slate-200"
                        >
                            <option value={user.uid}>{t('我的数据 (Admin)', 'My Data')}</option>
                            {myStaffRegistry.map((s, i) => {
                                if (!s || typeof s !== 'object' || !s.uid) return null;
                                return <option key={s.uid || i} value={s.uid}>{s.email}</option>
                            })}
                        </select>
                    </div>
                    <button onClick={() => setIsStaffModalOpen(true)} className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors flex items-center gap-2" title={t('添加员工', 'Add Staff')}>
                        <UserPlus size={18} />
                    </button>
                </div>
            )}
            <div className="hidden md:flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4">
                <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2 text-slate-500 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">{lang === 'zh' ? 'EN' : '中'}</button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">{isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
            </div>
            <button 
                onClick={() => {
                    localStorage.removeItem('planner_viewed_userId');
                    signOut(auth);
                }} 
                className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 px-4 py-2 rounded-lg border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors font-semibold text-sm flex items-center gap-2"
            >
                <LogOut size={16}/> <span className="hidden md:inline">{t('退出', 'Logout')}</span>
            </button>
          </div>
      </div>
      <div className="px-4 pb-2 shrink-0 w-full"><div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 flex justify-center mx-auto max-w-5xl transition-colors"><nav className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full justify-start md:justify-center">
        {menuItems.map(m => {
            const Icon = m.icon;
            return (
                <button key={m.id} onClick={() => setView(m.id)} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${view === m.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400'}`}><Icon size={16}/> {m.label}</button>
            )
        })}
      </nav></div></div>
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 pb-24">
        <div className="max-w-7xl mx-auto">
            {view === 'finance' && isFinanceLocked ? (
                <div className="flex items-center justify-center h-full animate-in fade-in pb-20"><div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center gap-4"><div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500 shadow-inner"><EyeOff size={40} /></div><h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('隐私锁定', 'Privacy Locked')}</h2><p className="text-slate-500 text-sm max-w-xs">{t('管理员无法查看员工的财务隐私数据。', 'Admins cannot view staff financial data.')}</p></div></div>
            ) : (
                <>
                    {view === 'focus' && <DashboardView t={t} tasks={tasks} categories={categories} habits={habits} onUpdateHabit={(id, up) => { const n = habits.map(h => h.id === id ? {...h, ...up} : h); setHabits(n); saveData('habits', { list: n }); }} onAddHabit={(h) => { const n = [...habits, { id: generateId(), ...h }]; setHabits(n); saveData('habits', { list: n }); }} onDeleteHabit={(id) => { const n = habits.filter(h => h.id !== id); setHabits(n); saveData('habits', { list: n }); }} onCloneHabits={(newHabits) => { const n = [...habits, ...newHabits.map(h => ({ id: generateId(), ...h }))]; setHabits(n); saveData('habits', { list: n }); }} goToTimeline={(d) => { setCurrentDate(new Date(d)); setView('timeline'); }} toggleTask={handleToggleTask} deleteTask={handleDeleteTask} onUpdateTask={handleUpdateTask} />}
                    {view === 'calendar' && <CalendarView tasks={tasks} t={t} goToTimeline={(d) => { setCurrentDate(new Date(d)); setView('timeline'); }} categories={categories} toggleTask={handleToggleTask} deleteTask={handleDeleteTask} onUpdateTask={handleUpdateTask} />}
                    {view === 'timeline' && <TimelineView t={t} currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} categories={categories} openAddModal={(d, timeStr) => { setTargetDate(d); setPrefilledTime(timeStr); setIsAddModalOpen(true); }} toggleTask={handleToggleTask} deleteTask={handleDeleteTask} onUpdateTask={handleUpdateTask} onReorderTask={handleReorderTask} />}
                    {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={(r) => { setReviews(r); saveData('reviews', r); }} t={t} />}
                    {view === 'finance' && <FinanceVault t={t} viewedUserId={viewedUserId} user={user} isAdmin={isAdmin} />}
                </>
            )}
        </div>
      </main>

      <AddTaskModal t={t} isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={(taskData) => {
          let n = [...tasks];
          if (taskData.recurring === 'daily') {
              const newTasks = [];
              const groupId = generateId();
              for(let i=0; i<30; i++) {
                  const d = new Date(taskData.date); d.setDate(d.getDate() + i);
                  newTasks.push({ id: generateId(), groupId, completed: false, ...taskData, date: getLocalDateString(d) });
              }
              n = [...n, ...newTasks];
          } else { n.push({ id: generateId(), completed: false, ...taskData }); }
          setTasks(n); saveData('tasks', { list: n });
      }} defaultDate={targetDate} categories={categories} prefilledTime={prefilledTime} onAddCategory={(name) => { const n = [...categories, { name, color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)] }]; setCategories(n); saveData('categories', { list: n }); }} />

      <StaffManagerModal 
          t={t} 
          isOpen={isStaffModalOpen} 
          onClose={() => setIsStaffModalOpen(false)} 
          globalStaffRegistry={globalStaffRegistry} 
          myStaffRegistry={myStaffRegistry}
          currentUser={user}
      />

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }.no-scrollbar::-webkit-scrollbar { display: none; }.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}