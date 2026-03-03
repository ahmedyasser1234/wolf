import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function ContactUs() {
    const { language } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            toast.success(language === 'ar' ? "تم إرسال رسالتك بنجاح! سنرد عليك قريباً." : "Message sent successfully! We'll reply soon.");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pb-20">
            {/* Hero Section */}
            <section className="relative h-[60vh] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                        className="w-full h-full object-cover object-center"
                        alt="Contact Us Background"
                    />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex flex-col items-center space-y-6">
                            <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md mb-6 border-white/30 px-6 py-2 text-sm font-bold uppercase tracking-[0.2em]">
                                {language === 'ar' ? "تواصل معنا" : "Contact Us"}
                            </Badge>
                            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                                {language === 'ar' ? "نحن هنا لمساعدتك" : "We're Here to Help"}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed font-bold">
                                {language === 'ar'
                                    ? "لديك استفسار عن منتج معين أو تحتاج مساعدة تقنية؟ لا تتردد في التواصل معنا."
                                    : "Have a question about a specific product or need technical assistance? Don't hesitate to reach out."}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info Cards */}
                    <motion.div
                        className="space-y-6 lg:col-span-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 hover:shadow-2xl transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <MapPin size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{language === 'ar' ? "العنوان" : "Address"}</h3>
                            <p className="text-gray-500 font-medium">
                                {language === 'ar' ? "شارع الشيخ زايد، دبي، الإمارات العربية المتحدة" : "Sheikh Zayed Road, Dubai, UAE"}
                            </p>
                        </div>
                        ... (rest of the cards)

                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Phone size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{language === 'ar' ? "الهاتف" : "Phone"}</h3>
                            <p className="text-gray-500 font-medium" dir="ltr">+966 50 123 4567</p>
                            <p className="text-gray-400 text-sm mt-1">{language === 'ar' ? "متاح واتساب أيضاً" : "WhatsApp available"}</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{language === 'ar' ? "ساعات العمل" : "Working Hours"}</h3>
                            <p className="text-gray-500 font-medium">{language === 'ar' ? "يومياً من ١٠ صباحاً - ١٠ مساءً" : "Daily 10 AM - 10 PM"}</p>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-gray-100"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-2xl font-black text-gray-900 mb-8">{language === 'ar' ? "أرسلي رسالة" : "Send a Message"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{language === 'ar' ? "الاسم" : "Name"}</label>
                                    <Input required className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:-primary/40" placeholder={language === 'ar' ? "اسمك الكريم" : "Your Name"} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{language === 'ar' ? "البريد الإلكتروني" : "Email"}</label>
                                    <Input required type="email" className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:-primary/40" placeholder="example@email.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{language === 'ar' ? "الموضوع" : "Subject"}</label>
                                <Input required className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:-primary/40" placeholder={language === 'ar' ? "استفسار بخصوص..." : "Inquiry about..."} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">{language === 'ar' ? "الرسالة" : "Message"}</label>
                                <Textarea required className="min-h-[150px] rounded-2xl bg-gray-50 border-gray-200 focus:ring-primary/40 p-4" placeholder={language === 'ar' ? "اكتب رسالتك هنا..." : "Type your message here..."} />
                            </div>

                            <div className="pt-4 text-right">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-14 px-10 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20"
                                >
                                    {isSubmitting ? (language === 'ar' ? "جاري الإرسال..." : "Sending...") : (
                                        <>
                                            {language === 'ar' ? "إرسال الرسالة" : "Send Message"}
                                            <Send size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
