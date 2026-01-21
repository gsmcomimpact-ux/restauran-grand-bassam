
import React, { useState, useEffect, useMemo } from 'react';
import MenuCard from './components/MenuCard';
import ReservationForm from './components/ReservationForm';
import { MENU_ITEMS as INITIAL_MENU, PHONE, LOCATION, RESTAURANT_NAME } from './constants';
import { Dish, OrderHistoryItem, Reservation } from './types';

const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" className="text-orange-600/20" />
      <path d="M30 70 Q50 20 70 70 M50 35 L50 70" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-orange-600" />
      <circle cx="50" cy="30" r="4" className="fill-orange-500 animate-pulse" />
      <path d="M40 75 H60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-stone-800" />
    </svg>
  </div>
);

const QRCodeComponent: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <div className={`bg-white p-4 rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col items-center justify-center ${className}`}>
    <svg viewBox="0 0 29 29" className="w-full h-full text-stone-900 mb-2" shapeRendering="crispEdges">
      <path fill="currentColor" d="M0 0h7v7H0zM22 0h7v7h-7zM0 22h7v7H0zM2 2h3v3H2zM24 2h3v3h-3zM2 24h3v3H2zM9 0h1v1H9zM12 0h2v1h-2zM15 0h1v2h-1zM18 0h2v1h-2zM9 2h1v1H9zM12 2h1v1h-1zM15 2h1v1h-1zM18 2h1v2h-1zM11 3h1v1H1zM14 3h1v1h-1zM9 4h2v1H9zM13 4h2v1h-2zM18 4h2v1h-2zM10 5h1v1H1z" />
    </svg>
    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-600">Scan Menu</span>
  </div>
);

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('tous');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [showAdminPortal, setShowAdminPortal] = useState<'none' | 'orders' | 'reservations' | 'accounting' | 'menu_manager'>('none');
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orderFilter, setOrderFilter] = useState<'Tous' | 'Nouveau' | 'Payé'>('Tous');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const localMenu = localStorage.getItem('grand_bassam_menu');
    setMenuItems(localMenu ? JSON.parse(localMenu) : INITIAL_MENU);
    if (sessionStorage.getItem('is_admin') === 'true') setIsAdminMode(true);
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
      setShowAdminPortal('orders');
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

  // --- Admin Actions ---
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

  const addDish = () => {
    const newDish: Dish = {
      id: `dish-${Date.now()}`,
      name: 'Nouveau Plat',
      description: 'Description...',
      price: 0,
      category: 'plat',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'
    };
    const updated = [newDish, ...menuItems];
    setMenuItems(updated);
    localStorage.setItem('grand_bassam_menu', JSON.stringify(updated));
  };

  const updateDish = (id: string, updates: Partial<Dish>) => {
    const updated = menuItems.map(m => m.id === id ? { ...m, ...updates } : m);
    setMenuItems(updated);
    localStorage.setItem('grand_bassam_menu', JSON.stringify(updated));
  };

  const deleteDish = (id: string) => {
    if (confirm("Supprimer ce plat ?")) {
      const updated = menuItems.filter(m => m.id !== id);
      setMenuItems(updated);
      localStorage.setItem('grand_bassam_menu', JSON.stringify(updated));
    }
  };

  // --- Computed Stats ---
  const stats = useMemo(() => {
    const total = orders.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const paid = orders.filter(o => o.status === 'Payé').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    return { total, paid, pending: total - paid };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'Tous') return orders;
    return orders.filter(o => o.status === orderFilter);
  }, [orders, orderFilter]);

  const publicMenuItems = activeCategory === 'tous' ? menuItems : menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-stone-50">
      <style>{`
        @media print { .no-print { display: none !important; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      `}</style>

      {/* FIXED ADMIN NAV */}
      {isAdminMode && (
        <div className="fixed top-0 left-0 w-full bg-stone-900 text-white py-4 px-6 z-[200] flex justify-between items-center shadow-2xl no-print border-b border-orange-600/30">
          <div className="flex gap-6 overflow-x-auto items-center">
            <span className="text-[10px] font-black bg-orange-600 px-3 py-1 rounded-full uppercase">MODE GÉRANT</span>
            <button onClick={() => setShowAdminPortal('orders')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'orders' ? 'text-orange-400' : 'text-stone-400'}`}>Commandes</button>
            <button onClick={() => setShowAdminPortal('reservations')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'reservations' ? 'text-orange-400' : 'text-stone-400'}`}>Réservations</button>
            <button onClick={() => setShowAdminPortal('accounting')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'accounting' ? 'text-orange-400' : 'text-stone-400'}`}>Bilan</button>
            <button onClick={() => setShowAdminPortal('menu_manager')} className={`text-[10px] font-bold uppercase tracking-widest ${showAdminPortal === 'menu_manager' ? 'text-orange-400' : 'text-stone-400'}`}>Menu</button>
          </div>
          <button onClick={logoutAdmin} className="text-[10px] font-black border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10">QUITTER</button>
        </div>
      )}

      <div className={`no-print ${isAdminMode ? 'pt-20' : ''}`}>
        <section className="h-[90vh] relative flex items-center justify-center bg-stone-950 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1920" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="relative text-center px-4">
            <Logo className="w-24 h-24 mx-auto mb-8 text-orange-500" />
            <h1 className="text-6xl md:text-9xl font-serif text-white italic mb-6">Grand Bassam</h1>
            <p className="text-stone-300 text-xl md:text-2xl font-light tracking-[0.2em] uppercase">L'Excellence Ivoirienne à Niamey</p>
          </div>
        </section>

        <section id="menu" className="py-32 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 mb-20 text-center">
             <h2 className="text-6xl font-serif font-bold italic mb-6">La Carte Gastronomique</h2>
             <div className="flex justify-center gap-8 border-b pb-4 overflow-x-auto custom-scrollbar">
                {['tous', 'entrée', 'plat', 'dessert', 'boisson'].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-xs font-black uppercase tracking-widest pb-2 ${activeCategory === cat ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-400 hover:text-stone-600'}`}>{cat}</button>
                ))}
             </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {publicMenuItems.map(dish => <MenuCard key={dish.id} dish={dish} />)}
          </div>
        </section>

        <section id="reserve" className="py-32 bg-white border-t">
          <div className="max-w-4xl mx-auto px-4">
             <div className="text-center mb-16">
                <h2 className="text-5xl font-serif font-bold italic mb-4 leading-tight">Réserver une Table</h2>
                <p className="text-stone-500 font-light italic">Vivez une expérience gastronomique authentique.</p>
             </div>
             <ReservationForm />
          </div>
        </section>

        <footer className="bg-stone-950 text-white pt-32 pb-12 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-32 items-start">
              <div className="space-y-12">
                <div className="flex items-center gap-4">
                  <Logo className="w-16 h-16 text-orange-500" />
                  <div className="flex flex-col">
                    <span className="text-3xl font-serif italic font-bold tracking-tight uppercase">Grand Bassam</span>
                    <span className="text-[10px] text-stone-500 font-black uppercase tracking-[0.4em]">Niamey • Kouara Kano</span>
                  </div>
                </div>
                <div className="flex flex-col gap-8 p-10 bg-white/5 rounded-[4rem] border border-white/5 items-center text-center">
                   <QRCodeComponent className="w-56 h-64" />
                   <p className="text-sm font-light text-stone-400">Scannez pour commander en ligne.</p>
                </div>
              </div>
              
              <div className="lg:pt-6 space-y-12">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 mb-6 border-b border-white/10 pb-4">Contacts</h4>
                  <div className="space-y-6">
                    <a href={`tel:${PHONE.replace(/\s+/g, '')}`} className="block">
                      <span className="text-[10px] font-black text-stone-500 uppercase block mb-2">Réservations</span>
                      <span className="text-3xl font-bold hover:text-orange-500 transition-colors">{PHONE}</span>
                    </a>
                    <div>
                      <span className="text-[10px] font-black text-stone-500 uppercase block mb-2">Localisation</span>
                      <span className="text-lg font-bold block">{LOCATION}</span>
                    </div>
                  </div>
                </div>

                {/* VISIBLE ADMIN ACCESS */}
                <div className="pt-8">
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase text-stone-500 block">Espace Professionnel</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-white group-hover:text-orange-500">Connexion Gérant</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-16 border-t border-white/5 flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-700">© {new Date().getFullYear()} {RESTAURANT_NAME} Niamey.</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-800 italic">Saveurs d'Abidjan</span>
            </div>
          </div>
        </footer>
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-stone-950/98 z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full shadow-2xl relative">
            <div className="text-center mb-8">
               <Logo className="w-12 h-12 mx-auto mb-4" />
               <h2 className="text-2xl font-bold font-serif italic uppercase">Accès Gérant</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="Identifiant" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 font-bold focus:ring-2 focus:ring-orange-500 outline-none" required />
              <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-5 bg-stone-50 rounded-2xl border border-stone-100 font-bold focus:ring-2 focus:ring-orange-500 outline-none" required />
              {loginError && <p className="text-red-500 text-[10px] text-center font-bold uppercase">{loginError}</p>}
              <button type="submit" className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-orange-600 transition-all">SE CONNECTER</button>
              <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-stone-400 text-[10px] font-black uppercase mt-4">Fermer</button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PORTAL PANEL */}
      {isAdminMode && showAdminPortal !== 'none' && (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col no-print">
          <div className="p-8 border-b flex justify-between items-center bg-stone-50">
            <h2 className="text-3xl font-serif font-bold italic uppercase text-stone-900">
               {showAdminPortal === 'orders' && "Journal des Commandes"}
               {showAdminPortal === 'reservations' && "Gestion des Réservations"}
               {showAdminPortal === 'accounting' && "Bilan Financier"}
               {showAdminPortal === 'menu_manager' && "Éditeur de Carte"}
            </h2>
            <button onClick={() => setShowAdminPortal('none')} className="w-12 h-12 flex items-center justify-center bg-white border rounded-full hover:bg-stone-100">✕</button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
            {showAdminPortal === 'orders' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex gap-4 mb-8">
                  {['Tous', 'Nouveau', 'Payé'].map(f => (
                    <button key={f} onClick={() => setOrderFilter(f as any)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase border ${orderFilter === f ? 'bg-stone-900 text-white' : 'bg-white text-stone-400'}`}>{f}</button>
                  ))}
                </div>
                {filteredOrders.length === 0 ? <p className="text-center py-20 text-stone-400 font-bold">AUCUNE COMMANDE</p> : 
                  filteredOrders.map(order => (
                    <div key={order.id} className={`p-8 border rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 ${order.status === 'Payé' ? 'bg-stone-50 border-stone-200' : 'bg-white border-orange-100 shadow-xl'}`}>
                      <div className="space-y-2">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${order.status === 'Payé' ? 'bg-green-100 text-green-600' : 'bg-orange-600 text-white'}`}>{order.status}</span>
                         <h3 className="text-2xl font-bold">{order.dishName} <span className="text-orange-600">x{order.quantity}</span></h3>
                         <p className="text-sm font-medium text-stone-500">{order.customerName} • {order.customerPhone}</p>
                         <p className="text-[10px] font-bold text-stone-400 uppercase">{order.isDelivery ? `LIVRAISON : ${order.address}` : `SUR PLACE : TABLE ${order.tableNumber}`}</p>
                      </div>
                      <div className="flex gap-3">
                         <button onClick={() => updateOrderStatus(order.id, order.status === 'Payé' ? 'Nouveau' : 'Payé')} className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">MARQUER {order.status === 'Payé' ? 'NON PAYÉ' : 'PAYÉ'}</button>
                         <button onClick={() => deleteOrder(order.id)} className="p-3 text-red-500 bg-red-50 rounded-xl">✕</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {showAdminPortal === 'reservations' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {reservations.length === 0 ? <p className="col-span-full text-center py-20 text-stone-400 font-bold">AUCUNE RÉSERVATION</p> : 
                  reservations.map(res => (
                    <div key={res.id} className="p-8 border rounded-[2.5rem] bg-white shadow-sm flex flex-col h-full">
                       <div className="flex justify-between items-start mb-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${res.status === 'Confirmé' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{res.status}</span>
                          <span className="text-[10px] font-bold text-stone-400">{new Date(res.timestamp).toLocaleDateString()}</span>
                       </div>
                       <h3 className="text-xl font-bold mb-1">{res.name}</h3>
                       <p className="text-sm text-stone-500 font-bold mb-4">{res.phone}</p>
                       <div className="bg-stone-50 p-4 rounded-2xl space-y-2 mb-6 text-sm font-medium">
                          <p>📅 {res.date}</p>
                          <p>👥 {res.guests}</p>
                          {res.message && <p className="italic text-stone-400 text-xs">"{res.message}"</p>}
                       </div>
                       <div className="mt-auto flex gap-2">
                          <button onClick={() => updateReservationStatus(res.id, 'Confirmé')} className="flex-1 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase">Confirmer</button>
                          <button onClick={() => deleteReservation(res.id)} className="px-4 py-3 bg-red-50 text-red-500 rounded-xl">✕</button>
                       </div>
                    </div>
                  ))
                }
              </div>
            )}

            {showAdminPortal === 'accounting' && (
              <div className="max-w-4xl mx-auto space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-10 bg-stone-900 text-white rounded-[2.5rem] text-center border-b-4 border-orange-600 shadow-xl">
                       <p className="text-[10px] font-black uppercase text-stone-500 mb-2">Total Commandes</p>
                       <p className="text-4xl font-serif italic text-orange-400 font-bold">{stats.total.toLocaleString()} F</p>
                    </div>
                    <div className="p-10 bg-green-50 rounded-[2.5rem] text-center border border-green-100">
                       <p className="text-[10px] font-black uppercase text-green-500 mb-2">Total Encaissé</p>
                       <p className="text-4xl font-serif italic text-green-700 font-bold">{stats.paid.toLocaleString()} F</p>
                    </div>
                    <div className="p-10 bg-orange-50 rounded-[2.5rem] text-center border border-orange-100">
                       <p className="text-[10px] font-black uppercase text-orange-500 mb-2">Restant à Percevoir</p>
                       <p className="text-4xl font-serif italic text-orange-700 font-bold">{stats.pending.toLocaleString()} F</p>
                    </div>
                 </div>
                 <div className="bg-white border rounded-[2.5rem] p-10">
                    <h4 className="text-xl font-serif font-bold italic mb-6">Répartition par plat</h4>
                    <div className="space-y-4">
                       {Array.from(new Set(orders.map(o => o.dishName))).map(dish => {
                          const dishTotal = orders.filter(o => o.dishName === dish).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                          const percentage = (dishTotal / stats.total) * 100 || 0;
                          return (
                            <div key={dish} className="space-y-1">
                               <div className="flex justify-between text-xs font-bold uppercase">
                                  <span>{dish}</span>
                                  <span>{dishTotal.toLocaleString()} F</span>
                               </div>
                               <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-600 rounded-full" style={{ width: `${percentage}%` }}></div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
              </div>
            )}

            {showAdminPortal === 'menu_manager' && (
              <div className="max-w-5xl mx-auto space-y-10">
                 <div className="flex justify-between items-center bg-stone-50 p-8 rounded-[2rem] border">
                    <h3 className="text-2xl font-serif font-bold italic">Gestion de la Carte</h3>
                    <button onClick={addDish} className="bg-stone-900 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Nouveau Plat +</button>
                 </div>
                 <div className="grid gap-6">
                    {menuItems.map(dish => (
                      <div key={dish.id} className="p-8 border rounded-[2.5rem] bg-white shadow-sm flex flex-col md:flex-row gap-8">
                         <img src={dish.image} className="w-full md:w-48 h-48 rounded-[2rem] object-cover bg-stone-100" alt="" />
                         <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-[9px] font-black text-stone-400 uppercase mb-1">Nom du Plat</label>
                                  <input type="text" value={dish.name} onChange={e => updateDish(dish.id, {name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl text-sm font-bold border border-stone-100" />
                               </div>
                               <div>
                                  <label className="block text-[9px] font-black text-stone-400 uppercase mb-1">Prix (FCFA)</label>
                                  <input type="number" value={dish.price} onChange={e => updateDish(dish.id, {price: parseInt(e.target.value) || 0})} className="w-full p-4 bg-stone-50 rounded-2xl text-sm font-bold border border-stone-100" />
                               </div>
                               <div>
                                  <label className="block text-[9px] font-black text-stone-400 uppercase mb-1">Catégorie</label>
                                  <select value={dish.category} onChange={e => updateDish(dish.id, {category: e.target.value as any})} className="w-full p-4 bg-stone-50 rounded-2xl text-sm font-bold border border-stone-100 uppercase">
                                     <option value="entrée">Entrée</option><option value="plat">Plat</option><option value="dessert">Dessert</option><option value="boisson">Boisson</option>
                                  </select>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-[9px] font-black text-stone-400 uppercase mb-1">URL Image</label>
                                  <input type="text" value={dish.image} onChange={e => updateDish(dish.id, {image: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl text-[10px] border border-stone-100" />
                               </div>
                               <div>
                                  <label className="block text-[9px] font-black text-stone-400 uppercase mb-1">Description</label>
                                  <textarea rows={3} value={dish.description} onChange={e => updateDish(dish.id, {description: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl text-sm border border-stone-100"></textarea>
                               </div>
                               <button onClick={() => deleteDish(dish.id)} className="w-full p-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl text-[10px] font-black uppercase">Supprimer ce plat</button>
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
    </div>
  );
};

export default App;
