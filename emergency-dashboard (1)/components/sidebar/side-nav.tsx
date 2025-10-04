import { cn } from "@/lib/utils"
import { Flame, Ambulance, Home, LineChart, ListChecks, SquareChevronLeft as SquareChartGantt } from "lucide-react"
import Link from "next/link"

const items = [
  { href: "#home", label: "Home", icon: Home },
  { href: "#all", label: "All Emergencies", icon: ListChecks },
  {
    href: "#categorized",
    label: "Categorized",
    icon: SquareChartGantt,
    children: [
      { href: "#cat-fire", label: "Fire", icon: Flame },
      { href: "#cat-medical", label: "Medical", icon: Ambulance },
      { href: "#cat-other", label: "Other", icon: ListChecks },
    ],
  },
  { href: "#analytics", label: "Analytics", icon: LineChart },
  { href: "#assigned", label: "Assigned Units", icon: ListChecks },
]

export function SideNav({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "h-full w-64 border-r bg-sidebar p-4 text-sm",
        "md:sticky md:top-[57px] md:h-[calc(100dvh-57px)]",
        className,
      )}
    >
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.href}>
            <Link href={item.href} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-sidebar-accent">
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
            {item.children ? (
              <div className="ml-7 mt-1 flex flex-col">
                {item.children.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="flex items-center gap-2 rounded-md px-3 py-1 hover:bg-sidebar-accent"
                  >
                    <c.icon className="size-4" />
                    <span>{c.label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  )
}
