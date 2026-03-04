import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";

export function useAddToCart() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { productId: number; quantity: number; color?: string; product?: any }) => {
            if (!user) {
                // Guest handling: save to localStorage
                const guestItemsRaw = localStorage.getItem('fustan-guest-items');
                let guestItems = [];
                if (guestItemsRaw) {
                    try {
                        guestItems = JSON.parse(guestItemsRaw);
                    } catch (e) {
                        guestItems = [];
                    }
                }

                if (!Array.isArray(guestItems)) {
                    guestItems = [];
                }

                // Check if item already exists to update quantity
                const existingIndex = guestItems.findIndex((item: any) =>
                    item.productId === data.productId &&
                    item.color === data.color
                );

                if (existingIndex !== -1) {
                    guestItems[existingIndex].quantity += data.quantity;
                    // Update metadata if it was missing or to ensure it's fresh
                    if (data.product) {
                        guestItems[existingIndex].product = {
                            ...guestItems[existingIndex].product,
                            ...data.product
                        };
                    }
                } else {
                    // Store product metadata if provided
                    const newItem = {
                        productId: data.productId,
                        quantity: data.quantity,
                        color: data.color,
                        id: Date.now() + Math.random(), // Temporary ID
                        product: data.product ? {
                            id: data.product.id,
                            nameAr: data.product.nameAr,
                            nameEn: data.product.nameEn,
                            price: data.product.price,
                            images: data.product.images,
                            discount: data.product.discount,
                            category: data.product.category
                        } : null
                    };
                    guestItems.push(newItem);
                }

                localStorage.setItem('fustan-guest-items', JSON.stringify(guestItems));
                return { guest: true };
            }

            // Logged in user: use API
            return endpoints.cart.add(data.productId, data.quantity, undefined, data.color);
        },
        onSuccess: () => {
            toast.success(t('addedToCart'));
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            // Dispatch custom event for navbar reactivity (for guests)
            window.dispatchEvent(new CustomEvent('fustan-cart-updated'));
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || t('failedToAdd');
            toast.error(message);
        }
    });
}
