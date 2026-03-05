import axios from 'axios';

const isProd = import.meta.env.PROD;
const baseURL = import.meta.env.VITE_API_URL || (isProd ? '' : 'http://localhost:3001');

const api = axios.create({
    baseURL: baseURL === '' ? '/api' : (baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`),
    withCredentials: true,
});

// Request Interceptor: Attach token to headers if available
api.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('app_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Capture token from response body
api.interceptors.response.use((response: any) => {
    if (response.data && response.data.token) {
        console.log('📝 Debug: Token captured from response, saving to localStorage');
        localStorage.setItem('app_token', response.data.token);
    }
    return response;
}, (error: any) => {
    return Promise.reject(error);
});

export default api;

export const endpoints = {
    auth: {
        me: () => api.get('/auth/me'),
        logout: () => api.post('/auth/logout'),
        getProfile: () => api.get('/auth/profile').then(res => res.data),
        updateProfile: (data: any) => api.post('/auth/profile', data).then(res => res.data),
    },
    products: {
        list: (params?: any) => api.get('/products', { params }).then(res => res.data),
        create: (data: FormData) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data),
        featured: () => api.get('/products/featured').then(res => res.data),
        get: (id: number) => api.get(`/products/${id}`).then(res => res.data),
        update: (id: number, data: FormData) => api.patch(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data),
        delete: (id: number) => api.delete(`/products/${id}`).then(res => res.data),
        getColors: (productId: number) => api.get(`/products/${productId}/colors`).then(res => res.data),
        addColor: (productId: number, data: any) => api.post(`/products/${productId}/colors`, data).then(res => res.data),
        updateColor: (colorId: number, data: any) => api.patch(`/products/colors/${colorId}`, data).then(res => res.data),
        removeColor: (colorId: number) => api.delete(`/products/colors/${colorId}`).then(res => res.data),
    },
    reviews: {
        product: {
            list: (productId: number) => api.get(`/reviews/product/${productId}`).then(res => res.data),
            create: (data: { productId: number; rating: number; title?: string; comment?: string }) =>
                api.post('/reviews/product', data).then(res => res.data),
        },
    },
    categories: {
        list: () => api.get('/categories').then(res => res.data),
        get: (id: number) => api.get(`/categories/${id}`).then(res => res.data),
        create: (data: any) => api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data),
        update: (id: number, data: any) => api.patch(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data),
        delete: (id: number) => api.delete(`/categories/${id}`).then(res => res.data),
    },
    cart: {
        get: () => api.get('/cart').then(res => res.data),
        add: (productId: number, quantity: number, size?: string, color?: string) => api.post('/cart', { productId, quantity, size, color }).then(res => res.data),
        update: (cartItemId: number, quantity: number) => api.post('/cart/update', { cartItemId, quantity }).then(res => res.data),
        remove: (cartItemId: number) => api.delete(`/cart/${cartItemId}`).then(res => res.data),
        clear: () => api.post('/cart/clear').then(res => res.data),
    },
    orders: {
        list: (params?: Record<string, any>) => api.get('/orders', { params }).then(res => res.data),
        get: (id: number) => api.get(`/orders/${id}`).then(res => res.data),
        create: (data: any) => api.post('/orders', data).then(res => res.data),
        updateStatus: (id: number, status: string) => api.patch(`/orders/${id}/status`, { status }).then(res => res.data),
        payOrder: (id: number, paymentMethod: string, giftCardCode?: string) =>
            api.post(`/orders/${id}/pay`, { paymentMethod, giftCardCode }).then(res => res.data),
    },

    collections: {
        list: (categoryId?: number) => api.get('/collections', { params: { categoryId } }).then(res => res.data),
        get: (id: number) => api.get(`/collections/${id}`).then(res => res.data),
        create: (data: any) => api.post('/collections', data).then(res => res.data),
        update: (id: number, data: any) => api.patch(`/collections/${id}`, data).then(res => res.data),
        delete: (id: number) => api.delete(`/collections/${id}`).then(res => res.data),
    },
    offers: {
        list: () => api.get('/offers').then(res => res.data),
        get: (id: number) => api.get(`/offers/${id}`).then(res => res.data),
        create: (data: any) => api.post('/offers', data).then(res => res.data),
        update: (id: number, data: any) => api.patch(`/offers/${id}`, data).then(res => res.data),
        delete: (id: number) => api.delete(`/offers/${id}`).then(res => res.data),
    },
    content: {
        list: (type: string) => api.get('/content', { params: { type } }).then(res => res.data),
        update: (id: number, data: any) => api.patch(`/content/${id}`, data).then(res => res.data),
        setupInstagram: (token: string) => api.post('/content/instagram/setup', { token }).then(res => res.data),
        syncInstagram: () => api.post('/content/instagram/sync').then(res => res.data),
    },
    storeReviews: {
        list: () => api.get('/store-reviews').then(res => res.data),
        create: (data: any) => api.post('/store-reviews', data).then(res => res.data),
    },
    coupons: {
        create: (data: any) => api.post('/coupons', data).then(res => res.data),
        list: () => api.get('/coupons').then(res => res.data),
        validate: (code: string) => api.post('/coupons/validate', { code }).then(res => res.data),
        delete: (id: number) => api.delete(`/coupons/${id}`).then(res => res.data),
        update: (id: number, data: any) => api.patch(`/coupons/${id}`, data).then(res => res.data),
    },
    shipping: {
        list: () => api.get('/shipping').then(res => res.data),
        getByProduct: (productId: number) => api.get(`/shipping/product/${productId}`).then(res => res.data),
        upsert: (productId: number, shippingCost: number) => api.post('/shipping', { productId, shippingCost }).then(res => res.data),
        delete: (productId: number) => api.delete(`/shipping/${productId}`).then(res => res.data),
        export: () => api.get('/shipping/export', { responseType: 'blob' }).then(res => res.data),
        import: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post('/shipping/import', formData).then(res => res.data);
        },
    },
    notifications: {
        list: () => api.get('/notifications').then(res => res.data),
        getUnreadCount: () => api.get('/notifications/unread-count').then(res => res.data),
        markAsRead: (id: number) => api.patch(`/notifications/${id}/read`).then(res => res.data),
        markAllAsRead: () => api.patch('/notifications/read-all').then(res => res.data),
    },
    chat: {
        conversations: () => api.get('/chat/conversations').then(res => res.data),
        getMessages: (conversationId: number) => api.get(`/chat/messages/${conversationId}`).then(res => res.data),
        sendMessage: (data: { conversationId?: number; content: string; userId?: number }) => api.post('/chat/messages', data).then(res => res.data),
        start: (data: { content: string }) => api.post('/chat/start', data).then(res => res.data),
        unreadCount: () => api.get('/chat/unread-count').then(res => res.data),
        markRead: (id: number) => api.patch(`/chat/conversations/${id}/read`).then(res => res.data),
    },
    admin: {
        getCustomers: () => api.get('/admin/customers').then(res => res.data),
        updateCustomerStatus: (id: number, status: string) => api.patch(`/admin/customers/${id}/status`, { status }).then(res => res.data),
        deleteCustomer: (id: number) => api.delete(`/admin/customers/${id}`).then(res => res.data),
        getCustomerStatusLogs: (id: number) => api.get(`/admin/customers/${id}/status-logs`).then(res => res.data),
        getOrders: () => api.get('/admin/orders').then(res => res.data),
        getProducts: (search?: string) => api.get('/admin/products', { params: { search } }).then(res => res.data),
        globalSearch: (q: string) => api.get('/admin/search', { params: { q } }).then(res => res.data),
        exportCustomers: () => api.get('/admin/export/customers', { responseType: 'blob' }).then(res => res.data),
        importCustomers: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post('/admin/import/customers', formData).then(res => res.data);
        },
        reports: {
            getCommissions: () => api.get('/admin/reports/commissions').then(res => res.data),
            getAnalytics: () => api.get('/admin/reports/analytics').then(res => res.data),
        },
        seedCatalog: () => api.get('/admin/catalog/seed-tech').then(res => res.data),
    },
    ai: {
        analyzeAnalytics: (data: any) => api.post('/ai/analyze-analytics', data).then(res => res.data),
    },
    wishlist: {
        list: () => api.get('/wishlist').then(res => res.data),
        add: (productId: number) => api.post('/wishlist', { productId }).then(res => res.data),
        remove: (productId: number) => api.delete(`/wishlist/${productId}`).then(res => res.data),
        check: (productId: number) => {
            if (!productId || productId <= 0 || isNaN(productId)) {
                return Promise.resolve({ isFavorite: false });
            }
            return api.get(`/wishlist/check/${productId}`).then(res => res.data);
        },
        getSettings: () => api.get('/wishlist/settings').then(res => res.data),
        updateSettings: (isPublic: boolean) => api.post('/wishlist/settings', { isPublic }).then(res => res.data),
        getShared: (token: string) => api.get(`/wishlist/shared/${token}`).then(res => res.data),
    },
    wallets: {
        getMyWallet: () => api.get('/wallets/my-wallet').then(res => res.data),
        redeem: (code: string) => api.post('/gift-cards/redeem', { code }).then(res => res.data),
        topUp: (amount: number, referenceId: string) => api.post('/wallets/top-up', { amount, referenceId }).then(res => res.data),
        confirmTopUp: (transactionId: number) => api.post('/wallets/confirm-top-up', { transactionId }).then(res => res.data),
    },

    points: {
        getMyPoints: () => api.get('/points/my-points').then(res => res.data),
    },
    installments: {
        list: () => api.get('/installments').then(res => res.data),
        active: (collectionId?: number) => api.get('/installments/active', { params: { collectionId } }).then(res => res.data),
        create: (data: any) => api.post('/installments', data).then(res => res.data),
        update: (id: number, data: any) => api.patch(`/installments/${id}`, data).then(res => res.data),
        delete: (id: number) => api.delete(`/installments/${id}`).then(res => res.data),
    },
    paymentGateways: {
        listEnabled: () => api.get('/payment-gateways/enabled').then(res => res.data),
        listAll: () => api.get('/admin/payment-gateways').then(res => res.data),
        toggle: (id: number, isEnabled: boolean) => api.patch(`/admin/payment-gateways/${id}/toggle`, { isEnabled }).then(res => res.data),
        updateCredentials: (id: number, apiKey: string, publishableKey?: string, merchantId?: string, config?: any) =>
            api.patch(`/admin/payment-gateways/${id}/credentials`, { apiKey, publishableKey, merchantId, config }).then(res => res.data),
        seed: () => api.get('/admin/payment-gateways/seed').then(res => res.data),
    },
    giftCards: {
        list: () => api.get('/gift-cards').then(res => res.data),
        create: (data: any) => api.post('/gift-cards', data).then(res => res.data),
        delete: (id: number) => api.delete(`/gift-cards/${id}`).then(res => res.data),
        redeem: (code: string) => api.post('/gift-cards/redeem', { code }).then(res => res.data),
        purchase: (amount: number, recipientName?: string, paymentMethod?: string) => api.post('/gift-cards/purchase', { amount, recipientName, paymentMethod }).then(res => res.data),
        confirm: (giftCardId: number) => api.post('/gift-cards/confirm', { giftCardId }).then(res => res.data),
        getMyCards: () => api.get('/gift-cards/my-cards').then(res => res.data),
    },
    vendors: {
        getDashboard: () => api.get('/vendors/dashboard').then(res => res.data),
    },
};
