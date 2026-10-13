// Mock data layer. Services read from here; swapping to a real API means
// replacing the `mock:` callbacks in /services, nothing else.
const U = (id, w = 700) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
const P = (g, n) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

export const STATES = ['Lagos', 'Benin City', 'Abuja', 'Port Harcourt'];
export const STATE_SWAPS = { 'Lagos': 450, 'Benin City': 180, 'Abuja': 290, 'Port Harcourt': 210 };
export const stateLabel = h => `${h} State`;

export const CATEGORIES = [
  { name: 'Fresh Food & Farm Produce', emoji: '🥬' },
  { name: 'Meals & Jollof', emoji: '🍲' },
  { name: 'Home & Kitchen', emoji: '🍳' },
  { name: 'Furniture & Appliances', emoji: '🛋️' },
  { name: 'Electronics', emoji: '📱' },
  { name: 'Clothes & Fashion', emoji: '👗' },
  { name: 'Bags & Shoes', emoji: '👜' },
  { name: 'Wigs & Hair', emoji: '💇' },
  { name: 'Skincare & Beauty', emoji: '✨' },
  { name: 'Books & Education', emoji: '📚' },
  { name: 'Skills & Services', emoji: '🛠️' },
  { name: 'Others', emoji: '🎸' },
];
export const catEmoji = name => CATEGORIES.find(c => c.name === name)?.emoji || '📦';

export const DEMO = { name: 'Demo Trader', username: 'demo_trader', email: 'demo@barterly.com', password: 'Barterly123' };

export const people = [
  ['@chioma_farm', 'women', 44], ['@bukka_queen', 'women', 65], ['@glam_by_zainab', 'women', 12],
  ['@adenike_stitches', 'women', 33], ['@tech_plug', 'men', 22], ['@mama_ife_store', 'women', 68],
  ['@sound_master', 'men', 45], ['@lagos_style', 'men', 75], ['@tinu_hairs', 'women', 26],
  ['@agropower_ng', 'men', 52], ['@creativepro_ng', 'men', 36], ['@home_essentials', 'women', 90],
].map(([user, g, n]) => ({ user, photo: P(g, n) }));

const base = [
  ['Fresh Organic Yam Tubers (5 Large Pieces)', 'Fresh Food & Farm Produce', '1596591606975-97ee553a1eb0', '2 crates of fresh eggs or a bag of foreign rice'],
  ['Hot Native Seafood Jollof Rice & Plantain Party Pack', 'Meals & Jollof', '1563379091339-03b21ab4a4f8', 'Quality Ankara fabric or olive oil'],
  ['Natural Glow Vitamin C Face Serum', 'Skincare & Beauty', '1620916566398-39f1143ab7be', 'Designer female perfume or body mist'],
  ['Handmade Luxury Aso-Oke Gele & Ipele', 'Clothes & Fashion', '1583391733956-3750e0ff4e8b', 'Android smartphone or a good blender'],
  ['24-Inch Bone Straight Human Hair Wig', 'Wigs & Hair', '1519699047748-de8e457a634e', 'A clean iPad or laptop'],
  ['10-Piece Non-Stick Cookware Set', 'Home & Kitchen', '1556911220-e15b29be8c8f', 'Microwave oven or standing fan'],
  ['Samsung Galaxy A14 (128GB) with Box', 'Electronics', '1511707171634-5f897ff02aa9', 'A working 1.5kva generator'],
  ['Handmade Acoustic Guitar with Gig Bag', 'Others', '1510915361894-db8b6010cb5c', 'Mechanical keyboard or gaming headset'],
  ['Luxury Oud Perfume Set', 'Skincare & Beauty', '1541643600914-78b084683601', 'Human hair wig'],
  ['Blender & Kitchen Food Processor', 'Home & Kitchen', '1570222094114-d074f7e2e36e', 'Fresh farm produce or yam'],
  ['Smart Watch Series 8 Ultra', 'Electronics', '1523275335684-37898b6baf30', 'Quality human hair'],
  ['Vintage Shirt & Trouser Set', 'Clothes & Fashion', '1489987707025-afc232f7ea0f', 'Wireless earbuds or a watch'],
  ['Professional Logo & Graphic Design Service', 'Skills & Services', '1626785774573-4b799315345d', 'Quality wigs or clothes'],
  ['Fresh Yam & Palm Oil Bundle', 'Fresh Food & Farm Produce', '1586201375761-83865001e31c', 'Android smartphone or gadget'],
];
const minutesAgo = [10, 35, 60, 120, 180, 300, 1440];

export function makeListings() {
  const out = []; let id = 1;
  STATES.forEach((hub, si) => {
    for (let k = 0; k < 10; k++) {
      const b = base[(k + si * 3) % base.length], p = people[(k * 2 + si * 5) % people.length];
      out.push({
        id: String(id++), title: b[0], category: b[1], hub,
        user: p.user, userPhoto: p.photo,
        userRating: +(4.5 + ((k * 7 + si * 3) % 5) / 10).toFixed(1), userTrades: 8 + ((k * 13 + si * 7) % 50),
        verified: (k + si) % 4 !== 0, image: U(b[2]), want: b[3],
        createdAt: Date.now() - minutesAgo[(k + si) % minutesAgo.length] * 60000 - k * 1000,
      });
    }
  });
  return out;
}

export function seedMine(username) {
  const me = { user: '@' + username, userPhoto: P('men', 32), userRating: 4.9, userTrades: 14, verified: false, mine: true, status: 'Ready to Swap', hub: 'Lagos' };
  return [
    { ...me, id: 'm1', title: 'Designer Tom Ford Perfume', category: 'Skincare & Beauty', image: U('1523293182086-7651a899d37f'), want: 'Wig or hair bundle', createdAt: Date.now() - 86400000 },
    { ...me, id: 'm2', title: 'Blender & Kitchen Food Processor', category: 'Home & Kitchen', image: U('1570222094114-d074f7e2e36e'), want: 'Fresh farm produce or yam', createdAt: Date.now() - 2 * 86400000 },
  ];
}

export function seedChats() {
  const t = Date.now();
  return [
    {
      id: 'c1', itemId: '1', itemTitle: base[0][0], itemImage: U(base[0][2], 300),
      partner: '@chioma_farm', partnerPhoto: P('women', 44), partnerRating: 4.9, verified: true,
      offered: null, status: 'active', rating: 0, unread: 1, updatedAt: t - 12 * 60000,
      messages: [
        { id: 'a', sender: 'them', text: 'Hello! I saw your offer. Are you ready to swap the yams for my rice?', ts: t - 40 * 60000 },
        { id: 'b', sender: 'me', text: 'Yes absolutely! The yams are fresh from my uncle’s farm in Owo.', ts: t - 30 * 60000 },
        { id: 'c', sender: 'them', text: 'Awesome. Let’s finalize this trade on Barterly.', ts: t - 12 * 60000 },
      ],
    },
    {
      id: 'c2', itemId: '10', itemTitle: base[9][0], itemImage: U(base[9][2], 300),
      partner: '@home_essentials', partnerPhoto: P('women', 90), partnerRating: 4.7, verified: true,
      offered: null, status: 'active', rating: 0, unread: 0, updatedAt: t - 26 * 3600000,
      messages: [
        { id: 'd', sender: 'me', text: 'Hi! Is the blender still available?', ts: t - 27 * 3600000 },
        { id: 'e', sender: 'them', text: 'Yes it is! Do you have yams?', ts: t - 26 * 3600000 },
      ],
    },
  ];
}

export const BANNED = [
  { name: 'Weapons', examples: 'guns, ammunition, explosives', words: ['gun', 'rifle', 'pistol', 'ammunition', 'ammo', 'explosive', 'grenade', 'bullet'] },
  { name: 'Illegal drugs', examples: 'cocaine, heroin, weed, cannabis, meth', words: ['cocaine', 'heroin', 'weed', 'cannabis', 'marijuana', 'meth', 'crack', 'mdma'] },
  { name: 'Prescription-only drugs', examples: 'tramadol, codeine, strong painkillers', words: ['tramadol', 'codeine', 'morphine', 'diazepam', 'rohypnol'] },
  { name: 'Stolen goods', examples: 'stolen phones, laptops, vehicles', words: ['stolen', 'snatched', 'hot phone', 'no receipt'] },
  { name: 'Fake or counterfeit goods', examples: 'fake brands, replicas sold as original', words: ['counterfeit', 'fake', 'replica', 'clone', 'first copy'] },
  { name: 'Fake documents & IDs', examples: 'forged certificates, passports, licences', words: ['forged', 'fake id', 'fake passport', 'fake certificate', 'certificate for sale'] },
  { name: 'Human body parts', examples: 'organs, blood, body parts', words: ['kidney', 'organ', 'human blood', 'body part'] },
  { name: 'Adult content', examples: 'explicit material or sexual services', words: ['porn', 'nude', 'escort', 'sex'] },
  { name: 'Endangered wildlife', examples: 'ivory, pangolin scales, bushmeat', words: ['ivory', 'pangolin', 'bushmeat', 'elephant tusk'] },
  { name: 'Scams & money schemes', examples: 'ponzi, loan offers, hacked accounts', words: ['ponzi', 'hacked account', 'cloned card', 'yahoo yahoo', 'investment doubling'] },
];

export const REPLIES = {
  where: ['Let’s meet somewhere public and busy, like a mall or a bus-stop plaza. What area are you in?', 'A public spot works best. Tell me your area and I’ll suggest one.'],
  available: ['Yes, it’s still available!', 'Still here. Want to lock it in?'],
  photo: ['Sure, sending more photos shortly.', 'I’ll take a few more in better light and send them over.'],
  deal: ['Deal! 🤝 When are you free to swap?', 'Great, let’s do it. Which day suits you?'],
  when: ['I’m free this weekend. Does Saturday morning work?', 'Evenings after 5pm work best for me.'],
  fallback: ['That sounds great! Let’s proceed with the swap terms.', 'Okay, I’m happy with that. Anything else you want to check first?', 'Got it. I’ll hold the item for you.'],
};
