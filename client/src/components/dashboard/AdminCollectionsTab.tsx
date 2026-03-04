import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Image as ImageIcon,
    Loader2,
    Filter,
    Sparkles,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function AdminCollectionsTab({
    showConfirm,
    vendorId
}: {
    showConfirm: (title: string, description: string, onConfirm: () => void) => void;
    vendorId?: number;
}) {
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    const [editingCollection, setEditingCollection] = useState<any>(null);
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [descriptionAr, setDescriptionAr] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [image, setImage] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [downPaymentPercentage, setDownPaymentPercentage] = useState<number>(0);
    const [categoryId, setCategoryId] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => endpoints.categories.list(),
    });

    const { data: collections, isLoading } = useQuery({
        queryKey: ['admin', 'collections', categoryFilter, vendorId],
        queryFn: () => endpoints.collections.list(categoryFilter === "all" ? undefined : Number(categoryFilter)),
    });

    const createCollection = useMutation({
        mutationFn: (data: FormData) => endpoints.collections.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم إنشاء المجموعة بنجاح' : 'Collection created successfully');
        },
    });

    const updateCollection = useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => endpoints.collections.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(language === 'ar' ? 'تم تحديث المجموعة بنجاح' : 'Collection updated successfully');
        },
    });

    const deleteCollection = useMutation({
        mutationFn: (id: number) => endpoints.collections.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
            toast.success(language === 'ar' ? 'تم حذف المجموعة بنجاح' : 'Collection deleted successfully');
        },
    });

    const resetForm = () => {
        setNameAr("");
        setNameEn("");
        setDescriptionAr("");
        setDescriptionEn("");
        setImage("");
        setImageFile(null);
        setDownPaymentPercentage(0);
        setCategoryId("");
        setEditingCollection(null);
    };

    const handleSubmit = () => {
        const formData = new FormData();
        formData.append("nameAr", nameAr);
        formData.append("nameEn", nameEn);
        // Sync with backend description field - send Arabic as primary or combined
        formData.append("description", descriptionAr || descriptionEn);
        formData.append("descriptionAr", descriptionAr);
        formData.append("descriptionEn", descriptionEn);
        formData.append("downPaymentPercentage", downPaymentPercentage.toString());
        if (vendorId) {
            formData.append("vendorId", vendorId.toString());
        }
        formData.append("categoryId", categoryId);

        if (imageFile) {
            formData.append("image", imageFile);
        }

        if (editingCollection) {
            updateCollection.mutate({ id: editingCollection.id, data: formData });
        } else {
            createCollection.mutate(formData);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImage(url);
        }
    };

    const handleEdit = (collection: any) => {
        setEditingCollection(collection);
        setNameAr(collection.nameAr || "");
        setNameEn(collection.nameEn || "");
        setDescriptionAr(collection.descriptionAr || "");
        setDescriptionEn(collection.descriptionEn || "");
        setImage(collection.coverImage || "");
        setImageFile(null);
        setDownPaymentPercentage(collection.downPaymentPercentage ?? 0);
        setCategoryId(collection.categoryId?.toString() || "");
        setIsModalOpen(true);
    };

    const handleDelete = (id: number, collection: any) => {
        const name = language === 'ar' ? collection.nameAr : collection.nameEn;
        showConfirm(
            language === 'ar' ? 'حذف المجموعة' : 'Delete Collection',
            `${language === 'ar' ? 'هل أنت متأكد من حذف' : 'Are you sure you want to delete'} "${name}"?`,
            () => deleteCollection.mutate(id)
        );
    };

    const seedMutation = useMutation({
        mutationFn: () => endpoints.admin.seedCatalog(),
        onSuccess: () => {
            toast.success(language === 'ar' ? 'تم تفعيل الكتالوج بنجاح! يتم الآن تحديث البيانات...' : 'Catalog seeded successfully! Updating data...');
            // Invalidate all relevant queries at once
            queryClient.invalidateQueries({ queryKey: ['vendor'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-profile'] });
        },
        onError: (err: any) => {
            console.error("Seed error:", err);
            toast.error(err.response?.data?.message || (language === 'ar' ? 'فشل تفعيل الكتالوج' : 'Failed to seed catalog'));
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-white">{language === 'ar' ? 'إدارة المجموعات (الماركات)' : 'Manage Collections (Brands)'}</h2>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {collections?.length === 0 && (
                        <Button
                            onClick={() => seedMutation.mutate()}
                            disabled={seedMutation.isPending}
                            className="flex-1 md:flex-none bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 font-black h-12 px-6 rounded-xl animate-pulse text-base"
                        >
                            {seedMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            {language === 'ar' ? 'تعبئة تقنية سريعة' : 'Quick Tech Seed'}
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 h-11 sm:h-12 px-6 rounded-xl font-black shadow-lg shadow-purple-900/20 text-sm sm:text-base min-h-[44px]"
                    >
                        <Plus size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                        {language === 'ar' ? 'إضافة مجموعة جديدة' : 'Add New Collection'}
                    </Button>
                </div>
            </div>

            <Card className="border border-gray-800 rounded-[1.5rem] md:rounded-[2rem] bg-background shadow-none overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                            <Input
                                type="text"
                                placeholder={language === 'ar' ? 'بحث عن مجموعة...' : 'Search collection...'}
                                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-gray-900 border-gray-800 text-white font-bold h-11 sm:h-12 rounded-xl text-base`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter size={16} className="text-gray-400" />
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[200px] bg-gray-900 border-gray-800 text-white font-bold h-12 rounded-xl">
                                    <SelectValue placeholder={language === 'ar' ? 'تصفية حسب القسم' : 'Filter by Category'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{language === 'ar' ? 'كل الأقسام' : 'All Categories'}</SelectItem>
                                    {categories?.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {language === 'ar' ? cat.nameAr : cat.nameEn}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-gray-500 text-start w-16">{t('image')}</th>
                                    <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-gray-500 text-start">{language === 'ar' ? 'اسم المجموعة' : 'Collection Name'}</th>
                                    <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-gray-500 text-start">{language === 'ar' ? 'القسم' : 'Category'}</th>
                                    <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-gray-500 text-center">{language === 'ar' ? 'المقدم %' : 'Down Payment %'}</th>
                                    <th className="py-4 px-6 font-black text-[10px] uppercase tracking-widest text-gray-500 text-end">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-800">
                                            <td className="py-4 px-6"><Skeleton className="h-12 w-12 rounded-xl bg-gray-800" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-40 bg-gray-800 rounded-lg" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-32 bg-gray-800 rounded-lg" /></td>
                                            <td className="py-4 px-6 justify-end flex gap-2"><Skeleton className="h-10 w-10 rounded-xl bg-gray-800" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    collections?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center">
                                                <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                                                <h3 className="text-xl font-black text-white mb-2">{language === 'ar' ? "لم يتم العثور على مجموعات" : "No collections found"}</h3>
                                                <p className="text-gray-500 font-bold mb-8">{language === 'ar' ? "ابدأ بإضافة علامات تجارية جديدة أو استخدم التعبئة التلقائية." : "Start by adding new brands or use the quick seed feature."}</p>
                                                <Button
                                                    onClick={() => seedMutation.mutate()}
                                                    disabled={seedMutation.isPending}
                                                    className="bg-white text-black hover:bg-gray-200 h-12 px-8 rounded-xl font-black"
                                                >
                                                    {seedMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                    {language === 'ar' ? 'تفعيل الكتالوج التقني' : 'Seed Tech Catalog'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ) : (
                                        collections
                                            ?.filter((c: any) =>
                                                (c.nameAr || '').toLowerCase().includes(search.toLowerCase()) ||
                                                (c.nameEn || '').toLowerCase().includes(search.toLowerCase())
                                            )
                                            .map((collection: any) => (
                                                <tr key={collection.id} className="group hover:bg-gray-800/30 transition-all duration-300">
                                                    <td className="py-4 px-6">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-900 overflow-hidden border border-gray-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                            {collection.coverImage ? (
                                                                <img src={collection.coverImage} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="w-5 h-5 text-gray-500" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="font-black text-white text-lg">
                                                            {language === 'ar' ? (collection.nameAr || collection.nameEn) : (collection.nameEn || collection.nameAr)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs font-black rounded-lg uppercase tracking-widest">
                                                            {categories?.find((cat: any) => cat.id === collection.categoryId)?.[language === 'ar' ? 'nameAr' : 'nameEn'] || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-flex items-center gap-1 font-black text-xs px-3 py-1 rounded-full ${collection.downPaymentPercentage > 0 ? 'bg-purple-900/40 text-purple-300' : 'bg-gray-900 text-gray-600'}`}>
                                                            {collection.downPaymentPercentage || 0}%
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-end">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(collection)}
                                                                className="h-11 w-11 bg-gray-800 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-xl min-h-[44px] min-w-[44px]"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(collection.id, collection)}
                                                                className="h-11 w-11 bg-gray-800 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-xl min-h-[44px] min-w-[44px]"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-gray-950 rounded-[1.5rem] md:rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-800 shadow-2xl overflow-hidden relative">
                        {/* Header */}
                        <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 flex-shrink-0">
                            <h3 className="text-lg sm:text-xl font-black text-white">
                                {editingCollection ? (language === 'ar' ? 'تعديل المجموعة' : 'Edit Collection') : (language === 'ar' ? 'إضافة مجموعة جديدة' : 'Add New Collection')}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <Plus className="rotate-45" size={20} />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
                            {/* Image Section */}
                            <div className="flex flex-col items-center gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-32 h-32 rounded-3xl bg-gray-900 border-2 border-dashed border-gray-800 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-purple-500/50 transition-all shadow-inner"
                                >
                                    {image ? (
                                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon size={32} className="text-gray-700 group-hover:text-purple-500 transition-colors mx-auto" />
                                            <span className="text-[10px] font-black text-gray-600 mt-2 block uppercase tracking-widest">{language === 'ar' ? 'صورة' : 'Image'}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Edit className="text-white w-6 h-6" />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-gray-400 font-black text-xs hover:text-purple-400">
                                    {language === 'ar' ? 'تغيير الصورة' : 'Change Image'}
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2 text-start">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'القسم الرئيسي' : 'Parent Category'}</label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger className="bg-gray-900 border-gray-800 text-white h-12 rounded-xl focus:ring-purple-500/20">
                                            <SelectValue placeholder={language === 'ar' ? 'اختر القسم الرئيسي' : 'Select parent category'} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                            {categories?.map((cat: any) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 text-start">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'اسم المجموعة (عربي)' : 'Collection Name (Arabic)'}</label>
                                    <Input
                                        value={nameAr}
                                        onChange={(e) => setNameAr(e.target.value)}
                                        placeholder="مثال: آيفون، سامسونج..."
                                        className="bg-gray-900 border-gray-800 text-white h-12 rounded-xl focus:ring-purple-500/20 text-base"
                                    />
                                </div>

                                <div className="space-y-2 text-start">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'اسم المجموعة (انجليزي)' : 'Collection Name (English)'}</label>
                                    <Input
                                        value={nameEn}
                                        onChange={(e) => setNameEn(e.target.value)}
                                        placeholder="e.g. iPhone, Samsung..."
                                        className="text-left bg-gray-900 border-gray-800 text-white h-12 rounded-xl focus:ring-purple-500/20 text-base"
                                    />
                                </div>

                                <div className="space-y-2 text-start">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{language === 'ar' ? 'الوصف' : 'Description'}</label>
                                    <Input
                                        value={descriptionAr}
                                        onChange={(e) => setDescriptionAr(e.target.value)}
                                        placeholder={language === 'ar' ? 'وصف مختصر...' : 'Short description...'}
                                        className="bg-gray-900 border-gray-800 text-white h-12 rounded-xl focus:ring-purple-500/20 text-base"
                                    />
                                </div>
                            </div>

                            {/* Down Payment Section */}
                            <div className="bg-purple-950/10 border border-purple-900/30 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-purple-400 flex items-center gap-2">
                                            <span className="text-lg">💳</span> {language === 'ar' ? 'نسبة الدفعة الأولى للتقسيط' : 'Installment Down Payment %'}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-wide">
                                            {language === 'ar'
                                                ? 'نسبة الدفعة الأولى الافتراضية لهذه العلامة التجارية'
                                                : 'Default down payment for this brand'}
                                        </p>
                                    </div>
                                    <div className="bg-purple-900/30 px-4 py-2 rounded-xl border border-purple-500/20">
                                        <span className="text-2xl font-black text-purple-400">{downPaymentPercentage}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min={0}
                                        max={50}
                                        step={1}
                                        value={downPaymentPercentage}
                                        onChange={(e) => setDownPaymentPercentage(Number(e.target.value))}
                                        className="flex-1 accent-purple-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="relative w-20">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={downPaymentPercentage}
                                            onChange={(e) => setDownPaymentPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                                            className="w-full bg-gray-900 border-gray-800 text-white text-center font-black h-10 rounded-lg focus:ring-purple-500/20 pr-6"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-black">%</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    {[0, 10, 20, 25, 30, 40, 50].map(pct => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setDownPaymentPercentage(pct)}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all border uppercase tracking-widest ${downPaymentPercentage === pct
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40 scale-105'
                                                : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                                                }`}
                                        >
                                            {pct === 0 ? (language === 'ar' ? 'بدون' : 'None') : `${pct}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer - Sticky */}
                        <div className="p-6 border-t border-gray-800 flex gap-3 bg-gray-900/50 flex-shrink-0">
                            <Button
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-12 rounded-xl border border-gray-800 text-gray-400 font-black hover:bg-gray-800 hover:text-white"
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={(!nameAr && !nameEn) || !categoryId || createCollection.isPending || updateCollection.isPending}
                                className="flex-1 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-lg shadow-purple-900/20"
                            >
                                {(createCollection.isPending || updateCollection.isPending) ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
