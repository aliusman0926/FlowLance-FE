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
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";


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
  const sensors = useSensors(
  useSensor(PointerSensor, {
        activationConstraint: {
        distance: 8,
        },
    })
    );

  // UI state
  const [selectedGig, setSelectedGig] = useState(null);
  const [modalType, setModalType] = useState(null); // 'addGig'|'editGig'|'addMilestone'|'editMilestone'
  const [formData, setFormData] = useState({});
  const [milestones, setMilestones] = useState({}); // map gigId -> array of milestones
  const [invoicePrompt, setInvoicePrompt] = useState({
          open: false,
          milestoneId: null,
          clientName: '',
          freelancerName: ''
        });

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
      await loadGigs(); // refresh gig totals
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

  // Drag and drop handlers
  async function handleDragEnd(event) {
    const { active, over } = event;

    // dropped outside any column
    if (!over) return;

    const gigId = active.id;
    const newStatus = over.id; // ✅ this is now column name

    // Safety check
    if (!columns.includes(newStatus)) return;

    const gig = gigs.find(g => g._id === gigId);
    if (!gig || gig.status === newStatus) return;

    // Optimistic UI
    setGigs(prev =>
        prev.map(g =>
        g._id === gigId ? { ...g, status: newStatus } : g
        )
    );

    try {
        await API.updateGig(gigId, { status: newStatus });
    } catch (err) {
        console.error(err);
        loadGigs(); // rollback if backend fails
    }
}

  // Mark complete toggles
  async function toggleMilestoneDone(gigId, m) {
    const newStatus = m.status === 'Done' ? 'To Do' : 'Done';
    await handleUpdateMilestone(gigId, m._id, { ...m, status: newStatus });
    
    // 🔥 Open invoice prompt
    if (newStatus === 'Done') {
      setInvoicePrompt({
        open: true,
        milestoneId: m._id,
      });
    }
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

  const getBackendBaseUrl = () => {
    const { protocol, hostname } = window.location;

    // Assumes backend runs on same host but different port (common setup)
    return `${protocol}//${hostname}:3000/api`;
  };

  const generateInvoice = async (milestoneId, clientName, freelancerName) => {
    try {
      if ( clientName == null || freelancerName == null || clientName.trim() === '' || freelancerName.trim() === '' ) {
        alert('Please provide both client and freelancer names to generate invoice.');
        return;
      }

      const params = new URLSearchParams({
        clientName,
        freelancerName
      });

      const response = await fetch(
        `${getBackendBaseUrl()}/milestones/${milestoneId}/invoice?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      alert('Error generating invoice.');
    }
  };

  return (
    <div className="gig-board">
      <div className="dashboard-hero">
                    <div>
                      <p className="eyebrow">Gigs overview</p>
                      <h1>Project Management</h1>
                      <p className="subtext">Manage all ongoing and upcoming gigs and milestones.</p>
                    </div>
                    <div className='header-actions'>
                    <button className="ghost-button green-bg" onClick={()=>openModal('addGig')}>+ New Gig</button>
                    <button className="ghost-button" onClick={loadGigs} disabled={loading}>
                      {loading ? 'Refreshing…' : <TbRefresh />}
                    </button>
                    </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="board-columns">
            {columns.map(col => (
                <DroppableColumn key={col} id={col}>
                <h2>{col}</h2>
                <div className="space-y-3">
                    <SortableContext
                    items={gigs.filter(g => g.status === col).map(g => g._id)}
                    strategy={verticalListSortingStrategy}
                    >
                    {gigs.filter(g => g.status === col).map(g => (
                    <DraggableGig key={g._id} gig={g}>
                    <div className="gig-card">
                        <div className="gig-card-header">
                        <div>
                            <h3 className="gig-title">{g.title}</h3>
                            <p className="gig-client">{g.clientName || '—'}</p>
                            <p className="gig-desc">{g.description?.slice(0, 120)}</p>
                            <div className="gig-actions">
                            <button className="btn-secondary" onClick={()=>{ openModal('addMilestone', { gigId: g._id, gig: g }); }}><FaPlusCircle /></button>
                            <button className="btn-secondary" onClick={()=>{ openModal('editGig', g); }}><FaEdit /></button>
                            <button className="btn" onClick={()=>toggleGigComplete(g)}>{g.status==='Completed'?<FaCheckCircle />:<FaRegCheckCircle />}</button>
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
                                <button title="Toggle Done" className="milestone-btn" onClick={() => toggleMilestoneDone(g._id,m)}>{m.status==='Done'?<FaCheckCircle />:<FaRegCheckCircle />}</button>
                                <button title="Edit" className="btn-secondary" onClick={()=>openModal('editMilestone', { gigId: g._id, milestone: m })}><FaEdit /></button>
                                <button title="Delete" className="btn-danger" onClick={()=>handleDeleteMilestone(g._id, m._id)}><FaTrash /></button>
                                </div>
                            </div>
                            </div>
                        ))}
                        </div>

                    </div>
                    </DraggableGig>
                ))}
                </SortableContext>
                </div>
                </DroppableColumn>
            ))}
            </div>
        </DndContext>
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
              <button className="btn-close" onClick={closeModal}>✕</button>
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
                    <select className="p-2 border rounded" value={formData.status||'Open'} onChange={e=>setFormData({...formData, status: e.target.value})}>
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>Archived</option>
                    </select>
                    <DatePicker
                        selected={
                            modalType === "addGig"
                            ? formData.startDate
                                ? new Date(formData.startDate)
                                : null
                            : formData.dueDate
                            ? new Date(formData.dueDate)
                            : null
                        }
                        onChange={(date) => {
                            const v = date ? date.toISOString().split("T")[0] : "";
                            setFormData({
                                ...formData,
                                startDate: v,
                            });                           
                        }}
                        placeholderText="Start Date"
                        dateFormat="MMM d, yyyy"
                        className="date-pill"
                        calendarClassName="dark-calendar"
                        popperClassName="calendar-popper"
                        showPopperArrow={false}
                    />
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
                    <input className="p-2 border rounded" placeholder="Payment Amount" type="number" value={(modalType==='editMilestone' ? (formData.milestone?.paymentAmount) : formData.paymentAmount) } onChange={e=>{
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
                            ? formData.milestone?.startDate
                                ? new Date(formData.milestone.startDate)
                                : null
                            : formData.startDate
                            ? new Date(formData.startDate)
                            : null
                        }
                        onChange={(date) => {
                            const v = date ? date.toISOString().split("T")[0] : "";

                            if (modalType === "editMilestone") {
                            setFormData({
                                ...formData,
                                milestone: {
                                ...formData.milestone,
                                startDate: v,
                                },
                            });
                            } else {
                            setFormData({
                                ...formData,
                                startDate: v,
                            });
                            }
                        }}
                        placeholderText="Start Date"
                        dateFormat="MMM d, yyyy"
                        className="date-pill"
                        calendarClassName="dark-calendar"
                        popperClassName="calendar-popper"
                        showPopperArrow={false}
                    />
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
                <button type="button" className="btn-danger" onClick={closeModal}>Cancel</button>
                <button className="btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE PROMPT */}
      {invoicePrompt.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Generate Invoice?</h3>

            <p className="invoice-prompt-text">
              Please enter the client and freelancer names to sign the invoice.
            </p>

            <input
              type="text"
              placeholder="Client Name*"
              value={invoicePrompt.clientName}
              className="invoice-prompt-text"
              onChange={(e) =>
                setInvoicePrompt((prev) => ({ ...prev, clientName: e.target.value }))
              }
              style={{ marginBottom: '0.5rem', width: '100%', padding: '0.5rem' }}
            />

            <input
              type="text"
              placeholder="Freelancer Name*"
              value={invoicePrompt.freelancerName}
              className="invoice-prompt-text"
              onChange={(e) =>
                setInvoicePrompt((prev) => ({ ...prev, freelancerName: e.target.value }))
              }
              style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
            />

            <div className="modal-actions">
              <button
                className="btn-danger"
                onClick={() =>
                  setInvoicePrompt({ open: false, milestoneId: null, clientName: '', freelancerName: '' })
                }
              >
                Not Now
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  generateInvoice(
                    invoicePrompt.milestoneId,
                    invoicePrompt.clientName,
                    invoicePrompt.freelancerName
                  );
                  setInvoicePrompt({ open: false, milestoneId: null, clientName: null, freelancerName: null });
                }}
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function DraggableGig({ gig, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: gig._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="board-column"
      style={{
        outline: isOver ? "2px dashed #4CAF50" : "none",
        outlineOffset: "4px",
      }}
    >
      {children}
    </div>
  );
}