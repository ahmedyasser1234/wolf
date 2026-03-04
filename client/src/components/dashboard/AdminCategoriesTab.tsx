import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Image as ImageIcon,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export default function AdminCategoriesTab({
    showConfirm,
    initialAddOpen,
    onModalClose
}: {
    showConfirm: (title: string, description: string, onConfirm: () => void) => void;
    initialAddOpen?: boolean;
    onModalClose?: () => void;
}) {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t, language } = useLanguage();

    useEffect(() => {
        if (initialAddOpen) {
            setIsModalOpen(true);
            if (onModalClose) onModalClose();
        }
    }, [initialAddOpen, onModalClose]);

    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [nameAr, setNameAr] = useState("");
    const [nameEn, setNameEn] = useState("");
    const [descriptionAr, setDescriptionAr] = useState("");
    const [descriptionEn, setDescriptionEn] = useState("");
    const [image, setImage] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [search, setSearch] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => endpoints.categories.list(),
    });

    const createCategory = useMutation({
        mutationFn: (data: FormData) => endpoints.categories.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(t('categoryCreated'));
        },
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => endpoints.categories.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsModalOpen(false);
            resetForm();
            toast.success(t('categoryUpdated'));
        },
    });

    const deleteCategory = useMutation({
        mutationFn: (id: number) => endpoints.categories.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success(t('categoryDeleted'));
        },
    });

    const resetForm = () => {
        setNameAr("");
        setNameEn("");
        setDescriptionAr("");
        setDescriptionEn("");
        setImage("");
        setImageFile(null);
        setEditingCategory(null);
    };

    const handleSubmit = () => {
        const formData = new FormData();
        formData.append("nameAr", nameAr);
        formData.append("nameEn", nameEn);
        formData.append("descriptionAr", descriptionAr);
        formData.append("descriptionEn", descriptionEn);
        formData.append("image", image);
        if (imageFile) {
            formData.append("image", imageFile);
        }

        if (editingCategory) {
            updateCategory.mutate({ id: editingCategory.id, data: formData });
        } else {
            createCategory.mutate(formData);
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

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setNameAr(category.nameAr || "");
        setNameEn(category.nameEn || "");
        setDescriptionAr(category.descriptionAr || "");
        setDescriptionEn(category.descriptionEn || "");
        setImage(category.image || "");
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number, category: any) => {
        const displayName = category.nameAr || category.nameEn;
        showConfirm(
            t('deleteCategory'),
            `${t('deleteCategoryConfirm')} "${displayName}"?`,
            () => deleteCategory.mutate(id)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-black text-white">{t('manageCategories')}</h2>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Plus size={18} className="mr-2" />
                    {t('addCategory')}
                </Button>
            </div>

            <Card className="border border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] bg-background shadow-none overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                        <div className="relative w-full md:w-64">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                            <Input
                                type="text"
                                placeholder={t('searchCategory')}
                                className={`${language === 'ar' ? 'pr-10' : 'pl-10'} bg-gray-900 border-gray-800 text-white font-bold h-11 sm:h-12 rounded-xl text-base`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="py-3 px-6 font-semibold text-white text-start w-16">{t('image')}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-start">{t('categoryName')}</th>
                                    <th className="py-3 px-6 font-semibold text-white text-end">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-800">
                                            <td className="py-4 px-6"><Skeleton className="h-10 w-10 rounded-lg bg-gray-800" /></td>
                                            <td className="py-4 px-6"><Skeleton className="h-4 w-48 bg-gray-800" /></td>
                                            <td className="py-4 px-6"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-lg bg-gray-800" /></div></td>
                                        </tr>
                                    ))
                                ) : (
                                    categories
                                        ?.filter((c: any) =>
                                            (c.nameAr || '').toLowerCase().includes(search.toLowerCase()) ||
                                            (c.nameEn || '').toLowerCase().includes(search.toLowerCase())
                                        )
                                        .map((category: any) => (
                                            <tr key={category.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-900 overflow-hidden border border-gray-800 flex items-center justify-center">
                                                        {category.image ? (
                                                            <img src={category.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-gray-500" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-medium text-white">
                                                    {language === 'ar' ? (category.nameAr || category.nameEn) : (category.nameEn || category.nameAr)}
                                                </td>
                                                <td className="py-4 px-6 text-end">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(category)}
                                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(category.id, category)}
                                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-background rounded-[1.5rem] md:rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
                        <div className="p-5 sm:p-6 border-b border-gray-800">
                            <h3 className="text-lg sm:text-xl font-bold text-white">
                                {editingCategory ? t('editCategory') : t('addNewCategory')}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex flex-col items-center gap-4 mb-6">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-32 h-32 rounded-2xl bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-purple-300 transition-all"
                                >
                                    {image ? (
                                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={32} className="text-gray-300 group-hover:text-purple-400" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    {t('uploadImage')}
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">{t('categoryNameAr')}</label>
                                    <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="اسم القسم بالعربية" className="bg-gray-900 border-gray-800 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">{t('categoryNameEn')}</label>
                                    <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Category name in English" className="text-left bg-gray-900 border-gray-800 text-white" />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">{t('categoryDescAr')}</label>
                                    <Input value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder="وصف المختصر بالعربية" className="bg-gray-900 border-gray-800 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300">{t('categoryDescEn')}</label>
                                    <Input value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Short description in English" className="text-left bg-gray-900 border-gray-800 text-white" />
                                </div>
                            </div>

                        </div>

                        <div className="p-6 border-t border-gray-800 flex gap-3">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800">
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={(!nameAr && !nameEn) || createCategory.isPending || updateCategory.isPending}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {(createCategory.isPending || updateCategory.isPending) ? <Loader2 className="animate-spin" /> : (language === 'ar' ? 'حفظ' : 'Save')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
