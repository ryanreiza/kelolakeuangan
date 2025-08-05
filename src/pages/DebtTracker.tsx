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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DebtCard } from "@/components/DebtCard";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type DebtType = 'hutang' | 'piutang';
type DebtStatus = 'lunas' | 'belum_lunas';

interface Debt {
  id: string;
  type: DebtType;
  person_name: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: DebtStatus;
  user_id: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const DebtTracker = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [type, setType] = useState<DebtType>('hutang');
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [description, setDescription] = useState("");

  const { data: debts, isLoading } = useQuery<Debt[]>({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('debts').select('*').order('due_date', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addDebtMutation = useMutation({
    mutationFn: async (newDebt: Omit<Debt, 'id' | 'user_id' | 'status'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi.");
      const { error } = await supabase.from('debts').insert([{ ...newDebt, user_id: user.id }]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      showSuccess("Catatan berhasil ditambahkan!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => showError(`Gagal: ${err.message}`)
  });

  const deleteDebtMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('debts').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      showSuccess("Catatan berhasil dihapus.");
    },
    onError: (err) => showError(`Gagal menghapus: ${err.message}`)
  });

  const updateDebtStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DebtStatus }) => {
      const { error } = await supabase.from('debts').update({ status }).match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      showSuccess("Status berhasil diperbarui.");
    },
    onError: (err) => showError(`Gagal memperbarui status: ${err.message}`)
  });

  const resetForm = () => {
    setType('hutang');
    setPersonName("");
    setAmount("");
    setDueDate(undefined);
    setDescription("");
  };

  const handleAddDebt = () => {
    if (!personName.trim() || !amount.trim()) {
      showError("Harap isi Nama dan Jumlah.");
      return;
    }
    addDebtMutation.mutate({
      type,
      person_name: personName.trim(),
      amount: parseFloat(amount),
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      description: description.trim() || null,
    });
  };

  const handleToggleStatus = (id: string, currentStatus: DebtStatus) => {
    const newStatus: DebtStatus = currentStatus === 'lunas' ? 'belum_lunas' : 'lunas';
    updateDebtStatusMutation.mutate({ id, status: newStatus });
  };

  const { totalHutang, totalPiutang, hutangList, piutangList } = useMemo(() => {
    if (!debts) return { totalHutang: 0, totalPiutang: 0, hutangList: [], piutangList: [] };
    const hutang = debts.filter(d => d.type === 'hutang' && d.status === 'belum_lunas');
    const piutang = debts.filter(d => d.type === 'piutang' && d.status === 'belum_lunas');
    return {
      totalHutang: hutang.reduce((sum, d) => sum + d.amount, 0),
      totalPiutang: piutang.reduce((sum, d) => sum + d.amount, 0),
      hutangList: debts.filter(d => d.type === 'hutang'),
      piutangList: debts.filter(d => d.type === 'piutang'),
    };
  }, [debts]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Debt Tracker</h1>
      <p className="text-muted-foreground mb-6">
        Catat dan lacak semua hutang dan piutang Anda.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle>Total Hutang (Belum Lunas)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(totalHutang)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Piutang (Belum Lunas)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalPiutang)}</div></CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Rincian Hutang & Piutang</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><PlusCircle className="h-4 w-4" />Tambah Catatan</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader><DialogTitle>Tambah Catatan Baru</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipe</Label>
                <Select value={type} onValueChange={(value) => setType(value as DebtType)}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hutang">Hutang</SelectItem>
                    <SelectItem value="piutang">Piutang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="personName" className="text-right">Nama</Label>
                <Input id="personName" value={personName} onChange={(e) => setPersonName(e.target.value)} className="col-span-3" placeholder="Nama orang/institusi" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Jumlah</Label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 500000" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Jatuh Tempo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: idLocale }) : <span>Pilih tanggal (opsional)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
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

      {isLoading ? <p>Memuat data...</p> :
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-medium mb-4">Daftar Hutang</h3>
            {hutangList.length > 0 ? (
              <div className="space-y-4">
                {hutangList.map(debt => (
                  <DebtCard key={debt.id} {...debt} personName={debt.person_name} dueDate={debt.due_date} onDelete={deleteDebtMutation.mutate} onToggleStatus={handleToggleStatus} />
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-10 border rounded-md">Tidak ada catatan hutang.</p>}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Daftar Piutang</h3>
            {piutangList.length > 0 ? (
              <div className="space-y-4">
                {piutangList.map(debt => (
                  <DebtCard key={debt.id} {...debt} personName={debt.person_name} dueDate={debt.due_date} onDelete={deleteDebtMutation.mutate} onToggleStatus={handleToggleStatus} />
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-10 border rounded-md">Tidak ada catatan piutang.</p>}
          </div>
        </div>
      }
    </div>
  );
};

export default DebtTracker;