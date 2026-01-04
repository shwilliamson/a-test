import { Pin, List, CheckCircle, type LucideIcon } from "lucide-react";
import { ListCard } from "./ListCard";
import type { List as ListType } from "@/contexts/ListsContextDef";

type SectionType = "pinned" | "active" | "completed";

interface ListSectionProps {
  type: SectionType;
  lists: ListType[];
}

const sectionConfig: Record<SectionType, { label: string; Icon: LucideIcon }> = {
  pinned: { label: "Pinned", Icon: Pin },
  active: { label: "Active", Icon: List },
  completed: { label: "Completed", Icon: CheckCircle },
};

/**
 * Section component for displaying a group of lists
 */
export function ListSection({ type, lists }: ListSectionProps) {
  // Don't render if no lists in this section
  if (lists.length === 0) {
    return null;
  }

  const { label, Icon } = sectionConfig[type];

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <ListCard key={list.id} list={list} />
        ))}
      </div>
    </section>
  );
}
