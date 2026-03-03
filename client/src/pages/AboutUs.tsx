import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function AboutUs() {
    const { language } = useLanguage();

    return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
            {/* Hero Section */}
            <section className="relative h-[60vh] overflow-hidden flex items-center justify-center bg-black">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=900&fit=crop"
                        className="w-full h-full object-cover object-center opacity-60"
                        alt="Wolf Techno Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex flex-col items-center space-y-6">
                            <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md mb-6 border-white/30 px-6 py-2 text-sm font-bold uppercase tracking-[0.2em]">
                                {language === 'ar' ? "قصتنا" : "Our Story"}
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                                {language === 'ar' ? "حيث تلتقي التقنية" : "Where Technology"} <br />
                                <span className="text-yellow-400">{language === 'ar' ? "بالفخامة الحقيقية" : "Meets True Luxury"}</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-bold">
                                {language === 'ar'
                                    ? "رحلة في عالم التكنولوجيا الفاخرة، نجمع فيها أفضل الأجهزة العالمية لنمنحك تجربة تقنية لا مثيل لها."
                                    : "A journey into the world of premium technology, bringing together the best global devices to give you an unparalleled tech experience."}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="container mx-auto px-4 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Text Content */}
                    <motion.div
                        className="bg-white p-10 md:p-14 rounded-[3rem] shadow-xl border border-gray-100"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 leading-tight">
                            {language === 'ar' ? "Wolf Techno: رؤية جديدة للتقنية الفاخرة" : "Wolf Techno: A New Vision of Premium Tech"}
                        </h2>
                        <div className="space-y-6 text-gray-500 text-lg leading-relaxed font-medium text-justify" dir={language === 'ar' ? "rtl" : "ltr"}>
                            <p>
                                {language === 'ar'
                                    ? "منذ تأسيسنا، ونحن نؤمن بأن التقنية الفاخرة ليست مجرد أجهزة، بل هي تجربة متكاملة تعبّر عن أسلوب حياة متطور. في Wolf Techno، نجمع بين أحدث الابتكارات التكنولوجية وأرقى معايير الجودة."
                                    : "Since our founding, we have believed that premium technology is not just about devices — it's a complete experience that reflects a sophisticated lifestyle. At Wolf Techno, we combine the latest tech innovations with the highest quality standards."}
                            </p>
                            <p>
                                {language === 'ar'
                                    ? "فريقنا من الخبراء التقنيين يعمل بشغف لاختيار أفضل الأجهزة من أبرز العلامات العالمية، مع توفير خدمة عملاء استثنائية وخيارات دفع مرنة بالتقسيط."
                                    : "Our team of tech experts works passionately to select the best devices from top global brands, while providing exceptional customer service and flexible installment payment options."}
                            </p>
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { icon: Sparkles, textAr: "أجهزة حصرية", textEn: "Exclusive Devices" },
                                { icon: ShieldCheck, textAr: "ضمان رسمي", textEn: "Official Warranty" },
                                { icon: CheckCircle2, textAr: "جودة مضمونة", textEn: "Guaranteed Quality" },
                                { icon: Zap, textAr: "تقسيط بدون فوائد", textEn: "0% Installments" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                        <item.icon size={20} />
                                    </div>
                                    <span className="font-bold text-gray-800">{language === 'ar' ? item.textAr : item.textEn}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        className="grid grid-cols-2 gap-6"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="space-y-6 mt-12">
                            <img
                                src="https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&h=800&fit=crop"
                                className="w-full aspect-[3/4] object-cover rounded-[2.5rem] shadow-lg hover:scale-[1.02] transition-transform duration-500"
                                alt="Tech Device"
                            />
                            <div className="bg-yellow-400 p-8 rounded-[2.5rem] text-black text-center shadow-lg">
                                <span className="block text-4xl font-black mb-1">+50</span>
                                <span className="text-sm font-bold">{language === 'ar' ? "علامة تجارية عالمية" : "Global Brands"}</span>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white text-center shadow-xl">
                                <span className="block text-4xl font-black mb-1">10K+</span>
                                <span className="text-sm font-bold opacity-90">{language === 'ar' ? "عميل سعيد" : "Happy Clients"}</span>
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=800&fit=crop"
                                className="w-full aspect-[3/4] object-cover rounded-[2.5rem] shadow-lg hover:scale-[1.02] transition-transform duration-500"
                                alt="Tech Store"
                            />
                        </div>
                    </motion.div>

                </div>
            </section>
        </div>
    );
}
