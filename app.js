'use strict';
// SortKaro — waste sorting helper for Indian households.
// Core logic: pure functions, no DOM. Works in Node (require) and in the
// browser (window.SortKaro). Zero dependencies.
//
// Categories follow the bins most Indian cities (ULBs) use under the
// Solid Waste Management Rules 2016: green = wet/compostable, blue = dry/
// recyclable, red = domestic hazardous, separate e-waste collection, and
// sanitary waste in a yellow/red bag. Rules vary by city — the app says so
// wherever it matters, and every item carries a plain explanation.

const CATEGORIES = {
  wet: {
    id: 'wet',
    label: 'Wet waste — Green bin',
    short: 'Green bin (wet)',
    colour: '#2e7d32',
    desc: 'Compostable kitchen and garden waste. Goes to composting, not landfill.',
  },
  dry: {
    id: 'dry',
    label: 'Dry waste — Blue bin',
    short: 'Blue bin (dry)',
    colour: '#1565c0',
    desc: 'Clean, dry recyclables. Rinse food off first; sell or hand to your kabadiwala.',
  },
  hazardous: {
    id: 'hazardous',
    label: 'Hazardous — Red bin',
    short: 'Red bin (hazardous)',
    colour: '#c62828',
    desc: 'Poisonous or chemical waste. Never mix with wet or dry waste.',
  },
  ewaste: {
    id: 'ewaste',
    label: 'E-waste — separate collection',
    short: 'E-waste collection',
    colour: '#6a1b9a',
    desc: 'Electronics. Hand to an authorised e-waste collector or the brand take-back — never burn or bin.',
  },
  sanitary: {
    id: 'sanitary',
    label: 'Sanitary — yellow bag',
    short: 'Yellow bag (sanitary)',
    colour: '#f9a825',
    desc: 'Hygiene waste. Wrap in newspaper, mark it, and put it in a separate yellow/red bag.',
  },
  other: {
    id: 'other',
    label: 'Check locally / reuse',
    short: 'Check locally',
    colour: '#616161',
    desc: 'Not accepted everywhere. Reuse, donate, or check your local kabadiwala / ULB rules.',
  },
  unknown: {
    id: 'unknown',
    label: 'Not sure yet',
    short: 'Not sure',
    colour: '#616161',
    desc: 'This item is not in our list. When in doubt, keep it dry, keep it separate, and ask your local collector.',
  },
};

// Hand-built dataset of common Indian household items.
// name: what people actually type. hi: Roman Hindi name. cat: bin category.
// why: one-line plain explanation. tip: what to do with it.
const ITEMS = [
  // ---- wet (12) ----
  { name: 'vegetable peels', hi: 'sabzi ke chilke', cat: 'wet', why: 'Kitchen scraps rot and compost well.', tip: 'Put in the green bin. No plastic bags — use newspaper or a cloth bag.' },
  { name: 'banana peel', hi: 'kele ka chilka', cat: 'wet', why: 'Fruit peel composts in days.', tip: 'Green bin.' },
  { name: 'fruit peels', hi: 'phal ke chilke', cat: 'wet', why: 'Fruit waste composts quickly.', tip: 'Green bin.' },
  { name: 'leftover cooked food', hi: 'bacha hua khana', cat: 'wet', why: 'Cooked food rots and can be composted or fed to animals where allowed.', tip: 'Green bin. Do not pour oil or gravy down the drain.' },
  { name: 'cooked rice', hi: 'bacha hua chawal', cat: 'wet', why: 'Cooked rice composts.', tip: 'Green bin.' },
  { name: 'stale bread', hi: 'baasi roti', cat: 'wet', why: 'Bread and roti scraps compost.', tip: 'Green bin.' },
  { name: 'tea leaves', hi: 'chai patti', cat: 'wet', why: 'Used tea leaves are great for compost.', tip: 'Green bin. Squeeze out the water first.' },
  { name: 'coffee grounds', hi: 'coffee powder', cat: 'wet', why: 'Coffee grounds compost well.', tip: 'Green bin.' },
  { name: 'eggshells', hi: 'ande ke chilke', cat: 'wet', why: 'Eggshells break down in compost and add calcium.', tip: 'Green bin. Crush them first.' },
  { name: 'flowers', hi: 'phool', cat: 'wet', why: 'Flowers and garlands are plant waste.', tip: 'Green bin — remove any plastic thread or wire first.' },
  { name: 'garden leaves', hi: 'sukhe patte', cat: 'wet', why: 'Dry leaves compost into leaf mould.', tip: 'Green bin or a compost pit.' },
  { name: 'onion peels', hi: 'pyaaz ke chilke', cat: 'wet', why: 'Onion and garlic peels compost.', tip: 'Green bin.' },
  // ---- dry (16) ----
  { name: 'newspaper', hi: 'akhbaar', cat: 'dry', why: 'Paper is recyclable and fetches a price.', tip: 'Keep dry. Sell to the kabadiwala by weight.' },
  { name: 'cardboard box', hi: 'gatta', cat: 'dry', why: 'Cardboard is paper — fully recyclable.', tip: 'Flatten it and keep it dry.' },
  { name: 'plastic water bottle', hi: 'plastic ki bottle', cat: 'dry', why: 'PET bottles are the most recycled plastic in India.', tip: 'Rinse, crush, cap off. Blue bin or kabadiwala.' },
  { name: 'glass jar', hi: 'kach ka jar', cat: 'dry', why: 'Glass can be melted and remade forever.', tip: 'Rinse and keep unbroken. Blue bin.' },
  { name: 'glass bottle', hi: 'kach ki bottle', cat: 'dry', why: 'Glass bottles are recyclable.', tip: 'Rinse first. Blue bin.' },
  { name: 'tin can', hi: 'tin ka dabba', cat: 'dry', why: 'Metal cans are recycled into new metal.', tip: 'Rinse out food, then blue bin.' },
  { name: 'aluminium foil', hi: 'aluminium foil', cat: 'dry', why: 'Clean foil is recyclable aluminium.', tip: 'Only if clean — wipe food off first. Dirty foil goes to wet waste.' },
  { name: 'milk carton', hi: 'doodh ka carton', cat: 'dry', why: 'Tetra Pak cartons are collected for recycling in many cities.', tip: 'Rinse and flatten. Blue bin where collected.' },
  { name: 'magazine', hi: 'patrika', cat: 'dry', why: 'Glossy paper is still paper.', tip: 'Keep dry, sell with newspapers.' },
  { name: 'paper bag', hi: 'kagaz ka bag', cat: 'dry', why: 'Paper bags are recyclable.', tip: 'Reuse first, then blue bin.' },
  { name: 'old books', hi: 'purani kitabein', cat: 'dry', why: 'Books are paper — or better, someone else can read them.', tip: 'Donate first. Torn books go to the blue bin.' },
  { name: 'plastic container', hi: 'plastic dabba', cat: 'dry', why: 'Rigid plastic containers are recyclable.', tip: 'Rinse clean, then blue bin.' },
  { name: 'shampoo bottle', hi: 'shampoo ki bottle', cat: 'dry', why: 'Empty plastic bottles are recyclable.', tip: 'Rinse, remove the pump if you can. Blue bin.' },
  { name: 'detergent bottle', hi: 'detergent ki bottle', cat: 'dry', why: 'Empty detergent bottles are recyclable plastic.', tip: 'Rinse well. Blue bin.' },
  { name: 'egg tray', hi: 'ande ki tray', cat: 'dry', why: 'Paper egg trays are made of recycled paper and can be recycled again.', tip: 'Keep dry. Blue bin.' },
  { name: 'milk packet', hi: 'doodh ka packet', cat: 'dry', why: 'Milk packets are plastic — rinse and recycle.', tip: 'Rinse and put in the blue bin.' },
  { name: 'steel utensils', hi: 'purane steel ke bartan', cat: 'dry', why: 'Steel is valuable scrap metal.', tip: 'Sell to the kabadiwala — never throw metal in wet waste.' },
  // ---- hazardous (12) ----
  { name: 'used batteries', hi: 'purani battery', cat: 'hazardous', why: 'Batteries leak acids and heavy metals into soil and water.', tip: 'Never bin them. Hand to a battery collection point or electronics shop.' },
  { name: 'expired medicines', hi: 'expiry dawa', cat: 'hazardous', why: 'Old medicines poison water and soil.', tip: 'Return to a pharmacy take-back where available, else the red bin. Never flush.' },
  { name: 'paint can', hi: 'paint ka dabba', cat: 'hazardous', why: 'Leftover paint and solvents are chemical waste.', tip: 'Seal it and give to hazardous-waste collection. Never pour down a drain.' },
  { name: 'cfl bulb', hi: 'CFL bulb', cat: 'hazardous', why: 'CFLs contain mercury vapour.', tip: 'Do not break. Wrap carefully and hand to hazardous collection.' },
  { name: 'tube light', hi: 'tube light', cat: 'hazardous', why: 'Tube lights contain mercury like CFLs.', tip: 'Do not break. Wrap and hand to hazardous collection.' },
  { name: 'pesticide bottle', hi: 'keetnashak ki bottle', cat: 'hazardous', why: 'Pesticide residue is poison.', tip: 'Triple-rinse is not enough for home use — hazardous collection only.' },
  { name: 'phenyl bottle', hi: 'phenyl ki bottle', cat: 'hazardous', why: 'Phenyl and strong cleaners are chemical waste.', tip: 'Empty bottles go to hazardous collection, not the blue bin.' },
  { name: 'mosquito repellent can', hi: 'machhar wali spray', cat: 'hazardous', why: 'Pressurised cans with chemicals can explode in garbage trucks.', tip: 'Use it fully, then hazardous collection.' },
  { name: 'mercury thermometer', hi: 'para wala thermometer', cat: 'hazardous', why: 'Mercury is a deadly poison.', tip: 'If it breaks, do not touch with bare hands. Call your local hazardous-waste helpline.' },
  { name: 'nail polish remover', hi: 'nail polish remover', cat: 'hazardous', why: 'Acetone is a flammable chemical.', tip: 'Hazardous collection. Never pour down the drain.' },
  { name: 'expired cosmetics', hi: 'expiry makeup', cat: 'hazardous', why: 'Old cosmetics can carry harmful chemicals.', tip: 'Sealed in a bag, hazardous collection.' },
  { name: 'spray can', hi: 'spray can', cat: 'hazardous', why: 'Aerosol cans are pressurised and chemical.', tip: 'Empty fully, then hazardous collection.' },
  // ---- e-waste (12) ----
  { name: 'old mobile phone', hi: 'purana mobile', cat: 'ewaste', why: 'Phones contain gold, copper and toxic metals.', tip: 'Brand take-back or authorised e-waste collector. Erase your data first.' },
  { name: 'charger', hi: 'charger', cat: 'ewaste', why: 'Chargers are electronics with copper wire.', tip: 'E-waste collection. Do not burn.' },
  { name: 'earphones', hi: 'earphone', cat: 'ewaste', why: 'Earphones are small electronics.', tip: 'E-waste collection.' },
  { name: 'old laptop', hi: 'purana laptop', cat: 'ewaste', why: 'Laptops hold batteries and circuit boards.', tip: 'E-waste collection. Wipe your data first.' },
  { name: 'remote control', hi: 'remote', cat: 'ewaste', why: 'Remotes are electronics (remove batteries first — batteries go to hazardous).', tip: 'Take the batteries out, then e-waste collection.' },
  { name: 'old television', hi: 'purana TV', cat: 'ewaste', why: 'TVs contain leaded glass and circuit boards.', tip: 'E-waste collection — many brands collect old TVs free.' },
  { name: 'mixer grinder', hi: 'mixer', cat: 'ewaste', why: 'Small appliances are e-waste.', tip: 'E-waste collection.' },
  { name: 'electric iron', hi: 'press / iron', cat: 'ewaste', why: 'Electric irons are e-waste.', tip: 'E-waste collection.' },
  { name: 'led bulb', hi: 'LED bulb', cat: 'ewaste', why: 'LED bulbs have circuit boards, unlike CFLs.', tip: 'E-waste collection (CFLs are hazardous instead — do not mix them up).' },
  { name: 'printer', hi: 'printer', cat: 'ewaste', why: 'Printers are e-waste; ink cartridges are hazardous.', tip: 'E-waste collection. Remove ink cartridges first.' },
  { name: 'keyboard', hi: 'keyboard', cat: 'ewaste', why: 'Keyboards are electronics.', tip: 'E-waste collection.' },
  { name: 'power bank', hi: 'power bank', cat: 'ewaste', why: 'Power banks hold lithium batteries.', tip: 'E-waste collection — never puncture or burn.' },
  // ---- sanitary (6) ----
  { name: 'diapers', hi: 'diaper', cat: 'sanitary', why: 'Diapers carry human waste and do not compost.', tip: 'Wrap in newspaper, put in a yellow/red bag, mark it.' },
  { name: 'sanitary pads', hi: 'sanitary pad', cat: 'sanitary', why: 'Sanitary waste must be handled separately.', tip: 'Wrap in newspaper, yellow bag, mark it.' },
  { name: 'bandages', hi: 'patti', cat: 'sanitary', why: 'Used bandages carry blood and germs.', tip: 'Wrap and put in the yellow bag.' },
  { name: 'cotton swabs', hi: 'ear buds', cat: 'sanitary', why: 'Used cotton swabs are hygiene waste.', tip: 'Yellow bag.' },
  { name: 'used masks', hi: 'istemal mask', cat: 'sanitary', why: 'Used masks carry germs.', tip: 'Cut the straps, wrap in newspaper, yellow bag.' },
  { name: 'used gloves', hi: 'istemal gloves', cat: 'sanitary', why: 'Used gloves carry germs.', tip: 'Yellow bag.' },
  // ---- other / check locally (14) ----
  { name: 'old clothes', hi: 'purane kapde', cat: 'other', why: 'Clothes can be worn by someone else long before they are waste.', tip: 'Donate first. Torn clothes go to rag collectors, not the wet bin.' },
  { name: 'shoes', hi: 'joote', cat: 'other', why: 'Shoes are mixed materials — hard to recycle.', tip: 'Donate wearable pairs. Broken ones: check local rules.' },
  { name: 'broken ceramic plates', hi: 'tooti ceramic plate', cat: 'other', why: 'Ceramic cannot be recycled with glass — it ruins glass batches.', tip: 'Wrap sharp pieces in newspaper and mark "sharp". Check local rules.' },
  { name: 'mirror', hi: 'sheesha', cat: 'other', why: 'Mirrors have a coating that glass recyclers cannot take.', tip: 'Wrap carefully, mark "sharp", check local rules.' },
  { name: 'window glass', hi: 'khidki ka sheesha', cat: 'other', why: 'Window glass melts at a different temperature than bottle glass.', tip: 'Not for the blue bin. Check local collection.' },
  { name: 'thermocol', hi: 'thermocol', cat: 'other', why: 'Thermocol is bulky, light and rarely recycled in India.', tip: 'Reuse as packing. Most cities do not collect it — check locally.' },
  { name: 'chips packets', hi: 'chips ka packet', cat: 'other', why: 'Multi-layer plastic (foil + plastic) is almost never recycled.', tip: 'Dry waste in most cities, but low value — check your collector.' },
  { name: 'rubber slippers', hi: 'chappal', cat: 'other', why: 'Rubber footwear is mixed material.', tip: 'Donate wearable pairs; check local rules for worn-out ones.' },
  { name: 'old toys', hi: 'purane khilone', cat: 'other', why: 'Toys are mixed plastic, metal and batteries.', tip: 'Donate working toys. Remove batteries first (hazardous).' },
  { name: 'cds and dvds', hi: 'CD / DVD', cat: 'other', why: 'Discs are polycarbonate — many cities treat them as e-waste.', tip: 'Check local e-waste collection; some recyclers take them.' },
  { name: 'coconut shell', hi: 'nariyal ka chilka', cat: 'other', why: 'Coconut shells are hard and slow to rot — most cities do not compost them.', tip: 'Dry waste in most cities. Shells can be reused as bowls or planters.' },
  { name: 'used oil', hi: 'istemal tel', cat: 'other', why: 'Cooking oil poured down drains clogs sewers and pollutes water.', tip: 'Collect in a bottle and give to a used-oil collector. Never pour down the drain.' },
  { name: 'broken bangles', hi: 'tooti choodiyan', cat: 'other', why: 'Glass bangles are thin coated glass.', tip: 'Wrap in newspaper, mark "sharp", check local rules.' },
  { name: 'broken umbrella', hi: 'toota chhata', cat: 'other', why: 'Umbrellas mix metal, cloth and plastic.', tip: 'Salvage the metal ribs for scrap; the rest is check-locally.' },
];

const ALIASES = {
  'banana': 'banana peel',
  'kela': 'banana peel',
  'newspapers': 'newspaper',
  'akhbaar': 'newspaper',
  'gatta': 'cardboard box',
  'pet bottle': 'plastic water bottle',
  'water bottle': 'plastic water bottle',
  'bottle': 'plastic water bottle',
  'mobile': 'old mobile phone',
  'phone': 'old mobile phone',
  'cell phone': 'old mobile phone',
  'laptop': 'old laptop',
  'computer': 'old laptop',
  'tv': 'old television',
  'television': 'old television',
  'battery': 'used batteries',
  'batteries': 'used batteries',
  'cell': 'used batteries',
  'dawai': 'expired medicines',
  'medicine': 'expired medicines',
  'medicines': 'expired medicines',
  'pad': 'sanitary pads',
  'pads': 'sanitary pads',
  'diaper': 'diapers',
  'mask': 'used masks',
  'masks': 'used masks',
  'charger': 'charger',
  'earphone': 'earphones',
  'headphone': 'earphones',
  'earbud': 'earphones',
  'remote': 'remote control',
  'cfl': 'cfl bulb',
  'tube': 'tube light',
  'tubelight': 'tube light',
  'led': 'led bulb',
  'paint': 'paint can',
  'shampoo': 'shampoo bottle',
  'detergent': 'detergent bottle',
  'chappal': 'rubber slippers',
  'slippers': 'rubber slippers',
  'kapde': 'old clothes',
  'clothes': 'old clothes',
  'kagaz': 'newspaper',
  'sabzi': 'vegetable peels',
  'chilke': 'vegetable peels',
  'peel': 'banana peel',
  'peels': 'vegetable peels',
  'flowers': 'flowers',
  'phool': 'flowers',
  'leaves': 'garden leaves',
  'patte': 'garden leaves',
  'chai': 'tea leaves',
  'tea': 'tea leaves',
  'egg shell': 'eggshells',
  'eggshell': 'eggshells',
  'ande': 'eggshells',
  'rice': 'cooked rice',
  'chawal': 'cooked rice',
  'roti': 'stale bread',
  'bread': 'stale bread',
  'khana': 'leftover cooked food',
  'food': 'leftover cooked food',
  'thermometer': 'mercury thermometer',
  'nail polish': 'nail polish remover',
  'spray': 'spray can',
  'mosquito': 'mosquito repellent can',
  'cosmetics': 'expired cosmetics',
  'makeup': 'expired cosmetics',
  'pesticide': 'pesticide bottle',
  'phenyl': 'phenyl bottle',
  'printer': 'printer',
  'keyboard': 'keyboard',
  'mouse': 'keyboard',
  'powerbank': 'power bank',
  'mixer': 'mixer grinder',
  'iron': 'electric iron',
  'press': 'electric iron',
  'bandage': 'bandages',
  'patti': 'bandages',
  'ear buds': 'cotton swabs',
  'cotton': 'cotton swabs',
  'gloves': 'used gloves',
  'mirror': 'mirror',
  'sheesha': 'mirror',
  'ceramic': 'broken ceramic plates',
  'plate': 'broken ceramic plates',
  'thermocol': 'thermocol',
  'chips': 'chips packets',
  'packet': 'chips packets',
  'toys': 'old toys',
  'khilone': 'old toys',
  'cd': 'cds and dvds',
  'dvd': 'cds and dvds',
  'nariyal': 'coconut shell',
  'oil': 'used oil',
  'tel': 'used oil',
  'choodiyan': 'broken bangles',
  'bangles': 'broken bangles',
  'shoes': 'shoes',
  'joote': 'shoes',
  'books': 'old books',
  'kitabein': 'old books',
  'magazine': 'magazine',
  'patrika': 'magazine',
  'carton': 'milk carton',
  'tetra pak': 'milk carton',
  'tetrapak': 'milk carton',
  'foil': 'aluminium foil',
  'milk packet': 'milk packet',
  'milk pouch': 'milk packet',
  'doodh ka packet': 'milk packet',
  'tin': 'tin can',
  'can': 'tin can',
  'jar': 'glass jar',
  'glass': 'glass bottle',
  'steel': 'steel utensils',
  'bartan': 'steel utensils',
  'tray': 'egg tray',
  'coffee': 'coffee grounds',
  'flowers ': 'flowers',
};

// Keyword rules for items NOT in the dataset (held-out generalisation).
// Checked in order; first match wins. Each rule: [regex, category, reason].
const KEYWORD_RULES = [
  [/batter(y|ies)|cell\b/, 'hazardous', 'Batteries leak acids and heavy metals.'],
  [/mobile|phone|smartphone|tablet|ipad/, 'ewaste', 'Phones and tablets are electronics.'],
  [/charger|adapter|cable|earphone|headphone|earbud|keyboard|mouse|speaker/, 'ewaste', 'Small electronics and accessories are e-waste.'],
  [/laptop|computer|cpu|monitor|printer|scanner/, 'ewaste', 'Computers and peripherals are e-waste.'],
  [/cfl|tubelight|tube ?light/, 'hazardous', 'CFLs and tube lights contain mercury.'],
  [/\bled\b.*bulb|bulb.*\bled\b/, 'ewaste', 'LED bulbs have circuit boards.'],
  [/medicine|dawai|syrup|tablet|pill|injection/, 'hazardous', 'Old medicines poison water and soil.'],
  [/paint|pesticide|phenyl|acid|chemical|solvent|varnish/, 'hazardous', 'Chemicals and solvents are hazardous waste.'],
  [/thermometer/, 'hazardous', 'Mercury thermometers are hazardous.'],
  [/spray|aerosol|mosquito/, 'hazardous', 'Pressurised chemical cans are hazardous.'],
  [/diaper|sanitary|pad\b|napkin/, 'sanitary', 'Hygiene waste goes in the yellow bag.'],
  [/mask|glove|bandage|swab|cotton/, 'sanitary', 'Used hygiene items go in the yellow bag.'],
  [/peel|chilka|rind|shells|leaves|flowers|garland|tea leaves|coffee|peels/, 'wet', 'Kitchen and garden scraps compost.'],
  [/leftover|cooked|stale|rotten|food waste|khana/, 'wet', 'Cooked and leftover food composts.'],
  [/newspaper|cardboard|magazine|paper|book/, 'dry', 'Paper and cardboard are recyclable.'],
  [/bottle|jar|container|tin|can\b|foil|carton|tetra/, 'dry', 'Clean rigid containers are recyclable.'],
  [/glass/, 'dry', 'Glass is recyclable.'],
  [/steel|metal|aluminium|aluminum|copper|iron\b/, 'dry', 'Metal is valuable scrap.'],
  [/clothes|shoe|toy|mirror|ceramic|thermocol|chips|packet/, 'other', 'Mixed materials — check local rules or donate.'],
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[.,!?;:()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findItemByName(name) {
  const n = normalize(name);
  if (!n) return null;
  for (const it of ITEMS) {
    if (normalize(it.name) === n) return it;
    if (normalize(it.hi) === n) return it;
  }
  if (ALIASES[n]) {
    const target = ALIASES[n];
    return ITEMS.find((it) => it.name === target) || null;
  }
  return null;
}

// Classify a free-text item name.
// Returns { cat, item (matched dataset row or null), method: 'exact'|'alias'|'keyword'|'unknown', reason }.
function classify(text) {
  const n = normalize(text);
  if (!n) return { cat: 'unknown', item: null, method: 'unknown', reason: 'Type an item name first.' };
  const exact = findItemByName(n);
  if (exact) {
    return { cat: exact.cat, item: exact, method: ALIASES[n] && normalize(exact.name) !== n ? 'alias' : 'exact', reason: exact.why };
  }
  // Substring: the input contains a whole dataset name (e.g. "old mobile charger").
  for (const it of ITEMS) {
    const iname = normalize(it.name);
    if (n.includes(iname) || iname.includes(n) && n.length >= 4) {
      if (n.length >= 4 && iname.includes(n)) return { cat: it.cat, item: it, method: 'keyword', reason: it.why };
      if (n.includes(iname)) return { cat: it.cat, item: it, method: 'keyword', reason: it.why };
    }
  }
  // Longest alias first, so "milk packet" beats "packet" and "paint" beats "tin".
  const sortedAliases = Object.keys(ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    if (n.includes(alias) && alias.length >= 4) {
      const it = ITEMS.find((x) => x.name === ALIASES[alias]);
      if (it) return { cat: it.cat, item: it, method: 'keyword', reason: it.why };
    }
  }
  for (const [re, cat, reason] of KEYWORD_RULES) {
    if (re.test(n)) return { cat, item: null, method: 'keyword', reason };
  }
  return {
    cat: 'unknown',
    item: null,
    method: 'unknown',
    reason: 'Not in our list of ' + ITEMS.length + ' items. When in doubt: keep it dry, keep it separate, and ask your kabadiwala or local ULB.',
  };
}

function itemsByCategory(cat) {
  return ITEMS.filter((it) => it.cat === cat);
}

function searchItems(query) {
  const q = normalize(query);
  if (!q) return ITEMS.slice();
  return ITEMS.filter((it) => {
    const hay = normalize(it.name + ' ' + it.hi + ' ' + it.cat);
    return q.split(' ').every((w) => hay.includes(w));
  });
}

// Quiz: pick n distinct items at random (injectable rng for tests).
function makeQuiz(n, rng) {
  const rand = rng || Math.random;
  const pool = ITEMS.slice();
  const picked = [];
  while (picked.length < Math.min(n, pool.length)) {
    const i = Math.floor(rand() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked.map((it) => ({ name: it.name, hi: it.hi, answer: it.cat }));
}

function gradeQuiz(quiz, answers) {
  let correct = 0;
  const detail = quiz.map((q, i) => {
    const ok = answers[i] === q.answer;
    if (ok) correct++;
    return { name: q.name, expected: q.answer, given: answers[i] || null, ok };
  });
  return { correct, total: quiz.length, detail };
}

// Held-out evaluation used by the tests and shown in the app:
// classify names that are NOT in the dataset and report accuracy.
const HELD_OUT = [
  ['banana peel', 'wet'],
  ['old mobile charger', 'ewaste'],
  ['used AA battery', 'hazardous'],
  ['cracked CFL bulb', 'hazardous'],
  ['empty shampoo bottle', 'dry'],
  ["yesterday's cooked rice", 'wet'],
  ['broken remote control', 'ewaste'],
  ['expired cough syrup', 'hazardous'],
  ['used face mask', 'sanitary'],
  ['old laptop', 'ewaste'],
  ['egg shells', 'wet'],
  ['cardboard delivery box', 'dry'],
  ['glass pickle jar', 'dry'],
  ['used diaper', 'sanitary'],
  ['old earphones', 'ewaste'],
  ['paint tin', 'hazardous'],
  ['plastic milk packet', 'dry'],
  ['used tea leaves', 'wet'],
  ['broken LED bulb', 'ewaste'],
  ['old newspapers', 'dry'],
];

function evaluateHeldOut() {
  let correct = 0;
  const misses = [];
  for (const [name, expected] of HELD_OUT) {
    const got = classify(name).cat;
    if (got === expected) correct++;
    else misses.push({ name, expected, got });
  }
  return { correct, total: HELD_OUT.length, accuracy: correct / HELD_OUT.length, misses };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CATEGORIES, ITEMS, ALIASES, KEYWORD_RULES, HELD_OUT,
    normalize, findItemByName, classify, itemsByCategory, searchItems,
    makeQuiz, gradeQuiz, evaluateHeldOut,
  };
}
if (typeof window !== 'undefined') {
  window.SortKaro = {
    CATEGORIES, ITEMS, classify, itemsByCategory, searchItems,
    makeQuiz, gradeQuiz, evaluateHeldOut,
  };
}
