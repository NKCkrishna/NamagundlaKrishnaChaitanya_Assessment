import React, { useState, createContext, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { User, Role } from './types';
import { Auth } from './components/Auth';
import { StudentView } from './components/StudentView';
import { AdminView } from './components/AdminView';
import { Profile } from './components/Profile';
import { LogOutIcon, MoonIcon, SunIcon } from './components/ui';

// --- Theme Management ---
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };
    
    const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// --- Auth Management ---
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {}, logout: () => {} });

const Header: React.FC = () => {
    const { user, logout } = React.useContext(AuthContext);
    const { theme, toggleTheme } = React.useContext(ThemeContext);
    const location = useLocation();

    if (!user) return null;

    const NavLink: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => {
        const isActive = location.pathname === to;
        return (
            <Link to={to} className={`px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {children}
            </Link>
        )
    }

    return (
        <header className="bg-white dark:bg-slate-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                       <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Sambhāṣa</h1>
                        <nav className="ml-10 flex items-baseline space-x-4">
                            {user.role === Role.STUDENT && <NavLink to="/">Dashboard</NavLink>}
                            {user.role === Role.ADMIN && <NavLink to="/">Admin Dashboard</NavLink>}
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                         <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                        </button>
                         <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                            <img src={user.profilePicture || `https://i.pravatar.cc/150?u=${user.id}`} alt="profile" className="w-8 h-8 rounded-full" />
                            {user.name}
                        </Link>
                        <button onClick={logout} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <LogOutIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const ProtectedRoute: React.FC<{ children: JSX.Element; role?: Role }> = ({ children, role }) => {
    const { user } = React.useContext(AuthContext);
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (role && user.role !== role) {
        return <Navigate to="/" replace />;
    }
    return children;
};


const AppContent: React.FC = () => {
    const { user, setUser } = React.useContext(AuthContext);

    if (!user) {
      return (
        <Routes>
          <Route path="/login" element={<Auth onAuthSuccess={setUser} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }
    
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    {user.role === Role.STUDENT && (
                        <Route path="/" element={<ProtectedRoute role={Role.STUDENT}><StudentView /></ProtectedRoute>} />
                    )}
                    {user.role === Role.ADMIN && (
                        <Route path="/" element={<ProtectedRoute role={Role.ADMIN}><AdminView /></ProtectedRoute>} />
                    )}
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
};

// FIX: Add a root App component to manage state and provide context.
const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = sessionStorage.getItem('user');
            if (savedUser) {
                return JSON.parse(savedUser);
            }
        } catch (error) {
            console.error("Failed to parse user from session storage:", error);
        }
        return null;
    });

    useEffect(() => {
        if (user) {
            sessionStorage.setItem('user', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('user');
        }
    }, [user]);

    const logout = () => {
        setUser(null);
    };

    const authContextValue = useMemo(() => ({ user, setUser, logout }), [user]);

    return (
        <ThemeProvider>
            <AuthContext.Provider value={authContextValue}>
                <HashRouter>
                    <AppContent />
                </HashRouter>
            </AuthContext.Provider>
        </ThemeProvider>
    );
};

// FIX: Export the App component as the default export.
export default App;
