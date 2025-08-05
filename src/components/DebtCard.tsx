import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Trash2, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface DebtCardProps {
  id: string;
  type: 'hutang' | 'piutang';
  personName: string;
  description: string | null;
  amount: number;
  dueDate: string | null;
  status: 'lunas' | 'belum_lunas';
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: 'lunas' | 'belum_lunas') => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export function DebtCard({
  id,
  type,
  personName,
  description,
  amount,
  dueDate,
  status,
  onDelete,
  onToggleStatus,
}: DebtCardProps) {
  const isHutang = type === 'hutang';

  return (
    <Card className={status === 'lunas' ? 'bg-muted/50' : ''}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{personName}</CardTitle>
          <CardDescription>{description || (isHutang ? 'Hutang kepada' : 'Piutang dari') + ` ${personName}`}</CardDescription>
        </div>
        <div className="flex items-center">
          {status === 'belum_lunas' && (
            <Button variant="ghost" size="icon" onClick={() => onToggleStatus(id, status)}>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Jumlah</div>
          <div className={`text-right font-medium ${isHutang ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(amount)}
          </div>

          <div className="text-muted-foreground">Jatuh Tempo</div>
          <div className="text-right">
            {dueDate ? format(parseISO(dueDate), "d MMMM yyyy", { locale: idLocale }) : "-"}
          </div>

          <div className="text-muted-foreground">Status</div>
          <div className={`text-right font-medium ${status === 'lunas' ? 'text-green-600' : 'text-yellow-600'}`}>
            {status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}