'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { showAlert } from '@/lib/alert';

export default function AdminLoginPage() {
  const router = useRouter();
  const { signIn, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        throw new Error(error.message);
      }

      // Success! auth context state is now fully updated, including isAdmin
      showAlert.success('Đăng nhập thành công', 'Chào mừng Admin');
      router.push('/admin');
      
    } catch (error: any) {
      console.error('Login error:', error);
      showAlert.error('Đăng nhập thất bại', error.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-[#0071e3]/10 text-[#0071e3] rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">iPhone Store Admin</h2>
          <p className="text-gray-500 mt-2 text-sm">Vui lòng đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleLogin} data-testid="admin-login-form" className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              data-testid="admin-login-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              data-testid="admin-login-password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            data-testid="admin-login-submit-button"
            disabled={isLoading}
            className="w-full bg-[#0071e3] text-white py-2.5 rounded-lg font-semibold hover:bg-[#005bb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
