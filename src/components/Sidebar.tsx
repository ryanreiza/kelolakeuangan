import { Link, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
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

export function Sidebar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const categoryType = searchParams.get("type");

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <PiggyBank className="h-6 w-6" />
            <span>Finance Tracker</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) =>
              item.subItems ? (
                <Collapsible
                  key={item.label}
                  open={location.pathname === item.href}
                  className="grid items-start"
                >
                  <CollapsibleTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        location.pathname === item.href && "bg-muted text-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                    </Link>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-7 pt-1">
                    <nav className="grid gap-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.label}
                          to={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            `${item.href}?type=${categoryType}` === subItem.href && "bg-muted text-primary"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </nav>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    location.pathname === item.href && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}