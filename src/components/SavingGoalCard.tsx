import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trash2 } from "lucide-react";
import { format, parseISO, differenceInMonths } from "date-fns";
import { id as idLocale } from "date-fns/locale"; // Changed import

interface SavingGoalCardProps {
  id: string;
  goalName: string;
  targetDate: string;
  targetAmount: number;
  initialCashAmount: number;
  totalSaved: number;
  onDelete: (id: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export function SavingGoalCard({
  id,
  goalName,
  targetDate,
  targetAmount,
  initialCashAmount,
  totalSaved,
  onDelete,
}: SavingGoalCardProps) {
  const remainingToSave = targetAmount - totalSaved;
  const progressPercentage = targetAmount > 0 ? (totalSaved / targetAmount) * 100 : 0;

  const monthsRemaining = differenceInMonths(parseISO(targetDate), new Date());
  const monthlyContribution = monthsRemaining > 0 ? remainingToSave / monthsRemaining : remainingToSave;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{goalName}</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Waktu Capaian</div>
          <div className="text-right">{format(parseISO(targetDate), "d MMMM yyyy", { locale: idLocale })}</div>

          <div className="text-muted-foreground">Nominal Capaian</div>
          <div className="text-right font-medium">{formatCurrency(targetAmount)}</div>

          <div className="text-muted-foreground">Nominal di Tangan (Cash)</div>
          <div className="text-right">{formatCurrency(initialCashAmount)}</div>

          <div className="text-muted-foreground">Total Tersimpan</div>
          <div className="text-right font-medium text-green-600">{formatCurrency(totalSaved)}</div>

          <div className="text-muted-foreground">Sisa Yang Harus Ditabung</div>
          <div className="text-right font-medium text-red-600">{formatCurrency(remainingToSave)}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Jumlah Bulan Tersisa</div>
          <div className="text-right">{monthsRemaining > 0 ? `${monthsRemaining} bulan` : "Tercapai!"}</div>

          <div className="text-muted-foreground">Kontribusi Bulanan</div>
          <div className="text-right font-medium">{formatCurrency(monthlyContribution)}</div>
        </div>
      </CardContent>
    </Card>
  );
}