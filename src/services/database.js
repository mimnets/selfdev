/**
 * PocketBase CRUD service layer.
 * All methods use API rules for authorization (filter by user).
 */
import { pb } from '../lib/pocketbase';

function getUserId() {
    if (!pb.authStore.record) throw new Error('Not authenticated');
    return pb.authStore.record.id;
}

export const db = {
    // ============ MEMBERS ============

    async getMembers() {
        const userId = getUserId();
        return await pb.collection('planner_members').getFullList({
            filter: `user = "${userId}"`,
            sort: 'created',
        });
    },

    async createMember(memberData) {
        const userId = getUserId();
        return await pb.collection('planner_members').create({
            user: userId,
            ...memberData,
        });
    },

    async updateMember(id, updates) {
        return await pb.collection('planner_members').update(id, updates);
    },

    // ============ ACTIVITIES ============

    async getActivities() {
        const userId = getUserId();
        return await pb.collection('planner_activities').getFullList({
            filter: `user = "${userId}"`,
            sort: '-start_time',
        });
    },

    async createActivity(activityData) {
        const userId = getUserId();
        return await pb.collection('planner_activities').create({
            user: userId,
            ...activityData,
        });
    },

    async updateActivity(id, updates) {
        return await pb.collection('planner_activities').update(id, updates);
    },

    async deleteActivity(id) {
        return await pb.collection('planner_activities').delete(id);
    },

    // ============ CATEGORIES ============

    async getCategories() {
        const userId = getUserId();
        return await pb.collection('planner_categories').getFullList({
            filter: `user = "${userId}"`,
            sort: 'created',
        });
    },

    async upsertCategory(categoryData) {
        const userId = getUserId();
        try {
            const existing = await pb.collection('planner_categories').getFirstListItem(
                `user = "${userId}" && key = "${categoryData.key}"`
            );
            return await pb.collection('planner_categories').update(existing.id, categoryData);
        } catch (e) {
            if (e.status === 404) {
                return await pb.collection('planner_categories').create({
                    user: userId,
                    ...categoryData,
                });
            }
            throw e;
        }
    },

    async deleteCategory(key) {
        const userId = getUserId();
        try {
            const existing = await pb.collection('planner_categories').getFirstListItem(
                `user = "${userId}" && key = "${key}"`
            );
            return await pb.collection('planner_categories').delete(existing.id);
        } catch (e) {
            if (e.status === 404) return;
            throw e;
        }
    },

    async bulkUpsertCategories(categoriesArray) {
        const results = [];
        for (const cat of categoriesArray) {
            const result = await this.upsertCategory(cat);
            results.push(result);
        }
        return results;
    },

    // ============ GOALS ============

    async getGoals() {
        const userId = getUserId();
        return await pb.collection('planner_goals').getFullList({
            filter: `user = "${userId}"`,
            sort: 'created',
        });
    },

    async createGoal(goalData) {
        const userId = getUserId();
        return await pb.collection('planner_goals').create({
            user: userId,
            ...goalData,
        });
    },

    async updateGoal(id, updates) {
        return await pb.collection('planner_goals').update(id, updates);
    },

    async deleteGoal(id) {
        return await pb.collection('planner_goals').delete(id);
    },

    // ============ SETTINGS ============

    async getSettings() {
        const userId = getUserId();
        try {
            return await pb.collection('planner_settings').getFirstListItem(
                `user = "${userId}"`
            );
        } catch (e) {
            if (e.status === 404) return null;
            throw e;
        }
    },

    async upsertSettings(settings) {
        const userId = getUserId();
        try {
            const existing = await pb.collection('planner_settings').getFirstListItem(
                `user = "${userId}"`
            );
            return await pb.collection('planner_settings').update(existing.id, settings);
        } catch (e) {
            if (e.status === 404) {
                return await pb.collection('planner_settings').create({
                    user: userId,
                    ...settings,
                });
            }
            throw e;
        }
    },
};
