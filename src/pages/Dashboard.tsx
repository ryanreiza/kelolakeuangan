import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, CreditCard, PiggyBank as PiggyBankIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { startOfMonth, endOfMonth } from "date-fns";

interface Transaction {
  id: number;
  date: string;
  type: "pemasukan" | "pengeluaran";
  amount: number;
  category: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const Dashboard = () => {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, type, amount, category');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const summary = useMemo(() => {
    if (!transactions) {
      return { totalBalance: 0, monthlyExpense: 0, monthlyIncome: 0 };
    }

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    let totalIncome = 0;
    let totalExpense = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    for (const t of transactions) {
      const transactionDate = new Date(t.date);
      if (t.type === 'pemasukan') {
        totalIncome += t.amount;
        if (transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth && t.category !== 'Transfer Masuk') {
          monthlyIncome += t.amount;
        }
      } else {
        totalExpense += t.amount;
        if (transactionDate >= startOfCurrentMonth && transactionDate <= endOfCurrentMonth && t.category !== 'Transfer Keluar') {
          monthlyExpense += t.amount;
        }
      }
    }

    return {
      totalBalance: totalIncome - totalExpense,
      monthlyExpense,
      monthlyIncome,
    };
  }, [transactions]);

  if (isLoading) {
    return <div>Memuat data dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Utama</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              dari semua rekening aktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pengeluaran Bulan Ini
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.monthlyExpense)}</div>
            <p className="text-xs text-muted-foreground">
              Total pengeluaran bulan ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
            <PiggyBankIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">
              Total pemasukan bulan ini
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Aliran Kas Terbaru</CardTitle>
            <CardDescription>
              Placeholder untuk grafik aliran kas.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 bg-gray-100 rounded-b-lg flex items-center justify-center">
            <p className="text-muted-foreground">Chart akan ditampilkan di sini</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;