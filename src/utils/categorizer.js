import { CATEGORIES } from './theme';

export const KNOWLEDGE_BASE = {
    // Keywords to Category mapping
    keywords: {
        'coding': CATEGORIES.DEEP_WORK,
        'code': CATEGORIES.DEEP_WORK,
        'development': CATEGORIES.DEEP_WORK,
        'design': CATEGORIES.DEEP_WORK,
        'writing': CATEGORIES.DEEP_WORK,
        'pocketbase': CATEGORIES.DEEP_WORK,
        'n8n': CATEGORIES.DEEP_WORK,
        'google ai': CATEGORIES.DEEP_WORK,
        'work': CATEGORIES.DEEP_WORK,

        'bank': CATEGORIES.LOGISTICS,
        'printer': CATEGORIES.LOGISTICS,
        'admin': CATEGORIES.LOGISTICS,
        'email': CATEGORIES.LOGISTICS,
        'bill': CATEGORIES.LOGISTICS,

        'driving': CATEGORIES.PHYSICAL,
        'motorcycle': CATEGORIES.PHYSICAL,
        'gym': CATEGORIES.PHYSICAL,
        'walking': CATEGORIES.PHYSICAL,
        'exercise': CATEGORIES.PHYSICAL,

        'breakfast': CATEGORIES.PERSONAL,
        'lunch': CATEGORIES.PERSONAL,
        'dinner': CATEGORIES.PERSONAL,
        'coffee': CATEGORIES.PERSONAL,
        'rest': CATEGORIES.PERSONAL,
        'smoking': CATEGORIES.PERSONAL,
        'sleep': CATEGORIES.PERSONAL,

        'meeting': CATEGORIES.LOGISTICS
    },

    // Auto-stop limits in seconds
    limits: {
        [CATEGORIES.DEEP_WORK]: 105 * 60, // ~1 hr 45 min
        [CATEGORIES.LOGISTICS]: 30 * 60,
        [CATEGORIES.PHYSICAL]: 60 * 60,
        [CATEGORIES.PERSONAL]: 20 * 60,
        // Special internal key for Smoking override, not a main category yet, 
        // but we handle via special check or if we made Smoking a full category.
        // For now, let's keep it handled in the function or map 'smoking' keyword specially.
    }
};

export const categorizeActivity = (text, userRules = {}, availableCategories = {}) => {
    if (!text || typeof text !== 'string') return null;
    const lowerText = text.toLowerCase();

    // 1. Check User Rules first
    if (userRules) {
        for (const [keyword, category] of Object.entries(userRules)) {
            if (keyword && lowerText.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    // 2. Check current category labels (Dynamic detection)
    if (availableCategories) {
        for (const [id, cat] of Object.entries(availableCategories)) {
            if (!cat || !cat.label || id === 'nothing' || id === 'note' || id === 'reminder') continue;
            const label = cat.label.toLowerCase();
            if (label.length > 2 && lowerText.includes(label)) {
                return id;
            }
        }
    }

    // 3. Check Defaults
    const keywords = KNOWLEDGE_BASE.keywords || {};
    for (const [keyword, category] of Object.entries(keywords)) {
        if (lowerText.includes(keyword)) {
            return category;
        }
    }

    return null;
};

export const getAutoStopLimit = (category, title = '') => {
    if (!category) return null;

    // Specific overrides
    if (title && title.toLowerCase().includes('smoking')) {
        return 8 * 60; // 8 minutes
    }

    return KNOWLEDGE_BASE.limits[category] || null;
};
