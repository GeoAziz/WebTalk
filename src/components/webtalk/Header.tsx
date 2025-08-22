
import { Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  participantCount: number;
}

export function Header({ participantCount }: HeaderProps) {
  const { user } = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <h1 className="text-2xl font-bold font-headline text-primary">WebTalk</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <span className="font-semibold text-sm hidden sm:inline">{user?.displayName}</span>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-sm">{participantCount}</span>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
