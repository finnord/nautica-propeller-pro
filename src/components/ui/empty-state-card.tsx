import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  actions?: Array<{
    icon?: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: string;
  }>;
}

export const EmptyStateCard = ({ 
  icon: Icon, 
  title, 
  description, 
  actionButton,
  actions
}: EmptyStateCardProps) => {
  return (
    <Card className="card-elevated">
      <CardContent className="text-center py-12">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {actionButton && (
          <Button className="btn-primary" onClick={actionButton.onClick}>
            {actionButton.icon && <actionButton.icon className="h-4 w-4 mr-2" />}
            {actionButton.label}
          </Button>
        )}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant as any || "outline"}
                onClick={action.onClick}
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};