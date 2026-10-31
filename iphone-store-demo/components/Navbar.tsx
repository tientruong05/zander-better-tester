'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, ChevronDown, Globe, MapPin, Tag, Home, ShieldCheck, ChevronRight, Smartphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
}

export default function Navbar() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showMobileCats, setShowMobileCats] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      if (error) {
        console.error('Error fetching categories in Navbar:', error);
        setCatError(error.message);
      }
      if (data) {
        setCategories(data);
      }
      setLoadingCats(false);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCatDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setShowMobileCats(false);
  };

  const navLinks = [
    { href: '/', label: t('nav.home') || 'Trang Chủ', icon: <Home size={20} /> },
    { href: '/products', label: t('nav.products'), icon: <Tag size={20} /> },
    { href: '/track-order', label: t('nav.track_order') || 'Theo Dõi Đơn', icon: <MapPin size={20} /> },
  ];

  return (
    <>
      {/* ── Top Navbar Bar ── */}
      <div className="fixed top-2 sm:top-4 left-0 right-0 z-50 flex justify-center px-2 sm:px-4">
        <nav className="bg-white/50 backdrop-blur-xl backdrop-saturate-150 border border-gray-200/50 shadow-lg shadow-black/[0.03] rounded-2xl px-3 py-2.5 sm:px-6 sm:py-4 w-full container flex items-center justify-between transition-all duration-300">
          {/* Logo */}
          <Link href="/" data-testid="nav-logo-link" className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 hover:opacity-80 transition-opacity whitespace-nowrap min-w-0 flex-shrink-0 max-w-[45vw] sm:max-w-none truncate">
            <span className="w-8 h-8 rounded-lg bg-[#0071e3] text-white flex items-center justify-center flex-shrink-0">
              <Smartphone size={17} />
            </span>
            {t('nav.logo')}
          </Link>

          {/* Centered Navigation Links - Desktop only */}
          <div className="hidden md:flex items-center space-x-10 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/products" data-testid="nav-products-link" className="text-gray-600 font-medium hover:text-[#0071e3] transition-colors relative group py-2">
              {t('nav.products')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0071e3] transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {/* Categories Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                data-testid="nav-categories-toggle"
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                className={`flex items-center gap-1 font-medium transition-colors relative group py-2 ${showCatDropdown ? 'text-[#0071e3]' : 'text-gray-600 hover:text-[#0071e3]'}`}
              >
                {t('nav.categories')}
                <ChevronDown size={14} className={`transition-transform duration-200 ${showCatDropdown ? 'rotate-180' : ''}`} />
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#0071e3] transition-all duration-300 ${showCatDropdown ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>

              {showCatDropdown && (
                <div data-testid="nav-categories-dropdown" className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45"></div>
                  <div className="relative bg-white z-10 flex flex-col max-h-[60vh] overflow-y-auto">
                    {categories.length > 0 ? categories.map(cat => (
                      <Link
                        key={cat.id}
                        data-testid={`nav-category-link-${cat.slug}`}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setShowCatDropdown(false)}
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0071e3] transition-colors font-medium"
                      >
                        {language === 'en' && cat.name_en ? cat.name_en : cat.name}
                      </Link>
                    )) : catError ? (
                      <span className="px-4 py-2.5 text-sm text-red-500">Error: {catError}</span>
                    ) : loadingCats ? (
                      <span className="px-4 py-2.5 text-sm text-gray-400">{t('nav.loading') || 'Loading...'}</span>
                    ) : (
                      <span className="px-4 py-2.5 text-sm text-gray-400">{t('products.empty') || 'No categories'}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link href="/track-order" data-testid="nav-track-order-link" className="text-gray-600 font-medium hover:text-[#0071e3] transition-colors relative group py-2">
              {t('nav.track_order') || 'Theo Dõi Đơn'}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0071e3] transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {isAdmin && (
              <Link href="/admin" data-testid="nav-admin-link" className="text-[#0071e3] font-bold hover:text-[#005bb5] transition-colors relative group py-2">
                {t('nav.admin')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#005bb5] transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-5">
            {/* Language Switcher */}
            <div className="relative" ref={langDropdownRef}>
              <button
                data-testid="nav-language-toggle"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 text-gray-600 hover:text-[#0071e3] transition-colors px-1.5 py-1.5 rounded-lg hover:bg-gray-50"
              >
                <Globe size={17} />
                <span className="hidden sm:inline text-sm font-medium uppercase">{language}</span>
              </button>

              {showLangDropdown && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    data-testid="nav-language-vi"
                    onClick={() => { setLanguage('vi'); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${language === 'vi' ? 'text-[#0071e3] bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    data-testid="nav-language-en"
                    onClick={() => { setLanguage('en'); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${language === 'en' ? 'text-[#0071e3] bg-blue-50' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              data-testid="nav-cart-button"
              onClick={() => router.push('/cart')}
              className="text-gray-600 hover:text-[#0071e3] transition-colors relative p-1.5"
            >
              <ShoppingCart size={21} />
              {totalItems > 0 && (
                <span data-testid="nav-cart-badge" className="absolute top-0 right-0 bg-[#0071e3] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              data-testid="nav-mobile-menu-button"
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile Full-Screen Drawer ── */}
      {/* Backdrop */}
      {showMobileMenu && (
        <div
          data-testid="nav-mobile-backdrop"
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Drawer Panel */}
      <div
        data-testid="nav-mobile-drawer"
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[80vw] max-w-[320px] bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          showMobileMenu ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#0071e3] text-white flex items-center justify-center">
              <Smartphone size={16} />
            </span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Menu</p>
              <p className="text-sm font-bold text-gray-900">{t('nav.logo')}</p>
            </div>
          </div>
          <button
            data-testid="nav-mobile-close-button"
            onClick={closeMobileMenu}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-3">
          <nav className="px-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`nav-mobile-link-${link.href === '/' ? 'home' : link.href.slice(1)}`}
                onClick={closeMobileMenu}
                className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-gray-700 font-medium hover:bg-blue-50 hover:text-[#0071e3] transition-all group"
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#0071e3]/10 flex items-center justify-center text-gray-500 group-hover:text-[#0071e3] transition-all flex-shrink-0">
                  {link.icon}
                </span>
                <span>{link.label}</span>
                <ChevronRight size={15} className="ml-auto text-gray-300 group-hover:text-[#0071e3] transition-colors" />
              </Link>
            ))}

            {/* Categories Accordion */}
            <div>
              <button
                data-testid="nav-mobile-categories-toggle"
                onClick={() => setShowMobileCats(!showMobileCats)}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-gray-700 font-medium hover:bg-blue-50 hover:text-[#0071e3] transition-all group"
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#0071e3]/10 flex items-center justify-center text-gray-500 group-hover:text-[#0071e3] transition-all flex-shrink-0">
                  <Tag size={20} />
                </span>
                <span>{t('nav.categories')}</span>
                <ChevronDown
                  size={15}
                  className={`ml-auto text-gray-300 group-hover:text-[#0071e3] transition-all duration-200 ${showMobileCats ? 'rotate-180 text-[#0071e3]' : ''}`}
                />
              </button>

              {/* Category list */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMobileCats ? 'max-h-96' : 'max-h-0'}`}>
                <div className="ml-4 pl-3 border-l-2 border-blue-100 py-1 space-y-0.5 mt-0.5">
                  {loadingCats ? (
                    <p className="py-2 px-3 text-sm text-gray-400">{t('nav.loading') || 'Loading...'}</p>
                  ) : catError ? (
                    <p className="py-2 px-3 text-sm text-red-400">Error loading</p>
                  ) : categories.length === 0 ? (
                    <p className="py-2 px-3 text-sm text-gray-400">Chưa có danh mục</p>
                  ) : categories.map(cat => (
                    <Link
                      key={cat.id}
                      data-testid={`nav-mobile-category-link-${cat.slug}`}
                      href={`/products?category=${cat.slug}`}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-[#0071e3] hover:bg-blue-50 transition-all font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-200 flex-shrink-0" />
                      {language === 'en' && cat.name_en ? cat.name_en : cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {isAdmin && (
              <>
                <div className="h-px bg-gray-100 mx-3 my-2" />
                <Link
                  href="/admin"
                  data-testid="nav-mobile-admin-link"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-[#0071e3] font-bold hover:bg-blue-50 transition-all group"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3] flex-shrink-0">
                    <ShieldCheck size={20} />
                  </span>
                  <span>{t('nav.admin')}</span>
                  <ChevronRight size={15} className="ml-auto text-[#0071e3]/50" />
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Drawer Footer – Language Switcher */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Ngôn ngữ / Language</p>
          <div className="flex gap-2">
            <button
              data-testid="nav-mobile-language-vi"
              onClick={() => setLanguage('vi')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${language === 'vi' ? 'bg-[#0071e3] text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              🇻🇳 VI
            </button>
            <button
              data-testid="nav-mobile-language-en"
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${language === 'en' ? 'bg-[#0071e3] text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
