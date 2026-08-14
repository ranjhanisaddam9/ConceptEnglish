import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { listUnits } from "@/lib/curriculum/queries";

/**
 * Shell for the learner-facing app: side panel plus the page content.
 *
 * On tablets and phones the panel collapses behind the trigger in the header,
 * so the lesson keeps the full width of the screen.
 *
 * Units are read here and passed down, keeping the sidebar a plain client
 * component and leaving one place to swap in a database later.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const units = (await listUnits()).filter((unit) => unit.isPublished);

  return (
    <SidebarProvider>
      <AppSidebar units={units} />
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 print:hidden">
          <SidebarTrigger className="size-9" />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
