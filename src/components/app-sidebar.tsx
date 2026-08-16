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
import { cn } from "@/lib/utils";

/**
 * App-wide side panel.
 *
 * Units come from the layout rather than being listed here, so adding Unit 2
 * to the curriculum adds it to the navigation automatically.
 */

export interface AppSidebarProps {
  units: Pick<
    Unit,
    "id" | "title" | "slug" | "kind" | "letterGroup" | "patternSet"
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

                      const name = navUnitName(unit.title);
                      const open = isUnitOpen(unit);

                      return (
                        <SidebarMenuSubItem key={unit.id}>
                          <div className="flex items-center">
                            <SidebarMenuSubButton
                              asChild
                              isActive={isCurrent(unitHref)}
                              className="flex-1"
                            >
                              <Link href={unitHref}>
                                <span>{name}</span>
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
    case "word_patterns": {
      // The letter-identifying sheet only makes sense where the unit says
      // which letters it is about; the pattern sheets suit any of them.
      const sheets = unit.letterGroup
        ? [
            {
              href: `${unitHref}/worksheet/identify`,
              label: `Identify ${letterGroupNoun(unit.letterGroup)}`,
            },
          ]
        : [];
      // A word-family unit matches pictures to whole spellings, and gets a
      // sheet asking only for the vowel.
      const isFamilyUnit = unit.patternSet === "short_vowels";
      const rest = [
        // Identifying the vowel comes before matching a whole spelling.
        // A word-family unit matches pictures to vowels; matching them to a
        // whole spelling is what the writing sheet already asks for.
        ...(isFamilyUnit
          ? [{ href: `${unitHref}/worksheet/match-vowel`, label: "Match Vowel" }]
          : [
              {
                href: `${unitHref}/worksheet/pattern-match`,
                label: "Match pictures",
              },
            ]),
        { href: `${unitHref}/worksheet/choose`, label: "Choose the letters" },
        {
          href: `${unitHref}/worksheet/pattern-write`,
          label: "Write the letters",
        },
        { href: `${unitHref}/worksheet/fluency`, label: "Read the words" },
      ];

      return [...sheets, ...rest].map((sheet, index) => ({
        ...sheet,
        label: `W${index + 1}: ${sheet.label}`,
      }));
    }
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
