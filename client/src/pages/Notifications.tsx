import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Bell,
  Package,
  Truck,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";

interface Notification {
  id: number;
  type: "order" | "shipment" | "alert" | "info";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Remove mock data
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { toast } from "sonner";

export default function Notifications() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => endpoints.notifications.list(),
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => endpoints.notifications.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => endpoints.notifications.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success(language === 'ar' ? "تم تحديث الكل كمقروء" : "All marked as read");
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            يجب تسجيل الدخول لعرض الإشعارات
          </h1>
          <Link href="/">
            <Button>العودة للرئيسية</Button>
          </Link>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const filteredNotifications = notifications.filter((notif: any) => {
    if (filter === "unread") return !notif.isRead;
    return true;
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    // Implement delete endpoint if available, currently just UI removal?
    // endpoints.notifications.delete(id);
    toast.info("Delete feature not implemented yet in backend");
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="w-5 h-5 text-blue-600" />;
      case "shipment":
        return <Truck className="w-5 h-5 text-purple-600" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "info":
        return <Info className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-50 border-l-4 border-blue-600";
      case "shipment":
        return "bg-purple-50 border-l-4 border-purple-600";
      case "alert":
        return "bg-red-50 border-l-4 border-red-600";
      case "info":
        return "bg-green-50 border-l-4 border-green-600";
      default:
        return "bg-gray-50 border-l-4 border-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 h-10 w-10">
                  {language === 'ar' ? <ArrowRight className="w-6 h-6 text-gray-600" /> : <ArrowLeft className="w-6 h-6 text-gray-600" />}
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">الإشعارات</h1>
                {unreadCount > 0 && (
                  <p className="text-gray-600 mt-1">
                    لديك {unreadCount} إشعار{unreadCount > 1 ? "ات" : ""} جديد{unreadCount > 1 ? "ة" : ""}
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline">
                <Check className="w-4 h-4 ml-2" />
                تحديث الكل كمقروء
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-600" : ""}
          >
            الكل ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "bg-blue-600" : ""}
          >
            غير مقروء ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              {filter === "unread" ? (language === 'ar' ? "لا توجد إشعارات جديدة" : "No new notifications") : (language === 'ar' ? "لا توجد إشعارات" : "No notifications")}
            </h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
              {filter === "unread"
                ? (language === 'ar' ? "لقد قرأت جميع إشعاراتك، تفقدي الكل لرؤية الأقدم" : "You've read all your notifications, check all to see older ones")
                : (language === 'ar' ? "لم تتلقي أي إشعارات نظام حتى الآن، سنخبركِ هنا بكل جديد" : "You haven't received any system notifications yet")}
            </p>
            <Link href="/">
              <Button className="rounded-full px-8 bg-gray-900 hover:bg-gray-800">
                {language === 'ar' ? "العودة للتسوق" : "Back to Shopping"}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification: any) => (
              <Card
                key={notification.id}
                className={`border-0 shadow-sm ${getNotificationColor(notification.type)} ${!notification.isRead ? "ring-2 ring-blue-200" : ""
                  }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString("ar-SA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{notification.message}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {notification.actionUrl && (
                          <Link href={notification.actionUrl}>
                            <Button size="sm" variant="outline" className="text-black border-gray-300 hover:bg-gray-100">
                              عرض التفاصيل
                            </Button>
                          </Link>
                        )}
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-black hover:bg-gray-100"
                          >
                            <Check className="w-4 h-4 ml-1" />
                            تحديث كمقروء
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
