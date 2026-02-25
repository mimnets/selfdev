import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePocketBase } from './SupabaseContext';
import { db } from '../services/database';
import { syncAction, setSyncStatusCallback, setMemberIdMap } from '../services/sync';
import {
    activityFromDb,
    memberFromDb,
    memberToDb,
    categoriesFromDb,
    categoriesToDb,
    goalFromDb,
    settingsFromDb,
    buildMemberIdMap,
} from '../services/mappers';

const PlannerContext = createContext();

const initialState = {
    activities: [],
    currentActivities: {}, // mapper: { memberId: activity }
    customRules: {},
    categories: {
        'elite': { label: 'Elite', color: '#00ff88', icon: 'zap' },
        'good': { label: 'Good', color: '#4ade80', icon: 'check' },
        'better': { label: 'Better', color: '#facc15', icon: 'trend-up' },
        'improving': { label: 'Improving', color: '#60a5fa', icon: 'book' },
        'nothing': { label: 'Doing Nothing', color: '#ef4444', icon: 'clock' },
        'feeding': { label: 'Feeding', color: '#ff80ab', icon: 'heart' },
        'sleeping': { label: 'Sleeping', color: '#c5cae9', icon: 'moon' },
        'diaper': { label: 'Diaper Change', color: '#b388ff', icon: 'refresh-ccw' },
        'play': { label: 'Play Time', color: '#ffff8d', icon: 'smile' },
        'deep_work': { label: 'Deep Work', color: '#68D391', icon: 'cpu' },
        'logistics': { label: 'Logistics', color: '#63B3ED', icon: 'briefcase' },
        'physical': { label: 'Physical', color: '#F6AD55', icon: 'activity' },
        'personal': { label: 'Personal', color: '#A0AEC0', icon: 'user' },
        'note': { label: 'Note', color: '#F6E05E', icon: 'file-text' },
        'reminder': { label: 'Reminder', color: '#B794F4', icon: 'bell' }
    },
    members: [
        { id: 'me', name: 'Me', role: 'admin', color: '#00ff88' }
    ],
    currentMemberId: 'me',
    goals: [],
    acknowledgedReminders: [],
    activeSessions: {},
    sessionTypes: {
        'me': [{ id: 'st-default', label: 'Work', dailyTarget: 8, color: '#3b82f6', icon: 'briefcase' }]
    },
    theme: 'midnight',
    parentPin: null
};

// Migrate old sessionRequirements format to new sessionTypes format
function migrateOldSessionRequirements(old) {
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

function plannerReducer(state, action) {
    switch (action.type) {
        case 'LOAD_STATE': {
            return {
                ...state,
                ...action.payload,
                // Preserve currentActivities from localStorage (ephemeral state)
                currentActivities: action.payload.currentActivities || state.currentActivities,
                // Preserve parentPin - use PocketBase value if available, else keep localStorage value
                parentPin: action.payload.parentPin ?? state.parentPin ?? null,
            };
        }

        case 'START_ACTIVITY': {
            const currentMemberIdStart = state.currentMemberId;
            let completedActivity = null;
            if (state.currentActivities[currentMemberIdStart]) {
                completedActivity = {
                    ...state.currentActivities[currentMemberIdStart],
                    endTime: new Date().toISOString()
                };
            }

            const isSessionActive = !!state.activeSessions[currentMemberIdStart];
            const newActivity = {
                id: uuidv4(),
                type: 'activity',
                memberId: currentMemberIdStart,
                ...action.payload,
                startTime: new Date().toISOString(),
                endTime: null,
                context: isSessionActive ? 'official' : 'personal'
            };

            return {
                ...state,
                activities: completedActivity
                    ? [completedActivity, ...state.activities]
                    : state.activities,
                currentActivities: {
                    ...state.currentActivities,
                    [currentMemberIdStart]: newActivity
                }
            };
        }

        case 'ADD_NOTE':
        case 'ADD_REMINDER': {
            const item = {
                id: uuidv4(),
                memberId: state.currentMemberId,
                ...action.payload,
                startTime: action.payload.startTime || new Date().toISOString(),
                completed: false,
            };

            const updatedActivities = [item, ...state.activities].sort((a, b) =>
                new Date(b.startTime) - new Date(a.startTime)
            );

            return {
                ...state,
                activities: updatedActivities
            };
        }

        case 'LEARN_RULE':
            return {
                ...state,
                customRules: {
                    ...state.customRules,
                    [action.payload.keyword.toLowerCase()]: action.payload.category
                }
            };

        case 'STOP_ACTIVITY': {
            const currentMemStop = state.currentMemberId;
            if (!state.currentActivities[currentMemStop]) return state;
            const stoppedActivity = {
                ...state.currentActivities[currentMemStop],
                endTime: new Date().toISOString()
            };
            return {
                ...state,
                activities: [stoppedActivity, ...state.activities],
                currentActivities: {
                    ...state.currentActivities,
                    [currentMemStop]: null
                }
            };
        }

        case 'RESOLVE_STALE_ACTIVITY': {
            // Stop a stale activity with a specific endTime (not "now")
            const { memberId: staleMemberId, endTime: staleEndTime } = action.payload;
            const staleActivity = state.currentActivities[staleMemberId];
            if (!staleActivity) return state;
            const resolvedActivity = {
                ...staleActivity,
                endTime: staleEndTime
            };
            return {
                ...state,
                activities: [resolvedActivity, ...state.activities],
                currentActivities: {
                    ...state.currentActivities,
                    [staleMemberId]: null
                }
            };
        }

        case 'ADD_RETROACTIVE': {
            const retroActivity = {
                id: uuidv4(),
                memberId: state.currentMemberId,
                ...action.payload
            };
            const newActivities = [retroActivity, ...state.activities].sort((a, b) =>
                new Date(b.startTime) - new Date(a.startTime)
            );
            return {
                ...state,
                activities: newActivities
            };
        }

        case 'UPDATE_ACTIVITY': {
            const { id, updates } = action.payload;

            const updatedList = state.activities.map(act =>
                act.id === id ? { ...act, ...updates } : act
            );

            const updatedCurrents = { ...state.currentActivities };
            Object.keys(updatedCurrents).forEach(mId => {
                if (updatedCurrents[mId] && updatedCurrents[mId].id === id) {
                    updatedCurrents[mId] = { ...updatedCurrents[mId], ...updates };
                }
            });

            return {
                ...state,
                activities: updatedList,
                currentActivities: updatedCurrents
            };
        }

        case 'ADD_MEMBER':
            return {
                ...state,
                members: [...state.members, { ...action.payload, id: uuidv4() }]
            };

        case 'UPDATE_MEMBER': {
            const { id: umId, updates: umUpdates } = action.payload;
            return {
                ...state,
                members: state.members.map(m => m.id === umId ? { ...m, ...umUpdates } : m)
            };
        }

        case 'DELETE_MEMBER': {
            const dmId = action.payload;
            if (dmId === 'me') return state; // Cannot delete primary member
            return {
                ...state,
                members: state.members.filter(m => m.id !== dmId),
                currentMemberId: state.currentMemberId === dmId ? 'me' : state.currentMemberId
            };
        }

        case 'SWITCH_MEMBER':
            return {
                ...state,
                currentMemberId: action.payload
            };

        case 'ADD_GOAL':
            return {
                ...state,
                goals: [...(state.goals || []), { ...action.payload, id: uuidv4() }]
            };

        case 'UPDATE_GOAL':
            return {
                ...state,
                goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload.updates } : g)
            };

        case 'DELETE_GOAL':
            return {
                ...state,
                goals: state.goals.filter(g => g.id !== action.payload)
            };

        case 'ACKNOWLEDGE_REMINDER':
            return {
                ...state,
                acknowledgedReminders: [...(state.acknowledgedReminders || []), action.payload]
            };

        case 'TOGGLE_COMPLETED': {
            const updatedActs = (state.activities || []).map(act =>
                act.id === action.payload ? { ...act, completed: !act.completed } : act
            );
            const updatedCurrentsToggle = { ...state.currentActivities };
            Object.keys(updatedCurrentsToggle).forEach(mId => {
                if (updatedCurrentsToggle[mId] && updatedCurrentsToggle[mId].id === action.payload) {
                    updatedCurrentsToggle[mId] = { ...updatedCurrentsToggle[mId], completed: !updatedCurrentsToggle[mId].completed };
                }
            });

            return {
                ...state,
                activities: updatedActs,
                currentActivities: updatedCurrentsToggle
            };
        }

        case 'ADD_CATEGORY':
            return {
                ...state,
                categories: {
                    ...state.categories,
                    [action.payload.id]: action.payload.data
                }
            };

        case 'UPDATE_CATEGORY':
            return {
                ...state,
                categories: {
                    ...state.categories,
                    [action.payload.id]: {
                        ...state.categories[action.payload.id],
                        ...action.payload.updates
                    }
                }
            };

        case 'DELETE_CATEGORY': {
            const newCats = { ...state.categories };
            delete newCats[action.payload];
            return {
                ...state,
                categories: newCats
            };
        }

        case 'TOGGLE_SESSION': {
            const { memberId, sessionTypeId } = action.payload;
            const currentSession = state.activeSessions[memberId];
            // If already active with this type (or any type if no id given), turn off
            if (currentSession) {
                return {
                    ...state,
                    activeSessions: { ...state.activeSessions, [memberId]: null }
                };
            }
            // Turn on with the specified session type
            const memberTypes = state.sessionTypes[memberId] || [];
            const typeId = sessionTypeId || (memberTypes[0]?.id);
            return {
                ...state,
                activeSessions: {
                    ...state.activeSessions,
                    [memberId]: { sessionTypeId: typeId, startedAt: new Date().toISOString() }
                }
            };
        }

        case 'ADD_SESSION_TYPE': {
            const { memberId: stMemberId, sessionType } = action.payload;
            const existing = state.sessionTypes[stMemberId] || [];
            return {
                ...state,
                sessionTypes: {
                    ...state.sessionTypes,
                    [stMemberId]: [...existing, { ...sessionType, id: sessionType.id || uuidv4() }]
                }
            };
        }

        case 'UPDATE_SESSION_TYPE': {
            const { memberId: utMemberId, sessionTypeId: utId, updates: utUpdates } = action.payload;
            const memberSessions = state.sessionTypes[utMemberId] || [];
            return {
                ...state,
                sessionTypes: {
                    ...state.sessionTypes,
                    [utMemberId]: memberSessions.map(st =>
                        st.id === utId ? { ...st, ...utUpdates } : st
                    )
                }
            };
        }

        case 'DELETE_SESSION_TYPE': {
            const { memberId: dtMemberId, sessionTypeId: dtId } = action.payload;
            const dtSessions = state.sessionTypes[dtMemberId] || [];
            // Also deactivate if this type was active
            const activeSession = state.activeSessions[dtMemberId];
            const newActiveSessions = { ...state.activeSessions };
            if (activeSession && activeSession.sessionTypeId === dtId) {
                newActiveSessions[dtMemberId] = null;
            }
            return {
                ...state,
                sessionTypes: {
                    ...state.sessionTypes,
                    [dtMemberId]: dtSessions.filter(st => st.id !== dtId)
                },
                activeSessions: newActiveSessions
            };
        }

        case 'SET_THEME':
            return {
                ...state,
                theme: action.payload
            };

        case 'SET_PARENT_PIN':
            return {
                ...state,
                parentPin: action.payload
            };

        default:
            return state;
    }
}

export function PlannerProvider({ children }) {
    const { user } = usePocketBase();
    const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'
    const dataLoadedRef = useRef(false);
    const memberIdMapRef = useRef({});

    const [state, baseDispatch] = useReducer(plannerReducer, initialState, (initial) => {
        // Load from localStorage as fast cache
        const saved = localStorage.getItem('planner-state');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                return {
                    ...initial,
                    ...loaded,
                    customRules: loaded.customRules || initial.customRules || {},
                    members: loaded.members || initial.members,
                    currentMemberId: loaded.currentMemberId || initial.currentMemberId,
                    goals: loaded.goals || initial.goals || [],
                    acknowledgedReminders: loaded.acknowledgedReminders || initial.acknowledgedReminders || [],
                    categories: loaded.categories || initial.categories,
                    currentActivities: loaded.currentActivities || (loaded.currentActivity ? { [loaded.currentMemberId]: loaded.currentActivity } : {}),
                    activeSessions: loaded.activeSessions || {},
                    sessionTypes: loaded.sessionTypes || migrateOldSessionRequirements(loaded.sessionRequirements) || initial.sessionTypes,
                    theme: loaded.theme || initial.theme,
                    parentPin: loaded.parentPin || null
                };
            } catch (e) {
                console.error('Failed to parse planner state from localStorage', e);
                return initial;
            }
        }
        return initial;
    });

    // Set up sync status callback
    useEffect(() => {
        setSyncStatusCallback(setSyncStatus);
    }, []);

    // Wrapping dispatch to also trigger background sync
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    });

    const dispatch = useCallback((action) => {
        baseDispatch(action);
        // After dispatch, sync to PocketBase if user is authenticated
        // We use a microtask to ensure the reducer has processed first
        if (user && action.type !== 'LOAD_STATE') {
            // Use requestAnimationFrame to get the updated state after reducer runs
            requestAnimationFrame(() => {
                syncAction(action, stateRef.current);
            });
        }
    }, [user]);

    // Write-through to localStorage (existing behavior, kept for offline cache)
    useEffect(() => {
        localStorage.setItem('planner-state', JSON.stringify(state));
    }, [state]);

    // Load data from PocketBase when user becomes available
    useEffect(() => {
        if (!user) {
            dataLoadedRef.current = false;
            return;
        }

        let cancelled = false;

        const loadFromPocketBase = async () => {
            try {
                setSyncStatus('syncing');

                // Fetch all data in parallel
                const [dbMembers, dbActivities, dbCategories, dbGoals, dbSettings] = await Promise.all([
                    db.getMembers(),
                    db.getActivities(),
                    db.getCategories(),
                    db.getGoals(),
                    db.getSettings(),
                ]);

                if (cancelled) return;

                // Handle first-time user: seed "Me" member if none exists
                let members = dbMembers;
                if (members.length === 0) {
                    const meMember = await db.createMember(memberToDb({ name: 'Me', role: 'admin', color: '#00ff88' }));
                    members = [meMember];

                    // Also seed default categories
                    const defaultCats = categoriesToDb(initialState.categories);
                    await db.bulkUpsertCategories(defaultCats);
                }

                // Build member ID map
                const idMap = buildMemberIdMap(members);
                memberIdMapRef.current = idMap;
                setMemberIdMap(idMap);

                // Transform DB → app format
                const appMembers = members.map(m => {
                    const appMember = memberFromDb(m);
                    // If this is the primary member, use 'me' as the app ID
                    if (m.role?.toUpperCase() === 'ME') {
                        return { ...appMember, id: 'me' };
                    }
                    return appMember;
                });

                const appActivities = dbActivities.map(a => activityFromDb(a, idMap));
                const appCategories = dbCategories.length > 0
                    ? categoriesFromDb(dbCategories)
                    : initialState.categories;
                const appGoals = dbGoals.map(g => goalFromDb(g, idMap));
                const appSettings = settingsFromDb(dbSettings);
                console.log('[PlannerContext] Loaded from PocketBase:', {
                    members: appMembers.length,
                    activities: appActivities.length,
                    parentPin: !!appSettings.parentPin,
                    currentMemberIdFromDb: dbSettings?.current_member_id,
                });

                // Determine current member ID
                let currentMemberId = 'me';
                if (dbSettings?.current_member_id) {
                    // Reverse-lookup the app ID
                    for (const [appId, dbId] of Object.entries(idMap)) {
                        if (dbId === dbSettings.current_member_id) {
                            currentMemberId = appId;
                            break;
                        }
                    }
                }

                if (cancelled) return;

                baseDispatch({
                    type: 'LOAD_STATE',
                    payload: {
                        members: appMembers,
                        activities: appActivities,
                        categories: appCategories,
                        goals: appGoals,
                        currentMemberId,
                        ...appSettings,
                    }
                });

                dataLoadedRef.current = true;
                setSyncStatus('synced');
            } catch (err) {
                console.error('[PlannerContext] Failed to load from PocketBase, using localStorage:', err);
                setSyncStatus('offline');
                dataLoadedRef.current = true; // Still mark loaded so UI isn't blocked
            }
        };

        loadFromPocketBase();

        return () => { cancelled = true; };
    }, [user]);

    const startActivity = (details) => dispatch({ type: 'START_ACTIVITY', payload: details });
    const stopActivity = () => dispatch({ type: 'STOP_ACTIVITY' });
    const resolveStaleActivity = (memberId, endTime) => dispatch({ type: 'RESOLVE_STALE_ACTIVITY', payload: { memberId, endTime } });
    const addRetroactive = (activity) => dispatch({ type: 'ADD_RETROACTIVE', payload: activity });
    const addNote = (note) => dispatch({ type: 'ADD_NOTE', payload: { ...note, type: 'note' } });
    const addReminder = (reminder) => dispatch({ type: 'ADD_REMINDER', payload: { ...reminder, type: 'reminder' } });
    const acknowledgeReminder = (id) => dispatch({ type: 'ACKNOWLEDGE_REMINDER', payload: id });
    const toggleCompleted = (id) => dispatch({ type: 'TOGGLE_COMPLETED', payload: id });
    const learnRule = (keyword, category) => dispatch({ type: 'LEARN_RULE', payload: { keyword, category } });
    const updateActivity = (id, updates) => dispatch({ type: 'UPDATE_ACTIVITY', payload: { id, updates } });
    const addMember = (member) => dispatch({ type: 'ADD_MEMBER', payload: member });
    const updateMember = (id, updates) => dispatch({ type: 'UPDATE_MEMBER', payload: { id, updates } });
    const deleteMember = (id) => dispatch({ type: 'DELETE_MEMBER', payload: id });
    const switchMember = (id) => dispatch({ type: 'SWITCH_MEMBER', payload: id });
    const addGoal = (goal) => dispatch({ type: 'ADD_GOAL', payload: goal });
    const updateGoal = (id, updates) => dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } });
    const deleteGoal = (id) => dispatch({ type: 'DELETE_GOAL', payload: id });
    const addCategory = (id, data) => dispatch({ type: 'ADD_CATEGORY', payload: { id, data } });
    const updateCategory = (id, updates) => dispatch({ type: 'UPDATE_CATEGORY', payload: { id, updates } });
    const deleteCategory = (id) => dispatch({ type: 'DELETE_CATEGORY', payload: id });
    const toggleSession = (memberId, sessionTypeId) => dispatch({ type: 'TOGGLE_SESSION', payload: { memberId, sessionTypeId } });
    const addSessionType = (memberId, sessionType) => dispatch({ type: 'ADD_SESSION_TYPE', payload: { memberId, sessionType } });
    const updateSessionType = (memberId, sessionTypeId, updates) => dispatch({ type: 'UPDATE_SESSION_TYPE', payload: { memberId, sessionTypeId, updates } });
    const deleteSessionType = (memberId, sessionTypeId) => dispatch({ type: 'DELETE_SESSION_TYPE', payload: { memberId, sessionTypeId } });
    const setTheme = (themeName) => dispatch({ type: 'SET_THEME', payload: themeName });
    const setParentPin = (pin) => dispatch({ type: 'SET_PARENT_PIN', payload: pin });

    const contextValue = {
        state: {
            ...state,
            currentActivity: state.currentActivities[state.currentMemberId] || null
        },
        syncStatus,
        startActivity, stopActivity, resolveStaleActivity, addRetroactive, addNote, addReminder, acknowledgeReminder, toggleCompleted,
        learnRule, updateActivity, addMember, updateMember, deleteMember, switchMember, addGoal, updateGoal, deleteGoal,
        addCategory, updateCategory, deleteCategory, toggleSession, addSessionType, updateSessionType, deleteSessionType, setTheme, setParentPin
    };

    return (
        <PlannerContext.Provider value={contextValue}>
            {children}
        </PlannerContext.Provider>
    );
}

export const usePlanner = () => {
    const context = useContext(PlannerContext);
    if (!context) {
        throw new Error('usePlanner must be used within a PlannerProvider');
    }
    return context;
};
