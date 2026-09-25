import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// Format private key (Vercel & .env.local string escaping)
const formattedPrivateKey = privateKey ? privateKey.replace(/\\n/g, '\n') : null;

let sheetsClient = null;

if (clientEmail && formattedPrivateKey && spreadsheetId) {
  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Google Sheets Client Initialization Failed:', error);
  }
}

// Path ke database lokal mock
const dbPath = path.join(process.cwd(), 'db.json');

// Helper untuk membaca database lokal
function readMockDb() {
  if (!fs.existsSync(dbPath)) {
    // Definisikan default data jika file tidak ditemukan
    const defaultData = {
      summary: {
        totalSavings: 0,
        savingTarget: 145000000,
        progressPercent: '0%',
        statsHeader: ['Saldo Bersama', 'Target', 'Sisa Target']
      },
      transactions: [
        ['2026-06-01', 'Tabungan', '2000000', 'Gaji Juni', 'Budi', 'Menikah 2027'],
        ['2026-06-01', 'Tabungan', '2000000', 'Gaji Juni', 'Siti', 'Menikah 2027'],
        ['2026-05-28', 'Makanan', '-350000', 'Makan malam anniversary', 'Budi', 'Liburan ke Jepang'],
        ['2026-05-25', 'Investasi', '1500000', 'Top-up Reksa Dana', 'Siti', 'Menikah 2027'],
        ['2026-05-19', 'Tabungan', '2000000', 'Setor dana darurat', 'Budi', 'Dana Darurat'],
        ['2026-05-20', 'Belanja', '-120000', 'Beli perlengkapan rumah', 'Budi', 'Dana Darurat'],
        ['2026-05-15', 'Tabungan', '5000000', 'Bonus projek', 'Budi', 'Liburan ke Jepang'],
        ['2026-05-10', 'Hiburan', '-280000', 'Tiket nonton & popcorn', 'Siti', 'Liburan ke Jepang']
      ],
      goals: [
        ['Menikah 2027', '100000000', '0'],
        ['Liburan ke Jepang', '30000000', '0'],
        ['Dana Darurat', '15000000', '0']
      ],
      users: ['Budi', 'Siti']
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading mock db.json:', err);
    return {};
  }
}

// Helper untuk menulis ke database lokal
function writeMockDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing mock db.json:', err);
  }
}

// Fungsi pembantu untuk menghitung saldo target & saldo bersama secara dinamis
function calculateGoalBalances(data) {
  const transactions = data.transactions || [];
  const goals = data.goals || [];

  // Hitung jumlah terkumpul untuk masing-masing goal
  const updatedGoals = goals.map((goal) => {
    const goalName = goal[0];
    const goalTarget = Number(goal[1]) || 0;
    
    // Sum transaksi yang cocok dengan nama goal ini
    const goalSaved = transactions
      .filter((t) => t[5] === goalName)
      .reduce((sum, t) => sum + (Number(t[2]) || 0), 0);

    return [goalName, goalTarget.toString(), goalSaved.toString()];
  });

  // Hitung total saldo terkumpul & target kumulatif
  const totalSavings = updatedGoals.reduce((sum, g) => sum + (Number(g[2]) || 0), 0);
  const savingTarget = updatedGoals.reduce((sum, g) => sum + (Number(g[1]) || 0), 0);
  
  const progress = savingTarget > 0 ? Math.min(100, Math.round((totalSavings / savingTarget) * 1000) / 10) : 0;
  const progressPercent = `${progress}%`;

  return {
    goals: updatedGoals,
    summary: {
      totalSavings,
      savingTarget,
      progressPercent,
      statsHeader: ['Saldo Bersama', 'Target', 'Sisa Target']
    }
  };
}

// Ambil semua data (Dashboard & Transaksi)
export async function getDashboardData() {
  const isMock = !sheetsClient || !spreadsheetId || spreadsheetId.includes('your_spreadsheet_id_here');
  
  if (isMock) {
    const data = readMockDb();
    // Hitung saldo secara dinamis dari tabel transaksi
    const calculated = calculateGoalBalances(data);
    
    return {
      isMock: true,
      totalSavings: calculated.summary.totalSavings,
      savingTarget: calculated.summary.savingTarget,
      progressPercent: calculated.summary.progressPercent,
      statsHeader: calculated.summary.statsHeader,
      recentTransactions: data.transactions,
      goals: calculated.goals,
      users: data.users || ['Budi', 'Siti'],
    };
  }

  try {
    // Satu API call batchGet
    // F6: Saldo, H6: Target, K6: Persen, A10:C10: Header, A21:F: Transaksi (kolom F untuk Goal), I21:K: Goals, N21:N: Users
    const response = await sheetsClient.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: ['F6', 'H6', 'K6', 'A10:C10', 'A21:F', 'I21:K', 'N21:N'],
    });

    const valueRanges = response.data.valueRanges || [];
    
    const transactions = valueRanges[4]?.values || [];
    const rawGoals = valueRanges[5]?.values || [];
    const rawUsers = valueRanges[6]?.values || [];

    const users = rawUsers
      .map((row) => row[0])
      .filter((name) => name && name.trim() !== '');

    const finalUsers = users;

    // Lakukan kalkulasi dinamis untuk goals berdasarkan transaksi
    const dummyData = {
      transactions,
      goals: rawGoals
    };
    
    const calculated = calculateGoalBalances(dummyData);

    // Dapatkan target & total dari hasil kalkulasi dinamis
    const totalSavingsVal = calculated.summary.totalSavings;
    const savingTargetVal = calculated.summary.savingTarget;
    const progressPercentVal = calculated.summary.progressPercent;
    const computedGoals = calculated.goals;

    return {
      isMock: false,
      totalSavings: totalSavingsVal,
      savingTarget: savingTargetVal,
      progressPercent: progressPercentVal,
      statsHeader: valueRanges[3]?.values?.[0] || ['Saldo Bersama', 'Target', 'Sisa Target'],
      recentTransactions: transactions,
      goals: computedGoals,
      users: finalUsers,
    };
  } catch (error) {
    console.error('Error fetching Google Sheets, falling back to mock DB:', error.message);
    const data = readMockDb();
    const calculated = calculateGoalBalances(data);
    
    return {
      isMock: true,
      error: error.message,
      totalSavings: calculated.summary.totalSavings,
      savingTarget: calculated.summary.savingTarget,
      progressPercent: calculated.summary.progressPercent,
      statsHeader: calculated.summary.statsHeader,
      recentTransactions: data.transactions,
      goals: calculated.goals,
      users: data.users || ['Budi', 'Siti'],
    };
  }
}

// Tambah Transaksi Baru
export async function addTransaction(date, category, amount, description, saverName, goalName) {
  const isMock = !sheetsClient || !spreadsheetId || spreadsheetId.includes('your_spreadsheet_id_here');
  
  if (isMock) {
    const data = readMockDb();
    const parsedAmount = Number(amount) || 0;

    // Tambah baris transaksi baru dengan 6 kolom
    data.transactions.unshift([
      date,
      category,
      parsedAmount.toString(),
      description,
      saverName,
      goalName
    ]);

    // Recalculate semua saldo & simpan ke db.json
    const calculated = calculateGoalBalances(data);
    data.goals = calculated.goals;
    data.summary = calculated.summary;

    writeMockDb(data);
    return { success: true, mode: 'mock' };
  }

  try {
    const data = await getDashboardData();
    const currentTransactions = data.recentTransactions || [];
    
    // Filter hanya transaksi yang valid (memiliki kolom Tanggal/Date yang tidak kosong)
    const validTransactions = currentTransactions.filter((t) => t[0] && t[0].trim() !== '');

    // Tambah transaksi baru ke bagian akhir (bottom)
    validTransactions.push([
      date,
      category,
      amount.toString(),
      description || '',
      saverName,
      goalName
    ]);

    const result = await saveTransactionsList(validTransactions);
    return { success: true, mode: 'sheets', ...result };
  } catch (error) {
    console.error('Error adding transaction to Google Sheets, falling back to mock DB:', error.message);
    
    // Jalankan fallback ke mock db jika gagal
    const data = readMockDb();
    const parsedAmount = Number(amount) || 0;
    
    data.transactions.unshift([
      date,
      category,
      parsedAmount.toString(),
      description,
      saverName,
      goalName
    ]);
    
    const calculated = calculateGoalBalances(data);
    data.goals = calculated.goals;
    data.summary = calculated.summary;
    
    writeMockDb(data);
    return { success: true, mode: 'mock_fallback', error: error.message };
  }
}

// Simpan Daftar Goal Baru (Overwrite ke I21:K)
export async function saveGoalsList(goals) {
  const isMock = !sheetsClient || !spreadsheetId || spreadsheetId.includes('your_spreadsheet_id_here');
  
  if (isMock) {
    const data = readMockDb();
    data.goals = goals.map((g) => [g[0].toString(), g[1].toString(), (g[2] || '0').toString()]);
    
    const calculated = calculateGoalBalances(data);
    data.goals = calculated.goals;
    data.summary = calculated.summary;
    
    writeMockDb(data);
    return { success: true, mode: 'mock' };
  }

  try {
    const emptyRows = Array.from({ length: 15 }, () => ['', '', '']);
    goals.forEach((g, index) => {
      if (index < 15) {
        emptyRows[index] = [g[0].toString(), g[1].toString(), (g[2] || '0').toString()];
      }
    });

    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: 'I21:K',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: emptyRows,
      },
    });

    return { success: true, mode: 'sheets' };
  } catch (error) {
    console.error('Error saving goals list, falling back to mock DB:', error.message);
    const data = readMockDb();
    data.goals = goals.map((g) => [g[0].toString(), g[1].toString(), (g[2] || '0').toString()]);
    const calculated = calculateGoalBalances(data);
    data.goals = calculated.goals;
    data.summary = calculated.summary;
    writeMockDb(data);
    return { success: true, mode: 'mock_fallback', error: error.message };
  }
}

// Tambah Goal Baru
export async function addGoal(name, target) {
  const data = await getDashboardData();
  const currentGoals = data.goals || [];

  if (currentGoals.some((g) => g[0].toLowerCase() === name.toLowerCase())) {
    throw new Error('Target dengan nama tersebut sudah terdaftar!');
  }

  currentGoals.push([name, target.toString(), '0']);
  return await saveGoalsList(currentGoals);
}

// Hapus Goal
export async function deleteGoal(name) {
  const data = await getDashboardData();
  const currentGoals = data.goals || [];

  const updatedGoals = currentGoals.filter((g) => g[0].toLowerCase() !== name.toLowerCase());

  if (currentGoals.length === updatedGoals.length) {
    throw new Error('Target tidak ditemukan!');
  }

  return await saveGoalsList(updatedGoals);
}

// Simpan Daftar User Baru (Overwrite ke N21:N)
export async function saveUsersList(users) {
  const isMock = !sheetsClient || !spreadsheetId || spreadsheetId.includes('your_spreadsheet_id_here');
  
  if (isMock) {
    const data = readMockDb();
    data.users = users.map((u) => u.toString());
    writeMockDb(data);
    return { success: true, mode: 'mock' };
  }

  try {
    const emptyRows = Array.from({ length: 15 }, () => ['']);
    users.forEach((u, index) => {
      if (index < 15) {
        emptyRows[index] = [u.toString()];
      }
    });

    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: 'N21:N',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: emptyRows,
      },
    });

    return { success: true, mode: 'sheets' };
  } catch (error) {
    console.error('Error saving users list, falling back to mock DB:', error.message);
    const data = readMockDb();
    data.users = users.map((u) => u.toString());
    writeMockDb(data);
    return { success: true, mode: 'mock_fallback', error: error.message };
  }
}

// Tambah User Baru
export async function addUser(name) {
  const data = await getDashboardData();
  const currentUsers = data.users || [];

  if (currentUsers.some((u) => u.toLowerCase() === name.toLowerCase())) {
    throw new Error('Anggota dengan nama tersebut sudah terdaftar!');
  }

  currentUsers.push(name);
  return await saveUsersList(currentUsers);
}

// Hapus User
export async function deleteUser(name) {
  const data = await getDashboardData();
  const currentUsers = data.users || [];

  const updatedUsers = currentUsers.filter((u) => u.toLowerCase() !== name.toLowerCase());

  if (currentUsers.length === updatedUsers.length) {
    throw new Error('Anggota tidak ditemukan!');
  }

  return await saveUsersList(updatedUsers);
}

// Simpan Daftar Transaksi Baru (Overwrite ke A21:F setelah clearing)
export async function saveTransactionsList(transactions) {
  const isMock = !sheetsClient || !spreadsheetId || spreadsheetId.includes('your_spreadsheet_id_here');
  
  if (isMock) {
    const data = readMockDb();
    data.transactions = transactions.map((t) => [
      t[0].toString(),
      t[1].toString(),
      t[2].toString(),
      (t[3] || '').toString(),
      t[4].toString(),
      t[5].toString()
    ]);
    
    // Recalculate goals & summary
    const calculated = calculateGoalBalances(data);
    data.goals = calculated.goals;
    data.summary = calculated.summary;

    writeMockDb(data);
    return { success: true, mode: 'mock' };
  }

  try {
    // Clear range A21:H terlebih dahulu
    await sheetsClient.spreadsheets.values.clear({
      spreadsheetId,
      range: 'A21:H',
    });

    if (transactions.length > 0) {
      const formattedValues = transactions.map((t) => [
        t[0].toString(),
        t[1].toString(),
        t[2].toString(),
        (t[3] || '').toString(),
        t[4].toString(),
        t[5].toString()
      ]);

      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `A21:F${20 + transactions.length}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: formattedValues,
        },
      });
    }

    return { success: true, mode: 'sheets' };
  } catch (error) {
    console.error('Error saving transactions list, falling back to mock DB:', error.message);
    const data = readMockDb();
    data.transactions = transactions.map((t) => [
      t[0].toString(),
      t[1].toString(),
      t[2].toString(),
      (t[3] || '').toString(),
      t[4].toString(),
      t[5].toString()
    ]);
    
    const calculated = calculateGoalBalances(data);
    data.goals = calculated.goals;
    data.summary = calculated.summary;

    writeMockDb(data);
    return { success: true, mode: 'mock_fallback', error: error.message };
  }
}

// Hapus Transaksi Berdasarkan Indeks
export async function deleteTransaction(index) {
  const data = await getDashboardData();
  const currentTransactions = data.recentTransactions || [];

  if (index < 0 || index >= currentTransactions.length) {
    throw new Error('Transaksi tidak ditemukan!');
  }

  const updatedTransactions = [...currentTransactions];
  updatedTransactions.splice(index, 1);

  return await saveTransactionsList(updatedTransactions);
}

// Edit Transaksi Berdasarkan Indeks
export async function editTransaction(index, updatedTx) {
  const data = await getDashboardData();
  const currentTransactions = data.recentTransactions || [];

  if (index < 0 || index >= currentTransactions.length) {
    throw new Error('Transaksi tidak ditemukan!');
  }

  const updatedTransactions = [...currentTransactions];
  updatedTransactions[index] = [
    updatedTx.date,
    updatedTx.category,
    updatedTx.amount.toString(),
    updatedTx.description || '',
    updatedTx.saverName,
    updatedTx.goalName
  ];

  return await saveTransactionsList(updatedTransactions);
}
