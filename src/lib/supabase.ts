// Custom Supabase Client Compatibility Layer
// This file replaces the Supabase Cloud SDK with a local PHP/MySQL API client.
// It maintains the exact same interface so frontend React components do not need to change.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/campus-lost-found/api';

// Registry for local real-time callbacks
let realtimeCallbacks: Array<() => void> = [];

// Helper to trigger all registered real-time callbacks
const triggerRealtimeUpdate = () => {
  setTimeout(() => {
    realtimeCallbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Error executing realtime callback:', e);
      }
    });
  }, 100);
};

// Storage URL cache (maps filename path to absolute server URL returned by upload.php)
const storageUrls: Record<string, string> = {};

// Auth State Listeners
type AuthStateCallback = (event: string, session: any) => void;
const authListeners: Array<AuthStateCallback> = [];

const notifyAuthChange = (event: string, session: any) => {
  authListeners.forEach(listener => {
    try {
      listener(event, session);
    } catch (e) {
      console.error('Error notifying auth state change:', e);
    }
  });
};

// Local Auth Session Management helpers
const getLocalSession = () => {
  try {
    const sessionStr = localStorage.getItem('campus_auth_session');
    if (sessionStr) {
      return JSON.parse(sessionStr);
    }
  } catch (e) {
    console.error('Error parsing auth session from localStorage:', e);
  }
  return null;
};

const saveLocalSession = (user: any, token: string) => {
  const session = {
    access_token: token,
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'dummy-refresh-token',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: {
        full_name: user.full_name,
        role: user.role
      },
      created_at: user.created_at
    }
  };
  localStorage.setItem('campus_auth_session', JSON.stringify(session));
  return session;
};

const clearLocalSession = () => {
  localStorage.removeItem('campus_auth_session');
};

// Builder class to mimic Supabase PostgrestQueryBuilder
class QueryBuilder {
  private tableName: string;
  private filters: Array<{ field: string; value: any; type: 'eq' | 'or' }> = [];
  private orderByField: string = '';
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;
  private countOnly: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    this.operation = 'select';
    if (options?.count === 'exact' && options?.head === true) {
      this.countOnly = true;
    }
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value, type: 'eq' });
    return this;
  }

  or(expr: string) {
    this.filters.push({ field: '', value: expr, type: 'or' });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Thenable implementation to allow awaiting this query object directly
  async then(
    onfulfilled?: (value: { data: any; error: any; count?: number | null }) => any,
    onrejected?: (reason: any) => any
  ): Promise<any> {
    try {
      const res = await this.execute();
      if (onfulfilled) return onfulfilled(res);
      return res;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  private async execute() {
    let url = `${API_URL}/${this.tableName}.php`;
    let method = 'GET';
    let body: any = null;
    const params = new URLSearchParams();

    // Parse filters
    let userIdFilter = '';
    let statusFilter = '';
    let isPendingFilter = false;
    let singleIdFilter = '';
    let typeFilter = '';

    for (const f of this.filters) {
      if (f.type === 'eq') {
        if (f.field === 'id') {
          singleIdFilter = f.value;
          params.append('id', f.value);
        } else if (f.field === 'user_id') {
          userIdFilter = f.value;
          params.append('user_id', f.value);
        } else if (f.field === 'status') {
          statusFilter = f.value;
          params.append('status', f.value);
          if (f.value === 'pending') {
            isPendingFilter = true;
          }
        } else if (f.field === 'type') {
          typeFilter = f.value;
        }
      } else if (f.type === 'or') {
        // e.g. status.eq.approved,user_id.eq.xxx
        const match = f.value.match(/user_id\.eq\.([a-zA-Z0-9-]+)/);
        if (match) {
          userIdFilter = match[1];
          params.append('user_id', userIdFilter);
        }
      }
    }

    if (this.limitCount !== null) {
      params.append('limit', this.limitCount.toString());
    }

    if (this.operation === 'select') {
      method = 'GET';
      if (this.tableName === 'reports' && !this.countOnly) {
        // If not stats request, and it doesn't query a single report, check if it's Admin Dashboard fetching all
        if (!isPendingFilter && singleIdFilter === '' && userIdFilter === '') {
          if (statusFilter !== 'approved') {
            params.append('all', 'true');
          }
        }
      }
    } else if (this.operation === 'insert') {
      method = 'POST';
      body = this.payload;
    } else if (this.operation === 'update') {
      method = 'PATCH';
      body = { ...this.payload, id: singleIdFilter };
    } else if (this.operation === 'delete') {
      method = 'DELETE';
      params.append('id', singleIdFilter);
    }

    const urlWithParams = params.toString() ? `${url}?${params.toString()}` : url;

    try {
      if (this.countOnly) {
        // Stats Head Request
        const statsRes = await fetch(`${API_URL}/reports.php?stats=true`);
        if (!statsRes.ok) {
          return { data: null, error: { message: 'Failed to fetch count stats' }, count: 0 };
        }
        const stats = await statsRes.json();
        
        let count = 0;
        if (isPendingFilter) {
          count = stats.totalPending;
        } else if (typeFilter === 'lost') {
          count = stats.totalLost;
        } else if (typeFilter === 'found') {
          count = stats.totalFound;
        }

        return { data: null, error: null, count };
      }

      const response = await fetch(urlWithParams, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { data: null, error: { message: errorData.error || 'HTTP request failed' } };
      }

      const resData = await response.json();

      let finalData = resData;
      if (this.isSingle && Array.isArray(resData)) {
        finalData = resData.length > 0 ? resData[0] : null;
      }

      // If we performed a write operation, trigger realtime listeners locally
      if (this.operation !== 'select') {
        triggerRealtimeUpdate();
      }

      return { data: finalData, error: null };

    } catch (err: any) {
      console.error(`Error executing database operation on table ${this.tableName}:`, err);
      return { data: null, error: { message: err.message || 'Connection error' } };
    }
  }
}

// Exported compatibility client
export const supabase = {
  auth: {
    // 1. Sign Up
    signUp: async ({ email, password, options }: any) => {
      const fullName = options?.data?.full_name || 'Anonymous User';
      const role = options?.data?.role || 'user';

      try {
        const res = await fetch(`${API_URL}/auth/signup.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, role })
        });

        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.error || 'Sign up failed' } };
        }

        // Return standard object structure matching supabase SDK
        const session = saveLocalSession(data.user, 'local-signup-session-token');
        notifyAuthChange('SIGNED_IN', session);

        return {
          data: {
            user: session.user,
            session: session
          },
          error: null
        };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message || 'Connection error' } };
      }
    },

    // 2. Sign In
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const res = await fetch(`${API_URL}/auth/signin.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: data.error || 'Invalid credentials' } };
        }

        const session = saveLocalSession(data.user, data.token);
        notifyAuthChange('SIGNED_IN', session);

        return {
          data: {
            user: session.user,
            session: session
          },
          error: null
        };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message || 'Connection error' } };
      }
    },

    // 3. Sign Out
    signOut: async () => {
      try {
        await fetch(`${API_URL}/auth/signout.php`, { method: 'POST' });
      } catch (e) {
        console.warn('Signout endpoint call failed, clearing local session anyway:', e);
      }
      clearLocalSession();
      notifyAuthChange('SIGNED_OUT', null);
      return { error: null };
    },

    // 4. Get User
    getUser: async () => {
      const session = getLocalSession();
      if (session) {
        return { data: { user: session.user }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    // 5. Get Session
    getSession: async () => {
      const session = getLocalSession();
      return { data: { session }, error: null };
    },

    // 6. Monitor Auth State Changes
    onAuthStateChange: (callback: AuthStateCallback) => {
      authListeners.push(callback);
      
      // Immediately invoke with current session
      const session = getLocalSession();
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authListeners.indexOf(callback);
              if (index !== -1) {
                authListeners.splice(index, 1);
              }
            }
          }
        }
      };
    },

    // 7. Verify OTP (mocked as success since no OTP is used locally)
    verifyOtp: async ({ email, token }: any) => {
      return { data: { user: null, session: null }, error: null };
    }
  },

  // 8. Database Builder
  from: (tableName: string) => {
    return new QueryBuilder(tableName);
  },

  // 9. Storage Builder
  storage: {
    from: (bucketName: string) => {
      return {
        upload: async (path: string, file: File, options?: any) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', path);

          try {
            const res = await fetch(`${API_URL}/upload.php`, {
              method: 'POST',
              body: formData
            });

            const data = await res.json();
            if (!res.ok) {
              return { data: null, error: { message: data.error || 'File upload failed' } };
            }

            // Cache the uploaded URL locally so getPublicUrl resolves it immediately
            storageUrls[path] = data.url;
            return { data: { path }, error: null };
          } catch (err: any) {
            console.error('File upload network error:', err);
            return { data: null, error: { message: err.message || 'Connection error' } };
          }
        },

        getPublicUrl: (path: string) => {
          // Attempt to retrieve from cache, otherwise deduce from path filename
          const filename = path.split('/').pop() || path;
          const publicUrl = storageUrls[path] || `${API_URL}/uploads/${filename}`;
          return {
            data: { publicUrl }
          };
        }
      };
    }
  },

  // 10. Channels Real-time Mock
  channel: (channelName: string) => {
    const channelObj = {
      on: (event: string, filter: any, callback: () => void) => {
        realtimeCallbacks.push(callback);
        return channelObj;
      },
      subscribe: () => {
        return channelObj;
      }
    };
    return channelObj;
  },

  removeChannel: (channelObj: any) => {
    realtimeCallbacks = [];
  }
};
