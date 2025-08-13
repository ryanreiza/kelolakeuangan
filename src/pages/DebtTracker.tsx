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
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Trash2,
  Loader2,
  CircleHelp,
  Handshake,
  Wallet,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

type DebtType = "hutang" | "piutang";
type DebtStatus = "belum_lunas" | "sebagian_lunas" | "lunas";

interface Debt {
  id: string;
  type: DebtType;
  category_id: number;
  person_name: string;
  description: string | null;
  amount: number;
  amount_paid: number;
  due_date: string | null;
  status: DebtStatus;
  user_id: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const DebtTracker = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for new debt
  const [debtType, setDebtType] = useState<DebtType>("hutang");
  const [categoryId, setCategoryId] = useState("");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");

  const { data: debts, isLoading: isLoadingDebts } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').in('type', ['hutang', 'piutang']);
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addDebtMutation = useMutation({
    mutationFn: async (newDebt: Omit<Debt, 'id' | 'user_id' | 'status'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi.");

      const status = newDebt.amount_paid >= newDebt.amount ? 'lunas' : newDebt.amount_paid > 0 ? 'sebagian_lunas' : 'belum_lunas';

      const { error } = await supabase.from('debts').insert([{ ...newDebt, user_id: user.id, status }]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      showSuccess("Hutang/Piutang berhasil ditambahkan!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => {
      showError(`Gagal menambahkan: ${err.message}`);
    }
  });

  const updateDebtMutation = useMutation({
    mutationFn: async ({ id, amount_paid, amount }: { id: string; amount_paid: number; amount: number }) => {
      const status = amount_paid >= amount ? 'lunas' : amount_paid > 0 ? 'sebagian_lunas' : 'belum_lunas';
      const { error } = await supabase.from('debts').update({ amount_paid, status }).match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      showSuccess("Progres berhasil diperbarui!");
    },
    onError: (err) => {
      showError(`Gagal memperbarui progres: ${err.message}`);
    }
  });

  const deleteDebtMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('debts').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      showSuccess("Hutang/Piutang berhasil dihapus.");
    },
    onError: (err) => {
      showError(`Gagal menghapus: ${err.message}`);
    }
  });

  const resetForm = () => {
    setDebtType("hutang");
    setCategoryId("");
    setPersonName("");
    setAmount("");
    setAmountPaid("");
    setDueDate(undefined);
    setDescription("");
  };

  const handleAddDebt = () => {
    if (!debtType || !categoryId || !personName || !amount) {
      showError("Harap isi Tipe, Kategori, Nama Pihak, dan Jumlah.");
      return;
    }

    const newDebt: Omit<Debt, 'id' | 'user_id' | 'status'> = {
      type: debtType,
      category_id: parseInt(categoryId),
      person_name: personName,
      description: description || null,
      amount: parseFloat(amount),
      amount_paid: parseFloat(amountPaid) || 0,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
    };
    addDebtMutation.mutate(newDebt);
  };

  const handleUpdateAmountPaid = (id: string, currentAmount: number, totalAmount: number, newPaid: string) => {
    const paidValue = parseFloat(newPaid);
    if (!isNaN(paidValue)) {
      updateDebtMutation.mutate({ id, amount_paid: paidValue, amount: totalAmount });
    }
  };

  const summary = useMemo(() => {
    if (!debts) {
      return { totalHutang: 0, totalPiutang: 0, totalBersih: 0, hutangPaid: 0, piutangCollected: 0 };
    }

    let totalHutang = 0;
    let totalPiutang = 0;
    let hutangPaid = 0;
    let piutangCollected = 0;

    debts.forEach(debt => {
      if (debt.type === 'hutang') {
        totalHutang += debt.amount;
        hutangPaid += debt.amount_paid;
      } else {
        totalPiutang += debt.amount;
        piutangCollected += debt.amount_paid;
      }
    });

    return {
      totalHutang,
      totalPiutang,
      totalBersih: totalPiutang - totalHutang,
      hutangPaid,
      piutangCollected,
    };
  }, [debts]);

  const debtCategoriesData = useMemo(() => {
    if (!debts || !categories) return [];
    const categoryMap = new Map<string, { name: string; value: number }>();

    debts.filter(d => d.type === 'hutang').forEach(debt => {
      const categoryName = categories.find(c => c.id === debt.category_id)?.name || 'Lain-lain';
      const currentAmount = categoryMap.get(categoryName)?.value || 0;
      categoryMap.set(categoryName, { name: categoryName, value: currentAmount + (debt.amount - debt.amount_paid) });
    });

    return Array.from(categoryMap.values());
  }, [debts, categories]);

  const debtProgressData = useMemo(() => {
    if (!debts) return [];
    return debts.map(debt => {
      const progress = debt.amount > 0 ? (debt.amount_paid / debt.amount) * 100 : 0;
      return {
        ...debt,
        progress: Math.min(100, Math.max(0, progress)),
        remaining_amount: debt.amount - debt.amount_paid,
      };
    });
  }, [debts]);

  const availableCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(cat => cat.type === debtType);
  }, [categories, debtType]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Debt Tracker</h1>
          <p className="text-muted-foreground">
            Lacak semua hutang dan piutang Anda di sini.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Tambah Hutang/Piutang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Tambah Hutang/Piutang Baru</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="debtType" className="text-right">Tipe</Label>
                <Select value={debtType} onValueChange={(value) => { setDebtType(value as DebtType); setCategoryId(""); }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hutang">Hutang</SelectItem>
                    <SelectItem value="piutang">Piutang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Kategori</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="personName" className="text-right">Nama Pihak</Label>
                <Input id="personName" value={personName} onChange={(e) => setPersonName(e.target.value)} className="col-span-3" placeholder="Contoh: Bank ABC / John Doe" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Jumlah</Label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 1000000" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amountPaid" className="text-right">Jumlah Dibayar/Diterima</Label>
                <Input id="amountPaid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="col-span-3" placeholder="Contoh: 0 (opsional)" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Tanggal Jatuh Tempo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: id }) : <span>Pilih tanggal (opsional)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Keterangan</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Opsional" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" onClick={resetForm}>Batal</Button></DialogClose>
              <Button onClick={handleAddDebt} disabled={addDebtMutation.isPending}>
                {addDebtMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingDebts ? (
        <p>Memuat data hutang/piutang...</p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hutang</CardTitle>
                <CircleHelp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalHutang)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(summary.hutangPaid)} sudah dibayar
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPiutang)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(summary.piutangCollected)} sudah diterima
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bersih</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalPiutang - summary.totalHutang)}</div>
                <p className="text-xs text-muted-foreground">
                  Selisih piutang dan hutang
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Progres Pelunasan Hutang</CardTitle>
                <CardDescription>Visualisasi total hutang dan yang sudah dibayar.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{ name: 'Hutang', total: summary.totalHutang, paid: summary.hutangPaid }]}>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="total" name="Total Hutang" fill="#ef4444" />
                    <Bar dataKey="paid" name="Sudah Dibayar" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Jenis Hutang (Outstanding)</CardTitle>
                <CardDescription>Distribusi hutang berdasarkan kategori.</CardDescription>
              </CardHeader>
              <CardContent>
                {debtCategoriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={debtCategoriesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {debtCategoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada data hutang untuk grafik.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Hutang & Piutang</CardTitle>
              <CardDescription>Detail setiap hutang dan piutang Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Nama Pihak</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Dibayar/Diterima</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progres</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtProgressData.length > 0 ? (
                    debtProgressData.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">{debt.type === 'hutang' ? 'Hutang' : 'Piutang'}</TableCell>
                        <TableCell>{categories?.find(c => c.id === debt.category_id)?.name || '-'}</TableCell>
                        <TableCell>{debt.person_name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(debt.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={debt.amount_paid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            onBlur={(e) => handleUpdateAmountPaid(debt.id, debt.amount_paid, debt.amount, e.target.value)}
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(debt.remaining_amount)}</TableCell>
                        <TableCell>{debt.due_date ? format(parseISO(debt.due_date), "d MMM yyyy", { locale: id }) : '-'}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${debt.status === 'lunas' ? 'text-green-600' : debt.status === 'belum_lunas' ? 'text-red-600' : 'text-orange-500'}`}>
                            {debt.status === 'lunas' ? 'Lunas' : debt.status === 'sebagian_lunas' ? 'Sebagian Lunas' : 'Belum Lunas'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Progress value={debt.progress} className="w-24" />
                          <span className="text-xs text-muted-foreground">{Math.round(debt.progress)}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteDebtMutation.mutate(debt.id)} disabled={deleteDebtMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                        Belum ada hutang atau piutang. Tambahkan yang pertama!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DebtTracker;