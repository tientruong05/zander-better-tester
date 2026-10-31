'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { notifySuccess, notifyError, confirmAction } from '@/lib/utils/notifications';
import { Search, Loader2, Pencil, Trash2, Shield, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/format';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean, userName: string) => {
    if (userId === currentUser?.id) {
      notifyError('Cảnh báo', 'Bạn không thể thay đổi quyền của chính mình');
      return;
    }
    const action = currentStatus ? 'hủy quyền Admin' : 'cấp quyền Admin';
    const result = await confirmAction(
      `Xác nhận ${action}?`,
      `${userName}`,
      'Đồng ý'
    );
    if (result.isConfirmed) {
      const { error } = await supabase.from('users').update({ is_admin: !currentStatus }).eq('id', userId);
      if (!error) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentStatus } : u)));
        notifySuccess('Thành công', `Đã ${action}!`);
      } else {
        notifyError('Lỗi', 'Có lỗi xảy ra');
      }
    }
  };

  const toggleActiveStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    if (userId === currentUser?.id) {
      notifyError('Cảnh báo', 'Bạn không thể thay đổi trạng thái của chính mình');
      return;
    }
    
    const action = currentStatus ? 'Vô hiệu hóa' : 'Kích hoạt lại';
    const confirmMessage = currentStatus 
      ? `Bạn có chắc muốn vô hiệu hóa người dùng "${userName}"? Người này sẽ không thể đăng nhập.`
      : `Bạn có chắc muốn kích hoạt lại người dùng "${userName}"?`;

    const result = await confirmAction(
      `Xác nhận ${action.toLowerCase()}?`,
      confirmMessage,
      action
    );

    if (result.isConfirmed) {
      const { error } = await supabase.from('users').update({ is_active: !currentStatus }).eq('id', userId);
      if (!error) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)));
        notifySuccess('Thành công', `Người dùng đã được ${action.toLowerCase()}`);
      } else {
        notifyError('Lỗi', `Không thể ${action.toLowerCase()} người dùng`);
      }
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            data-testid="admin-users-search-input"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent w-56"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="admin-users-table" className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-50">
                <th className="text-left px-5 py-3">Người dùng</th>
                <th className="text-left px-5 py-3">Liên hệ</th>
                <th className="text-left px-5 py-3">Ngày đăng ký</th>
                <th className="text-left px-5 py-3">Vai trò</th>
                <th className="text-right px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr data-testid="admin-users-loading-state">
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="animate-spin text-[#0071e3] mx-auto" size={28} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr data-testid="admin-users-empty-state">
                  <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} data-testid={`admin-user-row-${user.id}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                          {user.full_name ? (
                            <span className="text-xs font-bold">{user.full_name[0].toUpperCase()}</span>
                          ) : (
                            <UserIcon size={14} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${user.is_active ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                              {user.full_name || 'Chưa cập nhật'}
                            </p>
                            {!user.is_active && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                                Bị khóa
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{formatPhoneNumber(user.phone) || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3">
                      <button data-testid={`admin-user-admin-toggle-${user.id}`} onClick={() => toggleAdmin(user.id, user.is_admin, user.full_name || user.email)}>
                        {user.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                            <Shield size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            User
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/users/${user.id}`}
                          data-testid={`admin-user-edit-link-${user.id}`}
                          className="p-1.5 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          data-testid={`admin-user-active-toggle-${user.id}`}
                          onClick={() => toggleActiveStatus(user.id, user.is_active, user.full_name || user.email)}
                          className={`p-1.5 rounded-md transition-colors ${
                              user.is_active 
                                ? 'text-gray-400 hover:bg-red-50 hover:text-red-600' 
                                : 'text-red-500 hover:bg-green-50 hover:text-green-600'
                          }`}
                          title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt lại"}
                        >
                          {user.is_active ? <Trash2 size={15} /> : <Shield size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
