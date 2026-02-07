
import { Dish } from './types';

export const RESTAURANT_NAME = "RESTAURANT GRAND BASSAM";
export const LOCATION = "Kouara Kano, Niamey";
export const PHONE = "+227 8877 0594"; 
export const SITE_URL = "http://dazzling-green-mammoth.31-22-4-93.cpanel.site/";

export const MENU_ITEMS: Dish[] = [
  {
    id: 'kedjenou-poulet',
    name: 'Kedjenou de Poulet Traditionnel',
    description: 'Poulet braisé à l\'étouffée avec tomates fraîches, oignons, poivrons et piments. Servi avec de l\'attiéké ou du riz.',
    price: 6500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'garba-ivoirien',
    name: 'Le Garba (Attiéké au Thon)',
    description: 'Le plat national par excellence. Attiéké de qualité supérieure servi avec du thon frit, des oignons et du piment frais haché.',
    price: 3500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'foutou-banane-graine',
    name: 'Foutou Banane Sauce Graine',
    description: 'Boule de foutou (banane et manioc) onctueuse accompagnée d\'une sauce graine riche à la viande de bœuf et crabe.',
    price: 6000,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'placali-kpala',
    name: 'Placali Sauce Kpala',
    description: 'Pâte de manioc fermentée servie avec une sauce gluante (Kpala) enrichie aux poissons fumés et crevettes séchées.',
    price: 5000,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1589187151032-573a91317445?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'poisson-braise-alloco',
    name: 'Carpe Braisée & Alloco',
    description: 'Poisson frais braisé au charbon de bois, servi avec des bananes plantains frites (Alloco) et une sauce tomate épicée.',
    price: 7500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'riz-gras-ivoirien',
    name: 'Riz Gras (Thieboudienne Ivoirien)',
    description: 'Riz cuit dans un bouillon de tomates et d\'épices avec des légumes frais (carottes, choux) et du poulet ou du poisson.',
    price: 4500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800'
  }
];
