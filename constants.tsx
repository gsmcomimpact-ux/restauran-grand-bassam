
import { Dish } from './types';

export const RESTAURANT_NAME = "Grand Bassam";
export const LOCATION = "Kouara Kano, Niamey";
export const PHONE = "+227 8877 0594"; 

export const MENU_ITEMS: Dish[] = [
  {
    id: 'foutou-graine',
    name: 'Foutou Banane Sauce Graine',
    description: 'Boules de foutou banane onctueuses servies avec une sauce graine riche à la viande et au crabe.',
    price: 6500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'placali-sauce',
    name: 'Placali Sauce Kpala',
    description: 'Pâte de manioc fermentée accompagnée d\'une sauce gluante traditionnelle, riche en saveurs de mer.',
    price: 5000,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1589187151032-573a91317445?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'attieke-thon',
    name: 'Attiéké Poisson Thon',
    description: 'Semoule de manioc légère servie avec du thon frit, des oignons frais, des tomates et du piment.',
    price: 4500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'kedjenou-trad',
    name: 'Kedjenou de Poulet',
    description: 'Ragoût de poulet cuit à l\'étouffée avec des légumes frais dans son propre jus.',
    price: 6000,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'poulet-dg-ivoire',
    name: 'Poulet DG Bassam',
    description: 'Un mélange savoureux de poulet, de plantains frits et de légumes colorés.',
    price: 7000,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'alloco-poisson',
    name: 'Alloco Poisson Frit',
    description: 'Bananes plantains frites servies avec un beau poisson doré et une sauce tomate épicée.',
    price: 5500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800'
  }
];
