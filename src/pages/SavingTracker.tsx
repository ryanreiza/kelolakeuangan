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
import { format, parseISO, differenceInMonths, isPast } from "date-fns";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SavingGoal {
  id: string;
  goal_name: string;
  target_date: string; // YYYY-MM-DD
  target_amount: number;
  current_amount: number;
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

const SavingTracker = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for new goal
  const [goalName, setGoalName] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(new Date());
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("");

  const { data: savingGoals, isLoading: isLoadingSavingGoals } = useQuery<SavingGoal[]>({
    queryKey: ['saving_goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saving_goals')
        .select('*')
        .order('target_date', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('type', 'tabungan');
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
    onError: (err) => {
      showError(`Gagal menambahkan tujuan tabungan: ${err.message}`);
    }
  });

  const updateSavingGoalMutation = useMutation({
    mutationFn: async ({ id, current_amount }: { id: string; current_amount: number }) => {
      const { error } = await supabase.from('saving_goals').update({ current_amount }).match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving_goals'] });
      showSuccess("Nominal pencapaian berhasil diperbarui!");
    },
    onError: (err) => {
      showError(`Gagal memperbarui nominal pencapaian: ${err.message}`);
    }
  });

  const deleteSavingGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saving_goals').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving_goals'] });
      showSuccess("Tujuan tabungan berhasil dihapus.");
    },
    onError: (err) => {
      showError(`Gagal menghapus tujuan tabungan: ${err.message}`);
    }
  });

  const resetForm = () => {
    setGoalName("");
    setTargetDate(new Date());
    setTargetAmount("");
    setInitialAmount("");
  };

  const handleAddSavingGoal = () => {
    if (!goalName || !targetDate || !targetAmount) {
      showError("Harap isi Nama Tujuan, Tanggal Capaian, dan Nominal Capaian.");
      return;
    }

    const newGoal: Omit<SavingGoal, 'id' | 'user_id'> = {
      goal_name: goalName,
      target_date: format(targetDate, "yyyy-MM-dd"),
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(initialAmount) || 0,
    };
    addSavingGoalMutation.mutate(newGoal);
  };

  const handleUpdateCurrentAmount = (id: string, newAmount: string) => {
    const amountValue = parseFloat(newAmount);
    if (!isNaN(amountValue)) {
      updateSavingGoalMutation.mutate({ id, current_amount: amountValue });
    }
  };

  const summary = useMemo(() => {
    if (!savingGoals) {
      return { totalTarget: 0, totalSaved: 0, totalRemaining: 0, overallProgress: 0 };
    }

    const totalTarget = savingGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.current_amount, 0);
    const totalRemaining = totalTarget - totalSaved;
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalSaved,
      totalRemaining,
      overallProgress,
    };
  }, [savingGoals]);

  const savingGoalsWithCalculations = useMemo(() => {
    if (!savingGoals) return [];
    return savingGoals.map(goal => {
      const remainingAmount = goal.target_amount - goal.current_amount;
      const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

      const today = new Date();
      const target = parseISO(goal.target_date);
      const monthsRemaining = isPast(target) ? 0 : differenceInMonths(target, today);
      
      const monthlyContribution = monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount > 0 ? remainingAmount : 0;

      return {
        ...goal,
        remaining_amount: remainingAmount,
        progress: Math.min(100, Math.max(0, progress)), // Ensure progress is between 0 and 100
        months_remaining: monthsRemaining,
        monthly_contribution: monthlyContribution,
      };
    });
  }, [savingGoals]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Saving Tracker</h1>
          <p className="text-muted-foreground">
            Lacak tujuan tabungan Anda dan pantau progresnya.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Tambah Tujuan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Tambah Tujuan Tabungan Baru</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goalName" className="text-right">Nama Tujuan</Label>
                <Select value={goalName} onValueChange={setGoalName}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih atau ketik nama tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetDate" className="text-right">Tanggal Capaian</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="col-span-3 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate ? format(targetDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAmount" className="text-right">Nominal Capaian</Label>
                <Input id="targetAmount" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 10000000" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="initialAmount" className="text-right">Nominal Dimiliki</Label>
                <Input id="initialAmount" type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 500000 (opsional)" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" onClick={resetForm}>Batal</Button></DialogClose>
              <Button onClick={handleAddSavingGoal} disabled={addSavingGoalMutation.isPending}>
                {addSavingGoalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingSavingGoals ? (
        <p>Memuat tujuan tabungan...</p>
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Tabungan</CardTitle>
              <CardDescription>Progres keseluruhan tujuan tabungan Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Total Tersimpan: {formatCurrency(summary.totalSaved)}</span>
                <span>Sisa yang Harus Ditabung: {formatCurrency(summary.totalRemaining)}</span>
              </div>
              <Progress value={summary.overallProgress} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{Math.round(summary.overallProgress)}% Tercapai</span>
                <span>Total Target: {formatCurrency(summary.totalTarget)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detail Tujuan Tabungan</CardTitle>
              <CardDescription>Kelola setiap tujuan tabungan Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tujuan Tabungan</TableHead>
                    <TableHead>Waktu Capaian</TableHead>
                    <TableHead className="text-right">Nominal Capaian</TableHead>
                    <TableHead className="text-right">Nominal Dimiliki</TableHead>
                    <TableHead className="text-right">Sisa Harus Ditabung</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Bulan Tersisa</TableHead>
                    <TableHead className="text-right">Kontribusi Bulanan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savingGoalsWithCalculations.length > 0 ? (
                    savingGoalsWithCalculations.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.goal_name}</TableCell>
                        <TableCell>{format(parseISO(goal.target_date), "d MMM yyyy", { locale: id })}</TableCell>
                        <TableCell className="text-right">{formatCurrency(goal.target_amount)}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={goal.current_amount}
                            onChange={(e) => handleUpdateCurrentAmount(goal.id, e.target.value)}
                            onBlur={(e) => handleUpdateCurrentAmount(goal.id, e.target.value)}
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(goal.remaining_amount)}</TableCell>
                        <TableCell>
                          <Progress value={goal.progress} className="w-24" />
                          <span className="text-xs text-muted-foreground">{Math.round(goal.progress)}%</span>
                        </TableCell>
                        <TableCell className="text-right">{goal.months_remaining} bulan</TableCell>
                        <TableCell className="text-right">{formatCurrency(goal.monthly_contribution)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteSavingGoalMutation.mutate(goal.id)} disabled={deleteSavingGoalMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Belum ada tujuan tabungan. Tambahkan yang pertama!
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

export default SavingTracker;