import { Button } from '@/components/ui/button';

interface StatusOption {
  value: string;
  label: string;
}

interface StatusFilterButtonsProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  options: StatusOption[];
}

export const StatusFilterButtons = ({ 
  selectedStatus, 
  onStatusChange, 
  options 
}: StatusFilterButtonsProps) => {
  return (
    <>
      {options.map((option) => (
        <Button
          key={option.value}
          variant={selectedStatus === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onStatusChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </>
  );
};