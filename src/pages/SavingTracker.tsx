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
import { PlusCircle, Loader2, Calendar as CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { SavingGoalCard } from "@/components/SavingGoalCard";

interface SavingGoal {
  id: string;
  goal_name: string;
  target_date: string;
  target_amount: number;
  initial_cash_amount: number;
  user_id: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: "pemasukan" | "pengeluaran";
  saving_goal_id: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const SavingTracker = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [newGoalName, setNewGoalName] = useState("");
  const [newTargetDate, setNewTargetDate] = useState<Date | undefined>(new Date());
  const [newTargetAmount, setNewTargetAmount] = useState("");
  const [newInitialCashAmount, setNewInitialCashAmount] = useState("");

  const { data: savingGoals, isLoading: isLoadingGoals } = useQuery<SavingGoal[]>({
    queryKey: ['saving_goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('saving_goals').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('id, amount, type, saving_goal_id');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addSavingGoalMutation = useMutation({
    mutationFn: async (newGoal: Omit<SavingGoal, 'id' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Pengguna tidak terautentikasi.");
      const { error } = await supabase.from('saving_goals').insert([{ ...newGoal, user_id: user.id }]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving_goals'] });
      showSuccess("Tujuan tabungan berhasil ditambahkan!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err) => showError(`Gagal menambahkan tujuan: ${err.message}`)
  });

  const deleteSavingGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saving_goals').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving_goals'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Invalidate transactions to re-calculate total saved
      showSuccess("Tujuan tabungan berhasil dihapus.");
    },
    onError: (err) => showError(`Gagal menghapus tujuan: ${err.message}`)
  });

  const resetForm = () => {
    setNewGoalName("");
    setNewTargetDate(new Date());
    setNewTargetAmount("");
    setNewInitialCashAmount("");
  };

  const handleAddGoal = () => {
    if (!newGoalName.trim() || !newTargetDate || !newTargetAmount.trim()) {
      showError("Harap isi semua kolom yang wajib.");
      return;
    }

    const targetAmountNum = parseFloat(newTargetAmount);
    const initialCashAmountNum = parseFloat(newInitialCashAmount || "0");

    if (isNaN(targetAmountNum) || targetAmountNum <= 0) {
      showError("Nominal Capaian harus angka positif.");
      return;
    }
    if (isNaN(initialCashAmountNum) || initialCashAmountNum < 0) {
      showError("Nominal di Tangan (Cash) harus angka positif atau nol.");
      return;
    }

    addSavingGoalMutation.mutate({
      goal_name: newGoalName.trim(),
      target_date: format(newTargetDate, "yyyy-MM-dd"),
      target_amount: targetAmountNum,
      initial_cash_amount: initialCashAmountNum,
    });
  };

  const handleDeleteGoal = (id: string) => {
    deleteSavingGoalMutation.mutate(id);
  };

  const calculatedGoals = useMemo(() => {
    if (!savingGoals || !transactions) return [];

    return savingGoals.map(goal => {
      const linkedTransactionsAmount = transactions
        .filter(t => t.saving_goal_id === goal.id && t.type === 'pemasukan')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSaved = goal.initial_cash_amount + linkedTransactionsAmount;

      return {
        ...goal,
        totalSaved,
      };
    });
  }, [savingGoals, transactions]);

  const summary = useMemo(() => {
    const totalTargetAmount = calculatedGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalSavedAmount = calculatedGoals.reduce((sum, goal) => sum + goal.totalSaved, 0);
    const totalRemainingToSave = totalTargetAmount - totalSavedAmount;

    return {
      totalTargetAmount,
      totalSavedAmount,
      totalRemainingToSave,
    };
  }, [calculatedGoals]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Saving Tracker</h1>
      <p className="text-muted-foreground mb-6">
        Tracker khusus untuk membantu dalam mencapai goals keuangan melalui tabungan.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tujuan Tabungan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalTargetAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dana Tersimpan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSavedAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yang Harus Ditabung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalRemainingToSave)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Rincian Tabungan</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><PlusCircle className="h-4 w-4" />Tambah Tujuan</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader><DialogTitle>Tambah Tujuan Tabungan Baru</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goalName" className="text-right">Tujuan Tabungan</Label>
                <Input id="goalName" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} className="col-span-3" placeholder="Contoh: Liburan ke Bali" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetDate" className="text-right">Waktu Capaian</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTargetDate ? format(newTargetDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={newTargetDate} onSelect={setNewTargetDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAmount" className="text-right">Nominal Capaian</Label>
                <Input id="targetAmount" type="number" value={newTargetAmount} onChange={(e) => setNewTargetAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 10000000" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="initialCashAmount" className="text-right">Nominal di Tangan (Cash)</Label>
                <Input id="initialCashAmount" type="number" value={newInitialCashAmount} onChange={(e) => setNewInitialCashAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 500000 (opsional)" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" onClick={resetForm}>Batal</Button></DialogClose>
              <Button onClick={handleAddGoal} disabled={addSavingGoalMutation.isPending}>
                {addSavingGoalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingGoals ? (
        <p>Memuat tujuan tabungan...</p>
      ) : calculatedGoals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {calculatedGoals.map(goal => (
            <SavingGoalCard
              key={goal.id}
              id={goal.id}
              goalName={goal.goal_name}
              targetDate={goal.target_date}
              targetAmount={goal.target_amount}
              initialCashAmount={goal.initial_cash_amount}
              totalSaved={goal.totalSaved}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md">
          <p className="text-muted-foreground">Belum ada tujuan tabungan yang ditambahkan.</p>
          <p className="text-sm text-muted-foreground">Klik "Tambah Tujuan" untuk memulai.</p>
        </div>
      )}
    </div>
  );
};

export default SavingTracker;