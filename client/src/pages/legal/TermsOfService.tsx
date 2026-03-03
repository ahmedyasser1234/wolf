import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { FileSignature, ShieldCheck, Scale, Info, ShoppingCart, CreditCard, ExternalLink, MessageSquare, UserCheck, AlertTriangle, FileText, HelpCircle, Lock, Ban, HeartHandshake, Gavel } from "lucide-react";

interface Section {
    id: number;
    icon: any;
    titleEn: string;
    titleAr: string;
    contentEn: React.ReactNode;
    contentAr: React.ReactNode;
}

export default function TermsOfService() {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    const sections: Section[] = [
        {
            id: 1,
            icon: ShoppingCart,
            titleEn: "SECTION 1 – ONLINE STORE TERMS",
            titleAr: "القسم 1 - شروط المتجر الإلكتروني",
            contentEn: (
                <div className="space-y-4">
                    <p>You agree not to use the Platform:</p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>to purchase any Product where payment of the Purchase Price to us will, or is likely to, cause you any financial hardship;</li>
                        <li>for any unlawful, fraudulent or improper purpose;</li>
                        <li>in any manner which does, or may, damage, disable, overburden or otherwise impair the Platform or interfere with any other person’s use and enjoyment of the Platform;</li>
                        <li>to introduce any harmful information or materials (which includes any spyware, viruses, worms, trojan horses, harmful scripts or codes);</li>
                        <li>if you are aware your computer or mobile device has such harmful information or materials installed on it.</li>
                    </ol>
                    <p>You represent and warrant that you are 18 years of age or older and the information you provide is true and accurate.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>توافق على عدم استخدام المنصة:</p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>لشراء أي منتج حيث سيؤدي دفع ثمن الشراء لنا، أو يحتمل أن يؤدي، إلى وقوعك في أي ضائقة مالية؛</li>
                        <li>لأي غرض غير قانوني أو احتيالي أو غير لائق؛</li>
                        <li>بأي طريقة تؤدي، أو قد تؤدي، إلى إتلاف أو تعطيل أو إثقال كاهل المنصة أو التأثير على استخدام أي شخص آخر للمنصة واستمتاعه بها؛</li>
                        <li>لإدخال أي معلومات أو مواد ضارة (والتي تشمل أي برامج تجسس، أو فيروسات، أو ديدان، أو أحصنة طروادة، أو نصوص أو أكواد ضارة)؛</li>
                        <li>إذا كنت تدرك أن جهاز الكمبيوتر أو الجهاز المحمول الخاص بك مثبت عليه مثل هذه المعلومات أو المواد الضارة.</li>
                    </ol>
                    <p>أنت تقر وتضمن أن عمرك 18 عاماً أو أكثر وأن المعلومات التي تقدمها لنا صحيحة ودقيقة.</p>
                </div>
            )
        },
        {
            id: 2,
            icon: ShieldCheck,
            titleEn: "SECTION 2 – GENERAL CONDITIONS",
            titleAr: "القسم 2 - الشروط العامة",
            contentEn: (
                <div className="space-y-4">
                    <p>We reserve the right to refuse service to anyone for any reason at any time. We reserve the right to cancel any order or payment plan at any time without notice.</p>
                    <p>Your content (excluding credit card info) may be transferred unencrypted over various networks. Credit card information is always encrypted during transfer.</p>
                    <p>You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service without express written permission by us.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحتفظ بالحق في رفض الخدمة لأي شخص ولأي سبب وفي أي وقت. كما نحتفظ بالحق في إلغاء أي طلب أو خطة دفع في أي وقت دون إشعار مسبق.</p>
                    <p>أنت تدرك أن المحتوى الخاص بك (باستثناء معلومات بطاقة الائتمان) قد يتم نقله غير مشفر عبر شبكات مختلفة. يتم دائماً تشفير معلومات بطاقة الائتمان أثناء النقل.</p>
                    <p>توافق على عدم إعادة إنتاج أو تكرار أو نسخ أو بيع أو إعادة بيع أو استغلال أي جزء من الخدمة دون إذن كتابي صريح منا.</p>
                </div>
            )
        },
        {
            id: 3,
            icon: FileText,
            titleEn: "SECTION 3 – ACCURACY, COMPLETENESS AND TIMELINESS OF INFORMATION",
            titleAr: "القسم 3 - دقة واكتمال وتوقيت المعلومات",
            contentEn: (
                <div className="space-y-4">
                    <p>We are not responsible if information on this site is not accurate, complete or current. The material is for general information only and should not be relied upon as the sole basis for decisions.</p>
                    <p>We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information. It is your responsibility to monitor changes.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحن لسنا مسؤولين إذا كانت المعلومات المتوفرة على هذا الموقع غير دقيقة أو كاملة أو حديثة. يتم توفير المواد الموجودة على هذا الموقع للمعلومات العامة فقط ولا ينبغي الاعتماد عليها أو استخدامها كأساس وحيد لاتخاذ القرارات.</p>
                    <p>نحتفظ بالحق في تعديل محتويات هذا الموقع في أي وقت، ولكن ليس لدينا أي التزام بتحديث أي معلومات. تقع على عاتقك مسؤولية مراقبة التغييرات في موقعنا.</p>
                </div>
            )
        },
        {
            id: 4,
            icon: Scale,
            titleEn: "SECTION 4 – MODIFICATIONS TO THE SERVICE AND PRICES",
            titleAr: "القسم 4 - تعديلات الخدمة والأسعار",
            contentEn: (
                <div className="space-y-4">
                    <p>Prices for our products are subject to change without notice. We reserve the right to modify or discontinue the Service (or any part or content thereof) without notice at any time.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>أسعار منتجاتنا عرضة للتغيير دون إشعار مسبق. ونحتفظ بالحق في تعديل الخدمة أو إيقافها في أي وقت (أو أي جزء أو محتوى منها) دون إشعار وفي أي وقت.</p>
                </div>
            )
        },
        {
            id: 5,
            icon: ShoppingCart,
            titleEn: "SECTION 5 – PRODUCTS OR SERVICES",
            titleAr: "القسم 5 - المنتجات أو الخدمات",
            contentEn: (
                <div className="space-y-4">
                    <p>Certain products or services may be available exclusively online. Prices and descriptions are subject to change without notice. We reserve the right to limit the sales of our products to any person or region.</p>
                    <p>We do not warrant that the quality of any products or services will meet your expectations or that errors will be corrected.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>قد تتوفر بعض المنتجات أو الخدمات حصرياً عبر الإنترنت من خلال الموقع الإلكتروني. تخضع جميع أوصاف المنتجات أو أسعارها للتغيير في أي وقت دون إشعار. ونحتفظ بالحق في تحديد مبيعات منتجاتنا لأي شخص أو منطقة جغرافية.</p>
                    <p>نحن لا نضمن أن جودة أي منتجات أو خدمات أو معلومات أو مواد أخرى مشتراه ستلبي توقعاتك، أو أنه سيتم تصحيح أي أخطاء في الخدمة.</p>
                </div>
            )
        },
        {
            id: 6,
            icon: UserCheck,
            titleEn: "SECTION 6 – ACCURACY OF BILLING AND ACCOUNT INFORMATION",
            titleAr: "القسم 6 - دقة فواتير ومعلومات الحساب",
            contentEn: (
                <div className="space-y-4">
                    <p>We reserve the right to refuse any order. We define "Account Information" as your full name, email address, mobile number, billing/shipping address, Emirates ID, and payment details.</p>
                    <p>You agree to provide current, complete and accurate info and update it promptly so we can complete your transactions.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحتفظ بالحق في رفض أي طلب تقدمه لنا. نحن نعرف "معلومات الحساب" على أنها اسمك الكامل، وعنوان بريدك الإلكتروني، ورقم هاتفك المحمول، وعنوان الفواتير، وعنوان الشحن، والهوية الإماراتية، ومعلومات بطاقة الخصم/الائتمان.</p>
                    <p>أنت توافق على تقديم معلومات شراء وحساب حديثة وكاملة ودقيقة في جميع الأوقات وتحديثها على الفور حتى نتمكن من إكمال معاملاتك والاتصال بك عند الحاجة.</p>
                </div>
            )
        },
        {
            id: 7,
            icon: CreditCard,
            titleEn: "SECTION 7 – ORDERS & PAYMENT PLANS",
            titleAr: "القسم 7 - الطلبات وخطط الدفع",
            contentEn: (
                <div className="space-y-4">
                    <p>Each purchase is subject to approval. You will not be charged any interest. You grant us authority to charge your card for all amounts owed.</p>
                    <p>Products remain our property until full payment. If you fail to pay an installment within 24 hours of its due date, you will be in default and previous payments will not be reimbursed.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>تخضع كل عملية شراء لموافقتنا. لن يتم تحصيل أي فائدة منك على المبالغ المستحقة. تمنحنا السلطة لخصم جميع المبالغ المستحقة عليك من بطاقتك.</p>
                    <p>ستظل المنتجات ملكية قانونية لنا حتى يتم دفع ثمن الشراء بالكامل. إذا فشلت في سداد القسط خلال 24 ساعة من تاريخ استحقاقه، فسيتم اعتبارك متخلفاً عن السداد ولن يتم استرداد أي مبالغ دفعتها مسبقاً.</p>
                </div>
            )
        },
        {
            id: 8,
            icon: ExternalLink,
            titleEn: "SECTION 8 – THIRD-PARTY LINKS",
            titleAr: "القسم 8 - روابط الأطراف الثالثة",
            contentEn: (
                <div className="space-y-4">
                    <p>We are not responsible for examining the content or accuracy and we do not warrant any third-party materials or websites. Complaints regarding third-party products should be directed to the third-party.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحن لسنا مسؤولين عن فحص أو تقييم المحتوى أو الدقة ولا نضمن ولن نتحمل أي مسؤولية عن أي مواد أو مواقع تابعة لأطراف ثالثة. يجب توجيه الشكاوى المتعلقة بمنتجات الأطراف الثالثة إلى الطرف الثالث المعني.</p>
                </div>
            )
        },
        {
            id: 9,
            icon: MessageSquare,
            titleEn: "SECTION 9 – USER COMMENTS, FEEDBACK AND OTHER SUBMISSIONS",
            titleAr: "القسم 9 - تعليقات المستخدمين والمشاركات الأخرى",
            contentEn: (
                <div className="space-y-4">
                    <p>We may edit, copy, publish, or use any comments you forward to us. We have no obligation to maintain comments in confidence or pay compensation.</p>
                    <p>You agree that your comments will not violate any right of any third-party or contain unlawful, abusive or obscene material.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>يجوز لنا تعديل أو نسخ أو نشر أو استخدام أي تعليقات ترسلها إلينا في أي وقت. نحن لسنا ملزمين بالحفاظ على سرية التعليقات أو دفع تعويض عنها.</p>
                    <p>أنت توافق على أن تعليقاتك لن تنتهك أي حق لأي طرف ثالث أو تحتوي على مواد غير قانونية أو مسيئة أو فاحشة.</p>
                </div>
            )
        },
        {
            id: 10,
            icon: Lock,
            titleEn: "SECTION 10 – PERSONAL INFORMATION",
            titleAr: "القسم 10 - المعلومات الشخصية",
            contentEn: (
                <div className="space-y-4">
                    <p>Your submission of personal information through the store is governed by our Privacy Policy.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>يخضع تقديمك للمعلومات الشخصية عبر المتجر لسياسة الخصوصية الخاصة بنا.</p>
                </div>
            )
        },
        {
            id: 11,
            icon: AlertTriangle,
            titleEn: "SECTION 11 – ERRORS, INACCURACIES AND OMISSIONS",
            titleAr: "القسم 11 - الأخطاء وعدم الدقة والسهو",
            contentEn: (
                <div className="space-y-4">
                    <p>We reserve the right to correct any errors and to change or update information or cancel orders if any info in the Service is inaccurate at any time without prior notice.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحتفظ بالحق في تصحيح أي أخطاء أو عدم دقة أو سهو، وتغيير أو تحديث المعلومات أو إلغاء الطلبات إذا كانت أي معلومات في الخدمة غير دقيقة في أي وقت دون إشعار مسبق.</p>
                </div>
            )
        },
        {
            id: 12,
            icon: Ban,
            titleEn: "SECTION 12 – PROHIBITED USES",
            titleAr: "القسم 12 - الاستخدامات المحظورة",
            contentEn: (
                <div className="space-y-4">
                    <p>You are prohibited from using the site for unlawful purposes, to violate laws, to infringe intellectual property, or to harass, defame, or disseminate viruses.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>يُحظر عليك استخدام الموقع لأي غرض غير قانوني، أو لانتهاك القوانين، أو انتهاك حقوق الملكية الفكرية، أو للمضايقة أو التشهير أو نشر الفيروسات.</p>
                </div>
            )
        },
        {
            id: 13,
            icon: AlertTriangle,
            titleEn: "SECTION 13 – DISCLAIMER OF WARRANTIES; LIMITATION OF LIABILITY",
            titleAr: "القسم 13 - إخلاء المسؤولية عن الضمانات؛ تحديد المسؤولية",
            contentEn: (
                <div className="space-y-4">
                    <p>We do not guarantee that your use of our service will be uninterrupted or error-free. The service and products are provided 'as is' without any warranties.</p>
                    <p>In no case shall Wolf Techno be liable for any injury, loss, or damages of any kind.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>نحن لا نضمن أن استخدامك لخدمتنا سيكون دون انقطاع أو خالياً من الأخطاء. يتم توفير الخدمة والمنتجات "كما هي" دون أي ضمانات.</p>
                    <p>لن تكون ولف تكنو تحت أي ظرف من الظروف مسؤولة عن أي إصابة أو خسارة أو أضرار من أي نوع.</p>
                </div>
            )
        },
        {
            id: 14,
            icon: ShieldCheck,
            titleEn: "SECTION 14 – INDEMNIFICATION",
            titleAr: "القسم 14 - التعويض",
            contentEn: (
                <div className="space-y-4">
                    <p>You agree to indemnify Wolf Techno and hold us harmless from any claim arising out of your breach of these Terms of Service.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>أنت توافق على تعويض ولف تكنو وإبراء ذمتنا من أي مطالبة تنشأ عن خرقك لشروط الخدمة هذه.</p>
                </div>
            )
        },
        {
            id: 15,
            icon: FileText,
            titleEn: "SECTION 15 – SEVERABILITY",
            titleAr: "القسم 15 - القابلية للفصل",
            contentEn: (
                <div className="space-y-4">
                    <p>If any provision is determined to be unlawful or void, such provision shall nonetheless be enforceable to the fullest extent permitted by law, and the unenforceable portion shall be deemed severed.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>في حالة تحديد أي حكم من شروط الخدمة هذه على أنه غير قانوني أو باطل، يكون هذا الحكم قابلاً للتنفيذ إلى أقصى حد يسمح به القانون المعمول به، ويعتبر الجزء غير القابل للتنفيذ مفصولاً.</p>
                </div>
            )
        },
        {
            id: 16,
            icon: Ban,
            titleEn: "SECTION 16 – TERMINATION",
            titleAr: "القسم 16 - الإنهاء",
            contentEn: (
                <div className="space-y-4">
                    <p>These Terms are effective unless and until terminated by either you or us. Obligations incurred prior to termination survive.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>تظل شروط الخدمة هذه فعالة ما لم يتم إنهاؤها من قبلك أو من قبلنا. تظل الالتزامات المتكبدة قبل تاريخ الإنهاء سارية.</p>
                </div>
            )
        },
        {
            id: 17,
            icon: HeartHandshake,
            titleEn: "SECTION 17 – ENTIRE AGREEMENT",
            titleAr: "القسم 17 - الاتفاقية الكاملة",
            contentEn: (
                <div className="space-y-4">
                    <p>These Terms constitute the entire agreement between you and us, superseding any prior agreements or proposals.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>تشكل هذه الشروط بالكامل الاتفاقية والتفاهم بينك وبيننا، وتحل محل أي اتفاقيات أو مقترحات سابقة.</p>
                </div>
            )
        },
        {
            id: 18,
            icon: Gavel,
            titleEn: "SECTION 18 – GOVERNING LAW",
            titleAr: "القسم 18 - القانون المعمول به",
            contentEn: (
                <div className="space-y-4">
                    <p>These Terms shall be governed by and construed in accordance with the laws of Ajman, United Arab Emirates.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>تخضع شروط الخدمة هذه وتفسر وفقاً لقوانين عجمان، الإمارات العربية المتحدة.</p>
                </div>
            )
        },
        {
            id: 19,
            icon: Info,
            titleEn: "SECTION 19 – CHANGES TO TERMS OF SERVICE",
            titleAr: "القسم 19 - التغييرات في شروط الخدمة",
            contentEn: (
                <div className="space-y-4">
                    <p>You can review the most current version at any time on this page. We reserve the right to update any part by posting updates to our website.</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>يمكنك مراجعة أحدث إصدار من شروط الخدمة في أي وقت في هذه الصفحة. ونحتفظ بالحق في تحديث أي جزء من هذه الشروط من خلال نشر التحديثات على موقعنا.</p>
                </div>
            )
        },
        {
            id: 20,
            icon: HelpCircle,
            titleEn: "SECTION 20 – CONTACT INFORMATION",
            titleAr: "القسم 20 - معلومات الاتصال",
            contentEn: (
                <div className="space-y-4">
                    <p>Questions about the Terms of Service should be sent to us at legal@wolftechno.com</p>
                </div>
            ),
            contentAr: (
                <div className="space-y-4">
                    <p>يجب إرسال الأسئلة المتعلقة بشروط الخدمة إلينا على legal@wolftechno.com</p>
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
                                <FileSignature size={40} />
                            </div>
                            <div className={isAr ? 'text-right' : 'text-left'}>
                                <h1 className="text-4xl md:text-5xl font-black mb-4">
                                    {isAr ? 'شروط الخدمة' : 'Terms of Service'}
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
                                <Info size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 mb-4">
                                    {isAr ? 'نظرة عامة' : 'OVERVIEW'}
                                </h2>
                                <div className="text-gray-600 leading-relaxed space-y-4 text-sm md:text-base font-medium">
                                    <p>
                                        {isAr
                                            ? "يتم تشغيل هذا الموقع وتطبيق الهاتف المحمول المصاحب له (المنصة) بواسطة WOLF TECHNO تابعة للأنشطة التجارية المصرح بها وتحت ترخيص شركة (( Wolf SMM F.Z.E )) وهي شركة مسجلة من قبل سلطة منطقة عجمان الحرة."
                                            : "This website and its accompanying mobile app (the Platform) is operated by WOLF TECHNO, a commercial activity operating under the license of Wolf SMM F.Z.E, a company registered by the Ajman Free Zone Authority."}
                                    </p>
                                    <p>
                                        {isAr
                                            ? "من خلال زيارة موقعنا و/أو شراء شيء منا، فإنك تشترك في \"خدمتنا\" وتوافق على الالتزام بالشروط والأحكام التالية."
                                            : "By visiting our site and/ or purchasing something from us, you engage in our “Service” and agree to be bound by the following terms and conditions (“Terms of Service”, “Terms”)."}
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
                                    ? "شكراً لاستخدامكم ولف تكنو. نحن ملتزمون بتقديم أفضل خدمة لكم."
                                    : "Thank you for using Wolf Techno. We are committed to providing you with the best service."}
                            </p>
                            <p className="text-primary font-black mt-2">legal@wolftechno.com</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
