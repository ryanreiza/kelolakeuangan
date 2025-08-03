import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, PlusCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CategoryItem {
  id: number;
  name: string;
}

interface CategoryManagerProps {
  title: string;
  description: string;
  initialItems: CategoryItem[];
}

export function CategoryManager({ title, description, initialItems }: CategoryManagerProps) {
  const [items, setItems] = useState<CategoryItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState("");
  const [itemToDelete, setItemToDelete] = useState<CategoryItem | null>(null);

  const handleAddItem = () => {
    if (newItemName.trim() === "") return;
    const newItem: CategoryItem = {
      id: Date.now(), // simple unique id
      name: newItemName.trim(),
    };
    setItems([...items, newItem]);
    setNewItemName("");
  };

  const handleDeleteItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    setItemToDelete(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Nama item baru"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Button type="button" onClick={handleAddItem}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Item</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemToDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus item
                              "{itemToDelete?.name}" secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => itemToDelete && handleDeleteItem(itemToDelete.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Belum ada item.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}