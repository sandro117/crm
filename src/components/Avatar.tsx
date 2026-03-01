import clsx from 'clsx';

// Let's create a specific color generator for avatars to ensure pastel backgrounds and darker text
function getAvatarColors(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // HSL colors - Pastel backgrounds (high lightness, medium saturation)
    const h = Math.abs(hash) % 360;
    const s = 65; // Saturation
    const l = 85; // Lightness for background

    // Darker lightness for text to ensure contrast
    const textL = 30;

    return {
        bg: `hsl(${h}, ${s}%, ${l}%)`,
        text: `hsl(${h}, ${s}%, ${textL}%)`
    };
}

function getInitials(name: string) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

interface AvatarProps {
    name: string;
    url?: string;
    className?: string;
}

export function Avatar({ name, url, className }: AvatarProps) {
    const initials = getInitials(name);
    const colors = getAvatarColors(name);

    return (
        <div
            className={clsx(
                "relative flex items-center justify-center shrink-0 rounded-full font-bold overflow-hidden border border-white/50 shadow-sm",
                className
            )}
            style={{
                backgroundColor: url ? 'transparent' : colors.bg,
                color: colors.text
            }}
        >
            {url ? (
                <img src={url} alt={name} className="w-full h-full object-cover" />
            ) : (
                <span className="opacity-90 tracking-wider">{initials}</span>
            )}
        </div>
    );
}
