import { Outlet, Link, useLocation, useSearchParams } from "react-router-dom";
import {
  PanelLeft,
  LayoutGrid,
  ArrowLeftRight,
  Tags,
  Landmark,
  Wallet,
  PiggyBank,
  CircleHelp,
  Calendar,
  BarChart,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  {
    href: "/categories",
    label: "Kategori",
    icon: Tags,
    subItems: [
      { href: "/categories?type=pendapatan", label: "Pendapatan" },
      { href: "/categories?type=pengeluaran", label: "Pengeluaran" },
      { href: "/categories?type=tagihan", label: "Tagihan" },
      { href: "/categories?type=tabungan", label: "Tabungan" },
      { href: "/categories?type=investasi", label: "Investasi" },
      { href: "/categories?type=hutang", label: "Hutang" },
    ],
  },
  { href: "/accounts", label: "Rekening Bank", icon: Landmark },
  { href: "/account-dashboard", label: "Dashboard Rekening", icon: Wallet },
  { href: "/saving-tracker", label: "Saving Tracker", icon: PiggyBank },
  { href: "/debt-tracker", label: "Debt Tracker", icon: CircleHelp },
  { href: "/monthly-dashboard", label: "Dashboard Bulanan", icon: Calendar },
  { href: "/annual-dashboard", label: "Dashboard Tahunan", icon: BarChart },
];

export function DashboardLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const categoryType = searchParams.get("type");

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <PiggyBank className="h-6 w-6" />
                  <span>Finance Tracker</span>
                </Link>
                {navItems.map((item) =>
                  item.subItems ? (
                    <Collapsible
                      key={item.label}
                      open={location.pathname === item.href}
                      className="grid gap-2"
                    >
                      <CollapsibleTrigger asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "mx-[-0.65rem] flex items-center justify-between gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                            location.pathname === item.href && "bg-muted text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <item.icon className="h-5 w-5" />
                            {item.label}
                          </div>
                          <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200" />
                        </Link>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-10">
                        <nav className="grid gap-2">
                          {item.subItems.map((subItem) => (
                            <SheetClose asChild key={subItem.label}>
                              <Link
                                to={subItem.href}
                                className={cn(
                                  "flex items-center gap-4 rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground",
                                  `${item.href}?type=${categoryType}` === subItem.href && "bg-muted text-foreground"
                                )}
                              >
                                {subItem.label}
                              </Link>
                            </SheetClose>
                          ))}
                        </nav>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SheetClose asChild key={item.label}>
                      <Link
                        to={item.href}
                        className={cn(
                          "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                          location.pathname === item.href && "bg-muted text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  )
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Optional: Add search or user profile here */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}