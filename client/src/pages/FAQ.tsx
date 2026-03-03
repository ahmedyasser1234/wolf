import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { useState } from "react";

export default function FAQ() {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    const faqs = [
        {
            q: isAr ? "ما هي مدة الضمان على الأجهزة؟" : "What is the warranty period for devices?",
            a: isAr
                ? "جميع أجهزتنا تأتي بضمان محلي ودولي لمدة ١٢ شهر على الأقل ضد عيوب الصناعة."
                : "All our devices come with a local and international warranty of at least 12 months against manufacturing defects."
        },
        {
            q: isAr ? "هل تتوفر خدمة الدفع بالتقسيط؟" : "Is installment payment available?",
            a: isAr
                ? "نعم، نوفر خيارات دفع مرنة بالتعاون مع شركاء التقسيط، يمكنك اختيار 'تقسيط WOLF' عند إتمام الدفع."
                : "Yes, we provide flexible payment options in cooperation with installment partners. You can choose 'WOLF TECHNO Installments' at checkout."
        },
        {
            q: isAr ? "كيف يمكنني تتبع طلبي؟" : "How can I track my order?",
            a: isAr
                ? "بمجرد شحن طلبك، ستصلك رسالة نصية وبريد إلكتروني يحتوي على رابط التتبع الخاص بكلم."
                : "Once your order is shipped, you will receive a text message and an email containing your tracking link."
        },
        {
            q: isAr ? "كم يستغرق التوصيل؟" : "How long does delivery take?",
            a: isAr
                ? "يستغرق التوصيل عادةً من ٣ إلى ٧ أيام عمل داخل الدولة، حسب موقعك وشركة الشحن."
                : "Delivery usually takes 3 to 7 business days within the country, depending on your location and the shipping company."
        }
    ];

    return (
        <div className="min-h-screen bg-white pt-32 pb-20" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="container mx-auto px-4 max-w-3xl">
                <header className="text-center mb-16">
                    <div className="w-20 h-20 -white/5 rounded-3xl flex items-center justify-center -primary mx-auto mb-6">
                        <HelpCircle size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                        {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                    </h1>
                    <p className="text-gray-500 text-lg font-bold">
                        {isAr ? 'كل ما تود معرفته عن رحلة تسوقك في WOLF TECHNO' : 'Everything you need to know about your shopping journey at WOLF TECHNO'}
                    </p>
                </header>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`border rounded-[2rem] transition-all duration-300 ${isOpen ? '-primary/20 -white/5/20 shadow-lg -white/10' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-8 py-6 flex items-center justify-between text-right"
            >
                <span className="text-lg font-black text-gray-900">{question}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? '-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-8 pb-8 text-gray-600 font-bold leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
