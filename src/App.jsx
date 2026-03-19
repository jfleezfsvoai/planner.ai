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
const appId = 'default-planner-app';

// --- Constants & Utilities ---
const CATEGORY_COLORS = [
    { id: 'blue', value: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800', label: 'Blue' },
    { id: 'emerald', value: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800', label: 'Green' },
    { id: 'orange', value: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800', label: 'Orange' },
    { id: 'violet', value: 'bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:border-violet-800', label: 'Purple' },
    { id: 'rose', value: 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800', label: 'Red' },
    { id: 'amber', value: 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800', label: 'Yellow' },
    { id: 'cyan', value: 'bg-cyan-100 text-cyan-600 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-800', label: 'Cyan' },
    { id: 'slate', value: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', label: 'Gray' },
];

const PRIORITIES = {
    'urgent_important': { label: '紧急重要', color: 'text-red-700 bg-red-50 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', highlight: 'border-2 border-red-500 bg-red-50/80 dark:bg-red-900/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' },
    'important_not_urgent': { label: '重要不紧急', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', highlight: '' },
    'urgent_not_important': { label: '不重要紧急', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', highlight: '' },
    'not_urgent_not_important': { label: '不重要不紧急', color: 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', highlight: '' },
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

const sortTasksByTime = (tasks) => {
    return [...tasks].sort((a, b) => {
        if (!a.time) return 1; 
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });
};

const getWeekDays = (baseDate) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day; 
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
            <div className="flex justify-between items-center text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <span>{item.name}</span>
              <span className={isExpense ? 'text-rose-500' : 'text-emerald-500'}>{isExpense ? '-' : '+'} RM {Math.abs(item.value).toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner">
              <div className={`h-full transition-all duration-1000 ${isExpense ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Flywheel Component ---
const FlywheelView = ({ data, setData }) => {
    const [cards, setCards] = useState(data.cards || []);
    const [connections, setConnections] = useState(data.connections || []);
    
    const cardsRef = useRef(data.cards || []);
    const connectionsRef = useRef(data.connections || []);

    const [dragState, setDragState] = useState(null); 
    const [connectState, setConnectState] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [editingCardId, setEditingCardId] = useState(null);
    
    const containerRef = useRef(null);

    useEffect(() => {
        if (data.cards) { setCards(data.cards); cardsRef.current = data.cards; }
        if (data.connections) { setConnections(data.connections); connectionsRef.current = data.connections; }
    }, [data]);

    const saveToParent = (newCards, newConnections) => {
        const c = newCards !== undefined ? newCards : cardsRef.current;
        const conn = newConnections !== undefined ? newConnections : connectionsRef.current;
        setData({ cards: c, connections: conn });
    };

    const addCard = (shape) => {
        const newCard = { id: generateId(), title: 'New Idea', shape: shape || 'rounded', x: 50 + Math.random() * 100, y: 50 + Math.random() * 100, w: 160, h: 90, locked: false };
        const newCards = [...cards, newCard];
        setCards(newCards); cardsRef.current = newCards;
        saveToParent(newCards, undefined);
    };

    const deleteCard = (id) => {
        const newCards = cards.filter(c => c.id !== id);
        const newConns = connections.filter(c => c.source !== id && c.target !== id);
        setCards(newCards); setConnections(newConns);
        cardsRef.current = newCards; connectionsRef.current = newConns;
        if (selectedCardId === id) setSelectedCardId(null);
        saveToParent(newCards, newConns);
    };

    const toggleLock = (id) => {
        const newCards = cards.map(c => c.id === id ? { ...c, locked: !c.locked } : c);
        setCards(newCards); cardsRef.current = newCards;
        saveToParent(newCards, undefined);
    };

    const updateCardTitle = (id, newTitle) => {
        const newCards = cards.map(c => c.id === id ? { ...c, title: newTitle } : c);
        setCards(newCards); cardsRef.current = newCards;
    };

    const handleCardMouseDown = (e, id) => {
        if (connectState || editingCardId === id) return;
        e.stopPropagation();
        const card = cards.find(c => c.id === id);
        if (!card || card.locked) {
            setSelectedCardId(id); 
            return; 
        }
        const rect = containerRef.current.getBoundingClientRect();
        setDragState({ id, offsetX: (e.clientX - rect.left) - card.x, offsetY: (e.clientY - rect.top) - card.y });
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
    };

    const handleCardClick = (e, id) => {
        e.stopPropagation();
        if (editingCardId !== id) {
            setSelectedCardId(id);
        }
    };

    const handleCardDoubleClick = (e, id) => {
        e.stopPropagation();
        setEditingCardId(id);
        setSelectedCardId(null); 
    };

    const handleWindowMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setDragState(prevDragState => {
            if (!prevDragState) return null;
            const newCards = cardsRef.current.map(c => 
                c.id === prevDragState.id ? { ...c, x: x - prevDragState.offsetX, y: y - prevDragState.offsetY } : c
            );
            setCards(newCards); cardsRef.current = newCards;
            return prevDragState;
        });
    };

    const handleWindowMouseUp = () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
        setDragState(null);
        saveToParent();
    };

    const handleContainerMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handlePointClick = (e, cardId, handle) => {
        e.stopPropagation();
        if (!connectState) {
            setConnectState({ sourceId: cardId, sourceHandle: handle });
            setSelectedCardId(null);
        } else {
            if (connectState.sourceId !== cardId) {
                const newConn = { id: generateId(), source: connectState.sourceId, sourceHandle: connectState.sourceHandle, target: cardId, targetHandle: handle };
                const newConns = [...connections, newConn];
                setConnections(newConns); connectionsRef.current = newConns;
                saveToParent(undefined, newConns);
            }
            setConnectState(null);
        }
    };

    const handleContainerClick = () => {
        if (connectState) setConnectState(null);
        setSelectedCardId(null);
        if (editingCardId) { setEditingCardId(null); saveToParent(); }
    };

    const deleteConnection = (id) => {
        const newConns = connections.filter(c => c.id !== id);
        setConnections(newConns); connectionsRef.current = newConns;
        saveToParent(undefined, newConns);
    };

    const getHandleCoords = (cardId, handle) => {
        const card = cards.find(c => c.id === cardId);
        if (!card) return { x: 0, y: 0 };
        const { x, y, w, h } = card;
        switch (handle) {
            case 'top': return { x: x + w / 2, y: y };
            case 'right': return { x: x + w, y: y + h / 2 };
            case 'bottom': return { x: x + w / 2, y: y + h };
            case 'left': return { x: x, y: y + h / 2 };
            default: return { x: x + w / 2, y: y + h / 2 };
        }
    };

    const renderConnection = (conn, isTemp = false) => {
        let start, end;
        if (isTemp) {
            start = getHandleCoords(conn.sourceId, conn.sourceHandle);
            end = { x: mousePos.x, y: mousePos.y };
        } else {
            start = getHandleCoords(conn.source, conn.sourceHandle);
            end = getHandleCoords(conn.target, conn.targetHandle);
        }

        const p1 = start; const p2 = end;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const cp1 = { x: p1.x, y: p1.y }; const cp2 = { x: p2.x, y: p2.y };
        
        const handle = isTemp ? conn.sourceHandle : conn.sourceHandle;
        const targetHandle = isTemp ? null : conn.targetHandle;

        if (handle === 'top') cp1.y -= dist * 0.5; if (handle === 'bottom') cp1.y += dist * 0.5;
        if (handle === 'left') cp1.x -= dist * 0.5; if (handle === 'right') cp1.x += dist * 0.5;
        if (targetHandle) {
             if (targetHandle === 'top') cp2.y -= dist * 0.5; if (targetHandle === 'bottom') cp2.y += dist * 0.5;
             if (targetHandle === 'left') cp2.x -= dist * 0.5; if (targetHandle === 'right') cp2.x += dist * 0.5;
        }

        const pathData = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
        
        return (
            <g key={conn.id || 'temp'}>
                <path d={pathData} className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                {!isTemp && (
                    <circle cx={(p1.x + p2.x)/2} cy={(p1.y + p2.y)/2} r="8" fill="white" stroke="#cbd5e1" strokeWidth="1" className="cursor-pointer hover:stroke-red-500" onClick={(e) => {e.stopPropagation(); deleteConnection(conn.id);}}>
                        <title>Delete Connection</title>
                    </circle>
                )}
            </g>
        );
    };

    return (
        <div 
            className="w-full h-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 select-none animate-fade-in"
            onMouseMove={handleContainerMouseMove}
            onClick={handleContainerClick}
            ref={containerRef}
        >
            <div className="absolute top-4 left-4 z-20 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 flex gap-2 items-center">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">Shapes</span>
                <button onClick={(e) => { e.stopPropagation(); addCard('rounded'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300" title="Rounded Square"><Square size={20} className="rounded-md"/></button>
                <button onClick={(e) => { e.stopPropagation(); addCard('rectangle'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300" title="Rectangle"><Box size={20}/></button>
                <button onClick={(e) => { e.stopPropagation(); addCard('circle'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300" title="Circle"><CircleIcon size={20}/></button>
                <button onClick={(e) => { e.stopPropagation(); addCard('triangle'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300" title="Triangle"><Triangle size={20}/></button>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <div className="px-2 text-xs text-slate-400 dark:text-slate-500">
                    {connectState ? <span className="text-violet-600 dark:text-violet-400 font-bold animate-pulse">Select target point...</span> : "Double-click to edit • Click to open options"}
                </div>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-slate-400 dark:text-slate-600" /></marker></defs>
                {connections.map(c => renderConnection(c))}
                {connectState && renderConnection(connectState, true)}
            </svg>

            {cards.map(card => {
                let shapeClass = "rounded-2xl";
                if (card.shape === 'rectangle') shapeClass = "rounded-none";
                if (card.shape === 'circle') shapeClass = "rounded-full";
                
                const isCircleOrTriangle = card.shape === 'circle' || card.shape === 'triangle';
                const isEditing = editingCardId === card.id;
                const isSelected = selectedCardId === card.id;

                return (
                    <div
                        key={card.id}
                        style={{ left: card.x, top: card.y, width: card.w, height: isCircleOrTriangle ? card.w : card.h }}
                        className="absolute z-10 group"
                    >
                        <div 
                            className={`absolute inset-0 bg-white dark:bg-slate-800 shadow-md border flex flex-col items-center justify-center
                                ${card.locked ? 'border-slate-200 dark:border-slate-700' : 'border-slate-300 dark:border-slate-600 hover:ring-2 hover:ring-violet-200 dark:hover:ring-violet-900'}
                                ${isSelected ? 'ring-2 ring-violet-400 dark:ring-violet-500 border-transparent' : ''}
                                ${shapeClass}
                            `}
                            style={{ clipPath: card.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none' }}
                            onMouseDown={(e) => handleCardMouseDown(e, card.id)}
                            onClick={(e) => handleCardClick(e, card.id)}
                            onDoubleClick={(e) => handleCardDoubleClick(e, card.id)}
                        >
                             <div className={`w-full p-4 pointer-events-auto ${card.shape === 'triangle' ? 'pt-8' : ''}`}>
                                <textarea 
                                    ref={el => { if (el && isEditing) el.focus(); }}
                                    value={card.title} 
                                    onChange={(e) => updateCardTitle(card.id, e.target.value)}
                                    onBlur={() => { setEditingCardId(null); saveToParent(); }}
                                    readOnly={!isEditing}
                                    className={`w-full bg-transparent resize-none outline-none font-bold text-slate-700 dark:text-slate-200 text-sm text-center overflow-hidden 
                                        ${isEditing ? 'bg-slate-50 dark:bg-slate-900 p-1 rounded border border-violet-200 dark:border-violet-800' : 'pointer-events-none'}`}
                                    placeholder="Text..."
                                    rows={3}
                                    onMouseDown={(e) => { if(isEditing) e.stopPropagation(); }} 
                                />
                            </div>
                        </div>

                        {/* Interactive Elements Overlay (NOT clipped so menus show up properly above triangles) */}
                        <div className="absolute inset-0 pointer-events-none">
                            {isSelected && !isEditing && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800 text-white p-1.5 rounded-xl shadow-xl z-50 pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleLock(card.id); }} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center" title={card.locked ? "Unlock" : "Lock"}>
                                        {card.locked ? <Lock size={14} className="text-amber-400"/> : <Unlock size={14}/>}
                                    </button>
                                    <div className="w-[1px] h-4 bg-slate-600 mx-1"></div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="p-1.5 hover:bg-red-500 rounded-lg transition-colors text-slate-300 hover:text-white flex items-center justify-center" title="Delete">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            )}

                            {card.locked && !isSelected && <Lock size={10} className="absolute top-3 right-3 text-slate-300 dark:text-slate-600" />}

                            {['top', 'right', 'bottom', 'left'].map(pos => {
                                let style = {};
                                if (pos === 'top') style = { top: -6, left: '50%', transform: 'translateX(-50%)' };
                                if (pos === 'right') style = { right: -6, top: '50%', transform: 'translateY(-50%)' };
                                if (pos === 'bottom') style = { bottom: -6, left: '50%', transform: 'translateX(-50%)' };
                                if (pos === 'left') style = { left: -6, top: '50%', transform: 'translateY(-50%)' };

                                return (
                                    <div
                                        key={pos}
                                        className={`absolute w-3.5 h-3.5 bg-white dark:bg-slate-800 border-2 border-violet-400 dark:border-violet-500 rounded-full cursor-pointer hover:bg-violet-600 dark:hover:bg-violet-400 hover:scale-125 transition-all z-20 pointer-events-auto
                                            ${connectState ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                        `}
                                        style={style}
                                        onMouseDown={(e) => e.stopPropagation()} 
                                        onClick={(e) => handlePointClick(e, card.id, pos)}
                                    />
                                );
                            })}
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
  const categoryStyle = (catObj && typeof catObj === 'object') ? catObj.color : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  const priorityConfig = PRIORITIES[task.priority] || {};
  const highlightStyle = priorityConfig.highlight || '';

  const handleSave = () => {
    if (editTitle.trim()) {
        if (setCategories) {
            if (isCustomCategory) {
                 const existsIndex = categories.findIndex(c => c.name === editCategory);
                 if (existsIndex > -1) {
                     const newCats = [...categories];
                     newCats[existsIndex] = { name: editCategory, color: customCategoryColor };
                     setCategories(newCats);
                 } else if (editCategory.trim()) {
                     setCategories([...categories, { name: editCategory, color: customCategoryColor }]);
                 }
            }
        }
        onUpdate(task.id, { title: editTitle, category: editCategory, priority: editPriority }); 
    }
    setIsEditing(false); setIsCustomCategory(false);
  };
  const togglePriority = (key) => { setEditPriority(editPriority === key ? '' : key); };
  
  const handleDragStart = (e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; e.target.style.opacity = '0.4'; };
  const handleDragEnd = (e) => { e.target.style.opacity = '1'; };
  
  // Reordering drops within cards
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); // Prevent hour slot drop from triggering
      const dragId = e.dataTransfer.getData('text/plain'); 
      if (dragId && dragId !== task.id.toString() && moveTask) { 
          moveTask(dragId, task.id, dropPosition); 
      } 
  };

  if (isEditing) {
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-violet-200 dark:border-violet-800 shadow-md mb-2 animate-in fade-in zoom-in-95 duration-200">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent mb-2 border-b border-slate-100 dark:border-slate-800 pb-1 outline-none focus:border-violet-300" placeholder="任务名称" autoFocus />
            <div className="mb-3"><div className="flex gap-2 items-center mb-2">{isCustomCategory ? (<div className="flex-1 flex flex-col gap-2"><div className="relative"><input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="类别名称" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 pr-6 text-sm outline-none focus:border-violet-500 dark:text-white" /><button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={14}/></button></div><div className="flex gap-1.5 flex-wrap">{CATEGORY_COLORS.map((col) => (<button key={col.id} type="button" onClick={() => setCustomCategoryColor(col.value)} className={`w-5 h-5 rounded-full border ${col.value.split(' ')[0]} ${customCategoryColor === col.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`} />))}</div></div>) : (<><select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 outline-none dark:text-white">{(categories || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select><button type="button" onClick={() => { setIsCustomCategory(true); setEditCategory(safeCategory); }} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900 text-violet-600 dark:text-violet-400 rounded" title="Edit/New"><Edit3 size={14}/></button></>)}</div></div>
            <div className="mb-4"><label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5">优先级</label><div className="grid grid-cols-2 gap-2">{Object.entries(PRIORITIES).map(([key, config]) => (<button key={key} type="button" onClick={() => togglePriority(key)} className={`text-xs p-2 rounded-lg border transition-all truncate ${editPriority === key ? config.color + ' ring-1 ring-slate-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>{config.label}</button>))}</div></div>
            <div className="flex justify-end gap-2"><button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><X size={16}/></button><button onClick={handleSave} className="p-2 px-4 bg-violet-500 text-white rounded-lg hover:bg-violet-600 flex items-center gap-1 font-bold text-sm"><Save size={14}/> Save</button></div>
        </div>
      );
  }
  return (
    <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={handleDrop} className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-2xl border transition-all group relative mb-3 cursor-grab active:cursor-grabbing ${showWarning ? 'border-amber-300 shadow-amber-100' : 'border-slate-100 dark:border-slate-800 shadow-sm hover:border-violet-200 dark:hover:border-violet-800'} ${highlightStyle}`}>
        {dropPosition === 'top' && (<div className="absolute -top-1.5 left-0 right-0 h-1.5 bg-violet-500 rounded-full z-10 pointer-events-none animate-in fade-in duration-150"></div>)}
      <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-300 dark:text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing"><GripVertical size={14} /></div>
        <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${task.completed ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white' : 'border-slate-300 dark:border-slate-600 hover:border-violet-500 text-transparent'}`}><CheckSquare size={12} fill={task.completed ? "currentColor" : "none"} /></button>
        <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
          <div className="flex justify-between items-start">
             <div className="flex flex-wrap items-center gap-2 mb-1"><p className={`text-sm font-bold truncate transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</p></div>
             {showWarning && <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 animate-pulse" title="时间冲突" />}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider border ${categoryStyle}`}>{safeCategory}</span>
            {task.priority && priorityConfig.label && <span className={`text-xs px-2 py-1 rounded-md font-bold border ${priorityConfig.color}`}>{priorityConfig.label}</span>}
            {format !== 'timeline' && showTime && task.time && <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md"><Clock size={10} /> {task.time}</span>}
          </div>
        </div>
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/80 dark:bg-slate-900/80 rounded-lg backdrop-blur-sm"><button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-slate-400 hover:text-violet-500 p-1.5" title="编辑"><Edit3 size={14} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-slate-400 hover:text-red-500 p-1.5" title="删除"><Trash2 size={14} /></button></div>
      </div>
      {dropPosition === 'bottom' && (<div className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-violet-500 rounded-full z-10 pointer-events-none animate-in fade-in duration-150"></div>)}
    </div>
  );
};

const HabitTracker = ({ habits, onUpdate, onAdd, onDelete }) => {
    const today = new Date(); const year = today.getFullYear(); const month = today.getMonth();
    const daysInMonth = []; const date = new Date(year, month, 1);
    while (date.getMonth() === month) { daysInMonth.push(new Date(date)); date.setDate(date.getDate() + 1); }
    const [newHabit, setNewHabit] = useState(''); const [newHabitTarget, setNewHabitTarget] = useState(daysInMonth.length);
    const toggleHabit = (habitId, dateStr) => { const habit = habits.find(h => h.id === habitId); if (!habit) return; const isCompleted = habit.completed?.includes(dateStr); let newCompleted = [...(habit.completed || [])]; if (isCompleted) { newCompleted = newCompleted.filter(d => d !== dateStr); } else { newCompleted.push(dateStr); } onUpdate(habitId, { completed: newCompleted }); };
    const handleUpdateField = (id, field, value) => { onUpdate(id, { [field]: value }); };
    const handleAdd = (e) => { e.preventDefault(); if(!newHabit.trim()) return; onAdd({ name: newHabit.trim(), target: newHabitTarget || daysInMonth.length, reward: '' }); setNewHabit(''); };
    const getCurrentMonthCompletedCount = (completedDates) => { const prefix = `${year}-${String(month + 1).padStart(2, '0')}`; return (completedDates || []).filter(d => d.startsWith(prefix)).length; };
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-lg"><CheckCircle2 className="text-emerald-500"/> Habit Tracker ({today.toLocaleString('default', { month: 'long' })})</h3></div>
            <div className="overflow-x-auto custom-scrollbar pb-4"><table className="w-full min-w-[800px] border-collapse"><thead><tr className="border-b border-slate-100 dark:border-slate-800"><th className="text-left text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-4 px-2 min-w-[150px] sticky left-0 bg-white dark:bg-slate-900 z-20">习惯养成</th><th className="text-center text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-4 px-2 min-w-[80px]">目标</th><th className="text-center text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-4 px-2 min-w-[60px]">完成</th><th className="text-center text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-4 px-2 min-w-[100px]">进度</th>{daysInMonth.map((d, i) => (<th key={i} className="text-center pb-4 px-1 min-w-[40px]"><div className={`flex flex-col items-center ${getLocalDateString(d) === getLocalDateString(today) ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-lg p-1' : 'text-slate-400 dark:text-slate-500'}`}><span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('default', {weekday: 'narrow'})}</span><span className="text-sm font-bold">{d.getDate()}</span></div></th>))}<th className="text-left text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-4 px-4 min-w-[150px]">完成奖励</th><th className="w-10 pb-4"></th></tr></thead><tbody className="text-sm">{habits.map(habit => { const completedCount = getCurrentMonthCompletedCount(habit.completed); const target = habit.target || daysInMonth.length; const progress = Math.min(100, Math.round((completedCount / target) * 100)); return ( <tr key={habit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"><td className="py-4 px-2 font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">{habit.name}</td><td className="py-4 px-2 text-center"><input type="number" value={habit.target || daysInMonth.length} onChange={(e) => handleUpdateField(habit.id, 'target', parseInt(e.target.value))} className="w-12 text-center bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-violet-500 outline-none text-slate-600 dark:text-slate-300 font-medium"/></td><td className="py-4 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</td><td className="py-4 px-2 text-center"><div className="flex items-center gap-2 justify-center"><div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div></div><span className="text-xs text-slate-400 font-bold">{progress}%</span></div></td>{daysInMonth.map((d, i) => { const dateStr = getLocalDateString(d); const isDone = habit.completed?.includes(dateStr); return (<td key={i} className="text-center py-4 px-1"><button onClick={() => toggleHabit(habit.id, dateStr)} className={`w-6 h-6 rounded-md flex items-center justify-center transition-all mx-auto ${isDone ? 'bg-emerald-500 text-white shadow-sm' : 'bg-transparent border-2 border-slate-200 dark:border-slate-700 text-transparent hover:border-emerald-300'}`}><CheckSquare size={14} fill={isDone ? "currentColor" : "none"}/></button></td>); })}<td className="py-4 px-4"><div className="flex items-center gap-2"><Gift size={16} className={habit.reward ? "text-rose-400" : "text-slate-300 dark:text-slate-600"}/><input type="text" value={habit.reward || ''} onChange={(e) => handleUpdateField(habit.id, 'reward', e.target.value)} placeholder="Set reward..." className="w-full bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 outline-none text-sm text-slate-600 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600"/></div></td><td className="text-right py-4 px-2"><button onClick={() => onDelete(habit.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button></td></tr> ); })}</tbody></table></div>
            <form onSubmit={handleAdd} className="mt-6 flex gap-4 border-t border-slate-50 dark:border-slate-800 pt-6"><input type="text" value={newHabit} onChange={e => setNewHabit(e.target.value)} placeholder="New habit name..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none text-base focus:border-emerald-500 dark:text-white transition-all"/><input type="number" value={newHabitTarget} onChange={e => setNewHabitTarget(parseInt(e.target.value))} placeholder="Target days" className="w-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none text-base focus:border-emerald-500 dark:text-white transition-all text-center" title="Target Days"/><button type="submit" className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-8 py-3 rounded-xl font-bold text-base transition-all shadow-lg flex items-center gap-2"><Plus size={18}/> Add Habit</button></form>
        </div>
    );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, defaultDate, defaultTime, categories, setCategories }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '工作');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryColor, setCustomCategoryColor] = useState(CATEGORY_COLORS[0].value);
  const [priority, setPriority] = useState(''); 
  const [time, setTime] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setTime(defaultTime || ''); setCategory(categories.length > 0 ? categories[0].name : '工作'); setPriority(''); setIsCustomCategory(false); setCustomCategoryColor(CATEGORY_COLORS[0].value);
      if(inputRef.current) setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen, defaultTime, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault(); if (!title.trim()) return;
    let finalCategory = category;
    if (isCustomCategory && category.trim()) {
        finalCategory = category.trim();
        const exists = categories.find(c => c.name === finalCategory);
        if (!exists) { setCategories([...categories, { name: finalCategory, color: customCategoryColor }]); }
    }
    onAdd({ title, category: finalCategory, time, date: defaultDate, priority });
    onClose();
  };
  const togglePriority = (key) => setPriority(priority === key ? '' : key);
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/50 dark:border-slate-800">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50"><h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-lg"><Zap size={20} className="text-violet-500" fill="currentColor"/> 新任务</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24}/></button></div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div><label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">内容</label><input ref={inputRef} type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-base focus:border-violet-500 dark:text-white outline-none" placeholder="需要做什么？"/></div>
          <div className="grid grid-cols-2 gap-6">
            <div><label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">类别</label><div className="flex gap-2">{isCustomCategory ? (<div className="flex-1 flex flex-col gap-3"><div className="relative"><input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="新类别名称" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-8 text-sm outline-none focus:border-violet-500 dark:text-white" autoFocus/><button type="button" onClick={() => setIsCustomCategory(false)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={16}/></button></div><div className="flex gap-2 flex-wrap">{CATEGORY_COLORS.map((col) => (<button key={col.id} type="button" onClick={() => setCustomCategoryColor(col.value)} className={`w-5 h-5 rounded-full border ${col.value.split(' ')[0]} ${customCategoryColor === col.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}/>))}</div></div>) : (<div className="flex gap-2 w-full items-start"><select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none focus:border-violet-500 dark:text-white appearance-none">{(categories||[]).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select><button type="button" onClick={() => { setIsCustomCategory(true); setCategory(''); }} className="p-4 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900 text-violet-600 dark:text-violet-400 rounded-xl"><Plus size={20}/></button></div>)}</div></div>
            <div><label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">时间</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none focus:border-violet-500 dark:text-white"/></div>
          </div>
          <div><label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">优先级 (可选)</label><div className="grid grid-cols-2 gap-3">{Object.entries(PRIORITIES).map(([key, config]) => (<button key={key} type="button" onClick={() => togglePriority(key)} className={`text-sm font-bold p-3 rounded-xl border transition-all text-center ${priority === key ? config.color + ' ring-2 ring-offset-2 ring-slate-200 dark:ring-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{config.label}</button>))}</div></div>
          <button type="submit" className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold py-4 text-lg rounded-xl transition-all shadow-xl">添加任务</button>
        </form>
      </div>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
    if (!isOpen) return null;
    const handleAuth = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { if (isLogin) { await signInWithEmailAndPassword(auth, email, password); } else { await createUserWithEmailAndPassword(auth, email, password); } onClose(); } catch (err) { setError(err.message.replace('Firebase: ', '')); } finally { setLoading(false); } };
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-10 border border-white/50 dark:border-slate-800 relative"><button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24}/></button><div className="text-center mb-8"><div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-violet-200 dark:shadow-none"><User size={32} /></div><h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{isLogin ? 'Welcome Back' : 'Create Account'}</h2><p className="text-slate-500 text-base mt-2">Sync your data across devices</p></div>{error && <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 text-sm p-4 rounded-xl mb-6 text-center font-bold">{error}</div>}<form onSubmit={handleAuth} className="space-y-5"><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-base outline-none focus:border-violet-500 dark:text-white" required /><input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-base outline-none focus:border-violet-500 dark:text-white" required /><button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-slate-700 text-white font-bold py-4 text-lg rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-all disabled:opacity-50 shadow-xl">{loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}</button></form><div className="mt-8 text-center text-sm text-slate-500 font-medium">{isLogin ? "No account? " : "Have account? "}<button onClick={() => setIsLogin(!isLogin)} className="text-violet-600 dark:text-violet-400 font-bold hover:underline">{isLogin ? 'Sign Up' : 'Log In'}</button></div></div></div>
    );
};

const DashboardView = ({ tasks, onAddTask, user, openAddModal, toggleTask, deleteTask, onUpdate, moveTask, categories, habits, onUpdateHabit, onAddHabit, onDeleteHabit, setCategories }) => {
    const todayStr = getLocalDateString(new Date());
    const todaysTasks = sortTasksByTime(tasks.filter(t => t.date === todayStr));
    const catStats = {};
    todaysTasks.forEach(t => { 
        const catName = typeof t.category === 'string' ? t.category : 'Uncategorized';
        if(!catStats[catName]) catStats[catName] = { total: 0, completed: 0 }; 
        catStats[catName].total++; 
        if(t.completed) catStats[catName].completed++; 
    });

    const containerHeight = "h-[32rem]";

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-24">
        <header><h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dashboard</h2><p className="text-slate-500 font-medium text-lg mt-1">Welcome back, <span className="text-violet-600 dark:text-violet-400">{user?.email?.split('@')[0] || 'Commander'}</span></p></header>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden ${containerHeight}`}>
                <div className="flex justify-between items-center p-8 pb-4 shrink-0"><h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 text-xl"><Target className="text-rose-500" size={24}/> Today's Focus</h3><button onClick={() => openAddModal(todayStr)} className="bg-slate-900 dark:bg-slate-700 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 shadow-md"><Plus size={20}/></button></div>
                <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar space-y-3">{todaysTasks.length === 0 ? <div className="text-center text-slate-400 py-12 text-lg">No tasks for today.</div> : todaysTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} moveTask={moveTask} categories={categories} setCategories={setCategories}/>))}</div>
            </div>
            <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 overflow-y-auto custom-scrollbar ${containerHeight}`}><h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-8 text-xl"><PieChart className="text-blue-500" size={24}/> Analysis</h3><div className="space-y-6">{Object.entries(catStats).map(([cat, stat]) => (<div key={cat}><div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-2"><span>{cat}</span><span>{stat.completed}/{stat.total}</span></div><div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden"><div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{width: `${(stat.completed/stat.total)*100}%`}}></div></div></div>))}</div></div>
        </div>
        <HabitTracker habits={habits} onUpdate={onUpdateHabit} onAdd={onAddHabit} onDelete={onDeleteHabit} />
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
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-24">
             <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl"><div className="relative z-10 flex justify-between items-end"><div><div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">年度储蓄目标 (储蓄+投资)</div><div className="text-5xl font-black">RM {savingsPlusInvestment.toLocaleString()} <span className="text-slate-500 text-3xl font-bold"> / {wealthConfig.yearlyTarget.toLocaleString()}</span></div></div><button onClick={() => { const n = prompt("New Target:", wealthConfig.yearlyTarget); if(n) setWealthConfig({...wealthConfig, yearlyTarget: parseFloat(n)}); }} className="bg-white/10 px-5 py-2.5 rounded-xl text-base font-bold transition-all hover:bg-white/20">Edit Target</button></div><div className="mt-8 w-full bg-white/10 rounded-full h-3"><div className="bg-emerald-400 h-3 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(52,211,153,0.5)]" style={{ width: `${Math.min(100, (savingsPlusInvestment / wealthConfig.yearlyTarget) * 100)}%` }}></div></div></div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm"><h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 text-xl"><DollarSign className="text-emerald-500" size={24}/> 收入分配器</h3><form onSubmit={handleDistribute} className="flex flex-col md:flex-row gap-4"><input type="number" placeholder="输入收入 (RM)" value={income} onChange={e=>setIncome(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-xl dark:text-white transition-all shadow-inner"/>{wealthConfig.showCommitment && (<div className="flex items-center gap-3 px-6 py-4 bg-rose-50 dark:bg-rose-900/30 rounded-2xl border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold min-w-[250px]"><span className="text-sm uppercase whitespace-nowrap">固定开销:</span> <input type="number" value={wealthConfig.commitment} onChange={e => setWealthConfig({...wealthConfig, commitment: parseFloat(e.target.value)||0})} className="bg-transparent border-b border-rose-200 dark:border-rose-700 outline-none w-full text-right font-black text-xl" /></div>)}<button type="submit" className="bg-slate-900 dark:bg-slate-700 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all text-lg shadow-xl">全部分配</button></form></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {wealthConfig.showCommitment ? (<div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-8 rounded-3xl flex flex-col justify-between h-48 relative group"><div className="flex justify-between items-start"><div className="font-black text-rose-700 dark:text-rose-400 text-lg">固定开销</div><Lock size={20} className="text-rose-400 dark:text-rose-600"/></div><div className="text-3xl font-black text-rose-800 dark:text-rose-300">RM {(balances.commitment||0).toLocaleString()}</div></div>) : (<button onClick={restoreCommitment} className="bg-rose-50/50 dark:bg-rose-900/10 border-2 border-dashed border-rose-200 dark:border-rose-800 p-8 rounded-3xl flex flex-col items-center justify-center h-48 text-rose-400 dark:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-all font-bold gap-3 text-lg"><RefreshCw size={28}/> 恢复固定开销</button>)}
                {wealthConfig.jars.map(jar => (<div key={jar.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl flex flex-col justify-between h-48 shadow-sm hover:shadow-md transition-all relative group"><div className="flex justify-between items-start"><div><div className="font-black text-slate-700 dark:text-slate-200 text-lg">{jar.label}</div><div className="text-xs bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-3 py-1 rounded-full inline-block mt-2 font-bold">{jar.percent}%</div></div><div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">{getIconForLabel(jar.label)}</div></div><div className="text-3xl font-black text-slate-800 dark:text-slate-100">RM {(balances[jar.id]||0).toLocaleString()}</div><button onClick={() => deleteJar(jar.id)} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-all"><X size={20}/></button></div>))}
                <button onClick={() => setIsAddJarOpen(true)} className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 font-bold gap-3 transition-all text-lg"><Plus size={32}/> 添加存钱罐</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm h-fit"><h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 text-xl">{editingTxId ? <Edit3 size={24} className="text-amber-500"/> : <DollarSign size={24} className="text-slate-400"/>}{editingTxId ? '编辑交易记录' : '记录收支'}</h3><form onSubmit={submitTransaction} className="space-y-5"><input type="number" placeholder="金额" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-violet-100 dark:text-white text-base" /><div className="flex gap-3">{!isCustomCat ? (<select value={expenseForm.category} onChange={e => e.target.value === 'NEW' ? setIsCustomCat(true) : setExpenseForm({...expenseForm, category: e.target.value})} className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white text-base"><option value="">选择类别</option>{usedTxCats.map(c => <option key={c} value={c}>{c}</option>)}<option value="NEW" className="font-bold text-violet-600 dark:text-violet-400">+ 新增类别</option></select>) : (<div className="flex-1 relative"><input type="text" placeholder="新类别名称" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white text-base" autoFocus/><button type="button" onClick={() => setIsCustomCat(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={18}/></button></div>)}</div><input type="text" placeholder="备注" value={expenseForm.remark} onChange={e=>setExpenseForm({...expenseForm, remark: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white text-base" /><input type="date" value={expenseForm.date} onChange={e=>setExpenseForm({...expenseForm, date: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white text-base font-mono" /><div className="flex gap-3 mt-2">{editingTxId && (<button type="button" onClick={() => {setEditingTxId(null); setExpenseForm({ amount: '', category: '', remark: '', date: getLocalDateString(new Date()) });}} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-base">取消</button>)}<button type="submit" className={`flex-[2] text-white font-bold py-4 rounded-xl transition-all shadow-lg text-base ${editingTxId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600'}`}>{editingTxId ? '保存修改' : '录入数据'}</button></div></form></div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm min-h-[500px]"><div className="flex justify-between items-center mb-8"><div><h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">近期流水</h3><div className="text-sm font-bold text-slate-400 mt-1">余额变动: <span className={netTransactionTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{netTransactionTotal >= 0 ? '+' : ''} RM {netTransactionTotal.toLocaleString()}</span></div></div><button onClick={() => setShowGraph(!showGraph)} className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${showGraph ? 'bg-violet-600 text-white shadow-lg shadow-violet-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{showGraph ? <Layout size={18}/> : <BarChart2 size={18}/>} {showGraph ? '返回列表' : '分类统计'}</button></div>{showGraph ? (<div className="py-6"><h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">各类别净额对比 (横向)</h4><HorizontalBarChart data={barData} /></div>) : (<div className="space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">{Object.keys(groupedTransactions).length === 0 ? <div className="text-center text-slate-400 py-12 text-lg italic">暂无收支记录。</div> : Object.entries(groupedTransactions).map(([date, txs]) => (<div key={date} className="space-y-3"><div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 py-2 border-b border-slate-50 dark:border-slate-800"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">{date === getLocalDateString(new Date()) ? '今天' : date}</span></div><div className="space-y-2">{txs.map(tx => (<div key={tx.id} className="grid grid-cols-12 items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group"><div className="col-span-7"><div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3 text-base"><span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></span>{tx.category}</div><div className="text-xs text-slate-400 font-medium pl-5 mt-0.5">{tx.remark || '无备注'}</div></div><div className={`col-span-3 text-right font-black text-lg ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.amount > 0 ? '+' : ''} RM {Math.abs(tx.amount).toFixed(2)}</div><div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => startEditTx(tx)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors" title="编辑"><Edit3 size={18}/></button><button onClick={() => deleteTx(tx.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="删除"><Trash2 size={18}/></button></div></div>))}</div></div>))}</div>)}</div>
            </div>

            {isAddJarOpen && (<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white dark:bg-slate-900 rounded-3xl p-10 w-full max-w-md shadow-2xl border border-white/50 dark:border-slate-800"><h3 className="font-bold text-2xl mb-8 text-slate-800 dark:text-slate-100">添加新存钱罐</h3><form onSubmit={handleAddJar} className="space-y-6"><div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">罐子名称</label><input className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:border-violet-500 bg-slate-50 dark:bg-slate-800 dark:text-white text-lg" value={newJarForm.label} onChange={e => setNewJarForm({...newJarForm, label: e.target.value})} placeholder="例如: 长期储蓄" autoFocus /></div><div><label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">分配比例 (%)</label><input type="number" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:border-violet-500 bg-slate-50 dark:bg-slate-800 dark:text-white text-lg" value={newJarForm.percent} onChange={e => setNewJarForm({...newJarForm, percent: e.target.value})} placeholder="0 - 100" /></div><div className="flex gap-4 pt-4"><button type="button" onClick={() => setIsAddJarOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-lg">取消</button><button type="submit" className="flex-1 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg text-lg">创建罐子</button></div></form></div></div>)}
        </div>
    );
};

const CalendarView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, onUpdate, onDelete, categories, setCategories }) => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const totalSlots = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];
    const [previewDate, setPreviewDate] = useState(null);

    return (
      <div className="flex flex-col animate-fade-in pb-20 md:pb-0 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8"><h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Calendar</h2>
          <div className="flex gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"><button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><ChevronLeft size={24}/></button><span className="px-6 py-2 font-bold text-slate-700 dark:text-slate-200 text-lg flex items-center">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span><button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><ChevronRight size={24}/></button></div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (<div key={d} className="py-5 text-center text-sm font-black text-slate-400 uppercase tracking-widest">{d}</div>))}</div>
          <div className="grid grid-cols-7 auto-rows-auto bg-slate-50 dark:bg-slate-800 gap-[1px]">
            {totalSlots.map((day, i) => {
              if (!day) return <div key={i} className="bg-white dark:bg-slate-900 min-h-[140px]"></div>;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = sortTasksByTime(tasks.filter(t => t.date === dateStr));
              const isToday = dateStr === getLocalDateString(new Date());
              return (
                <div key={i} className="bg-white dark:bg-slate-900 p-3 hover:bg-violet-50/30 dark:hover:bg-violet-900/20 transition-colors group flex flex-col min-h-[140px] border-b border-r border-slate-50 dark:border-slate-800 relative">
                  <div className={`text-base font-bold w-9 h-9 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none' : 'text-slate-700 dark:text-slate-300'}`}>{day}</div>
                  <div className="space-y-1.5 overflow-hidden">{dayTasks.slice(0, 4).map(t => (<div key={t.id} className={`text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 truncate font-medium ${t.completed ? 'text-slate-300 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{t.title}</div>))}{dayTasks.length > 4 && <div className="text-[10px] text-slate-400 pl-1 font-bold pt-1">+ {dayTasks.length - 4} more</div>}</div>
                  <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/90 dark:bg-slate-900/90 rounded-xl p-1.5 shadow-md border border-slate-100 dark:border-slate-700">
                      <button onClick={(e) => { e.stopPropagation(); setPreviewDate(dateStr); }} className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg" title="View Tasks"><Eye size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); openAddModal(dateStr); }} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg" title="Add Task"><Plus size={16}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <DayPreviewModal isOpen={!!previewDate} onClose={() => setPreviewDate(null)} dateStr={previewDate} tasks={tasks} onToggle={toggleTask} onUpdate={onUpdate} onDelete={onDelete} categories={categories} setCategories={setCategories} />
      </div>
    );
};

const TimelineView = ({ currentDate, setCurrentDate, tasks, openAddModal, toggleTask, deleteTask, onUpdate, moveTask, onMoveTaskToTime, categoryColors, categories, setCategories, onCloneYesterday }) => {
    const hours = [...Array.from({length: 18}, (_, i) => i + 6), 0]; 
    const dateStr = getLocalDateString(currentDate);
    const [clonePickerOpen, setClonePickerOpen] = useState(false);
    const [dragOverHour, setDragOverHour] = useState(null);
    
    return (
      <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-3xl sticky top-0 z-10 flex-wrap gap-6">
            <div>
               <h2 className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{currentDate.toLocaleDateString('default', {weekday: 'long'})}</h2>
               <p className="text-slate-500 font-bold text-xl mt-1">{currentDate.toLocaleDateString('default', {day: 'numeric', month: 'long'})}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-row flex-nowrap gap-3 items-center w-full md:w-auto">
                   <button onClick={() => onCloneYesterday(dateStr)} className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-violet-100 hover:text-violet-600 transition-all text-sm whitespace-nowrap" title="Copy tasks from yesterday">
                       <Copy size={16}/> Yesterday
                   </button>
                   <div className="relative flex-shrink-0">
                       <button onClick={() => setClonePickerOpen(!clonePickerOpen)} className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-violet-100 hover:text-violet-600 transition-all text-sm whitespace-nowrap" title="Copy tasks from a specific date">
                           <CalendarDays size={16}/> From...
                       </button>
                       {clonePickerOpen && (
                           <input type="date" className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl z-50 dark:text-white" onChange={(e) => { if(e.target.value) { onCloneYesterday(dateStr, e.target.value); setClonePickerOpen(false); } }} autoFocus onBlur={() => setTimeout(() => setClonePickerOpen(false), 200)} />
                       )}
                   </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl">
                    <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate()-1)))} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition text-slate-400 shadow-sm"><ChevronLeft size={18}/></button>
                    <input type="date" value={dateStr} onChange={(e) => setCurrentDate(new Date(e.target.value))} className="bg-transparent font-bold text-sm px-2 outline-none text-slate-600 dark:text-slate-300 min-w-[140px] text-center cursor-pointer w-auto" />
                    <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate()+1)))} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition text-slate-400 shadow-sm"><ChevronRight size={18}/></button>
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="space-y-3"> 
            {hours.map((hour) => {
              const displayHour = hour === 0 ? "12:00 AM" : hour === 12 ? "12:00 PM" : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
              const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
              const hourTasks = tasks.filter(t => t.date === dateStr && t.time && parseInt(t.time.split(':')[0]) === hour);
              
              return (
                <div 
                    key={hour} 
                    onDragOver={(e) => { e.preventDefault(); setDragOverHour(hour); }}
                    onDragLeave={() => setDragOverHour(null)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOverHour(null);
                        const dragId = e.dataTransfer.getData('text/plain');
                        if (dragId) onMoveTaskToTime(dragId, dateStr, hour);
                    }}
                    className={`flex items-start gap-6 p-5 rounded-2xl transition-all border ${dragOverHour === hour ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 border-dashed' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                    <div className="w-24 flex-shrink-0 pt-2 border-r border-slate-100 dark:border-slate-800 mr-2"><span className="text-base font-black text-slate-400 dark:text-slate-500">{displayHour}</span></div>
                    <div className="flex-1 min-h-[70px] flex flex-col justify-center">
                      <div className="w-full space-y-3">
                          {hourTasks.map(task => (<TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onUpdate={onUpdate} moveTask={moveTask} categories={categories} setCategories={setCategories} showWarning={false} showTime={false} format="timeline" />))}
                          {hourTasks.length < 5 && (
                              <button onClick={() => openAddModal(dateStr, timeLabel)} className="text-left text-slate-300 dark:text-slate-500 text-base font-medium hover:text-violet-500 flex items-center gap-2 w-full transition-all py-3 h-full"><Plus size={18} className="opacity-50"/> {hourTasks.length === 0 ? "Add focus" : "Add more..."}</button>
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

// --- Review Components ---
const ReviewInput = ({ value, onChange, placeholder, color, showCheckbox, disabled }) => {
    const text = (value && typeof value === 'object') ? value.text : value;
    const checked = (value && typeof value === 'object') ? value.checked : false;
    if (disabled) return null;
    return (
        <div className="flex items-start gap-4 mb-3 group animate-in fade-in slide-in-from-top-2 duration-300">
           {showCheckbox && (<button onClick={() => onChange({ text: text || '', checked: !checked })} className={`mt-3 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${checked ? `bg-${color}-500 border-${color}-500 text-white` : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}><CheckSquare size={14} fill={checked ? "currentColor" : "none"}/></button>)}
           <textarea value={text || ''} onChange={(e) => onChange({ text: e.target.value, checked })} placeholder={placeholder} rows={1} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} className={`flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 outline-none focus:border-${color}-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-base font-medium resize-none overflow-hidden min-h-[56px] dark:text-slate-200`} />
        </div>
    );
};

const ReviewSection = ({ title, icon, color, data, field, onChange, count = 3, showCheckbox = false }) => {
    return (
        <div className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm`}>
            <h4 className={`font-black text-${color}-500 mb-5 flex items-center gap-3 uppercase tracking-wider text-sm`}>{icon} {title}</h4>
            {Array.from({ length: count }).map((_, i) => (<ReviewInput key={i} value={data[i]} onChange={(val) => onChange(field, i, val)} placeholder={`Item ${i+1}`} color={color} showCheckbox={showCheckbox} />))}
        </div>
    );
};

const YearlyReviewSection = ({ title, icon, color, data, field, onChange, count = 5 }) => {
    return (
        <div className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm`}>
            <h4 className={`font-black text-${color}-500 mb-5 flex items-center gap-3 uppercase tracking-wider text-sm`}>{icon} {title}</h4>
            {Array.from({ length: count }).map((_, i) => {
                let isVisible = true;
                if (i >= 3) {
                    if (i === 3) {
                        const firstThreeChecked = data[0]?.checked && data[1]?.checked && data[2]?.checked;
                        if (!firstThreeChecked) isVisible = false;
                    } else if (i > 3) {
                        if (!data[i-1]?.checked) isVisible = false;
                    }
                }
                return (<ReviewInput key={i} value={data[i]} onChange={(val) => onChange(field, i, val)} placeholder={`Goal ${i+1}`} color={color} showCheckbox={true} disabled={!isVisible} />);
            })}
        </div>
    );
};


const ReviewView = ({ reviews, onUpdateReview, startYearDate }) => {
    const [activeTab, setActiveTab] = useState('daily');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); 
    const [subCycle, setSubCycle] = useState(0); 
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));

    const dailyData = reviews?.daily?.[selectedDate] || { keep: [], improve: [], start: [], stop: [] };
    const activeGlobalCycleId = (selectedMonth * 3) + subCycle + 1;
    const cycleData = reviews?.cycle?.[activeGlobalCycleId] || { blocks: [{ plan: '', execute: '', adjust: '', check: '' }] };
    const yearlyGoals = reviews?.yearly || { education: [], family: [], financial: [], business: [], health: [], breakthrough: [], experience: [] };

    const changeDate = (days) => { const d = new Date(selectedDate); d.setDate(d.getDate() + days); setSelectedDate(getLocalDateString(d)); };
    const getCycleInfo = (globalId) => { const start = new Date(startYearDate); start.setDate(start.getDate() + (globalId - 1) * 10); const end = new Date(start); end.setDate(end.getDate() + 9); return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`; };
    const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

    const handleDailyChange = (field, idx, val) => { const list = [...(dailyData[field] || [])]; while (list.length <= idx) { list.push({ text: '', checked: false }); } list[idx] = val; const sanitizedList = list.map(item => item === undefined ? { text: '', checked: false } : item); const newData = { ...reviews, daily: { ...(reviews.daily || {}), [selectedDate]: { ...dailyData, [field]: sanitizedList } } }; onUpdateReview(newData); };
    const handleCycleChange = (newBlocks) => { const newData = { ...reviews, cycle: { ...(reviews.cycle || {}), [activeGlobalCycleId]: { ...cycleData, blocks: newBlocks } } }; onUpdateReview(newData); };
    const handleBlockChange = (index, field, val) => { const blocks = cycleData.blocks || [{ plan: '', execute: '', adjust: '', check: '' }]; const newBlocks = [...blocks]; newBlocks[index] = { ...newBlocks[index], [field]: val.text || val }; handleCycleChange(newBlocks); };
    const handleAddBlock = () => { const blocks = cycleData.blocks || [{ plan: '', execute: '', adjust: '', check: '' }]; if (blocks.length < 5) { handleCycleChange([...blocks, { plan: '', execute: '', adjust: '', check: '' }]); } };
    const handleDeleteBlock = (index) => { const blocks = cycleData.blocks || [{ plan: '', execute: '', adjust: '', check: '' }]; const newBlocks = blocks.filter((_, i) => i !== index); handleCycleChange(newBlocks.length === 0 ? [{ plan: '', execute: '', adjust: '', check: '' }] : newBlocks); };
    const handleYearlyChange = (field, idx, val) => { const list = [...(yearlyGoals[field] || [])]; while (list.length <= idx) { list.push({ text: '', checked: false }); } list[idx] = val; const sanitizedList = list.map(item => item === undefined ? { text: '', checked: false } : item); const newData = { ...reviews, yearly: { ...yearlyGoals, [field]: sanitizedList } }; onUpdateReview(newData); };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-fade-in">
            <header className="flex justify-between items-end"><div><h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">Review</h2><p className="text-slate-500 font-medium text-lg mt-1">Reflect and Evolve</p></div><div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">{['daily', 'cycle', 'yearly'].map(t => (<button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-base font-bold transition-all capitalize ${activeTab === t ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>{t} Review</button>))}</div></header>

            {activeTab === 'daily' ? (
                <div className="space-y-8">
                    <div className="flex justify-end items-center gap-3">
                        <button onClick={() => changeDate(-1)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><ChevronLeft size={20}/></button>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 outline-none text-base"/>
                        <button onClick={() => changeDate(1)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><ChevronRight size={20}/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ReviewSection title="Keep (保持)" icon={<CheckSquare size={20}/>} color="emerald" data={dailyData.keep || []} field="keep" onChange={handleDailyChange} count={3}/>
                        <ReviewSection title="Improve (改进)" icon={<TrendingUp size={20}/>} color="amber" data={dailyData.improve || []} field="improve" onChange={handleDailyChange} count={3}/>
                        <ReviewSection title="Start (开始)" icon={<PlayCircle size={20}/>} color="blue" data={dailyData.start || []} field="start" onChange={handleDailyChange} count={3}/>
                        <ReviewSection title="Stop (停止)" icon={<StopCircle size={20}/>} color="rose" data={dailyData.stop || []} field="stop" onChange={handleDailyChange} count={3}/>
                    </div>
                </div>
            ) : activeTab === 'cycle' ? (
                <div className="space-y-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-start bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="flex gap-3">
                                {[0, 1, 2].map((idx) => {
                                    const cId = (selectedMonth * 3) + idx + 1;
                                    const range = getCycleInfo(cId);
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => setSubCycle(idx)} 
                                            className={`flex flex-col items-start px-6 py-4 rounded-2xl transition-all border ${subCycle === idx ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800 shadow-sm' : 'bg-white dark:bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className={`text-sm font-black uppercase tracking-widest ${subCycle === idx ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`}>Cycle {idx + 1}</span>
                                            <span className={`text-xs font-bold mt-1 ${subCycle === idx ? 'text-violet-400' : 'text-slate-500'}`}>{range}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="relative">
                                <select 
                                    value={selectedMonth} 
                                    onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setSubCycle(0); }} 
                                    className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-base px-8 py-4 pr-12 rounded-xl outline-none focus:border-violet-300 cursor-pointer"
                                >
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={20}/></div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {(cycleData.blocks || [{ plan: '', execute: '', adjust: '', check: '' }]).map((block, i) => (
                                <div key={i} className="p-8 rounded-3xl border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm relative animate-fade-in">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-black text-slate-400 uppercase tracking-wider text-sm flex items-center gap-2">
                                            <Target size={18} className="text-violet-500"/> Block {i + 1}
                                        </h4>
                                        <button onClick={() => handleDeleteBlock(i)} className="text-slate-300 hover:text-red-500 transition-colors p-2 bg-slate-50 dark:bg-slate-800 rounded-lg" title="Delete Block">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-blue-500 uppercase tracking-widest ml-1">Plan (计划)</label>
                                            <ReviewInput value={block.plan} onChange={(v) => handleBlockChange(i, 'plan', v)} placeholder="What's the plan?" color="blue" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-violet-500 uppercase tracking-widest ml-1">Execute (执行)</label>
                                            <ReviewInput value={block.execute} onChange={(v) => handleBlockChange(i, 'execute', v)} placeholder="How did it go?" color="violet" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-amber-500 uppercase tracking-widest ml-1">Adjust (调整)</label>
                                            <ReviewInput value={block.adjust} onChange={(v) => handleBlockChange(i, 'adjust', v)} placeholder="What to change?" color="amber" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest ml-1">Check (检查)</label>
                                            <ReviewInput value={block.check} onChange={(v) => handleBlockChange(i, 'check', v)} placeholder="Results?" color="emerald" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(!cycleData.blocks || cycleData.blocks.length < 5) && (
                            <button onClick={handleAddBlock} className="w-full py-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-bold hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all flex items-center justify-center gap-2 text-lg">
                                <Plus size={20}/> Add New Block
                            </button>
                        )}
                        
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                         <YearlyReviewSection title="Education (学习)" icon={<GraduationCap size={20}/>} color="blue" data={yearlyGoals.education || []} field="education" onChange={handleYearlyChange} count={5}/>
                         <YearlyReviewSection title="Family (家庭)" icon={<Users size={20}/>} color="rose" data={yearlyGoals.family || []} field="family" onChange={handleYearlyChange} count={5}/>
                         <YearlyReviewSection title="Financial (财务)" icon={<DollarSign size={20}/>} color="emerald" data={yearlyGoals.financial || []} field="financial" onChange={handleYearlyChange} count={5}/>
                         <YearlyReviewSection title="Business (事业)" icon={<Briefcase size={20}/>} color="violet" data={yearlyGoals.business || []} field="business" onChange={handleYearlyChange} count={5}/>
                         <YearlyReviewSection title="Health (健康)" icon={<Heart size={20}/>} color="red" data={yearlyGoals.health || []} field="health" onChange={handleYearlyChange} count={5}/>
                         <YearlyReviewSection title="BreakThrough (突破)" icon={<TrendingUp size={20}/>} color="amber" data={yearlyGoals.breakthrough || []} field="breakthrough" onChange={handleYearlyChange} count={5}/>
                         <YearlyReviewSection title="Experience (体验)" icon={<Globe size={20}/>} color="cyan" data={yearlyGoals.experience || []} field="experience" onChange={handleYearlyChange} count={5}/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function App() {
  const [view, setView] = useState('focus'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState(getLocalDateString(new Date()));
  const [selectedTimeForAdd, setSelectedTimeForAdd] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const [isDark, setIsDark] = useState(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem('theme') === 'dark';
      }
      return false;
  });

  useEffect(() => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
      }
  }, [isDark]);

  const [categories, setCategories] = useState([
      { name: '工作', color: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800' },
      { name: '生活', color: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800' },
      { name: '健康', color: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800' },
      { name: '学习', color: 'bg-violet-100 text-violet-600 border-violet-200 dark:bg-violet-900/40 dark:text-violet-400 dark:border-violet-800' }
  ]);
  const [tasks, setTasks] = useState([]);
  const [startYearDate, setStartYearDate] = useState(new Date().getFullYear() + '-01-01');
  const [wealthBalances, setWealthBalances] = useState({ commitment: 0 });
  const [wealthTransactions, setWealthTransactions] = useState([]);
  const [wealthConfig, setWealthConfig] = useState({ yearlyTarget: 100000, commitment: 2000, showCommitment: true, jars: [] });
  const [reviews, setReviews] = useState({ daily: {}, cycle: {}, yearly: {} });
  const [isLoaded, setIsLoaded] = useState(false);
  const [habits, setHabits] = useState([]);
  const [flywheelData, setFlywheelData] = useState({ cards: [], connections: [] });

  useEffect(() => { 
    const initAuth = async () => { 
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { 
                await signInWithCustomToken(auth, __initial_auth_token); 
            } else { 
                await signInAnonymously(auth); 
            } 
        } catch (e) {
            console.error("Auth Init Error:", e);
            try { await signInAnonymously(auth); } catch (e2) {}
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
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'categories'), d => {
              if (d.exists()) {
                  const list = d.data().list || [];
                  const formatted = list.map(c => typeof c === 'string' ? { name: c, color: 'bg-slate-100 text-slate-600 border-slate-200' } : c);
                  setCategories(formatted);
              }
          }, () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'habits'), d => d.exists() && setHabits(d.data().list || []), () => {}));
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'wealth_v2'), d => {
              if(d.exists() && Object.keys(d.data()).length > 0) { 
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
          unsubs.push(onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'flywheel'), d => d.exists() && setFlywheelData(d.data()), () => {}));
          
          setIsLoaded(true);
          return () => unsubs.forEach(u => u());
      } else { loadLocalStorage(); }
  }, [user]);

  const removeUndefined = (obj) => JSON.parse(JSON.stringify(obj));

  const saveData = (type, data) => { 
      if(user) { 
          try {
              setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', type), removeUndefined(data)); 
          } catch(e) { console.error("Save error:", e); }
      } else { 
          localStorage.setItem(`planner_${type}`, JSON.stringify(removeUndefined(data))); 
      } 
  };
  
  useEffect(() => { if(isLoaded) saveData('tasks', { list: tasks }); }, [tasks, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('categories', { list: categories }); }, [categories, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('habits', { list: habits }); }, [habits, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('wealth_v2', { balances: wealthBalances, transactions: wealthTransactions, config: wealthConfig }); }, [wealthBalances, wealthTransactions, wealthConfig, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('reviews', reviews); }, [reviews, isLoaded]);
  useEffect(() => { if(isLoaded) saveData('flywheel', flywheelData); }, [flywheelData, isLoaded]);

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
          const f = localStorage.getItem('planner_flywheel'); if(f) setFlywheelData(JSON.parse(f));
          setIsLoaded(true);
      } catch(e) { console.error(e); }
  }
  
  const addTask = (newTask) => setTasks([...tasks, { id: Date.now(), completed: false, ...newTask }]);
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const updateTask = (id, updates) => setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));

  const moveTask = (dragId, targetId, position) => {
      const dragIndex = tasks.findIndex(t => t.id === dragId || t.id === parseInt(dragId));
      const targetIndex = tasks.findIndex(t => t.id === targetId || t.id === parseInt(targetId));
      if (dragIndex >= 0 && targetIndex >= 0 && dragIndex !== targetIndex) {
          const newTasks = [...tasks];
          const [draggedItem] = newTasks.splice(dragIndex, 1);
          let insertIndex = targetIndex;
          const newTargetIndex = newTasks.findIndex(t => t.id === targetId || t.id === parseInt(targetId));
          if (position === 'bottom') { insertIndex = newTargetIndex + 1; } else { insertIndex = newTargetIndex; }
          newTasks.splice(insertIndex, 0, draggedItem);
          setTasks(newTasks);
      }
  };

  const moveTaskToTime = (dragId, targetDate, targetHour) => {
      const timeStr = `${targetHour.toString().padStart(2, '0')}:00`;
      setTasks(prev => prev.map(t => t.id.toString() === dragId.toString() ? { ...t, date: targetDate, time: timeStr } : t));
  };
  
  const cloneYesterdayTasks = (targetDateStr, sourceDateStr) => {
      const sourceDate = sourceDateStr ? new Date(sourceDateStr) : new Date(new Date(targetDateStr).setDate(new Date(targetDateStr).getDate() - 1));
      const realSourceStr = sourceDateStr || getLocalDateString(sourceDate);
      const tasksToClone = tasks.filter(t => t.date === realSourceStr);
      if (tasksToClone.length === 0) { alert(`No tasks found on ${realSourceStr} to clone!`); return; }
      const clonedTasks = tasksToClone.map(t => ({ ...t, id: generateId(), date: targetDateStr, completed: false }));
      setTasks(prev => [...prev, ...clonedTasks]);
  };
  
  const updateHabit = (id, updates) => setHabits(habits.map(h => h.id === id ? { ...h, ...updates } : h));
  const addHabit = (habit) => setHabits([...habits, { id: generateId(), completed: [], ...habit }]);
  const deleteHabit = (id) => setHabits(habits.filter(h => h.id !== id));

  const openAddModal = (dateStr, timeStr) => { setSelectedDateForAdd(dateStr || getLocalDateString(new Date())); setSelectedTimeForAdd(timeStr || ''); setIsModalOpen(true); };

  return (
    <div className={isDark ? 'dark' : ''}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #475569; }
      `}</style>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-2xl md:shadow-none transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8">
            <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100 font-black text-2xl mb-10 tracking-tight"><div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-none"><Layout size={20} /></div>Planner<span className="text-violet-600 dark:text-violet-400">.AI</span></div>
            <nav className="space-y-1.5">{[{ id: 'focus', label: 'Dashboard', icon: Home }, { id: 'wealth', label: 'Wealth Jar', icon: Database }, { id: 'calendar', label: 'Calendar', icon: CalIcon }, { id: 'kanban', label: 'Timeline', icon: Trello }, { id: 'review', label: 'Review', icon: ClipboardList }, { id: 'flywheel', label: 'Flywheel', icon: Aperture }].map(item => (
                <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all font-bold text-base tracking-wide ${view === item.id ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xl dark:shadow-none' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><item.icon size={20} className={view === item.id ? "text-violet-300 dark:text-violet-400" : ""}/>{item.label}</button>
              ))}</nav>
          </div>
          <div className="mt-auto p-8 flex flex-col gap-4">
             <button onClick={() => setIsDark(!isDark)} className="flex items-center justify-center gap-2 p-3 w-full border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-colors">
                {isDark ? <Sun size={18}/> : <Moon size={18}/>} {isDark ? 'Light Mode' : 'Dark Mode'}
             </button>
             {user ? (<div className="flex items-center gap-3 overflow-hidden"><div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center font-bold text-lg">{user.email ? user.email[0].toUpperCase() : 'U'}</div><div className="flex-1 min-w-0"><div className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate" title={user.uid}>{user.email ? user.email.split('@')[0] : 'Commander'}</div><button onClick={() => signOut(auth)} className="text-xs text-red-500 hover:underline">Log Out</button></div></div>) : 
              (<button onClick={() => setIsAuthModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-600"><LogIn size={16} /> Login</button>)}
          </div>
        </aside>
        <main className="flex-1 flex flex-col relative h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
          <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-30"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 dark:text-slate-300 p-2"><Menu size={24} /></button><span className="font-black text-slate-800 dark:text-slate-100 tracking-widest text-base uppercase">{view}</span><button onClick={() => openAddModal()} className="text-violet-600 p-2"><Plus size={24} /></button></header>
          <div className="flex-1 p-5 md:p-10 overflow-y-auto custom-scrollbar md:pb-10 relative">
            {view === 'focus' && <DashboardView tasks={tasks} onAddTask={addTask} user={user} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} moveTask={moveTask} categories={categories} habits={habits} onUpdateHabit={updateHabit} onAddHabit={addHabit} onDeleteHabit={deleteHabit} setCategories={setCategories} />}
            {view === 'wealth' && <WealthJarView balances={wealthBalances} setBalances={setWealthBalances} wealthConfig={wealthConfig} setWealthConfig={setWealthConfig} transactions={wealthTransactions} setTransactions={setWealthTransactions}/>}
            {view === 'calendar' && <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} onUpdate={updateTask} onDelete={deleteTask} categories={categories} setCategories={setCategories} />}
            {view === 'kanban' && <TimelineView currentDate={currentDate} setCurrentDate={setCurrentDate} tasks={tasks} openAddModal={openAddModal} toggleTask={toggleTask} deleteTask={deleteTask} onUpdate={updateTask} moveTask={moveTask} categories={categories} setCategories={setCategories} onCloneYesterday={cloneYesterdayTasks} onMoveTaskToTime={moveTaskToTime} />}
            {view === 'review' && <ReviewView reviews={reviews} onUpdateReview={setReviews} startYearDate={startYearDate}/>}
            {view === 'flywheel' && <FlywheelView data={flywheelData} setData={setFlywheelData} />}
          </div>
        </main>
        <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} defaultDate={selectedDateForAdd} defaultTime={selectedTimeForAdd} categories={categories} setCategories={setCategories}/>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    </div>
  );
}