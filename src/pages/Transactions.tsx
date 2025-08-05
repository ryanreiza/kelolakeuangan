import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Calendar as CalendarIcon, Trash2, Loader2, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

type TransactionType = "pemasukan" | "pengeluaran" | "transfer";

interface Transaction {
  id: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  description: string | null;
  account: string;
  user_id: string;
  saving_goal_id?: string | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

interface SavingGoal {
  id: string;
  goal_name: string;
}

const Transactions = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");

  // Form state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<TransactionType>("pengeluaran");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [account, setAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: savingGoals } = useQuery<SavingGoal[]>({
    queryKey: ['saving_goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('saving_goals').select('id, goal_name');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (newTransactions: Omit<Transaction, 'id'>[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi.");
      
      const transactionsWithUserId = newTransactions.map(t => ({ ...t, user_id: user.id }));
      const { error } = await supabase.from('transactions').insert(transactionsWithUserId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['saving_goals'] });
      showSuccess("Transaksi berhasil ditambahkan!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      showError(`Gagal menambahkan transaksi: ${err.message}`);
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('transactions').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['saving_goals'] });
      showSuccess("Transaksi berhasil dihapus.");
    },
    onError: (err) => {
      showError(`Gagal menghapus transaksi: ${err.message}`);
    }
  });

  const resetTransactionsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error("Pengguna tidak terautentikasi atau email tidak ditemukan.");
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: resetPassword,
      });

      if (authError) {
        throw new Error(`Verifikasi kata sandi gagal: ${authError.message}`);
      }

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error(`Gagal menghapus transaksi: ${deleteError.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['saving_goals'] });
      showSuccess("Semua transaksi berhasil direset!");
      setIsResetConfirmOpen(false);
      setResetPassword("");
    },
    onError: (err) => {
      showError(`Reset gagal: ${err.message}`);
    },
  });

  const resetForm = () => {
    setDate(new Date());
    setType("pengeluaran");
    setCategory("");
    setAmount("");
    setDescription("");
    setAccount("");
    setToAccount("");
    setSavingGoalId(null);
  };

  const handleAddTransaction = () => {
    if (!date || !amount) {
      showError("Harap isi Tanggal dan Jumlah.");
      return;
    }

    const transactionAmount = parseFloat(amount);
    const transactionDate = format(date, "yyyy-MM-dd");

    if (type === 'transfer') {
      if (!account || !toAccount || account === toAccount) {
        showError("Harap pilih rekening asal dan tujuan yang berbeda.");
        return;
      }
      const transferTransactions = [
        { date: transactionDate, type: 'pengeluaran' as TransactionType, category: 'Transfer Keluar', amount: transactionAmount, description: description || `Transfer ke ${toAccount}`, account },
        { date: transactionDate, type: 'pemasukan' as TransactionType, category: 'Transfer Masuk', amount: transactionAmount, description: description || `Transfer dari ${account}`, account: toAccount },
      ];
      addTransactionMutation.mutate(transferTransactions);
    } else {
      if (!category || !account) {
        showError("Harap isi Kategori dan Rekening.");
        return;
      }
      const newTransaction: Omit<Transaction, 'id' | 'user_id'> = {
        date: transactionDate,
        type,
        category,
        amount: transactionAmount,
        description,
        account,
      };

      // Link saving goal for income (Tabungan) or expense (Penarikan Tabungan)
      if ((type === 'pemasukan' && category === 'Tabungan' || type === 'pengeluaran' && category === 'Penarikan Tabungan') && savingGoalId) {
        newTransaction.saving_goal_id = savingGoalId;
      }

      addTransactionMutation.mutate([newTransaction]);
    }
  };

  const handleDeleteTransaction = (id: number) => {
    deleteTransactionMutation.mutate(id);
  };

  const handleResetTransactions = () => {
    handleResetTransactions();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const availableCategories = useMemo(() => {
    if (!categories) return [];
    if (type === 'pemasukan') {
      return categories.filter(c => c.type === 'pendapatan');
    } else {
      // For expenses, include 'pengeluaran', 'tagihan', 'hutang', and 'Penarikan Tabungan'
      return categories.filter(c => ['pengeluaran', 'tagihan', 'hutang'].includes(c.type) || c.name === 'Penarikan Tabungan');
    }
  }, [categories, type]);

  const availableSavingGoals = useMemo(() => {
    return savingGoals || [];
  }, [savingGoals]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Buku Kas</h1>
          <p className="text-muted-foreground">
            Catat dan lihat semua arus kas Anda di sini.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1">
                <Trash2 className="h-4 w-4" />
                Reset Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reset Semua Transaksi?</DialogTitle>
                <DialogDescription>
                  Tindakan ini akan menghapus semua data transaksi Anda secara permanen.
                  Untuk melanjutkan, masukkan kata sandi akun Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reset-password" className="text-right">Kata Sandi</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="col-span-3"
                    placeholder="Masukkan kata sandi Anda"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={() => setResetPassword("")}>Batal</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleResetTransactions}
                  disabled={resetTransactionsMutation.isPending || resetPassword.length === 0}
                >
                  {resetTransactionsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Sekarang
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Tambah Transaksi Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: idLocale }) : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Transaksi</Label>
                  <Select value={type} onValueChange={(value) => { setType(value as TransactionType); setCategory(''); setSavingGoalId(null); }}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih jenis transaksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                      <SelectItem value="pemasukan">Pemasukan</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type === 'transfer' ? (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fromAccount" className="text-right">Dari Rekening</Label>
                      <Select value={account} onValueChange={setAccount}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih rekening asal" /></SelectTrigger>
                        <SelectContent>
                          {accounts?.map(acc => (<SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="toAccount" className="text-right">Ke Rekening</Label>
                      <Select value={toAccount} onValueChange={setToAccount}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih rekening tujuan" /></SelectTrigger>
                        <SelectContent>
                          {accounts?.filter(acc => acc.name !== account).map(acc => (<SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">Kategori</Label>
                      <Select value={category} onValueChange={(value) => { setCategory(value); setSavingGoalId(null); }}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                        <SelectContent>
                          {availableCategories.map(cat => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(type === 'pemasukan' && category === 'Tabungan' || type === 'pengeluaran' && category === 'Penarikan Tabungan') && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="savingGoal" className="text-right">Tujuan Tabungan</Label>
                        <Select value={savingGoalId || ""} onValueChange={setSavingGoalId}>
                          <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih tujuan tabungan" /></SelectTrigger>
                          <SelectContent>
                            {availableSavingGoals.map(goal => (<SelectItem key={goal.id} value={goal.id}>{goal.goal_name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="account" className="text-right">Rekening</Label>
                      <Select value={account} onValueChange={setAccount}>
                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih rekening/dompet" /></SelectTrigger>
                        <SelectContent>
                          {accounts?.map(acc => (<SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Jumlah</Label>
                  <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 50000" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Keterangan</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Opsional" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={resetForm}>Batal</Button></DialogClose>
                <Button onClick={handleAddTransaction} disabled={addTransactionMutation.isPending}>
                  {addTransactionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Rekening</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingTransactions ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Memuat data transaksi...
                </TableCell>
              </TableRow>
            ) : transactions && transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{format(parseISO(t.date), "d MMM yyyy", { locale: idLocale })}</TableCell>
                  <TableCell>
                    <div className="font-medium">{t.category}</div>
                    <div className={`text-xs ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'pemasukan' ? 'Pemasukan' : t.category.includes('Transfer') ? 'Transfer' : 'Pengeluaran'}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell>{t.description || "-"}</TableCell>
                  <TableCell>{t.account}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(t.id)} disabled={deleteTransactionMutation.isPending}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Belum ada transaksi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Transactions;