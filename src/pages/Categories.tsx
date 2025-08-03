import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CategoryManager } from "@/components/CategoryManager";

const categoryData = {
  pendapatan: {
    title: "Kategori Pendapatan",
    description: "Kelola semua sumber pendapatan Anda, seperti gaji, bonus, atau pendapatan sampingan.",
    items: [
      { id: 1, name: "Gaji" },
      { id: 2, name: "Bonus" },
      { id: 3, name: "Freelance" },
    ],
  },
  pengeluaran: {
    title: "Kategori Pengeluaran",
    description: "Kelola semua jenis pengeluaran rutin Anda, seperti makanan, transportasi, atau hiburan.",
    items: [
      { id: 1, name: "Makanan & Minuman" },
      { id: 2, name: "Transportasi" },
      { id: 3, name: "Belanja" },
      { id: 4, name: "Hiburan" },
    ],
  },
  tagihan: {
    title: "Kategori Tagihan",
    description: "Kelola semua tagihan bulanan Anda, seperti listrik, air, internet, atau cicilan.",
    items: [
      { id: 1, name: "Listrik" },
      { id: 2, name: "Air (PAM)" },
      { id: 3, name: "Internet" },
      { id: 4, name: "Cicilan Rumah" },
    ],
  },
  tabungan: {
    title: "Kategori Tabungan",
    description: "Kelola semua pos tabungan Anda, seperti dana darurat, liburan, atau pendidikan anak.",
    items: [
      { id: 1, name: "Dana Darurat" },
      { id: 2, name: "Tabungan Liburan" },
      { id: 3, name: "Pendidikan Anak" },
    ],
  },
  investasi: {
    title: "Kategori Investasi",
    description: "Kelola semua jenis investasi Anda, seperti saham, reksa dana, atau properti.",
    items: [
      { id: 1, name: "Saham" },
      { id: 2, name: "Reksa Dana" },
      { id: 3, name: "Emas" },
    ],
  },
  hutang: {
    title: "Kategori Hutang",
    description: "Kelola semua jenis hutang Anda, seperti kartu kredit atau pinjaman pribadi.",
    items: [
      { id: 1, name: "Kartu Kredit" },
      { id: 2, name: "Pinjaman Teman" },
    ],
  },
};

const Categories = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
        <p className="text-muted-foreground">
          Atur kategori untuk melacak keuangan Anda dengan lebih baik.
        </p>
      </div>
      <Tabs defaultValue="pengeluaran" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="pendapatan">Pendapatan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
          <TabsTrigger value="tagihan">Tagihan</TabsTrigger>
          <TabsTrigger value="tabungan">Tabungan</TabsTrigger>
          <TabsTrigger value="investasi">Investasi</TabsTrigger>
          <TabsTrigger value="hutang">Hutang</TabsTrigger>
        </TabsList>
        <TabsContent value="pendapatan">
          <CategoryManager
            title={categoryData.pendapatan.title}
            description={categoryData.pendapatan.description}
            initialItems={categoryData.pendapatan.items}
          />
        </TabsContent>
        <TabsContent value="pengeluaran">
          <CategoryManager
            title={categoryData.pengeluaran.title}
            description={categoryData.pengeluaran.description}
            initialItems={categoryData.pengeluaran.items}
          />
        </TabsContent>
        <TabsContent value="tagihan">
          <CategoryManager
            title={categoryData.tagihan.title}
            description={categoryData.tagihan.description}
            initialItems={categoryData.tagihan.items}
          />
        </TabsContent>
        <TabsContent value="tabungan">
          <CategoryManager
            title={categoryData.tabungan.title}
            description={categoryData.tabungan.description}
            initialItems={categoryData.tabungan.items}
          />
        </TabsContent>
        <TabsContent value="investasi">
          <CategoryManager
            title={categoryData.investasi.title}
            description={categoryData.investasi.description}
            initialItems={categoryData.investasi.items}
          />
        </TabsContent>
        <TabsContent value="hutang">
          <CategoryManager
            title={categoryData.hutang.title}
            description={categoryData.hutang.description}
            initialItems={categoryData.hutang.items}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Categories;