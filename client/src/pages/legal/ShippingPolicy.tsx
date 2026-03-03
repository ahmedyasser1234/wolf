import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { Truck, MapPin, Clock, PackageCheck } from "lucide-react";

export default function ShippingPolicy() {
    const { language } = useLanguage();
    const isAr = language === 'ar';

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="container mx-auto px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12"
                >
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Truck size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">
                                {isAr ? 'سياسة الشحن والتوصيل' : 'Shipping & Delivery Policy'}
                            </h1>
                            <p className="text-gray-500 font-bold mt-2">
                                {isAr ? 'آخر تحديث: فبراير 2026' : 'Last Updated: February 2026'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12 text-gray-600 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                                <MapPin className="text-primary" size={24} />
                                {isAr ? '1. مناطق التغطية' : '1. Coverage Areas'}
                            </h2>
                            <p className="mb-4">
                                {isAr
                                    ? 'نحن في Wolf Techno نفخر بتوفير خدمات الشحن السريع والموثوق لجميع مناطق الإمارات العربية المتحدة. نعمل مع أفضل شركات الشحن لضمان وصول أجهزتك بأمان.'
                                    : 'At Wolf Techno, we pride ourselves on providing fast and reliable shipping services to all regions of the United Arab Emirates. We partner with top logistics companies to ensure your devices arrive safely.'}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                                <Clock className="text-primary" size={24} />
                                {isAr ? '2. مدة التوصيل وتكاليف الشحن' : '2. Delivery Time & Shipping Costs'}
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-2">{isAr ? 'داخل دبي' : 'Inside Dubai'}</h3>
                                    <p className="text-sm">{isAr ? 'مدة التوصيل: 24 - 48 ساعة بتكلفة 25 درهم إماراتي.' : 'Delivery time: 24 - 48 hours for 25 AED.'}</p>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-2">{isAr ? 'باقي مدن الإمارات' : 'Other UAE Emirates'}</h3>
                                    <p className="text-sm">{isAr ? 'مدة التوصيل: 3 - 5 أيام عمل بتكلفة 35 درهم إماراتي.' : 'Delivery time: 3 - 5 business days for 35 AED.'}</p>
                                </div>
                            </div>
                            <p className="mt-6 text-sm font-bold text-primary bg-primary/5 p-4 rounded-xl">
                                🌟 {isAr ? 'شحن مجاني على الطلبات التي تتجاوز قيمتها 500 درهم إماراتي.' : 'Free shipping on orders exceeding 500 AED.'}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
                                <PackageCheck className="text-primary" size={24} />
                                {isAr ? '3. تتبع شحنتك' : '3. Track Your Shipment'}
                            </h2>
                            <p className="mb-4">
                                {isAr
                                    ? 'بمجرد تأكيد طلبك وتسليمه لشركة الشحن، سيتم إرسال رسالة نصية وبريد إلكتروني يحتوي على رقم التتبع الخاص بشحنتك. يمكنك مراقبة حالة الطلب مباشرة من خلال صفحة "تتبع طلبي" في الموقع أو عبر الرابط المرفق في الرسالة.'
                                    : 'Once your order is confirmed and handed over to the courier, you will receive an SMS and email with your tracking number. You can monitor the order status directly from the "Track Order" page on our site or via the link in the message.'}
                            </p>
                        </section>

                        <section className="border-t border-gray-100 pt-8 font-bold text-sm text-gray-500">
                            <p>{isAr ? 'ملاحظة: قد تتأثر أوقات التوصيل خلال فترات العروض الكبرى أو الظروف الاستثنائية لشركات الشحن.' : 'Note: Delivery times may be affected during major promotional periods or unforeseen circumstances with shipping carriers.'}</p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
