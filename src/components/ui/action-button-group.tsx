import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

export interface ActionButton {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  className?: string;
}

export const ActionButtonGroup = ({ actions, className }: ActionButtonGroupProps) => {
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {actions.map((action, index) => (
        <Button
          key={index}
          size={action.size || 'sm'}
          variant={action.variant || 'outline'}
          onClick={action.onClick}
        >
          <action.icon className="h-3 w-3 mr-1" />
          {action.label}
        </Button>
      ))}
    </div>
  );
};