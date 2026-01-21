
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'entrée' | 'plat' | 'dessert' | 'boisson';
  image: string;
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  guests: string;
  message?: string;
  status: 'Confirmé' | 'En attente' | 'Terminé';
  timestamp: string;
}

export interface OrderHistoryItem {
  id: string;
  timestamp: string;
  dishName: string;
  price: number;
  quantity: number;
  customerName: string;
  customerPhone: string;
  isDelivery: boolean;
  address: string;
  tableNumber?: string;
  status: 'Payé' | 'Nouveau';
}
