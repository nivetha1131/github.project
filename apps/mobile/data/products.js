export const productCatalog = Array.from({ length: 54 }, (_, index) => {
  const categoryTemplates = [
    { type: 'Purifier', prefix: 'AquaPure', suffix: 'RO+UV', price: 3799 },
    { type: 'Purifier', prefix: 'PureZen', suffix: 'UF', price: 4299 },
    { type: 'Dispenser', prefix: 'HydraFlow', suffix: 'Hot & Cold', price: 6999 },
    { type: 'Pump', prefix: 'FlowBoost', suffix: 'Booster Pump', price: 2599 },
    { type: 'Filter', prefix: 'ClearGuard', suffix: 'Carbon Filter', price: 1499 },
    { type: 'Spare', prefix: 'GuardFit', suffix: 'Spare Kit', price: 799 },
  ];

  const template = categoryTemplates[index % categoryTemplates.length];
  const variant = index + 1;
  const model = `${template.prefix} ${variant}`;
  const imageMap = {
    Purifier:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    Dispenser:
      'https://images.unsplash.com/photo-1624555130581-1d9b4d7d6d3a?auto=format&fit=crop&w=900&q=80',
    Pump:
      'https://images.unsplash.com/photo-1600369677036-1f6256781e52?auto=format&fit=crop&w=900&q=80',
    Filter:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80',
    Spare:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  };

  return {
    id: `prod-${variant}`,
    name: `${model} ${template.suffix}`,
    category: template.type,
    price: template.price + (variant % 6) * 150,
    dealerPrice: Math.max(699, template.price - 700 + (variant % 5) * 120),
    rating: (3.8 + ((variant % 7) * 0.2)).toFixed(1),
    stock: 20 + (variant % 9) * 8,
    image: imageMap[template.type],
    description: `High-efficiency ${template.type.toLowerCase()} designed for modern homes and small commercial spaces.`,
  };
});

export const demoOrders = [
  {
    id: 'ORD-1802',
    date: '22 Oct 2026',
    status: 'Delivered',
    total: 8299,
    items: ['AquaPure 12 RO+UV', 'HydraFlow 2 Hot & Cold'],
  },
  {
    id: 'ORD-1808',
    date: '17 Oct 2026',
    status: 'In transit',
    total: 5699,
    items: ['PureZen 8 UF'],
  },
  {
    id: 'ORD-1816',
    date: '11 Oct 2026',
    status: 'Booked',
    total: 1599,
    items: ['ClearGuard Carbon Filter'],
  },
];

export const serviceBookings = [
  {
    id: 'SER-401',
    type: 'Annual maintenance',
    date: '28 Oct 2026',
    status: 'Confirmed',
    address: 'Banjara Hills, Hyderabad',
  },
  {
    id: 'SER-408',
    type: 'Filter replacement',
    date: '02 Nov 2026',
    status: 'Pending',
    address: 'Madhapur, Hyderabad',
  },
];
