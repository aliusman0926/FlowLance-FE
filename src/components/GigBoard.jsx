import React, { useEffect, useState } from 'react';
import './GigBoard.css';
import { FaPlusCircle } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import { FaRegCheckCircle } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { TbRefresh } from "react-icons/tb";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// GigBoard.jsx
// Single-file React component (default export) that implements a minimal, modern, Jira-like
// gig management board. Uses TailwindCSS classes for styling.
// Expectations:
// - An auth token should be available at localStorage.getItem('token') and will be sent as
//   Authorization: Bearer <token> for protected backend routes.
// - Backend routes used:
//    GET  /api/gigs/user
//    POST /api/gigs
//    PUT  /api/gigs/:id
//    DELETE /api/gigs/:id
//    GET  /api/milestones/gig/:gigId
//    POST /api/milestones/gig/:gigId
//    PUT  /api/milestones/:id
//    DELETE /api/milestones/:id
// - This file is purposely a single component file for easy copy-paste into a project.

export default function GigBoard() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [selectedGig, setSelectedGig] = useState(null);
  const [modalType, setModalType] = useState(null); // 'addGig'|'editGig'|'addMilestone'|'editMilestone'
  const [formData, setFormData] = useState({});
  const [milestones, setMilestones] = useState({}); // map gigId -> array of milestones

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const API = {
    fetchGigs: async () => {
      const res = await fetch('/api/gigs/user', { headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    fetchMilestones: async (gigId) => {
      const res = await fetch(`/api/milestones/gig/${gigId}`, { headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    createGig: async (payload) => {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    updateGig: async (id, payload) => {
      const res = await fetch(`/api/gigs/${id}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    deleteGig: async (id) => {
      const res = await fetch(`/api/gigs/${id}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    createMilestone: async (gigId, payload) => {
      const res = await fetch(`/api/milestones/gig/${gigId}`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    updateMilestone: async (id, payload) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    deleteMilestone: async (id) => {
      const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    }
  };

  function authHeader() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    loadGigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadGigs() {
    try {
      setLoading(true);
      const data = await API.fetchGigs();
      setGigs(data);

      // Fetch milestones for each gig in parallel
      const msPromises = data.map(g => API.fetchMilestones(g._id).then(list => ({ id: g._id, list })).catch(() => ({ id: g._id, list: [] })));
      const msResults = await Promise.all(msPromises);
      const msMap = {};
      msResults.forEach(r => { msMap[r.id] = r.list; });
      setMilestones(msMap);

      setError(null);
    } catch (err) {
      setError(err.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  // CRUD handlers
  async function handleAddGig(payload) {
    try {
      const newGig = await API.createGig(payload);
      setGigs(prev => [newGig, ...prev]);
      setMilestones(prev=> ({ ...prev, [newGig._id]: [] }));
      closeModal();
    } catch (err) {
      alert('Error creating gig: ' + (err.message || JSON.stringify(err)));
    }
  }

  async function handleUpdateGig(id, payload) {
    try {
      const updated = await API.updateGig(id, payload);
      setGigs(prev => prev.map(g => g._id === id ? updated : g));
      closeModal();
    } catch (err) {
      alert('Error updating gig: ' + (err.message || JSON.stringify(err)));
    }
  }

  async function handleDeleteGig(id) {
    if (!confirm('Delete this gig and all its milestones?')) return;
    try {
      await API.deleteGig(id);
      setGigs(prev => prev.filter(g => g._id !== id));
      const copy = { ...milestones }; delete copy[id]; setMilestones(copy);
    } catch (err) {
      alert('Error deleting gig: ' + (err.message || JSON.stringify(err)));
    }
  }

  async function handleAddMilestone(gigId, payload) {
    try {
      const created = await API.createMilestone(gigId, payload);
      setMilestones(prev => ({ ...prev, [gigId]: [...(prev[gigId]||[]), created] }));
      closeModal();
    } catch (err) {
      alert('Error creating milestone: ' + (err.message || JSON.stringify(err)));
    }
  }

  async function handleUpdateMilestone(gigId, id, payload) {
    try {
      const updated = await API.updateMilestone(id, payload);
      setMilestones(prev => ({ ...prev, [gigId]: prev[gigId].map(m => m._id === id ? updated : m) }));
      closeModal();
    } catch (err) {
      alert('Error updating milestone: ' + (err.message || JSON.stringify(err)));
    }
  }

  async function handleDeleteMilestone(gigId, id) {
    if (!confirm('Delete this milestone?')) return;
    try {
      await API.deleteMilestone(id);
      setMilestones(prev => ({ ...prev, [gigId]: prev[gigId].filter(m => m._id !== id) }));
    } catch (err) {
      alert('Error deleting milestone: ' + (err.message || JSON.stringify(err)));
    }
  }

  // Mark complete toggles
  async function toggleMilestoneDone(gigId, m) {
    const newStatus = m.status === 'Done' ? 'To Do' : 'Done';
    await handleUpdateMilestone(gigId, m._id, { ...m, status: newStatus });
  }

  async function toggleGigComplete(g) {
    const newStatus = g.status === 'Completed' ? 'Open' : 'Completed';
    await handleUpdateGig(g._id, { ...g, status: newStatus });
  }

  function openModal(type, payload = {}) {
    setModalType(type);
    setFormData(payload);
    setSelectedGig(payload.gig || null);
    // If payload has gigId use that
    if (payload.gig && payload.gig._id) setSelectedGig(payload.gig);
  }
  function closeModal() { setModalType(null); setFormData({}); setSelectedGig(null); }

  // Simple columns based on gig status
  const columns = ['Open', 'In Progress', 'Completed', 'Archived'];

  return (
    <div className="gig-board">
      <header className="gig-board-header">
        <h1></h1>
        <div className="header-actions">
          <button className="btn" onClick={()=>openModal('addGig')}>+ New Gig</button>
          <button className="btn-secondary" onClick={loadGigs}><TbRefresh /></button>
        </div>
      </header>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="board-columns">
          {columns.map(col => (
            <div key={col} className="board-column">
              <h2>{col}</h2>
              <div className="space-y-3">
                {gigs.filter(g => g.status === col).map(g => (
                  <div key={g._id} className="gig-card">
                    <div className="gig-card-header">
                      <div>
                        <h3 className="gig-title">{g.title}</h3>
                        <p className="gig-client">{g.clientName || '—'}</p>
                        <p className="gig-desc">{g.description?.slice(0, 120)}</p>
                        <div className="gig-actions">
                          <button className="btn-secondary" onClick={()=>{ openModal('addMilestone', { gigId: g._id, gig: g }); }}><FaPlusCircle /></button>
                          <button className="btn-secondary" onClick={()=>{ openModal('editGig', g); }}><FaEdit /></button>
                          <button className="btn" onClick={()=>toggleGigComplete(g)}>{g.status==='Completed'?<FaRegCheckCircle />:<FaCheckCircle />}</button>
                          <button className="btn-danger" onClick={()=>handleDeleteGig(g._id)}><FaTrash></FaTrash></button>
                        </div>
                      </div>
                      <div className="gig-meta">
                        <div>Value</div>
                        <div className="strong">${Number(g.totalValue||0).toFixed(2)}</div>
                        <div className="gig-meta">Due: {g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '—'}</div>
                      </div>
                    </div>

                    {/* Milestones list */}
                    <div className="milestones">
                      {(milestones[g._id]||[]).map(m => (
                        <div key={m._id} className="milestone">
                          <div>
                            <div className="milestone-title">{m.title}</div>
                            <div className="milestone-desc">{m.description?.slice(0, 80)}</div>
                            <div className="milestone-meta">{m.status} • ${Number(m.paymentAmount||0).toFixed(2)}</div>
                          </div>
                          <div className="milestone-actions">
                            <div className="milestone-actions">
                              <button title="Toggle Done" className="milestone-btn" onClick={()=>toggleMilestoneDone(g._id, m)}>{m.status==='Done'?<FaCheckCircle />:<FaRegCheckCircle />}</button>
                              <button title="Edit" className="btn-secondary" onClick={()=>openModal('editMilestone', { gigId: g._id, milestone: m })}><FaEdit /></button>
                              <button title="Delete" className="btn-danger" onClick={()=>handleDeleteMilestone(g._id, m._id)}><FaTrash /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalType && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {modalType === 'addGig' && 'Create Gig'}
                {modalType === 'editGig' && 'Edit Gig'}
                {modalType === 'addMilestone' && 'Create Milestone'}
                {modalType === 'editMilestone' && 'Edit Milestone'}
              </h3>
              <button className="btn" onClick={closeModal}>✕</button>
            </div>

            <form className='txn-form' onSubmit={e => {
              e.preventDefault();
              if (modalType === 'addGig') return handleAddGig(formData);
              if (modalType === 'editGig') return handleUpdateGig(formData._id, formData);
              if (modalType === 'addMilestone') return handleAddMilestone(formData.gigId, formData);
              if (modalType === 'editMilestone') return handleUpdateMilestone(formData.gigId, formData.milestone._id, { ...formData.milestone, ...formData });
            }}>

              {/* Gig fields */}
              {(modalType === 'addGig' || modalType === 'editGig') && (
                <div className="txn-form-group">
                  <input placeholder="Title" value={formData.title||''} onChange={e=>setFormData({...formData, title: e.target.value})} required />
                  <textarea placeholder="Description" value={formData.description||''} onChange={e=>setFormData({...formData, description: e.target.value})} />
                  <div className="modal-grid">
                    <input className="p-2 border rounded" placeholder="Client Name" value={formData.clientName||''} onChange={e=>setFormData({...formData, clientName: e.target.value})} />
                    <input className="p-2 border rounded" placeholder="Total Value" type="number" value={formData.totalValue||0} onChange={e=>setFormData({...formData, totalValue: Number(e.target.value)})} />
                    <select className="p-2 border rounded" value={formData.status||'Open'} onChange={e=>setFormData({...formData, status: e.target.value})}>
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Archived</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Milestone fields */}
              {(modalType === 'addMilestone' || modalType === 'editMilestone') && (
                <div className="txn-form-group">
                  <input className="w-full p-2 border rounded" placeholder="Title" value={(modalType==='editMilestone' ? (formData.milestone?.title) : formData.title) || ''} onChange={e=>{
                    if (modalType==='editMilestone') setFormData({...formData, milestone: {...formData.milestone, title: e.target.value}});
                    else setFormData({...formData, title: e.target.value});
                  }} required />
                  <textarea className="w-full p-2 border rounded" placeholder="Description" value={(modalType==='editMilestone' ? (formData.milestone?.description) : formData.description) || ''} onChange={e=>{
                    if (modalType==='editMilestone') setFormData({...formData, milestone: {...formData.milestone, description: e.target.value}});
                    else setFormData({...formData, description: e.target.value});
                  }} />

                  <div className="modal-grid">
                    <input className="p-2 border rounded" placeholder="Payment Amount" type="number" value={(modalType==='editMilestone' ? (formData.milestone?.paymentAmount) : formData.paymentAmount) || 0} onChange={e=>{
                      const val = Number(e.target.value);
                      if (modalType==='editMilestone') setFormData({...formData, milestone: {...formData.milestone, paymentAmount: val}});
                      else setFormData({...formData, paymentAmount: val});
                    }} />

                    <select className="p-2 border rounded" value={(modalType==='editMilestone' ? (formData.milestone?.status) : formData.status) || 'To Do'} onChange={e=>{
                      if (modalType==='editMilestone') setFormData({...formData, milestone: {...formData.milestone, status: e.target.value}});
                      else setFormData({...formData, status: e.target.value});
                    }}>
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Blocked</option>
                      <option>Done</option>
                    </select>

                    <DatePicker
                        selected={
                            modalType === "editMilestone"
                            ? formData.milestone?.dueDate
                                ? new Date(formData.milestone.dueDate)
                                : null
                            : formData.dueDate
                            ? new Date(formData.dueDate)
                            : null
                        }
                        onChange={(date) => {
                            const v = date ? date.toISOString().split("T")[0] : "";

                            if (modalType === "editMilestone") {
                            setFormData({
                                ...formData,
                                milestone: {
                                ...formData.milestone,
                                dueDate: v,
                                },
                            });
                            } else {
                            setFormData({
                                ...formData,
                                dueDate: v,
                            });
                            }
                        }}
                        placeholderText="Due Date"
                        dateFormat="MMM d, yyyy"
                        className="date-pill"
                        calendarClassName="dark-calendar"
                        popperClassName="calendar-popper"
                        showPopperArrow={false}
                        />
                  </div>

                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn" onClick={closeModal}>Cancel</button>
                <button className="btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
