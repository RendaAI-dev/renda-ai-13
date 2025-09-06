
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleTabContentProps {
  title: string;
  description: string;
  noDataMessage: string;
}

const SimpleTabContent: React.FC<SimpleTabContentProps> = ({ title, description, noDataMessage }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{noDataMessage}</p>
      </CardContent>
    </Card>
  );
};

export default SimpleTabContent;
