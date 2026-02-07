
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import MenuCard from './components/MenuCard';
import ReservationForm from './components/ReservationForm';
import { MENU_ITEMS as INITIAL_MENU, PHONE, LOCATION, RESTAURANT_NAME, SITE_URL, DELIVERY_FEE } from './constants';
import { Dish, OrderHistoryItem, Reservation } from './types';
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
// @ts-ignore
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

const formatPrice = (amount: number) => new Intl.NumberFormat('de-DE').format(amount);

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
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

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
      setLoginError('Identifiants incorrects');
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
        contents: [{ parts: [{ inlineData: { data: base64Data, mimeType } }, { text: "Identifie ce plat ivoirien. Retourne un JSON : 'name', 'description', 'category', 'price'." }] }],
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, category: { type: Type.STRING }, price: { type: Type.NUMBER } }, required: ["name", "description", "category", "price"] } }
      });
      const result = JSON.parse(response.text || '{}');
      if (editingDish) {
        setEditingDish({ ...editingDish, name: result.name || editingDish.name, description: result.description || editingDish.description, category: (result.category?.toLowerCase() || editingDish.category) as any, price: result.price || editingDish.price });
      } else {
        setNewDish({ ...newDish, name: result.name || '', description: result.description || '', category: (result.category?.toLowerCase() || 'plat') as any, price: result.price || 0 });
      }
    } catch (error) {
      console.error(error);
      alert("Erreur IA");
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
      const dishToSave: Dish = { ...newDish as Dish, id: Date.now().toString() };
      updatedMenu = [dishToSave, ...menuItems];
      setNewDish({ name: '', description: '', price: 0, category: 'plat', image: '' });
      setShowAddDishModal(false);
    }
    setMenuItems(updatedMenu);
    localStorage.setItem('grand_bassam_menu', JSON.stringify(updatedMenu));
  };

  const deleteDish = (id: string) => {
    if (confirm("Retirer ce plat ?")) {
      const updated = menuItems.filter(m => m.id !== id);
      setMenuItems(updated);
      localStorage.setItem('grand_bassam_menu', JSON.stringify(updated));
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
    }
  };

  // Fix: Define publicMenuItems to resolve 'Cannot find name publicMenuItems' error and handle category filtering
  const publicMenuItems = useMemo(() => {
    if (activeCategory === 'tous') return menuItems;
    return menuItems.filter(item => item.category === activeCategory);
  }, [menuItems, activeCategory]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = o.timestamp.split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.timestamp.startsWith(today));
    
    const calculateTotalWithDelivery = (items: OrderHistoryItem[]) => 
      items.filter(o => o.status === 'Payé').reduce((acc, curr) => 
        acc + (curr.price * curr.quantity) + (curr.isDelivery ? DELIVERY_FEE : 0), 0);

    const todayRevenue = calculateTotalWithDelivery(todayOrders);
    const periodRevenue = calculateTotalWithDelivery(filteredOrders);
    const totalRevenue = calculateTotalWithDelivery(orders);
    
    const unpaidRevenue = filteredOrders.filter(o => o.status === 'Nouveau').reduce((acc, curr) => 
      acc + (curr.price * curr.quantity) + (curr.isDelivery ? DELIVERY_FEE : 0), 0);
    
    return { totalRevenue, todayRevenue, periodRevenue, unpaidRevenue, todayOrdersCount: todayOrders.length };
  }, [orders, filteredOrders]);

  const generateInvoicePDF = (order: OrderHistoryItem) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 180] });
    const subTotal = order.price * order.quantity;
    const delFee = order.isDelivery ? DELIVERY_FEE : 0;
    const finalTotal = subTotal + delFee;

    doc.setFont("helvetica", "bold").setFontSize(14).text(RESTAURANT_NAME, 40, 15, { align: 'center' });
    doc.setFontSize(8).setFont("helvetica", "normal").text(LOCATION, 40, 20, { align: 'center' }).text(PHONE, 40, 24, { align: 'center' });
    doc.line(10, 28, 70, 28);
    doc.setFont("helvetica", "bold").text(`FACTURE #GB${order.id.slice(-6)}`, 10, 35);
    doc.setFont("helvetica", "normal").text(`Date: ${new Date(order.timestamp).toLocaleDateString()}`, 10, 42);
    doc.text(`Client: ${order.customerName}`, 10, 47);
    doc.line(10, 52, 70, 52);
    doc.setFont("helvetica", "bold").text("Article", 10, 58).text("Total", 70, 58, { align: 'right' });
    doc.setFont("helvetica", "normal").text(`${order.dishName} x${order.quantity}`, 10, 66).text(`${formatPrice(subTotal)} F`, 70, 66, { align: 'right' });
    
    if (order.isDelivery) {
      doc.text("Frais Livraison", 10, 74).text(`${formatPrice(DELIVERY_FEE)} F`, 70, 74, { align: 'right' });
    }
    
    doc.line(10, 80, 70, 80);
    doc.setFont("helvetica", "bold").setFontSize(10).text("TOTAL FINAL", 10, 90).text(`${formatPrice(finalTotal)} FCFA`, 70, 90, { align: 'right' });
    doc.setFontSize(7).setFont("helvetica", "italic").text("Merci et à très bientôt !", 40, 110, { align: 'center' });
    doc.save(`Facture_${order.customerName}.pdf`);
  };

  const generateReportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold").setFontSize(22).text("BILAN FINANCIER GRAND B", 105, 20, { align: 'center' });
    doc.setFontSize(10).text(`Période: ${dateRange.start} au ${dateRange.end}`, 105, 30, { align: 'center' });
    doc.line(20, 35, 190, 35);
    doc.text(`Chiffre d'Affaire: ${formatPrice(stats.periodRevenue)} FCFA`, 20, 45);
    autoTable(doc, {
      startY: 55,
      head: [['Date', 'Client', 'Plat', 'Livraison', 'Total']],
      body: filteredOrders.filter(o => o.status === 'Payé').map(o => [
        new Date(o.timestamp).toLocaleDateString(), o.customerName, o.dishName, o.isDelivery ? 'Oui' : 'Non', `${formatPrice((o.price * o.quantity) + (o.isDelivery ? DELIVERY_FEE : 0))} F`
      ]),
      theme: 'grid', headStyles: { fillColor: [234, 88, 12] }
    });
    doc.save(`Bilan_${dateRange.start}_${dateRange.end}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* ADMIN BAR */}
      {isAdminMode && (
        <nav className="fixed top-0 left-0 w-full bg-stone-900 text-white py-3 px-6 z-[200] flex justify-between items-center shadow-2xl no-print border-b border-orange-600/50">
          <div className="flex gap-6 overflow-x-auto items-center">
            <span className="text-[10px] font-black bg-orange-600 px-3 py-1 rounded-full">ADMIN</span>
            <button onClick={() => setShowAdminPortal('dashboard')} className="text-[10px] font-bold uppercase tracking-widest">Dashboard</button>
            <button onClick={() => setShowAdminPortal('orders')} className="text-[10px] font-bold uppercase tracking-widest">Commandes</button>
            <button onClick={() => setShowAdminPortal('accounting')} className="text-[10px] font-bold uppercase tracking-widest">Comptabilité</button>
            <button onClick={() => setShowAdminPortal('menu_manager')} className="text-[10px] font-bold uppercase tracking-widest">Menu</button>
          </div>
          <button onClick={logoutAdmin} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-lg hover:bg-white hover:text-stone-900 transition-colors shrink-0">DECONNEXION</button>
        </nav>
      )}

      <div className={`no-print ${isAdminMode ? 'pt-16' : ''}`}>
        <Navbar />
        <main>
          <section id="hero" className="h-[85vh] relative flex items-center justify-center bg-stone-950 overflow-hidden">
            <div className="absolute inset-0 opacity-40">
              <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="Hero" />
            </div>
            <div className="relative text-center px-4">
              <Logo className="w-20 h-20 mx-auto mb-8 text-orange-500" />
              <h1 className="text-7xl md:text-[10rem] font-serif text-white italic mb-6 leading-none select-none">Grand Bassam</h1>
              <p className="text-orange-400 text-lg md:text-2xl font-light tracking-[0.5em] uppercase mb-12">L'Art de la Gastronomie Ivoirienne</p>
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <button onClick={() => scrollToSection('menu')} className="px-14 py-5 bg-orange-600 text-white rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-orange-700 hover:scale-105 transition-all">Découvrir la Carte</button>
                <button onClick={() => scrollToSection('histoire')} className="px-14 py-5 bg-transparent border-2 border-white/30 text-white rounded-full font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all">Notre Histoire</button>
              </div>
            </div>
          </section>

          <section id="histoire" className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-50 rounded-full -z-10"></div>
                <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200" className="rounded-[4rem] shadow-3xl w-full h-[600px] object-cover" alt="Histoire" />
                <div className="absolute -bottom-8 -right-8 bg-stone-900 text-white p-10 rounded-[2rem] shadow-2xl">
                  <p className="text-4xl font-serif italic font-bold">15+</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Années de Passion</p>
                </div>
              </div>
              <div className="space-y-8">
                <h2 className="text-5xl font-serif italic font-bold text-stone-900 leading-tight">Un Voyage du <span className="text-orange-600">Littoral</span> au <span className="text-orange-600">Sahel</span></h2>
                <div className="w-20 h-1 bg-orange-600"></div>
                <p className="text-stone-500 leading-relaxed text-lg">
                  L'histoire du <span className="font-bold text-stone-800">RESTAURANT GRAND BASSAM</span> commence avec une mission simple : créer un pont culinaire entre la Côte d'Ivoire et le Niger. Fondé par des passionnés de saveurs authentiques, nous avons à cœur de partager les trésors de notre terroir.
                </p>
                <p className="text-stone-500 leading-relaxed text-lg">
                  Chaque Garba, chaque Kedjenou et chaque boule de Foutou est préparé selon les méthodes ancestrales, utilisant des produits frais importés directement pour garantir ce goût unique qui fait notre renommée à Niamey. Bienvenue chez vous, bienvenue au Grand Bassam.
                </p>
                <div className="flex items-center gap-6 pt-6">
                  <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => <img key={i} className="w-12 h-12 rounded-full border-4 border-white object-cover" src={`https://i.pravatar.cc/150?img=${i+10}`} alt="Client" />)}
                  </div>
                  <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Déjà des milliers de clients conquis</p>
                </div>
              </div>
            </div>
          </section>

          <section id="menu" className="py-24 bg-stone-50">
            <div className="text-center mb-12 space-y-4">
               <h2 className="text-5xl font-serif italic font-bold">La Carte du Chef</h2>
               <p className="text-stone-400 uppercase tracking-[0.3em] font-black text-xs">Excellence & Authenticité</p>
            </div>
            
            {/* Category Filter */}
            <div className="flex justify-center gap-4 mb-16 flex-wrap px-4 max-w-4xl mx-auto">
              {['tous', 'entrée', 'plat', 'dessert', 'boisson'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeCategory === cat ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/20' : 'bg-white text-stone-400 hover:text-stone-900 border border-stone-100'}`}
                >
                  {cat === 'tous' ? 'Tout Voir' : cat}
                </button>
              ))}
            </div>

            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {publicMenuItems.map(dish => <MenuCard key={dish.id} dish={dish} />)}
            </div>
          </section>

          <section id="reserve" className="py-24 bg-stone-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full"></div>
            <div className="max-w-4xl mx-auto px-4 bg-white p-10 md:p-16 rounded-[4rem] text-stone-900 shadow-3xl relative z-10">
              <div className="text-center mb-12 space-y-4">
                <h2 className="text-4xl font-serif italic font-bold">Une Table d'Exception</h2>
                <p className="text-stone-400 uppercase tracking-widest font-black text-[10px]">Réservation instantanée via WhatsApp</p>
              </div>
              <ReservationForm />
            </div>
          </section>
        </main>

        <footer className="bg-stone-950 text-white pt-24 pb-12 px-8 border-t border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                <Logo className="w-12 h-12 text-orange-500" />
                <span className="text-2xl font-serif italic font-bold uppercase tracking-tight">{RESTAURANT_NAME}</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed mb-8 italic">"L'excellence culinaire au cœur de Niamey."</p>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Navigation</h3>
              <ul className="space-y-4">
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest">Accueil</button></li>
                <li><button onClick={() => scrollToSection('histoire')} className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest">L'Histoire</button></li>
                <li><button onClick={() => scrollToSection('menu')} className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-widest">La Carte</button></li>
                <li><button onClick={() => setShowLoginModal(true)} className="text-stone-600 hover:text-orange-500 text-[10px] font-black uppercase">Espace Gérant</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Contact</h3>
              <ul className="space-y-6 text-xs">
                <li className="flex gap-4"><span>📍</span><p className="text-stone-400">{LOCATION}</p></li>
                <li className="flex gap-4"><span>📞</span><p className="text-stone-400">{PHONE}</p></li>
              </ul>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-8">Carte Digitale</h3>
              <QRCodeImage size={100} className="mb-4 border-4 border-white/5" />
              <p className="text-[8px] text-stone-500 text-right uppercase font-black tracking-widest">Commandez à table</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.3em]">© {new Date().getFullYear()} {RESTAURANT_NAME} • AUTHENTICITÉ IVOIRIENNE</p>
          </div>
        </footer>
      </div>

      {/* ADMIN PANELS (REDUCED FOR BREVITY BUT KEPT FUNCTIONAL) */}
      {isAdminMode && showAdminPortal !== 'none' && (
        <div className="fixed inset-0 bg-stone-50 z-[300] flex flex-col no-print">
          <header className="p-6 border-b flex justify-between items-center bg-white shadow-sm">
            <h2 className="text-2xl font-serif font-bold italic uppercase">{showAdminPortal}</h2>
            <button onClick={() => setShowAdminPortal('none')} className="w-12 h-12 flex items-center justify-center border rounded-2xl">✕</button>
          </header>
          <div className="flex-grow overflow-y-auto p-8 bg-stone-50/50">
            {showAdminPortal === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">CA Jour (+ Livr.)</p>
                  <p className="text-4xl font-serif font-bold text-stone-900">{formatPrice(stats.todayRevenue)} F</p>
                </div>
                <div className="bg-stone-900 p-8 rounded-[2rem] shadow-xl text-white">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">CA Total Période</p>
                  <p className="text-4xl font-serif font-bold text-orange-500">{formatPrice(stats.periodRevenue)} F</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Commandes du jour</p>
                  <p className="text-4xl font-serif font-bold text-stone-900">{stats.todayOrdersCount}</p>
                </div>
              </div>
            )}
            
            {showAdminPortal === 'orders' && (
               <div className="space-y-4 max-w-5xl mx-auto">
                 {orders.map(order => (
                   <div key={order.id} className="p-6 bg-white rounded-3xl flex justify-between items-center shadow-sm">
                     <div>
                       <h3 className="font-bold">{order.dishName} x{order.quantity} {order.isDelivery && <span className="text-orange-600">(+1.000 F Livraison)</span>}</h3>
                       <p className="text-xs text-stone-400">{order.customerName} • {order.customerPhone}</p>
                     </div>
                     <div className="flex gap-4">
                       <button onClick={() => generateInvoicePDF(order)} className="px-4 py-2 bg-stone-100 rounded-xl text-[10px] font-black">📄 PDF</button>
                       {order.status === 'Nouveau' && <button onClick={() => updateOrderStatus(order.id, 'Payé')} className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black">PAYER</button>}
                       <button onClick={() => deleteOrder(order.id)} className="text-red-300 hover:text-red-600">✕</button>
                     </div>
                   </div>
                 ))}
               </div>
            )}

            {showAdminPortal === 'accounting' && (
              <div className="space-y-8 max-w-6xl mx-auto">
                <div className="bg-white p-8 rounded-3xl flex flex-col md:flex-row gap-6 justify-between items-center">
                  <div className="flex gap-4">
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 border rounded-xl text-xs" />
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 border rounded-xl text-xs" />
                  </div>
                  <button onClick={generateReportPDF} className="px-8 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Exporter Bilan PDF</button>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm">
                   <p className="text-sm font-black uppercase mb-6">Total Encaissé Période : {formatPrice(stats.periodRevenue)} FCFA</p>
                </div>
              </div>
            )}

            {showAdminPortal === 'menu_manager' && (
              <div className="max-w-5xl mx-auto space-y-6">
                 <button onClick={() => setShowAddDishModal(true)} className="px-8 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Ajouter un Plat</button>
                 <div className="grid gap-6">
                   {menuItems.map(dish => (
                     <div key={dish.id} className="p-6 bg-white rounded-[2rem] flex gap-6 shadow-sm">
                        <img src={dish.image} className="w-32 h-32 object-cover rounded-2xl" alt={dish.name} />
                        <div className="flex-grow">
                          <h4 className="text-xl font-bold">{dish.name}</h4>
                          <p className="text-orange-600 font-bold">{formatPrice(dish.price)} F</p>
                          <div className="flex gap-4 mt-4">
                            <button onClick={() => setEditingDish(dish)} className="text-xs font-black uppercase text-stone-400">Modifier</button>
                            <button onClick={() => deleteDish(dish.id)} className="text-xs font-black uppercase text-red-300">Supprimer</button>
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
        <div className="fixed inset-0 bg-stone-950/95 z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl relative">
            <h2 className="text-3xl font-serif font-bold italic text-center mb-10">Accès Gérant</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder="Admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl outline-none border" />
              <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl outline-none border" />
              {loginError && <p className="text-red-500 text-[10px] text-center font-bold">{loginError}</p>}
              <button type="submit" className="w-full py-6 bg-stone-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all">Connexion</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-stone-400 text-[10px] font-black uppercase mt-4">Retour</button>
            </form>
          </div>
        </div>
      )}

      {/* DISH FORM MODAL */}
      {(showAddDishModal || editingDish) && (
        <div className="fixed inset-0 bg-stone-950/95 z-[400] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative">
            <h3 className="text-2xl font-serif font-bold italic mb-8">{editingDish ? "Editer Plat" : "Nouveau Plat"}</h3>
            <form onSubmit={saveDish} className="space-y-6">
               <input type="text" placeholder="Nom" required value={editingDish ? editingDish.name : newDish.name} onChange={e => editingDish ? setEditingDish({...editingDish, name: e.target.value}) : setNewDish({...newDish, name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-xl border" />
               <input type="number" placeholder="Prix" required value={editingDish ? editingDish.price : newDish.price} onChange={e => editingDish ? setEditingDish({...editingDish, price: parseInt(e.target.value)}) : setNewDish({...newDish, price: parseInt(e.target.value)})} className="w-full p-4 bg-stone-50 rounded-xl border" />
               <select className="w-full p-4 bg-stone-50 rounded-xl border" value={editingDish ? editingDish.category : newDish.category} onChange={e => editingDish ? setEditingDish({...editingDish, category: e.target.value as any}) : setNewDish({...newDish, category: e.target.value as any})}>
                  <option value="entrée">🥗 Entrée</option>
                  <option value="plat">🍲 Plat Principal</option>
                  <option value="dessert">🍰 Dessert</option>
                  <option value="boisson">🥤 Boisson</option>
               </select>
               <textarea rows={3} placeholder="Description" required value={editingDish ? editingDish.description : newDish.description} onChange={e => editingDish ? setEditingDish({...editingDish, description: e.target.value}) : setNewDish({...newDish, description: e.target.value})} className="w-full p-4 bg-stone-50 rounded-xl border" />
               <div className="flex items-center gap-6">
                 <div className="w-24 h-24 bg-stone-100 rounded-xl overflow-hidden">
                   {(editingDish?.image || newDish.image) && <img src={editingDish ? editingDish.image : newDish.image} className="w-full h-full object-cover" alt="Preview" />}
                 </div>
                 <div className="flex-grow">
                   <input type="file" accept="image/*" onChange={e => handleImageUpload(e, !!editingDish)} className="text-[10px] mb-2 block" />
                   {(editingDish?.image || newDish.image) && <button type="button" onClick={analyzeImage} disabled={isAnalyzingImage} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">{isAnalyzingImage ? '...' : 'Analyse IA'}</button>}
                 </div>
               </div>
               <div className="flex gap-4">
                  <button type="submit" className="flex-grow bg-stone-900 text-white py-4 rounded-xl font-black uppercase text-[10px]">Enregistrer</button>
                  <button type="button" onClick={() => { setShowAddDishModal(false); setEditingDish(null); }} className="px-8 bg-stone-100 text-stone-400 py-4 rounded-xl font-black uppercase text-[10px]">Annuler</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
