import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const [location, setLocation] = useLocation();
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] -white/5 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-50 rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="container mx-auto px-4 max-w-2xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="relative inline-block">
            <span className="text-[12rem] font-black leading-none text-gray-900/5 select-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 -primary rounded-[2.5rem] rotate-12 flex items-center justify-center shadow-2xl -primary/20">
                <AlertCircle size={64} className="text-white -rotate-12" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            {language === 'ar' ? "عذراً، هذه الصفحة مفقودة" : "Oops! Page Not Found"}
          </h1>

          <p className="text-xl text-slate-500 font-bold mb-12 max-w-md mx-auto leading-relaxed">
            {language === 'ar'
              ? "يبدو أنكِ سلكتِ طريقاً غير موجود، ربما تم نقل المنتج أو حذف الصفحة."
              : "It seems you've taken a wrong turn. The page or product might have been moved or deleted."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="-primary hover:-primary text-white rounded-full px-10 h-16 text-xl font-black shadow-xl -white/10 flex items-center gap-3">
                <Home size={24} />
                {t('backToHome')}
              </Button>
            </Link>

            <Link href="/products">
              <Button variant="outline" className="rounded-full px-10 h-16 text-xl font-black border-2 border-gray-100 hover:bg-gray-50 flex items-center gap-3">
                {language === 'ar' ? "تسوقي الآن" : "Shop Now"}
                <ArrowRight size={24} className={language === 'ar' ? 'rotate-180' : ''} />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-slate-400 font-medium"
        >
          {language === 'ar' ? "هل تحتاجين للمساعدة؟" : "Need help?"}
          <Link href="/contact-us">
            <span className="-primary mr-2 cursor-pointer hover:underline">{t('contact')}</span>
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
