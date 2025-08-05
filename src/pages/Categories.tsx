import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CategoryList } from "@/components/CategoryList";
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
import { PlusCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

type CategoryKey = 'pendapatan' | 'pengeluaran' | 'tagihan' | 'tabungan' | 'investasi' | 'hutang';

interface CategoryItem {
  id: number;
  name: string;
  type: CategoryKey;
}

const staticCategoryInfo: Record<CategoryKey, { title: string; description: string }> = {
  pendapatan: { title: "Pendapatan", description: "Kelola kategori untuk semua sumber pendapatan Anda." },
  pengeluaran: { title: "Pengeluaran", description: "Kelola kategori untuk semua pengeluaran rutin dan non-rutin." },
  tagihan: { title: "Tagihan", description: "Kelola kategori untuk semua tagihan bulanan." },
  tabungan: { title: "Tabungan", description: "Kelola target dan jenis tabungan Anda." },
  investasi: { title: "Investasi", description: "Kelola kategori untuk berbagai jenis investasi." },
  hutang: { title: "Hutang", description: "Kelola semua jenis hutang dan cicilan." },
};

const Categories = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [newItem, setNewItem] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeCategory = (searchParams.get("type") as CategoryKey) || "pendapatan";

  const { data: categoriesData, isLoading } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').neq('type', 'transfer');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const activeCategoryItems = useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData
      .filter(item => item.type === activeCategory)
      .map(item => ({ id: item.id, name: item.name }));
  }, [categoriesData, activeCategory]);

  const addCategoryMutation = useMutation({
    mutationFn: async (newCat: { name: string; type: CategoryKey }) => {
      const { error } = await supabase.from('categories').insert([newCat]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess("Item berhasil ditambahkan!");
      setIsDialogOpen(false);
      setNewItem("");
    },
    onError: (err) => showError(`Gagal: ${err.message}`)
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const categoryToDelete = categoriesData?.find(c => c.id === id);
      if (!categoryToDelete) throw new Error("Kategori tidak ditemukan.");

      const { count } = await supabase.from('transactions').select('id', { count: 'exact' }).eq('category', categoryToDelete.name);

      if (count && count > 0) {
        throw new Error('Kategori ini digunakan oleh transaksi lain dan tidak dapat dihapus.');
      }

      const { error } = await supabase.from('categories').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess("Item berhasil dihapus.");
    },
    onError: (err) => showError(`Gagal menghapus: ${err.message}`)
  });

  const handleAddItem = () => {
    if (newItem.trim() !== "") {
      addCategoryMutation.mutate({ name: newItem.trim(), type: activeCategory });
    }
  };

  const currentCategoryInfo = staticCategoryInfo[activeCategory];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
          <p className="text-muted-foreground">Atur semua kategori keuangan Anda di satu tempat.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><PlusCircle className="h-4 w-4" />Tambah Item</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Tambah Item ke {currentCategoryInfo.title}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nama Item</Label>
                <Input id="name" value={newItem} onChange={(e) => setNewItem(e.target.value)} className="col-span-3" placeholder="Contoh: Gaji Bulanan" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
              <Button onClick={handleAddItem} disabled={addCategoryMutation.isPending}>
                {addCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <p>Memuat kategori...</p> :
        <CategoryList
          title={currentCategoryInfo.title}
          description={currentCategoryInfo.description}
          items={activeCategoryItems}
          onDeleteItem={(id) => deleteCategoryMutation.mutate(id)}
        />
      }
    </div>
  );
};

export default Categories;