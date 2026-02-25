/**
 * Background sync queue.
 * - Actions are queued and processed sequentially
 * - Failed syncs log errors but don't break the UI
 * - Settings updates are debounced (multiple rapid changes → single upsert)
 */
import { db } from './database';
import {
    activityToDb,
    categoryToDb,
    goalToDb,
    settingsToDb,
    memberToDb,
    resolveMemberId,
} from './mappers';

let queue = [];
let processing = false;
let settingsTimer = null;
let pendingSettings = null;
let syncStatusCallback = null;
let memberIdMap = {};

export function setSyncStatusCallback(cb) {
    syncStatusCallback = cb;
}

export function setMemberIdMap(map) {
    memberIdMap = map;
}

function updateStatus(status) {
    if (syncStatusCallback) syncStatusCallback(status);
}

async function processQueue() {
    if (processing || queue.length === 0) return;
    processing = true;
    updateStatus('syncing');

    while (queue.length > 0) {
        const task = queue.shift();
        try {
            await task();
        } catch (err) {
            console.error('[sync] Failed:', err);
        }
    }

    processing = false;
    updateStatus('synced');
}

function enqueue(fn) {
    queue.push(fn);
    processQueue();
}

function debounceSettings(settingsData) {
    pendingSettings = { ...pendingSettings, ...settingsData };
    if (settingsTimer) clearTimeout(settingsTimer);
    settingsTimer = setTimeout(() => {
        const data = pendingSettings;
        pendingSettings = null;
        settingsTimer = null;
        enqueue(() => db.upsertSettings(data));
    }, 1000);
}

/**
 * Push a reducer action to PocketBase in the background.
 * Called after each dispatch with the action and new state.
 */
export function syncAction(action, state) {
    const type = action.type;
    const payload = action.payload;

    switch (type) {
        case 'START_ACTIVITY': {
            // The new activity is in currentActivities, previous was moved to activities
            const currentMemberId = state.currentMemberId;
            const newActivity = state.currentActivities[currentMemberId];
            if (newActivity) {
                const dbAct = activityToDb(newActivity, memberIdMap);
                delete dbAct.id; // let DB assign UUID
                enqueue(() => db.createActivity(dbAct));
            }
            // Also update the previous activity's end_time (it's the first item in activities)
            if (state.activities.length > 0) {
                const prev = state.activities[0];
                if (prev.endTime && prev.memberId === currentMemberId) {
                    enqueue(() => db.updateActivity(prev.id, { end_time: prev.endTime }));
                }
            }
            break;
        }

        case 'STOP_ACTIVITY':
        case 'RESOLVE_STALE_ACTIVITY': {
            // The stopped/resolved activity is now the first item in activities
            if (state.activities.length > 0) {
                const stopped = state.activities[0];
                if (stopped.endTime) {
                    enqueue(() => db.updateActivity(stopped.id, { end_time: stopped.endTime }));
                }
            }
            break;
        }

        case 'ADD_NOTE':
        case 'ADD_REMINDER': {
            // Newest item is at the start of the sorted activities array
            const items = state.activities.filter(a =>
                a.type === (type === 'ADD_NOTE' ? 'note' : 'reminder') &&
                a.title === payload.title
            );
            if (items.length > 0) {
                const item = items[0];
                const dbItem = activityToDb(item, memberIdMap);
                delete dbItem.id;
                enqueue(() => db.createActivity(dbItem));
            }
            break;
        }

        case 'ADD_RETROACTIVE': {
            const items = state.activities.filter(a =>
                a.title === payload.title && a.startTime === payload.startTime
            );
            if (items.length > 0) {
                const item = items[0];
                const dbItem = activityToDb(item, memberIdMap);
                delete dbItem.id;
                enqueue(() => db.createActivity(dbItem));
            }
            break;
        }

        case 'UPDATE_ACTIVITY': {
            const { id, updates } = payload;
            const dbUpdates = {};
            if ('title' in updates) dbUpdates.title = updates.title;
            if ('description' in updates) dbUpdates.description = updates.description;
            if ('category' in updates) dbUpdates.category = updates.category;
            if ('startTime' in updates) dbUpdates.start_time = updates.startTime;
            if ('endTime' in updates) dbUpdates.end_time = updates.endTime;
            if ('context' in updates) dbUpdates.context = updates.context;
            if ('completed' in updates) dbUpdates.completed = updates.completed;
            enqueue(() => db.updateActivity(id, dbUpdates));
            break;
        }

        case 'TOGGLE_COMPLETED': {
            const act = state.activities.find(a => a.id === payload);
            if (act) {
                enqueue(() => db.updateActivity(payload, { completed: act.completed }));
            }
            break;
        }

        case 'ADD_MEMBER': {
            // Find the newly added member (last in array)
            const newMember = state.members[state.members.length - 1];
            if (newMember) {
                const dbMember = memberToDb(newMember);
                delete dbMember.id;
                enqueue(async () => {
                    const created = await db.createMember(dbMember);
                    // Update the member ID map
                    memberIdMap[newMember.id] = created.id;
                });
            }
            break;
        }

        case 'SWITCH_MEMBER': {
            const dbMemberId = resolveMemberId(payload, memberIdMap);
            debounceSettings({ current_member_id: dbMemberId });
            break;
        }

        case 'ADD_GOAL': {
            const newGoal = state.goals[state.goals.length - 1];
            if (newGoal) {
                const dbGoal = goalToDb(newGoal, memberIdMap);
                delete dbGoal.id;
                enqueue(() => db.createGoal(dbGoal));
            }
            break;
        }

        case 'UPDATE_GOAL': {
            const { id: goalId, updates: goalUpdates } = payload;
            const dbGoalUpdates = {};
            if ('title' in goalUpdates) dbGoalUpdates.title = goalUpdates.title;
            if ('category' in goalUpdates) dbGoalUpdates.category = goalUpdates.category;
            if ('targetValue' in goalUpdates) dbGoalUpdates.target_hours = goalUpdates.targetValue;
            if ('period' in goalUpdates) dbGoalUpdates.period = goalUpdates.period;
            enqueue(() => db.updateGoal(goalId, dbGoalUpdates));
            break;
        }

        case 'DELETE_GOAL':
            enqueue(() => db.deleteGoal(payload));
            break;

        case 'ADD_CATEGORY': {
            const { id: catKey, data: catData } = payload;
            const dbCat = categoryToDb(catKey, catData);
            enqueue(() => db.upsertCategory(dbCat));
            break;
        }

        case 'UPDATE_CATEGORY': {
            const { id: catKey2, updates: catUpdates } = payload;
            const fullCat = state.categories[catKey2];
            if (fullCat) {
                const dbCat = categoryToDb(catKey2, fullCat);
                enqueue(() => db.upsertCategory(dbCat));
            }
            break;
        }

        case 'DELETE_CATEGORY':
            enqueue(() => db.deleteCategory(payload));
            break;

        case 'LEARN_RULE':
            debounceSettings({ custom_rules: state.customRules });
            break;

        case 'TOGGLE_SESSION':
            debounceSettings({ active_sessions: state.activeSessions });
            break;

        case 'ADD_SESSION_TYPE':
        case 'UPDATE_SESSION_TYPE':
        case 'DELETE_SESSION_TYPE':
            debounceSettings({ session_types: state.sessionTypes });
            break;

        case 'SET_THEME':
            debounceSettings({ theme: state.theme });
            break;

        case 'SET_PARENT_PIN':
            debounceSettings({ parent_pin: state.parentPin });
            break;

        case 'ACKNOWLEDGE_REMINDER':
            debounceSettings({ acknowledged_reminders: state.acknowledgedReminders });
            break;

        // LOAD_STATE is not synced (it's loading FROM the DB)
        default:
            break;
    }
}
