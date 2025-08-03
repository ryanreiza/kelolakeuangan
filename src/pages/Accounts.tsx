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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

interface Account {
  name: string;
  type: 'bank' | 'digital';
}

const initialAccounts: Account[] = [
  { name: "BCA - 1234567890", type: 'bank' },
  { name: "Mandiri - 0987654321", type: 'bank' },
  { name: "GoPay - 08123456789", type: 'digital' },
];

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [newItem, setNewItem] = useState("");
  const [newAccountType, setNewAccountType] = useState<'bank' | 'digital'>('bank');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddItem = () => {
    if (newItem.trim() !== "") {
      setAccounts([...accounts, { name: newItem.trim(), type: newAccountType }]);
      setNewItem("");
      setNewAccountType('bank');
      setIsDialogOpen(false);
    }
  };

  const handleDeleteItem = (itemToDelete: string) => {
    setAccounts(accounts.filter((item) => item.name !== itemToDelete));
  };

  const bankAccounts = accounts.filter(acc => acc.type === 'bank').map(acc => acc.name);
  const digitalWallets = accounts.filter(acc => acc.type === 'digital').map(acc => acc.name);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rekening & Dompet Digital</h1>
          <p className="text-muted-foreground">
            Kelola semua rekening dan dompet digital Anda di satu tempat.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Tambah Akun
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Akun Baru</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tipe Akun
                </Label>
                <Select value={newAccountType} onValueChange={(value) => setNewAccountType(value as 'bank' | 'digital')}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Rekening Bank</SelectItem>
                    <SelectItem value="digital">Dompet Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama & No.
                </Label>
                <Input
                  id="name"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="col-span-3"
                  placeholder={newAccountType === 'bank' ? "Contoh: BCA - 1234567890" : "Contoh: GoPay - 0812... "}
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

      <div className="space-y-4">
        <AccountList
          title="Rekening Bank"
          description="Daftar semua rekening bank yang Anda miliki."
          items={bankAccounts}
          onDeleteItem={handleDeleteItem}
        />
        <AccountList
          title="Dompet Digital"
          description="Daftar semua dompet digital yang Anda miliki."
          items={digitalWallets}
          onDeleteItem={handleDeleteItem}
        />
      </div>
    </div>
  );
};

export default Accounts;