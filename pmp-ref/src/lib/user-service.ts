import { supabase } from './supabase';

export interface UserProfile {
    id: string;
    email: string;
    is_approved: boolean;
    role: string;
    created_at?: string;
    total_answers?: number;
    correct_answers?: number;
    wrong_answers?: number;
    pass_rate?: number;
}

export async function saveUserProgress(userId: string, index: number) {
    try {
        const { error } = await supabase
            .from('pmp_user_progress')
            .upsert({
                user_id: userId,
                last_question_index: index,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving user progress:', error);
    }
}

export async function getUserProgress(userId: string): Promise<number | null> {
    try {
        const { data, error } = await supabase
            .from('pmp_user_progress')
            .select('last_question_index')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Supabase error fetching progress:', error);
            throw error;
        }

        return data?.last_question_index ?? null;
    } catch (error) {
        console.error('Error getting user progress:', error);
        return null;
    }
}

export async function checkUserApprovalStatus(userId: string): Promise<boolean> {
    try {
        const profile = await getUserProfile(userId);
        return profile?.is_approved ?? false;
    } catch (error) {
        console.error('Error checking approval status:', error);
        return false;
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn('Profile not found', error);
            return null;
        }

        return data as UserProfile;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

export async function getAllUsers(): Promise<UserProfile[]> {
    try {
        // Fetch users
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // Get total question count for pass rate calculation
        const { count: totalQuestions } = await supabase
            .from('pmp_questions')
            .select('*', { count: 'exact', head: true });

        const effectiveTotal = totalQuestions || 0;

        // Fetch all submissions to calculate stats
        const { data: submissions, error: submissionsError } = await supabase
            .from('pmp_user_submissions')
            .select('user_id, is_correct');

        if (submissionsError) {
            console.error('Error fetching submissions for stats:', submissionsError);
            return users as UserProfile[];
        }

        // Calculate stats per user
        const userStats: Record<string, { correct: number; total: number }> = {};

        submissions?.forEach(sub => {
            if (!userStats[sub.user_id]) {
                userStats[sub.user_id] = { correct: 0, total: 0 };
            }
            userStats[sub.user_id].total++;
            if (sub.is_correct) {
                userStats[sub.user_id].correct++;
            }
        });

        // Merge stats into user profiles
        const usersWithStats = users.map(user => {
            const stats = userStats[user.id] || { correct: 0, total: 0 };
            const wrong = stats.total - stats.correct;

            // Calculate pass rate based on TOTAL questions in DB
            const rawRate = effectiveTotal > 0
                ? (stats.correct / effectiveTotal) * 100
                : 0;

            // Round to 2 decimal places
            const rate = Math.round(rawRate * 100) / 100;

            return {
                ...user,
                total_answers: stats.total,
                correct_answers: stats.correct,
                wrong_answers: wrong,
                pass_rate: rate
            };
        });

        return usersWithStats as UserProfile[];
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
    }
}

export async function updateUserStatus(userId: string, isApproved: boolean): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ is_approved: isApproved })
            .eq('id', userId)
            .select();

        if (error) throw error;

        // Return true only if a row was actually updated
        return data && data.length > 0;
    } catch (error) {
        console.error('Error updating user status:', error);
        return false;
    }
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role: role })
            .eq('id', userId)
            .select();

        if (error) throw error;

        // Return true only if a row was actually updated
        return data && data.length > 0;
    } catch (error) {
        console.error('Error updating user role:', error);
        return false;
    }
}
