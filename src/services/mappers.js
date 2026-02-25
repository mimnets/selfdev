/**
 * Data format converters between app state (camelCase, object maps)
 * and PocketBase DB format (snake_case, row arrays).
 */

// ============ ACTIVITIES ============

export function activityToDb(activity, memberIdMap) {
    return {
        id: activity.id,
        type: activity.type || 'activity',
        title: activity.title || '',
        description: activity.description || null,
        category: activity.category || 'good',
        start_time: activity.startTime,
        end_time: activity.endTime || null,
        context: activity.context || 'personal',
        completed: activity.completed || false,
        member: resolveMemberId(activity.memberId, memberIdMap),
    };
}

export function activityFromDb(row, memberIdMap) {
    return {
        id: row.id,
        type: row.type || 'activity',
        title: row.title || '',
        description: row.description || '',
        category: row.category || 'good',
        startTime: row.start_time,
        endTime: row.end_time || null,
        context: row.context || 'personal',
        completed: row.completed || false,
        memberId: resolveAppMemberId(row.member, memberIdMap),
    };
}

// ============ MEMBERS ============

export function memberToDb(member) {
    const data = {
        name: member.name,
        role: mapRoleToDb(member.role),
        avatar: member.avatar || member.color || null,
    };
    if (member.dbId) data.id = member.dbId;
    return data;
}

export function memberFromDb(row) {
    return {
        id: row.id, // UUID from DB
        name: row.name,
        role: mapRoleFromDb(row.role),
        color: row.avatar || '#00ff88',
        dbId: row.id,
    };
}

function mapRoleToDb(role) {
    // DB CHECK constraint: 'me', 'child', 'spouse', 'other'
    if (role === 'admin') return 'me';
    if (['me', 'child', 'spouse', 'other'].includes(role)) return role;
    return 'other';
}

function mapRoleFromDb(role) {
    if (role === 'me') return 'admin';
    return role;
}

// ============ CATEGORIES ============

export function categoriesToDb(categoriesMap) {
    // Convert { key: { label, color, icon } } → array of rows
    return Object.entries(categoriesMap).map(([key, data]) => ({
        key,
        label: data.label,
        color: data.color,
        icon: data.icon || null,
    }));
}

export function categoriesFromDb(rows) {
    // Convert array of rows → { key: { label, color, icon } }
    const map = {};
    for (const row of rows) {
        map[row.key] = {
            label: row.label,
            color: row.color,
            icon: row.icon || null,
        };
    }
    return map;
}

export function categoryToDb(key, data) {
    return {
        key,
        label: data.label,
        color: data.color,
        icon: data.icon || null,
    };
}

// ============ GOALS ============

export function goalToDb(goal, memberIdMap) {
    const data = {
        title: goal.title,
        category: goal.category,
        target_hours: goal.targetValue,
        period: goal.period,
        member: resolveMemberId(goal.memberId, memberIdMap),
    };
    if (goal.dbId) data.id = goal.dbId;
    return data;
}

export function goalFromDb(row, memberIdMap) {
    return {
        id: row.id,
        title: row.title,
        category: row.category,
        targetValue: row.target_hours,
        period: row.period,
        memberId: resolveAppMemberId(row.member, memberIdMap),
    };
}

// ============ SETTINGS ============

export function settingsToDb(state) {
    return {
        theme: state.theme || 'dark',
        current_member_id: null, // Will be mapped with member ID resolution
        active_sessions: state.activeSessions || {},
        session_types: state.sessionTypes || {},
        acknowledged_reminders: state.acknowledgedReminders || [],
        custom_rules: state.customRules || {},
        parent_pin: state.parentPin || null,
    };
}

export function settingsFromDb(row) {
    if (!row) return {};
    return {
        theme: row.theme || 'dark',
        activeSessions: row.active_sessions || {},
        // Backward compat: fall back to old sessionRequirements format
        sessionTypes: row.session_types || migrateSessionRequirements(row.session_requirements) || {},
        acknowledgedReminders: row.acknowledged_reminders || [],
        customRules: row.custom_rules || {},
        parentPin: row.parent_pin ?? null,
    };
}

// Convert old { memberId: { label, dailyTarget } } to new { memberId: [{ id, label, dailyTarget, color, icon }] }
function migrateSessionRequirements(old) {
    if (!old || Object.keys(old).length === 0) return null;
    const migrated = {};
    for (const [memberId, req] of Object.entries(old)) {
        migrated[memberId] = [{
            id: 'st-migrated',
            label: req.label || 'Work',
            dailyTarget: req.dailyTarget || 8,
            color: '#3b82f6',
            icon: 'briefcase',
        }];
    }
    return migrated;
}

// ============ MEMBER ID MAPPING ============

/**
 * memberIdMap: { appId → dbUUID }
 * e.g. { 'me': 'uuid-123-...', 'uuid-456': 'uuid-456' }
 */
export function resolveMemberId(appId, memberIdMap) {
    if (!appId || !memberIdMap) return null;
    return memberIdMap[appId] || appId;
}

export function resolveAppMemberId(dbUuid, memberIdMap) {
    if (!dbUuid || !memberIdMap) return 'me';
    // Reverse lookup: find the app ID that maps to this DB UUID
    for (const [appId, dbId] of Object.entries(memberIdMap)) {
        if (dbId === dbUuid) return appId;
    }
    return dbUuid;
}

/**
 * Build a member ID map from members loaded from DB.
 * The first member with role 'me' maps to app ID 'me'.
 * All others use their DB UUID as both app and DB ID.
 */
export function buildMemberIdMap(dbMembers) {
    const map = {};
    const primaryMember = dbMembers.find(m => m.role === 'me');
    if (primaryMember) {
        map['me'] = primaryMember.id;
    }
    for (const m of dbMembers) {
        if (m.id !== primaryMember?.id) {
            map[m.id] = m.id;
        }
    }
    return map;
}
