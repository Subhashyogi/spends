import { type ComponentType } from 'react';
import {
  Tag,
  Utensils,
  Bus,
  ShoppingCart,
  Home,
  CreditCard,
  Heart,
  Coins,
  Gift,
  Banknote,
  Plus,
} from 'lucide-react';

export type LucideIconName =
  | 'Tag'
  | 'Utensils'
  | 'Bus'
  | 'ShoppingCart'
  | 'Home'
  | 'CreditCard'
  | 'Heart'
  | 'Coins'
  | 'Gift'
  | 'Banknote'
  | 'Plus';

export const icons: Record<LucideIconName, ComponentType<any>> = {
  Tag,
  Utensils,
  Bus,
  ShoppingCart,
  Home,
  CreditCard,
  Heart,
  Coins,
  Gift,
  Banknote,
  Plus,
};

export function getLucideIcon(name?: string): ComponentType<any> {
  if (!name) return Tag;
  return (icons as any)[name] ?? Tag;
}
