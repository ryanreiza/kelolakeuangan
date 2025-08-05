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
import { Landmark, Wallet } from "lucide-react";

interface Account {
  id: number;
  name: string;
  type: 'bank' | 'digital';
}

interface Transaction {
  id: number;
  account: string;
  type: "pemasukan" | "pengeluaran";
  amount: number;
}

interface AccountSummary {
  name: string;
  type: 'bank' | 'digital';
  income: number;
  expense: number;
  balance: number;
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
      const { data, error } = await supabase.from('transactions').select('id, account, type, amount');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const accountSummaries = useMemo(() => {
    if (!accounts || !transactions) return [];

    const summaryMap: Record<string, AccountSummary> = {};

    accounts.forEach(acc => {
      summaryMap[acc.name] = {
        name: acc.name,
        type: acc.type,
        income: 0,
        expense: 0,
        balance: 0,
      };
    });

    transactions.forEach(t => {
      if (summaryMap[t.account]) {
        if (t.type === 'pemasukan') {
          summaryMap[t.account].income += t.amount;
        } else {
          summaryMap[t.account].expense += t.amount;
        }
      }
    });

    Object.values(summaryMap).forEach(summary => {
      summary.balance = summary.income - summary.expense;
    });

    return Object.values(summaryMap);
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
      {accountSummaries.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountSummaries.map(summary => (
            <Card key={summary.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {summary.type === 'bank' ? <Landmark className="h-5 w-5 text-muted-foreground" /> : <Wallet className="h-5 w-5 text-muted-foreground" />}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md">
          <p className="text-muted-foreground">Belum ada rekening untuk ditampilkan.</p>
          <p className="text-sm text-muted-foreground">Silakan tambahkan rekening di halaman Rekening Bank.</p>
        </div>
      )}
    </div>
  );
};

export default AccountDashboard;