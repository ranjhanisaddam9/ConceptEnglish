"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Library, Settings } from "lucide-react";

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
import type { Unit } from "@/lib/curriculum/types";

/**
 * App-wide side panel.
 *
 * Units come from the layout rather than being listed here, so adding Unit 2
 * to the curriculum adds it to the navigation automatically.
 */

export interface AppSidebarProps {
  units: Pick<Unit, "id" | "title" | "slug" | "kind" | "letterGroup">[];
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
                      const worksheets = worksheetsFor(unit, unitHref);

                      return (
                        <SidebarMenuSubItem key={unit.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isCurrent(unitHref)}
                          >
                            <Link href={unitHref}>
                              <span>{navUnitName(unit.title)}</span>
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

              {/* Reference material, belonging to no single unit. */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Word bank"
                  isActive={isCurrent("/word-bank")}
                >
                  <Link href="/word-bank">
                    <Library aria-hidden />
                    <span>Word bank</span>
                  </Link>
                </SidebarMenuButton>
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

/** "Unit 1 · Letters" reads as "Unit 1: Letters" in the panel. */
function navUnitName(title: string) {
  const [number, ...rest] = title.split("·");
  return rest.length > 0
    ? `${number.trim()}: ${rest.join("·").trim()}`
    : title;
}

/** "Vowels" or "Consonants", for naming a sheet after what it drills. */
function letterGroupNoun(group: Unit["letterGroup"]) {
  return group === "vowel" ? "Vowels" : "Consonants";
}

/**
 * Which worksheets a unit offers.
 *
 * Keyed on what the unit teaches rather than on its slug, so a future letters
 * or phonics unit picks up the same set without touching this file.
 */
function worksheetsFor(unit: AppSidebarProps["units"][number], unitHref: string) {
  switch (unit.kind) {
    case "letters":
      return [
        { href: `${unitHref}/worksheet`, label: "W1: Tracing" },
        { href: `${unitHref}/worksheet/match`, label: "W2: Match letters" },
        { href: `${unitHref}/worksheet/missing`, label: "W3: Missing Letters" },
      ];
    // A pattern unit teaches words rather than letters, so it offers the
    // letter-identifying sheet only when it says which letters it is about.
    case "word_patterns":
      return unit.letterGroup
        ? [
            {
              href: `${unitHref}/worksheet/identify`,
              label: `W1: Identify ${letterGroupNoun(unit.letterGroup)}`,
            },
          ]
        : [];
    case "phonics": {
      // A phonics unit names its sheets after the letters it covers, so a
      // vowels unit reads "Matching Vowels", not "Matching Consonants".
      const isVowels = unit.letterGroup === "vowel";
      const noun = letterGroupNoun(unit.letterGroup);
      return [
        {
          href: `${unitHref}/worksheet/identify`,
          label: `W1: Identify ${noun}`,
        },
        // The picture sheets rest on words *beginning* or *ending* with the
        // letter, which only works for consonants — a vowel rarely sits at
        // either end of a word.
        ...(isVowels
          ? []
          : [
              {
                href: `${unitHref}/worksheet/picture-match`,
                label: `W2: Matching ${noun}`,
              },
              {
                href: `${unitHref}/worksheet/write-consonants`,
                label: `W3: Writing ${noun}`,
              },
            ]),
      ];
    }
    default:
      return [];
  }
}
