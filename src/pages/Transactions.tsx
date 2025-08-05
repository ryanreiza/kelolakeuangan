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
import { PlusCircle, Calendar as CalendarIcon, Trash2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
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

const Transactions = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<TransactionType>("pengeluaran");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [account, setAccount] = useState(""); // For transfer, this is 'from'
  const [toAccount, setToAccount] = useState(""); // For transfer, this is 'to'

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

  const addTransactionMutation = useMutation({
    mutationFn: async (newTransactions: Omit<Transaction, 'id'>[]) => {
      const { error } = await supabase.from('transactions').insert(newTransactions);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
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
      showSuccess("Transaksi berhasil dihapus.");
    },
    onError: (err) => {
      showError(`Gagal menghapus transaksi: ${err.message}`);
    }
  });

  const resetForm = () => {
    setDate(new Date());
    setType("pengeluaran");
    setCategory("");
    setAmount("");
    setDescription("");
    setAccount("");
    setToAccount("");
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
      const newTransaction = {
        date: transactionDate,
        type,
        category,
        amount: transactionAmount,
        description,
        account,
      };
      addTransactionMutation.mutate([newTransaction]);
    }
  };

  const handleDeleteTransaction = (id: number) => {
    deleteTransactionMutation.mutate(id);
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
      return categories.filter(c => ['pengeluaran', 'tagihan', 'hutang'].includes(c.type));
    }
  }, [categories, type]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Buku Kas</h1>
          <p className="text-muted-foreground">
            Catat dan lihat semua arus kas Anda di sini.
          </p>
        </div>
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
                      {date ? format(date, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Transaksi</Label>
                <Select value={type} onValueChange={(value) => { setType(value as TransactionType); setCategory(''); }}>
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
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        {availableCategories.map(cat => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <TableCell>{format(parseISO(t.date), "d MMM yyyy", { locale: id })}</TableCell>
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