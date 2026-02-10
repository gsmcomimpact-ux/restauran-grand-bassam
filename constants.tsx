import { Dish } from './types';

export const RESTAURANT_NAME = "RESTAURANT GRAND BASSAM";
export const TAGLINE = "L'Excellence de la Gastronomie Ivoirienne";
export const LOCATION = "Kouara Kano, Niamey (Près de l'Ambassade de CI)";
export const PHONE = "+22788770594"; 
export const DISPLAY_PHONE = "+227 88 77 05 94"; 
export const SITE_URL = "https://restaurant-grand-bassam.vercel.app/";
export const DELIVERY_FEE = 1000;

export const MENU_ITEMS: Dish[] = [
  {
    id: 'garba-complet',
    name: 'Garba Royal (Attiéké Thon)',
    description: 'L\'emblème de la street-food ivoirienne : Attiéké de qualité, thon frit croustillant, piment frais, oignons et tomates.',
    price: 3500,
    category: 'plat',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7Dw740QswAoxEcKWaSQpsQfCjqAMOI2ZiJA&s'
  },
  {
    id: 'kedjenou-poulet',
    name: 'Kedjenou de Poulet',
    description: 'Poulet cuit à l\'étouffée dans son jus avec légumes et aromates. Servi avec son attiéké fondant.',
    price: 6500,
    category: 'plat',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxBASKqVE5FOWtJLf8VihwxTUEbPvgpHDpLA&s'
  },
  {
    id: 'pintade-four',
    name: 'Pintade au Four',
    description: 'Pintade fermière marinée aux épices du terroir et rôtie à la perfection. Servie avec accompagnement au choix.',
    price: 8500,
    category: 'plat',
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'poulet-fourre',
    name: 'Poulet Fourré Spécial',
    description: 'Poulet entier farci aux légumes croquants et aromates traditionnels, doré au four.',
    price: 8000,
    category: 'plat',
    image: 'https://www.lequotidien.com.tn/images/2023/07/17/Messenger_creation_2e6c0555-b099-45f7-aae6-25a2187a4c64.jpeg'
  },
  {
    id: 'riz-tchep',
    name: 'Riz Tchep Ivoirien',
    description: 'Le célèbre riz rouge cuit dans un bouillon de légumes et épices, servi avec poisson ou viande.',
    price: 5000,
    category: 'plat',
    image: 'https://www.mesepices.com/_i/48378/5406/865/10/thieboudienne.jpeg'
  },
  {
    id: 'riz-sauce',
    name: 'Riz Sauce Gombo/Tomate',
    description: 'Riz blanc parfumé accompagné d\'une sauce onctueuse au choix (Gombo frais ou Tomate cuisinée).',
    price: 4000,
    category: 'plat',
    image: 'https://lefaso.net/local/cache-vignettes/L500xH374/arton97293-3626c.jpg?1769576225'
  },
  {
    id: 'riz-soubala',
    name: 'Riz Soubala au Poulet',
    description: 'Riz traditionnel parfumé au néré (soumbala), une explosion de saveurs authentiques, servi avec poulet frit.',
    price: 5500,
    category: 'plat',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1SmXiCrqORfWJ_XU8Q8n3PNaPYq7Ocq73Nw&s'
  },
  {
    id: 'capitaine-braise',
    name: 'Capitaine Braisé Alloco',
    description: 'Le roi des poissons de lagune : Capitaine frais braisé à la perfection, servi avec Alloco croustillant et sa sauce oignon-tomate.',
    price: 9500,
    category: 'plat',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHuJ_TJ-0pKpfFGp9lwdMTnmYOycjj7gW2of9-Tx1e4CNwPBzAPu6fbz_rKU7hcYIIIEo&usqp=CAU'
  },
  {
    id: 'foutou-graine',
    name: 'Foutou Banane Sauce Graine',
    description: 'Boule de foutou banane servie avec une sauce graine onctueuse à la viande de bœuf et tripes.',
    price: 6000,
    category: 'plat',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYZXXLkG0tifE1J8CQO2cNx3KHAhGx8Qcd9g&s'
  },
  {
    id: 'placali-kpala',
    name: 'Placali Sauce Kpala',
    description: 'Pâte de manioc fermentée accompagnée d\'une sauce gluante aux poissons fumés et crustacés.',
    price: 5500,
    category: 'plat',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Placali_avec_sauce_gombo.jpg/250px-Placali_avec_sauce_gombo.jpg'
  },
  {
    id: 'poisson-braise',
    name: 'Carpe Braisée Alloco',
    description: 'Carpe fraîche grillée au charbon, servie avec Alloco (plantains frites) et une sauce koutoukou.',
    price: 8500,
    category: 'plat',
    image: 'https://i.ytimg.com/vi/cxUzbz9c9d8/maxresdefault.jpg'
  },
  {
    id: 'alloco-simple',
    name: 'Alloco Spécial',
    description: 'Bananes plantains mûres frites, servies avec piment noir et petits poissons de friture.',
    price: 2500,
    category: 'entrée',
    image: 'https://www.geo.fr/imgre/fit/http.3A.2F.2Fprd2-bone-image.2Es3-website-eu-west-1.2Eamazonaws.2Ecom.2Fgeo.2F2019.2F10.2F17.2F2067ca91-a898-4e0a-9c8e-8f9142d43d6e.2Ejpeg/1200x900/focusPoint/50%2C50/tout-savoir-sur-l-alloco-ce-delice-venu-de-cote-d-ivoire.jpg'
  },
  {
    id: 'bissap',
    name: 'Bissap Rouge Maison',
    description: 'Fleurs d\'hibiscus infusées à la menthe et à la vanille. Servi givré.',
    price: 1500,
    category: 'boisson',
    image: 'https://cuisinovores.com/wp-content/uploads/2025/04/photo_jus_bissap_cuisinovores-500x375.webp'
  },
  {
    id: 'gnamankou',
    name: 'Jus de Gingembre (Gnamankou)',
    description: 'Puissant et rafraîchissant, au gingembre frais et citron vert.',
    price: 1500,
    category: 'boisson',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqBp1qmoJQcRfSoEcybfWoBgCCnI4D9TIhvw&s'
  }
];