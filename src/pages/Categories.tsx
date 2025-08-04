import { useState, useMemo } from "react";
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
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/utils/toast";

type CategoryKey = 'pendapatan' | 'pengeluaran' | 'tagihan' | 'tabungan' | 'investasi' | 'hutang';

interface CategoryItem {
  id: number;
  name: string;
  type: CategoryKey;
}

const staticCategoryInfo = {
  pendapatan: { title: "Pendapatan", description: "Kelola kategori untuk semua sumber pendapatan Anda." },
  pengeluaran: { title: "Pengeluaran", description: "Kelola kategori untuk semua pengeluaran rutin dan non-rutin." },
  tagihan: { title: "Tagihan", description: "Kelola kategori untuk semua tagihan bulanan." },
  tabungan: { title: "Tabungan", description: "Kelola target dan jenis tabungan Anda." },
  investasi: { title: "Investasi", description: "Kelola kategori untuk berbagai jenis investasi." },
  hutang: { title: "Hutang", description: "Kelola semua jenis hutang dan cicilan." },
};

const Categories = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("pendapatan");
  const [newItem, setNewItem] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: categoriesData, isLoading } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const categories = useMemo(() => {
    const grouped: Record<CategoryKey, { title: string; description: string; items: { id: number; name: string }[] }> = {
      pendapatan: { ...staticCategoryInfo.pendapatan, items: [] },
      pengeluaran: { ...staticCategoryInfo.pengeluaran, items: [] },
      tagihan: { ...staticCategoryInfo.tagihan, items: [] },
      tabungan: { ...staticCategoryInfo.tabungan, items: [] },
      investasi: { ...staticCategoryInfo.investasi, items: [] },
      hutang: { ...staticCategoryInfo.hutang, items: [] },
    };
    if (categoriesData) {
      categoriesData.forEach(item => {
        if (grouped[item.type]) {
          grouped[item.type].items.push({ id: item.id, name: item.name });
        }
      });
    }
    return grouped;
  }, [categoriesData]);

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
      const { error } = await supabase.from('categories').delete().match({ id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSuccess("Item berhasil dihapus.");
    },
    onError: (err) => showError(`Gagal: ${err.message}`)
  });

  const handleAddItem = () => {
    if (newItem.trim() !== "") {
      addCategoryMutation.mutate({ name: newItem.trim(), type: selectedCategory });
    }
  };

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
            <DialogHeader><DialogTitle>Tambah Item Kategori Baru</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Kategori</Label>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CategoryKey)}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categories) as CategoryKey[]).map((key) => (
                      <SelectItem key={key} value={key}>{categories[key].title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
        <div className="space-y-4">
          {(Object.keys(categories) as CategoryKey[]).map((key) => {
            const category = categories[key];
            return (
              <CategoryList
                key={key}
                title={category.title}
                description={category.description}
                items={category.items}
                onDeleteItem={(id) => deleteCategoryMutation.mutate(id)}
              />
            );
          })}
        </div>
      }
    </div>
  );
};

export default Categories;