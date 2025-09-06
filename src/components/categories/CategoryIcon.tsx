
import React from 'react';
import { 
  Circle,
  Home, 
  ShoppingBag, 
  Car, 
  FilmIcon, 
  Activity, 
  BookOpen, 
  FileText, 
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
  Utensils,
  DollarSign,
  CreditCard,
  Coffee,
  Smartphone,
  Scissors,
  Shirt,
  Plane,
  LucideProps
} from 'lucide-react';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
}

// Define a type that matches the Lucide components structure
type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Create the icon map with the correct type
const iconMap: Record<string, LucideIconComponent> = {
  'circle': Circle,
  'home': Home,
  'shopping-bag': ShoppingBag,
  'car': Car,
  'film': FilmIcon,
  'activity': Activity,
  'book': BookOpen,
  'file-text': FileText,
  'more-horizontal': MoreHorizontal,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'gift': Gift,
  'plus-circle': PlusCircle,
  'utensils': Utensils,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  'coffee': Coffee,
  'smartphone': Smartphone,
  'scissors': Scissors,
  'shirt': Shirt,
  'plane': Plane
};

const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, color, size = 20 }) => {
  const IconComponent = iconMap[icon] || Circle;

  return (
    <div className="flex items-center justify-center rounded-full" style={{ backgroundColor: color, width: size + 10, height: size + 10 }}>
      <IconComponent className="text-white" size={size} />
    </div>
  );
};

export default CategoryIcon;
