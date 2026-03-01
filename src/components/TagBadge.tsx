import clsx from 'clsx';
import { Tag as TagIcon, X } from 'lucide-react';
import type { Tag } from '../store/useCrmStore';

interface TagBadgeProps {
    tag: Tag;
    onRemove?: () => void;
    showIcon?: boolean;
    className?: string;
}

export function TagBadge({ tag, onRemove, showIcon, className }: TagBadgeProps) {
    return (
        <span
            className={clsx("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-sm transition-all hover:shadow-md", className)}
            style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: `${tag.color}40`
            }}
        >
            {showIcon && <TagIcon className="w-2.5 h-2.5 opacity-70" />}
            {tag.name}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="hover:bg-black/10 dark:hover:bg-white/20 rounded-full p-0.5 transition-colors focus:outline-none"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
