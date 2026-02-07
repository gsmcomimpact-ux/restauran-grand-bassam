
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import MenuCard from './components/MenuCard';
import ReservationForm from './components/ReservationForm';
import { MENU_ITEMS as INITIAL_MENU, PHONE, LOCATION, RESTAURANT_NAME, SITE_URL } from './constants';
import { Dish, OrderHistoryItem, Reservation } from './types';
import { GoogleGenAI } from "@google/genai";

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
          systemInstruction: `Tu es l'assistant virtuel du ${RESTAURANT_NAME} à Niamey (Kouara Kano). 
          Tu es chaleureux, accueillant et tu connais parfaitement la cuisine ivoirienne. 
          Le menu inclut : Foutou Banane sauce Graine, Placali sauce Kpala, Attiéké Poisson Thon, Kedjenou de Poulet, Alloco, et Garba.
          Aide les clients avec leurs questions sur le menu, les réservations et la culture ivoirienne. 
          Réponds toujours en français avec une touche d'hospitalité ivoirienne.`,
          temperature: 0.7,
        }
      });
      
      const aiText = response.text || "Désolé, j'ai un petit souci technique. Peux-tu reformuler ?";
      setMessages(prev => [...prev, {role: 'model', text: aiText}]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {role: 'model', text: "Oups, je n'arrive pas à me connecter. Réessaie plus tard !"}]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] no-print">
      {isOpen ? (
        <div className="bg-white w-[350px] sm:w-[400px] h-[500px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-stone-100 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-orange-600 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">🇨🇮</div>
              <div>
                <h4 className="font-bold text-sm">Assistant Bassam</h4>
                <p className="text-[10px] opacity-80 uppercase font-black">En ligne</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-2 rounded-full transition">✕</button>
          </div>
          
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 bg-stone-50 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-10 text-stone-400">
                <p className="text-xs uppercase font-black tracking-widest mb-2">Akwaaba !</p>
                <p className="text-sm italic">Pose-moi une question sur notre menu ou la Côte d'Ivoire !</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-stone-800 shadow-sm border border-stone-100'}`}>
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
              placeholder="Écrivez ici..."
              className="flex-grow p-3 bg-stone-50 rounded-xl outline-none text-sm focus:ring-1 focus:ring-orange-600"
            />
            <button onClick={handleSend} className="bg-orange-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-orange-700 transition">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
          aria-label="Ouvrir le chat avec l'assistant"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform">💬</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
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
    if (username === 'admin' && password === 'bassam227') {
      setIsAdminMode(true);
      setShowLoginModal(false);
      sessionStorage.setItem('is_admin', 'true');
      setShowAdminPortal('dashboard');
      refreshAdminData();
    } else {
      setLoginError('Identifiants incorrects');
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
    if (confirm("Supprimer ce plat définitivement ?")) {
      const updated = menuItems.filter(m => m.id !== id);
      setMenuItems(updated);
      localStorage.setItem('grand_bassam_menu', JSON.stringify(updated));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Stats & Reports
  const filteredOrdersForReport = useMemo(() => {
    return orders.filter(o => {
      const orderDate = o.timestamp.split('T')[0];
      return orderDate >= reportRange.start && orderDate <= reportRange.end;
    });
  }, [orders, reportRange]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.timestamp.startsWith(today));
    const todayRevenue = todayOrders.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    
    const total = filteredOrdersForReport.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const paid = filteredOrdersForReport.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    
    // Most popular dishes
    const dishSales: Record<string, number> = {};
    orders.forEach(o => {
      dishSales[o.dishName] = (dishSales[o.dishName] || 0) + o.quantity;
    });
    const topDishes = Object.entries(dishSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    return { total, paid, pending: total - paid, todayRevenue, todayOrdersCount: todayOrders.length, topDishes };
  }, [orders, filteredOrdersForReport]);

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
          #print-section { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0; 
            background: white; 
            color: black !important;
            display: block !important;
          }
          .no-print { display: none !important; }
          #print-section button { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
          .print-page-break-after { page-break-after: always; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #eee !important; padding: 10px !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ADMIN NAV */}
      {isAdminMode && (
        <nav className="fixed top-0 left-0 w-full bg-stone-900 text-white py-4 px-6 z-[200] flex justify-between items-center shadow-2xl no-print border-b border-orange-600/30" aria-label="Console d'administration">
          <div className="flex gap-4 md:gap-6 overflow-x-auto items-center no-scrollbar">
            <span className="text-[10px] font-black bg-orange-600 px-3 py-1 rounded-full uppercase shrink-0">ADMIN</span>
            <button onClick={() => setShowAdminPortal('dashboard')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'dashboard' ? 'text-orange-400 underline underline-offset-8' : 'text-stone-400 hover:text-white'}`}>Tableau de Bord</button>
            <button onClick={() => setShowAdminPortal('orders')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'orders' ? 'text-orange-400 underline underline-offset-8' : 'text-stone-400 hover:text-white'}`}>Commandes</button>
            <button onClick={() => setShowAdminPortal('reservations')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'reservations' ? 'text-orange-400 underline underline-offset-8' : 'text-stone-400 hover:text-white'}`}>Réservations</button>
            <button onClick={() => setShowAdminPortal('accounting')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'accounting' ? 'text-orange-400 underline underline-offset-8' : 'text-stone-400 hover:text-white'}`}>Bilan</button>
            <button onClick={() => setShowAdminPortal('menu_manager')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'menu_manager' ? 'text-orange-400 underline underline-offset-8' : 'text-stone-400 hover:text-white'}`}>Menu</button>
          </div>
          <button onClick={logoutAdmin} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-lg hover:bg-white hover:text-stone-900 transition-colors ml-4 shrink-0">QUITTER</button>
        </nav>
      )}

      {/* PUBLIC VIEW */}
      <div className={`no-print ${isAdminMode ? 'pt-20' : ''}`}>
        <Navbar />
        <main>
          <section id="hero" className="h-[80vh] relative flex items-center justify-center bg-stone-950 overflow-hidden">
            <div className="absolute inset-0 opacity-40">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt={`Ambiance chaleureuse du ${RESTAURANT_NAME}`} />
            </div>
            <div className="relative text-center px-4">
              <Logo className="w-20 h-20 mx-auto mb-6 text-orange-500" />
              <h1 className="text-6xl md:text-8xl font-serif text-white italic mb-4">{RESTAURANT_NAME}</h1>
              <p className="text-stone-300 text-lg md:text-xl font-light tracking-[0.2em] uppercase">Saveurs Ivoiriennes Authentiques • Niamey</p>
              <div className="mt-12">
                <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="px-12 py-5 bg-orange-600 text-white rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-orange-700 transition-all">Découvrir la Carte</button>
              </div>
            </div>
          </section>

          <section id="histoire" className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <h2 className="text-4xl md:text-5xl font-serif font-bold italic mb-8">L'Héritage de Bassam</h2>
              <p className="text-stone-600 text-lg leading-relaxed max-w-3xl mx-auto mb-12">
                Le {RESTAURANT_NAME} vous transporte au cœur de la Côte d'Ivoire. Nous célébrons l'authenticité des recettes ancestrales du littoral ivoirien, mêlant traditions culinaires et hospitalité légendaire au cœur de Niamey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                 <div>
                    <span className="text-4xl mb-4 block" aria-hidden="true">🌶️</span>
                    <h3 className="font-bold uppercase tracking-widest text-xs mb-2">Épices Authentiques</h3>
                    <p className="text-stone-400 text-sm">Directement importées d'Abidjan pour un goût 100% ivoirien.</p>
                 </div>
                 <div>
                    <span className="text-4xl mb-4 block" aria-hidden="true">🐟</span>
                    <h3 className="font-bold uppercase tracking-widest text-xs mb-2">Produits Frais</h3>
                    <p className="text-stone-400 text-sm">Des produits de qualité sélectionnés chaque matin sur le marché.</p>
                 </div>
                 <div>
                    <span className="text-4xl mb-4 block" aria-hidden="true">🤝</span>
                    <h3 className="font-bold uppercase tracking-widest text-xs mb-2">Accueil Chaleureux</h3>
                    <p className="text-stone-400 text-sm">Le "S'en fout la mort" et la joie de vivre à votre table.</p>
                 </div>
              </div>
            </div>
          </section>

          <section id="menu" className="py-24 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
               <h2 className="text-4xl font-serif font-bold italic mb-12">La Carte du Voyageur</h2>
               <div className="flex justify-center gap-6 border-b border-stone-200 pb-4 overflow-x-auto no-scrollbar" role="tablist">
                  {['tous', 'entrée', 'plat', 'dessert', 'boisson'].map(cat => (
                    <button 
                      key={cat} 
                      role="tab"
                      aria-selected={activeCategory === cat}
                      onClick={() => setActiveCategory(cat)} 
                      className={`text-xs font-black uppercase tracking-widest pb-4 transition-all px-4 ${activeCategory === cat ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-12" aria-live="polite">
              {publicMenuItems.map(dish => <MenuCard key={dish.id} dish={dish} />)}
            </div>
          </section>

          <section id="reserve" className="py-24 bg-stone-900 text-white">
            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-5xl font-serif font-bold italic mb-6">Réservez votre Table</h2>
                <p className="text-stone-400 text-lg mb-10">L'excellence de la gastronomie ivoirienne vous attend à Kouara Kano. Réservez pour garantir votre place.</p>
                <div className="space-y-6">
                  <p className="font-bold flex items-center gap-3">
                    <span className="text-orange-600">📍</span> {LOCATION}
                  </p>
                  <p className="font-bold flex items-center gap-3">
                    <span className="text-orange-600">📞</span> {PHONE}
                  </p>
                </div>
              </div>
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl text-stone-900">
                <ReservationForm />
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-stone-950 text-white py-20 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <Logo className="w-10 h-10 text-orange-500" />
                <span className="text-2xl font-serif italic font-bold uppercase tracking-tight">{RESTAURANT_NAME}</span>
              </div>
              <p className="text-stone-500 text-sm max-w-xs">
                Le meilleur restaurant ivoirien de Niamey. Retrouvez vos plats préférés : Garba, Foutou, Placali, et bien d'autres dans un cadre raffiné.
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-6">Carte Digitale</h3>
              <QRCodeImage size={100} className="mb-4" />
              <p className="text-[9px] text-stone-500 uppercase font-black">Scannez pour la carte mobile</p>
            </div>
            <div className="flex flex-col md:items-end">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-6">Administration</h3>
              <button onClick={() => setShowLoginModal(true)} className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 mb-8 transition-colors">Admin Console</button>
              <p className="text-[10px] text-stone-700 uppercase tracking-widest">© {new Date().getFullYear()} {RESTAURANT_NAME}</p>
            </div>
          </div>
        </footer>
      </div>

      <AIChat />

      {/* ADMIN PORTAL */}
      {isAdminMode && showAdminPortal !== 'none' && (
        <div className="fixed inset-0 bg-stone-50 z-[300] flex flex-col no-print overflow-hidden">
          <div className="p-4 md:p-8 border-b flex justify-between items-center bg-white shadow-sm">
            <h2 className="text-xl md:text-2xl font-serif font-bold italic uppercase flex items-center gap-3 text-stone-900">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              {showAdminPortal === 'dashboard' ? 'Tableau de Bord Stratégique' :
               showAdminPortal === 'orders' ? 'Suivi des Commandes' : 
               showAdminPortal === 'reservations' ? 'Cahier de Réservations' : 
               showAdminPortal === 'accounting' ? 'Analyses Financières' : 'Gestion du Menu'}
            </h2>
            <div className="flex items-center gap-4">
              <button onClick={refreshAdminData} className="p-2 hover:bg-stone-100 rounded-full transition-colors" title="Actualiser les données">↻</button>
              <button onClick={() => setShowAdminPortal('none')} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border rounded-full hover:bg-stone-200 transition-colors">✕</button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar bg-stone-50">
            {showAdminPortal === 'dashboard' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Recettes du Jour</p>
                       <p className="text-3xl font-serif font-bold italic text-stone-900">{stats.todayRevenue.toLocaleString()} F</p>
                       <div className="mt-2 text-[10px] text-green-500 font-bold">● En direct</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Commandes Aujourd'hui</p>
                       <p className="text-3xl font-serif font-bold italic text-stone-900">{stats.todayOrdersCount}</p>
                       <div className="mt-2 text-[10px] text-stone-400 font-bold uppercase tracking-tighter">Depuis 00h00</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Réservations Totales</p>
                       <p className="text-3xl font-serif font-bold italic text-orange-600">{reservations.length}</p>
                       <div className="mt-2 text-[10px] text-orange-400 font-bold uppercase tracking-tighter">En attente / Confirmé</div>
                    </div>
                    <div className="bg-stone-900 p-6 rounded-[2rem] shadow-xl text-white">
                       <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Total Encaissé (Mois)</p>
                       <p className="text-2xl font-serif font-bold italic">{stats.paid.toLocaleString()} F</p>
                       <button onClick={() => setShowAdminPortal('accounting')} className="mt-2 text-[9px] font-black text-orange-400 uppercase hover:text-white transition">Voir Bilan Détail →</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl">
                       <h3 className="text-lg font-bold text-stone-800 mb-8 flex items-center gap-2">
                          <span className="w-2 h-6 bg-orange-600 rounded-full"></span>
                          Plats les Plus Vendus
                       </h3>
                       <div className="space-y-6">
                          {stats.topDishes.length === 0 ? (
                            <p className="text-stone-400 italic text-sm">Aucune donnée disponible.</p>
                          ) : (
                            stats.topDishes.map((dish, idx) => (
                              <div key={idx}>
                                 <div className="flex justify-between text-xs font-bold uppercase mb-2">
                                    <span className="text-stone-500">{dish.name}</span>
                                    <span className="text-stone-900">{dish.qty} ventes</span>
                                 </div>
                                 <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-orange-600 h-full rounded-full transition-all duration-1000" 
                                      style={{ width: `${(dish.qty / (stats.topDishes[0]?.qty || 1)) * 100}%` }}
                                    ></div>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                       <button onClick={() => setShowAdminPortal('menu_manager')} className="w-full mt-10 py-4 border-2 border-dashed border-stone-100 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-orange-200 hover:text-orange-600 transition">Gérer le Menu</button>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col">
                       <div className="px-8 py-6 border-b bg-stone-50 flex justify-between items-center">
                          <h3 className="font-bold text-stone-800 uppercase text-xs tracking-widest">Journal des Flux Récent</h3>
                          <button onClick={() => setShowMasterReport(true)} className="text-[9px] font-black bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">Exporter Rapport</button>
                       </div>
                       <div className="flex-grow overflow-y-auto max-h-[500px] divide-y divide-stone-50 custom-scrollbar">
                          {allActivities.length === 0 ? (
                            <div className="p-20 text-center text-stone-400 italic">Aucune activité enregistrée.</div>
                          ) : (
                            allActivities.map((act: any) => (
                              <div key={act.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                 <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${act.type === 'order' ? 'bg-orange-50 text-orange-600' : 'bg-stone-900 text-white'}`}>
                                       {act.type === 'order' ? '🍲' : '🗓️'}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-3">
                                          <span className="font-bold text-stone-900">{act.type === 'order' ? act.dishName : `Table : ${act.name}`}</span>
                                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${act.type === 'order' ? 'bg-orange-100 text-orange-700' : 'bg-stone-200 text-stone-700'}`}>
                                             {act.type === 'order' ? 'Vente' : 'Réservation'}
                                          </span>
                                       </div>
                                       <div className="flex items-center gap-2 mt-1">
                                         <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                                            {new Date(act.timestamp).toLocaleString('fr-FR')}
                                         </p>
                                         <span className="text-[9px] text-stone-300">•</span>
                                         <span className={`text-[9px] font-bold uppercase ${act.status === 'Payé' || act.status === 'Confirmé' ? 'text-green-500' : 'text-orange-500'}`}>{act.status}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex gap-4 items-center">
                                    {act.type === 'order' && <span className="text-sm font-serif font-bold text-stone-900">{(act.price * act.quantity).toLocaleString()} F</span>}
                                    <button onClick={() => setShowAdminPortal(act.type === 'order' ? 'orders' : 'reservations')} className="text-[10px] font-black text-stone-300 hover:text-stone-900 uppercase transition">Détails</button>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {showAdminPortal === 'orders' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                {orders.length === 0 ? <p className="text-center py-20 italic">Aucune commande.</p> : orders.map(order => (
                  <div key={order.id} className="p-6 bg-white border border-stone-100 rounded-3xl shadow-sm flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-stone-800">{order.dishName} x{order.quantity}</h3>
                      <p className="text-sm text-stone-500">{order.customerName} • {order.customerPhone}</p>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full inline-block mt-2 ${order.status === 'Payé' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setSelectedInvoice(order)} className="px-4 py-2 bg-stone-100 rounded-xl text-[10px] font-black uppercase">Facture</button>
                       {order.status === 'Nouveau' && <button onClick={() => updateOrderStatus(order.id, 'Payé')} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase">Encaisser</button>}
                       <button onClick={() => deleteOrder(order.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAdminPortal === 'reservations' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                {reservations.length === 0 ? <p className="text-center py-20 italic">Aucune réservation.</p> : reservations.map(res => (
                  <div key={res.id} className="p-6 bg-white border border-stone-100 rounded-3xl shadow-sm flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-stone-800">{res.name} — {res.guests}</h3>
                      <p className="text-sm text-orange-600 font-bold">{new Date(res.date).toLocaleDateString()} • {res.phone}</p>
                      <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest font-black">{res.status}</p>
                    </div>
                    <div className="flex gap-2">
                       {res.status === 'En attente' && <button onClick={() => updateReservationStatus(res.id, 'Confirmé')} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase">Confirmer</button>}
                       {res.status === 'Confirmé' && <button onClick={() => updateReservationStatus(res.id, 'Terminé')} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase">Terminer</button>}
                       <button onClick={() => deleteReservation(res.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAdminPortal === 'accounting' && (
              <div className="max-w-5xl mx-auto space-y-10">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100 space-y-8">
                   <div className="flex flex-wrap gap-4 items-end border-b pb-8">
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Début</label>
                        <input type="date" value={reportRange.start} onChange={e => setReportRange({...reportRange, start: e.target.value})} className="w-full p-3 bg-stone-50 border rounded-xl" />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Fin</label>
                        <input type="date" value={reportRange.end} onChange={e => setReportRange({...reportRange, end: e.target.value})} className="w-full p-3 bg-stone-50 border rounded-xl" />
                      </div>
                      <button onClick={handlePrint} className="px-8 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-orange-700 transition">Imprimer PDF</button>
                   </div>
                   
                   <div id="print-section">
                      <div className="hidden print:block text-center border-b pb-10 mb-10">
                         <Logo className="w-16 h-16 mx-auto mb-4" />
                         <h1 className="text-3xl font-serif font-bold">{RESTAURANT_NAME}</h1>
                         <p className="text-xs uppercase tracking-[0.4em] text-stone-400 mt-2">Bilan Financier Officiel</p>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mb-12">
                         <div className="p-8 border rounded-[2rem] text-center">
                            <p className="text-[9px] font-black uppercase text-stone-400 mb-2">Chiffre d'Affaire Total</p>
                            <p className="text-3xl font-serif font-bold">{stats.total.toLocaleString()} F</p>
                         </div>
                         <div className="p-8 border rounded-[2rem] text-center bg-green-50/50">
                            <p className="text-[9px] font-black uppercase text-green-500 mb-2">Total Payé</p>
                            <p className="text-3xl font-serif font-bold text-green-700">{stats.paid.toLocaleString()} F</p>
                         </div>
                         <div className="p-8 border rounded-[2rem] text-center bg-orange-50/50">
                            <p className="text-[9px] font-black uppercase text-orange-500 mb-2">Impayés</p>
                            <p className="text-3xl font-serif font-bold text-orange-700">{stats.pending.toLocaleString()} F</p>
                         </div>
                      </div>

                      <table className="w-full text-xs">
                        <thead className="bg-stone-50">
                           <tr className="border-b">
                              <th className="p-4 text-left font-black uppercase tracking-widest text-[9px]">Date</th>
                              <th className="p-4 text-left font-black uppercase tracking-widest text-[9px]">Client</th>
                              <th className="p-4 text-left font-black uppercase tracking-widest text-[9px]">Détails</th>
                              <th className="p-4 text-right font-black uppercase tracking-widest text-[9px]">Montant</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredOrdersForReport.map(o => (
                              <tr key={o.id} className="border-b hover:bg-stone-50 transition-colors">
                                 <td className="p-4 text-stone-400">{new Date(o.timestamp).toLocaleDateString()}</td>
                                 <td className="p-4 font-bold">{o.customerName}</td>
                                 <td className="p-4">{o.dishName} (x{o.quantity})</td>
                                 <td className="p-4 text-right font-serif font-bold">{(o.price * o.quantity).toLocaleString()} F</td>
                              </tr>
                           ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}

            {showAdminPortal === 'menu_manager' && (
              <div className="max-w-5xl mx-auto space-y-6 pb-20">
                <div className="bg-white p-6 rounded-[2rem] border border-stone-100 mb-10 flex justify-between items-center shadow-sm">
                   <p className="text-stone-400 text-[11px] font-black uppercase tracking-widest">Contrôle de l'Inventaire ({menuItems.length} plats)</p>
                   <button onClick={() => setShowAddDishModal(true)} className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-orange-600 transition shadow-xl">Ajouter un nouveau plat</button>
                </div>
                {menuItems.map(dish => (
                  <div key={dish.id} className="p-6 bg-white border border-stone-100 rounded-[2rem] flex flex-col md:flex-row gap-8 shadow-sm group hover:shadow-xl transition-all duration-500">
                    <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
                      <img src={dish.image} className="w-full h-full object-cover" alt={`Photo de ${dish.name}`} />
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                        <div>
                           <div className="flex justify-between items-start mb-2">
                              <div>
                                 <h3 className="text-2xl font-bold text-stone-800">{dish.name}</h3>
                                 <span className="inline-block px-3 py-1 bg-stone-50 text-stone-400 rounded-full text-[8px] font-black uppercase tracking-[0.2em] mt-2 border">{dish.category}</span>
                              </div>
                              <div className="text-2xl font-serif font-bold text-stone-900">{dish.price.toLocaleString()} F</div>
                           </div>
                           <p className="text-stone-400 text-sm italic leading-relaxed line-clamp-2">"{dish.description}"</p>
                        </div>
                        <div className="flex gap-4 mt-6">
                           <button onClick={() => setEditingDish(dish)} className="px-8 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition shadow-lg flex-1 md:flex-none">Modifier</button>
                           <button onClick={() => deleteDish(dish.id)} className="px-8 py-2.5 border border-red-100 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition flex-1 md:flex-none">Supprimer</button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MASTER REPORT MODAL */}
      {showMasterReport && (
        <div className="fixed inset-0 bg-stone-950/95 z-[450] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h2 className="text-2xl font-serif font-bold italic mb-6">Prévisualisation du Rapport Global</h2>
            <div id="print-section" className="bg-white text-stone-900 p-8">
              <div className="print-page-break-after">
                <div className="text-center border-b border-stone-200 pb-10 mb-10">
                  <Logo className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                  <h1 className="text-3xl font-serif font-bold">{RESTAURANT_NAME}</h1>
                  <h2 className="text-lg font-black uppercase tracking-[0.2em] text-stone-400 mt-2">RAPPORT GLOBAL D'ACTIVITÉ</h2>
                  <p className="text-xs font-bold text-stone-600 mt-2">Généré le {new Date().toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-10">
                   <div className="p-6 border rounded-2xl text-center">
                     <p className="text-[9px] font-black uppercase mb-1">Total Ventes</p>
                     <p className="text-xl font-bold">{stats.total.toLocaleString()} F</p>
                   </div>
                   <div className="p-6 border rounded-2xl text-center">
                     <p className="text-[9px] font-black uppercase mb-1">Encaissements</p>
                     <p className="text-xl font-bold">{stats.paid.toLocaleString()} F</p>
                   </div>
                   <div className="p-6 border rounded-2xl text-center">
                     <p className="text-[9px] font-black uppercase mb-1">Commandes</p>
                     <p className="text-xl font-bold">{orders.length}</p>
                   </div>
                </div>
                <h3 className="text-sm font-black uppercase border-l-4 border-orange-600 pl-4 mb-6">Détail des Flux</h3>
                <table className="w-full text-[10px]">
                   <thead className="bg-stone-50">
                      <tr>
                         <th className="p-3 text-left">Type</th>
                         <th className="p-3 text-left">Détails</th>
                         <th className="p-3 text-left">Date</th>
                         <th className="p-3 text-right">Statut</th>
                      </tr>
                   </thead>
                   <tbody>
                      {allActivities.map(act => (
                        <tr key={act.id} className="border-b">
                           <td className="p-3 font-bold uppercase">{act.type === 'order' ? 'Vente' : 'Réserve'}</td>
                           <td className="p-3">{act.type === 'order' ? `${act.dishName} (${act.customerName})` : `${act.name} (${act.guests})`}</td>
                           <td className="p-3">{new Date(act.timestamp).toLocaleString()}</td>
                           <td className="p-3 text-right font-black uppercase">{act.status}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={handlePrint} className="flex-1 bg-stone-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition shadow-xl">Imprimer Rapport</button>
              <button onClick={() => setShowMasterReport(false)} className="flex-1 bg-stone-50 text-stone-400 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-100 transition">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS: Login, Add/Edit Dish, etc. */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-stone-950/98 z-[500] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[3rem] p-10 max-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-600"></div>
            <h2 className="text-2xl font-bold font-serif italic text-center mb-8 text-stone-900">Console Gérant</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="Identifiant" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-orange-200" required />
              <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-orange-200" required />
              {loginError && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest">{loginError}</p>}
              <button type="submit" className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl shadow-stone-900/10">Accéder</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-stone-400 text-[9px] font-black uppercase mt-4 tracking-widest">Fermer</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT DISH FORM MODAL */}
      {(showAddDishModal || editingDish) && (
        <div className="fixed inset-0 bg-stone-950/90 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar animate-in zoom-in duration-300">
            <h2 className="text-2xl font-serif font-bold italic mb-8">{editingDish ? "Modifier le Plat" : "Nouveau Plat"}</h2>
            <form onSubmit={saveDish} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <input required type="text" value={editingDish ? editingDish.name : newDish.name} onChange={e => editingDish ? setEditingDish({...editingDish, name: e.target.value}) : setNewDish({...newDish, name: e.target.value})} className="p-4 bg-stone-50 border rounded-2xl font-bold" placeholder="Nom du Plat" />
                  <input required type="number" value={editingDish ? editingDish.price : newDish.price} onChange={e => editingDish ? setEditingDish({...editingDish, price: parseInt(e.target.value)}) : setNewDish({...newDish, price: parseInt(e.target.value)})} className="p-4 bg-stone-50 border rounded-2xl" placeholder="Prix (F)" />
               </div>
               <select className="w-full p-4 bg-stone-50 border rounded-2xl font-bold" value={editingDish ? editingDish.category : newDish.category} onChange={e => editingDish ? setEditingDish({...editingDish, category: e.target.value as any}) : setNewDish({...newDish, category: e.target.value as any})}>
                  <option value="entrée">Entrée</option>
                  <option value="plat">Plat de Résistance</option>
                  <option value="dessert">Dessert</option>
                  <option value="boisson">Boisson</option>
               </select>
               <textarea rows={3} required value={editingDish ? editingDish.description : newDish.description} onChange={e => editingDish ? setEditingDish({...editingDish, description: e.target.value}) : setNewDish({...newDish, description: e.target.value})} className="w-full p-4 bg-stone-50 border rounded-2xl text-sm" placeholder="Description du plat..." />
               <div className="p-4 bg-stone-50 rounded-2xl border border-dashed flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shadow-inner flex items-center justify-center text-stone-300 text-2xl font-bold">
                     {(editingDish?.image || newDish.image) ? <img src={editingDish ? editingDish.image : newDish.image} className="w-full h-full object-cover" alt="Prévisualisation" /> : '+'}
                  </div>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, !!editingDish)} className="text-[9px] font-black uppercase text-stone-400" />
               </div>
               <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Enregistrer</button>
                  <button type="button" onClick={() => { setShowAddDishModal(false); setEditingDish(null); }} className="flex-1 py-4 bg-stone-100 text-stone-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Annuler</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* INDIVIDUAL INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-stone-950/95 z-[400] flex items-center justify-center p-4 no-print" role="dialog" aria-modal="true">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl relative">
            <div id="print-section" className="text-stone-900 p-4">
              <div className="text-center border-b pb-6 mb-6">
                <Logo className="w-12 h-12 mx-auto mb-2 text-orange-600" />
                <h1 className="text-xl font-serif font-bold uppercase tracking-tight">{RESTAURANT_NAME}</h1>
                <p className="text-[8px] font-black uppercase text-stone-400 mt-1">{LOCATION}</p>
                <p className="text-[10px] font-bold text-stone-800 mt-1">{PHONE}</p>
              </div>
              <div className="mb-6 space-y-1">
                 <div className="flex justify-between text-[10px]"><span className="text-stone-400 uppercase">Facture N°</span><span className="font-bold">{selectedInvoice.id.slice(-6).toUpperCase()}</span></div>
                 <div className="flex justify-between text-[10px]"><span className="text-stone-400 uppercase">Client</span><span className="font-bold">{selectedInvoice.customerName}</span></div>
                 <div className="flex justify-between text-[10px]"><span className="text-stone-400 uppercase">Date</span><span className="font-bold">{new Date(selectedInvoice.timestamp).toLocaleDateString()}</span></div>
              </div>
              <div className="border-y py-4 mb-4 flex justify-between font-bold text-sm">
                 <span>{selectedInvoice.dishName} x{selectedInvoice.quantity}</span>
                 <span className="font-serif italic text-orange-600">{(selectedInvoice.price * selectedInvoice.quantity).toLocaleString()} F</span>
              </div>
              <div className="text-right mb-6">
                <p className="text-[9px] font-black uppercase text-stone-300 tracking-[0.2em] mb-1">Total Net à payer</p>
                <p className="text-2xl font-serif font-bold">{(selectedInvoice.price * selectedInvoice.quantity).toLocaleString()} <span className="text-xs font-sans text-stone-400 uppercase">F</span></p>
              </div>
              <div className="text-center">
                 <QRCodeImage size={50} className="opacity-20 mb-4" />
                 <p className="text-[8px] font-black uppercase text-stone-300 tracking-widest">Merci et bon appétit !</p>
              </div>
            </div>
            <div className="mt-8 flex gap-4 no-print">
              <button onClick={handlePrint} className="flex-1 bg-stone-900 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-orange-600 transition-colors">Imprimer</button>
              <button onClick={() => setSelectedInvoice(null)} className="flex-1 bg-stone-100 text-stone-400 py-4 rounded-xl font-black text-[10px] uppercase">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
