import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { Shield, Lock, Eye, FileText, Database, Search, Share2, Target, ShieldAlert, UserCheck, History, UserMinus, RefreshCcw, Mail, Info } from "lucide-react";

interface Section {
    id: number;
    icon: any;
    titleEn: string;
    titleAr: string;
    contentEn: React.ReactNode;
    contentAr: React.ReactNode;
}

export default function PrivacyPolicy() {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    const sections: Section[] = [
        {
            id: 1,
            icon: Database,
            titleEn: "PERSONAL INFORMATION WE COLLECT",
            titleAr: "المعلومات الشخصية التي نجمعها",
            contentEn: (
                <div className="space-y-4">
                    <p>When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.</p>
                    <p>Additionally, as you browse the Site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the Site, and information about how you interact with the Site. We refer to this automatically-collected information as “Device Information.”</p>
                    <p>Additionally when you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information (including credit card numbers), email address, and phone number. We refer to this information as “Order Information.”</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>عند زيارتك للموقع، نقوم تلقائياً بجمع معلومات معينة حول جهازك، بما في ذلك معلومات حول متصفح الويب الخاص بك، وعنوان IP، والمنطقة الزمنية، وبعض ملفات تعريف الارتباط المثبتة على جهازك.</p>
                    <p>بالإضافة إلى ذلك، أثناء تصفحك للموقع، نجمع معلومات حول صفحات الويب الفردية أو المنتجات التي تشاهدها، والمواقع الإلكترونية أو مصطلحات البحث التي أحالتك إلى الموقع، ومعلومات حول كيفية تفاعلك مع الموقع. نشير إلى هذه المعلومات التي يتم جمعها تلقائياً باسم "معلومات الجهاز".</p>
                    <p>بالإضافة إلى ذلك، عندما تقوم بعملية شراء أو تحاول إجراء عملية شراء عبر الموقع، فإننا نجمع معلومات معينة منك، بما في ذلك اسمك وعنوان الفواتير وعنوان الشحن ومعلومات الدفع (بما في ذلك أرقام بطاقات الائتمان) وعنوان البريد الإلكتروني ورقم الهاتف. نشير إلى هذه المعلومات باسم "معلومات الطلب".</p>
                </div>
            )
        },
        {
            id: 2,
            icon: Search,
            titleEn: "HOW DO WE USE YOUR PERSONAL INFORMATION?",
            titleAr: "كيف نستخدم معلوماتك الشخصية؟",
            contentEn: (
                <div className="space-y-4">
                    <p>We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Communicate with you;</li>
                        <li>Screen our orders for potential risk or fraud; and</li>
                        <li>Provide you with information or advertising relating to our products or services based on your preferences.</li>
                    </ul>
                    <p>We use the Device Information (in particular, your IP address) to help us screen for potential risk and fraud, and more generally to improve and optimize our Site.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحن نستخدم معلومات الطلب التي نجمعها بشكل عام لتنفيذ أي طلبات يتم تقديمها عبر الموقع (بما في ذلك معالجة معلومات الدفع الخاصة بك، وترتيب الشحن، وتزويدك بالفواتير و/أو تأكيدات الطلب). بالإضافة إلى ذلك، نستخدم معلومات الطلب هذه من أجل:</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li>التواصل معك؛</li>
                        <li>فحص طلباتنا بحثاً عن المخاطر المحتملة أو الاحتيال؛</li>
                        <li>تزويدك بالمعلومات أو الإعلانات المتعلقة بمنتجاتنا أو خدماتنا بما يتماشى مع التفضيلات التي شاركتها معنا.</li>
                    </ul>
                    <p>نستخدم معلومات الجهاز (وبشكل خاص عنوان IP الخاص بك) لمساعدتنا في فحص المخاطر والاحتيال المحتمل، وبشكل عام لتحسين موقعنا وتحسينه.</p>
                </div>
            )
        },
        {
            id: 3,
            icon: Share2,
            titleEn: "SHARING YOUR PERSONAL INFORMATION",
            titleAr: "مشاركة معلوماتك الشخصية",
            contentEn: (
                <div className="space-y-4">
                    <p>We share your Personal Information with third parties to help us use your Personal Information, as described above. We also use Google Analytics to help us understand how our customers use the Site.</p>
                    <p>Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحن نشارك معلوماتك الشخصية مع أطراف ثالثة لمساعدتنا في استخدام معلوماتك الشخصية، كما هو موضح أعلاه. نستخدم أيضاً Google Analytics لمساعدتنا في فهم كيفية استخدام عملائنا للموقع.</p>
                    <p>أخيراً، يجوز لنا أيضاً مشاركة معلوماتك الشخصية للامتثال للقوانين واللوائح المعمول بها، أو للرد على مذكرة استدعاء أو أمر تفتيش أو أي طلب قانوني آخر للمعلومات نتلقاه، أو لحماية حقوقنا بطريقة أخرى.</p>
                </div>
            )
        },
        {
            id: 4,
            icon: Target,
            titleEn: "BEHAVIOURAL ADVERTISING",
            titleAr: "الإعلانات السلوكية",
            contentEn: (
                <div className="space-y-4">
                    <p>We use your Personal Information to provide you with targeted advertisements or marketing communications we believe may be of interest to you.</p>
                    <p>You can opt out of targeted advertising through Facebook, Google, and Bing settings, or by visiting the Digital Advertising Alliance’s opt-out portal.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحن نستخدم معلوماتك الشخصية لتزويدك بإعلانات مستهدفة أو اتصالات تسويقية نعتقد أنها قد تهمك.</p>
                    <p>يمكنك إلغاء الاشتراك في الإعلانات المستهدفة من خلال إعدادات Facebook و Google و Bing، أو من خلال زيارة بوابة إلغاء الاشتراك الخاصة بـ Digital Advertising Alliance.</p>
                </div>
            )
        },
        {
            id: 5,
            icon: ShieldAlert,
            titleEn: "DO NOT TRACK",
            titleAr: "عدم التتبع",
            contentEn: (
                <div className="space-y-4">
                    <p>Please note that we do not alter our Site’s data collection and use practices when we see a Do Not Track signal from your browser.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>يرجى ملاحظة أننا لا نغير أمارسات جمع البيانات واستخدامها في موقعنا عندما نرى إشارة "عدم التتبع" من متصفحك.</p>
                </div>
            )
        },
        {
            id: 6,
            icon: UserCheck,
            titleEn: "YOUR RIGHTS",
            titleAr: "حقوقك",
            contentEn: (
                <div className="space-y-4">
                    <p>If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us.</p>
                    <p>Additionally, we note that we are processing your information in order to fulfill contracts we might have with you (for example if you make an order through the Site).</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>إذا كنت مقيماً في أوروبا، فلديك الحق في الوصول إلى المعلومات الشخصية التي نحتفظ بها عنك والمطالبة بتصحيح معلوماتك الشخصية أو تحديثها أو حذفها. إذا كنت ترغب في ممارسة هذا الحق، يرجى الاتصال بنا.</p>
                    <p>بالإضافة إلى ذلك، نلاحظ أننا نعالج معلوماتك من أجل الوفاء بالعقود التي قد نبرمها معك (على سبيل المثال إذا قمت بتقديم طلب عبر الموقع).</p>
                </div>
            )
        },
        {
            id: 7,
            icon: History,
            titleEn: "DATA RETENTION",
            titleAr: "الاحتفاظ بالبيانات",
            contentEn: (
                <div className="space-y-4">
                    <p>When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>عندما تطلب عبر الموقع، سنحتفظ بمعلومات طلبك في سجلاتنا ما لم تطلب منا حذف هذه المعلومات.</p>
                </div>
            )
        },
        {
            id: 8,
            icon: UserMinus,
            titleEn: "MINORS",
            titleAr: "القصر",
            contentEn: (
                <div className="space-y-4">
                    <p>The Site is not intended for individuals under the age of 18.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>الموقع غير مخصص للأفراد الذين تقل أعمارهم عن 18 عاماً.</p>
                </div>
            )
        },
        {
            id: 9,
            icon: RefreshCcw,
            titleEn: "CHANGES",
            titleAr: "التغييرات",
            contentEn: (
                <div className="space-y-4">
                    <p>We may update this privacy policy from time to time in order to reflect changes to our practices or for other operational, legal or regulatory reasons.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لتعكس، على سبيل المثال، التغييرات في ممارساتنا أو لأسباب تشغيلية أو قانونية أو تنظيمية أخرى.</p>
                </div>
            )
        },
        {
            id: 10,
            icon: Mail,
            titleEn: "CONTACT US",
            titleAr: "اتصل بنا",
            contentEn: (
                <div className="space-y-4">
                    <p>For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at legal@wolftechno.com.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>لمزيد من المعلومات حول ممارسات الخصوصية لدينا، أو إذا كانت لديك أسئلة، أو إذا كنت ترغب في تقديم شكوى، يرجى الاتصال بنا عبر البريد الإلكتروني على legal@wolftechno.com.</p>
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
                                <Shield size={40} />
                            </div>
                            <div className={isAr ? 'text-right' : 'text-left'}>
                                <h1 className="text-4xl md:text-5xl font-black mb-4">
                                    {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
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
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                    </div>

                    <div className="p-8 md:p-12">
                        {/* Overview Section */}
                        <div className="mb-16 p-8 bg-gray-50 rounded-3xl border border-gray-100 flex gap-6 items-start">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Eye size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 mb-4">
                                    {isAr ? 'نظرة عامة' : 'OVERVIEW'}
                                </h2>
                                <div className="text-gray-600 leading-relaxed space-y-4 text-sm md:text-base font-medium">
                                    <p>
                                        {isAr
                                            ? "تصف سياسة الخصوصية هذه كيفية جمع معلوماتك الشخصية واستخدامها ومشاركتها عند زيارتك للموقع أو إجراء عملية شراء من www.wolftechno.com. ولف تكنو تابعة للأنشطة التجارية المصرح بها وتحت ترخيص شركة Wolf SMM F.Z.E وهي شركة مسجلة من قبل سلطة منطقة عجمان الحرة."
                                            : "This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from www.wolftechno.com. WOLF TECHNO is a commercial activity operating under the license of Wolf SMM F.Z.E, a company registered by the Ajman Free Zone Authority."}
                                    </p>
                                    <p>
                                        {isAr
                                            ? "نحن نلتزم بحماية خصوصيتك وضمان أمان بياناتك أثناء استخدام منصتنا."
                                            : "We are committed to protecting your privacy and ensuring the security of your data while using our platform."}
                                    </p>
                                </div>
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

                        {/* Footer Note */}
                        <div className="mt-16 pt-12 border-t border-gray-100 text-center">
                            <p className="text-gray-400 text-sm font-bold">
                                {isAr
                                    ? "خصوصيتك هي أولويتنا في ولف تكنو."
                                    : "Your privacy is our priority at Wolf Techno."}
                            </p>
                            <p className="text-primary font-black mt-2">legal@wolftechno.com</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
