
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import MenuCard from './components/MenuCard';
import ReservationForm from './components/ReservationForm';
import { MENU_ITEMS as INITIAL_MENU, PHONE, LOCATION, RESTAURANT_NAME, SITE_URL } from './constants';
import { Dish, OrderHistoryItem, Reservation } from './types';
import { GoogleGenAI, Type } from "@google/genai";

const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" className="text-orange-600/20" />
      <path d="M30 70 Q50 20 70 70 M50 35 L50 70" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-orange-600" />
      <circle cx="50" cy="30" r="4" className="fill-orange-500 animate-pulse" />
      <path d="M40 75 H60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-stone-800" />
    </svg>
  </div>
);

const QRCodeImage: React.FC<{ size?: number, className?: string }> = ({ size = 150, className = "" }) => (
  <div className={`bg-white p-2 rounded-xl shadow-sm inline-block border border-stone-100 ${className}`}>
    <img 
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(SITE_URL)}`} 
      alt={`Scannez pour accéder au site officiel de ${RESTAURANT_NAME}`}
      width={size}
      height={size}
      className="block"
    />
  </div>
);

// --- AI Chat Assistant Component ---
const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, {role: 'user', text: userMsg}].map(m => ({
           role: m.role,
           parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: `Tu es l'assistant virtuel du ${RESTAURANT_NAME} à Niamey. 
          Ton nom est "Petit Bassam". Tu es expert en gastronomie ivoirienne.
          Le menu actuel : Garba (Attiéké Thon), Kedjenou de poulet, Foutou Banane sauce graine, Placali, Alloco.
          Réponds avec l'accent et la chaleur ivoirienne (utilise des mots comme 'Akwaaba', 'Yako', 'C'est doux !').
          Aide pour les réservations et explique la composition des plats.`,
          temperature: 0.8,
        }
      });
      
      const aiText = response.text || "Désolé l'ami, j'ai un petit souci de connexion. On se reparle dans un instant ?";
      setMessages(prev => [...prev, {role: 'model', text: aiText}]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {role: 'model', text: "Oups, ma connexion a sauté. Réessaie un peu !"}]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] no-print">
      {isOpen ? (
        <div className="bg-white w-[350px] sm:w-[400px] h-[550px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-stone-100 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg shadow-inner">🇨🇮</div>
              <div>
                <h4 className="font-bold text-sm tracking-tight">Petit Bassam</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-[10px] opacity-80 uppercase font-black">Disponible</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-2 rounded-full transition">✕</button>
          </div>
          
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 bg-stone-50 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-orange-600 font-black text-xs uppercase tracking-widest mb-4">Akwaaba !</p>
                <p className="text-stone-400 text-sm italic">"Ici on mange bien, on rit fort. Comment puis-je t'aider ?"</p>
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                   {['C\'est quoi le Garba ?', 'Réserver une table', 'Horaires'].map(q => (
                     <button key={q} onClick={() => { setInput(q); }} className="text-[10px] font-bold bg-white border border-stone-100 px-4 py-2 rounded-full hover:border-orange-200 hover:text-orange-600 transition-all">{q}</button>
                   ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-stone-800 shadow-sm border border-stone-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-stone-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ton message..."
              className="flex-grow p-4 bg-stone-50 rounded-2xl outline-none text-sm focus:ring-2 focus:ring-orange-600/20 transition-all"
            />
            <button onClick={handleSend} className="bg-orange-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
          aria-label="Discuter avec Petit Bassam"
        >
          <span className="text-3xl group-hover:rotate-12 transition-transform">🦁</span>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-stone-50 animate-pulse"></div>
        </button>
      )}
    </div>
  );
};

// --- Main App Component ---
type AdminTab = 'none' | 'dashboard' | 'orders' | 'reservations' | 'accounting' | 'menu_manager';

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('tous');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [showAdminPortal, setShowAdminPortal] = useState<AdminTab>('none');
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  
  // Menu Management State
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newDish, setNewDish] = useState<Partial<Dish>>({
    name: '',
    description: '',
    price: 0,
    category: 'plat',
    image: ''
  });
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<OrderHistoryItem | null>(null);
  const [showMasterReport, setShowMasterReport] = useState(false);
  const [reportRange, setReportRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const localMenu = localStorage.getItem('grand_bassam_menu');
    const items = localMenu ? JSON.parse(localMenu) : INITIAL_MENU;
    setMenuItems(items);
    if (sessionStorage.getItem('is_admin') === 'true') {
      setIsAdminMode(true);
    }
    refreshAdminData();
  }, []);

  const refreshAdminData = () => {
    const fetchedOrders = JSON.parse(localStorage.getItem('grand_bassam_orders') || '[]');
    setOrders(fetchedOrders);
    const fetchedRes = JSON.parse(localStorage.getItem('grand_bassam_reservations') || '[]');
    setReservations(fetchedRes);
    const localMenu = localStorage.getItem('grand_bassam_menu');
    if (localMenu) setMenuItems(JSON.parse(localMenu));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // ACCÈS ADMIN : admin / bassam227
    if (username === 'admin' && password === 'bassam227') {
      setIsAdminMode(true);
      setShowLoginModal(false);
      sessionStorage.setItem('is_admin', 'true');
      setShowAdminPortal('dashboard');
      refreshAdminData();
    } else {
      setLoginError('Identifiants incorrects (admin / bassam227)');
    }
  };

  const logoutAdmin = () => {
    setIsAdminMode(false);
    setShowAdminPortal('none');
    sessionStorage.removeItem('is_admin');
  };

  // Order Management
  const updateOrderStatus = (id: string, status: 'Payé' | 'Nouveau') => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    localStorage.setItem('grand_bassam_orders', JSON.stringify(updated));
  };

  const deleteOrder = (id: string) => {
    if (confirm("Supprimer cette commande ?")) {
      const updated = orders.filter(o => o.id !== id);
      setOrders(updated);
      localStorage.setItem('grand_bassam_orders', JSON.stringify(updated));
    }
  };

  // Reservation Management
  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    const updated = reservations.map(r => r.id === id ? { ...r, status } : r);
    setReservations(updated);
    localStorage.setItem('grand_bassam_reservations', JSON.stringify(updated));
  };

  const deleteReservation = (id: string) => {
    if (confirm("Supprimer cette réservation ?")) {
      const updated = reservations.filter(r => r.id !== id);
      setReservations(updated);
      localStorage.setItem('grand_bassam_reservations', JSON.stringify(updated));
    }
  };

  // Menu Management
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit && editingDish) {
          setEditingDish({ ...editingDish, image: base64 });
        } else {
          setNewDish({ ...newDish, image: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    const currentImg = editingDish ? editingDish.image : newDish.image;
    if (!currentImg) return alert("Télécharge d'abord une photo, l'ami !");
    
    setIsAnalyzingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = currentImg.split(',')[1];
      const mimeType = currentImg.split(',')[0].split(':')[1].split(';')[0];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: "Identifie ce plat ivoirien. Retourne un JSON : 'name' (le nom exact), 'description' (une phrase vendeuse), 'category' (entrée, plat, dessert, boisson), 'price' (entre 2000 et 9000)." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              price: { type: Type.NUMBER }
            },
            required: ["name", "description", "category", "price"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (editingDish) {
        setEditingDish({
          ...editingDish,
          name: result.name || editingDish.name,
          description: result.description || editingDish.description,
          category: (result.category?.toLowerCase() || editingDish.category) as any,
          price: result.price || editingDish.price
        });
      } else {
        setNewDish({
          ...newDish,
          name: result.name || '',
          description: result.description || '',
          category: (result.category?.toLowerCase() || 'plat') as any,
          price: result.price || 0
        });
      }
    } catch (error) {
      console.error(error);
      alert("L'IA est un peu fatiguée, remplis les champs manuellement cette fois-ci.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const saveDish = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedMenu: Dish[];
    
    if (editingDish) {
      updatedMenu = menuItems.map(m => m.id === editingDish.id ? editingDish : m);
      setEditingDish(null);
    } else {
      const dishToSave: Dish = {
        ...newDish as Dish,
        id: Date.now().toString(),
      };
      updatedMenu = [dishToSave, ...menuItems];
      setNewDish({ name: '', description: '', price: 0, category: 'plat', image: '' });
      setShowAddDishModal(false);
    }
    
    setMenuItems(updatedMenu);
    localStorage.setItem('grand_bassam_menu', JSON.stringify(updatedMenu));
  };

  const deleteDish = (id: string) => {
    if (confirm("Supprimer ce plat définitivement de la carte ?")) {
      const updated = menuItems.filter(m => m.id !== id);
      setMenuItems(updated);
      localStorage.setItem('grand_bassam_menu', JSON.stringify(updated));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.timestamp.startsWith(today));
    const todayRevenue = todayOrders.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const totalRevenue = orders.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    
    const dishSales: Record<string, number> = {};
    orders.forEach(o => {
      dishSales[o.dishName] = (dishSales[o.dishName] || 0) + o.quantity;
    });
    const topDishes = Object.entries(dishSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    return { totalRevenue, todayRevenue, todayOrdersCount: todayOrders.length, topDishes };
  }, [orders]);

  const allActivities = useMemo(() => {
    const activityOrders = orders.map(o => ({ ...o, type: 'order' as const }));
    const activityReservations = reservations.map(r => ({ ...r, type: 'reservation' as const }));
    return [...activityOrders, ...activityReservations].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [orders, reservations]);

  const publicMenuItems = activeCategory === 'tous' ? menuItems : menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-stone-50">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-section, #print-section * { visibility: visible !important; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .no-print { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* ADMIN NAV BAR */}
      {isAdminMode && (
        <nav className="fixed top-0 left-0 w-full bg-stone-900 text-white py-3 px-6 z-[200] flex justify-between items-center shadow-2xl no-print border-b border-orange-600/50" aria-label="Administration">
          <div className="flex gap-6 overflow-x-auto items-center no-scrollbar">
            <span className="text-[10px] font-black bg-orange-600 px-3 py-1 rounded-full uppercase">MODE ADMIN</span>
            <button onClick={() => setShowAdminPortal('dashboard')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'dashboard' ? 'text-orange-400' : 'text-stone-400'}`}>Tableau de Bord</button>
            <button onClick={() => setShowAdminPortal('orders')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'orders' ? 'text-orange-400' : 'text-stone-400'}`}>Commandes</button>
            <button onClick={() => setShowAdminPortal('reservations')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'reservations' ? 'text-orange-400' : 'text-stone-400'}`}>Réservations</button>
            <button onClick={() => setShowAdminPortal('menu_manager')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'menu_manager' ? 'text-orange-400' : 'text-stone-400'}`}>Gérer la Carte</button>
          </div>
          <button onClick={logoutAdmin} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-lg hover:bg-white hover:text-stone-900 transition-colors ml-4 shrink-0">DÉCONNEXION</button>
        </nav>
      )}

      {/* PUBLIC VIEW */}
      <div className={`no-print ${isAdminMode ? 'pt-16' : ''}`}>
        <Navbar />
        <main>
          {/* Hero Section */}
          <section id="hero" className="h-[80vh] relative flex items-center justify-center bg-stone-950 overflow-hidden">
            <div className="absolute inset-0 opacity-40">
              <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Ambiance Grand Bassam" />
            </div>
            <div className="relative text-center px-4 animate-in fade-in zoom-in duration-1000">
              <Logo className="w-20 h-20 mx-auto mb-8 text-orange-500" />
              <h1 className="text-6xl md:text-9xl font-serif text-white italic mb-6 leading-none">Grand Bassam</h1>
              <p className="text-orange-400 text-lg md:text-2xl font-light tracking-[0.4em] uppercase mb-12">Le Goût de la Côte d'Ivoire à Niamey</p>
              <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="px-14 py-5 bg-orange-600 text-white rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-orange-700 hover:scale-105 active:scale-95 transition-all">Voir la Carte</button>
            </div>
          </section>

          {/* Menu Section */}
          <section id="menu" className="py-32 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 mb-20 text-center">
               <h2 className="text-4xl md:text-6xl font-serif font-bold italic mb-12">L'Art de la Table</h2>
               <div className="flex justify-center gap-8 border-b border-stone-200 pb-4 overflow-x-auto no-scrollbar">
                  {['tous', 'entrée', 'plat', 'dessert', 'boisson'].map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setActiveCategory(cat)} 
                      className={`text-[10px] font-black uppercase tracking-widest pb-4 transition-all px-6 ${activeCategory === cat ? 'text-orange-600 border-b-4 border-orange-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {publicMenuItems.map(dish => <MenuCard key={dish.id} dish={dish} />)}
            </div>
          </section>

          {/* Reserve Section */}
          <section id="reserve" className="py-32 bg-stone-900 text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-24 items-center">
              <div className="animate-in slide-in-from-left duration-1000">
                <h2 className="text-5xl md:text-7xl font-serif font-bold italic mb-8">Une Table pour vous ?</h2>
                <p className="text-stone-400 text-xl leading-relaxed mb-12">Profitez de notre cadre raffiné à Kouara Kano. Que ce soit pour un déjeuner d'affaires ou un dîner en famille, le voyage commence ici.</p>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <span className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-600 text-2xl">📍</span>
                    <div>
                      <p className="font-bold text-lg mb-1">{LOCATION}</p>
                      <p className="text-stone-500 text-sm">Quartier Kouara Kano, Rue KK-45</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-600 text-2xl">📞</span>
                    <div>
                      <p className="font-bold text-lg mb-1">{PHONE}</p>
                      <p className="text-stone-500 text-sm">WhatsApp disponible 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-3xl text-stone-900 animate-in slide-in-from-right duration-1000">
                <ReservationForm />
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-stone-950 text-white py-24 px-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
            <div className="col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <Logo className="w-12 h-12 text-orange-500" />
                <span className="text-3xl font-serif italic font-bold uppercase tracking-tight">{RESTAURANT_NAME}</span>
              </div>
              <p className="text-stone-500 text-lg max-w-sm leading-relaxed mb-12">
                Le meilleur de l'hospitalité et de la cuisine ivoirienne vous attend. Entre tradition et modernité, nous célébrons le goût authentique.
              </p>
              <button onClick={() => setShowLoginModal(true)} className="px-10 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-orange-600 transition-all">Accès Gérant</button>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-8">Navigation</h3>
              <ul className="space-y-4 text-stone-400 text-sm font-bold uppercase tracking-widest">
                <li><button onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Accueil</button></li>
                <li><button onClick={() => document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})}>La Carte</button></li>
                <li><button onClick={() => document.getElementById('reserve')?.scrollIntoView({behavior:'smooth'})}>Réserver</button></li>
              </ul>
            </div>
            <div className="flex flex-col md:items-end">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-8">Carte Digitale</h3>
              <QRCodeImage size={120} className="mb-6" />
              <p className="text-[10px] text-stone-700 uppercase tracking-widest font-black">© {new Date().getFullYear()} {RESTAURANT_NAME}</p>
            </div>
          </div>
        </footer>
      </div>

      <AIChat />

      {/* ADMIN PORTAL MODAL */}
      {isAdminMode && showAdminPortal !== 'none' && (
        <div className="fixed inset-0 bg-stone-50 z-[300] flex flex-col no-print overflow-hidden">
          <header className="p-6 border-b flex justify-between items-center bg-white shadow-sm">
            <div className="flex items-center gap-4">
               <Logo className="w-10 h-10 text-orange-600" />
               <h2 className="text-2xl font-serif font-bold italic uppercase">Console de Gestion</h2>
            </div>
            <button onClick={() => setShowAdminPortal('none')} className="w-12 h-12 flex items-center justify-center border rounded-2xl hover:bg-stone-100 transition-colors">✕</button>
          </header>
          
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar bg-stone-50/50">
            {showAdminPortal === 'dashboard' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Encaissement du Jour</p>
                       <p className="text-4xl font-serif font-bold italic text-stone-900">{stats.todayRevenue.toLocaleString()} F</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Commandes Récentes</p>
                       <p className="text-4xl font-serif font-bold italic text-stone-900">{stats.todayOrdersCount}</p>
                    </div>
                    <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                       <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Total Mois</p>
                       <p className="text-4xl font-serif font-bold italic text-orange-500">{stats.totalRevenue.toLocaleString()} F</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col">
                       <div className="px-8 py-6 border-b bg-stone-50 flex justify-between items-center">
                          <h3 className="font-bold text-stone-800 uppercase text-xs tracking-widest">Activité Récente</h3>
                       </div>
                       <div className="divide-y divide-stone-50 overflow-y-auto max-h-[400px]">
                          {allActivities.length === 0 ? (
                            <div className="p-20 text-center text-stone-400 italic">Aucune activité enregistrée.</div>
                          ) : (
                            allActivities.slice(0, 10).map((act: any) => (
                              <div key={act.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.type === 'order' ? 'bg-orange-50 text-orange-600' : 'bg-stone-900 text-white'}`}>
                                       {act.type === 'order' ? '🥘' : '📅'}
                                    </div>
                                    <div>
                                       <p className="font-bold text-sm">{act.type === 'order' ? act.dishName : act.name}</p>
                                       <p className="text-[10px] text-stone-400 uppercase font-black">{new Date(act.timestamp).toLocaleString()}</p>
                                    </div>
                                 </div>
                                 <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${act.status === 'Payé' || act.status === 'Confirmé' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{act.status}</span>
                              </div>
                            ))
                          )}
                       </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl">
                       <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-8">Palmarès des Plats</h3>
                       <div className="space-y-6">
                          {stats.topDishes.map((dish, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <span className="text-stone-300 font-serif italic text-2xl">{idx + 1}</span>
                                  <span className="font-bold text-stone-800">{dish.name}</span>
                               </div>
                               <span className="text-xs font-black text-orange-600">{dish.qty} ventes</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {showAdminPortal === 'menu_manager' && (
              <div className="max-w-5xl mx-auto space-y-8 pb-32">
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 mb-12 flex justify-between items-center shadow-sm">
                   <div>
                     <h3 className="text-xl font-bold">Gestion de la Carte</h3>
                     <p className="text-stone-400 text-sm italic">{menuItems.length} plats affichés en ligne</p>
                   </div>
                   <button onClick={() => setShowAddDishModal(true)} className="px-10 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Ajouter un Plat</button>
                </div>
                
                <div className="grid gap-6">
                  {menuItems.map(dish => (
                    <div key={dish.id} className="p-6 bg-white border border-stone-100 rounded-[2.5rem] flex flex-col md:flex-row gap-8 shadow-sm group hover:shadow-xl transition-all duration-500">
                      <div className="w-full md:w-56 h-48 rounded-3xl overflow-hidden bg-stone-100 shrink-0">
                        <img src={dish.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={dish.name} />
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="text-2xl font-bold text-stone-800 mb-1">{dish.name}</h4>
                                <span className="inline-block px-3 py-1 bg-stone-50 text-stone-400 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border">{dish.category}</span>
                             </div>
                             <div className="text-2xl font-serif font-bold text-orange-600">{dish.price.toLocaleString()} F</div>
                          </div>
                          <p className="text-stone-400 text-sm italic leading-relaxed my-4 line-clamp-2">"{dish.description}"</p>
                          <div className="flex gap-4">
                             <button onClick={() => setEditingDish(dish)} className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">Modifier</button>
                             <button onClick={() => deleteDish(dish.id)} className="px-6 py-3 border border-red-50 text-red-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-colors">Retirer</button>
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-stone-950/98 z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 to-orange-400"></div>
            <h2 className="text-3xl font-bold font-serif italic text-center mb-10 text-stone-900">Espace Gérant</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Identifiant</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-orange-300 transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Mot de passe</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-orange-300 transition-all" required />
              </div>
              {loginError && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest animate-pulse">{loginError}</p>}
              <button type="submit" className="w-full py-6 bg-stone-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-600 shadow-xl transition-all">S'authentifier</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-stone-400 text-[10px] font-black uppercase mt-4 tracking-widest">Retour au site</button>
            </form>
          </div>
        </div>
      )}

      {/* DISH FORM MODAL */}
      {(showAddDishModal || editingDish) && (
        <div className="fixed inset-0 bg-stone-950/95 z-[400] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar animate-in zoom-in duration-500">
            <h3 className="text-3xl font-serif font-bold italic mb-10 text-stone-800">{editingDish ? "Mise à jour du Plat" : "Nouvelle Création"}</h3>
            <form onSubmit={saveDish} className="space-y-8">
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nom du Plat</label>
                    <input required type="text" value={editingDish ? editingDish.name : newDish.name} onChange={e => editingDish ? setEditingDish({...editingDish, name: e.target.value}) : setNewDish({...newDish, name: e.target.value})} className="w-full p-5 bg-stone-50 border rounded-2xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Prix (FCFA)</label>
                    <input required type="number" value={editingDish ? editingDish.price : newDish.price} onChange={e => editingDish ? setEditingDish({...editingDish, price: parseInt(e.target.value)}) : setNewDish({...newDish, price: parseInt(e.target.value)})} className="w-full p-5 bg-stone-50 border rounded-2xl font-serif font-bold" />
                  </div>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Catégorie</label>
                 <select className="w-full p-5 bg-stone-50 border rounded-2xl font-bold uppercase text-xs tracking-widest" value={editingDish ? editingDish.category : newDish.category} onChange={e => editingDish ? setEditingDish({...editingDish, category: e.target.value as any}) : setNewDish({...newDish, category: e.target.value as any})}>
                    <option value="entrée">🥗 Entrée</option>
                    <option value="plat">🍲 Plat Principal</option>
                    <option value="dessert">🍰 Dessert</option>
                    <option value="boisson">🥤 Boisson</option>
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Description</label>
                 <textarea rows={4} required value={editingDish ? editingDish.description : newDish.description} onChange={e => editingDish ? setEditingDish({...editingDish, description: e.target.value}) : setNewDish({...newDish, description: e.target.value})} className="w-full p-5 bg-stone-50 border rounded-2xl text-sm italic" placeholder="Décrivez la magie du plat..." />
               </div>
               
               <div className="p-6 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-white rounded-3xl overflow-hidden shadow-inner flex items-center justify-center text-stone-200 shrink-0">
                       {(editingDish?.image || newDish.image) ? <img src={editingDish ? editingDish.image : newDish.image} className="w-full h-full object-cover" alt="Preview" /> : <span className="text-4xl">📸</span>}
                    </div>
                    <div className="flex-grow space-y-4 text-center md:text-left">
                       <input type="file" accept="image/*" onChange={e => handleImageUpload(e, !!editingDish)} className="text-[10px] font-black uppercase text-stone-400 block w-full" />
                       {(editingDish?.image || newDish.image) && (
                         <button 
                           type="button" 
                           onClick={analyzeImage}
                           disabled={isAnalyzingImage}
                           className="bg-orange-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-orange-700 transition disabled:opacity-50 flex items-center gap-2 mx-auto md:mx-0"
                         >
                           {isAnalyzingImage ? '🧬 Analyse en cours...' : '✨ Analyse IA par Gemini'}
                         </button>
                       )}
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-2 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-orange-600 transition-all flex-grow">Sauvegarder le Plat</button>
                  <button type="button" onClick={() => { setShowAddDishModal(false); setEditingDish(null); }} className="flex-1 bg-stone-100 text-stone-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Annuler</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
