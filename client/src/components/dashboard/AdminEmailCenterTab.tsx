import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Mail,
    Edit,
    Save,
    X,
    Loader2,
    Info,
    Languages
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function AdminEmailCenterTab() {
    const queryClient = useQueryClient();
    const { language } = useLanguage();
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});

    const { data: templates, isLoading, error } = useQuery({
        queryKey: ['admin', 'email-templates'],
        queryFn: async () => {
            const response = await api.get('/admin/email-templates');
            return response.data;
        },
    });

    const updateTemplate = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.put(`/admin/email-templates/${data.type}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
            setEditingTemplate(null);
            toast.success(language === 'ar' ? 'تم تحديث القالب بنجاح' : 'Template updated successfully');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || (language === 'ar' ? 'فشل تحديث القالب' : 'Failed to update template'));
        }
    });

    const seedTemplates = useMutation({
        mutationFn: async () => {
            const res = await api.get('/admin/email-templates/seed');
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
            toast.success(language === 'ar' ? 'تمت استعادة القوالب بنجاح' : 'Templates restored successfully');
        },
        onError: () => {
            toast.error(language === 'ar' ? 'فشل استعادة القوالب' : 'Failed to restore templates');
        }
    });

    const handleEdit = (template: any) => {
        setEditingTemplate(template);
        setFormData({ ...template });
    };

    const handleSave = () => {
        updateTemplate.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-gray-800 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Mail className="text-blue-400 w-6 h-6" />
                    </div>
                    {language === 'ar' ? 'مركز التحكم في الإيميلات' : 'Email Control Center'}
                </h2>
                <Button 
                    variant="outline"
                    onClick={() => seedTemplates.mutate()}
                    disabled={seedTemplates.isPending}
                    className="border-gray-800 bg-gray-900/50 text-gray-400 hover:text-white rounded-xl h-10 px-4 font-bold flex items-center gap-2"
                >
                    {seedTemplates.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{language === 'ar' ? 'استعادة القوالب الافتراضية' : 'Restore Default Templates'}</span>
                </Button>
            </div>

            <div className="grid gap-4">
                {error && (
                    <div className="p-12 text-center bg-red-900/10 border border-red-900/30 rounded-3xl">
                        <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">{language === 'ar' ? 'فشل تحميل القوالب' : 'Failed to load templates'}</h3>
                        <p className="text-gray-400">{(error as any)?.message}</p>
                    </div>
                )}

                {templates?.length === 0 && !error && (
                    <div className="p-12 text-center bg-gray-900/50 border border-dashed border-gray-800 rounded-3xl">
                        <Mail className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">{language === 'ar' ? 'لا توجد قوالب حالياً' : 'No templates found'}</h3>
                        <p className="text-gray-500 mb-6">{language === 'ar' ? 'يبدو أنه لم يتم إنشاء قوالب افتراضية بعد.' : 'It seems no default templates have been created yet.'}</p>
                    </div>
                )}

                {templates?.map((template: any) => (
                    <Card key={template.id} className="border border-gray-800 bg-gray-900/50 hover:bg-gray-900 transition-colors rounded-2xl overflow-hidden group">
                        <CardContent className="p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">
                                        {language === 'ar' ? template.nameAr : template.nameEn}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                                        {template.type}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => handleEdit(template)}
                                variant="outline" 
                                className="border-gray-800 bg-gray-950 text-white hover:bg-gray-800 rounded-xl h-10 px-4 font-bold flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                <span>{language === 'ar' ? 'تعديل القالب' : 'Edit Template'}</span>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {editingTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
                            <div>
                                <h3 className="text-xl font-black text-white">
                                    {language === 'ar' ? `تعديل: ${editingTemplate.nameAr}` : `Edit: ${editingTemplate.nameEn}`}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                    {editingTemplate.type}
                                </p>
                            </div>
                            <button onClick={() => setEditingTemplate(null)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Placeholder Info */}
                            <div className="bg-blue-900/10 border border-blue-900/30 rounded-2xl p-4 flex gap-3">
                                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-100">
                                        {language === 'ar' ? 'الرموز المتاحة لهذا القالب:' : 'Available placeholders for this template:'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {editingTemplate.variables.map((v: string) => (
                                            <code key={v} className="bg-blue-950 text-blue-400 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                                {`{{${v}}}`}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Arabic Version */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                                        <Languages className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">{language === 'ar' ? 'النسخة العربية' : 'Arabic Version'}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{language === 'ar' ? 'عنوان الرسالة' : 'Email Subject'}</label>
                                        <Input 
                                            value={formData.subjectAr}
                                            onChange={(e) => setFormData({...formData, subjectAr: e.target.value})}
                                            className="bg-gray-950 border-gray-800 text-white rounded-xl h-12 px-4 focus:ring-blue-500 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{language === 'ar' ? 'محتوى الرسالة' : 'Email Body'}</label>
                                        <Textarea 
                                            value={formData.bodyAr}
                                            onChange={(e) => setFormData({...formData, bodyAr: e.target.value})}
                                            className="bg-gray-950 border-gray-800 text-white rounded-xl min-h-[150px] p-4 focus:ring-blue-500 font-bold leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-gray-800"></div>

                                {/* English Version */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                                        <Languages className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">{language === 'ar' ? 'النسخة الإنجليزية' : 'English Version'}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{language === 'ar' ? 'Subject (English)' : 'Email Subject'}</label>
                                        <Input 
                                            value={formData.subjectEn}
                                            onChange={(e) => setFormData({...formData, subjectEn: e.target.value})}
                                            className="bg-gray-950 border-gray-800 text-white rounded-xl h-12 px-4 focus:ring-blue-500 font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{language === 'ar' ? 'Body (English)' : 'Email Body'}</label>
                                        <Textarea 
                                            value={formData.bodyEn}
                                            onChange={(e) => setFormData({...formData, bodyEn: e.target.value})}
                                            className="bg-gray-950 border-gray-800 text-white rounded-xl min-h-[150px] p-4 focus:ring-blue-500 font-bold leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-800 flex gap-3 sticky bottom-0 bg-gray-900">
                            <Button variant="ghost" onClick={() => setEditingTemplate(null)} className="flex-1 h-12 rounded-xl font-bold text-gray-400 hover:bg-gray-800">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button 
                                onClick={handleSave}
                                disabled={updateTemplate.isPending}
                                className="flex-[2] h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-900/20"
                            >
                                {updateTemplate.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : (language === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
