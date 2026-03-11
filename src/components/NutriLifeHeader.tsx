import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { UtensilsCrossed, User, ShoppingCart, LogOut, BookOpen, CalendarDays } from 'lucide-react';

interface NutriLifeHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function NutriLifeHeader({ currentPage, onNavigate }: NutriLifeHeaderProps) {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('home');
  };

  const isAdmin = user?.isAdmin;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate(isAdmin ? 'recipes' : 'home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Nutrio</span>
          </button>

          {/* Navigation */}
                    {!isAdmin && (
            <nav className="flex items-center gap-2">

              <button
                onClick={() => onNavigate('recipes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentPage === 'recipes'
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-5 h-5" />

                <span className="hidden sm:inline">Recipes</span>

              </button>
                        {isAuthenticated && (
                <button
                  onClick={() => onNavigate('myplan')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentPage === 'myplan'
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CalendarDays className="w-5 h-5" />
                  <span className="hidden sm:inline">My Plan</span>
                </button>
              )}
            </nav>
          )}


          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-lg">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.fullName} {isAdmin && '(Admin)'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                                    {!isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => onNavigate('profile')} className="cursor-pointer py-3">
                        <User className="w-4 h-4 mr-3 text-green-600" />
                        <span>My Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onNavigate('shopping')} className="cursor-pointer py-3">
                        <ShoppingCart className="w-4 h-4 mr-3 text-green-600" />
                        <span>My Shopping List</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-3 text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => onNavigate('login')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
