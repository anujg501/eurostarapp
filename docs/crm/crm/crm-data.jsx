// crm-data.jsx — shared mock data for the Eurostar CRM (customers, reps, orders, carts, commissions, queries).
// In production this all comes from the same backend as the Sales App.

const CRM_REPS = [
  { id: 'REP-204', name: 'Rohit Shah', region: 'Gujarat', phone: '+91 98250 11204', rate: 0.04, joined: '2021', target: 8, addedThisMonth: 3, asm: 'L1', head: 'L2' },
  { id: 'REP-118', name: 'Anita Desai', region: 'Maharashtra', phone: '+91 98200 31118', rate: 0.04, joined: '2022', target: 6, addedThisMonth: 5, asm: 'L1', head: 'L2' },
  { id: 'REP-077', name: 'Suresh Iyer', region: 'South India', phone: '+91 98400 50077', rate: 0.035, joined: '2020', target: 10, addedThisMonth: 4, asm: 'L1', head: 'L2' },
];

const CRM_CUSTOMERS = [
  { id: 'EUR-10482', name: 'Tanvi Gold Cast', city: 'Rajkot', gst: '24ABCTC1234F1Z5', mobile: '+91 98240 10482', rep: 'REP-204', tier: 'Platinum', since: '2021', credit: 500000, cartViewsNoOrder: 2 },
  { id: 'EUR-10517', name: 'Malabar Gold (vendor)', city: 'Kozhikode', gst: '32AAACM5678G1Z2', mobile: '+91 98470 10517', rep: 'REP-077', tier: 'Platinum', since: '2020', credit: 800000, terms: '45', cartViewsNoOrder: 0 },
  { id: 'EUR-10663', name: 'Mehta Jewel Works', city: 'Surat', gst: '24AADFM9012H1Z8', mobile: '+91 98250 10663', rep: 'REP-204', tier: 'Gold', since: '2022', credit: 250000, terms: '30', cartViewsNoOrder: 13 },
  { id: 'EUR-10701', name: 'Crescent Ornaments', city: 'Hyderabad', gst: '36AACFC3456J1Z1', mobile: '+91 98660 10701', rep: 'REP-077', tier: 'Gold', since: '2023', credit: 200000, terms: 'cash', cartViewsNoOrder: 4 },
  { id: 'EUR-10744', name: 'Shree Ganesh Jewellers', city: 'Rajkot', gst: '24AAEFS7890K1Z4', mobile: '+91 98240 10744', rep: 'REP-204', tier: 'Silver', since: '2024', credit: 100000, terms: 'cash', cartViewsNoOrder: 11 },
  { id: 'EUR-10788', name: 'Pearl Palace', city: 'Mumbai', gst: '27AAGCP2345L1Z7', mobile: '+91 98200 10788', rep: 'REP-118', tier: 'Gold', since: '2023', credit: 300000, cartViewsNoOrder: 1 },
  { id: 'EUR-10812', name: 'Royal Casting Co.', city: 'Pune', gst: '27AAHCR6789M1Z3', mobile: '+91 98220 10812', rep: 'REP-118', tier: 'Silver', since: '2024', credit: 150000, cartViewsNoOrder: 0 },
];

// status: new | confirmed | packed | shipped | delivered
const CRM_ORDERS = [
  { id: 'SO-24881', cust: 'EUR-10482', date: '2026-06-14', status: 'new', value: 184500, items: 7, courier: '', track: '', discount: 0 },
  { id: 'SO-24876', cust: 'EUR-10517', date: '2026-06-13', status: 'confirmed', value: 412800, items: 14, courier: '', track: '', discount: 5 },
  { id: 'SO-24869', cust: 'EUR-10663', date: '2026-05-02', status: 'delivered', value: 96400, items: 5, courier: 'Bluedart', track: 'BD220045', discount: 0 },
  { id: 'SO-24855', cust: 'EUR-10701', date: '2026-06-11', status: 'shipped', value: 142300, items: 9, courier: 'DTDC', track: 'DT884510023', discount: 3 },
  { id: 'SO-24840', cust: 'EUR-10788', date: '2026-06-09', status: 'delivered', value: 268000, items: 11, courier: 'Bluedart', track: 'BD771209845', discount: 0 },
  { id: 'SO-24822', cust: 'EUR-10482', date: '2026-06-07', status: 'delivered', value: 88900, items: 4, courier: 'Professional', track: 'PR556120098', discount: 0 },
  { id: 'SO-24810', cust: 'EUR-10744', date: '2026-06-05', status: 'delivered', value: 54200, items: 3, courier: 'DTDC', track: 'DT884320011', discount: 8 },
];

// status: active (open) | abandoned | quote-requested
const CRM_CARTS = [
  { id: 'CART-5521', cust: 'EUR-10663', updated: '2026-06-16', status: 'active', value: 73200, items: 4, age: '2h ago' },
  { id: 'CART-5498', cust: 'EUR-10701', updated: '2026-06-15', status: 'quote-requested', value: 318000, items: 12, age: '1 day ago', note: 'Wants best price on bulk moissanite melee' },
  { id: 'CART-5477', cust: 'EUR-10788', updated: '2026-06-14', status: 'abandoned', value: 41600, items: 3, age: '3 days ago' },
  { id: 'CART-5455', cust: 'EUR-10812', updated: '2026-06-13', status: 'abandoned', value: 128400, items: 6, age: '4 days ago' },
  { id: 'CART-5440', cust: 'EUR-10482', updated: '2026-06-16', status: 'active', value: 256900, items: 9, age: '5h ago' },
  { id: 'CART-5402', cust: 'EUR-10744', updated: '2026-06-12', status: 'quote-requested', value: 87500, items: 5, age: '5 days ago', note: 'Requested 10% on first big order' },
];

// RFQ enquiries — same fields as the Sales App RFQ form (data flows app → CRM).
const CRM_QUERIES = [
  { id: 'RFQ-3380', cust: 'EUR-10701', status: 'open', channel: 'WhatsApp', date: '2026-06-16',
    product: 'Moissanite DEF Round', size: '8.00 mm', weight: '—', quality: 'VVS DEF',
    qty: '500 pcs', city: 'Hyderabad', contactName: 'R. Verma', contact: '+91 98660 10701',
    special: 'Need matched calibration, certificate per stone', image: '' },
  { id: 'RFQ-3376', cust: 'EUR-10788', status: 'open', channel: 'Email', date: '2026-06-15',
    product: 'Lab-grown Blue Sapphire Oval', size: '7×5 mm', weight: '—', quality: 'AAA',
    qty: '200 pcs', city: 'Mumbai', contactName: 'F. Khan', contact: '+91 98200 10788',
    special: 'With IGI certificate (₹2000/pc add-on ok)', image: '' },
  { id: 'RFQ-3371', cust: 'EUR-10812', status: 'answered', channel: 'Phone', date: '2026-06-14',
    product: 'Natural Pearl Strands', size: '6 mm', weight: '50 g', quality: 'Natural',
    qty: '40 strings', city: 'Pune', contactName: 'A. Rao', contact: '+91 98220 10812',
    special: 'Round, full drilled, China freshwater', image: '', assignedRep: 'REP-118' },
];
// Auto-assign reps by city/region.
const CRM_CITY_REP = { 'Rajkot':'REP-204', 'Surat':'REP-204', 'Ahmedabad':'REP-204', 'Jaipur':'REP-204',
  'Mumbai':'REP-118', 'Pune':'REP-118', 'Kozhikode':'REP-077', 'Hyderabad':'REP-077', 'Chennai':'REP-077' };

const CRM_HELPERS = (() => {
  const cust = (id) => CRM_CUSTOMERS.find((c) => c.id === id) || { name: id, city: '', rep: '' };
  const rep = (id) => CRM_REPS.find((r) => r.id === id) || { name: id };
  const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const repForCart = (c) => cust(c.cust).rep;
  const cityCoord = (city) => CITY_COORDS[city] || null;
  return { cust, rep, inr, repForCart, cityCoord };
})();

// Approx city centres for field-visit location fallback when GPS is unavailable.
const CITY_COORDS = {
  'Rajkot':{lat:22.3039,lng:70.8022}, 'Surat':{lat:21.1702,lng:72.8311}, 'Ahmedabad':{lat:23.0225,lng:72.5714},
  'Jaipur':{lat:26.9124,lng:75.7873}, 'Mumbai':{lat:19.0760,lng:72.8777}, 'Pune':{lat:18.5204,lng:73.8567},
  'Kozhikode':{lat:11.2588,lng:75.7804}, 'Hyderabad':{lat:17.3850,lng:78.4867}, 'Chennai':{lat:13.0827,lng:80.2707},
  'Nagpur':{lat:21.1458,lng:79.0882}, 'Indore':{lat:22.7196,lng:75.8577}, 'Vijayawada':{lat:16.5062,lng:80.6480},
};

// Field visits: rep check-in / check-out with captured location. day uses the
// demo "today" (the 16th) so seeded + newly-created visits share one date filter.
const CRM_VISITS = [
  { id:'VST-201', rep:'REP-204', custId:'EUR-10482', day:'2026-06-16', checkIn:'2026-06-16T09:42:00', checkOut:'2026-06-16T10:28:00', inLat:22.3039, inLng:70.8022, inAcc:18, inSource:'gps', outLat:22.3041, outLng:70.8019 },
  { id:'VST-202', rep:'REP-204', custId:'EUR-10663', day:'2026-06-16', checkIn:'2026-06-16T11:15:00', checkOut:'2026-06-16T12:05:00', inLat:21.1702, inLng:72.8311, inAcc:25, inSource:'gps', outLat:21.1700, outLng:72.8313 },
  { id:'VST-203', rep:'REP-077', custId:'EUR-10701', day:'2026-06-16', checkIn:'2026-06-16T10:05:00', checkOut:'2026-06-16T11:20:00', inLat:17.3850, inLng:78.4867, inAcc:30, inSource:'gps', outLat:17.3848, outLng:78.4870 },
  { id:'VST-198', rep:'REP-118', custId:'EUR-10788', day:'2026-06-15', checkIn:'2026-06-15T14:30:00', checkOut:'2026-06-15T15:10:00', inLat:19.0760, inLng:72.8777, inAcc:22, inSource:'gps', outLat:19.0762, outLng:72.8775 },
];

// Attendance: per rep, days present this month (June 2026, 26 working days excl. Sundays).
// Customer lifecycle stages (lead → active buyer).
const CRM_STAGES = [
  { id: 1, label: 'Call to fix meeting', short: 'Call' },
  { id: 2, label: 'Met & added customer', short: 'Met' },
  { id: 3, label: 'Sample order given', short: 'Sample' },
  { id: 4, label: 'Feedback meeting', short: 'Feedback' },
  { id: 5, label: 'Satisfied — will order', short: 'Will order' },
  { id: 6, label: 'Active buyer', short: 'Active' },
];

// Leads / customers in the pipeline (rep, current stage, next follow-up date, assignedByAdmin flag).
const CRM_LEADS = [
  // ── Example flagged leads (from "purchased" data that matched existing customers) ──
  { id: 'LD-3901', name: 'Tanvi Gold Casting Pvt Ltd', city: 'Rajkot', mobile: '+91 98240 99901', gst: '24ABCTC1234F1Z5', rep: '', stage: 1, followUp: '2026-06-18', assigned: false, note: 'Purchased list · April batch', flagged: true, flagName: 'Tanvi Gold Cast', flagBy: 'GST' },
  { id: 'LD-3902', name: 'Pearl Palace', city: 'Mumbai', mobile: '+91 98200 99902', gst: '', rep: '', stage: 1, followUp: '2026-06-18', assigned: false, note: 'Purchased list · no GST on record', flagged: true, flagName: 'Pearl Palace', flagBy: 'name + city' },
  { id: 'LD-3001', name: 'Surana Jewellers', city: 'Jaipur', mobile: '+91 98290 30001', rep: 'REP-204', stage: 1, followUp: '2026-06-18', assigned: true,  note: 'Admin-assigned · cold lead, call to fix meeting' },
  { id: 'LD-3002', name: 'Krishna Ornaments', city: 'Surat', mobile: '+91 98250 30002', rep: 'REP-204', stage: 3, followUp: '2026-06-19', assigned: false, note: 'Gave sample order of moissanite melee' },
  { id: 'LD-3003', name: 'Deepak Jewels', city: 'Ahmedabad', mobile: '+91 98240 30003', rep: 'REP-204', stage: 5, followUp: '2026-06-20', assigned: false, note: 'Loved samples, expects to order next week' },
  { id: 'LD-3004', name: 'Anand Gold', city: 'Mumbai', mobile: '+91 98200 30004', rep: 'REP-118', stage: 2, followUp: '2026-06-18', assigned: true,  note: 'Admin-assigned · met, added to book' },
  { id: 'LD-3005', name: 'Sri Lakshmi Jewellery', city: 'Chennai', mobile: '+91 98400 30005', rep: 'REP-077', stage: 4, followUp: '2026-06-21', assigned: false, note: 'Feedback meeting on sample quality' },
  { id: 'LD-3006', name: 'Vaibhav Creations', city: 'Pune', mobile: '+91 98220 30006', rep: 'REP-118', stage: 1, followUp: '2026-06-17', assigned: true,  note: 'Admin-assigned · overdue first call' },
];

const CRM_ATTENDANCE = {
  'REP-204': { present: [2,3,4,5,6,8,9,10,11,12,13,15,16], leave: [7], absent: [1] },
  'REP-118': { present: [1,2,3,4,5,6,8,9,10,11,12,13,15,16], leave: [], absent: [] },
  'REP-077': { present: [2,3,5,6,8,9,10,12,13,15,16], leave: [1,4], absent: [11] },
};

// Reports: sales by category & by month (derived sample), plus outstanding receivables.
const CRM_SALES_BY_CATEGORY = [
  { cat: 'Moissanite Diamonds', revenue: 412800, orders: 14 },
  { cat: 'Color Cubic Zirconia', revenue: 268000, orders: 11 },
  { cat: 'Lab Grown / Created', revenue: 184500, orders: 7 },
  { cat: 'Mother of Pearl', revenue: 96400, orders: 5 },
  { cat: 'Pearls', revenue: 142300, orders: 9 },
  { cat: 'Multi Sapphires', revenue: 88900, orders: 4 },
  { cat: 'Cabochons', revenue: 54200, orders: 3 },
];
const CRM_SALES_BY_MONTH = [
  { m: 'Jan 2026', revenue: 820000, orders: 31 },
  { m: 'Feb 2026', revenue: 910000, orders: 34 },
  { m: 'Mar 2026', revenue: 1180000, orders: 42 },
  { m: 'Apr 2026', revenue: 1040000, orders: 38 },
  { m: 'May 2026', revenue: 1265000, orders: 46 },
  { m: 'Jun 2026', revenue: 1247100, orders: 53 },
];

// Leadership / escalation contacts (admin-managed). role: 'asm' | 'head'
const CRM_LEADERS = [
  { id: 'L1', name: 'Mr Omkar Kanujia', role: 'asm',  phone: '9372342451', region: 'All' },
  { id: 'L2', name: 'Anuj (Sales Head)', role: 'head', phone: '7710065480', region: 'All' },
];

// Franchise requests from the Sales App "Join Franchise" form.
const CRM_FRANCHISE = [
  { id: 'FR-501', name: 'Rajesh Soni', firm: 'Soni Jewellers', city: 'Indore', mobile: '+91 98260 50501', invest: '₹15–25 lakh', exp: 'Yes — established', date: '2026-06-16', status: 'new' },
  { id: 'FR-502', name: 'Imran Shaikh', firm: 'Crescent Gold', city: 'Nagpur', mobile: '+91 90280 50502', invest: '₹10–15 lakh', exp: 'Yes — small/new', date: '2026-06-15', status: 'new' },
  { id: 'FR-503', name: 'Lakshmi Reddy', firm: '—', city: 'Vijayawada', mobile: '+91 94400 50503', invest: '₹25 lakh+', exp: 'No — new to trade', date: '2026-06-14', status: 'contacted' },
];

// Sample payment logs (rep-submitted, pending admin verification)
const CRM_SAMPLE_PAYMENTS = [
  { id:'PAY-101', orderId:'SO-24881', custId:'EUR-10482', mode:'upi',    amount:184500, utr:'326781234501', date:'2026-06-25', by:'', contact:'', img:null, status:'pending', loggedAt:'2026-06-25T10:14:00.000Z' },
  { id:'PAY-102', orderId:'SO-24876', custId:'EUR-10517', mode:'neft',   amount:412800, utr:'HDFC0012345678', date:'2026-06-24', by:'', contact:'', img:null, status:'pending', loggedAt:'2026-06-24T15:42:00.000Z' },
  { id:'PAY-103', orderId:'SO-24855', custId:'EUR-10701', mode:'cash',   amount:142300, utr:'', date:'2026-06-23', by:'Ravi Kumar (driver)', contact:'9876500123', img:null, status:'pending', loggedAt:'2026-06-23T17:05:00.000Z' },
  { id:'PAY-104', orderId:'SO-24869', custId:'EUR-10663', mode:'cheque', amount:96400,  utr:'CHQ-004821', date:'2026-06-22', by:'', contact:'', img:null, status:'pending', loggedAt:'2026-06-22T11:30:00.000Z' },
  { id:'PAY-105', orderId:'SO-24822', custId:'EUR-10482', mode:'upi',    amount:88900,  utr:'326709988712', date:'2026-06-20', by:'', contact:'', img:null, status:'pending', loggedAt:'2026-06-20T09:55:00.000Z' },
];

Object.assign(window, { CRM_REPS, CRM_CUSTOMERS, CRM_ORDERS, CRM_CARTS, CRM_QUERIES, CRM_ATTENDANCE, CRM_STAGES, CRM_LEADS, CRM_CITY_REP, CRM_FRANCHISE, CRM_SALES_BY_CATEGORY, CRM_SALES_BY_MONTH, CRM_LEADERS, CRM_HELPERS, CRM_SAMPLE_PAYMENTS, CRM_VISITS, CITY_COORDS });
