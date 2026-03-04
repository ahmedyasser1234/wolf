import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Truck, PackageCheck, Zap, Download, Upload } from "lucide-react";
import { endpoints } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/i18n";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShippingTabProps {
    vendorId: number;
}

export default function ShippingTab({ vendorId }: ShippingTabProps) {
    const { language, t } = useLanguage();
    const queryClient = useQueryClient();
    const [shippingCost, setShippingCost] = useState<string>("");
    const [hasFreeShipping, setHasFreeShipping] = useState<boolean>(false);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState<string>("");
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);

    // Fetch Vendor Profile to get current shipping cost
    const { data: vendor, isLoading } = useQuery({
        queryKey: ['vendor', 'profile', vendorId],
        queryFn: async () => (await api.get(`/vendors/${vendorId}`)).data,
    });

    useEffect(() => {
        if (vendor) {
            setShippingCost(vendor.shippingCost?.toString() || "0");
            setHasFreeShipping(vendor.hasFreeShipping || false);
            setFreeShippingThreshold(vendor.freeShippingThreshold?.toString() || "0");
        }
    }, [vendor]);

    // Update Vendor Shipping Settings
    const updateShipping = useMutation({
        mutationFn: async (data: { shippingCost: number; hasFreeShipping: boolean; freeShippingThreshold: number }) => {
            return api.patch(`/vendors/${vendorId}`, data);
        },
        onSuccess: () => {
            toast.success(t('shippingUpdated'));
            queryClient.invalidateQueries({ queryKey: ['vendor', 'profile', vendorId] });
            queryClient.invalidateQueries({ queryKey: ['vendor', 'dashboard'] });
        },
        onError: () => {
            toast.error(t('shippingError'));
        }
    });

    const handleSave = () => {
        const cost = parseFloat(shippingCost);
        const threshold = parseFloat(freeShippingThreshold);

        if (isNaN(cost) || cost < 0) {
            toast.error(t('invalidShippingCost'));
            return;
        }

        if (hasFreeShipping && (isNaN(threshold) || threshold < 0)) {
            toast.error(t('invalidFreeThreshold'));
            return;
        }

        updateShipping.mutate({
            shippingCost: cost,
            hasFreeShipping,
            freeShippingThreshold: hasFreeShipping ? threshold : 0
        });
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await endpoints.shipping.export();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'shipping.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(language === 'ar' ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
        } catch (error) {
            console.error(error);
            toast.error(language === 'ar' ? 'فشل تصدير البيانات' : 'Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            await endpoints.shipping.import(file);
            toast.success(language === 'ar' ? 'تم استيراد البيانات بنجاح' : 'Data imported successfully');
            queryClient.invalidateQueries({ queryKey: ['vendor', 'profile', vendorId] });
        } catch (error) {
            console.error(error);
            toast.error(language === 'ar' ? 'فشل استيراد البيانات' : 'Failed to import data');
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <Truck className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-white font-bold animate-pulse">{language === 'ar' ? "جاري تحميل إعدادات الشحن..." : "Loading shipping settings..."}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Standard Shipping Card */}
                <Card className="border-0 shadow-sm overflow-hidden group bg-background border border-gray-800">
                    <div className="h-1 bg-blue-500 w-full group-hover:h-2 transition-all" />
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-900/30 p-2 rounded-xl">
                                <Truck className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-white">{t('standardShipping')}</CardTitle>
                                <CardDescription className="text-white">{t('standardShippingDesc')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="shipping-cost" className="font-bold text-white">{t('shippingCostSR')}</Label>
                            <div className="relative">
                                <Input
                                    id="shipping-cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={shippingCost}
                                    onChange={(e) => setShippingCost(e.target.value)}
                                    className="pl-16 h-12 text-base md:text-lg font-bold rounded-xl border-gray-800 bg-gray-900 text-white focus:ring-blue-500"
                                />
                                <div className="absolute top-0 left-0 h-full flex items-center px-4 text-xs md:text-sm text-white font-bold border-r border-gray-800">
                                    {t('sar')}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-800/50">
                            <ul className="text-xs space-y-2 text-blue-300 font-medium">
                                <li className="flex items-center gap-2">• {t('shippingNote1')}</li>
                                <li className="flex items-center gap-2">• {t('shippingNote2')}</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Free Shipping Card */}
                <Card className={cn(
                    "border-0 shadow-sm overflow-hidden transition-all duration-300 group bg-background border border-gray-800",
                    hasFreeShipping ? "ring-2 ring-emerald-500/50" : "opacity-50"
                )}>
                    <div className={cn("h-1 w-full transition-all", hasFreeShipping ? "bg-emerald-500" : "bg-gray-800")} />
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl transition-colors", hasFreeShipping ? "bg-emerald-900/30" : "bg-gray-800")}>
                                    <Zap className={cn("w-6 h-6", hasFreeShipping ? "text-emerald-400" : "text-white")} />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-white">{t('freeShipping')}</CardTitle>
                                    <CardDescription className="text-white">{t('freeShippingDesc')}</CardDescription>
                                </div>
                            </div>
                            <Switch
                                checked={hasFreeShipping}
                                onCheckedChange={setHasFreeShipping}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={cn("space-y-4 transition-all duration-300", hasFreeShipping ? "opacity-100 translate-y-0" : "opacity-40 pointer-events-none -translate-y-2")}>
                            <div className="space-y-2">
                                <Label htmlFor="free-threshold" className="font-bold text-white">{t('freeThreshold')}</Label>
                                <div className="relative">
                                    <Input
                                        id="free-threshold"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={freeShippingThreshold}
                                        onChange={(e) => setFreeShippingThreshold(e.target.value)}
                                        className="pl-16 h-12 text-base md:text-lg font-bold rounded-xl border-gray-800 bg-gray-900 text-white"
                                        placeholder="1000"
                                    />
                                    <div className="absolute top-0 left-0 h-full flex items-center px-4 text-xs md:text-sm text-white font-bold border-r border-gray-800">
                                        {t('sar')}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-800/50 flex items-start gap-3">
                                <PackageCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-emerald-200 font-medium">
                                    {t('freeThresholdDesc')}
                                </p>
                            </div>
                        </div>
                        {!hasFreeShipping && (
                            <div className="p-8 text-center text-white text-sm italic">
                                {t('enableFreeShipping')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Actions and Excel Integration */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-background border border-gray-800 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl uppercase tracking-tight">
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={exporting}
                        className="h-11 px-6 rounded-xl border-gray-800 bg-gray-900 text-white hover:bg-gray-800 hover:text-white font-bold shadow-lg transition-all active:scale-95"
                    >
                        {exporting ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Download className="w-5 h-5 ml-2" />}
                        {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            id="import-shipping"
                            className="hidden"
                            onChange={handleImport}
                        />
                        <Button
                            variant="outline"
                            asChild
                            disabled={importing}
                            className="h-11 px-6 rounded-xl border-gray-800 bg-gray-900 text-white hover:bg-gray-800 hover:text-white cursor-pointer font-bold shadow-lg transition-all active:scale-95"
                        >
                            <label htmlFor="import-shipping" className="flex items-center gap-3">
                                {importing ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Upload className="w-5 h-5 ml-2" />}
                                {language === 'ar' ? 'استيراد Excel' : 'Import Excel'}
                            </label>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="hidden lg:flex flex-col items-end">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{language === 'ar' ? 'حالة الشحن' : 'Shipping Status'}</p>
                        <div className="text-white text-xs font-bold flex items-center gap-2">
                            {hasFreeShipping ? (
                                <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> {t('freeShippingActive')}</>
                            ) : (
                                <><span className="w-2 h-2 rounded-full bg-slate-600" /> {t('freeShippingInactive')}</>
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={updateShipping.isPending}
                        className="flex-1 md:flex-initial min-w-[180px] bg-blue-600 hover:bg-blue-700 h-12 rounded-xl text-lg font-black gap-2 shadow-xl shadow-blue-900/20 transition-all active:scale-95 text-white"
                    >
                        {updateShipping.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {t('saveSettings')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
