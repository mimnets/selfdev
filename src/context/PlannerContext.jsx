import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
    activeSessions: {}, // { memberId: startTime or null }
    sessionRequirements: {
        'me': { dailyTarget: 8, label: 'Work' }
    },
    theme: 'dark'
};

function plannerReducer(state, action) {
    switch (action.type) {
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
            // Treat these as completed activities (point in time or future) 
            // OR separate list? User said "list of activities - remainder, notes, Live"
            // Reminders: "time and date"
            // Notes: "record will be saved as notes"
            // For simplicity, let's treat them as activities with specific types

            // If Reminder, it might rely on external logic to actually "remind", 
            // but for now we just store it.
            const item = {
                id: uuidv4(),
                memberId: state.currentMemberId,
                ...action.payload, // title, category, description, type, startTime, endTime(for reminder?)
                startTime: action.payload.startTime || new Date().toISOString(),
                completed: false, // Default to incomplete
                // Reminders might have a future startTime
            };

            // Sort needed?
            const updatedActivities = [item, ...state.activities].sort((a, b) =>
                new Date(b.startTime) - new Date(a.startTime)
            );

            return {
                ...state,
                activities: updatedActivities
            };
        }

        case 'LEARN_RULE':
            // payload: { keyword, category }
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

        case 'ADD_RETROACTIVE': {
            // Insert activity into history based on provided start/end times
            // sophisticated logic needed here to sort/handle overlaps, simplified for now
            const retroActivity = {
                id: uuidv4(),
                memberId: state.currentMemberId,
                ...action.payload // includes startTime, endTime
            };
            // Sort activities desc by startTime
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

            // customized update logic if needed
            const updatedList = state.activities.map(act =>
                act.id === id ? { ...act, ...updates } : act
            );

            // Also check currentActivity if it's the one being updated
            let updatedCurrents = { ...state.currentActivities };
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
            let updatedActs = (state.activities || []).map(act =>
                act.id === action.payload ? { ...act, completed: !act.completed } : act
            );
            let updatedCurrentsToggle = { ...state.currentActivities };
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
            const memberId = action.payload;
            const currentSessionStart = state.activeSessions[memberId];
            return {
                ...state,
                activeSessions: {
                    ...state.activeSessions,
                    [memberId]: currentSessionStart ? null : new Date().toISOString()
                }
            };
        }

        case 'UPDATE_SESSION_REQUIREMENT':
            return {
                ...state,
                sessionRequirements: {
                    ...state.sessionRequirements,
                    [action.payload.memberId]: {
                        ...state.sessionRequirements[action.payload.memberId],
                        ...action.payload.updates
                    }
                }
            };

        case 'SET_THEME':
            return {
                ...state,
                theme: action.payload
            };

        default:
            return state;
    }
}

export function PlannerProvider({ children }) {
    const [state, dispatch] = useReducer(plannerReducer, initialState, (initial) => {
        // Load from local storage
        const saved = localStorage.getItem('planner-state');
        if (saved) {
            const loaded = JSON.parse(saved);
            // Merge with initial to ensure new fields (like customRules) exist
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
                sessionRequirements: loaded.sessionRequirements || initial.sessionRequirements,
                theme: loaded.theme || initial.theme
            };
        }
        return initial;
    });

    useEffect(() => {
        localStorage.setItem('planner-state', JSON.stringify(state));
    }, [state]);

    const startActivity = (details) => dispatch({ type: 'START_ACTIVITY', payload: details });
    const stopActivity = () => dispatch({ type: 'STOP_ACTIVITY' });
    const addRetroactive = (activity) => dispatch({ type: 'ADD_RETROACTIVE', payload: activity });
    const addNote = (note) => dispatch({ type: 'ADD_NOTE', payload: { ...note, type: 'note' } });
    const addReminder = (reminder) => dispatch({ type: 'ADD_REMINDER', payload: { ...reminder, type: 'reminder' } });
    const acknowledgeReminder = (id) => dispatch({ type: 'ACKNOWLEDGE_REMINDER', payload: id });
    const toggleCompleted = (id) => dispatch({ type: 'TOGGLE_COMPLETED', payload: id });
    const learnRule = (keyword, category) => dispatch({ type: 'LEARN_RULE', payload: { keyword, category } });
    const updateActivity = (id, updates) => dispatch({ type: 'UPDATE_ACTIVITY', payload: { id, updates } });
    const addMember = (member) => dispatch({ type: 'ADD_MEMBER', payload: member });
    const switchMember = (id) => dispatch({ type: 'SWITCH_MEMBER', payload: id });
    const addGoal = (goal) => dispatch({ type: 'ADD_GOAL', payload: goal });
    const updateGoal = (id, updates) => dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } });
    const deleteGoal = (id) => dispatch({ type: 'DELETE_GOAL', payload: id });
    const addCategory = (id, data) => dispatch({ type: 'ADD_CATEGORY', payload: { id, data } });
    const updateCategory = (id, updates) => dispatch({ type: 'UPDATE_CATEGORY', payload: { id, updates } });
    const deleteCategory = (id) => dispatch({ type: 'DELETE_CATEGORY', payload: id });
    const toggleSession = (memberId) => dispatch({ type: 'TOGGLE_SESSION', payload: memberId });
    const updateSessionRequirement = (memberId, updates) => dispatch({ type: 'UPDATE_SESSION_REQUIREMENT', payload: { memberId, updates } });
    const setTheme = (themeName) => dispatch({ type: 'SET_THEME', payload: themeName });

    const contextValue = {
        state: {
            ...state,
            currentActivity: state.currentActivities[state.currentMemberId] || null
        },
        startActivity, stopActivity, addRetroactive, addNote, addReminder, acknowledgeReminder, toggleCompleted,
        learnRule, updateActivity, addMember, switchMember, addGoal, updateGoal, deleteGoal,
        addCategory, updateCategory, deleteCategory, toggleSession, updateSessionRequirement, setTheme
    };

    return (
        <PlannerContext.Provider value={contextValue}>
            {children}
        </PlannerContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePlanner = () => useContext(PlannerContext);
