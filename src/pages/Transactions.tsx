import { useState } from "react";
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
import { PlusCircle, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type TransactionType = "pemasukan" | "pengeluaran";

interface Transaction {
  id: number;
  date: Date;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  account: string;
}

const initialAccounts = [
  "BCA - 1234567890",
  "Mandiri - 0987654321",
  "GoPay - 08123456789",
];

const initialCategories = {
  pemasukan: ["Gaji", "Bonus", "Freelance", "Investasi Pasif"],
  pengeluaran: [
    "Transportasi",
    "Makan & Minum",
    "Belanja",
    "Hiburan",
    "Listrik",
    "Air",
    "Internet",
    "Cicilan Kartu Kredit",
  ],
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [type, setType] = useState<TransactionType>("pengeluaran");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [account, setAccount] = useState("");

  const resetForm = () => {
    setDate(new Date());
    setType("pengeluaran");
    setCategory("");
    setAmount("");
    setDescription("");
    setAccount("");
  };

  const handleAddTransaction = () => {
    if (!date || !category || !amount || !account) {
      // Simple validation
      alert("Harap isi semua bidang yang diperlukan.");
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now(),
      date,
      type,
      category,
      amount: parseFloat(amount),
      description,
      account,
    };

    setTransactions([...transactions, newTransaction]);
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

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
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialCategories[type].map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Jumlah</Label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 50000" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Keterangan</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Opsional" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="account" className="text-right">Rekening</Label>
                <Select value={account} onValueChange={setAccount}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih rekening/dompet" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialAccounts.map(acc => (
                      <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Batal</Button>
              </DialogClose>
              <Button onClick={handleAddTransaction}>Simpan</Button>
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
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{format(t.date, "d MMM yyyy", { locale: id })}</TableCell>
                  <TableCell>
                    <div className="font-medium">{t.category}</div>
                    <div className={`text-xs ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${t.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell>{t.description || "-"}</TableCell>
                  <TableCell>{t.account}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(t.id)}>
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