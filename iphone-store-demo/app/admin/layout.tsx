'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Users, LogOut, ShoppingBag, Tag } from 'lucide-react';

type TranslateFn = (keyPath: string, variables?: Record<string, string | number>) => string;

const getNavItems = (t: TranslateFn) => [
  { href: '/admin', label: t('admin.overview'), icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: t('admin.orders'), icon: ShoppingBag },
  { href: '/admin/products', label: t('admin.products'), icon: Package },
  { href: '/admin/categories', label: t('admin.categories'), icon: Tag },
  { href: '/admin/users', label: t('admin.users'), icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  
  const navItems = getNavItems(t);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading) {
      if (isLoginPage) {
        if (user && isAdmin) {
          router.push('/admin');
        }
      } else {
        if (!user || !isAdmin) {
          router.push('/');
        }
      }
    }
  }, [user, isAdmin, loading, router, isLoginPage, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0071e3]"></div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return null;
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 fixed h-full z-10 hidden md:flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/admin" data-testid="admin-logo-link" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0071e3] to-[#42a5f5] rounded-lg flex items-center justify-center">
              <LayoutDashboard className="text-white" size={16} />
            </div>
            <span className="text-[15px] font-bold text-gray-900">{t('admin.admin_panel')}</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`admin-nav-${item.href === '/admin' ? 'dashboard' : item.href.split('/').pop()}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-[#e8f1ff] text-[#0071e3]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            data-testid="admin-back-to-home-button"
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{t('admin.back_to_home')}</span>
          </button>
          <button
            data-testid="admin-signout-button"
            onClick={() => signOut().then(() => router.push('/admin/login'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all text-left"
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span>{t('admin.sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
