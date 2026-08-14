"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
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
import { unitKindLabel } from "@/lib/curriculum/display";
import type { Unit } from "@/lib/curriculum/types";

/**
 * App-wide side panel.
 *
 * Units come from the layout rather than being listed here, so adding Unit 2
 * to the curriculum adds it to the navigation automatically.
 */

export interface AppSidebarProps {
  units: Pick<Unit, "id" | "title" | "slug" | "kind">[];
}

export function AppSidebar({ units }: AppSidebarProps) {
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Concept English">
              <Link href="/curriculum">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="size-5" aria-hidden />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-heading truncate font-semibold">
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
                >
                  <Link href="/curriculum">
                    <LayoutDashboard aria-hidden />
                    <span>Curriculum</span>
                  </Link>
                </SidebarMenuButton>

                {units.length > 0 && (
                  <SidebarMenuSub>
                    {units.map((unit) => {
                      const unitHref = `/curriculum/${unit.slug}`;
                      // Worksheets are handwriting and letter-matching
                      // exercises, so they only apply to letter units.
                      const worksheets =
                        unit.kind === "letters"
                          ? [
                              {
                                href: `${unitHref}/worksheet`,
                                label: "W1: Tracing",
                              },
                              {
                                href: `${unitHref}/worksheet/match`,
                                label: "W2: Match letters",
                              },
                              {
                                href: `${unitHref}/worksheet/missing`,
                                label: "W3: Missing Letters",
                              },
                            ]
                          : [];

                      return (
                        <SidebarMenuSubItem key={unit.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isCurrent(unitHref)}
                          >
                            <Link href={unitHref}>
                              <span>
                                {shortUnitName(unit.title)}:{" "}
                                {unitKindLabel(unit.kind)}
                              </span>
                            </Link>
                          </SidebarMenuSubButton>

                          {worksheets.length > 0 && (
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

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Settings"
                  isActive={isCurrent("/settings")}
                >
                  <Link href="/settings">
                    <Settings aria-hidden />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

/**
 * "Unit 1 · The Alphabet" becomes "Unit 1" here; the sidebar pairs it with
 * what the unit teaches, giving "Unit 1: Letters" in a width that fits.
 */
function shortUnitName(title: string) {
  return title.split("·")[0].trim() || title;
}
