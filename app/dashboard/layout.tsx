'use client';

import { useAuth } from '@/lib/auth-context';
import { BookingProvider } from '@/lib/booking-context';
import { OperatorProvider } from '@/lib/operator-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Leaf,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    Calendar,
    Users,
    ShoppingBag
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    const role = user.role;

    const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-100 hover:text-green-700 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
        >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
        </Link>
    );


    return (
        <OperatorProvider>
            <BookingProvider>
                <div className="min-h-screen bg-transparent flex flex-col md:flex-row">
                    {/* Mobile Header */}
                    <div className="md:hidden bg-white/80 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 p-4 flex justify-between items-center sticky top-0 z-20 text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2 font-bold text-green-600 dark:text-[#52b788]">
                            <Leaf className="h-6 w-6" />
                            <span>Agri Drone</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-900 dark:text-white">
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    {/* Sidebar Navigation */}
                    <aside className={`
                fixed md:sticky top-[57px] md:top-0 right-0 md:left-0 h-[calc(100vh-57px)] md:h-screen w-64 
                bg-white dark:bg-black/95 dark:backdrop-blur-xl border-l md:border-r border-gray-200 dark:border-white/10
                transform transition-all duration-300 ease-in-out z-50
                ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
                flex flex-col shadow-xl text-gray-900 dark:text-white
            `}>
                        <div className="hidden md:flex items-center gap-2 p-6 font-bold text-xl text-center border-b border-gray-200 dark:border-white/10">
                            <Leaf className="h-7 w-7 text-green-600 dark:text-[#52b788]" />
                            <span className="tracking-tight">Agri Drone</span>
                        </div>

                        <div className="p-4 border-b border-gray-200 dark:border-white/10 md:hidden bg-gray-50 dark:bg-white/5 mx-4 rounded-lg mb-4 mt-4">
                            <p className="text-xs text-gray-500 dark:text-white/50 uppercase tracking-widest font-bold">Welcome</p>
                            <p className="font-black text-gray-900 dark:text-white text-lg">{user.name}</p>
                            <p className="text-xs text-green-600 dark:text-[#52b788] font-bold uppercase tracking-wider">{user.role}</p>
                        </div>

                        <nav className="flex-1 px-4 space-y-2 py-6">
                            {role !== 'farmer' && (
                                <>
                                    <NavItem href={`/dashboard/${role}`} icon={LayoutDashboard} label="Dashboard" />

                                    {role === 'operator' && (
                                        <>
                                            <NavItem href={`/dashboard/${role}/schedule`} icon={Calendar} label="Schedule" />
                                        </>
                                    )}

                                    {role === 'admin' && (
                                        <>
                                            <NavItem href={`/dashboard/${role}/bookings`} icon={Calendar} label="All Bookings" />
                                            <NavItem href={`/dashboard/${role}/operators`} icon={Users} label="Operators" />
                                            <NavItem href={`/dashboard/${role}/farmers`} icon={ShoppingBag} label="Farmers" />
                                        </>
                                    )}
                                </>
                            )}


                        </nav>

                        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                            <div className="hidden md:block mb-4 px-2">
                                <p className="text-sm font-black text-gray-900 dark:text-white">{user.name}</p>
                                <p className="text-xs text-green-600 dark:text-[#52b788] font-bold uppercase tracking-wider">{user.role}</p>
                            </div>
                            <button
                                onClick={async () => {
                                    setIsLoggingOut(true);
                                    await logout();
                                }}
                                disabled={isLoggingOut}
                                className="flex w-full items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 dark:text-red-100 dark:hover:bg-red-500/20 dark:hover:text-white rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="font-medium">{isLoggingOut ? 'See you soon...' : 'Logout'}</span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 p-4 md:p-8 overflow-auto">
                        {children}
                    </main>

                    {/* Overlay for mobile */}
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}
                </div>
            </BookingProvider>
        </OperatorProvider>
    );
}
