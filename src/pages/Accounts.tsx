import { useState, useMemo } from "react";
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
import { PlusCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface Account {
  id: number;
  name: string;
  type: 'bank' | 'digital' | 'cash';
}

interface AccountListProps {
  title: string;
  description: string;
  items: AccountItem[];
  onDeleteItem: (idToDelete: number) => void;
}

interface AccountItem {
  id: number;
  name: string;
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

const Accounts = () => {
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [newAccountType, setNewAccountType] = useState<'bank' | 'digital' | 'cash'>('bank');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('accounts').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addAccountMutation = useMutation({
    mutationFn: async (newAccount: Omit<Account, 'id'>) => {
      const { error } = await supabase.from('accounts').insert([newAccount]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess("Akun berhasil ditambahkan!");
      setIsDialogOpen(false);
      setNewItem("");
      setNewAccountType('bank');
    },
    onError: (err) => showError(`Gagal: ${err.message}`)
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      const accountToDelete = accounts?.find(acc => acc.id === id);
      if (!accountToDelete) throw new Error("Akun tidak ditemukan.");

      const { count } = await supabase.from('transactions').select('id', { count: 'exact' }).eq('account', accountToDelete.name);

      if (count && count > 0) {
        throw new Error('Akun ini digunakan oleh transaksi lain dan tidak dapat dihapus.');
      }

      const { error } = await supabase.from('accounts').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess("Akun berhasil dihapus.");
    },
    onError: (err) => showError(`Gagal menghapus: ${err.message}`)
  });

  const handleAddItem = () => {
    if (newItem.trim() !== "") {
      addAccountMutation.mutate({ name: newItem.trim(), type: newAccountType });
    }
  };

  const { bankAccounts, digitalWallets, cashAccounts } = useMemo(() => {
    const bank: Account[] = [];
    const digital: Account[] = [];
    const cash: Account[] = [];
    if (accounts) {
      accounts.forEach(acc => {
        if (acc.type === 'bank') bank.push(acc);
        else if (acc.type === 'digital') digital.push(acc);
        else if (acc.type === 'cash') cash.push(acc);
      });
    }
    return { bankAccounts: bank, digitalWallets: digital, cashAccounts: cash };
  }, [accounts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rekening & Dompet Digital</h1>
          <p className="text-muted-foreground">Kelola semua rekening dan dompet digital Anda di satu tempat.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><PlusCircle className="h-4 w-4" />Tambah Akun</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Tambah Akun Baru</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipe Akun</Label>
                <Select value={newAccountType} onValueChange={(value) => setNewAccountType(value as 'bank' | 'digital' | 'cash')}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Rekening Bank</SelectItem>
                    <SelectItem value="digital">Dompet Digital</SelectItem>
                    <SelectItem value="cash">Kas Tunai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nama & No.</Label>
                <Input id="name" value={newItem} onChange={(e) => setNewItem(e.target.value)} className="col-span-3" placeholder={newAccountType === 'bank' ? "Contoh: BCA - 1234567890" : newAccountType === 'digital' ? "Contoh: GoPay - 0812... " : "Contoh: Dompet Utama"} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
              <Button onClick={handleAddItem} disabled={addAccountMutation.isPending}>
                {addAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <p>Memuat rekening...</p> :
        <div className="space-y-4">
          <AccountList title="Rekening Bank" description="Daftar semua rekening bank yang Anda miliki." items={bankAccounts} onDeleteItem={(id) => deleteAccountMutation.mutate(id)} />
          <AccountList title="Dompet Digital" description="Daftar semua dompet digital yang Anda miliki." items={digitalWallets} onDeleteItem={(id) => deleteAccountMutation.mutate(id)} />
          <AccountList title="Kas Tunai" description="Daftar semua akun kas tunai yang Anda miliki." items={cashAccounts} onDeleteItem={(id) => deleteAccountMutation.mutate(id)} />
        </div>
      }
    </div>
  );
};

export default Accounts;