import NodeCache from 'node-cache';

// Membuat instance singleton NodeCache dengan default TTL 60 detik (1 menit)
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export default cache;
