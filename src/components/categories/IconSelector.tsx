
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

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

// Define a type that matches the Lucide components structure
type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Update the icons array with the correct type
const icons: { name: string, component: LucideIconComponent }[] = [
  { name: 'circle', component: Circle },
  { name: 'home', component: Home },
  { name: 'shopping-bag', component: ShoppingBag },
  { name: 'car', component: Car },
  { name: 'film', component: FilmIcon },
  { name: 'activity', component: Activity },
  { name: 'book', component: BookOpen },
  { name: 'file-text', component: FileText },
  { name: 'more-horizontal', component: MoreHorizontal },
  { name: 'briefcase', component: Briefcase },
  { name: 'laptop', component: Laptop },
  { name: 'trending-up', component: TrendingUp },
  { name: 'gift', component: Gift },
  { name: 'plus-circle', component: PlusCircle },
  { name: 'utensils', component: Utensils },
  { name: 'dollar-sign', component: DollarSign },
  { name: 'credit-card', component: CreditCard },
  { name: 'coffee', component: Coffee },
  { name: 'smartphone', component: Smartphone },
  { name: 'scissors', component: Scissors },
  { name: 'shirt', component: Shirt },
  { name: 'plane', component: Plane }
];

const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onSelectIcon }) => {
  return (
    <div className="grid grid-cols-6 gap-2 py-2">
      {icons.map((icon) => {
        const IconComponent = icon.component;
        return (
          <button
            key={icon.name}
            type="button"
            onClick={() => onSelectIcon(icon.name)}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              selectedIcon === icon.name ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            <IconComponent size={16} />
          </button>
        );
      })}
    </div>
  );
};

export default IconSelector;
