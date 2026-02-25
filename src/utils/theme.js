export const CATEGORIES = {
    ELITE: 'elite',
    GOOD: 'good',
    BETTER: 'better',
    IMPROVING: 'improving',
    NOTHING: 'nothing',
    // Parenting
    FEEDING: 'feeding',
    SLEEPING: 'sleeping',
    DIAPER: 'diaper',
    PLAY: 'play',

    // New Categories
    DEEP_WORK: 'deep_work',
    LOGISTICS: 'logistics',
    PHYSICAL: 'physical',
    PERSONAL: 'personal',
    NOTE: 'note',
    REMINDER: 'reminder'
};

export const THEME = {
    [CATEGORIES.ELITE]: { color: '#00ff88', label: 'Elite', icon: 'zap' },
    [CATEGORIES.GOOD]: { color: '#4ade80', label: 'Good', icon: 'check' },
    [CATEGORIES.BETTER]: { color: '#facc15', label: 'Better', icon: 'trend-up' },
    [CATEGORIES.IMPROVING]: { color: '#60a5fa', label: 'Improving', icon: 'book' },
    [CATEGORIES.NOTHING]: { color: '#ef4444', label: 'Doing Nothing', icon: 'clock' },

    // Parenting Themes
    [CATEGORIES.FEEDING]: { color: '#ff80ab', label: 'Feeding', icon: 'heart' },
    [CATEGORIES.SLEEPING]: { color: '#c5cae9', label: 'Sleeping', icon: 'moon' },
    [CATEGORIES.DIAPER]: { color: '#b388ff', label: 'Diaper Change', icon: 'refresh-ccw' },
    [CATEGORIES.PLAY]: { color: '#ffff8d', label: 'Play Time', icon: 'smile' },

    // New Categories (User Requested)
    [CATEGORIES.DEEP_WORK]: { color: '#68D391', label: 'Deep Work', icon: 'cpu' }, // Green-ish
    [CATEGORIES.LOGISTICS]: { color: '#63B3ED', label: 'Logistics', icon: 'briefcase' }, // Blue-ish
    [CATEGORIES.PHYSICAL]: { color: '#F6AD55', label: 'Physical', icon: 'activity' }, // Orange-ish
    [CATEGORIES.PERSONAL]: { color: '#A0AEC0', label: 'Personal', icon: 'user' }, // Gray-ish
    [CATEGORIES.NOTE]: { color: '#F6E05E', label: 'Note', icon: 'file-text' }, // Yellow-ish
    [CATEGORIES.REMINDER]: { color: '#B794F4', label: 'Reminder', icon: 'bell' }, // Purple-ish
};

export const formatDuration = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    totalSeconds = Math.floor(totalSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
};

export const getCategoryTheme = (cat) => THEME[cat] || THEME[CATEGORIES.IMPROVING];
