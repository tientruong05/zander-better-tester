'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { notifySuccess, notifyError } from '@/lib/utils/notifications';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface UserFormProps {
  initialData: any;
}

export default function UserForm({ initialData }: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '', // Email is usually read-only in auth systems, but admin might update contact email? 
        // Note: Updating email in 'users' table doesn't update auth.users. 
        // For this task, we assume we are updating the profile/metadata table 'users'.
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          // email: formData.email, // Updating email might require auth changes. Let's keep it editable but aware of limitations.
        })
        .eq('id', initialData.id);

      if (error) throw error;

      notifySuccess('Thành công', 'Đã cập nhật thông tin người dùng!');
      router.push('/admin/users');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating user:', error);
      notifyError('Lỗi', `Không thể cập nhật: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users"
            data-testid="admin-user-back-link"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Người Dùng</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} data-testid="admin-user-form" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              data-testid="admin-user-email-input"
              value={formData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email không thể chỉnh sửa từ trang quản trị.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
            <input
              type="text"
              data-testid="admin-user-name-input"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              data-testid="admin-user-phone-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#0071e3] focus:border-[#0071e3]"
              placeholder="0912345678"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <Link
            href="/admin/users"
            data-testid="admin-user-cancel-link"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            data-testid="admin-user-submit-button"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-[#0071e3] text-white rounded-lg hover:bg-[#005bb5] font-medium transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </div>
  );
}
