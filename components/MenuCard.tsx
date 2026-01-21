
import React, { useState } from 'react';
import { Dish } from '../types';
import { PHONE } from '../constants';

interface MenuCardProps {
  dish: Dish;
}

const MenuCard: React.FC<MenuCardProps> = ({ dish }) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    delivery: false,
    address: '',
    tableNumber: ''
  });

  const handleFinalizeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalPrice = dish.price * quantity;

    // Save to local history for admin
    const newOrder = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      dishName: dish.name,
      price: dish.price,
      quantity: quantity,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      isDelivery: customerInfo.delivery,
      address: customerInfo.address,
      tableNumber: customerInfo.tableNumber,
      status: 'Nouveau'
    };

    const existingOrders = JSON.parse(localStorage.getItem('grand_bassam_orders') || '[]');
    localStorage.setItem('grand_bassam_orders', JSON.stringify([newOrder, ...existingOrders]));

    // Generate WhatsApp message
    let message = `*NOUVELLE COMMANDE - GRAND BASSAM*\n\n`;
    message += `*Client :* ${customerInfo.name}\n`;
    message += `*Téléphone :* ${customerInfo.phone}\n`;
    message += `*Plat :* ${dish.name} (x${quantity})\n`;
    message += `*Total :* ${totalPrice} FCFA\n`;
    
    if (customerInfo.delivery) {
      message += `*Type :* 🚀 Livraison à domicile\n`;
      if (customerInfo.address) message += `*Adresse :* ${customerInfo.address}\n`;
    } else {
      message += `*Type :* 🍽️ Sur place\n`;
      if (customerInfo.tableNumber) message += `*Table :* #${customerInfo.tableNumber}\n`;
    }

    const whatsappUrl = `https://wa.me/${PHONE.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowOrderModal(false);
    
    // Reset form
    setCustomerInfo({ name: '', phone: '', delivery: false, address: '', tableNumber: '' });
    setQuantity(1);
  };

  return (
    <>
      <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-stone-100 flex flex-col h-full">
        <div className="relative h-64 overflow-hidden">
          <img 
            src={dish.image} 
            alt={dish.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 right-4 bg-orange-600 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-lg">
            {dish.price} FCFA
          </div>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
        </div>
        <div className="p-8 flex flex-col flex-grow bg-white">
          <h3 className="text-2xl font-bold text-stone-800 mb-3">{dish.name}</h3>
          <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-grow">
            {dish.description}
          </p>
          <button 
            onClick={() => setShowOrderModal(true)}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl hover:bg-orange-600 transition-colors font-bold flex items-center justify-center gap-2 group/btn"
          >
            <span>Commander</span>
            <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setShowOrderModal(false)} 
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-stone-900 font-serif mb-1 italic">Détails de la commande</h3>
              <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">{dish.name}</p>
            </div>

            <form onSubmit={handleFinalizeOrder} className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between border border-stone-100">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nombre de plats</span>
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm font-bold"
                  >–</button>
                  <span className="w-8 text-center font-black text-lg">{quantity}</span>
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm font-bold"
                  >+</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Votre Nom</label>
                <input 
                  required
                  type="text" 
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-stone-800" 
                  placeholder="Ex: Moussa Koné"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
                <input 
                  required
                  type="tel" 
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-stone-800" 
                  placeholder="Votre numéro"
                />
              </div>

              <div className="flex items-center gap-3 p-1">
                <input 
                  type="checkbox" 
                  id={`delivery-${dish.id}`}
                  checked={customerInfo.delivery}
                  onChange={(e) => setCustomerInfo({...customerInfo, delivery: e.target.checked})}
                  className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
                />
                <label htmlFor={`delivery-${dish.id}`} className="text-sm font-bold text-stone-700 cursor-pointer">Livraison à domicile</label>
              </div>

              {customerInfo.delivery ? (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Adresse de livraison</label>
                  <textarea 
                    required
                    rows={2}
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-stone-800" 
                    placeholder="Quartier, rue, porte..."
                  />
                </div>
              ) : (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Numéro de table (Facultatif)</label>
                  <input 
                    type="text" 
                    value={customerInfo.tableNumber}
                    onChange={(e) => setCustomerInfo({...customerInfo, tableNumber: e.target.value})}
                    className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-stone-800" 
                    placeholder="Ex: 5"
                  />
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition shadow-xl flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="flex items-center gap-3">
                    <span>Finaliser via WhatsApp</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </span>
                  <span className="text-[10px] opacity-80 uppercase tracking-widest font-black">Total: {(dish.price * quantity).toLocaleString()} F</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuCard;
