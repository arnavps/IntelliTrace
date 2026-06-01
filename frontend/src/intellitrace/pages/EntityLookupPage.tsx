import { useState } from 'react';
import { 
  Search, Users, Filter, ArrowRight, Activity, 
  ShieldAlert, ShieldCheck, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';
import { useApi } from '../../hooks/useApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiEntity {
  id: string;
  name: string;
  type: string;
  risk_score: number;
  kyc_status: string;
  last_active_display: string;
}

interface EntitiesResponse {
  entities: ApiEntity[];
  total: number;
  page: number;
  limit: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EntityLookupPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const url = `/api/entities?search=${encodeURIComponent(searchQuery)}&type_filter=${encodeURIComponent(typeFilter)}&page=${currentPage}&limit=${limit}`;
  const { data, loading, error } = useApi<EntitiesResponse>(url, [searchQuery, typeFilter, currentPage]);

  const entities = data?.entities || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="it-content it-fade-in" style={{ maxWidth: 1400 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="it-page-heading">Entity Directory</h1>
          <p className="it-page-subtitle">Search and manage user profiles, accounts, and businesses</p>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 24,
          color: '#F87171', fontSize: 13,
        }}>
          ⚠ Failed to load entities: {error}
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="it-card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} color="#666" style={{ position: 'absolute', left: 14, top: 12 }} />
            <input
              type="text"
              placeholder="Search by ID, Name, Account..."
              className="it-input"
              style={{ width: '100%', paddingLeft: 40 }}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          
          {/* Type Filter */}
          <div style={{ position: 'relative' }}>
            <Filter size={14} color="#666" style={{ position: 'absolute', left: 12, top: 13 }} />
            <select 
              className="it-input" 
              style={{ paddingLeft: 34, appearance: 'none', paddingRight: 30, minWidth: 160 }}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="it-card">
        <div className="it-table-wrapper">
          <table className="it-table">
            <thead>
              <tr>
                <th>Entity Details</th>
                <th>Type</th>
                <th>Risk Score</th>
                <th>KYC Status</th>
                <th>Last Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#222' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ width: 120, height: 14, background: '#222', borderRadius: 4 }} />
                          <div style={{ width: 80, height: 12, background: '#222', borderRadius: 4 }} />
                        </div>
                      </div>
                    </td>
                    <td><div style={{ width: 80, height: 14, background: '#222', borderRadius: 4 }} /></td>
                    <td><div style={{ width: 40, height: 14, background: '#222', borderRadius: 4 }} /></td>
                    <td><div style={{ width: 70, height: 22, background: '#222', borderRadius: 12 }} /></td>
                    <td><div style={{ width: 100, height: 14, background: '#222', borderRadius: 4 }} /></td>
                    <td><div style={{ width: 30, height: 30, background: '#222', borderRadius: 6, marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : entities.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    No entities found matching your criteria.
                  </td>
                </tr>
              ) : (
                entities.map((entity) => (
                  <tr key={entity.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', 
                          background: 'rgba(255,255,255,0.05)', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', color: '#888'
                        }}>
                          {entity.type === 'Corporate' ? <Activity size={18} /> : <Users size={18} />}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, color: '#fff', fontSize: 13 }}>{entity.name}</p>
                          <p style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{entity.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: '#aaa' }}>{entity.type}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: entity.risk_score >= 80 ? '#EF4444' : entity.risk_score >= 50 ? '#F97316' : '#22C55E' 
                        }}>
                          {entity.risk_score}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`it-badge ${
                        entity.kyc_status === 'Verified' ? 'it-badge-success' : 
                        entity.kyc_status === 'Suspended' ? 'it-badge-danger' : 'it-badge-warning'
                      }`}>
                        {entity.kyc_status === 'Verified' && <ShieldCheck size={12} style={{ marginRight: 4 }} />}
                        {entity.kyc_status === 'Suspended' && <ShieldAlert size={12} style={{ marginRight: 4 }} />}
                        {entity.kyc_status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#888' }}>{entity.last_active_display}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/entity/${entity.id}`}>
                        <button className="it-btn it-btn-ghost" title="View Profile">
                          <ArrowRight size={16} />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div style={{ 
            padding: '16px 20px', 
            borderTop: '1px solid #222', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <span style={{ fontSize: 12, color: '#666' }}>
              Showing {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="it-page-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="it-page-btn" 
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
