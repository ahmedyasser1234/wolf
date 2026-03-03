import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/lib/i18n";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
}

export const SEO = ({
    title,
    description,
    keywords,
    image,
    url,
    type = "website"
}: SEOProps) => {
    const { language } = useLanguage();

    const siteName = language === 'ar' ? "وولف تكنو - عالم التقنية الفاخرة" : "Wolf Techno - Premium Electronics";
    const defaultDescription = language === 'ar'
        ? "وجهتك الأولى لأحدث الأجهزة الإلكترونية الفاخرة. هواتف، لابتوبات، إكسسوارات تقنية بأفضل الأسعار مع إمكانية الدفع بالتقسيط بدون فوائد."
        : "Your premier destination for the latest luxury electronics. Phones, laptops, tech accessories at the best prices with interest-free installment payment options.";

    const finalTitle = title ? `${title} | ${siteName}` : siteName;
    const finalDescription = description || defaultDescription;
    const canonical = url ? `https://wolftechno.com${url}` : "https://wolftechno.com";
    const finalImage = image || "/og-image.jpg"; // Default OG image

    return (
        <Helmet>
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            {keywords && <meta name="keywords" content={keywords} />}
            <html lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={finalImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={canonical} />
            <meta property="twitter:title" content={finalTitle} />
            <meta property="twitter:description" content={finalDescription} />
            <meta property="twitter:image" content={finalImage} />

            <link rel="canonical" href={canonical} />
        </Helmet>
    );
};
