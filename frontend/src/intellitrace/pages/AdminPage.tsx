import React, { useState } from 'react';
import { Users, Settings, Activity, Shield, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Server, Database, Cpu, MemoryStick, ChevronRight, Save } from 'lucide-react';

// Mock Data
const MOCK_USERS = [
  { id: 'usr_1', name: 'Arjun Sharma', email: 'arjun@intellitrace.ai', role: 'Admin', status: 'Active', lastLogin: '10 mins ago', mfa: true },
  { id: 'usr_2', name: 'Priya Desai', email: 'priya@intellitrace.ai', role: 'Investigator', status: 'Active', lastLogin: '1 hr ago', mfa: true },
  { id: 'usr_3', name: 'Rohan Gupta', email: 'rohan@intellitrace.ai', role: 'Analyst', status: 'Inactive', lastLogin: '2 days ago', mfa: false },
  { id: 'usr_4', name: 'Sneha Patel', email: 'sneha@intellitrace.ai', role: 'Investigator', status: 'Active', lastLogin: '5 mins ago', mfa: true },
  { id: 'usr_5', name: 'Vikram Singh', email: 'vikram@intellitrace.ai', role: 'Admin', status: 'Active', lastLogin: 'Just now', mfa: true },
  { id: 'usr_6', name: 'Neha Reddy', email: 'neha@intellitrace.ai', role: 'Analyst', status: 'Suspended', lastLogin: '1 week ago', mfa: false },
  { id: 'usr_7', name: 'Amit Kumar', email: 'amit@intellitrace.ai', role: 'Investigator', status: 'Active', lastLogin: '3 hrs ago', mfa: true },
  { id: 'usr_8', name: 'Kavita Menon', email: 'kavita@intellitrace.ai', role: 'Analyst', status: 'Active', lastLogin: '4 hrs ago', mfa: true },
];

const RECENT_AUDITS = [
  { id: 1, action: 'Updated Fraud Threshold', user: 'Arjun Sharma', time: '10:45 AM today', details: 'Changed from 75 to 80' },
  { id: 2, action: 'Created New User', user: 'Vikram Singh', time: '09:12 AM today', details: 'Added Kavita Menon (Analyst)' },
  { id: 3, action: 'System Reboot', user: 'SYSTEM', time: '02:00 AM today', details: 'Scheduled weekly maintenance' },
  { id: 4, action: 'Suspended User', user: 'Arjun Sharma', time: '04:30 PM yesterday', details: 'Suspended Neha Reddy (Security policy)' },
  { id: 5, action: 'Updated Model Weights', user: 'SYSTEM_ML', time: '01:00 PM yesterday', details: 'GraphSAGE v2.4 deployed' },
];

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'thresholds' | 'health'>('users');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Form states for Add User
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Analyst');

  // Threshold states
  const [fraudThreshold, setFraudThreshold] = useState(75);
  const [escalationScore, setEscalationScore] = useState(90);
  const [strThreshold, setStrThreshold] = useState(85);
  const [dormantDays, setDormantDays] = useState(180);
  const [layeringWindow, setLayeringWindow] = useState(15);
  const [smurfingCount, setSmurfingCount] = useState(10);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]/30';
      case 'Investigator': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Analyst': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-500';
      case 'Inactive': return 'text-gray-500';
      case 'Suspended': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-[#999] mt-1">Manage users, roles, and system configuration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#1A1A1A] p-1 rounded-xl border border-[#2A2A2A] w-max">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'users' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-[#999] hover:text-white hover:bg-[#222]'
          }`}
        >
          <Users size={16} /> Users & Roles
        </button>
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'thresholds' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-[#999] hover:text-white hover:bg-[#222]'
          }`}
        >
          <Settings size={16} /> Threshold Settings
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'health' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-[#999] hover:text-white hover:bg-[#222]'
          }`}
        >
          <Activity size={16} /> System Health
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden min-h-[500px]">
        
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1F1F1F]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield size={18} className="text-[#F5A623]" /> System Users
              </h2>
              <button 
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4891A] text-black px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                <Plus size={16} /> Add User
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#222] border-b border-[#2A2A2A] text-xs uppercase tracking-wider text-[#999]">
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Last Login</th>
                    <th className="px-6 py-4 font-medium text-center">2FA</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {MOCK_USERS.map((user) => (
                    <tr key={user.id} className="border-b border-[#1E1E1E] hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A2A2A] to-[#444] flex items-center justify-center text-white font-bold text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-xs text-[#666]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium flex items-center gap-1.5 mt-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : user.status === 'Inactive' ? 'bg-gray-500' : 'bg-red-500'}`} />
                         <span className={getStatusColor(user.status)}>{user.status}</span>
                      </td>
                      <td className="px-6 py-4 text-[#999]">{user.lastLogin}</td>
                      <td className="px-6 py-4 text-center">
                        {user.mfa ? <Shield size={16} className="text-green-500 mx-auto" /> : <Shield size={16} className="text-gray-600 mx-auto" />}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 text-[#999] hover:text-white hover:bg-[#333] rounded transition-colors" title="Edit User">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-1.5 text-[#999] hover:text-[#F5A623] hover:bg-[#F5A623]/10 rounded transition-colors" title={user.status === 'Active' ? 'Deactivate' : 'Activate'}>
                            {user.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button className="p-1.5 text-[#999] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete User">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* THRESHOLDS TAB */}
        {activeTab === 'thresholds' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Detection Thresholds</h2>
                <p className="text-sm text-[#999]">Adjust the sensitivity of the AI risk scoring engine.</p>
              </div>
              <button className="flex items-center gap-2 bg-[#F5A623] hover:bg-[#D4891A] text-black px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                <Save size={16} /> Save Changes
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sliders */}
              <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-5 space-y-6">
                <h3 className="font-semibold text-white border-b border-[#2A2A2A] pb-2 mb-4">Risk Scores</h3>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Fraud Alert Threshold</span>
                    <span className="text-[#F5A623] font-mono">{fraudThreshold}</span>
                  </div>
                  <input type="range" min="0" max="100" value={fraudThreshold} onChange={(e) => setFraudThreshold(parseInt(e.target.value))} className="w-full accent-[#F5A623] h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer" />
                  <p className="text-xs text-[#666] mt-1">Minimum score to generate a dashboard alert.</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">Auto-escalation Score</span>
                    <span className="text-red-400 font-mono">{escalationScore}</span>
                  </div>
                  <input type="range" min="0" max="100" value={escalationScore} onChange={(e) => setEscalationScore(parseInt(e.target.value))} className="w-full accent-red-500 h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer" />
                  <p className="text-xs text-[#666] mt-1">Score above which cases are automatically marked Critical.</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white font-medium">STR Generation Threshold</span>
                    <span className="text-purple-400 font-mono">{strThreshold}</span>
                  </div>
                  <input type="range" min="0" max="100" value={strThreshold} onChange={(e) => setStrThreshold(parseInt(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-[#333] rounded-lg appearance-none cursor-pointer" />
                  <p className="text-xs text-[#666] mt-1">Score required to pre-fill an STR report.</p>
                </div>
              </div>

              {/* Number Inputs */}
              <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-5 space-y-6">
                <h3 className="font-semibold text-white border-b border-[#2A2A2A] pb-2 mb-4">Time Windows & Counts</h3>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Dormant Account Alert (days)</label>
                  <input type="number" value={dormantDays} onChange={(e) => setDormantDays(parseInt(e.target.value))} className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#F5A623] outline-none" />
                  <p className="text-xs text-[#666] mt-1">Days of inactivity before large transaction flags account.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Rapid Layering Window (minutes)</label>
                  <input type="number" value={layeringWindow} onChange={(e) => setLayeringWindow(parseInt(e.target.value))} className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#F5A623] outline-none" />
                  <p className="text-xs text-[#666] mt-1">Time window to check for immediate transfer of received funds.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Smurfing Transaction Count</label>
                  <input type="number" value={smurfingCount} onChange={(e) => setSmurfingCount(parseInt(e.target.value))} className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:border-[#F5A623] outline-none" />
                  <p className="text-xs text-[#666] mt-1">Number of small transactions to same destination to flag.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">System Health & Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { name: 'Kafka Pipeline', icon: Activity, status: 'Connected', ping: '12ms', color: 'text-green-500' },
                { name: 'Neo4j Graph DB', icon: Database, status: 'Connected', ping: '45ms', color: 'text-green-500' },
                { name: 'PostgreSQL DB', icon: Server, status: 'Connected', ping: '8ms', color: 'text-green-500' },
                { name: 'Redis Cache', icon: MemoryStick, status: 'Connected', ping: '2ms', color: 'text-green-500' },
              ].map((service, idx) => (
                <div key={idx} className="bg-[#111] border border-[#2A2A2A] rounded-xl p-4 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center mb-3">
                    <service.icon size={24} className={service.color} />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{service.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-500 font-medium">{service.status} ({service.ping})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Infrastructure */}
              <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-5">
                <h3 className="font-semibold text-white border-b border-[#2A2A2A] pb-2 mb-4 flex items-center gap-2">
                  <Cpu size={16} className="text-[#999]" /> Infrastructure Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-[#999]">CPU Usage</span><span className="text-white">34%</span></div>
                    <div className="w-full bg-[#222] rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '34%' }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-[#999]">Memory Usage</span><span className="text-white">67% (11.2/16 GB)</span></div>
                    <div className="w-full bg-[#222] rounded-full h-1.5"><div className="bg-[#F5A623] h-1.5 rounded-full" style={{ width: '67%' }}></div></div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-[#2A2A2A] mt-2">
                    <span className="text-sm text-[#999]">Kafka Consumer Lag</span>
                    <span className="text-sm font-mono text-white">230 ms</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-[#2A2A2A]">
                    <span className="text-sm text-[#999]">GNN Inference Latency</span>
                    <span className="text-sm font-mono text-green-400">&lt; 3 ms</span>
                  </div>
                </div>
              </div>

              {/* Model Performance */}
              <div className="bg-[#111] border border-[#2A2A2A] rounded-xl p-5">
                <h3 className="font-semibold text-white border-b border-[#2A2A2A] pb-2 mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-[#999]" /> Model Performance (GraphSAGE + XGB)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
                    <div className="text-xs text-[#999] uppercase tracking-wider mb-1">Accuracy</div>
                    <div className="text-xl font-bold text-white">97.2%</div>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
                    <div className="text-xs text-[#999] uppercase tracking-wider mb-1">Precision</div>
                    <div className="text-xl font-bold text-white">94.1%</div>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
                    <div className="text-xs text-[#999] uppercase tracking-wider mb-1">Recall</div>
                    <div className="text-xl font-bold text-white">91.8%</div>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2A2A2A]">
                    <div className="text-xs text-[#999] uppercase tracking-wider mb-1">F1 Score</div>
                    <div className="text-xl font-bold text-white">92.9%</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-[#666] italic text-center">Last validated against 10k test set: 2 days ago</div>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="mt-6 bg-[#111] border border-[#2A2A2A] rounded-xl p-5">
              <h3 className="font-semibold text-white border-b border-[#2A2A2A] pb-2 mb-4">Recent Audit Events</h3>
              <div className="space-y-3">
                {RECENT_AUDITS.map(audit => (
                  <div key={audit.id} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-[#F5A623] mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{audit.action}</span>
                        <span className="text-xs text-[#666]">&bull;</span>
                        <span className="text-xs text-[#999]">{audit.user}</span>
                        <span className="text-xs text-[#666]">&bull;</span>
                        <span className="text-xs text-[#666]">{audit.time}</span>
                      </div>
                      <div className="text-xs text-[#999] mt-0.5">{audit.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.7)] animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Add New User</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-[#666] hover:text-white transition-colors">
                <Trash2 size={20} className="opacity-0" /> {/* Just spacing, use a generic close icon or X if available, leaving blank for layout */}
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#F5A623] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@intellitrace.ai"
                  className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#F5A623] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">Role</label>
                <div className="relative">
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-[#222] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#F5A623] outline-none transition-colors appearance-none"
                  >
                    <option value="Analyst">Analyst</option>
                    <option value="Investigator">Investigator</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-3 top-3 text-[#666] rotate-90 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">Temporary Password</label>
                <input 
                  type="text" 
                  value="auto-generated-xyz123"
                  readOnly
                  className="w-full bg-[#222]/50 border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-[#666] text-sm outline-none cursor-not-allowed"
                />
                <p className="text-[10px] text-[#666] mt-1">An email will be sent with login instructions.</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#2A2A2A] flex justify-end gap-3 bg-[#111]">
              <button 
                onClick={() => setIsAddUserModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsAddUserModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#F5A623] text-black hover:bg-[#D4891A] transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
