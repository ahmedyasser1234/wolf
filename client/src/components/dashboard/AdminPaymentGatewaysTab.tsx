import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
    CreditCard, Banknote, Wallet, UserCheck,
    CheckCircle2, Shield, Loader2, Globe,
    Key, Save, Power, PowerOff, Eye, EyeOff,
    RefreshCw, Zap, ShieldCheck, QrCode, Phone
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Gateway {
    id: number;
    name: string; // Internal key (stripe, etc)
    displayNameEn: string;
    displayNameAr: string;
    descriptionEn: string | null;
    descriptionAr: string | null;
    logo: string | null;
    publishableKey: string | null;
    secretKey: string | null;
    merchantId: string | null;
    config: any;
    isActive: boolean;
    displayOrder: number | null;
}

const GATEWAY_CONFIGS: Record<string, {
    color: string;
    icon: React.ReactNode;
    fields: {
        key: 'publishableKey' | 'secretKey' | 'merchantId' | string;
        labelAr: string;
        labelEn: string;
        placeholder?: string;
        isSecret?: boolean;
    }[];
}> = {
    stripe: {
        color: "#635BFF",
        icon: <CreditCard size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'المفتاح العلني (Publishable Key)', labelEn: 'Publishable Key', placeholder: 'pk_live_...' },
            { key: 'secretKey', labelAr: 'المفتاح السري (Secret Key)', labelEn: 'Secret Key', placeholder: 'sk_live_...', isSecret: true },
        ]
    },
    tap: {
        color: "#2AC5F4",
        icon: <CreditCard size={22} />,
        fields: [
            { key: 'secretKey', labelAr: 'المفتاح السري (Secret Key)', labelEn: 'Secret Key', placeholder: 'sk_live_...', isSecret: true },
        ]
    },
    paymob: {
        color: "#F44336",
        icon: <CreditCard size={22} />,
        fields: [
            { key: 'secretKey', labelAr: 'مفتاح API (API Key)', labelEn: 'API Key', placeholder: 'ZXhwX3...', isSecret: true },
            { key: 'publishableKey', labelAr: 'معرف التكامل (Integration ID)', labelEn: 'Integration ID', placeholder: '123456' },
            { key: 'iframeId', labelAr: 'معرف الـ Iframe', labelEn: 'Iframe ID', placeholder: '789012' },
        ]
    },
    geidea: {
        color: "#E31E24",
        icon: <CreditCard size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح التاجر (Merchant Key)', labelEn: 'Merchant Key' },
            { key: 'secretKey', labelAr: 'كلمة مرور API', labelEn: 'API Password', isSecret: true },
        ]
    },
    mamo: {
        color: "#000000",
        icon: <Zap size={22} />,
        fields: [
            { key: 'secretKey', labelAr: 'مفتاح API', labelEn: 'API Key', isSecret: true },
        ]
    },
    payby: {
        color: "#00C2E0",
        icon: <Phone size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'معرف الشريك (Partner ID)', labelEn: 'Partner ID' },
            { key: 'secretKey', labelAr: 'مفتاح API', labelEn: 'API Key', isSecret: true },
        ]
    },
    dpo_pay: {
        color: "#F58220",
        icon: <Globe size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'رمز الشركة (Company Token)', labelEn: 'Company Token' },
            { key: 'serviceType', labelAr: 'نوع الخدمة (Service Type)', labelEn: 'Service Type', placeholder: '3854' },
        ]
    },
    ccavenue: {
        color: "#F15A22",
        icon: <Globe size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'معرف التاجر (Merchant ID)', labelEn: 'Merchant ID' },
            { key: 'secretKey', labelAr: 'مفتاح العمل (Working Key)', labelEn: 'Working Key', isSecret: true },
            { key: 'accessCode', labelAr: 'كود الوصول (Access Code)', labelEn: 'Access Code' },
        ]
    },
    tigerpay: {
        color: "#FFD700",
        icon: <ShieldCheck size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح API', labelEn: 'API Key' },
            { key: 'secretKey', labelAr: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true },
        ]
    },
    paymennt: {
        color: "#0052cc",
        icon: <CreditCard size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح API', labelEn: 'API Key' },
            { key: 'secretKey', labelAr: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true },
        ]
    },
    utap: {
        color: "#ff6b00",
        icon: <QrCode size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح API', labelEn: 'API Key' },
            { key: 'merchantId', labelAr: 'معرف التاجر', labelEn: 'Merchant ID' },
        ]
    },
    my_network: {
        color: "#1d1d1b",
        icon: <Globe size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح API', labelEn: 'API Key' },
            { key: 'secretKey', labelAr: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true },
        ]
    },
    omnispay: {
        color: "#4c20f1",
        icon: <CreditCard size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح API', labelEn: 'API Key' },
            { key: 'secretKey', labelAr: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true },
        ]
    },
    vaultspay: {
        color: "#000000",
        icon: <Shield size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح API', labelEn: 'API Key' },
            { key: 'secretKey', labelAr: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true },
        ]
    },
    afspro: {
        color: "#00aaff",
        icon: <ShieldCheck size={22} />,
        fields: [
            { key: 'publishableKey', labelAr: 'مفتاح API', labelEn: 'API Key' },
            { key: 'merchantId', labelAr: 'معرف التاجر', labelEn: 'Merchant ID' },
        ]
    },
    cash_on_delivery: {
        color: "#10B981",
        icon: <Banknote size={22} />,
        fields: []
    }
};

function GatewayCard({ gw }: { gw: Gateway }) {
    const { language } = useLanguage();
    const queryClient = useQueryClient();

    // State for all potential fields
    const [fields, setFields] = useState<Record<string, string>>({
        publishableKey: gw.publishableKey ?? "",
        secretKey: gw.secretKey ?? "",
        merchantId: gw.merchantId ?? "",
        ...(gw.config || {})
    });

    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const config = GATEWAY_CONFIGS[gw.name] || {
        color: "#6366F1",
        icon: <span>{gw.displayNameEn.slice(0, 3).toUpperCase()}</span>,
        fields: [
            { key: 'publishableKey', labelAr: 'المفتاح العلني', labelEn: 'Publishable Key' },
            { key: 'secretKey', labelAr: 'المفتاح السري', labelEn: 'Secret Key', isSecret: true },
        ]
    };

    useEffect(() => {
        setFields({
            publishableKey: gw.publishableKey ?? "",
            secretKey: gw.secretKey ?? "",
            merchantId: gw.merchantId ?? "",
            ...(gw.config || {})
        });
    }, [gw]);

    const patchCache = (updated: Gateway) =>
        queryClient.setQueryData<Gateway[]>(
            ['admin', 'payment-gateways'],
            (old) => old?.map(g => g.id === updated.id ? updated : g) ?? []
        );

    const toggleMutation = useMutation({
        mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
            endpoints.paymentGateways.toggle(id, isEnabled),
        onSuccess: (updated: Gateway) => {
            patchCache(updated);
            toast.success(
                language === 'ar'
                    ? `تم ${updated.isActive ? 'تفعيل' : 'تعطيل'} ${updated.displayNameAr}`
                    : `${updated.displayNameEn} ${updated.isActive ? 'enabled' : 'disabled'}`
            );
        },
        onError: () => toast.error(language === 'ar' ? 'فشل تغيير الحالة' : 'Failed to update'),
    });

    const credMutation = useMutation({
        mutationFn: ({ id, apiKey, publishableKey, merchantId, config }: any) =>
            endpoints.paymentGateways.updateCredentials(id, apiKey, publishableKey, merchantId, config),
        onSuccess: (updated: Gateway) => {
            patchCache(updated);
            toast.success(language === 'ar' ? '✓ تم حفظ الإعدادات بنجاح' : '✓ Settings saved');
        },
        onError: () => toast.error(language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings'),
    });

    const handleSave = () => {
        const { publishableKey, secretKey, merchantId, ...rest } = fields;
        credMutation.mutate({
            id: gw.id,
            apiKey: secretKey,
            publishableKey,
            merchantId,
            config: rest
        });
    };

    const hasChanges = JSON.stringify(fields) !== JSON.stringify({
        publishableKey: gw.publishableKey ?? "",
        secretKey: gw.secretKey ?? "",
        merchantId: gw.merchantId ?? "",
        ...(gw.config || {})
    });

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="h-full">
            <Card className={`h-full overflow-hidden border transition-all duration-300 flex flex-col ${gw.isActive ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                <div className="h-1.5 w-full shrink-0" style={{ background: config.color }} />

                <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                            style={{ background: config.color }}
                        >
                            {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm truncate">
                                {language === 'ar' ? gw.displayNameAr : gw.displayNameEn}
                            </p>
                            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-1 mt-0.5">
                                {language === 'ar' ? gw.descriptionAr : gw.descriptionEn}
                            </p>
                        </div>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${gw.isActive ? 'bg-emerald-400 shadow shadow-emerald-400/60' : 'bg-gray-600'}`} />
                    </div>

                    <div className="flex-1 space-y-3 mt-4">
                        {config.fields.map((f) => (
                            <div key={f.key} className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                                    {f.isSecret ? <Key size={11} /> : <Globe size={11} />}
                                    {language === 'ar' ? f.labelAr : f.labelEn}
                                </label>
                                <div className="relative">
                                    <Input
                                        type={f.isSecret && !showKeys[f.key] ? "password" : "text"}
                                        value={fields[f.key] || ""}
                                        onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder || '...'}
                                        className="h-9 bg-gray-800 border-gray-800 text-white text-xs rounded-xl pr-9 placeholder:text-gray-600 focus-visible:ring-0 focus:border-gray-500"
                                        dir="ltr"
                                    />
                                    {f.isSecret && (
                                        <button
                                            type="button"
                                            onClick={() => setShowKeys(v => ({ ...v, [f.key]: !v[f.key] }))}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                        >
                                            {showKeys[f.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleSave}
                            disabled={credMutation.isPending || !hasChanges}
                            className={`w-full h-8 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all
                ${hasChanges
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-900/40'
                                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                }`}
                        >
                            {credMutation.isPending
                                ? <Loader2 size={12} className="animate-spin" />
                                : (gw.secretKey || gw.publishableKey) && !hasChanges
                                    ? <CheckCircle2 size={12} className="text-emerald-400" />
                                    : <Save size={12} />
                            }
                            {(gw.secretKey || gw.publishableKey) && !hasChanges
                                ? (language === 'ar' ? 'تم الحفظ ✓' : 'Saved ✓')
                                : (language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')
                            }
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 mt-auto border-t border-gray-800/50">
                        <button
                            onClick={() => toggleMutation.mutate({ id: gw.id, isEnabled: true })}
                            disabled={gw.isActive || toggleMutation.isPending}
                            className={`h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all
                ${gw.isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                }`}
                        >
                            <Power size={12} />
                            {language === 'ar' ? 'تفعيل' : 'Enable'}
                        </button>

                        <button
                            onClick={() => toggleMutation.mutate({ id: gw.id, isEnabled: false })}
                            disabled={!gw.isActive || toggleMutation.isPending}
                            className={`h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all
                ${!gw.isActive
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 cursor-not-allowed'
                                    : 'bg-red-700 hover:bg-red-600 text-white cursor-pointer'
                                }`}
                        >
                            <PowerOff size={12} />
                            {language === 'ar' ? 'تعطيل' : 'Disable'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function AdminPaymentGatewaysTab() {
    const { language } = useLanguage();
    const queryClient = useQueryClient();

    const { data: gateways, isLoading, refetch } = useQuery<Gateway[]>({
        queryKey: ['admin', 'payment-gateways'],
        queryFn: () => endpoints.paymentGateways.listAll(),
    });

    const seedMutation = useMutation({
        mutationFn: () => endpoints.paymentGateways.seed(),
        onSuccess: (data: Gateway[]) => {
            queryClient.setQueryData(['admin', 'payment-gateways'], data);
            toast.success(language === 'ar' ? 'تم تحميل البوابات بنجاح' : 'Gateways loaded');
        },
    });

    useEffect(() => {
        if (!isLoading && (!gateways || gateways.length === 0)) {
            seedMutation.mutate();
        }
    }, [isLoading, gateways]);

    const enabled = gateways?.filter(g => g.isActive).length ?? 0;
    const total = gateways?.length ?? 0;

    if (isLoading || (seedMutation.isPending && total === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                <p className="text-gray-400 text-sm font-bold">
                    {language === 'ar' ? 'جاري تحميل البوابات...' : 'Loading gateways...'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                            <Globe className="w-5 h-5 text-white" />
                        </div>
                        {language === 'ar' ? 'بوابات الدفع' : 'Payment Gateways'}
                    </h2>
                    <p className="text-gray-400 mt-1 text-sm font-bold">
                        {language === 'ar' ? `${enabled} من ${total} بوابة مفعّلة` : `${enabled} of ${total} enabled`}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-emerald-400 font-bold text-sm">{enabled} {language === 'ar' ? 'مفعّلة' : 'Active'}</span>
                    </div>
                    <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl flex items-center gap-2">
                        <Shield size={14} className="text-gray-400" />
                        <span className="text-gray-400 font-bold text-sm">{total - enabled} {language === 'ar' ? 'معطّلة' : 'Disabled'}</span>
                    </div>
                    <button onClick={() => refetch()} className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors">
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-3 text-sm text-blue-300 font-bold flex items-center gap-3">
                <Key size={15} className="text-blue-400 shrink-0" />
                {language === 'ar'
                    ? 'أدخل مفتاح API من كل مزود، احفظه، ثم اضغط "تفعيل". البوابات المفعّلة فقط تظهر للعملاء في صفحة الدفع.'
                    : 'Enter the API key from each provider, save it, then click "Enable". Only enabled gateways appear at checkout.'}
            </div>

            {/* Cards */}
            {total > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {gateways!.map(gw => <GatewayCard key={gw.id} gw={gw} />)}
                </div>
            ) : (
                <div className="text-center py-20">
                    <Globe size={48} className="text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold mb-4">{language === 'ar' ? 'لا توجد بوابات' : 'No gateways found'}</p>
                    <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500">
                        {seedMutation.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
                        {language === 'ar' ? 'تحميل البوابات' : 'Load Gateways'}
                    </Button>
                </div>
            )}
        </div>
    );
}
