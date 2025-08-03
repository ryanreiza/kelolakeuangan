import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CategoryList } from "@/components/CategoryList";

const categoriesData = {
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
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Manajemen Kategori</h1>
      <p className="text-muted-foreground mb-6">
        Atur semua kategori keuangan Anda di satu tempat.
      </p>
      <Tabs defaultValue="pendapatan" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="pendapatan">Pendapatan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
          <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
          <TabsTrigger value="tabungan">Tabungan</TabsTrigger>
          <TabsTrigger value="investasi">Investasi</TabsTrigger>
          <TabsTrigger value="hutang">Hutang</TabsTrigger>
        </TabsList>
        <TabsContent value="pendapatan" className="mt-4">
          <CategoryList
            title={categoriesData.pendapatan.title}
            description={categoriesData.pendapatan.description}
            initialItems={categoriesData.pendapatan.items}
          />
        </TabsContent>
        <TabsContent value="pengeluaran" className="mt-4">
          <CategoryList
            title={categoriesData.pengeluaran.title}
            description={categoriesData.pengeluaran.description}
            initialItems={categoriesData.pengeluaran.items}
          />
        </TabsContent>
        <TabsContent value="tagihan" className="mt-4">
          <CategoryList
            title={categoriesData.tagihan.title}
            description={categoriesData.tagihan.description}
            initialItems={categoriesData.tagihan.items}
          />
        </TabsContent>
        <TabsContent value="tabungan" className="mt-4">
          <CategoryList
            title={categoriesData.tabungan.title}
            description={categoriesData.tabungan.description}
            initialItems={categoriesData.tabungan.items}
          />
        </TabsContent>
        <TabsContent value="investasi" className="mt-4">
          <CategoryList
            title={categoriesData.investasi.title}
            description={categoriesData.investasi.description}
            initialItems={categoriesData.investasi.items}
          />
        </TabsContent>
        <TabsContent value="hutang" className="mt-4">
          <CategoryList
            title={categoriesData.hutang.title}
            description={categoriesData.hutang.description}
            initialItems={categoriesData.hutang.items}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Categories;