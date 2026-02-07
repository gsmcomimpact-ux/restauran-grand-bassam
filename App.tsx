
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import MenuCard from './components/MenuCard';
import ReservationForm from './components/ReservationForm';
import { MENU_ITEMS as INITIAL_MENU, PHONE, LOCATION, RESTAURANT_NAME, SITE_URL } from './constants';
import { Dish, OrderHistoryItem, Reservation } from './types';
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
// @ts-ignore
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

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
  
  // Accounting Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

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
      setLoginError('Identifiants incorrects (admin / bassam227)');
    }
  };

  const logoutAdmin = () => {
    setIsAdminMode(false);
    setShowAdminPortal('none');
    sessionStorage.removeItem('is_admin');
  };

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
    if (!currentImg) return alert("Télécharge d'abord une photo !");
    
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
              { text: "Identifie ce plat ivoirien. Retourne un JSON : 'name', 'description', 'category', 'price'." }
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
      alert("L'IA n'est pas disponible pour le moment.");
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
    if (confirm("Retirer ce plat de la carte ?")) {
      const updated = menuItems.filter(m => m.id !== id);
      setMenuItems(updated);
      localStorage.setItem('grand_bassam_menu', JSON.stringify(updated));
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  // Stats Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = o.timestamp.split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.timestamp.startsWith(today));
    const todayRevenue = todayOrders.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    
    // Using filtered orders for accounting specific stats
    const periodRevenue = filteredOrders.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const totalRevenue = orders.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const unpaidRevenue = filteredOrders.filter(o => o.status === 'Nouveau').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    
    const dishSales: Record<string, number> = {};
    filteredOrders.forEach(o => {
      dishSales[o.dishName] = (dishSales[o.dishName] || 0) + o.quantity;
    });
    const topDishes = Object.entries(dishSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    return { totalRevenue, todayRevenue, periodRevenue, unpaidRevenue, todayOrdersCount: todayOrders.length, topDishes };
  }, [orders, filteredOrders]);

  const allActivities = useMemo(() => {
    const activityOrders = orders.map(o => ({ ...o, type: 'order' as const }));
    const activityReservations = reservations.map(r => ({ ...r, type: 'reservation' as const }));
    return [...activityOrders, ...activityReservations].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [orders, reservations]);

  const publicMenuItems = activeCategory === 'tous' ? menuItems : menuItems.filter(item => item.category === activeCategory);

  // PDF Generation Functions
  const generateInvoicePDF = (order: OrderHistoryItem) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150] // Receipt format
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(RESTAURANT_NAME, 40, 15, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(LOCATION, 40, 20, { align: 'center' });
    doc.text(PHONE, 40, 24, { align: 'center' });
    
    doc.setLineWidth(0.1);
    doc.line(10, 28, 70, 28);
    
    doc.setFont("helvetica", "bold");
    doc.text(`FACTURE N° #GB${order.id.slice(-6)}`, 10, 35);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(order.timestamp).toLocaleDateString()}`, 10, 40);
    doc.text(`Client: ${order.customerName}`, 10, 45);
    doc.text(`Tél: ${order.customerPhone}`, 10, 50);
    
    doc.line(10, 55, 70, 55);
    
    doc.setFont("helvetica", "bold");
    doc.text("Désignation", 10, 62);
    doc.text("Total", 70, 62, { align: 'right' });
    
    doc.setFont("helvetica", "normal");
    doc.text(`${order.dishName} (x${order.quantity})`, 10, 70);
    doc.text(`${(order.price * order.quantity).toLocaleString()} F`, 70, 70, { align: 'right' });
    
    doc.line(10, 75, 70, 75);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("NET A PAYER", 10, 85);
    doc.text(`${(order.price * order.quantity).toLocaleString()} FCFA`, 70, 85, { align: 'right' });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Merci de votre confiance. Bon appétit !", 40, 100, { align: 'center' });
    
    doc.save(`facture_${order.customerName.replace(/\s+/g, '_')}_${order.id.slice(-4)}.pdf`);
  };

  const generateReportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("BILAN FINANCIER", 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.text(RESTAURANT_NAME, 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Période du : ${new Date(dateRange.start).toLocaleDateString()} au ${new Date(dateRange.end).toLocaleDateString()}`, 105, 36, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);
    
    // Summary Data
    doc.setFont("helvetica", "bold");
    doc.text("RÉSUMÉ DE LA PÉRIODE", 20, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Chiffre d'Affaire Encaissé : ${stats.periodRevenue.toLocaleString()} FCFA`, 20, 65);
    doc.text(`Ventes en attente : ${stats.unpaidRevenue.toLocaleString()} FCFA`, 20, 72);
    doc.text(`Nombre de commandes : ${filteredOrders.length}`, 20, 79);
    doc.text(`Panier Moyen : ${filteredOrders.length > 0 ? Math.round(stats.periodRevenue / filteredOrders.length).toLocaleString() : 0} FCFA`, 20, 86);
    
    // Top Dishes Table
    doc.setFont("helvetica", "bold");
    doc.text("TOP 5 DES PLATS", 20, 100);
    
    const dishRows = stats.topDishes.map((d, i) => [i + 1, d.name, d.qty]);
    autoTable(doc, {
      startY: 105,
      head: [['#', 'Nom du Plat', 'Quantité Vendue']],
      body: dishRows,
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] }
    });
    
    // Transactions Table
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DES ENCAISSEMENTS", 20, finalY);
    
    const transactionRows = filteredOrders
      .filter(o => o.status === 'Payé')
      .map(o => [
        new Date(o.timestamp).toLocaleDateString(),
        o.customerName,
        o.dishName,
        o.quantity,
        `${(o.price * o.quantity).toLocaleString()} F`
      ]);
      
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date', 'Client', 'Plat', 'Qté', 'Montant']],
      body: transactionRows,
      theme: 'grid',
      headStyles: { fillColor: [31, 41, 55] }
    });
    
    doc.save(`bilan_${dateRange.start}_au_${dateRange.end}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-stone-50">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-section, #print-section * { visibility: visible !important; }
          #print-section { position: fixed; left: 0; top: 0; width: 100%; display: block !important; padding: 40px; }
          .no-print { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

      {/* ADMIN NAV BAR */}
      {isAdminMode && (
        <nav className="fixed top-0 left-0 w-full bg-stone-900 text-white py-3 px-6 z-[200] flex justify-between items-center shadow-2xl no-print border-b border-orange-600/50" aria-label="Administration">
          <div className="flex gap-6 overflow-x-auto items-center no-scrollbar">
            <span className="text-[10px] font-black bg-orange-600 px-3 py-1 rounded-full uppercase">ADMIN</span>
            <button onClick={() => setShowAdminPortal('dashboard')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'dashboard' ? 'text-orange-400' : 'text-stone-400'}`}>Dashboard</button>
            <button onClick={() => setShowAdminPortal('orders')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'orders' ? 'text-orange-400' : 'text-stone-400'}`}>Commandes</button>
            <button onClick={() => setShowAdminPortal('reservations')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'reservations' ? 'text-orange-400' : 'text-stone-400'}`}>Réservations</button>
            <button onClick={() => setShowAdminPortal('accounting')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'accounting' ? 'text-orange-400' : 'text-stone-400'}`}>Comptabilité</button>
            <button onClick={() => setShowAdminPortal('menu_manager')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'menu_manager' ? 'text-orange-400' : 'text-stone-400'}`}>Menu</button>
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
              <p className="text-orange-400 text-lg md:text-2xl font-light tracking-[0.4em] uppercase mb-12">L'Authenticité Ivoirienne à Niamey</p>
              <button onClick={() => scrollToSection('menu')} className="px-14 py-5 bg-orange-600 text-white rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-orange-700 transition-all">Voir la Carte</button>
            </div>
          </section>

          {/* Menu Section */}
          <section id="menu" className="py-24 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {publicMenuItems.map(dish => <MenuCard key={dish.id} dish={dish} />)}
            </div>
          </section>

          {/* Reservation Section */}
          <section id="reserve" className="py-24 bg-stone-900 text-white">
            <div className="max-w-4xl mx-auto px-4 bg-white p-10 md:p-16 rounded-[4rem] text-stone-900 shadow-3xl">
              <ReservationForm />
            </div>
          </section>
        </main>

        {/* Footer Section */}
        <footer className="bg-stone-950 text-white pt-24 pb-12 px-8 border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                <Logo className="w-12 h-12 text-orange-500" />
                <span className="text-2xl font-serif italic font-bold uppercase tracking-tight leading-none">{RESTAURANT_NAME}</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-xs italic">
                "Une escale gourmande où chaque plat raconte une histoire de la Côte d'Ivoire. L'excellence culinaire au cœur de Niamey."
              </p>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Navigation</h3>
              <ul className="space-y-4">
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Accueil</button></li>
                <li><button onClick={() => scrollToSection('menu')} className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">La Carte</button></li>
                <li><button onClick={() => scrollToSection('reserve')} className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Réservations</button></li>
                <li><button onClick={() => setShowLoginModal(true)} className="text-stone-600 hover:text-orange-500 text-[10px] font-black uppercase tracking-widest transition-colors">Espace Gérant</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Contact</h3>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <span className="text-orange-500">📍</span>
                  <div className="text-xs">
                    <p className="font-bold text-white mb-1 uppercase tracking-widest">Localisation</p>
                    <p className="text-stone-400 leading-relaxed">{LOCATION}</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="text-orange-500">📞</span>
                  <div className="text-xs">
                    <p className="font-bold text-white mb-1 uppercase tracking-widest">Téléphone</p>
                    <p className="text-stone-400">{PHONE}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8 md:text-right">Carte Digitale</h3>
              <QRCodeImage size={100} className="mb-6 border-4 border-white/5" />
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.3em]">
              © {new Date().getFullYear()} {RESTAURANT_NAME} • TOUS DROITS RÉSERVÉS
            </p>
          </div>
        </footer>
      </div>

      {/* ADMIN PORTAL */}
      {isAdminMode && showAdminPortal !== 'none' && (
        <div className="fixed inset-0 bg-stone-50 z-[300] flex flex-col no-print overflow-hidden">
          <header className="p-6 border-b flex justify-between items-center bg-white shadow-sm">
            <h2 className="text-2xl font-serif font-bold italic uppercase flex items-center gap-3">
              <span className="w-2 h-6 bg-orange-600 rounded-full"></span>
              {showAdminPortal === 'dashboard' ? 'Tableau de Bord' :
               showAdminPortal === 'orders' ? 'Suivi des Commandes' :
               showAdminPortal === 'reservations' ? 'Cahier de Réservations' :
               showAdminPortal === 'accounting' ? 'Bilan Financier' : 'Gestion de la Carte'}
            </h2>
            <button onClick={() => setShowAdminPortal('none')} className="w-12 h-12 flex items-center justify-center border rounded-2xl hover:bg-stone-100 transition-colors">✕</button>
          </header>
          
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar bg-stone-50/50">
            {showAdminPortal === 'dashboard' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Chiffre d'Affaire Jour</p>
                       <p className="text-4xl font-serif font-bold italic text-stone-900">{stats.todayRevenue.toLocaleString()} F</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Réservations Aujourd'hui</p>
                       <p className="text-4xl font-serif font-bold italic text-orange-600">{reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length}</p>
                    </div>
                    <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                       <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Total Mois</p>
                       <p className="text-4xl font-serif font-bold italic text-orange-500">{stats.totalRevenue.toLocaleString()} F</p>
                    </div>
                 </div>

                 <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden">
                    <div className="px-8 py-6 border-b bg-stone-50 flex justify-between items-center">
                       <h3 className="font-bold text-stone-800 uppercase text-xs tracking-widest">Activités Récentes</h3>
                    </div>
                    <div className="divide-y divide-stone-50 overflow-y-auto max-h-[400px]">
                       {allActivities.length === 0 ? <p className="p-10 text-center text-stone-400">Aucune donnée.</p> : allActivities.slice(0, 8).map((act: any) => (
                         <div key={act.id} className="p-6 flex items-center justify-between hover:bg-stone-50">
                           <div className="flex items-center gap-4">
                             <span className="text-xl">{act.type === 'order' ? '🥘' : '🗓️'}</span>
                             <div>
                               <p className="font-bold text-sm">{act.type === 'order' ? act.dishName : act.name}</p>
                               <p className="text-[10px] text-stone-400 uppercase font-black">{new Date(act.timestamp).toLocaleString()}</p>
                             </div>
                           </div>
                           <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${act.status === 'Payé' || act.status === 'Confirmé' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{act.status}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {showAdminPortal === 'orders' && (
              <div className="max-w-5xl mx-auto space-y-6">
                {orders.length === 0 ? <p className="text-center py-20 italic">Aucune commande enregistrée.</p> : orders.map(order => (
                  <div key={order.id} className="p-8 bg-white border border-stone-100 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{order.dishName} x{order.quantity}</h3>
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${order.status === 'Payé' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}`}>{order.status}</span>
                      </div>
                      <p className="text-sm font-bold text-stone-800">{order.customerName} • {order.customerPhone}</p>
                      <p className="text-[10px] text-stone-400 uppercase font-black mt-1">
                        {order.isDelivery ? `🚀 Livraison : ${order.address}` : `🍽️ Sur Place : Table ${order.tableNumber || 'N/A'}`}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={() => generateInvoicePDF(order)} className="px-6 py-3 bg-stone-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-stone-200 transition-colors">
                        <span>📄 PDF</span>
                      </button>
                      {order.status === 'Nouveau' && (
                        <button onClick={() => updateOrderStatus(order.id, 'Payé')} className="px-6 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Encaisser</button>
                      )}
                      <button onClick={() => deleteOrder(order.id)} className="w-12 h-12 flex items-center justify-center border border-red-50 text-red-300 rounded-xl hover:bg-red-50 hover:text-red-600 transition">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAdminPortal === 'reservations' && (
              <div className="max-w-5xl mx-auto space-y-6">
                {reservations.length === 0 ? <p className="text-center py-20 italic">Aucune réservation.</p> : reservations.map(res => (
                  <div key={res.id} className="p-8 bg-white border border-stone-100 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{res.name} — {res.guests}</h3>
                        <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${res.status === 'Confirmé' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}`}>{res.status}</span>
                      </div>
                      <p className="text-sm font-bold text-orange-600">{new Date(res.date).toLocaleDateString()} • {res.phone}</p>
                      {res.message && <p className="text-xs text-stone-400 italic mt-2">"{res.message}"</p>}
                    </div>
                    <div className="flex gap-3 shrink-0">
                      {res.status === 'En attente' && (
                        <button onClick={() => updateReservationStatus(res.id, 'Confirmé')} className="px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Confirmer</button>
                      )}
                      {res.status === 'Confirmé' && (
                        <button onClick={() => updateReservationStatus(res.id, 'Terminé')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Terminer</button>
                      )}
                      <button onClick={() => deleteReservation(res.id)} className="w-12 h-12 flex items-center justify-center border border-red-50 text-red-300 rounded-xl hover:bg-red-50 hover:text-red-600 transition">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAdminPortal === 'accounting' && (
              <div className="max-w-6xl mx-auto space-y-10">
                {/* Date Picker Section */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                      <div className="space-y-1 w-full md:w-auto">
                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Début de Période</label>
                         <input 
                           type="date" 
                           value={dateRange.start}
                           onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                           className="w-full md:w-auto p-3 bg-stone-50 border rounded-xl outline-none font-bold text-xs"
                         />
                      </div>
                      <div className="space-y-1 w-full md:w-auto">
                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Fin de Période</label>
                         <input 
                           type="date" 
                           value={dateRange.end}
                           onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                           className="w-full md:w-auto p-3 bg-stone-50 border rounded-xl outline-none font-bold text-xs"
                         />
                      </div>
                   </div>
                   <button 
                     onClick={generateReportPDF}
                     className="w-full md:w-auto px-10 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
                   >
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/></svg>
                     Exporter Bilan PDF
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Total Encaissé (Période)</p>
                    <p className="text-3xl font-serif font-bold text-green-600">{stats.periodRevenue.toLocaleString()} F</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">En attente (Période)</p>
                    <p className="text-3xl font-serif font-bold text-orange-600">{stats.unpaidRevenue.toLocaleString()} F</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Panier Moyen</p>
                    <p className="text-3xl font-serif font-bold text-stone-900">
                      {filteredOrders.length > 0 ? Math.round(stats.periodRevenue / filteredOrders.length).toLocaleString() : 0} F
                    </p>
                  </div>
                  <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-xl text-center">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Commandes Totales</p>
                    <p className="text-3xl font-serif font-bold text-white">{filteredOrders.length}</p>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl overflow-x-auto">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-10 border-b pb-6">Journal des Encaissements de la période</h3>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-stone-400 border-b">
                        <th className="pb-4 pr-4">Date</th>
                        <th className="pb-4 pr-4">Client</th>
                        <th className="pb-4 pr-4">Plat</th>
                        <th className="pb-4 pr-4">Qté</th>
                        <th className="pb-4 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredOrders.filter(o => o.status === 'Payé').length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-stone-400 italic">Aucun encaissement sur cette période.</td></tr>
                      ) : (
                        filteredOrders.filter(o => o.status === 'Payé').map(o => (
                          <tr key={o.id} className="border-b last:border-0 hover:bg-stone-50 transition-colors">
                            <td className="py-4 pr-4 text-stone-400 whitespace-nowrap">{new Date(o.timestamp).toLocaleDateString()}</td>
                            <td className="py-4 pr-4 font-bold">{o.customerName}</td>
                            <td className="py-4 pr-4">{o.dishName}</td>
                            <td className="py-4 pr-4 text-center">{o.quantity}</td>
                            <td className="py-4 text-right font-serif font-bold whitespace-nowrap">{ (o.price * o.quantity).toLocaleString() } F</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {showAdminPortal === 'menu_manager' && (
              <div className="max-w-5xl mx-auto space-y-8 pb-32">
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 mb-12 flex justify-between items-center shadow-sm">
                   <div>
                     <h3 className="text-xl font-bold">Gestion de la Carte</h3>
                     <p className="text-stone-400 text-sm italic">{menuItems.length} plats affichés</p>
                   </div>
                   <button onClick={() => setShowAddDishModal(true)} className="px-10 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Ajouter un Plat</button>
                </div>
                
                <div className="grid gap-6">
                  {menuItems.map(dish => (
                    <div key={dish.id} className="p-6 bg-white border border-stone-100 rounded-[2.5rem] flex flex-col md:flex-row gap-8 shadow-sm group">
                      <div className="w-full md:w-56 h-48 rounded-3xl overflow-hidden bg-stone-100 shrink-0">
                        <img src={dish.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={dish.name} />
                      </div>
                      <div className="flex-grow flex flex-col justify-between py-2">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="text-2xl font-bold text-stone-800 mb-1">{dish.name}</h4>
                                <span className="inline-block px-3 py-1 bg-stone-50 text-stone-400 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border">{dish.category}</span>
                             </div>
                             <div className="text-2xl font-serif font-bold text-orange-600">{dish.price.toLocaleString()} F</div>
                          </div>
                          <p className="text-stone-400 text-sm italic leading-relaxed my-4 line-clamp-2">"{dish.description}"</p>
                          <div className="flex gap-4 mt-auto">
                             <button onClick={() => setEditingDish(dish)} className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Modifier</button>
                             <button onClick={() => deleteDish(dish.id)} className="px-6 py-3 border border-red-50 text-red-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition">Retirer</button>
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
              <input type="text" placeholder="Identifiant" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-orange-300 transition-all" required />
              <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:border-orange-300 transition-all" required />
              {loginError && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest animate-pulse">{loginError}</p>}
              <button type="submit" className="w-full py-6 bg-stone-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl">Accéder</button>
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
                    <div className="flex-grow space-y-4">
                       <input type="file" accept="image/*" onChange={e => handleImageUpload(e, !!editingDish)} className="text-[10px] font-black uppercase text-stone-400 block w-full" />
                       {(editingDish?.image || newDish.image) && (
                         <button 
                           type="button" 
                           onClick={analyzeImage}
                           disabled={isAnalyzingImage}
                           className="bg-orange-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-orange-700 transition disabled:opacity-50 flex items-center gap-2"
                         >
                           {isAnalyzingImage ? '...' : '✨ Analyse IA Gemini'}
                         </button>
                       )}
                    </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-grow bg-stone-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all">Sauvegarder</button>
                  <button type="button" onClick={() => { setShowAddDishModal(false); setEditingDish(null); }} className="px-10 bg-stone-100 text-stone-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest">Annuler</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
