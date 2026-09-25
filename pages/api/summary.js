import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { getDashboardData } from '../../lib/sheets';
import cache from '../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Cek sesi autentikasi
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cacheKey = 'summary_data';
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.status(200).json({ ...cached, fromCache: true });
  }

  try {
    const data = await getDashboardData();
    
    // Simpan ke in-memory cache selama 300 detik (5 menit)
    cache.set(cacheKey, data, 300);
    
    return res.status(200).json({ ...data, fromCache: false });
  } catch (error) {
    console.error('Error in /api/summary:', error);
    return res.status(500).json({ error: 'Failed to retrieve data', message: error.message });
  }
}
