import { useEffect, useState, useMemo } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || ''
const API_URL = `${API_BASE}/api/tasks`

const emptyForm = {
  title: '',
  description: '',
  dueDate: new Date().toISOString().split('T')[0],
  priority: 'Medium',
  status: 'Pending'
}

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('dueDateAsc')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'

  useEffect(() => {
    loadTasks()
  }, [])

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3500)
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error('Network response was not ok')
      const data = await res.json()
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      showToast('Unable to connect to backend server. Make sure API is running.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const clearForm = () => {
    setForm({
      ...emptyForm,
      dueDate: new Date().toISOString().split('T')[0]
    })
    setEditId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) {
      showToast('Task title is required', 'error')
      return
    }
    if (!form.dueDate) {
      showToast('Due date is required', 'error')
      return
    }

    try {
      const url = editId ? `${API_URL}/${editId}` : API_URL
      const method = editId ? 'PUT' : 'POST'
      
      const payload = {
        title: form.title.trim(),
        description: form.description ? form.description.trim() : '',
        dueDate: form.dueDate,
        priority: form.priority,
        status: form.status
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Server error occurred')
      }

      showToast(editId ? 'Task updated successfully' : 'New task created successfully', 'success')
      clearForm()
      loadTasks()
    } catch (err) {
      showToast(err.message || 'Failed to save task', 'error')
    }
  }

  const handleEdit = (task) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      priority: task.priority || 'Medium',
      status: task.status || 'Pending'
    })
    setEditId(task.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) {
        // Fallback to full PUT if PATCH not supported
        const fallbackRes = await fetch(`${API_URL}/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...task, status: newStatus })
        })
        if (!fallbackRes.ok) throw new Error('Status update failed')
      }

      showToast(`Task status updated to "${newStatus}"`, 'success')
      loadTasks()
    } catch (err) {
      showToast('Failed to update status', 'error')
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this task'}"?`)) return
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      
      showToast('Task deleted successfully', 'success')
      if (editId === id) clearForm()
      loadTasks()
    } catch {
      showToast('Failed to delete task', 'error')
    }
  }

  // Dashboard calculations
  const stats = useMemo(() => {
    const total = tasks.length
    const pending = tasks.filter(t => t.status === 'Pending').length
    const inProgress = tasks.filter(t => t.status === 'In Progress').length
    const completed = tasks.filter(t => t.status === 'Completed').length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, pending, inProgress, completed, rate }
  }, [tasks])

  // Filtered & Sorted tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      )
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(t => t.status === statusFilter)
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter(t => t.priority === priorityFilter)
    }

    result.sort((a, b) => {
      if (sortBy === 'dueDateAsc') return (a.dueDate || '').localeCompare(b.dueDate || '')
      if (sortBy === 'dueDateDesc') return (b.dueDate || '').localeCompare(a.dueDate || '')
      if (sortBy === 'priority') {
        const order = { 'High': 1, 'Medium': 2, 'Low': 3 }
        return (order[a.priority] || 4) - (order[b.priority] || 4)
      }
      if (sortBy === 'idDesc') return b.id - a.id
      return a.id - b.id
    })

    return result
  }, [tasks, searchQuery, statusFilter, priorityFilter, sortBy])

  const isOverdue = (dateStr, status) => {
    if (!dateStr || status === 'Completed') return false
    const today = new Date().toISOString().split('T')[0]
    return dateStr < today
  }

  const isDueToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="toast-text">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo-group">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </div>
            <div>
              <h1 className="logo-title">Daily Task Manager</h1>
              <p className="logo-subtitle">Enterprise Full-Stack Task &amp; Workflow Orchestration</p>
            </div>
          </div>
          <div className="header-status">
            <span className="live-badge">
              <span className="pulse-dot"></span>
              Live Database Connected
            </span>
            <button className="btn-refresh" onClick={loadTasks} title="Refresh tasks" aria-label="Refresh tasks">
              ↻ Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* KPI Dashboard */}
        <section className="stats-grid">
          <div className="stat-card total">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-sub">Active repository records</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-sub">Needs attention</div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-label">In Progress</div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-sub">Under active work</div>
          </div>
          <div className="stat-card completed">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completed}</div>
            <div className="progress-bar-container">
              <div className="progress-fill" style={{ width: `${stats.rate}%` }}></div>
            </div>
            <div className="stat-sub">{stats.rate}% completion rate</div>
          </div>
        </section>

        {/* Task Form Card */}
        <section className="card form-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-indicator">{editId ? '✏️' : '➕'}</span>
              <div>
                <h2>{editId ? `Edit Task #${editId}` : 'Create New Task'}</h2>
                <p className="card-desc">
                  {editId ? 'Modify task details and save changes' : 'Add a new task to your daily schedule'}
                </p>
              </div>
            </div>
            {editId && (
              <button type="button" className="btn-cancel" onClick={clearForm}>
                ✕ Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="task-form">
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="task-title">Task Title <span className="req">*</span></label>
                <input
                  id="task-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Conduct production deployment verification"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="task-due-date">Due Date <span className="req">*</span></label>
                <input
                  id="task-due-date"
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide additional context, checklist items, or notes..."
                  rows="2"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="task-priority">Priority</label>
                <select id="task-priority" name="priority" value={form.priority} onChange={handleChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="task-status">Status</label>
                <select id="task-status" name="status" value={form.status} onChange={handleChange}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group flex-1 form-actions">
                <button type="submit" className="btn-submit">
                  {editId ? 'Save Changes' : 'Add Task'}
                </button>
                <button type="button" className="btn-clear" onClick={clearForm}>
                  Clear
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Task Management & List Card */}
        <section className="card list-card">
          <div className="toolbar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title or description..."
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            <div className="filters-group">
              <div className="filter-item">
                <label>Status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All ({tasks.length})</option>
                  <option value="Pending">Pending ({stats.pending})</option>
                  <option value="In Progress">In Progress ({stats.inProgress})</option>
                  <option value="Completed">Completed ({stats.completed})</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Priority:</label>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="ALL">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Sort:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="dueDateAsc">Due Date (Earliest)</option>
                  <option value="dueDateDesc">Due Date (Latest)</option>
                  <option value="priority">Priority</option>
                  <option value="idDesc">Newest First</option>
                </select>
              </div>

              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table View"
                >
                  ☰
                </button>
                <button 
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Cards View"
                >
                  ▦
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading tasks from database...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No tasks found</h3>
              <p>
                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first task above!'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="table-responsive">
              <table className="task-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th>Task</th>
                    <th style={{ width: '130px' }}>Due Date</th>
                    <th style={{ width: '110px' }}>Priority</th>
                    <th style={{ width: '160px' }}>Status</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className={`task-row ${task.status === 'Completed' ? 'is-completed' : ''}`}>
                      <td className="task-id">#{task.id}</td>
                      <td className="task-info">
                        <div className="task-title-cell">
                          <input
                            type="checkbox"
                            checked={task.status === 'Completed'}
                            onChange={(e) => handleQuickStatusChange(task, e.target.checked ? 'Completed' : 'Pending')}
                            title="Quick complete toggle"
                            className="task-checkbox"
                          />
                          <div>
                            <span className="task-title-text">{task.title}</span>
                            {task.description && (
                              <p className="task-desc-text">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`date-badge ${isOverdue(task.dueDate, task.status) ? 'overdue' : isDueToday(task.dueDate) ? 'today' : ''}`}>
                          {task.dueDate}
                          {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
                          {isDueToday(task.dueDate) && ' (Today)'}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge ${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`status-select ${task.status ? task.status.toLowerCase().replace(' ', '-') : 'pending'}`}
                          value={task.status || 'Pending'}
                          onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons">
                          <button
                            className="btn-action edit"
                            onClick={() => handleEdit(task)}
                            title="Edit task"
                          >
                            Edit
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDelete(task.id, task.title)}
                            title="Delete task"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="task-grid">
              {filteredTasks.map((task) => (
                <div key={task.id} className={`grid-card ${task.status === 'Completed' ? 'is-completed' : ''}`}>
                  <div className="grid-card-header">
                    <span className="task-id">#{task.id}</span>
                    <span className={`priority-badge ${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
                      {task.priority || 'Medium'}
                    </span>
                  </div>
                  <h3 className="grid-task-title">{task.title}</h3>
                  {task.description && <p className="grid-task-desc">{task.description}</p>}
                  <div className="grid-card-meta">
                    <span className={`date-badge ${isOverdue(task.dueDate, task.status) ? 'overdue' : isDueToday(task.dueDate) ? 'today' : ''}`}>
                      📅 {task.dueDate}
                    </span>
                    <select
                      className={`status-select ${task.status ? task.status.toLowerCase().replace(' ', '-') : 'pending'}`}
                      value={task.status || 'Pending'}
                      onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="grid-card-actions">
                    <button className="btn-action edit" onClick={() => handleEdit(task)}>
                      Edit
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(task.id, task.title)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>Daily Task Manager Enterprise v1.0.0 • Spring Boot 3.2.5 + React 18 + H2 In-Memory DB</p>
      </footer>
    </div>
  )
}

export default App
