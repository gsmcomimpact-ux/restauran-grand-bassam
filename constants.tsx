
import { Dish } from './types';

export const RESTAURANT_NAME = "RESTAURANT GRAND BASSAM";
export const LOCATION = "Kouara Kano, Niamey";
export const PHONE = "+227 8877 0594"; 
export const SITE_URL = "http://dazzling-green-mammoth.31-22-4-93.cpanel.site/";

export const MENU_ITEMS: Dish[] = [
  {
    id: 'foutou-graine',
    name: 'Foutou Banane Sauce Graine',
    description: 'Boules de foutou banane onctueuses servies avec une sauce graine riche à la viande de bœuf, queue de bœuf et crabe de mer.',
    price: 6500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'placali-sauce',
    name: 'Placali Sauce Kpala',
    description: 'Pâte de manioc fermentée accompagnée d\'une sauce gluante traditionnelle (Kpala), riche en poissons fumés et crevettes.',
    price: 5000,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1589187151032-573a91317445?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'attieke-thon',
    name: 'Attiéké Poisson Thon',
    description: 'La célèbre semoule de manioc ivoirienne servie avec du thon frit croustillant, des oignons, des tomates fraîches et piment local.',
    price: 4500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'kedjenou-trad',
    name: 'Kedjenou de Poulet',
    description: 'Ragoût de poulet forestier cuit à l\'étouffée avec tomates, oignons et piments. Un classique de la gastronomie ivoirienne.',
    price: 6000,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'alloco-poisson',
    name: 'Alloco Poisson Frit',
    description: 'Dés de bananes plantains frites servis avec un poisson braisé ou frit et notre fameuse sauce tomate maison épicée.',
    price: 5500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'garba-premium',
    name: 'Garba de Luxe',
    description: 'Attiéké à l\'huile de friture de thon, servi avec des morceaux de thon frits et une garniture généreuse de piment frais.',
    price: 3500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
  }
];
