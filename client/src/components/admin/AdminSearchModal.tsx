import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Search, Store, Package, User, ShoppingBag,
    ArrowRight, Loader2
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminSearchModal() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { language } = useLanguage();
    const [, setLocation] = useLocation();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const { data: results, isLoading } = useQuery({
        queryKey: ["admin-global-search", search],
        queryFn: () => endpoints.admin.globalSearch(search),
        enabled: search.length > 1,
    });

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder={language === 'ar' ? "ابحث في كل شيء..." : "Search everything..."}
                onValueChange={setSearch}
            />
            <CommandList className="max-h-[500px]">
                <CommandEmpty>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        language === 'ar' ? "لا توجد نتائج." : "No results found."
                    )}
                </CommandEmpty>

                {results?.vendors?.length > 0 && (
                    <CommandGroup heading={language === 'ar' ? "المتاجر" : "Vendors"}>
                        {results.vendors.map((vendor: any) => (
                            <CommandItem
                                key={vendor.id}
                                onSelect={() => runCommand(() => setLocation(`/admin-dashboard?tab=vendors&id=${vendor.id}`))}
                                className="gap-2"
                            >
                                <Store className="h-4 w-4" />
                                <span>{language === 'ar' ? vendor.storeNameAr : vendor.storeNameEn}</span>
                                <span className="ml-auto text-xs text-gray-400">{vendor.email}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results?.products?.length > 0 && (
                    <CommandGroup heading={language === 'ar' ? "المنتجات" : "Products"}>
                        {results.products.map((product: any) => (
                            <CommandItem
                                key={product.id}
                                onSelect={() => runCommand(() => setLocation(`/products/${product.id}`))}
                                className="gap-2"
                            >
                                <Package className="h-4 w-4" />
                                <span>{language === 'ar' ? product.nameAr : product.nameEn}</span>
                                <span className="ml-auto text-xs font-bold text-primary">{product.price} د.إ</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results?.customers?.length > 0 && (
                    <CommandGroup heading={language === 'ar' ? "العملاء" : "Customers"}>
                        {results.customers.map((customer: any) => (
                            <CommandItem
                                key={customer.id}
                                onSelect={() => runCommand(() => setLocation(`/admin-dashboard?tab=customers&id=${customer.id}`))}
                                className="gap-2"
                            >
                                <User className="h-4 w-4" />
                                <span>{customer.name}</span>
                                <span className="ml-auto text-xs text-gray-400">{customer.email}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {results?.orders?.length > 0 && (
                    <CommandGroup heading={language === 'ar' ? "الطلبات" : "Orders"}>
                        {results.orders.map((order: any) => (
                            <CommandItem
                                key={order.id}
                                onSelect={() => runCommand(() => setLocation(`/admin-dashboard?tab=orders&id=${order.id}`))}
                                className="gap-2"
                            >
                                <ShoppingBag className="h-4 w-4" />
                                <div className="flex flex-col">
                                    <span className="font-bold">#{order.orderNumber}</span>
                                    <span className="text-[10px] text-gray-400">{order.customerName}</span>
                                </div>
                                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                <CommandSeparator />
                <CommandGroup heading={language === 'ar' ? "الإجراءات السريعة" : "Quick Actions"}>
                    <CommandItem onSelect={() => runCommand(() => setLocation("/admin-dashboard?tab=vendors"))}>
                        <Store className="mr-2 h-4 w-4" />
                        {language === 'ar' ? "إدارة المتاجر" : "Manage Vendors"}
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setLocation("/admin-dashboard?tab=orders"))}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        {language === 'ar' ? "إدارة الطلبات" : "Manage Orders"}
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
