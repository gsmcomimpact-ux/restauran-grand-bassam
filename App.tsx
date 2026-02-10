import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import MenuCard from './components/MenuCard';
import ReservationForm from './components/ReservationForm';
import { MENU_ITEMS as INITIAL_MENU, PHONE, DISPLAY_PHONE, LOCATION, RESTAURANT_NAME, SITE_URL, DELIVERY_FEE } from './constants';
import { Dish, OrderHistoryItem, Reservation } from './types';
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
// @ts-ignore
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

const formatPrice = (amount: number) => new Intl.NumberFormat('de-DE').format(amount);

// Utility to handle Google Drive view links for image tags
export const formatImageUrl = (url: string) => {
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?id=${match[1]}`;
    }
  }
  return url;
};

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const localMenuString = localStorage.getItem('grand_bassam_menu');
    let items: Dish[] = localMenuString ? JSON.parse(localMenuString) : INITIAL_MENU;
    
    // Synchronisation forcée des données "source" (INITIAL_MENU) avec le cache local
    // Cela permet de s'assurer que les changements de catégories ou d'images faits dans le code
    // sont répercutés même si l'utilisateur a déjà des données en cache.
    if (localMenuString) {
      items = items.map(item => {
        const initialItem = INITIAL_MENU.find(i => i.id === item.id);
        if (initialItem) {
          // On priorise les données du code pour les éléments existants (ID fixes)
          return { ...item, ...initialItem };
        }
        return item;
      });
      localStorage.setItem('grand_bassam_menu', JSON.stringify(items));
    } else {
      localStorage.setItem('grand_bassam_menu', JSON.stringify(INITIAL_MENU));
    }
    
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
    if (username === 'admin' && password === 'grandbassam227') {
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

  const analyzeImage = async () => {
    const currentImg = editingDish ? editingDish.image : newDish.image;
    if (!currentImg) return alert("Veuillez d'abord saisir un lien d'image valide.");
    setIsAnalyzingImage(true);
    try {
      const responseImg = await fetch(formatImageUrl(currentImg));
      const blob = await responseImg.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const base64String = await base64Promise;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = base64String.split(',')[1];
      const mimeType = base64String.split(',')[0].split(':')[1].split(';')[0];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ 
          parts: [
            { inlineData: { data: base64Data, mimeType } }, 
            { text: "Identifie ce plat ivoirien. Retourne un JSON strictement avec les clés : 'name', 'description', 'category', 'price' (nombre entier). La catégorie doit être l'un des suivants: 'entrée', 'plat', 'dessert', 'boisson'." }
          ] 
        }],
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
      alert("Erreur lors de l'analyse.");
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
    doc.setFontSize(8).setFont("helvetica", "normal").text(LOCATION, 40, 20, { align: 'center' }).text(DISPLAY_PHONE, 40, 24, { align: 'center' });
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
    doc.setFont("helvetica", "bold").setFontSize(22).text(`BILAN FINANCIER ${RESTAURANT_NAME}`, 105, 20, { align: 'center' });
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

  const categoryLabels: Record<string, string> = {
    tous: 'Tout Voir',
    entrée: 'Entrées',
    plat: 'Plats de Résistance',
    dessert: 'Desserts',
    boisson: 'Boissons'
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {isAdminMode && (
        <nav className="fixed top-0 left-0 w-full bg-stone-950 text-white py-3 px-6 z-[200] flex justify-between items-center shadow-2xl no-print border-b border-orange-600/50">
          <div className="flex gap-4 md:gap-6 overflow-x-auto items-center no-scrollbar">
            <span className="text-[10px] font-black bg-orange-600 px-3 py-1 rounded-full shrink-0">ADMIN</span>
            <button onClick={() => setShowAdminPortal('dashboard')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'dashboard' ? 'text-orange-400' : 'text-stone-300'}`}>Tableau de Bord</button>
            <button onClick={() => setShowAdminPortal('orders')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'orders' ? 'text-orange-400' : 'text-stone-300'}`}>Commandes</button>
            <button onClick={() => setShowAdminPortal('reservations')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'reservations' ? 'text-orange-400' : 'text-stone-300'}`}>Réservations</button>
            <button onClick={() => setShowAdminPortal('accounting')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'accounting' ? 'text-orange-400' : 'text-stone-300'}`}>Comptabilité</button>
            <button onClick={() => setShowAdminPortal('menu_manager')} className={`text-[10px] font-bold uppercase tracking-widest shrink-0 ${showAdminPortal === 'menu_manager' ? 'text-orange-400' : 'text-stone-300'}`}>Menu</button>
          </div>
          <button onClick={logoutAdmin} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-lg hover:bg-white hover:text-stone-900 transition-colors shrink-0 ml-4">DECONNEXION</button>
        </nav>
      )}

      <div className={`no-print ${isAdminMode ? 'pt-16' : ''}`}>
        <Navbar />
        <main>
          <section id="hero" className="h-[90vh] relative flex items-center justify-center bg-stone-950 overflow-hidden">
            <div className="absolute inset-0">
              <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover opacity-50 scale-105 animate-pulse-slow" alt="Cuisine Ivoirienne" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
            </div>
            <div className="relative text-center px-4 max-w-5xl">
              <Logo className="w-24 h-24 mx-auto mb-10 text-orange-500 drop-shadow-2xl" />
              <h1 className="text-5xl md:text-[8rem] font-serif text-white italic mb-8 leading-none select-none tracking-tighter">
                Grand Bassam
              </h1>
              <div className="w-24 h-1 bg-orange-600 mx-auto mb-8"></div>
              <p className="text-white text-lg md:text-2xl font-light tracking-[0.6em] uppercase mb-12 opacity-90">L'Art de la Gastronomie Ivoirienne</p>
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                <button onClick={() => scrollToSection('menu')} className="px-16 py-6 bg-orange-600 text-white rounded-full font-black uppercase tracking-widest shadow-[0_0_50px_rgba(234,88,12,0.3)] hover:bg-orange-700 hover:scale-105 transition-all">Découvrir la Carte</button>
                <button onClick={() => scrollToSection('reserve')} className="px-16 py-6 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full font-black uppercase tracking-widest hover:bg-white hover:text-stone-900 transition-all">Réserver une Table</button>
              </div>
            </div>
          </section>

          <section id="histoire" className="py-32 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50 -z-10"></div>
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -z-10"></div>
                <div className="relative group">
                   <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200" className="rounded-[4rem] shadow-3xl w-full h-[650px] object-cover relative z-10 transition-transform duration-700 group-hover:scale-[1.02]" alt="Restaurant Grand Bassam" />
                   <div className="absolute -inset-4 border-2 border-orange-600/20 rounded-[4.5rem] -z-0"></div>
                </div>
              </div>
              <div className="space-y-10 order-1 lg:order-2">
                <div className="space-y-4">
                  <span className="text-orange-600 text-[10px] font-black uppercase tracking-[0.4em]">Depuis 2018</span>
                  <h2 className="text-6xl md:text-7xl font-serif italic font-bold text-stone-900 leading-none">Un Voyage de <span className="text-orange-600 underline decoration-stone-200 underline-offset-8">Bassam</span> à <span className="text-green-600">Niamey</span></h2>
                </div>
                <div className="w-20 h-1.5 bg-gradient-to-r from-orange-600 to-green-600"></div>
                <div className="space-y-6 text-stone-500 leading-relaxed text-lg font-light">
                  <p>
                    Le <span className="font-bold text-stone-900 italic">{RESTAURANT_NAME}</span> est né d'une volonté farouche : transporter l'âme culinaire de la Côte d'Ivoire au Niger.
                  </p>
                  <p>
                    Nous sélectionnons nos produits avec une rigueur absolue. Notre Attiéké vient directement des meilleures coopératives d'Abidjan, nos épices sont choisies pour leur puissance aromatique, et nos braiseurs maîtrisent le feu comme personne à Niamey.
                  </p>
                  <p className="font-serif italic text-stone-900 text-2xl border-l-4 border-orange-600 pl-6">
                    "Plus qu'un repas, nous vous offrons un moment de fraternité ivoirienne."
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="menu" className="py-32 bg-stone-50">
            <div className="text-center mb-20 space-y-6">
               <span className="text-orange-600 text-[10px] font-black uppercase tracking-[0.5em]">La Sélection du Grand Bassam</span>
               <h2 className="text-6xl font-serif italic font-bold text-stone-900">La Carte Digitale</h2>
               <p className="text-stone-400 max-w-xl mx-auto italic font-light">Authenticité préservée, saveurs explosives. Commandez en un clic via WhatsApp pour une dégustation immédiate.</p>
            </div>
            
            <div className="flex justify-center gap-3 mb-20 flex-wrap px-6 max-w-5xl mx-auto">
              {Object.entries(categoryLabels).map(([catKey, catLabel]) => (
                <button
                  key={catKey}
                  onClick={() => setActiveCategory(catKey)}
                  className={`px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${activeCategory === catKey ? 'bg-orange-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)] scale-110' : 'bg-white text-stone-400 hover:text-stone-900 border border-stone-200 hover:border-stone-400 shadow-sm'}`}
                >
                  {catLabel}
                </button>
              ))}
            </div>

            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-16">
              {publicMenuItems.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-stone-400 italic">Aucun plat dans cette catégorie pour le moment.</p>
                </div>
              ) : publicMenuItems.map((dish, index) => (
                <div key={dish.id} className="relative">
                  {index === 0 && activeCategory === 'tous' && (
                    <div className="absolute -top-4 -left-4 z-10 bg-orange-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl rotate-[-5deg]">
                      ⭐ Le Plus Demandé
                    </div>
                  )}
                  <MenuCard dish={dish} />
                </div>
              ))}
            </div>
          </section>

          <section id="reserve" className="py-32 bg-stone-950 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-600/5 blur-[150px] rounded-full pointer-events-none"></div>
            
            <div className="max-w-4xl mx-auto px-6">
              <div className="bg-white p-12 md:p-20 rounded-[5rem] text-stone-900 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative z-10 border border-stone-100">
                <div className="text-center mb-16 space-y-6">
                  <Logo className="w-16 h-16 mx-auto text-orange-600" />
                  <h2 className="text-5xl font-serif italic font-bold">Réserver votre Expérience</h2>
                  <div className="w-16 h-1 bg-stone-200 mx-auto"></div>
                  <p className="text-stone-400 uppercase tracking-widest font-black text-[10px]">Traitement prioritaire via WhatsApp</p>
                </div>
                <ReservationForm />
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-stone-950 text-white pt-32 pb-16 px-8 border-t border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-600 via-white to-green-600"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-5 mb-10">
                <Logo className="w-14 h-14 text-orange-500" />
                <div className="flex flex-col">
                  <span className="text-2xl font-serif italic font-bold tracking-tighter">{RESTAURANT_NAME}</span>
                  <span className="text-[8px] uppercase font-black tracking-[0.4em] text-orange-600">Ivory Excellence</span>
                </div>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed mb-10 italic font-light">"Chaque plat raconte une histoire, chaque bouchée est un voyage entre la lagune et le désert."</p>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-10">Exploration</h3>
              <ul className="space-y-5">
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-stone-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors">Accueil</button></li>
                <li><button onClick={() => scrollToSection('histoire')} className="text-stone-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors">L'Héritage</button></li>
                <li><button onClick={() => scrollToSection('menu')} className="text-stone-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors">La Carte</button></li>
                <li><button onClick={() => setShowLoginModal(true)} className="text-stone-700 hover:text-orange-500 text-[10px] font-black uppercase transition-colors">Gestionnaire</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-10">Incontournable</h3>
              <ul className="space-y-8 text-sm">
                <li className="flex gap-5 items-start">
                  <span className="text-orange-600 text-xl">📍</span>
                  <p className="text-stone-400 font-light">{LOCATION}</p>
                </li>
                <li className="flex gap-5 items-center">
                  <span className="text-orange-600 text-xl">📞</span>
                  <p className="text-stone-400 font-bold">{DISPLAY_PHONE}</p>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-10">Accès Mobile</h3>
              <QRCodeImage size={110} className="mb-6 border-4 border-stone-900 shadow-2xl" />
              <p className="text-[9px] text-stone-500 text-right uppercase font-black tracking-[0.3em]">Scanner pour commander</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-stone-600 font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} {RESTAURANT_NAME} • AUTHENTICITÉ IVOIRIENNE</p>
            <div className="flex gap-6">
              <span className="text-[10px] font-black text-orange-600/50 tracking-widest">GASTRONOMIE</span>
              <span className="text-[10px] font-black text-stone-600 tracking-widest">PARTAGE</span>
              <span className="text-[10px] font-black text-green-600/50 tracking-widest">TRADITION</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ADMIN PORTAL OVERLAYS */}
      {isAdminMode && showAdminPortal !== 'none' && (
        <div className="fixed inset-0 bg-stone-50 z-[300] flex flex-col no-print">
          <header className="p-8 border-b flex justify-between items-center bg-white shadow-xl relative z-10">
            <div className="flex items-center gap-6">
              <Logo className="w-12 h-12 text-orange-600" />
              <h2 className="text-3xl font-serif font-bold italic uppercase tracking-tight">{
                showAdminPortal === 'dashboard' ? 'Tableau de Bord' :
                showAdminPortal === 'orders' ? 'Suivi des Commandes' :
                showAdminPortal === 'reservations' ? 'Gestion Réservations' :
                showAdminPortal === 'accounting' ? 'Bilan d\'Activité' : 'Édition de la Carte'
              }</h2>
            </div>
            <button onClick={() => setShowAdminPortal('none')} className="w-14 h-14 flex items-center justify-center border-2 border-stone-100 rounded-2xl hover:bg-stone-100 hover:border-stone-200 transition-all font-bold text-2xl group">
              <span className="group-hover:rotate-90 transition-transform">✕</span>
            </button>
          </header>
          
          <div className="flex-grow overflow-y-auto p-12 bg-stone-50/50">
            {showAdminPortal === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 group hover:shadow-xl transition-shadow">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">CA Aujourd'hui</p>
                  <p className="text-5xl font-serif font-bold text-stone-900">{formatPrice(stats.todayRevenue)} <span className="text-lg">F</span></p>
                </div>
                <div className="bg-stone-950 p-10 rounded-[3rem] shadow-2xl text-white group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl"></div>
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-6">Volume Période</p>
                  <p className="text-5xl font-serif font-bold text-orange-500">{formatPrice(stats.periodRevenue)} <span className="text-lg">F</span></p>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Flux Commandes</p>
                  <p className="text-5xl font-serif font-bold text-stone-900">{stats.todayOrdersCount}</p>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">En attente (Encais.)</p>
                  <p className="text-5xl font-serif font-bold text-orange-600">{formatPrice(stats.unpaidRevenue)} <span className="text-lg">F</span></p>
                </div>
              </div>
            )}
            
            {showAdminPortal === 'orders' && (
               <div className="space-y-6 max-w-6xl mx-auto pb-20">
                 {orders.length === 0 ? <div className="text-center py-32 bg-white rounded-[4rem] border border-dashed"><p className="italic text-stone-400">Aucun flux de commande pour le moment.</p></div> : orders.map(order => (
                   <div key={order.id} className="p-8 bg-white rounded-[3rem] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-sm hover:shadow-xl transition-all border border-stone-100 group">
                     <div className="space-y-3">
                       <div className="flex items-center gap-4">
                         <span className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-black text-lg">#{order.quantity}</span>
                         <h3 className="font-bold text-2xl font-serif">{order.dishName}</h3>
                         <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${order.status === 'Payé' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>{order.status}</span>
                       </div>
                       <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                         <span className="flex items-center gap-2">👤 {order.customerName}</span>
                         <span className="flex items-center gap-2">📞 {order.customerPhone}</span>
                         <span className="flex items-center gap-2 font-bold text-stone-900">💰 {formatPrice((order.price * order.quantity) + (order.isDelivery ? DELIVERY_FEE : 0))} F</span>
                       </div>
                       {order.isDelivery && (
                         <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                           <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">🚀 Adresse de Livraison</p>
                           <p className="text-xs text-stone-800 font-medium">{order.address}</p>
                         </div>
                       )}
                     </div>
                     <div className="flex gap-3 w-full lg:w-auto">
                       <button onClick={() => generateInvoicePDF(order)} className="flex-1 lg:flex-none px-8 py-4 bg-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-colors">📄 Ticket</button>
                       {order.status === 'Nouveau' && (
                         <button onClick={() => updateOrderStatus(order.id, 'Payé')} className="flex-1 lg:flex-none px-8 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all">Encaisser</button>
                       )}
                       <button onClick={() => deleteOrder(order.id)} className="w-14 h-14 flex items-center justify-center border-2 border-red-50 text-red-200 hover:text-red-600 hover:border-red-100 rounded-2xl transition-all">✕</button>
                     </div>
                   </div>
                 ))}
               </div>
            )}

            {showAdminPortal === 'accounting' && (
              <div className="space-y-12 max-w-6xl mx-auto pb-20">
                <div className="bg-white p-12 rounded-[4rem] flex flex-col lg:flex-row gap-10 justify-between items-center border border-stone-100 shadow-sm">
                  <div className="flex flex-wrap gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Date de Début</label>
                      <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-4 border border-stone-200 rounded-2xl text-sm font-bold bg-stone-50 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Date de Fin</label>
                      <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-4 border border-stone-200 rounded-2xl text-sm font-bold bg-stone-50 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                  </div>
                  <button onClick={generateReportPDF} className="w-full lg:w-auto px-12 py-5 bg-stone-950 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-orange-600 transition-all">Générer Rapport PDF</button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-stone-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -z-0"></div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 relative z-10">Recettes Encaissées (Période)</p>
                      <p className="text-6xl font-serif font-bold text-green-600 relative z-10">{formatPrice(stats.periodRevenue)} <span className="text-2xl">FCFA</span></p>
                      <div className="mt-8 pt-8 border-t border-stone-100">
                        <p className="text-xs text-stone-400 italic">Basé sur {filteredOrders.filter(o => o.status === 'Payé').length} transactions validées.</p>
                      </div>
                   </div>
                   <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-stone-100 group hover:shadow-2xl transition-all">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Commandes "Nouveau" (À Encaisser)</p>
                      <p className="text-6xl font-serif font-bold text-orange-600">{formatPrice(stats.unpaidRevenue)} <span className="text-2xl">FCFA</span></p>
                      <div className="mt-8 pt-8 border-t border-stone-100">
                        <p className="text-xs text-stone-400 italic">Correspond à {filteredOrders.filter(o => o.status === 'Nouveau').length} commandes en attente.</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {showAdminPortal === 'menu_manager' && (
              <div className="max-w-6xl mx-auto space-y-10 pb-20">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                   <div className="space-y-2 text-center md:text-left">
                     <h3 className="text-4xl font-serif font-bold italic">Gestionnaire de Produits</h3>
                     <p className="text-stone-400 text-sm italic font-light">Personnalisez votre carte en temps réel.</p>
                   </div>
                   <button onClick={() => setShowAddDishModal(true)} className="px-12 py-5 bg-orange-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Ajouter une Création</button>
                 </div>
                 
                 <div className="grid lg:grid-cols-2 gap-10">
                   {menuItems.map(dish => (
                     <div key={dish.id} className="p-8 bg-white rounded-[3.5rem] flex flex-col sm:flex-row gap-10 shadow-sm border border-stone-100 group hover:shadow-2xl transition-all overflow-hidden relative">
                        <div className="sm:w-48 sm:h-48 shrink-0 relative">
                           <img src={formatImageUrl(dish.image)} className="w-full h-full object-cover rounded-[2.5rem] group-hover:scale-110 transition-transform duration-700" alt={dish.name} />
                           <span className="absolute top-4 right-4 bg-orange-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">{dish.category}</span>
                        </div>
                        <div className="flex-grow flex flex-col justify-center py-2">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-2xl font-bold font-serif italic text-stone-900">{dish.name}</h4>
                            <p className="text-orange-600 font-serif font-bold text-xl">{formatPrice(dish.price)} <span className="text-xs">F</span></p>
                          </div>
                          <p className="text-sm text-stone-400 italic line-clamp-2 mb-8 font-light leading-relaxed">{dish.description}</p>
                          <div className="flex gap-4">
                            <button onClick={() => setEditingDish(dish)} className="flex-1 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all">Éditer</button>
                            <button onClick={() => deleteDish(dish.id)} className="px-6 py-3 border-2 border-red-50 text-red-200 hover:text-red-600 hover:border-red-100 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">✕</button>
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
        <div className="fixed inset-0 bg-stone-950/98 z-[500] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white rounded-[4rem] p-16 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 border border-stone-100">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-600 to-green-600"></div>
            <div className="text-center mb-12">
               <Logo className="w-16 h-16 mx-auto mb-6 text-stone-950" />
               <h2 className="text-4xl font-serif font-bold italic text-stone-900 mb-2">Accès Privé</h2>
               <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">RESTAURANT GRAND BASSAM</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Identifiant</label>
                <input type="text" placeholder="Gérant" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-5 bg-stone-50 rounded-[2rem] outline-none border border-stone-100 focus:border-orange-500 transition-all font-bold text-stone-800" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Mot de passe</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-stone-50 rounded-[2rem] outline-none border border-stone-100 focus:border-orange-500 transition-all font-bold text-stone-800" />
              </div>
              {loginError && <p className="text-red-600 text-[10px] text-center font-black uppercase tracking-widest bg-red-50 py-3 rounded-xl animate-pulse">{loginError}</p>}
              <button type="submit" className="w-full py-6 bg-stone-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-orange-600 transition-all shadow-2xl shadow-stone-950/20 active:scale-95">Authentification</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-stone-400 text-[10px] font-black uppercase mt-6 tracking-widest hover:text-stone-900 transition-colors">Revenir au salon</button>
            </form>
          </div>
        </div>
      )}

      {/* DISH FORM MODAL */}
      {(showAddDishModal || editingDish) && (
        <div className="fixed inset-0 bg-stone-950/98 z-[400] flex items-center justify-center p-6 overflow-y-auto backdrop-blur-xl">
          <div className="bg-white rounded-[4rem] p-12 md:p-16 max-w-3xl w-full shadow-2xl relative my-12 border border-stone-100">
            <div className="text-center mb-12">
               <h3 className="text-5xl font-serif font-bold italic text-stone-900">{editingDish ? "Affinage du Plat" : "Nouvelle Signature"}</h3>
               <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-4">Atelier de Création Culinaire</p>
            </div>
            
            <form onSubmit={saveDish} className="space-y-8">
               <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Dénomination</label>
                   <input type="text" required value={editingDish ? editingDish.name : newDish.name} onChange={e => editingDish ? setEditingDish({...editingDish, name: e.target.value}) : setNewDish({...newDish, name: e.target.value})} className="w-full p-5 bg-stone-50 rounded-[2rem] border border-stone-100 font-bold focus:border-orange-500 outline-none" placeholder="Ex: Garba Signature" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Tarif (FCFA)</label>
                   <input type="number" required value={editingDish ? editingDish.price : newDish.price} onChange={e => editingDish ? setEditingDish({...editingDish, price: parseInt(e.target.value)}) : setNewDish({...newDish, price: parseInt(e.target.value)})} className="w-full p-5 bg-stone-50 rounded-[2rem] border border-stone-100 font-serif font-bold text-xl focus:border-orange-500 outline-none" placeholder="0" />
                 </div>
               </div>
               
               <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Typologie</label>
                   <select className="w-full p-5 bg-stone-50 rounded-[2rem] border border-stone-100 font-black uppercase text-[10px] tracking-widest focus:border-orange-500 outline-none appearance-none" value={editingDish ? editingDish.category : newDish.category} onChange={e => editingDish ? setEditingDish({...editingDish, category: e.target.value as any}) : setNewDish({...newDish, category: e.target.value as any})}>
                      <option value="entrée">🥗 Entrée du Terroir</option>
                      <option value="plat">🍲 Plat de Résistance</option>
                      <option value="dessert">🍰 Douceur Finale</option>
                      <option value="boisson">🥤 Rafraîchissement</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Secrets du Chef (Description)</label>
                   <input type="text" required value={editingDish ? editingDish.description : newDish.description} onChange={e => editingDish ? setEditingDish({...editingDish, description: e.target.value}) : setNewDish({...newDish, description: e.target.value})} className="w-full p-5 bg-stone-50 rounded-[2rem] border border-stone-100 text-sm font-light italic focus:border-orange-500 outline-none" placeholder="Description courte..." />
                 </div>
               </div>

               <div className="p-10 bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-200">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="w-40 h-40 bg-white rounded-[2.5rem] overflow-hidden shadow-inner flex items-center justify-center text-stone-200 shrink-0 border border-stone-100 group">
                       {(editingDish?.image || newDish.image) ? <img src={formatImageUrl(editingDish ? editingDish.image : newDish.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Preview" /> : <span className="text-5xl">📸</span>}
                    </div>
                    <div className="flex-grow space-y-6 w-full">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Lien Visuel (URL Image)</label>
                         <input 
                          type="text" 
                          placeholder="https://images.unsplash.com/..." 
                          required 
                          value={editingDish ? editingDish.image : newDish.image} 
                          onChange={e => editingDish ? setEditingDish({...editingDish, image: e.target.value}) : setNewDish({...newDish, image: e.target.value})} 
                          className="w-full p-5 bg-white rounded-[1.5rem] border border-stone-100 text-[10px] font-bold focus:border-orange-500 outline-none" 
                         />
                       </div>
                       {(editingDish?.image || newDish.image) && (
                         <button type="button" onClick={analyzeImage} disabled={isAnalyzingImage} className="w-full bg-stone-950 text-white px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-4">
                           {isAnalyzingImage ? <span className="animate-spin text-lg">⏳</span> : '✨'} {isAnalyzingImage ? 'Génération du contenu IA...' : 'Analyse IA Multimodale'}
                         </button>
                       )}
                    </div>
                  </div>
               </div>
               
               <div className="flex gap-6 pt-6">
                  <button type="submit" className="flex-grow bg-orange-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-orange-700 transition-all shadow-2xl shadow-orange-600/20 active:scale-95">Valider la Création</button>
                  <button type="button" onClick={() => { setShowAddDishModal(false); setEditingDish(null); }} className="px-12 bg-stone-100 text-stone-400 py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-stone-200 transition-all">Retour</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;