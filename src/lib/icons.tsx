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

const registry: Record<LucideIconName, ComponentType<any>> = {
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
  return (registry as any)[name] ?? Tag;
}
