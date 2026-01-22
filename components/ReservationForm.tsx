
import React, { useState } from 'react';
import { PHONE } from '../constants';
import { Reservation } from '../types';

const ReservationForm: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    guests: '2 personnes',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const newReservation: Reservation = {
      id: Date.now().toString(),
      ...formData,
      status: 'En attente',
      timestamp: new Date().toISOString()
    };

    const existingReservations = JSON.parse(localStorage.getItem('grand_bassam_reservations') || '[]');
    localStorage.setItem('grand_bassam_reservations', JSON.stringify([newReservation, ...existingReservations]));

    let waMessage = `*RÉSERVATION - RESTAURANT GRAND B*\n\n`;
    waMessage += `*Nom :* ${formData.name}\n`;
    waMessage += `*Téléphone :* ${formData.phone}\n`;
    waMessage += `*Date :* ${formData.date}\n`;
    waMessage += `*Couverts :* ${formData.guests}\n`;
    
    if (formData.message) {
      waMessage += `*Note :* ${formData.message}\n`;
    }

    const whatsappUrl = `https://wa.me/${PHONE.replace(/\s+/g, '')}?text=${encodeURIComponent(waMessage)}`;
    
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setStatus('success');
    }, 800);
  };

  if (status === 'success') {
    return (
      <div 
        className="bg-green-50 p-8 rounded-2xl text-center border border-green-200 animate-in fade-in zoom-in duration-300"
        role="alert"
        aria-live="assertive"
      >
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-green-200" aria-hidden="true">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2 font-serif italic">Message Envoyé !</h3>
        <p className="text-green-700">Votre demande de réservation a été enregistrée et envoyée via WhatsApp.</p>
        <button onClick={() => setStatus('idle')} className="mt-6 text-green-800 font-bold uppercase text-xs tracking-widest hover:text-orange-600 transition">Nouvelle réservation</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="reservation-title">
      <h2 id="reservation-title" className="sr-only">Formulaire de réservation</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="res-name" className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Nom Complet</label>
          <input 
            id="res-name"
            required 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-stone-800 transition-all" 
            placeholder="Ex: Abdoul Razak" 
          />
        </div>
        <div>
          <label htmlFor="res-phone" className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
          <input 
            id="res-phone"
            required 
            type="tel" 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-stone-800 transition-all" 
            placeholder="+227 00 00 00 00" 
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="res-date" className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
          <input 
            id="res-date"
            required 
            type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({...formData, date: e.target.value})} 
            className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-stone-800 transition-all" 
          />
        </div>
        <div>
          <label htmlFor="res-guests" className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Nombre de personnes</label>
          <select 
            id="res-guests"
            value={formData.guests} 
            onChange={(e) => setFormData({...formData, guests: e.target.value})} 
            className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-stone-800 transition-all"
          >
            <option>1 personne</option>
            <option>2 personnes</option>
            <option>3 personnes</option>
            <option>4 personnes</option>
            <option>5 personnes</option>
            <option>6 personnes</option>
            <option>Groupe (Plus de 6)</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="res-message" className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Message ou demande spéciale</label>
        <textarea 
          id="res-message"
          rows={3} 
          value={formData.message} 
          onChange={(e) => setFormData({...formData, message: e.target.value})} 
          className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-stone-800 transition-all resize-none" 
          placeholder="Une occasion particulière ? Allergies ?"
        ></textarea>
      </div>
      <button 
        type="submit" 
        disabled={status === 'loading'} 
        className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {status === 'loading' ? 'ENVOI...' : 'Réserver via WhatsApp'}
      </button>
    </form>
  );
};

export default ReservationForm;
