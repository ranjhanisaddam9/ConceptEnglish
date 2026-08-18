"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Library,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { navUnitName, worksheetsFor } from "@/lib/curriculum/sheet-nav";
import { unitAccent } from "@/lib/curriculum/unit-face";
import type { Unit } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * App-wide side panel.
 *
 * Units come from the layout rather than being listed here, so adding Unit 2
 * to the curriculum adds it to the navigation automatically.
 *
 * Each unit carries the colour it wears on the dashboard, as a dot beside its
 * name. A reader who cannot yet read "R-Controlled Vowels" can still tell
 * which row is the card they just came from.
 */

export interface AppSidebarProps {
  units: Pick<
    Unit,
    | "id"
    | "title"
    | "slug"
    | "kind"
    | "letterGroup"
    | "patternSet"
    | "orderIndex"
  >[];
}

export function AppSidebar({ units }: AppSidebarProps) {
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href;

  // A unit opens itself when you are anywhere inside it, and stays wherever
  // you last put it after that. Seven units with four sheets apiece is more
  // than fits on screen, so only the one being worked on is expanded.
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const isUnitOpen = (unit: AppSidebarProps["units"][number]) =>
    openUnits[unit.id] ?? pathname.startsWith(`/curriculum/${unit.slug}`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Concept English">
              <Link href="/curriculum">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <GraduationCap className="size-5" aria-hidden />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-heading truncate font-bold">
                    Concept English
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Kindergarten – Grade 1
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Curriculum"
                  isActive={isCurrent("/curriculum")}
                  className="h-10 rounded-xl font-medium"
                >
                  <Link href="/curriculum">
                    <NavIcon tint="primary">
                      <LayoutDashboard className="size-4" aria-hidden />
                    </NavIcon>
                    <span>Curriculum</span>
                  </Link>
                </SidebarMenuButton>

                {units.length > 0 && (
                  <SidebarMenuSub>
                    {units.map((unit) => {
                      const unitHref = `/curriculum/${unit.slug}`;
                      const worksheets = worksheetsFor(unit, unitHref);

                      const name = navUnitName(unit.title);
                      const open = isUnitOpen(unit);

                      return (
                        <SidebarMenuSubItem key={unit.id}>
                          <div
                            className="flex items-center"
                            data-accent={unitAccent(unit)}
                          >
                            <SidebarMenuSubButton
                              asChild
                              isActive={isCurrent(unitHref)}
                              className="flex-1 rounded-lg"
                            >
                              <Link href={unitHref}>
                                <span
                                  className="size-2 shrink-0 rounded-full bg-[var(--unit-ring)]"
                                  aria-hidden
                                />
                                <span className="truncate">{name}</span>
                              </Link>
                            </SidebarMenuSubButton>

                            {worksheets.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenUnits((current) => ({
                                    ...current,
                                    [unit.id]: !open,
                                  }))
                                }
                                aria-expanded={open}
                                aria-label={`${open ? "Hide" : "Show"} ${name} worksheets`}
                                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                              >
                                <ChevronRight
                                  className={cn(
                                    "size-3.5 motion-safe:transition-transform",
                                    open && "rotate-90",
                                  )}
                                  aria-hidden
                                />
                              </button>
                            )}
                          </div>

                          {open && worksheets.length > 0 && (
                            <SidebarMenuSub>
                              {worksheets.map((worksheet) => (
                                <SidebarMenuSubItem key={worksheet.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    size="sm"
                                    isActive={isCurrent(worksheet.href)}
                                  >
                                    <Link href={worksheet.href}>
                                      <span>{worksheet.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {/* Reference material, belonging to no single unit. */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Word bank"
                  isActive={isCurrent("/word-bank")}
                  className="h-10 rounded-xl font-medium"
                >
                  <Link href="/word-bank">
                    <NavIcon tint="blue">
                      <Library className="size-4" aria-hidden />
                    </NavIcon>
                    <span>Word bank</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Settings"
                  isActive={isCurrent("/settings")}
                  className="h-10 rounded-xl font-medium"
                >
                  <Link href="/settings">
                    <NavIcon tint="muted">
                      <Settings className="size-4" aria-hidden />
                    </NavIcon>
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* What the course covers, for a teacher who lands here cold. Hidden
          when the panel is collapsed to icons, where there is no room. */}
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="rounded-xl bg-sidebar-accent px-3 py-2 text-xs text-sidebar-accent-foreground">
          {units.length} units · Kindergarten to Grade 1
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

/**
 * The tinted square behind a menu icon.
 *
 * Gives the three top-level destinations a shape a child recognises before
 * they can read the label, and stops the icons floating loose in the margin.
 */
function NavIcon({
  tint,
  children,
}: {
  tint: "primary" | "blue" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg",
        tint === "primary" && "bg-primary/15 text-primary",
        tint === "blue" && "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
        tint === "muted" && "bg-muted text-muted-foreground",
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}
