import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";
import { Calendar, Phone } from "lucide-react";

export function AppointmentSection() {
    const { language, t } = useLanguage();

    return (
        <section className="py-24 bg-white relative">
            <div className="container mx-auto px-4">
                <div className="relative rounded-[3rem] overflow-hidden bg-[#FDF8F6] min-h-[500px] flex items-center shadow-xl">
                    {/* Image Side (masked) */}
                    <div className={`hidden lg:block absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-0 bottom-0 w-1/2 h-full`}>
                        <img
                            src="/tech-consultation.png"
                            alt="Tech Consultation"
                            className="w-full h-full object-cover"
                            style={{ clipPath: language === 'ar' ? 'polygon(0 0, 80% 0, 100% 100%, 0% 100%)' : 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}
                        />
                    </div>

                    {/* Content Side */}
                    <div className={`relative z-10 w-full lg:w-1/2 p-12 lg:p-24 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <span className="inline-block px-4 py-2 rounded-full -white/10 -primary font-bold text-sm mb-6">
                            {t('vipService')}
                        </span>
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
                            {t('bookAppointmentTitle')}
                        </h2>
                        <p className="text-gray-500 text-lg mb-10 leading-relaxed max-w-md">
                            {t('bookAppointmentDesc')}
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link href="/contact-us">
                                <Button size="lg" className="rounded-full h-14 px-8 bg-gray-900 text-white hover:-primary font-bold text-lg shadow-lg transition-colors">
                                    <Calendar className="mr-2 w-5 h-5" />
                                    {t('bookAppointmentBtn')}
                                </Button>
                            </Link>
                            <Link href="/contact-us">
                                <Button variant="outline" size="lg" className="rounded-full h-14 px-8 border-2 border-gray-200 hover:border-gray-900 font-bold text-lg text-gray-900">
                                    <Phone className="mr-2 w-5 h-5" />
                                    {t('callUsBtn')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
