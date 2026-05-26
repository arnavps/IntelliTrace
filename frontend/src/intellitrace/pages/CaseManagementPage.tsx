import React, { useState } from 'react';
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

/* ─── Types ─────────────────────────────────────────── */
type CaseStatus = 'Open' | 'In Progress' | 'Under Review' | 'Closed';
type CasePriority = 'Critical' | 'High' | 'Medium' | 'Low';
type CaseType = 'Money Laundering' | 'Fraud' | 'Insider Threat' | 'Synthetic ID';

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
  relatedAlert?: string;
  notes: CaseNote[];
  evidence: CaseEvidence[];
}

/* ─── Mock Data ─────────────────────────────────────── */
const MOCK_CASES: Case[] = [
  {
    id: 'CSE-0091',
    title: 'Rakesh Mehta Syndicate — Layering Network',
    type: 'Money Laundering',
    assignee: 'Priya Sharma',
    priority: 'Critical',
    status: 'In Progress',
    created: '2026-05-24',
    updated: '2026-05-26',
    relatedAlert: 'ALT-4821',
    description: 'Coordinated layering operation involving 7 accounts routed through Shell Corp Alpha. GraphSAGE confirmed syndicate membership. Total exposure: ₹3.2Cr over 14 days.',
    notes: [
      { author: 'Priya Sharma', time: '10:22 AM', text: 'Contacted HDFC compliance desk. Waiting for transaction trail documents.' },
      { author: 'Rohan Verma', time: '11:05 AM', text: 'STR draft completed, pending L2 approval before FIU submission.' },
      { author: 'System', time: '11:30 AM', text: 'Auto-linked 3 additional alerts matching community fingerprint Syndicate-7.' },
    ],
    evidence: [
      { name: 'transaction_trail_ACC4821.pdf', type: 'PDF', size: '2.4 MB', addedBy: 'Priya Sharma' },
      { name: 'graph_export_syndicate7.json', type: 'JSON', size: '512 KB', addedBy: 'System' },
      { name: 'kyc_documents_rakesh.zip', type: 'ZIP', size: '8.1 MB', addedBy: 'Compliance Desk' },
    ],
  },
  {
    id: 'CSE-0088',
    title: 'ATM Skimming Ring — Western Mumbai',
    type: 'Fraud',
    assignee: 'Arjun Nair',
    priority: 'High',
    status: 'Under Review',
    created: '2026-05-22',
    updated: '2026-05-25',
    relatedAlert: 'ALT-4790',
    description: 'Suspected ATM skimming operation affecting 34 customers across 6 branches. Card cloning confirmed by forensics team.',
    notes: [
      { author: 'Arjun Nair', time: '09:15 AM', text: 'Forensic team confirmed card cloning hardware at 2 ATM locations.' },
      { author: 'Kavya Reddy', time: '02:30 PM', text: 'Coordinating with local cybercrime cell for suspect identification.' },
    ],
    evidence: [
      { name: 'atm_cctv_footage_ref.mp4', type: 'MP4', size: '124 MB', addedBy: 'Branch Manager' },
      { name: 'affected_cards_list.xlsx', type: 'XLSX', size: '340 KB', addedBy: 'Arjun Nair' },
    ],
  },
  {
    id: 'CSE-0085',
    title: 'Synthetic Identity Fraud — Loan Portfolio',
    type: 'Synthetic ID',
    assignee: 'Meera Joshi',
    priority: 'High',
    status: 'Open',
    created: '2026-05-21',
    updated: '2026-05-21',
    description: 'AI detected 12 loan accounts with synthetic identity patterns — constructed identities using leaked PAN data combined with fabricated address proofs.',
    notes: [
      { author: 'Meera Joshi', time: '03:00 PM', text: 'Initiated KYC re-verification workflow for all 12 flagged accounts.' },
    ],
    evidence: [
      { name: 'synthetic_id_report_q2.pdf', type: 'PDF', size: '1.8 MB', addedBy: 'Meera Joshi' },
    ],
  },
  {
    id: 'CSE-0083',
    title: 'Insider Trading — Equities Desk Employee',
    type: 'Insider Threat',
    assignee: 'Rohan Verma',
    priority: 'Critical',
    status: 'Under Review',
    created: '2026-05-20',
    updated: '2026-05-24',
    description: 'Senior equities analyst flagged for trading on non-public information. Trades placed 48 hours before merger announcement with 340% abnormal returns.',
    notes: [
      { author: 'Rohan Verma', time: '10:00 AM', text: 'HR and Legal team notified. Access to trading terminals suspended pending investigation.' },
    ],
    evidence: [
      { name: 'trade_log_employee_9921.csv', type: 'CSV', size: '44 KB', addedBy: 'System' },
    ],
  },
  {
    id: 'CSE-0081',
    title: 'Trade-Based Money Laundering — Export Invoices',
    type: 'Money Laundering',
    assignee: 'Kavya Reddy',
    priority: 'High',
    status: 'In Progress',
    created: '2026-05-19',
    updated: '2026-05-23',
    description: 'Over-invoiced export transactions used to launder approximately ₹12Cr through fictitious trade with UAE-based shell entities.',
    notes: [
      { author: 'Kavya Reddy', time: '11:45 AM', text: 'Requested DGFT records and shipping manifests for cross-verification.' },
    ],
    evidence: [
      { name: 'invoice_discrepancy_analysis.xlsx', type: 'XLSX', size: '890 KB', addedBy: 'Kavya Reddy' },
    ],
  },
  {
    id: 'CSE-0079',
    title: 'Crypto-to-Fiat Conversion Ring',
    type: 'Money Laundering',
    assignee: 'Priya Sharma',
    priority: 'Medium',
    status: 'Open',
    created: '2026-05-18',
    updated: '2026-05-18',
    description: 'Multiple accounts identified converting large crypto holdings to fiat through P2P exchanges without reporting. Estimated volume: ₹8Cr.',
    notes: [],
    evidence: [],
  },
  {
    id: 'CSE-0075',
    title: 'BEC Fraud — Corporate Treasury Account',
    type: 'Fraud',
    assignee: 'Arjun Nair',
    priority: 'High',
    status: 'Closed',
    created: '2026-05-15',
    updated: '2026-05-22',
    description: 'Business Email Compromise attack resulted in ₹2.4Cr unauthorized transfer. Funds partially recovered through SWIFT recall.',
    notes: [
      { author: 'Arjun Nair', time: '04:00 PM', text: 'Case closed. ₹1.8Cr recovered. Remaining ₹60L written off. Cybercrime FIR filed.' },
    ],
    evidence: [
      { name: 'bec_forensic_report_final.pdf', type: 'PDF', size: '3.2 MB', addedBy: 'Arjun Nair' },
    ],
  },
  {
    id: 'CSE-0072',
    title: 'Smurfing — Cross-Branch Cash Deposits',
    type: 'Money Laundering',
    assignee: 'Meera Joshi',
    priority: 'Medium',
    status: 'Closed',
    created: '2026-05-12',
    updated: '2026-05-20',
    description: 'Structured cash deposits of ₹48,000–₹49,500 across 18 branches by related parties. Total: ₹4.2Cr in 3 weeks.',
    notes: [],
    evidence: [],
  },
  {
    id: 'CSE-0069',
    title: 'Phishing Campaign — Retail Banking Customers',
    type: 'Fraud',
    assignee: 'Rohan Verma',
    priority: 'Medium',
    status: 'Closed',
    created: '2026-05-10',
    updated: '2026-05-18',
    description: 'Coordinated phishing attack targeting retail customers. 89 accounts compromised. Total loss: ₹34L.',
    notes: [],
    evidence: [],
  },
  {
    id: 'CSE-0066',
    title: 'Ghost Employee Payroll Fraud',
    type: 'Insider Threat',
    assignee: 'Kavya Reddy',
    priority: 'Low',
    status: 'Closed',
    created: '2026-05-08',
    updated: '2026-05-16',
    description: 'HR manager created 6 fictitious employee records and diverted payroll totaling ₹18L over 4 months.',
    notes: [],
    evidence: [],
  },
  {
    id: 'CSE-0063',
    title: 'Real Estate Money Laundering — Property Purchases',
    type: 'Money Laundering',
    assignee: 'Priya Sharma',
    priority: 'Low',
    status: 'Closed',
    created: '2026-05-05',
    updated: '2026-05-14',
    description: 'Series of high-value property transactions used for placement of illicit funds. 4 properties identified, total value ₹9.8Cr.',
    notes: [],
    evidence: [],
  },
  {
    id: 'CSE-0059',
    title: 'Ponzi Scheme — Investment Club',
    type: 'Fraud',
    assignee: 'Arjun Nair',
    priority: 'Low',
    status: 'Closed',
    created: '2026-04-28',
    updated: '2026-05-10',
    description: 'Investment club operating Ponzi scheme across 240 victims. Total defrauded amount: ₹1.4Cr. Case referred to EOW.',
    notes: [],
    evidence: [],
  },
];

const STATS = [
  { label: 'Open Cases', value: 8, icon: <FolderOpen size={18} />, color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  { label: 'In Progress', value: 5, icon: <Loader size={18} />, color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)' },
  { label: 'Under Review', value: 3, icon: <Eye size={18} />, color: '#A78BFA', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
  { label: 'Closed', value: 47, icon: <CheckCircle size={18} />, color: '#4ADE80', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
];

const ASSIGNEES = ['Priya Sharma', 'Arjun Nair', 'Meera Joshi', 'Rohan Verma', 'Kavya Reddy'];

/* ─── Helper: badge class by status ─────────────────── */
function statusBadge(s: CaseStatus) {
  const map: Record<CaseStatus, string> = {
    'Open': 'it-badge-open',
    'In Progress': 'it-badge-progress',
    'Under Review': 'it-badge-review',
    'Closed': 'it-badge-closed',
  };
  return `it-badge ${map[s]}`;
}

function priorityBadge(p: CasePriority) {
  const map: Record<CasePriority, string> = {
    Critical: 'it-badge-critical',
    High: 'it-badge-high',
    Medium: 'it-badge-medium',
    Low: 'it-badge-low',
  };
  return `it-badge ${map[p]}`;
}

function typeColor(t: CaseType): string {
  const map: Record<CaseType, string> = {
    'Money Laundering': '#F87171',
    'Fraud': '#FB923C',
    'Insider Threat': '#A78BFA',
    'Synthetic ID': '#FDE047',
  };
  return map[t];
}

const KANBAN_COLS: { title: string; status: CaseStatus; badge: string }[] = [
  { title: 'Open', status: 'Open', badge: 'it-badge-open' },
  { title: 'In Progress', status: 'In Progress', badge: 'it-badge-progress' },
  { title: 'Under Review', status: 'Under Review', badge: 'it-badge-review' },
  { title: 'Closed', status: 'Closed', badge: 'it-badge-closed' },
];

/* ─── Create Case Modal ──────────────────────────────── */
function CreateCaseModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (c: Omit<Case, 'id' | 'created' | 'updated' | 'notes' | 'evidence'>) => void;
}) {
  const [form, setForm] = useState({
    title: '',
    type: 'Money Laundering' as CaseType,
    priority: 'High' as CasePriority,
    assignee: 'Priya Sharma',
    description: '',
    relatedAlert: '',
    status: 'Open' as CaseStatus,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onCreate(form);
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
              value={form.relatedAlert}
              onChange={e => setForm(f => ({ ...f, relatedAlert: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="it-btn it-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="it-btn it-btn-primary">
              <Folder size={15} /> Create Case
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Case Detail Drawer ─────────────────────────────── */
function CaseDrawer({ caseItem, onClose, onUpdate }: {
  caseItem: Case;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Case>) => void;
}) {
  const [newNote, setNewNote] = useState('');
  const navigate = useNavigate();

  function addNote() {
    if (!newNote.trim()) return;
    const note: CaseNote = {
      author: 'You (Current User)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newNote.trim(),
    };
    onUpdate(caseItem.id, { notes: [...caseItem.notes, note] });
    setNewNote('');
  }

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
                {caseItem.id}
              </span>
              <span className={priorityBadge(caseItem.priority)}>{caseItem.priority}</span>
              <span className={statusBadge(caseItem.status)}>{caseItem.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{caseItem.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {caseItem.relatedAlert && (
            <button
              className="it-btn it-btn-outline it-btn-sm"
              onClick={() => navigate(`/alerts/${caseItem.relatedAlert}`)}
            >
              View Alert {caseItem.relatedAlert}
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
              {caseItem.description || 'No description provided.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Investigator', value: caseItem.assignee, icon: <User size={12} /> },
              { label: 'Case Type', value: caseItem.type, icon: <Tag size={12} /> },
              { label: 'Created', value: caseItem.created, icon: <Clock size={12} /> },
              { label: 'Last Updated', value: caseItem.updated, icon: <Clock size={12} /> },
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
              Evidence Files ({caseItem.evidence.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {caseItem.evidence.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No evidence attached yet.</div>
              ) : caseItem.evidence.map((ev, i) => (
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
            {caseItem.status !== 'Closed' && (
              <button
                className="it-btn it-btn-sm"
                style={{ justifyContent: 'flex-start', width: '100%', background: 'rgba(239,68,68,0.1)', color: '#F87171', borderColor: 'rgba(239,68,68,0.3)' }}
                onClick={() => onUpdate(caseItem.id, { status: 'Closed' })}
              >
                <XCircle size={13} /> Close Case
              </button>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Update Status
            </div>
            <select
              className="it-input it-select"
              value={caseItem.status}
              onChange={e => onUpdate(caseItem.id, { status: e.target.value as CaseStatus })}
              style={{ fontSize: 12, height: 36 }}
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
            Investigation Notes ({caseItem.notes.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            {caseItem.notes.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes yet. Add the first note below.</div>
            ) : caseItem.notes.map((note, i) => (
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
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              style={{ resize: 'none', flex: 1, fontSize: 12 }}
            />
            <button
              className="it-btn it-btn-primary it-btn-sm"
              onClick={addNote}
              disabled={!newNote.trim()}
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
                  {c.notes.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MessageSquare size={10} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.notes.length} notes</span>
                    </div>
                  )}
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
  const [cases, setCases] = useState<Case[]>(MOCK_CASES);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [sortField] = useState<'updated' | 'created'>('updated');

  function handleCreate(data: Omit<Case, 'id' | 'created' | 'updated' | 'notes' | 'evidence'>) {
    const id = `CSE-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const today = new Date().toISOString().split('T')[0];
    const newCase: Case = { ...data, id, created: today, updated: today, notes: [], evidence: [] };
    setCases(prev => [newCase, ...prev]);
    setShowModal(false);
  }

  function handleUpdate(id: string, updates: Partial<Case>) {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated: new Date().toISOString().split('T')[0] } : c));
    if (selectedCase?.id === id) {
      setSelectedCase(prev => prev ? { ...prev, ...updates } : null);
    }
  }

  const filtered = cases
    .filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !c.id.toLowerCase().includes(search.toLowerCase()) &&
        !c.assignee.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== 'All' && c.status !== filterStatus) return false;
      if (filterPriority !== 'All' && c.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => b[sortField].localeCompare(a[sortField]));

  return (
    <div className="it-app" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <div
        className="it-content it-fade-in"
        style={{ padding: '24px', paddingBottom: selectedCase ? '60vh' : '24px', transition: 'padding-bottom 0.3s ease' }}
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
          {STATS.map(s => (
            <div
              key={s.label}
              className="it-card it-card-sm"
              style={{ borderColor: s.border, background: `linear-gradient(135deg, ${s.bg} 0%, var(--bg-card) 100%)` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No cases match the current filters.
                      </td>
                    </tr>
                  ) : filtered.map(c => (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedCase(prev => prev?.id === c.id ? null : c)}
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
                        {c.relatedAlert && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            Alert: {c.relatedAlert}
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
                            onClick={() => setSelectedCase(prev => prev?.id === c.id ? null : c)}
                            title="View Details"
                          >
                            {selectedCase?.id === c.id ? <ChevronDown size={13} /> : <Eye size={13} />}
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
                              onClick={() => handleUpdate(c.id, { status: 'Closed' })}
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
                Showing {filtered.length} of {cases.length} cases
              </span>
              <div className="it-pagination">
                <button className="it-page-btn" disabled><ChevronUp size={13} style={{ transform: 'rotate(-90deg)' }} /></button>
                {[1, 2, 3].map(p => (
                  <button key={p} className={`it-page-btn ${p === 1 ? 'active' : ''}`}>{p}</button>
                ))}
                <button className="it-page-btn"><ChevronUp size={13} style={{ transform: 'rotate(90deg)' }} /></button>
              </div>
            </div>
          </div>
        ) : (
          <KanbanView cases={filtered} onSelectCase={c => setSelectedCase(prev => prev?.id === c.id ? null : c)} />
        )}

      </div>

      {/* ── Modals & Drawers ──────────────────────────────── */}
      {showModal && (
        <CreateCaseModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}

      {selectedCase && (
        <CaseDrawer
          caseItem={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
