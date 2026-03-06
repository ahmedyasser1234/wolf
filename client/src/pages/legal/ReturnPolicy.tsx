import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { RefreshCcw, Clock, ShieldCheck, Box, Ban, ListChecks, Receipt, HelpCircle, CreditCard, AlertCircle, ShoppingBag, Truck, Info, Mail, MapPin } from "lucide-react";

interface Section {
    id: number;
    icon: any;
    titleEn: string;
    titleAr: string;
    contentEn: React.ReactNode;
    contentAr: React.ReactNode;
}

export default function ReturnPolicy() {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    const sections: Section[] = [
        {
            id: 1,
            icon: Clock,
            titleEn: "RETURNS",
            titleAr: "شروط الاسترجاع",
            contentEn: (
                <div className="space-y-4">
                    <p>Our policy lasts 14 days after you receive your order. If 14 days have gone by since you received your order, unfortunately we can’t offer you a refund or exchange.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>تستمر سياستنا لمدة 14 يوماً من تاريخ استلامك لطلبك. إذا مر 14 يوماً على استلامك للطلب، فللأسف لا يمكننا أن نقدم لك استرداداً للأموال أو استبدالاً.</p>
                </div>
            )
        },
        {
            id: 2,
            icon: ListChecks,
            titleEn: "ELIGIBILITY",
            titleAr: "أهلية الاسترجاع",
            contentEn: (
                <div className="space-y-4">
                    <p>To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.</p>
                    <p>To complete your return, we require a receipt or proof of purchase. Please do not send your purchase back to the manufacturer.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>لكي تكون مؤهلاً للاسترجاع، يجب أن يكون المنتج غير مستخدم وبنفس الحالة التي استلمته بها. كما يجب أن يكون في عبوته الأصلية.</p>
                    <p>لإكمال عملية الاسترجاع، نطلب إيصالاً أو إثباتاً للشراء. يرجى عدم إرسال مشترياتك إلى الشركة المصنعة.</p>
                </div>
            )
        },
        {
            id: 3,
            icon: Ban,
            titleEn: "EXEMPT GOODS",
            titleAr: "السلع المعفاة",
            contentEn: (
                <div className="space-y-4">
                    <p>Several types of goods are exempt from being returned. Perishable goods such as food, flowers, newspapers or magazines cannot be returned. We also do not accept products that are intimate or sanitary goods, hazardous materials, or flammable liquids or gases.</p>
                    <p>Additional non-returnable items:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Gift cards</li>
                        <li>Downloadable software products</li>
                        <li>Some health and personal care items</li>
                    </ul>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>هناك عدة أنواع من السلع المعفاة من الاسترجاع. لا يمكن إرجاع السلع القابلة للتلف مثل الأطعمة أو الزهور أو الصحف أو المجلات. كما لا نقبل المنتجات التي تندرج تحت فئة السلع الشخصية أو الصحية، أو المواد الخطرة، أو السوائل والغازات القابلة للاشتعال.</p>
                    <p>سلع إضافية غير قابلة للإرجاع:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>بطاقات الهدايا</li>
                        <li>منتجات البرمجيات القابلة للتحميل</li>
                        <li>بعض سلع العناية الصحية والشخصية</li>
                    </ul>
                </div>
            )
        },
        {
            id: 4,
            icon: AlertCircle,
            titleEn: "PARTIAL REFUNDS",
            titleAr: "استرداد جزئي (إن وجد)",
            contentEn: (
                <div className="space-y-4">
                    <p>There are certain situations where only partial refunds are granted (if applicable):</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Book with obvious signs of use</li>
                        <li>CD, DVD, VHS tape, software, video game, cassette tape, or vinyl record that has been opened.</li>
                        <li>Any item not in its original condition, is damaged or missing parts for reasons not due to our error.</li>
                        <li>Any item that is returned more than 14 days after delivery</li>
                    </ul>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>هناك حالات معينة يتم فيها منح استرداد جزئي للأموال فقط: (إن وجد)</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>كتب بها علامات استخدام واضحة</li>
                        <li>الوسائط المفتوحة (CD، DVD، VHS، برمجيات، ألعاب فيديو، كاسيت، أو فينيل)</li>
                        <li>أي منتج ليس في حالته الأصلية، أو تالف، أو تنقصه أجزاء لأسباب لا تعود لخطأ من جانبنا</li>
                        <li>أي منتج يتم إرجاعه بعد أكثر من 14 يوماً من التسليم</li>
                    </ul>
                </div>
            )
        },
        {
            id: 5,
            icon: CreditCard,
            titleEn: "REFUNDS PROCESS",
            titleAr: "عملية استرداد الأموال",
            contentEn: (
                <div className="space-y-4">
                    <p>Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.</p>
                    <p>If approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days (usually 10 business days).</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>بمجرد استلام المرتجع وفحصه، سنرسل إليك بريداً إلكترونياً لإخطارك باستلام المنتج المرتجع. سنخطرك أيضاً بالموافقة على استرداد الأموال أو رفضه.</p>
                    <p>وفي حالة الموافقة، ستتم معالجة المبلغ المسترد، وسيتم إضافة رصيد تلقائياً إلى بطاقة الائتمان الخاصة بك أو طريقة الدفع الأصلية، في غضون عدد معين من الأيام (عادةً 10 أيام عمل).</p>
                </div>
            )
        },
        {
            id: 6,
            icon: HelpCircle,
            titleEn: "LATE OR MISSING REFUNDS",
            titleAr: "المبالغ المستردة المتأخرة أو المفقودة",
            contentEn: (
                <div className="space-y-4">
                    <p>If you haven’t received a refund yet, first check your bank account again.</p>
                    <p>Then contact your credit card company, it may take some time before your refund is officially posted.</p>
                    <p>Next contact your bank. There is often some processing time before a refund is posted.</p>
                    <p>If you’ve done all of this and you still have not received your refund yet, please contact us at returns@wolftechno.com.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>إذا لم تستلم مبلغاً مسترداً بعد، فتحقق أولاً من حسابك المصرفي مرة أخرى.</p>
                    <p>ثم اتصل بشركة بطاقة الائتمان الخاصة بك، فقد يستغرق الأمر بعض الوقت قبل أن يتم تسجيل المبلغ المسترد رسمياً.</p>
                    <p>بعد ذلك، اتصل بالبنك الذي تتعامل معه، فغالباً ما يكون هناك بعض وقت المعالجة قبل تسجيل المبلغ.</p>
                    <p>إذا فعلت كل هذا ولا تزال لم تستلم المبلغ المسترد، فيرجى الاتصال بنا على returns@wolftechno.com.</p>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="container mx-auto px-4 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-gray-100 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-[#0A0A0A] p-12 text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                <RefreshCcw size={40} />
                            </div>
                            <div className={isAr ? 'text-right' : 'text-left'}>
                                <h1 className="text-4xl md:text-5xl font-black mb-4">
                                    {isAr ? 'سياسة الاسترجاع' : 'Return Policy'}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-gray-400 font-bold text-sm">
                                    <span className="flex items-center gap-2">
                                        <Info size={16} />
                                        {isAr ? 'آخر تحديث: 1 مارس 2026' : 'Last Updated: March 1, 2026'}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span>{isAr ? 'منصة ولف تكنو' : 'Wolf Techno Platform'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Summary Section */}
                        <div className="mb-16 p-8 bg-gray-50 rounded-3xl border border-gray-100 flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 mb-4">
                                    {isAr ? 'ملخص السياسة' : 'POLICY SUMMARY'}
                                </h2>
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base font-medium">
                                    {isAr
                                        ? "نحن نسعى جاهدين لضمان رضاكم التام عن مشترياتكم. ولف تكنو تابعة للأنشطة التجارية المصرح بها وتحت ترخيص شركة Wolf SMM F.Z.E وهي شركة مسجلة من قبل سلطة منطقة عجمان الحرة. إذا لم تكونوا راضين تماماً، فنحن هنا للمساعدة."
                                        : "We strive to ensure your complete satisfaction. WOLF TECHNO is a commercial activity operating under the license of Wolf SMM F.Z.E, a company registered by the Ajman Free Zone Authority. If you are not entirely satisfied, we are here to help."}
                                </p>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 gap-12">
                            {sections.map((section) => (
                                <section key={section.id} className="scroll-mt-24">
                                    <div className="flex items-center gap-4 mb-6 group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center transition-transform group-hover:scale-110">
                                            <section.icon size={20} />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                                            {isAr ? section.titleAr : section.titleEn}
                                        </h3>
                                    </div>
                                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 hover:border-primary/20 transition-colors">
                                        <div className="text-gray-600 leading-relaxed text-sm md:text-base font-medium">
                                            {isAr ? section.contentAr : section.contentEn}
                                        </div>
                                    </div>
                                </section>
                            ))}
                        </div>

                        {/* Return Address Section */}
                        <div className="mt-16 p-8 bg-gray-900 rounded-3xl text-white">
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black">{isAr ? 'عنوان الاسترجاع' : 'Return Address'}</h3>
                                        <p className="text-gray-400 text-sm">Ajman Free Zone - Boulevard Tower A, Ajman, UAE</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black">{isAr ? 'الدعم الفني' : 'Refund Support'}</h3>
                                        <p className="text-primary font-black">returns@wolftechno.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
