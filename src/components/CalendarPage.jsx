import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./CalendarPage.css";
import { FaPlusCircle } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import { FaRegCheckCircle } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { TbRefresh } from "react-icons/tb";

/*
  MilestoneCalendar.jsx
  - Option A (Standalone Calendar Page)
  - Loads user gigs -> loads milestones per gig -> highlights days on calendar
  - Bottom panel shows milestones for selected day with Edit / Delete / Generate Invoice
  - Edit modal updates milestone via PUT
  - Invoice modal requests clientName & freelancerName, fetches PDF blob and opens in new tab
  - Uses token from localStorage.getItem('token') to send Authorization header
*/

export default function CalendarPage() {
  const [gigs, setGigs] = useState([]);
  const [milestonesMap, setMilestonesMap] = useState({}); // gigId -> [milestones]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMilestones, setSelectedMilestones] = useState([]);

  // Modal state
  const [editModal, setEditModal] = useState({ open: false, milestone: null, gigId: null });
  const [invoiceModal, setInvoiceModal] = useState({ open: false, milestoneId: null, clientName: "", freelancerName: "" });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Helper: backend base (assumes backend is on same host:3000/api)
  const getBackendBaseUrl = () => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000/api`;
  };

  function authHeader() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // API wrappers
  const API = {
    fetchGigs: async () => {
      const res = await fetch("/api/gigs/user", { headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    fetchMilestonesByGig: async (gigId) => {
      const res = await fetch(`/api/milestones/gig/${gigId}`, { headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    updateMilestone: async (id, payload) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    deleteMilestone: async (id) => {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE", headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    generateInvoice: async (milestoneId, clientName, freelancerName) => {
      // Use full URL to ensure correct port if backend runs on :3000
      const params = new URLSearchParams({ clientName, freelancerName }).toString();
      const url = `${getBackendBaseUrl()}/milestones/${milestoneId}/invoice?${params}`;
      const res = await fetch(url, { method: "GET", headers: authHeader() });
      if (!res.ok) throw new Error("Failed to generate invoice");
      const blob = await res.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      window.open(pdfUrl, "_blank");
    },
  };

  // Load gigs and milestones
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        setError(null);
        const g = await API.fetchGigs();
        setGigs(g);

        // fetch milestones for each gig in parallel
        const promises = g.map((gig) =>
          API.fetchMilestonesByGig(gig._id)
            .then((list) => ({ id: gig._id, list }))
            .catch(() => ({ id: gig._1d, list: [] }))
        );
        const results = await Promise.all(promises);
        const map = {};
        results.forEach((r) => (map[r.id] = r.list));
        setMilestonesMap(map);
      } catch (err) {
        console.error(err);
        setError(err.message || JSON.stringify(err));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility: flatten milestones into array
  const allMilestones = Object.values(milestonesMap).flat();

  // Map of dateKey -> milestones
  const milestoneByDate = {};
  allMilestones.forEach((m) => {
    if (!m?.dueDate) return;
    // dueDate may be stored as Date string or ISO; normalize to YYYY-MM-DD
    const d = new Date(m.dueDate);
    if (isNaN(d)) return;
    const key = d.toISOString().split("T")[0];
    if (!milestoneByDate[key]) milestoneByDate[key] = [];
    milestoneByDate[key].push(m);
  });

  // Calendar tile class to highlight days that have milestones
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const key = date.toISOString().split("T")[0];
    if (milestoneByDate[key]) return "milestone-day";
    return null;
  };

  // When user clicks a day -> show milestones for that day in bottom panel
  const handleDayClick = (date) => {
    setSelectedDate(date);
    const key = date.toISOString().split("T")[0];
    setSelectedMilestones(milestoneByDate[key] || []);
  };

  // Delete handler
  const handleDelete = async (gigId, milestoneId) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      await API.deleteMilestone(milestoneId);
      // remove from state
      setMilestonesMap((prev) => ({
        ...prev,
        [gigId]: (prev[gigId] || []).filter((m) => m._id !== milestoneId),
      }));
      // refresh selection list
      if (selectedDate) {
        const key = selectedDate.toISOString().split("T")[0];
        setSelectedMilestones((prev) => prev.filter((m) => m._id !== milestoneId));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete milestone");
    }
  };

  // Open edit modal
  const openEditModal = (gigId, milestone) => {
    setEditModal({ open: true, milestone: { ...milestone }, gigId });
  };

  // Save edits
  const saveEdit = async (updates) => {
    const { milestone, gigId } = editModal;
    try {
      const payload = {
        ...milestone,
        ...updates,
      };
      // backend expects date as Date (ISO) — we send as ISO string
      if (payload.dueDate && payload.dueDate instanceof Date) {
        payload.dueDate = payload.dueDate.toISOString();
      }
      if (payload.startDate && payload.startDate instanceof Date) {
        payload.startDate = payload.startDate.toISOString();
      }
      const updated = await API.updateMilestone(milestone._id, payload);

      // replace in state
      setMilestonesMap((prev) => ({
        ...prev,
        [gigId]: (prev[gigId] || []).map((m) => (m._id === updated._id ? updated : m)),
      }));

      // update bottom panel if relevant
      if (selectedDate) {
        const key = selectedDate.toISOString().split("T")[0];
        setSelectedMilestones((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      }

      setEditModal({ open: false, milestone: null, gigId: null });
    } catch (err) {
      console.error(err);
      alert("Failed to update milestone");
    }
  };

  // Open invoice modal
  const openInvoiceModal = (milestoneId) => {
    setInvoiceModal({ open: true, milestoneId, clientName: "", freelancerName: "" });
  };

  // Generate invoice using modal inputs
  const handleGenerateInvoice = async () => {
    try {
      await API.generateInvoice(invoiceModal.milestoneId, invoiceModal.clientName, invoiceModal.freelancerName);
      setInvoiceModal({ open: false, milestoneId: null, clientName: "", freelancerName: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to generate invoice");
    }
  };

  // Render helpers
  const formatMoney = (v) => `$${Number(v || 0).toFixed(2)}`;

  return (
    <div className="calendar-page">
      <div className="dashboard-hero">
              <div>
                <p className="eyebrow">Milestone overview</p>
                <h1>Upcoming Deliverables</h1>
                <p className="subtext">See what milestones are due soon to keep your work organised.</p>
              </div>
              <button className="ghost-button" onClick={() => window.location.reload()} disabled={loading}>
                {loading ? 'Refreshing…' : <TbRefresh />}
              </button>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="calendar-layout">
          <div className="calendar-card">
            <Calendar onClickDay={handleDayClick} tileClassName={tileClassName} />
          </div>

          <div className="details-panel">
            <div className="panel-card">
              <h2>
                {selectedDate ? `Milestones on ${selectedDate.toDateString()}` : "Select a date to view milestones"}
              </h2>

              {!selectedDate && <p className="muted">Highlighted days contain milestones.</p>}

              {selectedDate && selectedMilestones.length === 0 && <p>No milestones for this day.</p>}

              {selectedDate &&
                selectedMilestones.map((m) => {
                  // find gig for this milestone (to get gigId)
                  const gigId = m.gig || Object.keys(milestonesMap).find((k) => (milestonesMap[k] || []).some((mi) => mi._id === m._id));
                  const gig = gigs.find((g) => g._id === gigId);
                  return (
                    <div className="milestone-row" key={m._id}>
                      <div className="milestone-main">
                        <div className="milestone-title">{m.title}</div>
                        <div className="milestone-desc">{m.description || "No description"}</div>
                        <div className="milestone-meta">
                          <hr /> <span>Status: {m.status}</span><hr /><span>Amount: {formatMoney(m.paymentAmount)}</span><hr />{" "}
                          <span>Gig Title: {(gig && gig.title) || "—"}</span>
                        </div>
                      </div>

                      <div className="milestone-actions">
                        <button className="btn-secondary" onClick={() => openEditModal(gigId, m)}><FaEdit /></button>
                        <button className="btn" onClick={() => openInvoiceModal(m._id)}>View Invoice</button>
                        <button className="btn-danger" onClick={() => handleDelete(gigId, m._id)}><FaTrash /></button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Milestone</h3>
              <button className="btn-close" onClick={() => setEditModal({ open: false, milestone: null, gigId: null })}>✕</button>
            </div>

            <EditMilestoneForm
              milestone={editModal.milestone}
              onCancel={() => setEditModal({ open: false, milestone: null, gigId: null })}
              onSave={saveEdit}
            />
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {invoiceModal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Generate Invoice</h3>
              <button className="btn-close" onClick={() => setInvoiceModal({ open: false, milestoneId: null, clientName: "", freelancerName: "" })}>✕</button>
            </div>

            <div className="txn-form">
              <p className="invoice-prompt-text">Enter official names to include on the invoice.</p>

              <div className="txn-form-group">
                <label>Client Name*</label>
                <input type="text" placeholder="Client Name" value={invoiceModal.clientName} onChange={(e) => setInvoiceModal((p) => ({ ...p, clientName: e.target.value }))} />
              </div>

              <div className="txn-form-group">
                <label>Freelancer Name*</label>
                <input type="text" placeholder="Freelancer Name" value={invoiceModal.freelancerName} onChange={(e) => setInvoiceModal((p) => ({ ...p, freelancerName: e.target.value }))} />
              </div>

              <div className="modal-actions">
                <button className="btn-danger" onClick={() => setInvoiceModal({ open: false, milestoneId: null, clientName: "", freelancerName: "" })}>Cancel</button>
                <button className="btn-primary" onClick={handleGenerateInvoice}>Generate Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* EditMilestoneForm Component */
function EditMilestoneForm({ milestone, onCancel, onSave }) {
  const [title, setTitle] = useState(milestone.title || "");
  const [description, setDescription] = useState(milestone.description || "");
  const [paymentAmount, setPaymentAmount] = useState(Number(milestone.paymentAmount || 0));
  const [status, setStatus] = useState(milestone.status || "To Do");
  
  // State for dates
  const [startDate, setStartDate] = useState(milestone.startDate ? new Date(milestone.startDate) : null);
  const [dueDate, setDueDate] = useState(milestone.dueDate ? new Date(milestone.dueDate) : null);

  return (
    <form
      className="txn-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title,
          description,
          paymentAmount,
          status,
          startDate: startDate ? startDate : null,
          dueDate: dueDate ? dueDate : null,
        });
      }}
    >
      <div className="txn-form-group">
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="txn-form-group">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="modal-grid">
        <div className="txn-form-group">
          <label>Payment Amount</label>
          <input type="number" min="0" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} />
        </div>

        <div className="txn-form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Blocked</option>
            <option>Done</option>
          </select>
        </div>
      </div>

      <div className="modal-grid">
        <div className="txn-form-group">
            <label>Start Date</label>
            <DatePicker 
                selected={startDate} 
                onChange={(d) => setStartDate(d)} 
                maxDate={dueDate} // Constraint: Start date cannot be after due date
                dateFormat="MMM d, yyyy" 
                placeholderText="Start date" 
                className="date-pill"
            />
        </div>

        <div className="txn-form-group">
            <label>Due Date</label>
            <DatePicker 
                selected={dueDate} 
                onChange={(d) => setDueDate(d)} 
                minDate={startDate} // Constraint: Due date cannot be before start date
                dateFormat="MMM d, yyyy" 
                placeholderText="Due date"
                className="date-pill"
            />
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-danger" onClick={onCancel}>Cancel</button>
        <button className="btn">Save</button>
      </div>
    </form>
  );
}