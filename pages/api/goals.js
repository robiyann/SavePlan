import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { addGoal, deleteGoal } from '../../lib/sheets';
import cache from '../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Cek sesi autentikasi
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, name, target } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Parameter action (create/delete) wajib diisi' });
  }

  try {
    if (action === 'create') {
      if (!name || target === undefined) {
        return res.status(400).json({ error: 'Field name dan target wajib diisi untuk membuat target baru' });
      }

      const parsedTarget = Number(target);
      if (isNaN(parsedTarget) || parsedTarget <= 0) {
        return res.status(400).json({ error: 'Target nominal harus berupa angka lebih besar dari 0' });
      }

      const result = await addGoal(name.trim(), parsedTarget);
      
      // Invalidate cache dashboard
      cache.del('summary_data');

      return res.status(200).json({ success: true, ...result });

    } else if (action === 'delete') {
      if (!name) {
        return res.status(400).json({ error: 'Field name wajib diisi untuk menghapus target' });
      }

      const result = await deleteGoal(name);

      // Invalidate cache dashboard
      cache.del('summary_data');

      return res.status(200).json({ success: true, ...result });

    } else {
      return res.status(400).json({ error: 'Action tidak valid. Gunakan create atau delete.' });
    }
  } catch (error) {
    console.error(`Error in /api/goals during ${action}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
