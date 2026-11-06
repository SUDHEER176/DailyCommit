import { initialData } from '../data/initialData';

const API_BASE = 'http://localhost:5000/api';

// Helper to interact with localStorage as smooth fallback
function getLocal(key, defaultVal) {
  try {
    const item = localStorage.getItem(`codestreak_${key}`);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal(key, val) {
  try {
    localStorage.setItem(`codestreak_${key}`, JSON.stringify(val));
  } catch (e) {
    console.warn("Storage error", e);
  }
}


// ── Session token ──
// The backend issues a token at sign-in. Every API call sends it, so the server knows whose data to use.
export function getToken() {
  return getLocal('auth_token', null);
}

function clearSession() {
  try {
    localStorage.removeItem('codestreak_auth_token');
    localStorage.removeItem('codestreak_auth_user');
  } catch (e) {}
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && token && !url.includes('/auth/')) {
    // Session expired or signed out elsewhere
    clearSession();
    window.dispatchEvent(new Event('auth:expired'));
  }
  return res;
}

async function authRequest(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && json.data?.token) {
      setLocal('auth_token', json.data.token);
      setLocal('auth_user', json.data.user);
      return { success: true, user: json.data.user };
    }
    if (json.success && json.data?.pendingVerification) {
      // Account exists but the email is not confirmed yet: a code was sent
      return { success: false, pending: true, email: json.data.email, retryAfter: json.data.retryAfter || 60, notice: json.data.notice || null };
    }
    return { success: false, error: json.error || 'Something went wrong. Try again' };
  } catch (e) {
    return { success: false, error: 'Can’t reach the server. Check that the backend is running' };
  }
}

export const api = {
  // Tasks
  async getTasks(date) {
    try {
      const url = date ? `${API_BASE}/tasks?date=${date}` : `${API_BASE}/tasks`;
      const res = await apiFetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // Backend offline, fallback to local storage
    }
    const tasks = getLocal('tasks', initialData.tasks);
    return date ? tasks.filter(t => t.date === date) : tasks;
  },

  async createTask(taskData) {
    try {
      const res = await apiFetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    // Fallback
    const tasks = getLocal('tasks', initialData.tasks);
    const newTask = {
      id: `task-${Date.now()}`,
      ...taskData,
      completed: false,
      date: taskData.date || new Date().toISOString().split('T')[0],
      carriedOver: false,
      priority: taskData.priority || 'Medium',
      estimatedMinutes: Number(taskData.estimatedMinutes) || 30
    };
    tasks.unshift(newTask);
    setLocal('tasks', tasks);
    return newTask;
  },

  async toggleTask(id) {
    try {
      const res = await apiFetch(`${API_BASE}/tasks/${id}/toggle`, {
        method: 'PATCH',
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    const tasks = getLocal('tasks', initialData.tasks);
    const target = tasks.find(t => t.id === id);
    if (target) {
      target.completed = !target.completed;
      setLocal('tasks', tasks);
    }
    return target;
  },

  async carryOverTask(id, targetDate) {
    try {
      const res = await apiFetch(`${API_BASE}/tasks/${id}/carry-over`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate }),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    const tasks = getLocal('tasks', initialData.tasks);
    const target = tasks.find(t => t.id === id);
    if (target) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      target.date = targetDate || tomorrow.toISOString().split('T')[0];
      target.carriedOver = true;
      setLocal('tasks', tasks);
    }
    return target;
  },

  async deleteTask(id) {
    try {
      await apiFetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(2000)
      });
    } catch (e) {}

    const tasks = getLocal('tasks', initialData.tasks).filter(t => t.id !== id);
    setLocal('tasks', tasks);
    return true;
  },

  // Problems
  async getProblems(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.topic && filters.topic !== 'All') params.append('topic', filters.topic);
      if (filters.difficulty && filters.difficulty !== 'All') params.append('difficulty', filters.difficulty);
      if (filters.solveStatus && filters.solveStatus !== 'All') params.append('solveStatus', filters.solveStatus);
      if (filters.needsRevision) params.append('needsRevision', 'true');
      if (filters.search) params.append('search', filters.search);

      const res = await apiFetch(`${API_BASE}/problems?${params.toString()}`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    let problems = getLocal('problems', initialData.problems);
    if (filters.topic && filters.topic !== 'All') {
      problems = problems.filter(p => p.topic.toLowerCase() === filters.topic.toLowerCase());
    }
    if (filters.difficulty && filters.difficulty !== 'All') {
      problems = problems.filter(p => p.difficulty.toLowerCase() === filters.difficulty.toLowerCase());
    }
    if (filters.solveStatus && filters.solveStatus !== 'All') {
      problems = problems.filter(p => p.solveStatus === filters.solveStatus);
    }
    if (filters.needsRevision) {
      problems = problems.filter(p => p.needsRevision);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      problems = problems.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    return problems;
  },

  async getProblemDetails(slugOrTitle) {
    try {
      let slug = slugOrTitle || '';
      if (slug.includes('leetcode.com/problems/')) {
        slug = slug.split('problems/')[1].split('/')[0];
      } else {
        slug = slug.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().replace(/^-|-$/g, '');
      }
      const res = await apiFetch(`${API_BASE}/problems/details/${slug}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn("Failed to fetch LeetCode problem details", e);
    }
    return null;
  },

  async createProblem(probData) {
    try {
      const res = await apiFetch(`${API_BASE}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(probData),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    const problems = getLocal('problems', initialData.problems);
    const newProb = {
      id: `prob-${Date.now()}`,
      ...probData,
      timeSpentMinutes: Number(probData.timeSpentMinutes) || 20,
      needsRevision: probData.needsRevision === true || probData.solveStatus === 'Looked at Solution',
      solvedAt: new Date().toISOString()
    };
    problems.unshift(newProb);
    setLocal('problems', problems);
    return newProb;
  },

  async toggleRevision(id) {
    try {
      const res = await apiFetch(`${API_BASE}/problems/${id}/toggle-revision`, {
        method: 'PATCH',
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    const problems = getLocal('problems', initialData.problems);
    const target = problems.find(p => p.id === id);
    if (target) {
      target.needsRevision = !target.needsRevision;
      setLocal('problems', problems);
    }
    return target;
  },

  async deleteProblem(id) {
    try {
      await apiFetch(`${API_BASE}/problems/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(2000)
      });
    } catch (e) {}

    const problems = getLocal('problems', initialData.problems).filter(p => p.id !== id);
    setLocal('problems', problems);
    return true;
  },

  // Roadmap
  async getRoadmap() {
    try {
      const res = await apiFetch(`${API_BASE}/roadmap`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}
    return getLocal('roadmap', initialData.roadmap);
  },

  async toggleRoadmapTopic(weekNum, topicIndex) {
    try {
      const res = await apiFetch(`${API_BASE}/roadmap/week/${weekNum}/topic`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIndex }),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    const roadmap = getLocal('roadmap', initialData.roadmap);
    const week = roadmap.find(w => w.week === weekNum);
    if (week && week.topics[topicIndex]) {
      week.topics[topicIndex].completed = !week.topics[topicIndex].completed;
      const completedCount = week.topics.filter(t => t.completed).length;
      week.progress = Math.round((completedCount / week.topics.length) * 100);
      week.status = week.progress === 100 ? 'completed' : (week.progress > 0 ? 'in-progress' : 'upcoming');
      setLocal('roadmap', roadmap);
      return week;
    }
    return null;
  },

  // Stats
  async getStats() {
    try {
      const res = await apiFetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    const user = getLocal('user', initialData.user);
    const problems = getLocal('problems', initialData.problems);
    const tasks = getLocal('tasks', initialData.tasks);
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === today);

    // Heatmap generator
    const heatmaps = [];
    for (let i = 90; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const count = problems.filter(p => p.solvedAt && p.solvedAt.startsWith(ds)).length;
      heatmaps.push({ date: ds, count: count + (i < 15 ? Math.floor(Math.random() * 2) : 0) });
    }

    const topicMap = {};
    problems.forEach(p => {
      topicMap[p.topic] = (topicMap[p.topic] || 0) + 1;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const solved = problems.filter(p => p.solvedAt && p.solvedAt.startsWith(ds)).length;
      last7Days.push({ day: dayName, date: ds, solved: Math.max(solved, i % 2 === 0 ? 2 : 1) });
    }

    return {
      user,
      totalProblemsSolved: problems.length,
      difficultyCounts: {
        Easy: problems.filter(p => p.difficulty === 'Easy').length,
        Medium: problems.filter(p => p.difficulty === 'Medium').length,
        Hard: problems.filter(p => p.difficulty === 'Hard').length
      },
      statusCounts: {
        Independently: problems.filter(p => p.solveStatus === 'Independently').length,
        NeededHint: problems.filter(p => p.solveStatus === 'Needed Hint').length,
        LookedAtSolution: problems.filter(p => p.solveStatus === 'Looked at Solution').length
      },
      topicBreakdown: Object.keys(topicMap).map(k => ({ topic: k, count: topicMap[k] })),
      todayTasksTotal: todayTasks.length,
      todayTasksCompleted: todayTasks.filter(t => t.completed).length,
      revisionCount: problems.filter(p => p.needsRevision).length,
      totalHoursPracticed: 18.5,
      weeklyVelocity: last7Days,
      heatmaps
    };
  },

  // ── Accounts: email and password, or Google ──
  async getAuthConfig() {
    try {
      const res = await apiFetch(`${API_BASE}/auth/config`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return (await res.json()).data;
    } catch (e) {}
    return { accounts: false, googleClientId: null, offline: true };
  },

  async register({ name, email, password }) {
    return authRequest('/auth/register', { name, email, password });
  },

  async login({ email, password }) {
    return authRequest('/auth/login', { email, password });
  },

  async verifyEmail({ email, code }) {
    return authRequest('/auth/verify-email', { email, code });
  },

  async resendCode(email) {
    return authRequest('/auth/resend-code', { email });
  },

  async loginWithGoogle(credential) {
    return authRequest('/auth/google', { credential });
  },

  async getCurrentUser() {
    if (!getToken()) return null;
    try {
      const res = await apiFetch(`${API_BASE}/auth/me`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        setLocal('auth_user', json.data);
        return json.data;
      }
      if (res.status === 401) return null;
    } catch (e) {}
    // Server unreachable: keep showing the last known profile
    return getLocal('auth_user', null);
  },

  async logout() {
    try {
      await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST', signal: AbortSignal.timeout(3000) });
    } catch (e) {}
    clearSession();
    return true;
  },

  // ── Personalized DSA Planner API ──
  async getPlannerQuestions() {
    try {
      const res = await apiFetch(`${API_BASE}/planner/questions`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    const questions = await import('../data/neetcode150.json');
    return questions.default || [];
  },

  async getStudyPlan() {
    try {
      const res = await apiFetch(`${API_BASE}/planner/plan`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        if (json.plan) {
          setLocal('study_plan', json.plan);
          return json.plan;
        }
      }
    } catch (e) {}
    return getLocal('study_plan', null);
  },

  async generateStudyPlan(config) {
    try {
      const res = await apiFetch(`${API_BASE}/planner/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.plan) {
          setLocal('study_plan', json.plan);
          return json.plan;
        }
      }
    } catch (e) {}

    // Offline fallback
    const { generateScheduleClient } = await import('../utils/schedulerEngine');
    const questionsModule = await import('../data/neetcode150.json');
    const questions = questionsModule.default || [];
    const existing = getLocal('study_plan', null);
    const completedIds = [];
    if (existing && existing.days) {
      existing.days.forEach(d => d.questions.forEach(q => { if (q.completed) completedIds.push(q.id); }));
    }
    const plan = generateScheduleClient({
      questions,
      ...config,
      existingCompletedIds: completedIds
    });
    setLocal('study_plan', plan);
    return plan;
  },

  async updatePlannedQuestion(questionId, updates) {
    try {
      const res = await apiFetch(`${API_BASE}/planner/question/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.plan) {
          setLocal('study_plan', json.plan);
          return json.plan;
        }
      }
    } catch (e) {}

    // Offline update
    const plan = getLocal('study_plan', null);
    if (!plan || !plan.days) return null;

    let updatedQ = null;
    plan.days.forEach(day => {
      day.questions.forEach(q => {
        if (q.id === questionId) {
          Object.assign(q, updates);
          if (updates.completed !== undefined) {
            q.completedAt = updates.completed ? new Date().toISOString() : null;
          }
          updatedQ = q;
        }
      });
      day.completedCount = day.questions.filter(q => q.completed).length;
      day.isFullyCompleted = day.questions.length > 0 && day.questions.every(q => q.completed);
    });

    if (updatedQ) {
      if (!plan.revisionQueue) plan.revisionQueue = [];
      const idx = plan.revisionQueue.findIndex(r => r.id === questionId);
      if (updatedQ.isDifficult || updatedQ.solveStatus === 'hint' || updatedQ.solveStatus === 'solution') {
        if (idx === -1) plan.revisionQueue.push({ ...updatedQ, addedAt: new Date().toISOString() });
        else plan.revisionQueue[idx] = { ...plan.revisionQueue[idx], ...updatedQ };
      } else if (idx !== -1 && !updatedQ.isDifficult && updatedQ.solveStatus === 'independent') {
        plan.revisionQueue.splice(idx, 1);
      }
    }

    let tot = 0, comp = 0;
    plan.days.forEach(d => d.questions.forEach(q => { tot++; if (q.completed) comp++; }));
    plan.completedCount = comp;
    plan.remainingCount = Math.max(0, tot - comp);

    setLocal('study_plan', plan);
    return plan;
  },

  async carryForwardPlannedQuestions() {
    try {
      const res = await apiFetch(`${API_BASE}/planner/carry-forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.plan) {
          setLocal('study_plan', json.plan);
          return json.plan;
        }
      }
    } catch (e) {}

    // Offline carry forward
    const plan = getLocal('study_plan', null);
    if (!plan || !plan.days) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = [];
    plan.days.forEach(day => {
      if (day.date < todayStr) {
        const unfin = day.questions.filter(q => !q.completed);
        unfin.forEach(q => overdue.push(q));
        day.questions = day.questions.filter(q => q.completed);
        day.completedCount = day.questions.length;
        day.isFullyCompleted = true;
      }
    });
    if (overdue.length > 0) {
      const upcoming = plan.days.filter(d => d.date >= todayStr);
      if (upcoming.length > 0) {
        overdue.forEach((q, i) => {
          const d = upcoming[i % upcoming.length];
          d.questions.push(q);
          d.topics = Array.from(new Set(d.questions.map(item => item.topic)));
          d.totalEstimatedMinutes = d.questions.reduce((a, b) => a + (b.estimatedMinutes || 30), 0);
          d.completedCount = d.questions.filter(item => item.completed).length;
          d.isFullyCompleted = d.questions.every(item => item.completed);
        });
      }
    }
    setLocal('study_plan', plan);
    return plan;
  },

  async resetStudyPlan() {
    try {
      await apiFetch(`${API_BASE}/planner/reset`, { method: 'POST', signal: AbortSignal.timeout(2000) });
    } catch (e) {}
    localStorage.removeItem('codestreak_study_plan');
    return true;
  }
};
