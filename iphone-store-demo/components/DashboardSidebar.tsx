'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const menuItems = [
    {
      name: 'Tài Khoản',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Đơn Hàng',
      href: '/orders',
      icon: Package,
    },
  ];

  return (
    <div data-testid="dashboard-sidebar" className="w-full">
      {/* User Brief Info */}
      <div className="bg-white rounded-lg p-6 border border-gray-100 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0071e3] to-[#2997ff] flex items-center justify-center text-white font-bold text-lg">
          {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p data-testid="sidebar-user-name" className="font-bold text-gray-900 truncate">
            {user?.user_metadata?.full_name || 'Người dùng'}
          </p>
          <p data-testid="sidebar-user-email" className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="p-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`sidebar-link-${item.href === '/profile' ? 'profile' : 'orders'}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  isActive
                    ? 'bg-[#0071e3]/10 text-[#0071e3]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="h-px bg-gray-100 my-1 mx-2" />

        <div className="p-2">
          <button
            data-testid="sidebar-signout-button"
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Đăng Xuất
          </button>
        </div>
      </div>
    </div>
  );
}
