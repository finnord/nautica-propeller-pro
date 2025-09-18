import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading">Sistema Gestione BU Nautica</h2>
          <p className="text-body">Gestione giranti, bussole e listini cliente</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>
          
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </div>
      </div>
    </header>
  );
};