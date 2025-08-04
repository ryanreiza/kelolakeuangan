import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface AccountItem {
  id: number;
  name: string;
}

interface AccountListProps {
  title: string;
  description: string;
  items: AccountItem[];
  onDeleteItem: (idToDelete: number) => void;
}

export function AccountList({
  title,
  description,
  items,
  onDeleteItem,
}: AccountListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span className="text-sm font-medium">{item.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada rekening bank.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}