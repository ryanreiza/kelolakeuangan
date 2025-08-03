import { useState } from "react";
import { AccountList } from "@/components/AccountList";
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
import { PlusCircle } from "lucide-react";

const initialAccounts = ["BCA - 1234567890", "Mandiri - 0987654321"];

const Accounts = () => {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [newItem, setNewItem] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddItem = () => {
    if (newItem.trim() !== "") {
      setAccounts([...accounts, newItem.trim()]);
      setNewItem("");
      setIsDialogOpen(false);
    }
  };

  const handleDeleteItem = (itemToDelete: string) => {
    setAccounts(accounts.filter((item) => item !== itemToDelete));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daftar Rekening Bank</h1>
          <p className="text-muted-foreground">
            Kelola semua rekening bank Anda di satu tempat.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Tambah Rekening
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Rekening Bank Baru</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama & No. Rek
                </Label>
                <Input
                  id="name"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="col-span-3"
                  placeholder="Contoh: BCA - 1234567890"
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
      </div>

      <AccountList
        title="Daftar Rekening"
        description="Berikut adalah daftar semua rekening bank yang Anda miliki."
        items={accounts}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
};

export default Accounts;