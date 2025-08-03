import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { PlusCircle } from "lucide-react";

type CategoryKey = 'pendapatan' | 'pengeluaran' | 'tagihan' | 'tabungan' | 'investasi' | 'hutang';

interface Category {
  title: string;
  description: string;
  items: string[];
}

const initialCategoriesData: Record<CategoryKey, Category> = {
  pendapatan: {
    title: "Pendapatan",
    description: "Kelola kategori untuk semua sumber pendapatan Anda.",
    items: ["Gaji", "Bonus", "Freelance", "Investasi Pasif"],
  },
  pengeluaran: {
    title: "Pengeluaran",
    description: "Kelola kategori untuk semua pengeluaran rutin dan non-rutin.",
    items: ["Transportasi", "Makan & Minum", "Belanja", "Hiburan"],
  },
  tagihan: {
    title: "Tagihan",
    description: "Kelola kategori untuk semua tagihan bulanan.",
    items: ["Listrik", "Air", "Internet", "Cicilan Kartu Kredit"],
  },
  tabungan: {
    title: "Tabungan",
    description: "Kelola target dan jenis tabungan Anda.",
    items: ["Dana Darurat", "Liburan", "Pendidikan Anak", "DP Rumah"],
  },
  investasi: {
    title: "Investasi",
    description: "Kelola kategori untuk berbagai jenis investasi.",
    items: ["Saham", "Reksadana", "Properti", "Emas"],
  },
  hutang: {
    title: "Hutang",
    description: "Kelola semua jenis hutang dan cicilan.",
    items: ["KPR", "Kredit Kendaraan", "Pinjaman Pribadi"],
  },
};

const Categories = () => {
  const [categories, setCategories] = useState(initialCategoriesData);
  const [activeTab, setActiveTab] = useState<CategoryKey>("pendapatan");
  const [newItem, setNewItem] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddItem = () => {
    if (newItem.trim() !== "") {
      setCategories(prevCategories => {
        const updatedItems = [...prevCategories[activeTab].items, newItem.trim()];
        return {
          ...prevCategories,
          [activeTab]: {
            ...prevCategories[activeTab],
            items: updatedItems,
          },
        };
      });
      setNewItem("");
      setIsDialogOpen(false);
    }
  };

  const handleDeleteItem = (categoryKey: CategoryKey, itemToDelete: string) => {
    setCategories(prevCategories => {
      const updatedItems = prevCategories[categoryKey].items.filter(item => item !== itemToDelete);
      return {
        ...prevCategories,
        [categoryKey]: {
          ...prevCategories[categoryKey],
          items: updatedItems,
        },
      };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
          <p className="text-muted-foreground">
            Atur semua kategori keuangan Anda di satu tempat.
          </p>
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
              <DialogTitle>Tambah Item ke {categories[activeTab].title}</DialogTitle>
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
      </div>

      <Tabs defaultValue="pendapatan" className="w-full" onValueChange={(value) => setActiveTab(value as CategoryKey)}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="pendapatan">Pendapatan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
          <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
          <TabsTrigger value="tabungan">Tabungan</TabsTrigger>
          <TabsTrigger value="investasi">Investasi</TabsTrigger>
          <TabsTrigger value="hutang">Hutang</TabsTrigger>
        </TabsList>
        
        {(Object.keys(categories) as CategoryKey[]).map((key) => {
          const category = categories[key];
          return (
            <TabsContent value={key} className="mt-4" key={key}>
              <CategoryList
                title={category.title}
                description={category.description}
                items={category.items}
                onDeleteItem={(item) => handleDeleteItem(key, item)}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Categories;