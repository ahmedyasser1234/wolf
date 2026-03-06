import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface CategoryNavItem {
    id: number | string;
    name: string;
    isActive: boolean;
    onClick: () => void;
}

interface CategoryNavProps {
    items: CategoryNavItem[];
}

export function CategoryNav({ items }: CategoryNavProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative group w-full bg-[#0A0A0A] border-b border-white/5 shadow-sm z-20">
            <div className="container mx-auto relative px-4">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#0A0A0A]/90 p-2 rounded-full shadow-md hover:bg-[#0A0A0A] border border-white/10 transition-opacity opacity-0 group-hover:opacity-100 disabled:opacity-0"
                >
                    <ChevronLeft className="w-5 h-5 text-white/80" />
                </button>

                {/* Scroll Container */}
                <div
                    ref={scrollRef}
                    className="flex items-center gap-4 overflow-x-auto py-6 px-8 scrollbar-hide no-scrollbar scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-base font-bold transition-all duration-300 border ${item.isActive
                                ? 'bg-primary text-background border-primary shadow-lg shadow-primary/40'
                                : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#0A0A0A]/90 p-2 rounded-full shadow-md hover:bg-[#0A0A0A] border border-white/10 transition-opacity opacity-0 group-hover:opacity-100"
                >
                    <ChevronRight className="w-5 h-5 text-white/80" />
                </button>
            </div>
        </div>
    );
}
