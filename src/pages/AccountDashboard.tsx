import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useMemo } from "react";
import { Landmark, Wallet, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface Account {
  id: number;
  name: string;
  type: 'bank' | 'digital' | 'cash';
}

interface Transaction {
  id: number;
  account: string;
  type: "pemasukan" | "pengeluaran";
  amount: number;
  date: string; // Tambahkan properti date
}

interface AccountSummary {
  name: string;
  type: 'bank' | 'digital' | 'cash';
  income: number;
  expense: number;
  balance: number;
  lastCheckedDate: string | null; // Tambahkan properti ini
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const AccountDashboard = () => {
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('id, account, type, amount, date'); // Ambil juga kolom date
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { bankAccountsSummary, digitalWalletsSummary, cashAccountsSummary } = useMemo(() => {
    if (!accounts || !transactions) return { bankAccountsSummary: [], digitalWalletsSummary: [], cashAccountsSummary: [] };

    const summaryMap: Record<string, AccountSummary> = {};

    accounts.forEach(acc => {
      summaryMap[acc.name] = {
        name: acc.name,
        type: acc.type,
        income: 0,
        expense: 0,
        balance: 0,
        lastCheckedDate: null, // Inisialisasi null
      };
    });

    transactions.forEach(t => {
      if (summaryMap[t.account]) {
        if (t.type === 'pemasukan') {
          summaryMap[t.account].income += t.amount;
        } else {
          summaryMap[t.account].expense += t.amount;
        }
        // Perbarui lastCheckedDate jika transaksi ini lebih baru
        if (!summaryMap[t.account].lastCheckedDate || parseISO(t.date) > parseISO(summaryMap[t.account].lastCheckedDate)) {
          summaryMap[t.account].lastCheckedDate = t.date;
        }
      }
    });

    Object.values(summaryMap).forEach(summary => {
      summary.balance = summary.income - summary.expense;
    });

    const bank: AccountSummary[] = [];
    const digital: AccountSummary[] = [];
    const cash: AccountSummary[] = [];

    Object.values(summaryMap).forEach(summary => {
      if (summary.type === 'bank') bank.push(summary);
      else if (summary.type === 'digital') digital.push(summary);
      else if (summary.type === 'cash') cash.push(summary);
    });

    return { bankAccountsSummary: bank, digitalWalletsSummary: digital, cashAccountsSummary: cash };
  }, [accounts, transactions]);

  if (isLoadingAccounts || isLoadingTransactions) {
    return <div>Memuat ringkasan rekening...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard Rekening</h1>
      <p className="text-muted-foreground mb-6">
        Ringkasan saldo dan aliran kas per rekening Anda.
      </p>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Rekening Bank</h2>
          {bankAccountsSummary.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bankAccountsSummary.map(summary => (
                <Card key={summary.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Landmark className="h-5 w-5 text-muted-foreground" />
                      {summary.name}
                    </CardTitle>
                    <CardDescription>
                      Saldo Akhir: <span className="font-bold text-foreground">{formatCurrency(summary.balance)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pemasukan</span>
                      <span className="text-green-600 font-medium">{formatCurrency(summary.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pengeluaran</span>
                      <span className="text-red-600 font-medium">{formatCurrency(summary.expense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pengecekan Akhir</span>
                      <span className="font-medium">
                        {summary.lastCheckedDate ? format(parseISO(summary.lastCheckedDate), "d MMM yyyy", { locale: id }) : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-md">
              <p className="text-muted-foreground">Belum ada rekening bank untuk ditampilkan.</p>
              <p className="text-sm text-muted-foreground">Silakan tambahkan rekening di halaman Rekening Bank.</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Dompet Digital</h2>
          {digitalWalletsSummary.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {digitalWalletsSummary.map(summary => (
                <Card key={summary.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                      {summary.name}
                    </CardTitle>
                    <CardDescription>
                      Saldo Akhir: <span className="font-bold text-foreground">{formatCurrency(summary.balance)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pemasukan</span>
                      <span className="text-green-600 font-medium">{formatCurrency(summary.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pengeluaran</span>
                      <span className="text-red-600 font-medium">{formatCurrency(summary.expense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pengecekan Akhir</span>
                      <span className="font-medium">
                        {summary.lastCheckedDate ? format(parseISO(summary.lastCheckedDate), "d MMM yyyy", { locale: id }) : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-md">
              <p className="text-muted-foreground">Belum ada dompet digital untuk ditampilkan.</p>
              <p className="text-sm text-muted-foreground">Silakan tambahkan dompet digital di halaman Rekening Bank.</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Kas Tunai</h2>
          {cashAccountsSummary.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cashAccountsSummary.map(summary => (
                <Card key={summary.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      {summary.name}
                    </CardTitle>
                    <CardDescription>
                      Saldo Akhir: <span className="font-bold text-foreground">{formatCurrency(summary.balance)}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pemasukan</span>
                      <span className="text-green-600 font-medium">{formatCurrency(summary.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Pengeluaran</span>
                      <span className="text-red-600 font-medium">{formatCurrency(summary.expense)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pengecekan Akhir</span>
                      <span className="font-medium">
                        {summary.lastCheckedDate ? format(parseISO(summary.lastCheckedDate), "d MMM yyyy", { locale: id }) : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border rounded-md">
              <p className="text-muted-foreground">Belum ada akun kas tunai untuk ditampilkan.</p>
              <p className="text-sm text-muted-foreground">Silakan tambahkan akun kas tunai di halaman Rekening Bank.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDashboard;