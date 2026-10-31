"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product, Category } from "@/types";
import { ArrowRight, Smartphone } from "lucide-react";

interface HomeClientProps {
  featuredProducts: Product[];
  categories: Category[];
}

export default function HomeClient({
  featuredProducts,
  categories,
}: HomeClientProps) {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Navbar />

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-[#1d1d1f] text-white">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] bg-[#0071e3]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] bg-[#42a5f5]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-16 pt-28 md:py-24 md:pt-36 relative z-10 max-w-8xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-1.5 rounded-full text-xs font-medium mb-6 tracking-wide text-white/80">
                <Smartphone size={14} />
                {t("home.hero_badge")}
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-semibold mb-5 leading-tight tracking-tight">
                {t("home.hero_title_1")}
                <br />
                <span className="bg-gradient-to-r from-[#2997ff] to-[#64d2ff] bg-clip-text text-transparent">
                  {t("home.hero_title_2")}
                </span>
              </h1>

              <p className="text-base md:text-lg mb-8 text-white/60 leading-relaxed max-w-lg">
                {t("home.hero_desc")}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  data-testid="home-hero-shop-link"
                  className="inline-flex items-center gap-2 bg-[#0071e3] text-white px-7 py-3 rounded-full font-semibold hover:bg-[#0077ed] transition-colors text-sm"
                >
                  {t("home.shop_now")}
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#iphone-lines"
                  data-testid="home-hero-categories-link"
                  className="inline-flex items-center gap-2 border border-white/25 text-white px-7 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors text-sm"
                >
                  {t("home.browse_categories")}
                </a>
              </div>
            </div>

            <div className="hidden lg:flex justify-center items-center">
              <div className="relative w-[26rem] h-[26rem] rounded-full bg-gradient-to-br from-[#0071e3]/30 to-[#64d2ff]/10 flex items-center justify-center">
                <Image
                  src="/iphone.svg"
                  alt="iPhone"
                  width={360}
                  height={360}
                  className="w-72 h-72 object-contain drop-shadow-2xl"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- iPhone lines / categories ---- */}
      <section
        id="iphone-lines"
        className="container mx-auto px-4 py-12 max-w-8xl scroll-mt-28"
      >
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/60">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
              {t("home.categories_title")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("home.categories_desc")}
            </p>
          </div>

          {categories.length === 0 ? (
            <div
              data-testid="home-categories-empty-state"
              className="text-center py-12 text-gray-400"
            >
              {t("home.no_categories")}
            </div>
          ) : (
            <div
              data-testid="home-categories-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  data-testid={`home-category-card-${category.slug}`}
                  className="group bg-[#f5f5f7] hover:bg-[#e8f1ff] border border-transparent hover:border-[#0071e3]/20 rounded-2xl p-5 text-center transition-all"
                >
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#0071e3] shadow-sm mb-3 group-hover:scale-105 transition-transform">
                    <Smartphone size={22} />
                  </div>
                  <p className="text-sm font-semibold text-[#1d1d1f]">
                    {language === "en" && category.name_en
                      ? category.name_en
                      : category.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Featured products ---- */}
      <section className="container mx-auto px-4 pb-14 max-w-8xl">
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
                {t("home.featured_products")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t("home.featured_products_desc")}
              </p>
            </div>
            <Link
              href="/products"
              data-testid="home-featured-view-all-link"
              className="text-sm font-medium text-[#0071e3] hover:underline flex items-center gap-1"
            >
              {t("home.view_all")}
              <ArrowRight size={14} />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div
              data-testid="home-featured-empty-state"
              className="text-center py-16"
            >
              <Smartphone size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-500 font-medium">
                {t("home.no_products")}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {t("home.no_products_desc")}
              </p>
            </div>
          ) : (
            <div
              data-testid="home-featured-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer
        data-testid="home-footer"
        className="bg-white border-t border-gray-200"
      >
        <div className="container mx-auto px-4 py-12 max-w-8xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#0071e3] text-white flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <span className="text-lg font-semibold text-[#1d1d1f]">
                  {t("footer.brand")}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
                {t("footer.description")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1d1d1f] mb-4">
                {t("footer.quick_links")}
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>
                  <Link
                    href="/products"
                    data-testid="home-footer-products-link"
                    className="hover:text-[#0071e3] transition-colors"
                  >
                    {t("nav.products")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track-order"
                    data-testid="home-footer-track-order-link"
                    className="hover:text-[#0071e3] transition-colors"
                  >
                    {t("nav.track_order")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    data-testid="home-footer-cart-link"
                    className="hover:text-[#0071e3] transition-colors"
                  >
                    {t("cart.title")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#1d1d1f] mb-4">
                {t("footer.contact_info")}
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>{t("footer.company_name")}</li>
                <li>{t("footer.email")}</li>
                <li>{t("footer.phone")}</li>
                <li>{t("footer.address")}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-10 pt-6 text-center text-gray-400 text-xs">
            <p>&copy; 2026 {t("footer.rights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
