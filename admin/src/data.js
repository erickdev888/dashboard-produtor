// Dados demonstrativos de um e-commerce de varejo (eletrônicos, eletrodomésticos e casa).
// Tudo é gerado de forma determinística a partir de uma semente, então os números
// são estáveis entre recarregamentos. Troque estas funções pela sua API real.

export const DAYS = 730; // dois anos: 12 meses exibidos + 12 meses para comparação

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20261108);
const rand = (a = 0, b = 1) => a + rng() * (b - a);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

export const NOW = new Date();
export const TODAY = (() => { const d = new Date(NOW); d.setHours(0, 0, 0, 0); return d; })();
export const DATES = Array.from({ length: DAYS }, (_, i) => { const d = new Date(TODAY); d.setDate(d.getDate() - (DAYS - 1 - i)); return d; });
export const LAST = DAYS - 1;
export const idxOf = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return LAST - Math.round((TODAY - d) / 864e5); };

// ---------- Categorias (ordem fixa = ordem das cores categóricas) ----------
export const CATEGORIES = [
  { id: 'hardware', name: 'Hardware', margin: 0.16 },
  { id: 'smartphones', name: 'Smartphones', margin: 0.13 },
  { id: 'tv', name: 'TV e Vídeo', margin: 0.15 },
  { id: 'eletro', name: 'Eletrodomésticos', margin: 0.22 },
  { id: 'games', name: 'Games', margin: 0.17 },
  { id: 'notebooks', name: 'Notebooks', margin: 0.12 },
  { id: 'audio', name: 'Áudio', margin: 0.31 },
  { id: 'casa', name: 'Casa e Móveis', margin: 0.36 },
];
export const catById = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, { ...c, index: i }]));

export const SELLERS = ['Vitrine Oficial', 'TechNorte Distribuidora', 'Casa Prime', 'MegaGamer Store', 'Eletro Sul', 'Lar & Conforto'];

// [nome, categoria, preço, arte, popularidade, crescimento anual, sazonalidade]
const RAW = [
  ['Placa de Vídeo Vortex G70 12GB GDDR6X', 'hardware', 4299, 'gpu', 1.5, 0.55],
  ['Placa de Vídeo Vortex G60 8GB GDDR6', 'hardware', 2299, 'gpu', 1.3, 0.2],
  ['Processador Nexon R7 8 núcleos AM5', 'hardware', 1899, 'cpu', 1.2, 0.35],
  ['SSD NVMe 2TB Gen4 Hyperion', 'hardware', 899, 'ssd', 1.6, 0.4],
  ['Memória 32GB DDR5 6000MHz (2x16)', 'hardware', 749, 'ram', 1.3, 0.3],
  ['Fonte 850W 80 Plus Gold Modular', 'hardware', 829, 'psu', 0.9, 0.1],
  ['Placa-mãe B650M Wi-Fi', 'hardware', 1199, 'board', 0.9, 0.15],
  ['Water Cooler 360mm ARGB', 'hardware', 549, 'cooler', 1.0, 0.05],
  ['Smartphone Aurora X 256GB 5G', 'smartphones', 2899, 'phone', 1.8, 0.25],
  ['Smartphone Aurora Lite 128GB', 'smartphones', 1299, 'phone', 1.9, -0.1],
  ['Smartphone Nova Pro Max 512GB', 'smartphones', 8499, 'phone', 1.0, 0.6],
  ['Smartwatch Pulse 2 GPS', 'smartphones', 899, 'watch', 1.1, 0.2],
  ['Smart TV 55" 4K QLED Lumen', 'tv', 3199, 'tv', 1.5, 0.1],
  ['Smart TV 65" 4K Mini LED Lumen', 'tv', 5499, 'tv', 1.1, 0.45],
  ['Smart TV 43" Full HD Lumen', 'tv', 1799, 'tv', 1.3, -0.25],
  ['Projetor 4K Laser Cine', 'tv', 6999, 'projector', 0.5, 0.3],
  ['Geladeira Frost Free Inverse 480L', 'eletro', 4599, 'fridge', 1.0, 0.1, 'maes'],
  ['Máquina de Lavar 13kg Inverter', 'eletro', 2499, 'washer', 1.1, 0.05, 'maes'],
  ['Micro-ondas 32L Inox', 'eletro', 749, 'microwave', 1.3, -0.05, 'maes'],
  ['Air Fryer 5,5L Digital', 'eletro', 399, 'airfryer', 2.2, -0.15, 'maes'],
  ['Ar-condicionado Split Inverter 12.000 BTUs', 'eletro', 2399, 'ac', 1.2, 0.1, 'verao'],
  ['Robô Aspirador Smart Map', 'eletro', 1599, 'robot', 1.0, 0.5, 'maes'],
  ['Cafeteira Espresso Automática', 'eletro', 1899, 'coffee', 0.8, 0.2, 'maes'],
  ['Console NextGen 1TB Digital', 'games', 3999, 'console', 1.4, 0.15, 'pais'],
  ['Controle sem fio DualPad', 'games', 449, 'gamepad', 1.7, 0.05, 'pais'],
  ['Cadeira Gamer Ergo Pro', 'games', 1299, 'chair', 1.0, -0.05, 'pais'],
  ['Jogo Lendas do Norte · Deluxe', 'games', 349, 'disc', 1.6, 0.9, 'pais'],
  ['Headset Gamer 7.1 Wireless', 'games', 699, 'headset', 1.2, 0.1, 'pais'],
  ['Notebook Gamer Titan 15 · 16GB · 1TB', 'notebooks', 7999, 'laptop', 1.0, 0.35],
  ['Notebook Ultrafino Air 14 · 8GB · 512GB', 'notebooks', 3799, 'laptop', 1.3, 0.1],
  ['Chromebook Edu 11 · 4GB', 'notebooks', 1499, 'laptop', 0.8, -0.3],
  ['Fone Buds Pro com cancelamento de ruído', 'audio', 699, 'buds', 2.0, 0.3, 'pais'],
  ['Soundbar 3.1 Atmos', 'audio', 2199, 'soundbar', 0.9, 0.1],
  ['Caixa de Som Portátil Boom 40W', 'audio', 599, 'speaker', 1.4, 0.0],
  ['Headphone Studio Over-ear', 'audio', 1499, 'headphone', 0.8, 0.2],
  ['Sofá Retrátil 3 Lugares', 'casa', 2299, 'sofa', 0.9, 0.05, 'maes'],
  ['Colchão Queen Molas Ensacadas', 'casa', 1999, 'bed', 1.0, 0.1, 'maes'],
  ['Mesa de Escritório em L', 'casa', 899, 'desk', 1.0, 0.0],
  ['Cadeira de Escritório Ergonômica', 'casa', 1199, 'officechair', 1.1, 0.15],
  ['Guarda-roupa 6 Portas', 'casa', 1599, 'wardrobe', 0.7, -0.1, 'maes'],
];

// ---------- Sazonalidade do varejo brasileiro ----------
const nthWeekday = (y, m, wd, n) => { const d = new Date(y, m, 1); const first = 1 + ((wd - d.getDay() + 7) % 7); return new Date(y, m, first + 7 * (n - 1)); };
const dayDiff = (a, b) => Math.round((a - b) / 864e5);
const DOW = [0.86, 1.04, 1.03, 1.0, 1.02, 1.08, 0.93];
const yearMarks = {};
const marks = (y) => (yearMarks[y] ||= {
  bf: nthWeekday(y, 10, 5, 4), // Black Friday: 4ª sexta de novembro
  maes: nthWeekday(y, 4, 0, 2), // Dia das Mães: 2º domingo de maio
  pais: nthWeekday(y, 7, 0, 2), // Dia dos Pais: 2º domingo de agosto
});
function seasonal(date, kind) {
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
  const k = marks(y);
  let f = DOW[date.getDay()];
  const bf = dayDiff(date, k.bf);
  if (bf === 0) f *= 5.4; else if (bf > 0 && bf <= 3) f *= 2.5; else if (bf < 0 && bf >= -10) f *= 1.35 + (10 + bf) * 0.09;
  if (m === 11 && d >= 4 && d <= 23) f *= 1.55; else if (m === 11 && d >= 24 && d <= 26) f *= 0.65;
  if (m === 0) f *= 0.82; else if (m === 1) f *= 0.86; else if (m === 2) f *= 0.95;
  if (kind === 'maes') { const t = dayDiff(k.maes, date); if (t >= 0 && t <= 12) f *= 1.5; }
  if (kind === 'pais') { const t = dayDiff(k.pais, date); if (t >= 0 && t <= 12) f *= 1.45; }
  if (kind === 'verao') f *= [2.1, 1.9, 1.3, 0.8, 0.55, 0.42, 0.4, 0.5, 0.75, 1.1, 1.55, 2.0][m];
  return f;
}
const poisson = (l) => { if (l > 30) return Math.max(0, Math.round(l + gauss() * Math.sqrt(l))); let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; };

export const dayFraction = Math.max(0.06, (NOW.getHours() * 60 + NOW.getMinutes()) / 1440);

export const PRODUCTS = RAW.map(([name, cat, price, art, pop, growth, kind], i) => {
  const units = new Uint16Array(DAYS);
  const revenue = new Float64Array(DAYS);
  const base = (560 / Math.sqrt(price)) * pop;
  for (let t = 0; t < DAYS; t++) {
    const date = DATES[t];
    const trend = Math.exp(growth * (t - LAST) / 365);
    let lambda = base * trend * seasonal(date, kind) * (0.82 + rng() * 0.36);
    if (t === LAST) lambda *= dayFraction;
    const u = poisson(lambda);
    const k = marks(date.getFullYear());
    const bf = dayDiff(date, k.bf);
    const discount = bf >= -10 && bf <= 3 ? 0.14 : rng() < 0.15 ? 0.06 : 0.01;
    units[t] = u;
    revenue[t] = u * price * (1 - discount);
  }
  const cu = new Float64Array(DAYS + 1), cr = new Float64Array(DAYS + 1);
  for (let t = 0; t < DAYS; t++) { cu[t + 1] = cu[t] + units[t]; cr[t + 1] = cr[t] + revenue[t]; }
  const site = rand(0.38, 0.55), app = rand(0.25, 0.4);
  const seller = i % 5 === 3 ? SELLERS[1 + (i % (SELLERS.length - 1))] : SELLERS[0];
  return {
    id: 'p' + (i + 1), sku: `VT-${String(10240 + i * 37).padStart(6, '0')}`, name, cat, price, art,
    units, revenue, cu, cr, seller,
    stock: i % 9 === 4 ? Math.round(rand(3, 26)) : Math.round(rand(40, 420) * (price > 4000 ? 0.4 : 1)),
    rating: +(rand(4.1, 4.95)).toFixed(1), reviews: Math.round(rand(80, 5200)),
    channels: { Site: site, App: app, Marketplace: 1 - site - app },
    cost: 1 - catById[cat].margin - rand(-0.03, 0.03),
  };
});
export const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// ---------- Períodos ----------
const fmtDay = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
export const PERIODS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'ontem', label: 'Ontem' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: '90d', label: '90 dias' },
  { id: 'ano', label: 'Este ano' },
  { id: '12m', label: '12 meses' },
];
export function periodRange(id, custom) {
  let start, end = LAST;
  const monthStart = idxOf(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const yearStart = idxOf(new Date(TODAY.getFullYear(), 0, 1));
  switch (id) {
    case 'hoje': start = LAST; break;
    case 'ontem': start = end = LAST - 1; break;
    case '7d': start = LAST - 6; break;
    case '30d': start = LAST - 29; break;
    case 'mes': start = monthStart; break;
    case '90d': start = LAST - 89; break;
    case 'ano': start = yearStart; break;
    case '12m': start = LAST - 364; break;
    case 'custom': {
      start = Math.max(365, Math.min(LAST, idxOf(custom.from)));
      end = Math.max(start, Math.min(LAST, idxOf(custom.to)));
      break;
    }
    default: start = LAST - 29;
  }
  const len = end - start + 1;
  const prevEnd = start - 1, prevStart = Math.max(0, start - len);
  const label = start === end ? DATES[start].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : `${fmtDay(DATES[start])} – ${fmtDay(DATES[end])} ${DATES[end].getFullYear()}`;
  return { id, start, end, len, prevStart, prevEnd, label };
}

export const sumRev = (p, a, b) => p.cr[b + 1] - p.cr[a];
export const sumUnits = (p, a, b) => p.cu[b + 1] - p.cu[a];

export function productStats(range) {
  const rows = PRODUCTS.map((p) => {
    const revenue = sumRev(p, range.start, range.end);
    const units = sumUnits(p, range.start, range.end);
    // Se o período termina hoje (dia parcial), o último dia da comparação é proporcional ao horário atual.
    const adj = range.end === LAST ? 1 - dayFraction : 0;
    const prev = sumRev(p, range.prevStart, range.prevEnd) - p.revenue[range.prevEnd] * adj;
    const prevUnits = sumUnits(p, range.prevStart, range.prevEnd) - p.units[range.prevEnd] * adj;
    return { p, revenue, units, prev, prevUnits, ticket: units ? revenue / units : 0, delta: prev ? (revenue - prev) / prev : 0, margin: revenue * (1 - p.cost) };
  });
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  rows.forEach((r) => (r.share = total ? r.revenue / total : 0));
  return { rows, total, units: rows.reduce((s, r) => s + r.units, 0), prevTotal: rows.reduce((s, r) => s + r.prev, 0), prevUnits: rows.reduce((s, r) => s + r.prevUnits, 0) };
}

// Série agregada para o gráfico, agrupada por dia / semana / mês conforme a duração.
export function seriesFor(range, products = PRODUCTS) {
  const { start, end, len } = range;
  const bucket = len <= 1 ? 'hour' : len <= 45 ? 'day' : len <= 120 ? 'week' : 'month';
  const out = [];
  const add = (a, b, label, full) => {
    let v = 0, u = 0, pv = 0;
    for (const p of products) { v += sumRev(p, a, b); u += sumUnits(p, a, b); const off = len; if (a - off >= 0) pv += sumRev(p, a - off, b - off); }
    out.push({ label, full, value: v, units: u, prev: pv });
  };
  if (bucket === 'hour') {
    // Curva intradiária típica de e-commerce aplicada ao total do dia.
    const shape = [0.6, 0.35, 0.2, 0.15, 0.15, 0.25, 0.55, 1.1, 1.8, 2.6, 3.1, 3.3, 3.6, 3.4, 3.2, 3.3, 3.5, 3.7, 3.9, 4.3, 4.8, 4.9, 3.9, 2.0];
    const tot = shape.reduce((a, b) => a + b, 0);
    let v = 0, u = 0, pv = 0;
    for (const p of products) { v += sumRev(p, start, end); u += sumUnits(p, start, end); pv += sumRev(p, start - 1, start - 1); }
    const isToday = end === LAST;
    const hoursSoFar = isToday ? NOW.getHours() + 1 : 24;
    const partTot = shape.slice(0, hoursSoFar).reduce((a, b) => a + b, 0);
    shape.forEach((s, h) => {
      const share = s / (isToday ? partTot : tot);
      out.push({ label: `${String(h).padStart(2, '0')}h`, full: `${String(h).padStart(2, '0')}:00 – ${String(h).padStart(2, '0')}:59`, value: h < hoursSoFar ? v * share : null, units: h < hoursSoFar ? Math.round(u * share) : null, prev: pv * (s / tot) });
    });
    return { bucket, points: out };
  }
  if (bucket === 'day') {
    for (let t = start; t <= end; t++) add(t, t, fmtDay(DATES[t]), DATES[t].toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }));
  } else if (bucket === 'week') {
    for (let t = start; t <= end; t += 7) { const b = Math.min(end, t + 6); add(t, b, fmtDay(DATES[t]), `Semana de ${fmtDay(DATES[t])} a ${fmtDay(DATES[b])}`); }
  } else {
    let t = start;
    while (t <= end) {
      const d = DATES[t];
      let b = t; while (b + 1 <= end && DATES[b + 1].getMonth() === d.getMonth()) b++;
      add(t, b, d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
      t = b + 1;
    }
  }
  return { bucket, points: out };
}

// Faturamento por mês calendário (últimos n meses, incluindo o atual parcial)
export function monthly(n, products = PRODUCTS) {
  const res = [];
  for (let k = n - 1; k >= 0; k--) {
    const first = new Date(TODAY.getFullYear(), TODAY.getMonth() - k, 1);
    const last = new Date(TODAY.getFullYear(), TODAY.getMonth() - k + 1, 0);
    const a = Math.max(0, idxOf(first)), b = Math.min(LAST, idxOf(last));
    let v = 0, u = 0, m = 0;
    for (const p of products) { const r = sumRev(p, a, b); v += r; u += sumUnits(p, a, b); m += r * (1 - p.cost); }
    res.push({ label: first.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), full: first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), value: v, units: u, margin: m, partial: k === 0 });
  }
  return res;
}

export function categoryTotals(a, b) {
  return CATEGORIES.map((c, i) => ({ id: c.id, label: c.name, index: i, value: PRODUCTS.filter((p) => p.cat === c.id).reduce((s, p) => s + sumRev(p, a, b), 0) }));
}

// ---------- Pessoas ----------
const FIRST = ['Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vitória', 'Lucas', 'Mariana', 'Pedro', 'Beatriz', 'Gustavo', 'Juliana', 'Leonardo', 'Carolina', 'Matheus', 'Fernanda', 'Rodrigo'];
const LASTN = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Barbosa', 'Rocha', 'Dias', 'Moreira'];
const CITIES = [['São Paulo', 'SP'], ['Campinas', 'SP'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'], ['Curitiba', 'PR'], ['Porto Alegre', 'RS'], ['Salvador', 'BA'], ['Recife', 'PE'], ['Fortaleza', 'CE'], ['Brasília', 'DF'], ['Goiânia', 'GO'], ['Florianópolis', 'SC'], ['Manaus', 'AM'], ['Belém', 'PA'], ['Vitória', 'ES']];
export const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
const fullName = () => `${pick(FIRST)} ${pick(LASTN)}`;

export const CUSTOMERS = Array.from({ length: 64 }, (_, i) => {
  const name = fullName();
  const [city, uf] = pick(CITIES);
  const orders = Math.max(1, Math.round(Math.exp(rand(0, 3.2))));
  const ltv = orders * rand(380, 3600);
  return {
    id: 'c' + (i + 1), name, email: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(' ', '.') + (i % 3 ? '@email.com' : '@mail.com.br'),
    city, uf, orders, ltv, last: Math.floor(rand(0, 120)),
    tier: ltv > 15000 ? 'Diamante' : ltv > 6000 ? 'Ouro' : ltv > 2000 ? 'Prata' : 'Bronze',
    since: 2019 + Math.floor(rand(0, 8)),
  };
}).sort((a, b) => b.ltv - a.ltv);

export const TEAM = [
  ['Erick Umbelino', 'Proprietário', 'Diretoria', 'online'],
  ['Larissa Moreira', 'Gerente de e-commerce', 'Operações', 'online'],
  ['Thiago Barbosa', 'Analista de catálogo', 'Catálogo', 'online'],
  ['Camila Rocha', 'Atendimento', 'Atendimento', 'away'],
  ['Diego Carvalho', 'Logística', 'Operações', 'online'],
  ['Juliana Lopes', 'Financeiro', 'Financeiro', 'offline'],
  ['Rafael Gomes', 'Marketing de performance', 'Marketing', 'online'],
  ['Beatriz Almeida', 'Moderação de sellers', 'Catálogo', 'away'],
  ['Gustavo Dias', 'Desenvolvedor', 'Tecnologia', 'offline'],
  ['Natália Ribeiro', 'Atendimento', 'Atendimento', 'online'],
  ['Otávio Lima', 'Compras', 'Compras', 'offline'],
  ['Paula Martins', 'Designer', 'Marketing', 'online'],
  ['Henrique Costa', 'Analista de dados', 'Tecnologia', 'away'],
].map(([name, role, team, status], i) => ({ id: 't' + i, name, role, team, status, email: name.split(' ')[0].toLowerCase() + '@vitrine.com.br', tasks: Math.round(rand(2, 24)), joined: 2019 + (i % 7) }));

export const ROLES = [
  { id: 'owner', name: 'Proprietário', members: 1 },
  { id: 'admin', name: 'Administrador', members: 2 },
  { id: 'catalog', name: 'Catálogo', members: 3 },
  { id: 'support', name: 'Atendimento', members: 2 },
  { id: 'finance', name: 'Financeiro', members: 1 },
  { id: 'viewer', name: 'Leitura', members: 4 },
];
export const PERMISSIONS = [
  ['products.edit', 'Criar e editar produtos', ['owner', 'admin', 'catalog']],
  ['prices.edit', 'Alterar preços e promoções', ['owner', 'admin']],
  ['orders.manage', 'Gerenciar pedidos e devoluções', ['owner', 'admin', 'support']],
  ['refunds.approve', 'Aprovar reembolsos', ['owner', 'admin', 'finance']],
  ['finance.view', 'Ver relatórios financeiros', ['owner', 'admin', 'finance', 'viewer']],
  ['payouts.pay', 'Pagar repasses a sellers', ['owner', 'finance']],
  ['sellers.moderate', 'Moderar anúncios de sellers', ['owner', 'admin', 'catalog']],
  ['customers.data', 'Acessar dados de clientes (LGPD)', ['owner', 'admin', 'support']],
  ['team.manage', 'Convidar e remover membros', ['owner', 'admin']],
  ['settings.system', 'Configurações do sistema e integrações', ['owner']],
];

// ---------- Pedidos ----------
const PAYMENTS = ['Pix', 'Pix', 'Cartão de crédito', 'Cartão de crédito', 'Cartão de crédito', 'Boleto'];
export const ORDER_STATUS = {
  pago: { label: 'Pago', tone: 'blue' },
  separacao: { label: 'Em separação', tone: 'amber' },
  enviado: { label: 'Enviado', tone: 'violet' },
  entregue: { label: 'Entregue', tone: 'green' },
  aguardando: { label: 'Aguardando pagamento', tone: 'gray' },
  cancelado: { label: 'Cancelado', tone: 'red' },
};
export const ORDERS = (() => {
  const list = [];
  const weights = PRODUCTS.map((p) => p.cr[DAYS] - p.cr[DAYS - 30]);
  const tw = weights.reduce((a, b) => a + b, 0);
  const pickP = () => { let r = rng() * tw; for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return PRODUCTS[i]; } return PRODUCTS[0]; };
  let ts = NOW.getTime();
  for (let i = 0; i < 260; i++) {
    ts -= rand(2, 70) * 60000;
    const ageH = (NOW.getTime() - ts) / 36e5;
    const items = [];
    const n = rng() < 0.75 ? 1 : rng() < 0.7 ? 2 : 3;
    for (let k = 0; k < n; k++) { const p = pickP(); items.push({ p, qty: rng() < 0.85 ? 1 : 2 }); }
    const subtotal = items.reduce((s, it) => s + it.p.price * it.qty, 0);
    const shipping = subtotal > 299 ? 0 : 29.9;
    const c = pick(CUSTOMERS);
    const payment = pick(PAYMENTS);
    let status;
    if (rng() < 0.04) status = 'cancelado';
    else if (payment === 'Boleto' && ageH < 30 && rng() < 0.7) status = 'aguardando';
    else if (ageH < 3) status = 'pago';
    else if (ageH < 20) status = rng() < 0.6 ? 'separacao' : 'pago';
    else if (ageH < 70) status = rng() < 0.7 ? 'enviado' : 'separacao';
    else status = rng() < 0.75 ? 'entregue' : 'enviado';
    list.push({ id: '#' + (482190 - i * 7 - Math.floor(rng() * 6)), date: new Date(ts), customer: c, items, subtotal, shipping, total: subtotal + shipping, payment, installments: payment === 'Cartão de crédito' ? pick([1, 1, 3, 6, 10, 12]) : 1, status, channel: pick(['Site', 'Site', 'App', 'App', 'Marketplace']) });
  }
  return list;
})();

// ---------- Moderação de anúncios de sellers ----------
export const LISTINGS = [
  ['Smartphone Aurora X 256GB 5G — Grafite', 'phone', 'smartphones', 2749, 'TechNorte Distribuidora', [['ok', 'Todas as verificações ok']], 14],
  ['Kit 2 Controles DualPad + Base de Carga', 'gamepad', 'games', 879, 'MegaGamer Store', [['warn', 'Descrição curta'], ['warn', 'Conferir NCM']], 6],
  ['Geladeira Frost Free Inverse 480L Inox', 'fridge', 'eletro', 4399, 'Eletro Sul', [['ok', 'Todas as verificações ok']], 11],
  ['Sofá Retrátil Reclinável 4 Lugares Veludo', 'sofa', 'casa', 2899, 'Lar & Conforto', [['bad', 'Sem nota fiscal']], 22],
  ['Placa de Vídeo Vortex G70 12GB OC Edition', 'gpu', 'hardware', 4599, 'TechNorte Distribuidora', [['warn', 'Preço 18% acima da média']], 9],
  ['Smart TV 65" Mini LED 144Hz', 'tv', 'tv', 5299, 'Casa Prime', [['ok', 'Todas as verificações ok']], 8],
  ['Fone Buds Pro ANC — Edição Branca', 'buds', 'audio', 649, 'MegaGamer Store', [['warn', 'Fotos com marca d\'água']], 5],
  ['Notebook Titan 15 · 32GB · 2TB', 'laptop', 'notebooks', 9299, 'TechNorte Distribuidora', [['ok', 'Todas as verificações ok']], 12],
].map(([title, art, cat, price, seller, checks, photos], i) => ({ id: 'l' + i, title, art, cat, price, seller, checks, photos, sellerId: 'SL-' + (1077 - i), ago: [2, 3, 3, 5, 6, 8, 11, 14][i], type: i % 3 === 1 ? 'Kit' : 'Novo' }));

// ---------- Repasses a sellers ----------
export const PAYOUTS = SELLERS.slice(1).flatMap((s, i) => [0, 1].map((k) => {
  const gross = rand(18000, 160000);
  const fee = gross * 0.145;
  const status = k === 0 ? (i === 2 ? 'vencido' : 'pendente') : 'pago';
  const due = new Date(TODAY); due.setDate(due.getDate() + (status === 'pago' ? -Math.round(rand(3, 25)) : status === 'vencido' ? -2 : Math.round(rand(1, 9))));
  return { id: `RP-${2611 + i * 2 + k}`, seller: s, orders: Math.round(gross / rand(700, 1600)), gross, fee, net: gross - fee, due, status };
}));

// ---------- Atendimento ----------
const TICKET_SUBJECTS = [
  ['Pedido não chegou no prazo', 'Entrega', 'alta'], ['Produto chegou com avaria', 'Troca', 'urgente'], ['Quero cancelar a compra', 'Cancelamento', 'media'],
  ['Boleto não foi compensado', 'Pagamento', 'media'], ['Nota fiscal não recebida', 'Fiscal', 'baixa'], ['Dúvida sobre garantia estendida', 'Pós-venda', 'baixa'],
  ['Cupom BLACK10 não aplicou', 'Promoção', 'alta'], ['Troca de voltagem 110v → 220v', 'Troca', 'media'], ['Estorno do cartão em aberto', 'Pagamento', 'alta'],
  ['Rastreio parado há 4 dias', 'Entrega', 'alta'], ['Instalação do ar-condicionado', 'Serviços', 'baixa'], ['Produto diferente do anúncio', 'Troca', 'urgente'],
];
export const TICKETS = TICKET_SUBJECTS.map(([subject, topic, priority], i) => {
  const c = CUSTOMERS[(i * 7) % CUSTOMERS.length];
  const o = ORDERS[(i * 13) % ORDERS.length];
  return { id: 'AT-' + (90412 - i * 3), subject, topic, priority, customer: c, order: o, status: i < 4 ? 'aberto' : i < 9 ? 'andamento' : 'resolvido', agent: TEAM[i % 2 ? 3 : 9], ago: [4, 12, 25, 38, 60, 95, 130, 180, 260, 400, 720, 1440][i], channel: pick(['WhatsApp', 'E-mail', 'Chat', 'Telefone']) };
});

// ---------- Comunicados ----------
export const ANNOUNCEMENTS = [
  { id: 'a1', title: 'Black Friday: congelamento de preços a partir de segunda', body: 'Nenhum preço pode ser alterado sem aprovação da gerência entre 23/11 e 02/12. Promoções programadas já estão travadas no sistema.', audience: 'Todos', status: 'sent', pinned: true, date: 'há 2 dias', read: 11, total: 13 },
  { id: 'a2', title: 'Novas regras de moderação para sellers', body: 'Todo anúncio de eletrônico agora precisa de pelo menos 6 fotos, ficha técnica completa e nota fiscal de entrada. Anúncios sem esses itens voltam automaticamente.', audience: 'Catálogo', status: 'sent', pinned: false, date: 'há 4 dias', read: 3, total: 4 },
  { id: 'a3', title: 'Plantão de atendimento no fim de semana', body: 'Escala de sábado e domingo publicada. Picos esperados entre 10h e 14h por causa do esquenta Black Friday.', audience: 'Atendimento', status: 'scheduled', pinned: false, date: 'sex., 09:00', read: 0, total: 3 },
  { id: 'a4', title: 'Inventário geral do CD Cajamar', body: 'Contagem cíclica no centro de distribuição nesta quinta. Pedidos de linha branca podem sair com 1 dia a mais de prazo.', audience: 'Operações', status: 'sent', pinned: false, date: 'há 1 semana', read: 5, total: 5 },
];

// ---------- Tarefas ----------
export const TASKS = [
  ['Revisar preços da campanha Black Friday', 'Larissa Moreira', 'alta', 'Hoje', false, 'Promoções'],
  ['Subir 40 SKUs novos de linha branca', 'Thiago Barbosa', 'media', 'Amanhã', false, 'Catálogo'],
  ['Aprovar repasse da TechNorte', 'Juliana Lopes', 'alta', 'Hoje', false, 'Financeiro'],
  ['Responder tickets urgentes de avaria', 'Camila Rocha', 'urgente', 'Hoje', false, 'Atendimento'],
  ['Ajustar frete grátis para região Norte', 'Diego Carvalho', 'media', 'Qua.', false, 'Logística'],
  ['Banner da home para o Dia do Gamer', 'Paula Martins', 'baixa', 'Sex.', true, 'Marketing'],
  ['Conciliação do Pix de outubro', 'Juliana Lopes', 'media', 'Ontem', true, 'Financeiro'],
  ['Teste A/B do checkout em 1 página', 'Gustavo Dias', 'baixa', 'Próx. semana', false, 'Tecnologia'],
].map(([title, who, priority, due, done, tag], i) => ({ id: 'k' + i, title, who, priority, due, done, tag }));

// ---------- Log de atividades ----------
export const ACTIVITY = [
  ['Larissa Moreira', 'alterou o preço de', 'Smart TV 55" 4K QLED Lumen', 'de R$ 3.399 para R$ 3.199', 'price', 6],
  ['Sistema', 'pausou o anúncio', 'Projetor 4K Laser Cine', 'estoque abaixo do mínimo (3 un.)', 'system', 18],
  ['Thiago Barbosa', 'cadastrou', '12 novos produtos', 'categoria Hardware', 'product', 42],
  ['Beatriz Almeida', 'recusou o anúncio', 'Sofá Retrátil Reclinável 4 Lugares', 'sem nota fiscal', 'moderation', 75],
  ['Juliana Lopes', 'pagou o repasse', 'RP-2614', 'Casa Prime · R$ 61.420,18', 'finance', 120],
  ['Camila Rocha', 'aprovou reembolso do pedido', '#481022', 'Pix · R$ 749,00', 'refund', 160],
  ['Erick Umbelino', 'convidou', 'Henrique Costa', 'como Analista de dados', 'team', 300],
  ['Sistema', 'sincronizou estoque com o ERP', '3.482 SKUs', 'em 41 s', 'system', 360],
  ['Rafael Gomes', 'criou o cupom', 'BLACK10', '10% em Hardware, até 30/11', 'price', 520],
  ['Diego Carvalho', 'gerou etiquetas de envio', '214 pedidos', 'transportadora e Correios', 'order', 700],
  ['Gustavo Dias', 'publicou a versão', 'checkout 4.12.0', 'tempo de carregamento −180 ms', 'system', 1440],
  ['Erick Umbelino', 'alterou permissões de', 'Catálogo', '+ moderar anúncios', 'team', 2000],
].map(([who, action, target, detail, kind, mins], i) => ({ id: 'ev' + i, who, action, target, detail, kind, mins }));

// ---------- Integrações ----------
export const INTEGRATIONS = [
  ['Gateway de pagamento', 'Cartão de crédito, antifraude e parcelamento', 'pay', true, 'Pagamentos'],
  ['Pix automático', 'QR Code dinâmico com baixa instantânea', 'pix', true, 'Pagamentos'],
  ['Boleto registrado', 'Emissão e conciliação bancária', 'barcode', true, 'Pagamentos'],
  ['Correios', 'Cotação de frete, etiquetas e rastreio', 'truck', true, 'Logística'],
  ['Transportadoras', 'Linha branca e móveis com entrega agendada', 'truck', true, 'Logística'],
  ['ERP', 'Estoque, notas fiscais e pedidos de compra', 'server', true, 'Gestão'],
  ['Nota fiscal eletrônica', 'Emissão automática de NF-e na aprovação', 'file', true, 'Fiscal'],
  ['Comparadores de preço', 'Feed de produtos para comparadores e shopping', 'tag', false, 'Marketing'],
  ['Marketplaces', 'Publicação do catálogo em outros canais', 'store', true, 'Vendas'],
  ['WhatsApp', 'Notificações de pedido e atendimento', 'chat', true, 'Atendimento'],
  ['Telegram', 'Avisos internos para a equipe', 'send', false, 'Equipe'],
  ['Analytics', 'Funil, eventos e atribuição de campanhas', 'chart', true, 'Marketing'],
].map(([name, desc, icon, on, group], i) => ({ id: 'i' + i, name, desc, icon, on, group, events: on ? Math.round(rand(800, 90000)) : 0 }));

export const SERVICES = [
  ['Loja (site)', 99.98, 182], ['App iOS / Android', 99.95, 210], ['Checkout', 99.99, 240], ['API de catálogo', 99.97, 95],
  ['Busca', 99.9, 64], ['Pagamentos', 99.99, 310], ['Cálculo de frete', 99.6, 420], ['Fila de e-mails', 100, 30],
].map(([name, uptime, latency]) => ({ name, uptime, latency, status: uptime < 99.7 ? 'degraded' : 'ok', days: Array.from({ length: 60 }, () => (rng() < (uptime < 99.7 ? 0.08 : 0.015) ? (rng() < 0.3 ? 2 : 1) : 0)) }));
export const LATENCY = Array.from({ length: 48 }, (_, i) => ({ label: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`, value: Math.round(170 + 60 * Math.sin(i / 7) + rand(-25, 25) + (i > 38 && i < 43 ? 120 : 0)) }));

export const INVOICES = Array.from({ length: 8 }, (_, i) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 5);
  return { id: `FT-${2026 - Math.floor(i / 12)}${String(11 - i).padStart(2, '0')}-0${i + 1}`, date: d, amount: 1890 + (i < 3 ? 410 : 0) + Math.round(rand(0, 380)), status: i === 0 ? 'aberta' : 'paga', plan: 'Business · 20 assentos' };
});

export const FUNNEL = [
  { label: 'Visitas', value: 1840000 },
  { label: 'Viram produto', value: 1012000 },
  { label: 'Adicionaram ao carrinho', value: 182400 },
  { label: 'Iniciaram checkout', value: 74300 },
  { label: 'Pedidos pagos', value: 33120 },
];

export const REGIONS = [
  ['SP', 0.34], ['RJ', 0.12], ['MG', 0.11], ['PR', 0.07], ['RS', 0.065], ['SC', 0.05], ['BA', 0.05], ['DF', 0.035], ['PE', 0.03], ['GO', 0.03], ['CE', 0.025], ['Outros', 0.075],
].map(([uf, share]) => ({ uf, share }));

export const ADMIN = { name: 'Erick Umbelino', first: 'Erick', role: 'Proprietário', store: 'Vitrine' };
