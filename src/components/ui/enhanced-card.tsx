
import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

type EnhancedCardProps = React.ComponentProps<typeof Card> & {
  gradient?: boolean;
  hover?: boolean;
  glassmorphism?: boolean;
};

export const EnhancedCard = React.forwardRef<
  HTMLDivElement,
  EnhancedCardProps
>(({ className, gradient, hover, glassmorphism, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "border-none shadow-soft overflow-hidden",
      hover && "hover-card",
      gradient && "card-gradient",
      glassmorphism && "glass",
      className
    )}
    {...props}
  />
));

EnhancedCard.displayName = "EnhancedCard";

export { 
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
};
