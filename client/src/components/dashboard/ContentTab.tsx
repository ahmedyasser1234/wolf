import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ExternalLink, ImageIcon, Instagram, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useLanguage } from "@/lib/i18n";

export default function ContentTab() {
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();
    const [updatingIds, setUpdatingIds] = useState<number[]>([]);

    const { data: socialFeed, isLoading } = useQuery({
        queryKey: ['content', 'social_feed'],
        queryFn: () => endpoints.content.list('social_feed'),
    });

    const updateContent = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: any }) => {
            return endpoints.content.update(id, data);
        },
        onMutate: (variables) => {
            setUpdatingIds(prev => [...prev, variables.id]);
        },
        onSettled: (data, error, variables) => {
            setUpdatingIds(prev => prev.filter(id => id !== variables.id));
        },
        onSuccess: () => {
            toast.success(t('contentUpdated'));
            queryClient.invalidateQueries({ queryKey: ['content', 'social_feed'] });
        },
        onError: () => {
            toast.error(t('updateError'));
        }
    });

    const handleUpdate = (id: number, currentData: any, field: string, value: string) => {
        const newData = { ...currentData, [field]: value };
        updateContent.mutate({ id, data: newData });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl md:text-2xl font-bold text-white">{t('manageInstagramContent')}</h2>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{t('instagramContentDesc')}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 w-full sm:w-auto justify-center border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                <Instagram className="w-4 h-4" />
                                {t('autoConnect')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            <DialogHeader>
                                <DialogTitle>{t('autoConnectInstagram')}</DialogTitle>
                                <DialogDescription>
                                    {t('autoConnectDesc')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label className="text-white font-bold">{t('instagramAccessToken')}</Label>
                                    <Input
                                        placeholder="Paste your long-lived access token here..."
                                        id="ig-token"
                                        className="bg-gray-900 border-gray-800 text-white"
                                    />
                                </div>
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => {
                                        const token = (document.getElementById('ig-token') as HTMLInputElement).value;
                                        if (!token) return toast.error(t('enterTokenFirst'));

                                        toast.promise(endpoints.content.setupInstagram(token), {
                                            loading: t('connecting'),
                                            success: t('connectSuccess'),
                                            error: t('connectError')
                                        });
                                    }}
                                >
                                    {t('saveAndSync')}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button
                        variant="ghost"
                        size="icon"
                        title={t('syncNow')}
                        className="w-full sm:w-10 border border-gray-800 sm:border-transparent"
                        onClick={() => {
                            toast.promise(endpoints.content.syncInstagram(), {
                                loading: t('syncing'),
                                success: t('syncStarted'),
                                error: t('syncFailed')
                            });
                        }}
                    >
                        <RefreshCw className="w-4 h-4 mx-auto" />
                        <span className="sm:hidden ml-2">{t('syncNow')}</span>
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {socialFeed?.map((item: any) => (
                    <Card key={item.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full rounded-2xl bg-background border border-gray-800">
                        <div className="aspect-square relative bg-gray-900 group border-b border-gray-800">
                            {item.data.imageUrl ? (
                                <img
                                    src={item.data.imageUrl}
                                    alt="Social Feed"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-gray-500">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <a
                                    href={item.data.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-gray-800/90 backdrop-blur rounded-full text-white hover:bg-purple-600 hover:scale-110 transition-all shadow-lg"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                        <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-gray-400 block text-start">{t('imageUrl')}</label>
                                <Input
                                    defaultValue={item.data.imageUrl}
                                    onBlur={(e) => {
                                        if (e.target.value !== item.data.imageUrl) {
                                            handleUpdate(item.id, item.data, 'imageUrl', e.target.value);
                                        }
                                    }}
                                    className="text-left ltr h-9 md:h-10 text-xs md:text-sm bg-gray-900/50 focus:bg-gray-800 transition-colors border-gray-800"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs md:text-sm font-bold text-gray-400 block text-start">{t('postUrl')}</label>
                                <Input
                                    defaultValue={item.data.link}
                                    onBlur={(e) => {
                                        if (e.target.value !== item.data.link) {
                                            handleUpdate(item.id, item.data, 'link', e.target.value);
                                        }
                                    }}
                                    className="text-left ltr h-9 md:h-10 text-xs md:text-sm bg-gray-900/50 focus:bg-gray-800 transition-colors border-gray-800"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div className="pt-2 flex justify-end mt-auto h-6">
                                {updatingIds.includes(item.id) && (
                                    <span className="text-xs text-purple-400 flex items-center gap-1.5 animate-pulse font-medium bg-gray-800 px-2 py-0.5 rounded-full">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        {t('saving')}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
