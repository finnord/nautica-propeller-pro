import { ReactNode, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchFilterCardProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}

const SearchFilterCard = forwardRef<HTMLInputElement, SearchFilterCardProps>(({ 
  searchTerm,
  onSearchChange,
  placeholder,
  children
}, ref) => {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-lg">Filtri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref={ref}
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 input-business"
              />
            </div>
          </div>
          {children && (
            <div className="flex gap-2">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SearchFilterCard.displayName = 'SearchFilterCard';

export { SearchFilterCard };
