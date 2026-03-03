import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ""
}: EmptyStateProps) {
    return (
        <div className={`text-center py-16 px-4 bg-white rounded-[2rem] shadow-sm border border-gray-50 flex flex-col items-center justify-center ${className}`}>
            {Icon && (
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Icon className="w-10 h-10 text-gray-300" />
                </div>
            )}
            <h3 className="text-2xl font-black text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    variant="outline"
                    className="rounded-full px-8 h-12 font-bold border-2 hover:-white/5 hover:-primary hover:-primary/20 transition-all"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
