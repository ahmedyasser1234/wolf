import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/lib/i18n";
import { HelpCircle } from "lucide-react";

export function HomeFAQ() {
    const { language, t } = useLanguage();

    const faqs = [
        {
            qAr: "كم يستغرق الشحن والتوصيل؟",
            qEn: "How long does shipping take?",
            aAr: "يتم التوصيل داخل دبي خلال 24-48 ساعة، ولباقي مدن الإمارات خلال 3-5 أيام عمل. جميع الأجهزة مؤمّنة ومعبأة بعناية.",
            aEn: "Delivery within Dubai takes 24-48 hours, and 3-5 business days for other Emirates. All devices are insured and carefully packaged."
        },
        {
            qAr: "ما هو نظام التقسيط المتاح؟",
            qEn: "What installment options are available?",
            aAr: "نوفر تقسيطاً بدون فوائد لمدة 3 أو 6 أو 10 أشهر على جميع المنتجات. يمكنك اختيار الخطة الأنسب لك عند الدفع.",
            aEn: "We offer 0% interest installments for 3, 6, or 10 months on all products. Choose the plan that suits you best at checkout."
        },
        {
            qAr: "ما هو الضمان على الأجهزة؟",
            qEn: "What warranty is provided on devices?",
            aAr: "جميع الأجهزة تأتي بضمان رسمي من الشركة المصنعة لمدة سنة كاملة، مع إمكانية الصيانة والاستبدال في حالة الأعطال المصنعية.",
            aEn: "All devices come with an official manufacturer's warranty for one full year, with maintenance and replacement options for manufacturing defects."
        },
        {
            qAr: "ما هي طرق الدفع المتاحة؟",
            qEn: "What payment methods are available?",
            aAr: "نقبل الدفع عبر مدى، فيزا، ماستركارد، Apple Pay، بالإضافة لخيارات التقسيط بدون فوائد على 3 أو 6 أو 10 أشهر.",
            aEn: "We accept Mada, Visa, Mastercard, Apple Pay, plus 0% interest installments over 3, 6, or 10 months."
        }
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full -white/5 -primary mb-6">
                        <HelpCircle size={24} />
                    </span>
                    <h2 className="text-4xl font-black text-gray-900 mb-4">
                        {t('faqTitle')}
                    </h2>
                    <p className="text-gray-500 font-bold">
                        {t('faqDesc')}
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-4">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border border-gray-100 rounded-3xl px-6 bg-gray-50/50 data-[state=open]:bg-white data-[state=open]:shadow-xl transition-all duration-300">
                            <AccordionTrigger className="text-lg font-bold py-6 hover:no-underline text-gray-900">
                                {language === 'ar' ? faq.qAr : faq.qEn}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-500 text-base leading-relaxed pb-6 font-medium">
                                {language === 'ar' ? faq.aAr : faq.aEn}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
