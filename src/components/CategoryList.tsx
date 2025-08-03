import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { PlusCircle, Trash2 } from "lucide-react";

interface CategoryListProps {
  title: string;
  description: string;
  initialItems: string[];
}

export function CategoryList({
  title,
  description,
  initialItems,
}: CategoryListProps) {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddItem = () => {
    if (newItem.trim() !== "") {
      setItems([...items, newItem.trim()]);
      setNewItem("");
      setIsDialogOpen(false);
    }
  };

  const handleDeleteItem = (itemToDelete: string) => {
    setItems(items.filter((item) => item !== itemToDelete));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Tambah Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Item ke {title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama
                </Label>
                <Input
                  id="name"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="col-span-3"
                  placeholder={`Contoh: Gaji Bulanan`}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button onClick={handleAddItem}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <span className="text-sm font-medium">{item}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteItem(item)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada item.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}