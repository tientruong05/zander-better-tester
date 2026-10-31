'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { showAlert } from '@/lib/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CollectionPoint } from '@/types';
import { ChevronDown, ChevronUp, Check, ShoppingBag, MapPin, CreditCard, User } from 'lucide-react';

// ── Input style helper ──────────────────────────────────────────────────────
const input = "w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/20 focus:outline-none transition-colors text-sm bg-white";
const label = "block text-xs font-medium text-gray-600 mb-1.5";

// ── Section accordion wrapper ────────────────────────────────────────────────
function Section({
  step, title, icon, open, done, onClick, children, testId,
}: {
  step: number; title: string; icon: React.ReactNode;
  open: boolean; done: boolean; onClick: () => void; children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 ${open ? 'border-[#0071e3]/40 shadow-md shadow-blue-100' : 'border-gray-100'}`}>
      <button type="button" data-testid={testId} onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-emerald-500 text-white' : open ? 'bg-[#0071e3] text-white' : 'bg-gray-100 text-gray-500'}`}>
          {done ? <Check size={13} /> : step}
        </span>
        <span className={`font-semibold text-sm flex-1 ${open ? 'text-[#0071e3]' : done ? 'text-gray-900' : 'text-gray-500'}`}>{title}</span>
        {done && !open && <span className="text-xs text-emerald-600 font-medium mr-1">✓ {useLanguage().t('common.confirm')}</span>}
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-300 flex-shrink-0" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-1">{children}</div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<number>(1);
  // tracks which sections the user has *explicitly* confirmed via "Tiếp tục →"
  const [confirmedSections, setConfirmedSections] = useState<Set<number>>(new Set());

  const confirmSection = (n: number) => {
    setConfirmedSections(prev => new Set(prev).add(n));
  };

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    address: '', city: '', district: '', ward: '', notes: '',
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [provinceCode, setProvinceCode] = useState<number | string>('');
  const [districtCode, setDistrictCode] = useState<number | string>('');
  const [wardCode, setWardCode] = useState<number | string>('');

  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [collectionPointId, setCollectionPointId] = useState<string>('');
  const [addressVersion, setAddressVersion] = useState<'v1' | 'v2'>('v1');
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // ── Section done states: form valid AND user has confirmed ────────────────
  const contactValid = !!(formData.fullName && formData.phone && formData.email);
  const deliveryValid = deliveryMethod === 'pickup'
    ? !!collectionPointId
    : !!(formData.city && formData.address && (addressVersion === 'v1' ? formData.district && formData.ward : formData.ward));

  const contactDone = contactValid && confirmedSections.has(1);
  const deliveryDone = deliveryValid && confirmedSections.has(2);
  const paymentDone = confirmedSections.has(3);

  const hasSelectedLocation = !!formData.city;
  const shippingFee: number = 0;
  const finalTotal = totalPrice + shippingFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggle = (n: number) => setOpenSection(openSection === n ? 0 : n);

  useEffect(() => {
    setProvinceCode(''); setDistrictCode(''); setWardCode('');
    setFormData(prev => ({ ...prev, city: '', district: '', ward: '' }));
    setDistricts([]); setWards([]);
    const url = addressVersion === 'v1' ? 'https://provinces.open-api.vn/api/p/' : 'https://provinces.open-api.vn/api/v2/p/';
    fetch(url).then(r => r.json()).then(setProvinces).catch(console.error);
  }, [addressVersion]);

  useEffect(() => {
    supabase.from('collection_points').select('*').eq('is_active', true).then(({ data }) => {
      if (data) { setCollectionPoints(data); if (data.length > 0) setCollectionPointId(data[0].id); }
    });
  }, []);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    setProvinceCode(code);
    const prov = provinces.find(p => p.code === code);
    setFormData(prev => ({ ...prev, city: prov?.name || '', district: '', ward: '' }));
    setDistricts([]); setWards([]); setDistrictCode(''); setWardCode('');
    if (code) {
      if (addressVersion === 'v1') {
        fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`).then(r => r.json()).then(d => setDistricts(d.districts)).catch(console.error);
      } else {
        fetch(`https://provinces.open-api.vn/api/v2/p/${code}?depth=2`).then(r => r.json()).then(d => setWards(d.wards || [])).catch(console.error);
      }
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    setDistrictCode(code);
    const dist = districts.find(d => d.code === code);
    setFormData(prev => ({ ...prev, district: dist?.name || '', ward: '' }));
    setWards([]); setWardCode('');
    if (code) {
      fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`).then(r => r.json()).then(d => setWards(d.wards)).catch(console.error);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    setWardCode(code);
    const w = wards.find(w => w.code === code);
    setFormData(prev => ({ ...prev, ward: w?.name || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactDone) {
      setOpenSection(1);
      return showAlert.warning(t('common.error_occurred'), t('checkout.incomplete_contact'));
    }
    if (!deliveryDone) {
      setOpenSection(2);
      return showAlert.warning(t('common.error_occurred'), t('checkout.incomplete_delivery'));
    }
    if (!paymentDone) {
      setOpenSection(3);
      return showAlert.warning(t('common.error_occurred'), t('checkout.incomplete_payment'));
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: formData,
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.sale_price || item.product.price,
          })),
          totalAmount: finalTotal,
          paymentMethod,
          deliveryMethod,
          collectionPointId: deliveryMethod === 'pickup' ? collectionPointId : null,
          language,
          shippingFee,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('checkout.order_error'));
      setIsSuccess(true);
      clearCart();
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else router.push(`/orders/${data.orderId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error_occurred');
      showAlert.error(t('checkout.order_failed'), msg);
      setIsSubmitting(false);
    }
  };

  // ── Empty / Success states ───────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-8 max-w-md">
          <div data-testid="checkout-success-state" className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071e3] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('checkout.processing')}</h2>
            <p className="text-gray-500 text-sm">{t('checkout.success')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-8">
          <div data-testid="checkout-empty-state" className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto shadow-lg">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h1>
            <p className="text-gray-500 text-sm mb-6">{t('checkout.empty_cart_error')}</p>
            <Link href="/products" data-testid="checkout-empty-continue-link" className="inline-block bg-[#0071e3] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#005bb5] transition-all text-sm">
              {t('cart.continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(135deg, #fbfbfd 0%, #f5f5f7 50%, #f5f5f7 100%)' }}>
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-28 pb-4 max-w-5xl">

        {/* ── Page title ── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0071e3] to-[#2997ff] flex items-center justify-center text-white shadow-md shadow-blue-200">
            <ShoppingBag size={18} />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">{t('checkout.title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── LEFT: Accordion form ── */}
          <form id="checkout-form" onSubmit={handleSubmit} noValidate className="lg:col-span-2 space-y-3">

            {/* Step 1 — Contact */}
            <Section step={1} title={t('checkout.contact_info')} icon={<User size={14} />} open={openSection === 1} done={contactDone} onClick={() => toggle(1)} testId="checkout-step1-toggle">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>{t('checkout.full_name')} <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} className={input} placeholder="Nguyễn Văn A" data-testid="checkout-step1-fullname-input" />
                </div>
                <div>
                  <label className={label}>{t('checkout.phone')} <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} className={input} placeholder="0912345678" data-testid="checkout-step1-phone-input" />
                </div>
                <div className="sm:col-span-2">
                  <label className={label}>{t('checkout.email')} <span className="text-red-500">*</span></label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className={input} placeholder="example@email.com" data-testid="checkout-step1-email-input" />
                </div>
              </div>
              {contactValid && (
                <button type="button" data-testid="checkout-step1-continue-button" onClick={() => { confirmSection(1); toggle(2); }} className="mt-3 w-full py-2.5 bg-[#0071e3] text-white text-sm font-semibold rounded-lg hover:bg-[#005bb5] transition-colors">
                  {t('common.confirm')} →
                </button>
              )}
            </Section>

            {/* Step 2 — Delivery */}
            <Section step={2} title={t('checkout.delivery_method')} icon={<MapPin size={14} />} open={openSection === 2} done={deliveryDone} onClick={() => toggle(2)} testId="checkout-step2-toggle">
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {(['pickup', 'shipping'] as const).map(m => (
                  <button key={m} type="button" data-testid={`checkout-step2-${m}-toggle`} onClick={() => setDeliveryMethod(m)}
                    className={`p-3 border-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${deliveryMethod === m ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${deliveryMethod === m ? 'border-[#0071e3] bg-[#0071e3]' : 'border-gray-300'}`} />
                    {m === 'pickup' ? t('checkout.delivery_pickup') : t('checkout.delivery_shipping')}
                  </button>
                ))}
              </div>

              {deliveryMethod === 'pickup' ? (
                <div className="space-y-2">
                  <label className={label}>{t('checkout.pickup_location_label')} <span className="text-red-500">*</span></label>
                  {collectionPoints.map(point => (
                    <label key={point.id} className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${collectionPointId === point.id ? 'border-[#0071e3] bg-blue-50' : 'border-gray-200'}`}>
                      <input type="radio" name="collectionPoint" value={point.id} checked={collectionPointId === point.id} onChange={e => setCollectionPointId(e.target.value)} className="mt-0.5 text-[#0071e3] focus:ring-[#0071e3]" data-testid={`checkout-step2-collection-point-radio-${point.id}`} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{point.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{point.address}</p>
                      </div>
                    </label>
                  ))}
                  {collectionPoints.length === 0 && <p className="text-sm text-gray-400">{t('checkout.loading_pickup_locations')}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    {t('checkout.free_shipping_notice')}
                  </p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">{t('checkout.address')}</h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {(['v1', 'v2'] as const).map(v => (
                        <button key={v} type="button" onClick={() => setAddressVersion(v)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${addressVersion === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {v === 'v1' ? t('checkout.address_v1') : t('checkout.address_v2')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 ${addressVersion === 'v1' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                    <div>
                      <label className={label}>{t('checkout.province')} <span className="text-red-500">*</span></label>
                      <select name="city" required value={provinceCode} onChange={handleProvinceChange} className={input} data-testid="checkout-step2-province-select">
                        <option value="">{t('checkout.select_province')}</option>
                        {provinces.map((p: any) => <option key={p.code} value={p.code}>{p.name}</option>)}
                      </select>
                    </div>
                    {addressVersion === 'v1' && (
                      <div>
                        <label className={label}>{t('checkout.district')} <span className="text-red-500">*</span></label>
                        <select name="district" required value={districtCode} onChange={handleDistrictChange} disabled={!provinceCode} className={`${input} disabled:bg-gray-100 disabled:text-gray-400`} data-testid="checkout-step2-district-select">
                          <option value="">{t('checkout.select_district')}</option>
                          {districts.map((d: any) => <option key={d.code} value={d.code}>{d.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className={label}>{t('checkout.ward')} <span className="text-red-500">*</span></label>
                      <select name="ward" required value={wardCode} onChange={handleWardChange} disabled={addressVersion === 'v1' ? !districtCode : !provinceCode} className={`${input} disabled:bg-gray-100 disabled:text-gray-400`} data-testid="checkout-step2-ward-select">
                        <option value="">{t('checkout.select_ward')}</option>
                        {wards.map((w: any) => <option key={w.code} value={w.code}>{w.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={label}>{t('checkout.street_address')} <span className="text-red-500">*</span></label>
                    <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className={input} placeholder={t('checkout.street_placeholder')} data-testid="checkout-step2-address-input" />
                  </div>
                  <div>
                    <label className={label}>{t('checkout.notes')}</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} className={`${input} resize-none`} placeholder={t('checkout.notes_placeholder')} data-testid="checkout-step2-notes-input" />
                  </div>
                </div>
              )}

              {deliveryValid && (
                <button type="button" data-testid="checkout-step2-continue-button" onClick={() => { confirmSection(2); toggle(3); }} className="mt-3 w-full py-2.5 bg-[#0071e3] text-white text-sm font-semibold rounded-lg hover:bg-[#005bb5] transition-colors">
                  {t('common.confirm')} →
                </button>
              )}
            </Section>

            {/* Step 3 — Payment */}
            <Section step={3} title={t('checkout.payment_method')} icon={<CreditCard size={14} />} open={openSection === 3} done={paymentDone} onClick={() => toggle(3)} testId="checkout-step3-toggle">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['bank_transfer', 'cash'] as const).map(m => (
                  <button key={m} type="button" data-testid={`checkout-step3-${m}-button`} onClick={() => setPaymentMethod(m)}
                    className={`p-3 border-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${paymentMethod === m ? 'border-[#0071e3] bg-blue-50 text-[#0071e3]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${paymentMethod === m ? 'border-[#0071e3] bg-[#0071e3]' : 'border-gray-300'}`} />
                    {m === 'bank_transfer' ? (
                      <span>💳 {t('checkout.payment_bank_transfer')}</span>
                    ) : (
                      <span>💵 {t('checkout.payment_cash')}</span>
                    )}
                  </button>
                ))}
              </div>
              {paymentMethod === 'bank_transfer' && (
                <p className="mt-3 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  {t('checkout.payos_notice')}
                </p>
              )}
              {paymentMethod === 'cash' && (
                <p className="mt-3 text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {t('checkout.cash_notice')}
                </p>
              )}
              {!paymentDone && (
                <button type="button" data-testid="checkout-step3-continue-button" onClick={() => confirmSection(3)} className="mt-3 w-full py-2.5 bg-[#0071e3] text-white text-sm font-semibold rounded-lg hover:bg-[#005bb5] transition-colors">
                  {t('common.confirm')} →
                </button>
              )}
            </Section>
          </form>

          {/* ── RIGHT: Order summary (desktop only — sticky) ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div data-testid="checkout-order-summary" className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-3">{t('checkout.order_summary')}</h2>
              <div className="space-y-2.5 mb-4 max-h-60 overflow-y-auto">
                {items.map(item => {
                  const price = item.product.sale_price || item.product.price;
                  return (
                    <div key={item.product.id} className="flex gap-3 pb-2.5 border-b border-gray-50 last:border-0">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.product.image_url
                          ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                          : <span className="text-xl">📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">×{item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold text-[#0071e3] whitespace-nowrap">{(price * item.quantity).toLocaleString('vi-VN')}₫</p>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between text-gray-500"><span>{t('cart.subtotal')}</span><span>{totalPrice.toLocaleString('vi-VN')}₫</span></div>
                <div className="flex justify-between text-gray-500">
                  <span>{t('checkout.shipping_fee')}</span>
                  {deliveryMethod === 'shipping' && !hasSelectedLocation ? (
                    <span className="text-gray-400 font-medium">--</span>
                  ) : shippingFee === 0 ? (
                    <span className="text-emerald-600 font-medium">{t('checkout.free')}</span>
                  ) : (
                    <span className="text-gray-900 font-medium">{shippingFee.toLocaleString('vi-VN')}₫</span>
                  )}
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                  <span>{t('checkout.total_amount')}</span>
                  <span className="text-[#0071e3] text-lg">{finalTotal.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
              <button type="submit" form="checkout-form" data-testid="checkout-submit-button" disabled={isSubmitting}
                className="mt-4 w-full bg-[#0071e3] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#005bb5] transition-all disabled:opacity-50 shadow-md shadow-blue-200"
              >
                {isSubmitting ? t('checkout.processing') : t('checkout.place_order')}
              </button>
              <Link href="/cart" data-testid="checkout-back-to-cart-link" className="block text-center text-[#0071e3] text-xs font-medium hover:underline mt-3">
                ← {t('checkout.back_to_cart')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE: Sticky bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl shadow-black/10">
        {/* Expandable order summary */}
        {showOrderSummary && (
          <div className="border-b border-gray-100 px-4 py-3 max-h-60 overflow-y-auto">
            {items.map(item => {
              const price = item.product.sale_price || item.product.price;
              return (
                <div key={item.product.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.product.image_url
                      ? <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      : <span className="text-base flex items-center justify-center h-full">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-[#0071e3]">{(price * item.quantity).toLocaleString('vi-VN')}₫</p>
                </div>
              );
            })}
            <div className="flex justify-between text-xs text-gray-500 pt-2 mt-1">
              <span>{t('checkout.shipping_fee')}</span>
              {deliveryMethod === 'shipping' && !hasSelectedLocation ? (
                <span className="text-gray-400 font-semibold">--</span>
              ) : shippingFee === 0 ? (
                <span className="text-emerald-600 font-semibold">{t('checkout.free')}</span>
              ) : (
                <span className="text-gray-900 font-semibold">{shippingFee.toLocaleString('vi-VN')}₫</span>
              )}
            </div>
          </div>
        )}

        {/* Bottom action row */}
        <div className="flex items-center gap-3 px-4 py-3 safe-area-inset-bottom">
          {/* Total + toggle */}
          <button type="button" data-testid="checkout-mobile-summary-toggle" onClick={() => setShowOrderSummary(!showOrderSummary)} className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 font-medium text-left flex items-center gap-1">
              {t('checkout.items_count', { count: items.length })} {showOrderSummary ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
            </p>
            <p className="text-lg font-black text-[#0071e3] text-left leading-tight">
              {finalTotal.toLocaleString('vi-VN')}₫
            </p>
          </button>

          {/* Submit button */}
          <button type="submit" form="checkout-form" data-testid="checkout-mobile-submit-button" disabled={isSubmitting}
            className="bg-[#0071e3] text-white h-12 px-6 rounded-xl font-bold text-sm hover:bg-[#005bb5] transition-all disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95 flex-shrink-0 whitespace-nowrap"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {t('checkout.processing')}
              </span>
            ) : t('checkout.place_order')}
          </button>
        </div>
      </div>
    </div>
  );
}
