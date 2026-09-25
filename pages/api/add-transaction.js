import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { addTransaction } from '../../lib/sheets';
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

  const { date, category, amount, description, saverName, goalName } = req.body;

  // Validasi input dasar
  if (!date || !category || amount === undefined || !saverName || !goalName) {
    return res.status(400).json({ error: 'Field date, category, amount, saverName, dan goalName wajib diisi' });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount)) {
    return res.status(400).json({ error: 'Amount harus berupa angka valid' });
  }

  try {
    // Jalankan fungsi penambahan ke Google Sheets / Mock DB
    const result = await addTransaction(date, category, parsedAmount, description || '', saverName, goalName);
    
    // Invalidate cache karena data telah diubah
    cache.del('summary_data');
    cache.del('transactions_data');
    
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error in /api/add-transaction:', error);
    return res.status(500).json({ error: 'Failed to save transaction', message: error.message });
  }
}
