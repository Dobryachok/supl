import {
  Beef,
  Carrot,
  Croissant,
  CupSoda,
  Fish,
  Milk,
  Package,
  Snowflake,
  Soup,
  SprayCan,
  Wheat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const map: Record<string, LucideIcon> = {
  meat: Beef,
  fish: Fish,
  dairy: Milk,
  vegetables: Carrot,
  grocery: Wheat,
  frozen: Snowflake,
  bakery: Croissant,
  drinks: CupSoda,
  asia: Soup,
  packaging: Package,
  chemistry: SprayCan,
};

export function CategoryIcon({
  categoryId,
  className,
}: {
  categoryId: string;
  className?: string;
}) {
  const Icon = map[categoryId] ?? Package;
  return <Icon className={className} strokeWidth={1.6} />;
}
