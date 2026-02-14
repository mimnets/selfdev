# Supabase Integration Guide for Gravity Planner

## 🎯 Overview

This guide shows you how to integrate Supabase with your Gravity Planner React app.

**Prerequisites:**
- ✅ Completed `SUPABASE_SETUP.md`
- ✅ Database schema created
- ✅ `.env` file configured

---

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

---

## Step 2: Create Supabase Client

Create `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

---

## Step 3: Create Supabase Context

Create `src/context/SupabaseContext.jsx`:

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseContext = createContext();

export const SupabaseProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    supabase
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
```

---

## Step 4: Update App.jsx

Wrap your app with `SupabaseProvider`:

```javascript
import { SupabaseProvider } from './context/SupabaseContext';
import { PlannerProvider } from './context/PlannerContext';

function App() {
  return (
    <SupabaseProvider>
      <PlannerProvider>
        {/* Your app components */}
      </PlannerProvider>
    </SupabaseProvider>
  );
}

export default App;
```

---

## Step 5: Create Database Service Layer

Create `src/services/database.js`:

```javascript
import { supabase } from '../lib/supabase';

export const DatabaseService = {
  // ============ MEMBERS ============
  async getMembers() {
    const { data, error } = await supabase
      .from('planner_members')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createMember(memberData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('planner_members')
      .insert([{
        user_id: user.id,
        ...memberData
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ============ ACTIVITIES ============
  async getActivities(filters = {}) {
    let query = supabase
      .from('planner_activities')
      .select('*')
      .order('start_time', { ascending: false });

    if (filters.memberId) {
      query = query.eq('member_id', filters.memberId);
    }

    if (filters.startDate) {
      query = query.gte('start_time', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('start_time', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createActivity(activityData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('planner_activities')
      .insert([{
        user_id: user.id,
        ...activityData
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateActivity(id, updates) {
    const { data, error } = await supabase
      .from('planner_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteActivity(id) {
    const { error } = await supabase
      .from('planner_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ============ CATEGORIES ============
  async getCategories() {
    const { data, error } = await supabase
      .from('planner_categories')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createCategory(categoryData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('planner_categories')
      .insert([{
        user_id: user.id,
        ...categoryData
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCategory(id, updates) {
    const { data, error } = await supabase
      .from('planner_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCategory(id) {
    const { error } = await supabase
      .from('planner_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ============ GOALS ============
  async getGoals() {
    const { data, error } = await supabase
      .from('planner_goals')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createGoal(goalData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('planner_goals')
      .insert([{
        user_id: user.id,
        ...goalData
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateGoal(id, updates) {
    const { data, error } = await supabase
      .from('planner_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteGoal(id) {
    const { error } = await supabase
      .from('planner_goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // ============ SETTINGS ============
  async getSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('planner_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data;
  },

  async upsertSettings(settings) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('planner_settings')
      .upsert({
        user_id: user.id,
        ...settings
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
```

---

## Step 6: Update PlannerContext to Use Supabase

Modify `src/context/PlannerContext.jsx`:

```javascript
import { createContext, useContext, useReducer, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';
import { DatabaseService } from '../services/database';

// ... (keep your existing initialState and reducer)

export const PlannerProvider = ({ children }) => {
  const { user, loading: authLoading } = useSupabase();
  const [state, dispatch] = useReducer(plannerReducer, initialState);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel
        const [members, activities, categories, goals, settings] = await Promise.all([
          DatabaseService.getMembers(),
          DatabaseService.getActivities(),
          DatabaseService.getCategories(),
          DatabaseService.getGoals(),
          DatabaseService.getSettings()
        ]);

        // Convert Supabase data to app format
        const loadedState = {
          members: members || initialState.members,
          activities: activities || [],
          categories: convertCategoriesToObject(categories),
          goals: goals || [],
          ...settings
        };

        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Modified action creators to use Supabase
  const startActivity = async (activityData) => {
    try {
      const activity = await DatabaseService.createActivity({
        member_id: state.currentMemberId,
        type: 'activity',
        start_time: new Date().toISOString(),
        end_time: null,
        ...activityData
      });

      dispatch({ type: 'START_ACTIVITY', payload: activity });
    } catch (error) {
      console.error('Error starting activity:', error);
      throw error;
    }
  };

  const stopActivity = async () => {
    if (!state.currentActivity) return;

    try {
      const updated = await DatabaseService.updateActivity(
        state.currentActivity.id,
        { end_time: new Date().toISOString() }
      );

      dispatch({ type: 'STOP_ACTIVITY', payload: updated });
    } catch (error) {
      console.error('Error stopping activity:', error);
      throw error;
    }
  };

  // ... (update other action creators similarly)

  return (
    <PlannerContext.Provider value={{
      state,
      loading: loading || authLoading,
      startActivity,
      stopActivity,
      // ... other actions
    }}>
      {children}
    </PlannerContext.Provider>
  );
};
```

---

## Step 7: Create Login/Signup Components

Create `src/components/Auth.jsx`:

```javascript
import { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';

export const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const { signIn, signUp } = useSupabase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Check your email for confirmation link!');
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        
        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ marginLeft: '5px', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};
```

---

## Step 8: Update App.jsx with Auth Guard

```javascript
import { SupabaseProvider, useSupabase } from './context/SupabaseContext';
import { PlannerProvider } from './context/PlannerContext';
import { Auth } from './components/Auth';
import './App.css';

function AppContent() {
  const { user, loading } = useSupabase();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <PlannerProvider>
      {/* Your existing app components */}
    </PlannerProvider>
  );
}

function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}

export default App;
```

---

## Step 9: Test the Integration

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Sign up a new user:**
   - Open http://localhost:5173
   - Create an account
   - Check your email for confirmation (if email is configured)

3. **Test CRUD operations:**
   - Create a member
   - Start an activity
   - Stop an activity
   - Check Supabase Table Editor to see data

---

## Step 10: Enable Real-time (Optional)

To get real-time updates across devices:

```javascript
// In PlannerContext.jsx
useEffect(() => {
  if (!user) return;

  // Subscribe to activities changes
  const subscription = supabase
    .channel('planner_activities')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'planner_activities',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      console.log('Activity changed:', payload);
      // Update local state based on payload
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [user]);
```

---

## Migration from Google Drive

See `SUPABASE_MIGRATION.md` for step-by-step guide to migrate your existing data.

---

## Troubleshooting

### "Missing environment variables" error
- Check `.env` file exists in project root
- Verify variable names start with `VITE_`
- Restart dev server after changing `.env`

### "Row Level Security" errors
- Ensure user is authenticated
- Check RLS policies in Supabase Studio
- Verify `user_id` matches `auth.uid()`

### Data not appearing
- Check browser console for errors
- Verify data exists in Supabase Table Editor
- Check network tab for API calls

---

## Next Steps

✅ Supabase integrated  
✅ Authentication working  
✅ CRUD operations functional  

**Continue to:** `SUPABASE_MIGRATION.md` to migrate existing data
