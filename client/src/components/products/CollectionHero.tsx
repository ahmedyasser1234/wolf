import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

interface CollectionHeroProps {
    title: string;
    description?: string;
    image?: string;
    itemCount?: number;
}

export function CollectionHero({ title, description, image, itemCount }: CollectionHeroProps) {
    const { language, t } = useLanguage();

    return (
        <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden bg-gray-900 flex items-center">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"}
                    alt={title}
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative h-full container mx-auto px-4 flex flex-col items-center justify-center text-center text-white z-10 pt-20 md:pt-0">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-5xl md:text-7xl font-serif font-black mb-4 tracking-tight drop-shadow-xl bg-gradient-to-r from-[#D4AF37] via-[#F2D06B] to-[#D4AF37] bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-bold leading-relaxed mb-6">
                                {description}
                            </p>
                        )}

                        {itemCount !== undefined && (
                            <div className="inline-block px-6 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-white">
                                <span className="font-bold">{itemCount}</span> {t('statsProducts')}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
