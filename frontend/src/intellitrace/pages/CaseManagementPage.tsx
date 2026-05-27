import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutList,
  Columns,
  Eye,
  Edit2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Paperclip,
  MessageSquare,
  Send,
  Clock,
  User,
  Tag,
  Filter,
  Download,
  Folder,
  CheckCircle,
  Loader,
  FolderOpen,
  X,
} from 'lucide-react';
import '../styles/dashboard.css';
import { useApi, apiPost, apiPatch, getUser } from '../../hooks/useApi';

/* ─── Types ─────────────────────────────────────────── */
type CaseStatus = 'Open' | 'In Progress' | 'Under Review' | 'Closed';
type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low';
type CaseType = 'Money Laundering' | 'Fraud' | 'Insider Threat' | 'Synthetic ID' | string;

interface CaseNote {
  author: string;
  time: string;
  text: string;
}

interface CaseEvidence {
  name: string;
  type: string;
  size: string;
  addedBy: string;
}

interface Case {
  id: string;
  title: string;
  type: CaseType;
  assignee: string;
  priority: CasePriority;
  status: CaseStatus;
  created: string;
  updated: string;
  description: string;
  related_alert_id?: string;
  // Populated only when fetching case detail
  notes?: CaseNote[];
  evidence?: CaseEvidence[];
}

interface CaseDetail extends Case {
  notes: CaseNote[];
  evidence: CaseEvidence[];
}

interface CasesStats {
  Open: number;
  'In Progress': number;
  'Under Review': number;
  Closed: number;
}

interface CasesResponse {
  cases: Case[];
  stats: CasesStats;
}

/* ─── Constants ─────────────────────────────────────── */
const ASSIGNEES = ['Priya Sharma', 'Arjun Nair', 'Meera Joshi', 'Rohan Verma', 'Kavya Reddy'];

/* ─── Helper: badge class by status ─────────────────── */
function statusBadge(s: string) {
  const map: Record<string, string> = {
    'Open': 'it-badge-open',
    'In Progress': 'it-badge-progress',
    'Under Review': 'it-badge-review',
    'Closed': 'it-badge-closed',
  };
  return `it-badge ${map[s] ?? 'it-badge-neutral'}`;
}

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    Critical: 'it-badge-critical',
    High: 'it-badge-high',
    Medium: 'it-badge-medium',
    Low: 'it-badge-low',
  };
  return `it-badge ${map[p] ?? 'it-badge-neutral'}`;
}

function typeColor(t: string): string {
  const map: Record<string, string> = {
    'Money Laundering': '#F87171',
    'Fraud': '#FB923C',
    'Insider Threat': '#A78BFA',
    'Synthetic ID': '#FDE047',
  };
  return map[t] ?? '#60A5FA';
}

const KANBAN_COLS: { title: string; status: CaseStatus; badge: string }[] = [
  { title: 'Open', status: 'Open', badge: 'it-badge-open' },
  { title: 'In Progress', status: 'In Progress', badge: 'it-badge-progress' },
  { title: 'Under Review', status: 'Under Review', badge: 'it-badge-review' },
  { title: 'Closed', status: 'Closed', badge: 'it-badge-closed' },
];

/* ─── Create Case Modal ──────────────────────────────── */
interface CreateCaseModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateCaseModal({ onClose, onCreated }: CreateCaseModalProps) {
  const [form, setForm] = useState({
    title: '',
    type: 'Money Laundering' as CaseType,
    priority: 'High' as CasePriority,
    assignee: 'Priya Sharma',
    description: '',
    related_alert_id: '',
    status: 'Open' as CaseStatus,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiPost('/api/cases', {
        title: form.title,
        type: form.type,
        assignee: form.assignee,
        priority: form.priority,
        status: form.status,
        description: form.description,
        related_alert_id: form.related_alert_id || undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="it-modal-backdrop" onClick={onClose}>
      <div className="it-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="it-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div className="it-modal-title">Create New Case</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Open a new investigation case</div>
            </div>
          </div>
          <button className="it-btn it-btn-ghost it-btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="it-form-group">
            <label className="it-label">Case Title *</label>
            <input
              className="it-input"
              placeholder="e.g. Syndicate laundering via shell corps"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="it-form-group">
              <label className="it-label">Case Type</label>
              <select
                className="it-input it-select"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as CaseType }))}
              >
                <option>Money Laundering</option>
                <option>Fraud</option>
                <option>Insider Threat</option>
                <option>Synthetic ID</option>
              </select>
            </div>
            <div className="it-form-group">
              <label className="it-label">Priority</label>
              <select
                className="it-input it-select"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as CasePriority }))}
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div className="it-form-group">
            <label className="it-label">Assign To</label>
            <select
              className="it-input it-select"
              value={form.assignee}
              onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}
            >
              {ASSIGNEES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div className="it-form-group">
            <label className="it-label">Description</label>
            <textarea
              className="it-input"
              rows={3}
              placeholder="Describe the investigation scope, initial findings, and affected accounts..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          <div className="it-form-group">
            <label className="it-label">Related Alert ID (optional)</label>
            <input
              className="it-input"
              placeholder="e.g. ALT-4821"
              value={form.related_alert_id}
              onChange={e => setForm(f => ({ ...f, related_alert_id: e.target.value }))}
            />
          </div>

          {submitError && (
            <div style={{ color: '#F87171', fontSize: 12, marginBottom: 8 }}>{submitError}</div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="it-btn it-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="it-btn it-btn-primary" disabled={submitting}>
              <Folder size={15} /> {submitting ? 'Creating…' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Case Detail Drawer ─────────────────────────────── */
interface CaseDrawerProps {
  caseId: string;
  onClose: () => void;
  onCaseUpdated: () => void;
}

function CaseDrawer({ caseId, onClose, onCaseUpdated }: CaseDrawerProps) {
  const navigate = useNavigate();
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { data: caseDetail, loading, error, refetch } = useApi<CaseDetail>(`/api/cases/${caseId}`, [caseId]);

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return;
    const user = getUser();
    const author = user?.name ?? user?.username ?? 'Analyst';
    setAddingNote(true);
    try {
      await apiPost(`/api/cases/${caseId}/notes`, { author, text: newNote.trim() });
      setNewNote('');
      refetch();
    } catch {
      // silently fail — note still clears
    } finally {
      setAddingNote(false);
    }
  }, [newNote, caseId, refetch]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await apiPatch(`/api/cases/${caseId}`, { status: newStatus });
      refetch();
      onCaseUpdated();
    } catch {
      // ignore
    } finally {
      setUpdatingStatus(false);
    }
  }, [caseId, refetch, onCaseUpdated]);

  const handleCloseCase = useCallback(async () => {
    await handleStatusChange('Closed');
  }, [handleStatusChange]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 240, right: 0, zIndex: 500,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading case details…</span>
      </div>
    );
  }

  if (error || !caseDetail) {
    return (
      <div style={{
        position: 'fixed', bottom: 0, left: 240, right: 0, zIndex: 500,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 13, color: '#F87171' }}>Failed to load case: {error}</span>
        <button className="it-btn it-btn-ghost it-btn-sm" onClick={onClose}><X size={14} /></button>
      </div>
    );
  }

  const notes = caseDetail.notes ?? [];
  const evidence = caseDetail.evidence ?? [];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 240, right: 0, zIndex: 500,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border)',
      boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
      maxHeight: '55vh',
      display: 'flex', flexDirection: 'column',
      animation: 'slide-up 0.25s ease',
    }}>
      <style>{`@keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* Drawer Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: 'rgba(245,166,35,0.1)',
            border: '1px solid rgba(245,166,35,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Folder size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {caseDetail.id}
              </span>
              <span className={priorityBadge(caseDetail.priority)}>{caseDetail.priority}</span>
              <span className={statusBadge(caseDetail.status)}>{caseDetail.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{caseDetail.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {caseDetail.related_alert_id && (
            <button
              className="it-btn it-btn-outline it-btn-sm"
              onClick={() => navigate(`/alerts/${caseDetail.related_alert_id}`)}
            >
              View Alert {caseDetail.related_alert_id}
            </button>
          )}
          <button className="it-btn it-btn-ghost it-btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr',
        gap: 0, flex: 1, overflow: 'hidden',
      }}>
        {/* Left: Details + Description */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Description
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {caseDetail.description || 'No description provided.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Investigator', value: caseDetail.assignee, icon: <User size={12} /> },
              { label: 'Case Type', value: caseDetail.type, icon: <Tag size={12} /> },
              { label: 'Created', value: caseDetail.created, icon: <Clock size={12} /> },
              { label: 'Last Updated', value: caseDetail.updated, icon: <Clock size={12} /> },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--bg-card-el)', borderRadius: 8, padding: '10px 12px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Evidence */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Evidence Files ({evidence.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {evidence.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No evidence attached yet.</div>
              ) : evidence.map((ev, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg-card-el)', borderRadius: 8, padding: '8px 12px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Paperclip size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{ev.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ev.size} · {ev.addedBy}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: 'var(--border)', color: 'var(--text-secondary)',
                  }}>
                    {ev.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle: Quick Info */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="it-btn it-btn-outline it-btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Edit2 size={13} /> Edit Case
            </button>
            <button className="it-btn it-btn-outline it-btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Paperclip size={13} /> Attach Evidence
            </button>
            <button className="it-btn it-btn-outline it-btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Download size={13} /> Export Report
            </button>
            {caseDetail.status !== 'Closed' && (
              <button
                className="it-btn it-btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%', background: 'rgba(239,68,68,0.1)', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}
                onClick={handleCloseCase}
                disabled={updatingStatus}
              >
                <XCircle size={13} /> {updatingStatus ? 'Closing…' : 'Close Case'}
              </button>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Update Status
            </div>
            <select
              className="it-input it-select"
              value={caseDetail.status}
              onChange={e => handleStatusChange(e.target.value)}
              style={{ fontSize: 12, height: 36 }}
              disabled={updatingStatus}
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Under Review</option>
              <option>Closed</option>
            </select>
          </div>
        </div>

        {/* Right: Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 20px', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, flexShrink: 0 }}>
            Investigation Notes ({notes.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {notes.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes yet. Add the first note below.</div>
            ) : notes.map((note, i) => (
              <div key={i} style={{
                background: 'var(--bg-card-el)', borderRadius: 8, padding: '10px 12px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: note.author === 'System' ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {note.author}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{note.time}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{note.text}</p>
              </div>
            ))}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
            <textarea
              className="it-input"
              rows={2}
              placeholder="Add investigation note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
              style={{ resize: 'none', flex: 1, fontSize: 12 }}
            />
            <button
              className="it-btn it-btn-primary it-btn-sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || addingNote}
              style={{ alignSelf: 'flex-end', padding: '10px 12px' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Kanban View ────────────────────────────────────── */
function KanbanView({ cases, onSelectCase }: { cases: Case[]; onSelectCase: (c: Case) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
      {KANBAN_COLS.map(col => {
        const colCases = cases.filter(c => c.status === col.status);
        return (
          <div key={col.status}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {col.title}
              </span>
              <span className={`it-badge ${col.badge}`} style={{ fontSize: 10 }}>{colCases.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colCases.map(c => (
                <div
                  key={c.id}
                  className="it-card it-card-sm"
                  style={{ cursor: 'pointer', padding: '12px 14px' }}
                  onClick={() => onSelectCase(c)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--accent)' }}>{c.id}</span>
                    <span className={priorityBadge(c.priority)} style={{ fontSize: 9 }}>{c.priority}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>
                    {c.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.assignee.split(' ')[0]}</span>
                    <span style={{ fontSize: 10, color: typeColor(c.type), fontWeight: 600 }}>{c.type}</span>
                  </div>
                </div>
              ))}
              {colCases.length === 0 && (
                <div style={{
                  background: 'var(--bg-card-el)', border: '1px dashed var(--border)',
                  borderRadius: 10, padding: '20px 14px', textAlign: 'center',
                  fontSize: 12, color: 'var(--text-muted)',
                }}>
                  No cases
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */
export function CaseManagementPage() {
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [showModal, setShowModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  // Trigger a refetch by incrementing this counter
  const [fetchRevision, setFetchRevision] = useState(0);

  const params = new URLSearchParams({
    search,
    status: filterStatus,
    priority: filterPriority,
  });
  const { data, loading } = useApi<CasesResponse>(`/api/cases?${params.toString()}`, [
    search, filterStatus, filterPriority, fetchRevision,
  ]);

  const cases = data?.cases ?? [];
  const stats = data?.stats ?? { Open: 0, 'In Progress': 0, 'Under Review': 0, Closed: 0 };

  const refetchCases = useCallback(() => {
    setFetchRevision(v => v + 1);
  }, []);

  const STATS_CONFIG = [
    { label: 'Open Cases',   key: 'Open' as keyof CasesStats,          icon: <FolderOpen size={18} />,   color: '#60A5FA', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.2)' },
    { label: 'In Progress',  key: 'In Progress' as keyof CasesStats,    icon: <Loader size={18} />,       color: '#F5A623', bg: 'rgba(245,166,35,0.1)',   border: 'rgba(245,166,35,0.2)' },
    { label: 'Under Review', key: 'Under Review' as keyof CasesStats,   icon: <Eye size={18} />,          color: '#A78BFA', bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.2)' },
    { label: 'Closed',       key: 'Closed' as keyof CasesStats,         icon: <CheckCircle size={18} />,  color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.2)' },
  ];

  return (
    <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div
        className="it-content it-fade-in"
        style={{ padding: '24px', paddingBottom: selectedCaseId ? '60vh' : '24px', transition: 'padding-bottom 0.3s ease' }}
      >

        {/* ── Page Header ────────────────────────────────── */}
        <div className="it-page-header">
          <div>
            <h1 className="it-page-heading">Case Management</h1>
            <p className="it-page-subheading">Manage investigations and track progress across your team</p>
          </div>
          <button className="it-btn it-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Create New Case
          </button>
        </div>

        {/* ── Stats Row ──────────────────────────────────── */}
        <div className="it-stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS_CONFIG.map(s => (
            <div
              key={s.label}
              className="it-card it-card-sm"
              style={{ borderColor: s.border, background: `linear-gradient(135deg, ${s.bg} 0%, var(--bg-card) 100%)` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                    {loading ? '—' : stats[s.key]}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="it-search" style={{ flex: 1, minWidth: 220 }}>
            <Search size={14} className="it-search-icon" />
            <input
              className="it-input"
              placeholder="Search cases by title, ID or assignee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              className="it-input it-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ width: 140, fontSize: 12, height: 38 }}
            >
              <option value="All">All Statuses</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Under Review</option>
              <option>Closed</option>
            </select>
            <select
              className="it-input it-select"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              style={{ width: 140, fontSize: 12, height: 38 }}
            >
              <option value="All">All Priorities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="it-tabs" style={{ marginBottom: 0 }}>
            <button
              className={`it-tab ${view === 'table' ? 'active' : ''}`}
              onClick={() => setView('table')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LayoutList size={13} /> Table
            </button>
            <button
              className={`it-tab ${view === 'kanban' ? 'active' : ''}`}
              onClick={() => setView('kanban')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Columns size={13} /> Kanban
            </button>
          </div>
        </div>

        {/* ── Table / Kanban View ──────────────────────── */}
        {view === 'table' ? (
          <div className="it-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="it-table-wrap">
              <table className="it-table">
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Loading cases…
                      </td>
                    </tr>
                  ) : cases.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No cases match the current filters.
                      </td>
                    </tr>
                  ) : cases.map(c => (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedCaseId(prev => prev === c.id ? null : c.id)}
                    >
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                          {c.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)', fontWeight: 500, fontSize: 13 }}>
                          {c.title}
                        </div>
                        {c.related_alert_id && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            Alert: {c.related_alert_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: typeColor(c.type), fontWeight: 500 }}>{c.type}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 700, color: '#000', flexShrink: 0,
                          }}>
                            {c.assignee.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span style={{ fontSize: 12 }}>{c.assignee}</span>
                        </div>
                      </td>
                      <td><span className={priorityBadge(c.priority)}>{c.priority}</span></td>
                      <td><span className={statusBadge(c.status)}>{c.status}</span></td>
                      <td style={{ fontSize: 12 }}>{c.created}</td>
                      <td style={{ fontSize: 12 }}>{c.updated}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            className="it-btn it-btn-ghost it-btn-sm"
                            style={{ padding: '5px 8px' }}
                            onClick={() => setSelectedCaseId(prev => prev === c.id ? null : c.id)}
                            title="View Details"
                          >
                            {selectedCaseId === c.id ? <ChevronDown size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            className="it-btn it-btn-ghost it-btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Edit Case"
                          >
                            <Edit2 size={13} />
                          </button>
                          {c.status !== 'Closed' && (
                            <button
                              className="it-btn it-btn-ghost it-btn-sm"
                              style={{ padding: '5px 8px', color: '#F87171' }}
                              onClick={async () => {
                                await apiPatch(`/api/cases/${c.id}`, { status: 'Closed' });
                                refetchCases();
                              }}
                              title="Close Case"
                            >
                              <XCircle size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {cases.length} case{cases.length !== 1 ? 's' : ''}
              </span>
              <div className="it-pagination">
                <button className="it-page-btn" disabled><ChevronUp size={13} style={{ transform: 'rotate(-90deg)' }} /></button>
                {[1].map(p => (
                  <button key={p} className={`it-page-btn ${p === 1 ? 'active' : ''}`}>{p}</button>
                ))}
                <button className="it-page-btn"><ChevronUp size={13} style={{ transform: 'rotate(90deg)' }} /></button>
              </div>
            </div>
          </div>
        ) : (
          <KanbanView
            cases={cases}
            onSelectCase={c => setSelectedCaseId(prev => prev === c.id ? null : c.id)}
          />
        )}

      </div>

      {/* ── Modals & Drawers ──────────────────────────────── */}
      {showModal && (
        <CreateCaseModal
          onClose={() => setShowModal(false)}
          onCreated={refetchCases}
        />
      )}

      {selectedCaseId && (
        <CaseDrawer
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={refetchCases}
        />
      )}
    </div>
  );
}
