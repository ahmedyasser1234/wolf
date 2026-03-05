import { useState } from "react";
import { User, MessageSquare, Search, Mail, Download, Upload, FileSpreadsheet, Loader2, Trash2, ShieldOff, Shield, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface CustomersTabProps {
    vendorId: number;
}

export default function CustomersTab({ vendorId }: CustomersTabProps) {
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [messageOpen, setMessageOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [messageContent, setMessageContent] = useState("");
    const [sending, setSending] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'deactivated'>('all');
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [logsCustomer, setLogsCustomer] = useState<any>(null);

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['vendor', 'customers', vendorId],
        queryFn: () => endpoints.admin.getCustomers(),
    });

    const filteredCustomers = customers.filter((c: any) => {
        const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDuplicate = showDuplicatesOnly ? c.isDuplicate : true;
        const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;
        return matchesSearch && matchesDuplicate && matchesStatus;
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number, status: string }) => endpoints.admin.updateCustomerStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', 'customers', vendorId] });
            toast.success(language === 'ar' ? 'تم تحديث حالة الحساب بنجاح' : 'Account status updated successfully');
        },
        onError: () => {
            toast.error(language === 'ar' ? 'حدث خطأ أثناء تحديث حالة الحساب' : 'Error updating account status');
        }
    });

    const deleteCustomerMutation = useMutation({
        mutationFn: (id: number) => endpoints.admin.deleteCustomer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', 'customers', vendorId] });
            toast.success(language === 'ar' ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully');
            setDeleteConfirmId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || (language === 'ar' ? 'لا يمكن حذف حساب بطلبات نشطة' : 'Cannot delete account with active orders'));
            setDeleteConfirmId(null);
        }
    });

    const { data: statusLogs = [], isLoading: logsLoading } = useQuery({
        queryKey: ['customer-status-logs', logsCustomer?.id],
        queryFn: () => endpoints.admin.getCustomerStatusLogs(logsCustomer.id),
        enabled: !!logsCustomer,
    });

    const getStatusBadge = (status: string) => {
        if (status === 'blocked') return <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30">{language === 'ar' ? 'محظور' : 'Blocked'}</span>;
        if (status === 'deactivated') return <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded-full border border-orange-400/30">{language === 'ar' ? 'معطّل' : 'Deactivated'}</span>;
        return null;
    };

    const handleSendMessage = async () => {
        if (!messageContent.trim()) return;

        setSending(true);
        try {
            await api.post('/chat/messages', {
                userId: selectedCustomer.id,
                content: messageContent
            });

            toast.success(t('messageSent'));
            setMessageOpen(false);
            setMessageContent("");
        } catch (error) {
            console.error(error);
            toast.error(t('errorSendingMessage'));
        } finally {
            setSending(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await endpoints.admin.exportCustomers();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'customers.xlsx');
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
            await endpoints.admin.importCustomers(file);
            toast.success(language === 'ar' ? 'تم استيراد البيانات بنجاح' : 'Data imported successfully');
            // Refresh customers list
            window.location.reload();
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
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">{t('customers')}</h2>
                    <p className="text-gray-400 font-bold">{filteredCustomers.length} {t('activeCustomers')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={exporting}
                        className="h-11 px-6 rounded-xl border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800 hover:text-white font-bold shadow-lg"
                    >
                        {exporting ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Download className="w-5 h-5 ml-2" />}
                        {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                    </Button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            id="import-customers"
                            className="hidden"
                            onChange={handleImport}
                        />
                        <Button
                            variant="outline"
                            asChild
                            disabled={importing}
                            className="h-11 px-6 rounded-xl border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800 hover:text-white cursor-pointer font-bold shadow-lg"
                        >
                            <label htmlFor="import-customers" className="flex items-center gap-3">
                                {importing ? <Loader2 className="w-5 h-5 ml-2 animate-spin" /> : <Upload className="w-5 h-5 ml-2" />}
                                {language === 'ar' ? 'استيراد Excel' : 'Import Excel'}
                            </label>
                        </Button>
                    </div>
                    <Button
                        variant={showDuplicatesOnly ? "default" : "outline"}
                        onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                        className={`h-11 px-6 rounded-xl font-bold shadow-lg ${showDuplicatesOnly ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border-gray-800 bg-gray-900 text-amber-500 hover:bg-gray-800 hover:text-amber-400'}`}
                    >
                        {language === 'ar' ? 'حسابات مكررة محتملة' : 'Possible Duplicates'}
                    </Button>
                    {/* Status Filters */}
                    <div className="flex gap-1 rounded-xl bg-gray-900 border border-gray-800 p-1">
                        {(['all', 'active', 'blocked', 'deactivated'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statusFilter === s
                                        ? s === 'blocked' ? 'bg-red-600 text-white' :
                                            s === 'deactivated' ? 'bg-orange-600 text-white' :
                                                s === 'active' ? 'bg-green-700 text-white' :
                                                    'bg-purple-700 text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {s === 'all' ? (language === 'ar' ? 'الكل' : 'All') :
                                    s === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
                                        s === 'blocked' ? (language === 'ar' ? 'محظور' : 'Blocked') :
                                            (language === 'ar' ? 'معطّل' : 'Deactivated')}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                        <Input
                            placeholder={t('searchCustomers')}
                            className="pr-12 h-11 rounded-xl border-gray-800 bg-gray-900 text-white focus:ring-2 focus:ring-purple-500/50 font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-background rounded-[2rem] border border-gray-800 shadow-sm overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-800 border-b border-gray-700">
                            <tr>
                                <th className="py-4 px-6 text-right font-black text-white text-sm uppercase tracking-wider">{t('customer')}</th>
                                <th className="py-4 px-6 text-right font-black text-white text-sm uppercase tracking-wider">{t('contactInfo')}</th>
                                <th className="py-4 px-6 text-center font-black text-white text-sm uppercase tracking-wider">{t('totalOrders')}</th>
                                <th className="py-4 px-6 text-center font-black text-white text-sm uppercase tracking-wider">{t('totalSpent')}</th>
                                <th className="py-4 px-6 text-center font-black text-white text-sm uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer: any) => (
                                    <tr key={customer.id} className="group hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0 text-start">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 font-black">
                                                    {customer.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white flex items-center gap-2">
                                                        {customer.name || t('guest')}
                                                        {customer.isDuplicate && (
                                                            <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30">
                                                                {language === 'ar' ? 'مكرر محتمل' : 'Duplicate'}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-white capitalize flex items-center gap-2">
                                                        {t('customer')}
                                                        {getStatusBadge(customer.status)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-100 flex items-center gap-2">
                                                    <Mail className="w-3 h-3 text-purple-400" /> {customer.email}
                                                </p>
                                                {customer.phone && (
                                                    <p className="text-xs text-white dir-ltr text-right font-bold">{customer.phone}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 font-bold text-xs">
                                                {customer.totalOrders} {t('orders')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <p className="font-black text-white">
                                                {Math.round(customer.totalSpent).toLocaleString()} {t('currency')}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-white hover:text-purple-400 hover:bg-purple-900/30" onClick={() => { setSelectedCustomer(customer); setMessageOpen(true); }}>
                                                    <MessageSquare className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className={`h-9 px-3 rounded-xl font-bold text-xs ${customer.status === 'blocked' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`} onClick={() => toggleStatusMutation.mutate({ id: customer.id, status: customer.status === 'blocked' ? 'active' : 'blocked' })} disabled={toggleStatusMutation.isPending}>
                                                    {customer.status === 'blocked' ? (language === 'ar' ? 'رفع الحظر' : 'Unblock') : (language === 'ar' ? 'حظر' : 'Block')}
                                                </Button>
                                                <Button variant="ghost" size="sm" className={`h-9 px-3 rounded-xl font-bold text-xs ${customer.status === 'deactivated' ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'}`} onClick={() => toggleStatusMutation.mutate({ id: customer.id, status: customer.status === 'deactivated' ? 'active' : 'deactivated' })} disabled={toggleStatusMutation.isPending}>
                                                    {customer.status === 'deactivated' ? (language === 'ar' ? 'تفعيل' : 'Activate') : (language === 'ar' ? 'تعطيل' : 'Deactivate')}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-900/20" onClick={() => setLogsCustomer(customer)} title="Status Logs">
                                                    <History className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-900/20" onClick={() => setDeleteConfirmId(customer.id)} title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-white font-bold">
                                        {t('noCustomersFound')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden space-y-4 p-4">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer: any) => (
                            <div key={customer.id} className="bg-background rounded-2xl border border-gray-800 p-5 shadow-sm space-y-4 relative overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 font-black text-lg shrink-0">
                                        {customer.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-white truncate flex items-center gap-2">
                                            {customer.name || t('guest')}
                                            {customer.isDuplicate && (
                                                <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                                                    {language === 'ar' ? 'مكرر محتمل' : 'Duplicate'}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-white truncate flex items-center gap-1.5 mt-0.5">
                                            <Mail className="w-3 h-3" />
                                            {customer.email}
                                            {getStatusBadge(customer.status) && <span className="ms-1">{getStatusBadge(customer.status)}</span>}
                                        </p>
                                        {customer.phone && (
                                            <p className="text-xs text-white dir-ltr text-right mt-0.5">{customer.phone}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-10 h-10 rounded-full text-purple-400 bg-purple-900/30 hover:bg-purple-900/50"
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setMessageOpen(true);
                                        }}
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-800 relative z-10">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-white uppercase mb-1">{t('totalOrders')}</p>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 font-black text-xs">
                                            {customer.totalOrders} {t('orders')}
                                        </span>
                                    </div>
                                    <div className="text-center border-l border-gray-800 border-r-0 rtl:border-r rtl:border-l-0">
                                        <p className="text-[10px] font-bold text-white uppercase mb-1">{t('totalSpent')}</p>
                                        <p className="font-black text-white">
                                            {Math.round(customer.totalSpent).toLocaleString()} <span className="text-xs font-medium text-white">{t('currency')}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-2 relative z-10">
                                    <Button variant="ghost" size="sm" className={`h-9 rounded-xl font-bold text-xs ${customer.status === 'blocked' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`} onClick={() => toggleStatusMutation.mutate({ id: customer.id, status: customer.status === 'blocked' ? 'active' : 'blocked' })} disabled={toggleStatusMutation.isPending}>
                                        {customer.status === 'blocked' ? (language === 'ar' ? 'رفع الحظر' : 'Unblock') : (language === 'ar' ? 'حظر' : 'Block')}
                                    </Button>
                                    <Button variant="ghost" size="sm" className={`h-9 rounded-xl font-bold text-xs ${customer.status === 'deactivated' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`} onClick={() => toggleStatusMutation.mutate({ id: customer.id, status: customer.status === 'deactivated' ? 'active' : 'deactivated' })} disabled={toggleStatusMutation.isPending}>
                                        {customer.status === 'deactivated' ? (language === 'ar' ? 'تفعيل' : 'Activate') : (language === 'ar' ? 'تعطيل' : 'Deactivate')}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-9 rounded-xl font-bold text-xs text-blue-400 bg-blue-900/20" onClick={() => setLogsCustomer(customer)}>
                                        <History className="w-3 h-3 me-1" /> {language === 'ar' ? 'السجل' : 'Logs'}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-9 rounded-xl font-bold text-xs text-red-400 bg-red-900/20" onClick={() => setDeleteConfirmId(customer.id)}>
                                        <Trash2 className="w-3 h-3 me-1" /> {language === 'ar' ? 'حذف' : 'Delete'}
                                    </Button>
                                </div>
                                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-900/20 rounded-full opacity-50 z-0 pointer-events-none" />
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center text-white font-bold bg-gray-900 rounded-2xl border border-dashed border-gray-800">
                            {t('noCustomersFound')}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                <DialogContent className="max-w-md rounded-[2rem] bg-background border border-gray-800 shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-right text-xl font-black text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                            {t('sendMessageTo')} {selectedCustomer?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            placeholder={t('writeMessageHere')}
                            className="min-h-[120px] rounded-xl border-gray-800 bg-gray-900 text-white focus:ring-purple-500 resize-none p-4"
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl font-bold border-gray-800 bg-gray-900 text-white hover:bg-gray-800 hover:text-white transition-colors"
                                onClick={() => setMessageOpen(false)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={handleSendMessage}
                                disabled={!messageContent.trim() || sending}
                            >
                                {sending ? t('sending') : t('send')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="max-w-sm rounded-[2rem] bg-background border border-gray-800 shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-right text-xl font-black text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                            {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-400 font-bold text-right text-sm mt-2">
                        {language === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟ لن يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this account? This action cannot be undone.'}
                    </p>
                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-gray-800 bg-gray-900 text-white" onClick={() => setDeleteConfirmId(null)}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteConfirmId && deleteCustomerMutation.mutate(deleteConfirmId)} disabled={deleteCustomerMutation.isPending}>
                            {deleteCustomerMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : (language === 'ar' ? 'حذف' : 'Delete')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Status Logs Modal */}
            <Dialog open={!!logsCustomer} onOpenChange={(open) => !open && setLogsCustomer(null)}>
                <DialogContent className="max-w-lg rounded-[2rem] bg-background border border-gray-800 shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-right text-xl font-black text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            {language === 'ar' ? `سجل تغييرات الحساب - ${logsCustomer?.name}` : `Status History - ${logsCustomer?.name}`}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                        {logsLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-white" /></div>
                        ) : statusLogs.length === 0 ? (
                            <p className="text-gray-400 text-center font-bold py-8">{language === 'ar' ? 'لا يوجد سجل تغييرات' : 'No status changes recorded'}</p>
                        ) : (
                            (statusLogs as any[]).map((log: any) => (
                                <div key={log.id} className="bg-gray-900 rounded-xl p-4 text-right">
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        {getStatusBadge(log.newStatus) || <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">{language === 'ar' ? 'نشط' : 'Active'}</span>}
                                        <span className="text-gray-400 text-xs">←</span>
                                        {getStatusBadge(log.oldStatus) || <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">{language === 'ar' ? 'نشط' : 'Active'}</span>}
                                    </div>
                                    <p className="text-xs text-gray-500">{log.adminName || log.adminEmail} • {new Date(log.changedAt).toLocaleString()}</p>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
