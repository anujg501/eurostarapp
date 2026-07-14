// The 18 real Eurostar SKUs (extracted from the storefront's app/data.jsx).
// Prices are fixed INR wholesale rates per unit-of-sale. Served to the mobile
// app and any API consumer so they show the same items/prices as the website.

export type Product = {
  id: string;
  name: string;
  cat: string;
  tone: string;
  shape: string;
  size: string;
  clarity: string;
  price: number;
  unit: string;
  moq: number;
  stock: 'in' | 'low' | 'out';
  stockCount: number;
  badge?: string;
  desc?: string;
};

export const PRODUCTS: Product[] = [
  { id: 'EUR-MOI-0107', name: 'Moissanite DEF White', cat: 'moissanite', tone: 'def-white', shape: 'round', size: '6.5 mm', clarity: 'VVS', price: 1850, unit: 'per pc', moq: 10, stock: 'in', stockCount: 482, badge: 'Bestseller', desc: 'GRA-certified D-E-F colour, VVS clarity. Hearts & arrows precision cut.' },
  { id: 'EUR-MOI-0203', name: 'Moissanite Oval Brilliant', cat: 'moissanite', tone: 'def-white', shape: 'oval', size: '7×5 mm', clarity: 'VVS', price: 2140, unit: 'per pc', moq: 6, stock: 'in', stockCount: 178 },
  { id: 'EUR-MOI-0412', name: 'Moissanite Princess', cat: 'moissanite', tone: 'def-white', shape: 'princess', size: '5 mm', clarity: 'VVS', price: 1650, unit: 'per pc', moq: 10, stock: 'in', stockCount: 304 },
  { id: 'EUR-LAB-0518', name: 'Royal Blue Sapphire', cat: 'labgrown', tone: 'royal-blue', shape: 'oval', size: '8×6 mm', clarity: 'Eye-clean', price: 980, unit: 'per pc', moq: 12, stock: 'in', stockCount: 96, badge: 'New' },
  { id: 'EUR-LAB-0621', name: 'Emperor Green Emerald', cat: 'labgrown', tone: 'emperor-green', shape: 'emerald', size: '7×5 mm', clarity: 'Eye-clean', price: 1120, unit: 'per pc', moq: 12, stock: 'in', stockCount: 64 },
  { id: 'EUR-LAB-0724', name: 'Pigeon Blood Ruby', cat: 'labgrown', tone: 'pigeon-blood', shape: 'cushion', size: '6 mm', clarity: 'AAA', price: 1280, unit: 'per pc', moq: 10, stock: 'low', stockCount: 18 },
  { id: 'EUR-LAB-0810', name: 'Canary Yellow Sapphire', cat: 'labgrown', tone: 'canary', shape: 'round', size: '5 mm', clarity: 'AAA', price: 740, unit: 'per pc', moq: 20, stock: 'in', stockCount: 220 },
  { id: 'EUR-LAB-0911', name: 'Fairy Pink Sapphire', cat: 'labgrown', tone: 'fairy-pink', shape: 'pear', size: '7×5 mm', clarity: 'AAA', price: 880, unit: 'per pc', moq: 10, stock: 'in', stockCount: 142 },
  { id: 'EUR-LAB-1014', name: 'Lavender Corundum', cat: 'labgrown', tone: 'lavender', shape: 'heart', size: '6×6 mm', clarity: 'AAA', price: 940, unit: 'per pc', moq: 8, stock: 'in', stockCount: 74 },
  { id: 'EUR-LAB-1108', name: 'Tsavourite Green Garnet', cat: 'labgrown', tone: 'tsavourite', shape: 'oval', size: '6×4 mm', clarity: 'AA', price: 620, unit: 'per pc', moq: 20, stock: 'in', stockCount: 280 },
  { id: 'EUR-CZ-0301', name: 'DEF White CZ Round', cat: 'cz', tone: 'def-white', shape: 'round', size: '4 mm', clarity: 'AAAAA', price: 32, unit: 'per pc', moq: 100, stock: 'in', stockCount: 12400 },
  { id: 'EUR-CZ-0411', name: 'Cornflower Blue CZ', cat: 'cz', tone: 'cornflower', shape: 'oval', size: '6×4 mm', clarity: 'AAAAA', price: 48, unit: 'per pc', moq: 100, stock: 'in', stockCount: 8200 },
  { id: 'EUR-CZ-0512', name: 'Pigeon Blood CZ', cat: 'cz', tone: 'pigeon-blood', shape: 'cushion', size: '5 mm', clarity: 'AAAAA', price: 38, unit: 'per pc', moq: 100, stock: 'in', stockCount: 6100 },
  { id: 'EUR-CZ-0715', name: 'Rubylite CZ', cat: 'cz', tone: 'rubylite', shape: 'marquise', size: '8×4 mm', clarity: 'AAAA', price: 56, unit: 'per pc', moq: 50, stock: 'in', stockCount: 3400 },
  { id: 'EUR-FAN-0203', name: 'Ice Cut Hexagon', cat: 'fancycut', tone: 'def-white', shape: 'trillion', size: '5 mm', clarity: 'VVS', price: 420, unit: 'per pc', moq: 20, stock: 'low', stockCount: 36, badge: 'Trending' },
  { id: 'EUR-FAN-0309', name: 'Rose Cut Briolette', cat: 'fancycut', tone: 'def-white', shape: 'pear', size: '8×5 mm', clarity: 'SI', price: 380, unit: 'per pc', moq: 20, stock: 'in', stockCount: 184 },
  { id: 'EUR-PRL-0105', name: 'Akoya Pearl Strand', cat: 'pearls', tone: 'def-white', shape: 'round', size: '7-7.5 mm', clarity: 'AAA', price: 4200, unit: 'per strand', moq: 5, stock: 'in', stockCount: 42 },
  { id: 'EUR-NAV-0001', name: 'Navratna Matched Set', cat: 'navratna', tone: 'def-white', shape: 'round', size: '4-6 mm', clarity: 'Certified', price: 12800, unit: 'per set', moq: 1, stock: 'low', stockCount: 9, badge: 'Curated' },
];
