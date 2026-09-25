import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { getDashboardData, deleteTransaction, editTransaction } from '../../lib/sheets';
import cache from '../../lib/cache';

export default async function handler(req, res) {
  // Cek sesi autentikasi
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const cacheKey = 'transactions_data';
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.status(200).json({ transactions: cached.transactions, users: cached.users, goals: cached.goals, fromCache: true });
    }

    try {
      // Ambil data dari Google Sheets / Local Mock DB
      const data = await getDashboardData();
      const transactions = data.recentTransactions || [];
      const users = data.users !== undefined ? data.users : ['Budi', 'Siti'];
      const goals = data.goals || [];
      
      const cacheData = { transactions, users, goals };
      // Simpan ke in-memory cache selama 60 detik (1 menit)
      cache.set(cacheKey, cacheData, 60);
      
      return res.status(200).json({ transactions, users, goals, fromCache: false });
    } catch (error) {
      console.error('Error in /api/transactions:', error);
      return res.status(500).json({ error: 'Failed to retrieve transactions', message: error.message });
    }
  } else if (req.method === 'POST') {
    const { action, index, transaction } = req.body;

    if (!action || index === undefined) {
      return res.status(400).json({ error: 'Parameter action (edit/delete) dan index wajib diisi' });
    }

    const parsedIndex = Number(index);
    if (isNaN(parsedIndex) || parsedIndex < 0) {
      return res.status(400).json({ error: 'Index harus berupa angka valid >= 0' });
    }

    try {
      if (action === 'delete') {
        const result = await deleteTransaction(parsedIndex);
        
        // Invalidate cache
        cache.del('summary_data');
        cache.del('transactions_data');

        return res.status(200).json({ success: true, ...result });

      } else if (action === 'edit') {
        if (!transaction) {
          return res.status(400).json({ error: 'Objek transaction wajib disertakan untuk aksi edit' });
        }

        const { date, category, amount, description, saverName, goalName } = transaction;

        if (!date || !category || amount === undefined || !saverName || !goalName) {
          return res.status(400).json({ error: 'Field date, category, amount, saverName, dan goalName wajib diisi untuk edit' });
        }

        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount)) {
          return res.status(400).json({ error: 'Amount harus berupa angka valid' });
        }

        const result = await editTransaction(parsedIndex, {
          date,
          category,
          amount: parsedAmount,
          description: description || '',
          saverName,
          goalName
        });

        // Invalidate cache
        cache.del('summary_data');
        cache.del('transactions_data');

        return res.status(200).json({ success: true, ...result });

      } else {
        return res.status(400).json({ error: 'Action tidak valid. Gunakan edit atau delete.' });
      }
    } catch (error) {
      console.error(`Error in POST /api/transactions during ${action}:`, error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
