import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { addUser, deleteUser } from '../../lib/sheets';
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

  const { action, name } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Parameter action (create/delete) wajib diisi' });
  }

  try {
    if (action === 'create') {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama anggota wajib diisi' });
      }

      const result = await addUser(name.trim());
      
      // Invalidate cache dashboard & transactions
      cache.del('summary_data');
      cache.del('transactions_data');

      return res.status(200).json({ success: true, ...result });

    } else if (action === 'delete') {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama anggota wajib diisi untuk menghapus' });
      }

      const result = await deleteUser(name.trim());

      // Invalidate cache dashboard & transactions
      cache.del('summary_data');
      cache.del('transactions_data');

      return res.status(200).json({ success: true, ...result });

    } else {
      return res.status(400).json({ error: 'Action tidak valid. Gunakan create atau delete.' });
    }
  } catch (error) {
    console.error(`Error in /api/users during ${action}:`, error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
