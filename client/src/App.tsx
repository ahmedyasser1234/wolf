import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { endpoints } from "@/lib/api";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetails = lazy(() => import("@/pages/OrderDetails"));
const OrderSuccess = lazy(() => import("@/pages/OrderSuccess"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminRegister = lazy(() => import("@/pages/AdminRegister"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const ReturnPolicy = lazy(() => import("@/pages/legal/ReturnPolicy"));
const ShippingPolicy = lazy(() => import("@/pages/legal/ShippingPolicy"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const ContactUs = lazy(() => import("@/pages/ContactUs"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const Profile = lazy(() => import("@/pages/Profile"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const CategoryGroupsPage = lazy(() => import("@/pages/CategoryGroupsPage"));
const GroupProductsPage = lazy(() => import("@/pages/GroupProductsPage"));
const GiftCards = lazy(() => import("@/pages/GiftCards"));
const WalletPage = lazy(() => import("@/pages/Wallet"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Static common components
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, User, Menu, X, ChevronLeft, Search, ShoppingBag, LayoutDashboard, MessageSquare, Facebook, Instagram, Twitter, MessageCircle, Wallet, RefreshCw, CreditCard, Mail, Phone, Clock } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";


import { useLanguage } from "@/lib/i18n";

import { ChatHistory } from "./components/chat/ChatHistory";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useSystemNotifications } from "@/hooks/useSystemNotifications";
import { ScrollToTop } from "./components/ScrollToTop";
import { NotificationDropdown } from "./components/NotificationDropdown";

const HERO_PAGES = ['/', '/products', '/about-us', '/contact-us'];

function Navigation({ isChatHistoryOpen, setIsChatHistoryOpen, unreadCount, systemUnreadCount }: { isChatHistoryOpen: boolean, setIsChatHistoryOpen: (open: boolean) => void, unreadCount: number, systemUnreadCount: number }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const isHeroPage = HERO_PAGES.includes(location);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => endpoints.cart.get(),
    enabled: !!user
  });

  const [guestCartTrigger, setGuestCartTrigger] = useState(0);

  useEffect(() => {
    const handleCartUpdate = () => {
      setGuestCartTrigger(prev => prev + 1);
    };
    window.addEventListener('wolf-techno-cart-updated', handleCartUpdate);
    return () => window.removeEventListener('wolf-techno-cart-updated', handleCartUpdate);
  }, []);

  const cartCount = useMemo(() => {
    let count = 0;
    if (cartData && Array.isArray(cartData)) {
      count = cartData.reduce((acc, item) => acc + (item.quantity || 0), 0);
    }
    if (typeof window !== "undefined") {
      const guestItemsRaw = localStorage.getItem('wolf-techno-guest-items');
      if (guestItemsRaw) {
        try {
          const guestItems = JSON.parse(guestItemsRaw);
          if (Array.isArray(guestItems)) {
            count += guestItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
          }
        } catch (e) {
          console.error("Failed to parse guest cart", e);
        }
      }
    }
    return count;
  }, [cartData, guestCartTrigger]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isScrolled || !isHeroPage
      ? 'bg-background/90 backdrop-blur-xl border-white/5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
      : 'bg-transparent border-transparent py-4'
      }`}>
      <div className="container mx-auto px-4 md:px-8 max-w-[1600px]">
        <div className="flex items-center justify-between font-sans">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer group gap-4">
              <img src="/logo (2).png" alt="WOLF TECHNO" className="h-16 md:h-20 w-auto object-contain" />
              <h1 className="text-xl md:text-2xl font-black tracking-widest whitespace-nowrap hidden sm:block bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent animate-gradient-x">WOLF TECHNO</h1>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            {[
              { label: language === 'ar' ? "الرئيسية" : "Home", href: "/" },
              { label: language === 'ar' ? "المتجر" : "Shop", href: "/products" },
              { label: language === 'ar' ? "الأقسام" : "Categories", href: "/categories" },
              { label: language === 'ar' ? "كارت الهدية" : "Gift Cards", href: "/gift-cards" },
              { label: language === 'ar' ? "تتبع طلبي" : "Track Order", href: "/orders" },
              { label: language === 'ar' ? "الدعم" : "Support", href: "/contact-us" }
            ].map(link => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <span className={`block text-sm font-bold cursor-pointer transition-colors duration-300 ${isActive
                    ? 'text-primary'
                    : 'text-white/80 hover:text-primary'
                    }`}>
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Right Side: Tools & Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Switcher - Pill Style */}
            <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-1 py-1">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${language !== 'ar' ? 'bg-primary text-background' : 'text-white/70 hover:text-white'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${language === 'ar' ? 'bg-primary text-background' : 'text-white/70 hover:text-white'}`}
              >
                AR
              </button>
            </div>

            {/* Login / Actions Button */}
            {!user ? (
              <Link href="/login">
                <button className="hidden sm:block border-[1.5px] border-primary text-primary hover:bg-primary hover:text-background font-bold text-sm px-6 py-2 rounded-full transition-all duration-300">
                  {language === 'ar' ? "تسجيل الدخول" : "Login"}
                </button>
              </Link>
            ) : null}

            <div className="flex items-center gap-3 ml-2">
              <Link href="/cart">
                <button className="relative w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 hover:border-primary/50 transition-all group">
                  <ShoppingCart className="w-5 h-5 group-hover:text-primary transition-colors" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-background ring-2 ring-background shadow-lg"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </button>
              </Link>

              {user ? (
                <div className="relative user-menu-container" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 hover:border-primary/50 transition-all group"
                  >
                    <User className="w-5 h-5 group-hover:text-primary transition-colors" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute end-0 mt-4 w-64 bg-secondary border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-start"
                      >
                        <div className="flex items-center gap-3 p-2 mb-3 border-b border-white/10 pb-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-white text-sm truncate">{user.name}</p>
                            <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {user?.role === "admin" && (
                            <Link href="/admin-dashboard">
                              <button
                                onClick={() => setUserMenuOpen(false)}
                                className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-primary transition-colors font-medium text-white/80 flex items-center gap-3 text-sm">
                                <LayoutDashboard size={16} />
                                {t('adminDashboard')}
                              </button>
                            </Link>
                          )}
                          {user?.role !== 'admin' && (
                            <Link href="/orders">
                              <button
                                onClick={() => setUserMenuOpen(false)}
                                className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-primary transition-colors font-medium text-white/80 flex items-center gap-3 text-sm">
                                <ShoppingBag size={16} />
                                {language === 'ar' ? 'طلباتي' : 'My Orders'}
                              </button>
                            </Link>
                          )}
                          {user?.role !== 'admin' && (
                            <Link href="/wallet">
                              <button
                                onClick={() => setUserMenuOpen(false)}
                                className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-primary transition-colors font-medium text-white/80 flex items-center gap-3 text-sm">
                                <Wallet size={16} />
                                {language === 'ar' ? 'محفظتي' : 'My Wallet'}
                              </button>
                            </Link>
                          )}
                          <Link href="/profile">
                            <button
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full text-start px-3 py-2.5 rounded-xl hover:bg-white/5 hover:text-primary transition-colors font-medium text-white/80 flex items-center gap-3 text-sm">
                              <User size={16} />
                              {language === 'ar' ? "حسابي" : "My Account"}
                            </button>
                          </Link>

                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full text-start px-3 py-2.5 mt-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive transition-colors font-medium flex items-center gap-3 text-sm"
                          >
                            <div className="w-4" />
                            {t('logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 bg-secondary border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-2">
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'ar' ? "البحث في المتجر..." : "Search store..."}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-full px-5 text-start font-medium text-white placeholder:text-white/40 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center">
                      <Search size={14} />
                    </button>
                  </div>
                </form>

                {[
                  { label: language === 'ar' ? "الرئيسية" : "Home", href: "/" },
                  { label: language === 'ar' ? "المتجر" : "Shop", href: "/products" },
                  { label: language === 'ar' ? "الأقسام" : "Categories", href: "/categories" },
                  { label: language === 'ar' ? "كارت الهدية 🎁" : "Gift Cards 🎁", href: "/gift-cards" },
                  { label: language === 'ar' ? "تتبع طلبي" : "Track Order", href: "/orders" },
                  { label: language === 'ar' ? "الدعم" : "Support", href: "/contact-us" }
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    <span
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-base font-bold text-white/80 hover:text-primary hover:bg-white/5 px-4 py-3 rounded-xl cursor-pointer transition-colors"
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}

                {!user && (
                  <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                    <Link href="/login">
                      <button onClick={() => setMobileMenuOpen(false)} className="w-full border border-primary text-primary hover:bg-primary hover:text-background font-bold py-3 rounded-full transition-colors">
                        {language === 'ar' ? "تسجيل الدخول" : "Login"}
                      </button>
                    </Link>
                  </div>
                )}

                {/* Mobile Language Switcher */}
                <div className="pt-4 mt-4 border-t border-white/10">
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2">
                    <span className="text-white/60 text-sm font-bold px-3">
                      {language === 'ar' ? "اللغة" : "Language"}
                    </span>
                    <div className="flex bg-white/5 rounded-xl p-1">
                      <button
                        onClick={() => { setLanguage('en'); setMobileMenuOpen(false); }}
                        className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${language !== 'ar' ? 'bg-primary text-background' : 'text-white/60 hover:text-white'}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => { setLanguage('ar'); setMobileMenuOpen(false); }}
                        className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${language === 'ar' ? 'bg-primary text-background' : 'text-white/60 hover:text-white'}`}
                      >
                        AR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function Footer() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <footer className={`bg-[#0A0A0A] text-gray-400 border-t border-white/5 font-sans ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Features Bar */}
      <div className="bg-white py-3.5 border-b border-gray-200">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-5 text-[14px] font-black text-gray-900">
          <div className="flex items-center gap-8 md:gap-12">
            <div className={`flex items-center gap-2.5 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
              <ShoppingBag size={21} className="text-gray-900" />
              <span>{isAr ? "توصيل مجاني" : "Free Delivery"}</span>
            </div>
            <div className={`flex items-center gap-2.5 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
              <RefreshCw size={21} className="text-gray-900" />
              <span>{isAr ? "14 أيام للاسترجاع" : "14 Days To Return"}</span>
            </div>
            <div className={`flex items-center gap-2.5 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
              <Heart size={21} className="text-gray-900" />
              <span>{isAr ? "12 شهر ضمان" : "12 Months Warranty"}</span>
            </div>
          </div>
          <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
              <CreditCard size={14} className="text-primary animate-pulse" />
              <span className="text-primary font-black tracking-tight">{isAr ? "اشتري الآن وادفع لاحقاً" : "Buy Now, Pay Later"}</span>
            </div>
            <div className="flex gap-2">
              <div className="bg-black text-[12px] px-3.5 py-1.5 rounded-lg text-white font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm">G Pay</div>
              <div className="bg-black text-[12px] px-3.5 py-1.5 rounded-lg text-white font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm"> Pay</div>
              <div className="bg-[#0070d1] text-[12px] px-3.5 py-1.5 rounded-lg text-white font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm">AMEX</div>
              <div className="bg-red-600 text-[12px] px-3.5 py-1.5 rounded-lg text-white font-black uppercase tracking-tighter flex items-center gap-1 shadow-sm whitespace-nowrap">UnionPay</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-4 mb-8">
              <img src="/logo (2).png" alt="WOLF TECHNO" className="h-20 md:h-28 w-auto object-contain" />
              <h2 className="text-3xl font-black tracking-widest bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent animate-gradient-x">WOLF TECHNO</h2>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm font-medium">
              {isAr
                ? "WOLF TECHNO تابعة للأنشطة التجارية المصرح بها وتحت ترخيص شركة Wolf SMM F.Z.E وهي شركة مسجلة من قبل سلطة منطقة عجمان الحرة."
                : "WOLF TECHNO is a commercial activity operating under the license of Wolf SMM F.Z.E, a company registered by the Ajman Free Zone Authority."}
            </p>



            <div className="text-[11px] leading-5 text-gray-500 font-bold">
              {isAr ? (
                <>
                  <p>منطقة عجمان الحرة</p>
                  <p>برج بوليفارد A</p>
                </>
              ) : (
                <>
                  <p>Ajman Free Zone</p>
                  <p>Boulevard Tower A</p>
                </>
              )}
            </div>
          </div>

          {/* About Us Column */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider">
              {isAr ? 'من نحن' : 'About Us'}
            </h3>
            <ul className="space-y-4 text-gray-400 font-bold text-xs">
              <li><Link href="/about-us" className="hover:text-white transition-colors">{isAr ? 'عن ولف تكنو' : 'About Wolf Techno'}</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">{isAr ? 'المتجر' : 'Shop'}</Link></li>
            </ul>
          </div>

          {/* Information Column */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider">
              {isAr ? 'معلومات' : 'Informations'}
            </h3>
            <ul className="space-y-4 text-gray-400 font-bold text-xs mb-10">
              <li><Link href="/faq" className="hover:text-white transition-colors">{isAr ? 'مركز المساعدة والأسئلة الشائعة' : 'Help Center & FAQ'}</Link></li>
              <li><Link href="/contact-us" className="hover:text-white transition-colors">{isAr ? 'اتصل بنا' : 'Contact Us'}</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
            </ul>

            {/* Payment Grid */}
            <div className="flex flex-wrap gap-3 p-5 bg-white/[0.03] rounded-[2rem] border border-white/5 w-fit">
              <div className="bg-white p-1 rounded-lg h-10 w-20 flex items-center justify-center text-sm font-black text-blue-800 italic uppercase border border-gray-100 shadow-md">VISA</div>
              <div className="bg-white p-1 rounded-lg h-10 w-20 flex items-center justify-center text-2xl font-black text-orange-500 border border-gray-100 shadow-md">M</div>
              <div className="bg-white p-1 rounded-lg h-10 w-20 flex items-center justify-center text-xs font-black text-black border border-gray-100 shadow-md"> Pay</div>
              <div className="bg-white p-1 rounded-lg h-10 w-20 flex items-center justify-center text-[11px] font-black text-blue-900 uppercase border border-blue-100 bg-blue-50/10 shadow-md">AMEX</div>
              <div className="bg-white p-1 rounded-lg h-10 w-20 flex items-center justify-center text-[9px] font-black text-blue-700 uppercase leading-[1.1] text-center border border-gray-100 shadow-md">Union<br />Pay</div>
              <div className="bg-white p-1 rounded-lg h-10 w-20 flex items-center justify-center text-[12px] font-black text-blue-500 uppercase border border-gray-100 shadow-md">G Pay</div>
              <div className="bg-white p-1 rounded-lg h-10 w-20 flex items-center justify-center text-[10px] font-black text-blue-600 italic uppercase border border-gray-100 shadow-md leading-tight text-center">Samsung<br /><span className="text-[7px] not-italic uppercase block -mt-0.5">Pay</span></div>
            </div>
          </div>

          {/* My Account Column */}
          <div className="md:col-span-3">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider">
              {isAr ? 'حسابي' : 'My Account'}
            </h3>
            <ul className="space-y-4 text-gray-400 font-bold text-xs mb-10">
              <li><Link href="/profile" className="hover:text-white transition-colors">{isAr ? 'حسابي' : 'My Account'}</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">{isAr ? 'تتبع طلبي' : 'Track Your Order'}</Link></li>
            </ul>

            {/* Contact Details */}
            <div className={`space-y-3 flex flex-col ${isAr ? 'items-start' : 'items-start'}`}>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Contact Us</p>

              <a href="mailto:contact@wolftechno.com" className="text-xs text-white font-black hover:text-primary transition-colors flex items-center gap-3 group">
                <Mail size={14} className="text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>contact@wolftechno.com</span>
              </a>

              <a href="tel:+971588808744" className="text-xs text-white font-black hover:text-primary transition-colors flex items-center gap-3 group">
                <Phone size={14} className="text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>+971 58 880 8744</span>
              </a>

              <div className="pt-2">
                <a
                  href="https://wa.me/971588808744"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 text-[#25D366] rounded-xl text-xs font-black hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 shadow-sm"
                >
                  <MessageCircle size={14} fill="currentColor" />
                  {isAr ? "تحدث معنا عبر واتساب" : "Chat with Us on WhatsApp"}
                </a>
              </div>
            </div>

            {/* Working Hours Box */}
            <div className="mt-8 p-4 border border-white/5 bg-white/[0.03] rounded-2xl max-w-[240px]">
              <p className="text-[10px] text-gray-500 font-bold mb-1.5 flex items-center gap-1.5">
                <Clock size={11} className="text-primary" />
                {isAr ? "رد خلال 1 يوم عمل" : "(Reply within 1 business day)"}
              </p>
              <p className="text-[10px] text-gray-300 font-bold">
                {isAr ? "الاثنين إلى الجمعة من 9 صباحاً إلى 5 مساءً" : "Monday to Friday 9 am to 5 pm"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-10 text-gray-600 font-medium text-[11px]">
          <div className="flex gap-4 mb-6 md:mb-0">
            <span dir="ltr">&copy; {new Date().getFullYear()} Wolf Techno. All Rights Reserved</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all duration-300">
                <Instagram size={17} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all duration-300">
                <Facebook size={17} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Router() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em]">
          Wolf Techno
        </p>
      </div>
    }>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchResults} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* Product Routes */}
        <Route path={"/products"} component={Products} />
        <Route path={"/products/:id"} component={ProductDetail} />

        {/* Category Browse Flow */}
        <Route path="/categories" component={CategoriesPage} />
        <Route path="/categories/:categorySlug" component={CategoryGroupsPage} />
        <Route path="/groups/:groupSlug" component={GroupProductsPage} />
        <Route path={"/gift-cards"}>
          <ProtectedRoute component={GiftCards} />
        </Route>

        <Route path={"/notifications"}>
          <ProtectedRoute component={Notifications} />
        </Route>

        <Route path={"/wallet"}>
          <ProtectedRoute component={WalletPage} />
        </Route>

        <Route path={"/orders"}>
          <ProtectedRoute component={Orders} />
        </Route>

        <Route path={"/orders/:id"}>
          <ProtectedRoute component={OrderDetails} />
        </Route>

        <Route path={"/wishlist"}>
          <ProtectedRoute component={Wishlist} />
        </Route>

        <Route path={"/cart"}>
          <ProtectedRoute component={Cart} />
        </Route>

        <Route path={"/checkout"}>
          <ProtectedRoute component={Checkout} />
        </Route>
        <Route path={"/checkout/success"}>
          <ProtectedRoute component={OrderSuccess} />
        </Route>
        <Route path={"/checkout/cancel"}>
          <ProtectedRoute component={Checkout} />
        </Route>

        {/* Admin Auth */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/register" component={AdminRegister} />
        <Route path="/wolf-techno-super-admin-auth" component={AdminLogin} />

        {/* Profile & Dashboard Routes */}
        <Route path="/admin-dashboard">
          <ProtectedRoute component={AdminDashboard} adminOnly />
        </Route>
        <Route path={"/profile"}>
          <ProtectedRoute component={Profile} />
        </Route>

        {/* Legal & Static Routes */}
        <Route path={"/privacy"} component={PrivacyPolicy} />
        <Route path={"/terms"} component={TermsOfService} />
        <Route path={"/returns"} component={ReturnPolicy} />
        <Route path={"/shipping"} component={ShippingPolicy} />
        <Route path={"/about-us"} component={AboutUs} />
        <Route path={"/contact-us"} component={ContactUs} />
        <Route path={"/faq"} component={FAQ} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { ChatProvider } from "./contexts/ChatContext";
import { ChatContainer } from "./components/chat/ChatContainer";

function App() {
  // const socket = useSocket(); // Socket is now managed in ChatContext
  const { user } = useAuth();
  // const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false); // MOVED TO CONTEXT

  // Centralized chat notifications

  const [location] = useLocation();
  const isHome = location === '/';

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Separated Content to use ChatContext
import { useChat } from "./contexts/ChatContext";

function AppContent() {
  const { isChatHistoryOpen, setIsChatHistoryOpen } = useChat();
  const { unreadCount } = useChatNotifications();
  const { unreadCount: systemUnreadCount } = useSystemNotifications();
  const { user } = useAuth();
  const { dir } = useLanguage();
  const [location] = useLocation();
  const isHome = location === '/';

  return (
    <div className="flex flex-col min-h-screen" dir={dir}>
      <ScrollToTop />
      <Toaster />
      <Navigation
        isChatHistoryOpen={isChatHistoryOpen}
        setIsChatHistoryOpen={setIsChatHistoryOpen}
        unreadCount={unreadCount}
        systemUnreadCount={systemUnreadCount}
      />
      <main className={`flex-1 page-content ${!HERO_PAGES.includes(location) ? (location.startsWith('/checkout') ? 'pt-0' : 'pt-24 md:pt-28') : ''}`}>
        <Router />
      </main>
      <Footer />

      <ChatHistory
        isOpen={isChatHistoryOpen}
        onOpenChange={setIsChatHistoryOpen}
      />

      <ChatContainer />

      {/* Floating Chat Button (Support Style) */}
      {user && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatHistoryOpen(true)}
          className="floating-chat-btn w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/20 flex items-center justify-center group transition-all hover:bg-primary/90"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
          <MessageSquare className="w-5 h-5 md:w-8 md:h-8 relative z-10" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-full bg-white text-primary text-[9px] md:text-[12px] font-black shadow-lg animate-bounce border-2 border-primary">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}

export default App;
