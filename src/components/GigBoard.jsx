import React, { useEffect, useRef, useState } from 'react';
import './GigBoard.css';
import { FaCheckCircle, FaEdit, FaPlusCircle, FaRegCheckCircle, FaTrash } from 'react-icons/fa';
import { TbRefresh, TbSparkles } from 'react-icons/tb';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const GIG_STATUS_OPTIONS = ['Open', 'In Progress', 'Completed', 'Archived'];
const MILESTONE_STATUS_OPTIONS = ['To Do', 'In Progress', 'Blocked', 'Done'];
const AI_MODAL_STEPS = ['Setup', 'Generate', 'Review'];

function getInitialAiGigForm() {
  return {
    title: '',
    clientName: '',
    startDate: '',
    description: '',
  };
}

function AiMilestoneReviewCard({ index, milestone, onFieldChange, onDecisionChange }) {
  const decisionLabel =
    milestone.decision === 'accepted'
      ? 'Accepted'
      : milestone.decision === 'rejected'
        ? 'Rejected'
        : 'Decision Needed';

  return (
    <div
      className={`ai-milestone-card decision-${milestone.decision}${
        Object.keys(milestone.errors || {}).length > 0 ? ' has-errors' : ''
      }`}
    >
      <div className="ai-milestone-card-header">
        <div>
          <p className="ai-card-label">Milestone {index + 1}</p>
          <h4>{milestone.title || `Milestone ${index + 1}`}</h4>
        </div>
        <span className={`ai-decision-pill ${milestone.decision}`}>{decisionLabel}</span>
      </div>

      <div className="ai-decision-actions">
        <button
          type="button"
          className={`ai-decision-button accept${
            milestone.decision === 'accepted' ? ' active' : ''
          }`}
          onClick={() => onDecisionChange(milestone.localId, 'accepted')}
        >
          Accept
        </button>
        <button
          type="button"
          className={`ai-decision-button reject${
            milestone.decision === 'rejected' ? ' active' : ''
          }`}
          onClick={() => onDecisionChange(milestone.localId, 'rejected')}
        >
          Reject
        </button>
      </div>

      <div className="txn-form-group">
        <label htmlFor={`${milestone.localId}-title`}>Title</label>
        <input
          id={`${milestone.localId}-title`}
          value={milestone.title}
          onChange={(event) => onFieldChange(milestone.localId, 'title', event.target.value)}
        />
        {milestone.errors.title && <span className="ai-field-error">{milestone.errors.title}</span>}
      </div>

      <div className="txn-form-group">
        <label htmlFor={`${milestone.localId}-description`}>Description</label>
        <textarea
          id={`${milestone.localId}-description`}
          value={milestone.description}
          onChange={(event) =>
            onFieldChange(milestone.localId, 'description', event.target.value)
          }
          className="ai-card-description"
        />
      </div>

      <div className="ai-card-grid">
        <div className="txn-form-group">
          <label htmlFor={`${milestone.localId}-start-date`}>Start Date</label>
          <input
            id={`${milestone.localId}-start-date`}
            type="date"
            value={milestone.startDate}
            onChange={(event) => onFieldChange(milestone.localId, 'startDate', event.target.value)}
          />
          {milestone.errors.startDate && (
            <span className="ai-field-error">{milestone.errors.startDate}</span>
          )}
        </div>

        <div className="txn-form-group">
          <label htmlFor={`${milestone.localId}-due-date`}>Due Date</label>
          <input
            id={`${milestone.localId}-due-date`}
            type="date"
            value={milestone.dueDate}
            min={milestone.startDate || undefined}
            onChange={(event) => onFieldChange(milestone.localId, 'dueDate', event.target.value)}
          />
          {milestone.errors.dueDate && (
            <span className="ai-field-error">{milestone.errors.dueDate}</span>
          )}
        </div>

        <div className="txn-form-group">
          <label htmlFor={`${milestone.localId}-payment`}>Payment Amount</label>
          <input
            id={`${milestone.localId}-payment`}
            type="number"
            min="0"
            value={milestone.paymentAmount}
            onChange={(event) =>
              onFieldChange(
                milestone.localId,
                'paymentAmount',
                event.target.value === '' ? '' : event.target.value
              )
            }
          />
          {milestone.errors.paymentAmount && (
            <span className="ai-field-error">{milestone.errors.paymentAmount}</span>
          )}
        </div>

        <div className="txn-form-group">
          <label htmlFor={`${milestone.localId}-status`}>Status</label>
          <select
            id={`${milestone.localId}-status`}
            value={milestone.status}
            onChange={(event) => onFieldChange(milestone.localId, 'status', event.target.value)}
          >
            {MILESTONE_STATUS_OPTIONS.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function DraggableGig({ gig, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: gig._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`gig-draggable${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

function GigCard({
  gig,
  milestoneList,
  onAddMilestone,
  onEditGig,
  onToggleGigComplete,
  onDeleteGig,
  onToggleMilestoneDone,
  onEditMilestone,
  onDeleteMilestone,
  isOverlay = false,
}) {
  return (
    <div className={`gig-card${isOverlay ? ' drag-overlay-card' : ''}`}>
      <div className="gig-card-header">
        <div>
          <h3 className="gig-title">{gig.title}</h3>
          <p className="gig-client">{gig.clientName || '-'}</p>
          <p className="gig-desc">{gig.description?.slice(0, 120)}</p>
          {!isOverlay && (
            <div className="gig-actions">
              <button className="btn-secondary" onClick={onAddMilestone}>
                <FaPlusCircle />
              </button>
              <button className="btn-secondary" onClick={onEditGig}>
                <FaEdit />
              </button>
              <button className="btn" onClick={onToggleGigComplete}>
                {gig.status === 'Completed' ? <FaCheckCircle /> : <FaRegCheckCircle />}
              </button>
              <button className="btn-danger" onClick={onDeleteGig}>
                <FaTrash />
              </button>
            </div>
          )}
        </div>
        <div className="gig-meta">
          <div>Value</div>
          <div className="strong">${Number(gig.totalValue || 0).toFixed(2)}</div>
          <div className="gig-meta">
            Due: {gig.dueDate ? new Date(gig.dueDate).toLocaleDateString() : '-'}
          </div>
        </div>
      </div>

      <div className="milestones">
        {milestoneList.map((milestone) => (
          <div key={milestone._id} className="milestone">
            <div>
              <div className="milestone-title">{milestone.title}</div>
              <div className="milestone-desc">{milestone.description?.slice(0, 80)}</div>
              <div className="milestone-meta">
                {milestone.status} - ${Number(milestone.paymentAmount || 0).toFixed(2)}
              </div>
            </div>
            {!isOverlay && (
              <div className="milestone-actions">
                <div className="milestone-actions">
                  <button
                    title="Toggle Done"
                    className="milestone-btn"
                    onClick={() => onToggleMilestoneDone(milestone)}
                  >
                    {milestone.status === 'Done' ? <FaCheckCircle /> : <FaRegCheckCircle />}
                  </button>
                  <button
                    title="Edit"
                    className="btn-secondary"
                    onClick={() => onEditMilestone(milestone)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    title="Delete"
                    className="btn-danger"
                    onClick={() => onDeleteMilestone(milestone._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
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
        outline: isOver ? '2px dashed #4CAF50' : 'none',
        outlineOffset: '4px',
      }}
    >
      {children}
    </div>
  );
}

function getDateInputValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function getDatePickerValue(value) {
  const formatted = getDateInputValue(value);
  return formatted ? new Date(formatted) : null;
}

function getErrorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

function normalizeMilestoneStatus(status) {
  return MILESTONE_STATUS_OPTIONS.includes(status) ? status : 'To Do';
}

function parsePaymentAmount(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildLocalMilestoneId(index) {
  return `ai-milestone-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAiMilestone(milestone, index, gigStartDate) {
  const startDate =
    getDateInputValue(milestone?.startDate ?? milestone?.start_date ?? gigStartDate) ||
    getDateInputValue(gigStartDate);
  const dueDate =
    getDateInputValue(
      milestone?.dueDate ??
        milestone?.due_date ??
        milestone?.endDate ??
        milestone?.end_date ??
        startDate
    ) || startDate;

  return {
    localId: buildLocalMilestoneId(index),
    title: String(milestone?.title ?? milestone?.name ?? `Milestone ${index + 1}`).trim(),
    description: String(
      milestone?.description ?? milestone?.details ?? milestone?.summary ?? ''
    ).trim(),
    startDate,
    dueDate,
    paymentAmount: parsePaymentAmount(
      milestone?.paymentAmount ?? milestone?.payment_amount ?? milestone?.amount
    ),
    status: normalizeMilestoneStatus(milestone?.status ?? milestone?.state),
    decision: 'pending',
    errors: {},
  };
}

function validateAiMilestoneDraft(draft) {
  const errors = {};

  if (!draft.title?.trim()) {
    errors.title = 'Title is required.';
  }

  if (!draft.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (!draft.dueDate) {
    errors.dueDate = 'Due date is required.';
  }

  if (draft.startDate && draft.dueDate && new Date(draft.dueDate) < new Date(draft.startDate)) {
    errors.dueDate = 'Due date cannot be before start date.';
  }

  const paymentAmount = Number(draft.paymentAmount);
  if (Number.isNaN(paymentAmount) || paymentAmount < 0) {
    errors.paymentAmount = 'Payment amount cannot be negative.';
  }

  return errors;
}

function getAiReviewSummary(drafts) {
  const pending = drafts.filter((draft) => draft.decision === 'pending').length;
  const accepted = drafts.filter((draft) => draft.decision === 'accepted').length;
  const rejected = drafts.filter((draft) => draft.decision === 'rejected').length;
  const hasAcceptedValidationIssues = drafts.some(
    (draft) =>
      draft.decision === 'accepted' && Object.keys(validateAiMilestoneDraft(draft)).length > 0
  );

  return {
    pending,
    accepted,
    rejected,
    hasAcceptedValidationIssues,
  };
}

export default function GigBoard() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeGigId, setActiveGigId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [milestones, setMilestones] = useState({});
  const [invoicePrompt, setInvoicePrompt] = useState({
    open: false,
    milestoneId: null,
    clientName: '',
    freelancerName: '',
  });
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStep, setAiStep] = useState('setup');
  const [aiGigForm, setAiGigForm] = useState(getInitialAiGigForm);
  const [aiDraftGig, setAiDraftGig] = useState(null);
  const [aiMilestoneDrafts, setAiMilestoneDrafts] = useState([]);
  const [aiError, setAiError] = useState('');
  const aiSessionRef = useRef(0);

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
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    updateGig: async (id, payload) => {
      const res = await fetch(`/api/gigs/${id}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    deleteGig: async (id) => {
      const res = await fetch(`/api/gigs/${id}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    generateMilestonesAI: async (gigId) => {
      const res = await fetch(`/api/gigs/${gigId}/generate-milestones`, {
        method: 'POST',
        headers: authHeader(),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    createMilestone: async (gigId, payload) => {
      const res = await fetch(`/api/milestones/gig/${gigId}`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    bulkCreateMilestones: async (gigId, payload) => {
      const res = await fetch(`/api/milestones/gig/${gigId}/bulk`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    updateMilestone: async (id, payload) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await res.json();
      return res.json();
    },
    deleteMilestone: async (id) => {
      const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) throw await res.json();
      return res.json();
    },
  };

  function authHeader() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    loadGigs();
  }, []);

  async function loadGigs() {
    try {
      setLoading(true);
      const data = await API.fetchGigs();
      setGigs(data);

      const milestonePromises = data.map((gig) =>
        API.fetchMilestones(gig._id)
          .then((list) => ({ id: gig._id, list }))
          .catch(() => ({ id: gig._id, list: [] }))
      );

      const milestoneResults = await Promise.all(milestonePromises);
      const milestoneMap = {};
      milestoneResults.forEach((result) => {
        milestoneMap[result.id] = result.list;
      });
      setMilestones(milestoneMap);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load gigs.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGig(payload) {
    try {
      const newGig = await API.createGig(payload);
      setGigs((prev) => [newGig, ...prev]);
      setMilestones((prev) => ({ ...prev, [newGig._id]: [] }));
      closeModal();
    } catch (err) {
      alert(`Error creating gig: ${getErrorMessage(err)}`);
    }
  }

  async function handleUpdateGig(id, payload) {
    try {
      const updated = await API.updateGig(id, payload);
      setGigs((prev) => prev.map((gig) => (gig._id === id ? updated : gig)));
      closeModal();
    } catch (err) {
      alert(`Error updating gig: ${getErrorMessage(err)}`);
    }
  }

  async function handleDeleteGig(id) {
    if (!confirm('Delete this gig and all its milestones?')) return;
    try {
      await API.deleteGig(id);
      setGigs((prev) => prev.filter((gig) => gig._id !== id));
      setMilestones((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      alert(`Error deleting gig: ${getErrorMessage(err)}`);
    }
  }

  async function handleAddMilestone(gigId, payload) {
    try {
      const created = await API.createMilestone(gigId, payload);
      setMilestones((prev) => ({ ...prev, [gigId]: [...(prev[gigId] || []), created] }));
      await loadGigs();
      closeModal();
    } catch (err) {
      alert(`Error creating milestone: ${getErrorMessage(err)}`);
    }
  }

  async function handleUpdateMilestone(gigId, id, payload) {
    try {
      const updated = await API.updateMilestone(id, payload);
      setMilestones((prev) => ({
        ...prev,
        [gigId]: (prev[gigId] || []).map((milestone) =>
          milestone._id === id ? updated : milestone
        ),
      }));
      closeModal();
    } catch (err) {
      alert(`Error updating milestone: ${getErrorMessage(err)}`);
    }
  }

  async function handleDeleteMilestone(gigId, id) {
    if (!confirm('Delete this milestone?')) return;
    try {
      await API.deleteMilestone(id);
      setMilestones((prev) => ({
        ...prev,
        [gigId]: (prev[gigId] || []).filter((milestone) => milestone._id !== id),
      }));
      await loadGigs();
    } catch (err) {
      alert(`Error deleting milestone: ${getErrorMessage(err)}`);
    }
  }

  function resetAiModalState() {
    setAiModalOpen(false);
    setAiStep('setup');
    setAiGigForm(getInitialAiGigForm());
    setAiDraftGig(null);
    setAiMilestoneDrafts([]);
    setAiError('');
  }

  function openAiModal() {
    resetAiModalState();
    setAiModalOpen(true);
  }

  function invalidateAiSession() {
    aiSessionRef.current += 1;
  }

  async function cleanupAiDraftGig(draftGigId) {
    if (!draftGigId) return true;

    try {
      await API.deleteGig(draftGigId);
      return true;
    } catch (cleanupError) {
      console.error('Failed to cleanup AI draft gig:', cleanupError);
      return false;
    }
  }

  async function closeAiModal() {
    if (aiStep === 'saving') return;

    invalidateAiSession();
    const draftGigId = aiDraftGig?._id;
    resetAiModalState();

    if (draftGigId) {
      const cleaned = await cleanupAiDraftGig(draftGigId);
      if (!cleaned) {
        alert(
          'The draft gig could not be deleted automatically. Refresh the board and remove it manually if it appears.'
        );
        await loadGigs();
      }
    }
  }

  async function handleAiGenerateSubmit(event) {
    event.preventDefault();

    const sessionId = aiSessionRef.current + 1;
    aiSessionRef.current = sessionId;
    let createdGig = null;

    try {
      setAiError('');
      setAiStep('generating');

      createdGig = await API.createGig({
        title: aiGigForm.title,
        clientName: aiGigForm.clientName,
        startDate: aiGigForm.startDate,
        description: aiGigForm.description,
        status: 'Open',
      });

      if (aiSessionRef.current !== sessionId) {
        await cleanupAiDraftGig(createdGig?._id);
        return;
      }

      setAiDraftGig(createdGig);

      const generated = await API.generateMilestonesAI(createdGig._id);

      if (aiSessionRef.current !== sessionId) {
        await cleanupAiDraftGig(createdGig?._id);
        return;
      }

      const normalizedDrafts = Array.isArray(generated?.milestones)
        ? generated.milestones.map((milestone, index) =>
            normalizeAiMilestone(milestone, index, createdGig.startDate || aiGigForm.startDate)
          )
        : [];

      if (!normalizedDrafts.length) {
        throw new Error('AI did not return any milestones for this gig.');
      }

      setAiMilestoneDrafts(normalizedDrafts);
      setAiStep('review');
    } catch (err) {
      if (aiSessionRef.current !== sessionId) {
        if (createdGig?._id) {
          await cleanupAiDraftGig(createdGig._id);
        }
        return;
      }

      let cleanupFailed = false;
      if (createdGig?._id) {
        cleanupFailed = !(await cleanupAiDraftGig(createdGig._id));
      }

      if (cleanupFailed) {
        await loadGigs();
      }

      setAiDraftGig(null);
      setAiMilestoneDrafts([]);
      setAiStep('setup');
      setAiError(
        cleanupFailed
          ? `${getErrorMessage(err, 'Unable to generate milestones right now.')} Draft gig cleanup failed.`
          : getErrorMessage(err, 'Unable to generate milestones right now.')
      );
    }
  }

  function updateAiMilestoneDraft(localId, updates) {
    setAiMilestoneDrafts((prev) =>
      prev.map((draft) => {
        if (draft.localId !== localId) return draft;

        const nextDraft = {
          ...draft,
          ...updates,
        };

        if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
          nextDraft.status = normalizeMilestoneStatus(updates.status);
        }

        const shouldValidate =
          nextDraft.decision === 'accepted' || Object.keys(draft.errors || {}).length > 0;

        return {
          ...nextDraft,
          errors: shouldValidate ? validateAiMilestoneDraft(nextDraft) : draft.errors,
        };
      })
    );
  }

  function handleAiMilestoneFieldChange(localId, field, value) {
    setAiError('');
    updateAiMilestoneDraft(localId, { [field]: value });
  }

  function handleAiMilestoneDecision(localId, decision) {
    setAiError('');
    setAiMilestoneDrafts((prev) =>
      prev.map((draft) => {
        if (draft.localId !== localId) return draft;

        const nextDraft = {
          ...draft,
          decision,
        };

        return {
          ...nextDraft,
          errors: decision === 'accepted' ? validateAiMilestoneDraft(nextDraft) : {},
        };
      })
    );
  }

  async function handleConfirmAiMilestones() {
    if (!aiDraftGig?._id) return;

    const reviewedDrafts = aiMilestoneDrafts.map((draft) => ({
      ...draft,
      errors: draft.decision === 'accepted' ? validateAiMilestoneDraft(draft) : {},
    }));

    setAiMilestoneDrafts(reviewedDrafts);

    if (reviewedDrafts.some((draft) => draft.decision === 'pending')) {
      setAiError('Review every milestone and choose accept or reject before saving.');
      return;
    }

    const acceptedDrafts = reviewedDrafts.filter((draft) => draft.decision === 'accepted');
    if (!acceptedDrafts.length) {
      setAiError('Accept at least one milestone before saving this gig.');
      return;
    }

    if (acceptedDrafts.some((draft) => Object.keys(draft.errors || {}).length > 0)) {
      setAiError('Fix the highlighted accepted milestones before saving.');
      return;
    }

    try {
      setAiError('');
      setAiStep('saving');

      await API.bulkCreateMilestones(aiDraftGig._id, {
        milestones: acceptedDrafts.map(({ localId, decision, errors, ...draft }) => ({
          ...draft,
          paymentAmount: parsePaymentAmount(draft.paymentAmount),
          status: normalizeMilestoneStatus(draft.status),
        })),
      });

      invalidateAiSession();
      resetAiModalState();
      await loadGigs();
    } catch (err) {
      setAiStep('review');
      setAiError(`Failed to save milestones: ${getErrorMessage(err)}`);
    }
  }

  function handleDragStart(event) {
    setActiveGigId(event.active.id);
  }

  function handleDragCancel() {
    setActiveGigId(null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveGigId(null);

    if (!over) return;

    const gigId = active.id;
    const newStatus = over.id;

    if (!GIG_STATUS_OPTIONS.includes(newStatus)) return;

    const gig = gigs.find((item) => item._id === gigId);
    if (!gig || gig.status === newStatus) return;

    setGigs((prev) =>
      prev.map((item) => (item._id === gigId ? { ...item, status: newStatus } : item))
    );

    try {
      await API.updateGig(gigId, { status: newStatus });
    } catch (err) {
      console.error(err);
      loadGigs();
    }
  }

  async function toggleMilestoneDone(gigId, milestone) {
    const newStatus = milestone.status === 'Done' ? 'To Do' : 'Done';
    await handleUpdateMilestone(gigId, milestone._id, { ...milestone, status: newStatus });

    if (newStatus === 'Done') {
      setInvoicePrompt({
        open: true,
        milestoneId: milestone._id,
        clientName: '',
        freelancerName: '',
      });
    }
  }

  async function toggleGigComplete(gig) {
    const newStatus = gig.status === 'Completed' ? 'Open' : 'Completed';
    await handleUpdateGig(gig._id, { ...gig, status: newStatus });
  }

  function openModal(type, payload = {}) {
    setModalType(type);
    setFormData(payload);
  }

  function closeModal() {
    setModalType(null);
    setFormData({});
  }

  const activeGig = gigs.find((gig) => gig._id === activeGigId) || null;
  const aiReviewSummary = getAiReviewSummary(aiMilestoneDrafts);
  const aiCanConfirm =
    aiStep === 'review' &&
    aiReviewSummary.pending === 0 &&
    aiReviewSummary.accepted > 0 &&
    !aiReviewSummary.hasAcceptedValidationIssues;

  const getBackendBaseUrl = () => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000/api`;
  };

  const generateInvoice = async (milestoneId, clientName, freelancerName) => {
    try {
      if (!clientName?.trim() || !freelancerName?.trim()) {
        alert('Please provide both client and freelancer names to generate invoice.');
        return;
      }

      const params = new URLSearchParams({
        clientName,
        freelancerName,
      });

      const response = await fetch(
        `${getBackendBaseUrl()}/milestones/${milestoneId}/invoice?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
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
        <div className="header-actions">
          <button className="ghost-button green-bg" onClick={() => openModal('addGig')}>
            + New Gig
          </button>
          <button className="ghost-button ai-generate-button" onClick={openAiModal}>
            <TbSparkles />
            Generate with AI
          </button>
          <button className="ghost-button" onClick={loadGigs} disabled={loading}>
            {loading ? 'Refreshing...' : <TbRefresh />}
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
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <div className="board-columns">
            {GIG_STATUS_OPTIONS.map((column) => (
              <DroppableColumn key={column} id={column}>
                <h2>{column}</h2>
                <div className="space-y-3">
                  <SortableContext
                    items={gigs.filter((gig) => gig.status === column).map((gig) => gig._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {gigs
                      .filter((gig) => gig.status === column)
                      .map((gig) => (
                        <DraggableGig key={gig._id} gig={gig}>
                          <GigCard
                            gig={gig}
                            milestoneList={milestones[gig._id] || []}
                            onAddMilestone={() =>
                              openModal('addMilestone', { gigId: gig._id, gig })
                            }
                            onEditGig={() => openModal('editGig', gig)}
                            onToggleGigComplete={() => toggleGigComplete(gig)}
                            onDeleteGig={() => handleDeleteGig(gig._id)}
                            onToggleMilestoneDone={(milestone) =>
                              toggleMilestoneDone(gig._id, milestone)
                            }
                            onEditMilestone={(milestone) =>
                              openModal('editMilestone', { gigId: gig._id, milestone })
                            }
                            onDeleteMilestone={(milestoneId) =>
                              handleDeleteMilestone(gig._id, milestoneId)
                            }
                          />
                        </DraggableGig>
                      ))}
                  </SortableContext>
                </div>
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeGig ? (
              <div className="gig-drag-overlay">
                <GigCard gig={activeGig} milestoneList={milestones[activeGig._id] || []} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {aiModalOpen && (
        <div className="modal-backdrop">
          <div className="modal ai-modal">
            <div className="modal-header ai-modal-header">
              <div>
                <p className="ai-modal-kicker">AI milestone planner</p>
                <h3>Create a new gig and let AI draft the milestone roadmap.</h3>
                <p className="ai-modal-subtext">
                  Start with the project basics, then review every milestone before saving it to
                  your board.
                </p>
              </div>
              <button className="btn-close" onClick={closeAiModal} disabled={aiStep === 'saving'}>
                x
              </button>
            </div>

            <div className="ai-stepper">
              {AI_MODAL_STEPS.map((label, index) => {
                const isActive =
                  (aiStep === 'setup' && index === 0) ||
                  (aiStep === 'generating' && index === 1) ||
                  ((aiStep === 'review' || aiStep === 'saving') && index === 2);
                const isComplete =
                  (aiStep === 'generating' || aiStep === 'review' || aiStep === 'saving') &&
                  index === 0
                    ? true
                    : (aiStep === 'review' || aiStep === 'saving') && index === 1;

                return (
                  <div
                    key={label}
                    className={`ai-step${isActive ? ' active' : ''}${isComplete ? ' complete' : ''}`}
                  >
                    <span className="ai-step-index">{index + 1}</span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>

            {aiError && <div className="txn-form-error ai-inline-error">{aiError}</div>}

            {aiStep === 'setup' && (
              <form className="txn-form" onSubmit={handleAiGenerateSubmit}>
                <div className="txn-form-group">
                  <label htmlFor="ai-gig-title">Gig Title</label>
                  <input
                    id="ai-gig-title"
                    placeholder="Website redesign for Acme"
                    value={aiGigForm.title}
                    onChange={(event) =>
                      setAiGigForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="modal-grid">
                  <div className="txn-form-group">
                    <label htmlFor="ai-client-name">Client Name</label>
                    <input
                      id="ai-client-name"
                      placeholder="Optional client name"
                      value={aiGigForm.clientName}
                      onChange={(event) =>
                        setAiGigForm((prev) => ({ ...prev, clientName: event.target.value }))
                      }
                    />
                  </div>

                  <div className="txn-form-group">
                    <label htmlFor="ai-start-date">Start Date</label>
                    <DatePicker
                      id="ai-start-date"
                      selected={getDatePickerValue(aiGigForm.startDate)}
                      onChange={(date) =>
                        setAiGigForm((prev) => ({
                          ...prev,
                          startDate: date ? getDateInputValue(date) : '',
                        }))
                      }
                      placeholderText="Start Date"
                      dateFormat="MMM d, yyyy"
                      className="date-pill"
                      calendarClassName="dark-calendar"
                      popperClassName="calendar-popper"
                      showPopperArrow={false}
                      required
                    />
                  </div>
                </div>

                <div className="txn-form-group">
                  <label htmlFor="ai-description">Gig Description</label>
                  <textarea
                    id="ai-description"
                    placeholder="Describe the project scope, deliverables, deadlines, and anything else the AI should consider."
                    value={aiGigForm.description}
                    onChange={(event) =>
                      setAiGigForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="ai-description-field"
                    required
                  />
                </div>

                <div className="ai-setup-note">
                  The gig will be created as a draft first so the existing AI route can generate
                  milestones from its saved description and start date.
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-danger" onClick={closeAiModal}>
                    Cancel
                  </button>
                  <button className="btn ai-confirm-button">Generate</button>
                </div>
              </form>
            )}

            {aiStep === 'generating' && (
              <div className="ai-loading-state">
                <div className="ai-loading-orb" />
                <h4>Generating milestones...</h4>
                <p>
                  AI is turning your gig description into a milestone plan. This usually takes a
                  few seconds.
                </p>

                <div className="ai-draft-summary">
                  <div>
                    <span className="ai-summary-label">Gig</span>
                    <strong>{aiGigForm.title}</strong>
                  </div>
                  <div>
                    <span className="ai-summary-label">Start Date</span>
                    <strong>{aiGigForm.startDate || 'Not set'}</strong>
                  </div>
                  <div className="ai-summary-description">
                    <span className="ai-summary-label">Description</span>
                    <p>{aiGigForm.description}</p>
                  </div>
                </div>
              </div>
            )}

            {(aiStep === 'review' || aiStep === 'saving') && (
              <div className="ai-review-layout">
                <div className="ai-review-summary">
                  <div>
                    <span className="ai-summary-label">Gig</span>
                    <strong>{aiDraftGig?.title}</strong>
                  </div>
                  <div>
                    <span className="ai-summary-label">Accepted</span>
                    <strong>{aiReviewSummary.accepted}</strong>
                  </div>
                  <div>
                    <span className="ai-summary-label">Rejected</span>
                    <strong>{aiReviewSummary.rejected}</strong>
                  </div>
                  <div>
                    <span className="ai-summary-label">Pending</span>
                    <strong>{aiReviewSummary.pending}</strong>
                  </div>
                </div>

                <div className="ai-review-hint">
                  Edit any milestone details you need, then accept or reject each one. Confirming
                  will save accepted milestones only.
                </div>

                <div className="ai-milestone-grid">
                  {aiMilestoneDrafts.map((milestone, index) => (
                    <AiMilestoneReviewCard
                      key={milestone.localId}
                      index={index}
                      milestone={milestone}
                      onFieldChange={handleAiMilestoneFieldChange}
                      onDecisionChange={handleAiMilestoneDecision}
                    />
                  ))}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={closeAiModal}
                    disabled={aiStep === 'saving'}
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    className="btn ai-confirm-button"
                    onClick={handleConfirmAiMilestones}
                    disabled={!aiCanConfirm || aiStep === 'saving'}
                  >
                    {aiStep === 'saving' ? 'Saving Milestones...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              <button className="btn-close" onClick={closeModal}>
                x
              </button>
            </div>
            <form
              className="txn-form"
              onSubmit={(event) => {
                event.preventDefault();

                if (modalType === 'addGig') return handleAddGig(formData);
                if (modalType === 'editGig') return handleUpdateGig(formData._id, formData);

                if (modalType === 'addMilestone') {
                  if (Number(formData.paymentAmount) < 0) {
                    alert('Payment amount cannot be negative.');
                    return;
                  }

                  if (formData.startDate && formData.dueDate) {
                    if (new Date(formData.dueDate) < new Date(formData.startDate)) {
                      alert('Due Date cannot be before Start Date.');
                      return;
                    }
                  }

                  return handleAddMilestone(formData.gigId, formData);
                }

                if (modalType === 'editMilestone') {
                  if (Number(formData.milestone?.paymentAmount) < 0) {
                    alert('Payment amount cannot be negative.');
                    return;
                  }

                  const start = formData.milestone?.startDate
                    ? new Date(formData.milestone.startDate)
                    : null;
                  const end = formData.milestone?.dueDate
                    ? new Date(formData.milestone.dueDate)
                    : null;

                  if (start && end && end < start) {
                    alert('Due Date cannot be before Start Date.');
                    return;
                  }

                  return handleUpdateMilestone(formData.gigId, formData.milestone._id, {
                    ...formData.milestone,
                    ...formData,
                  });
                }

                return null;
              }}
            >
              {(modalType === 'addGig' || modalType === 'editGig') && (
                <div className="txn-form-group">
                  <input
                    placeholder="Title"
                    value={formData.title || ''}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={formData.description || ''}
                    onChange={(event) =>
                      setFormData({ ...formData, description: event.target.value })
                    }
                  />
                  <div className="modal-grid">
                    <input
                      className="p-2 border rounded"
                      placeholder="Client Name"
                      value={formData.clientName || ''}
                      onChange={(event) =>
                        setFormData({ ...formData, clientName: event.target.value })
                      }
                    />
                    <select
                      className="p-2 border rounded"
                      value={formData.status || 'Open'}
                      onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                    >
                      {GIG_STATUS_OPTIONS.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <DatePicker
                      selected={getDatePickerValue(formData.startDate)}
                      onChange={(date) =>
                        setFormData({
                          ...formData,
                          startDate: date ? getDateInputValue(date) : '',
                        })
                      }
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

              {(modalType === 'addMilestone' || modalType === 'editMilestone') && (
                <div className="txn-form-group">
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Title"
                    value={
                      (modalType === 'editMilestone'
                        ? formData.milestone?.title
                        : formData.title) || ''
                    }
                    onChange={(event) => {
                      if (modalType === 'editMilestone') {
                        setFormData({
                          ...formData,
                          milestone: { ...formData.milestone, title: event.target.value },
                        });
                      } else {
                        setFormData({ ...formData, title: event.target.value });
                      }
                    }}
                    required
                  />
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="Description"
                    value={
                      (modalType === 'editMilestone'
                        ? formData.milestone?.description
                        : formData.description) || ''
                    }
                    onChange={(event) => {
                      if (modalType === 'editMilestone') {
                        setFormData({
                          ...formData,
                          milestone: {
                            ...formData.milestone,
                            description: event.target.value,
                          },
                        });
                      } else {
                        setFormData({ ...formData, description: event.target.value });
                      }
                    }}
                  />

                  <div className="modal-grid">
                    <input
                      className="p-2 border rounded"
                      placeholder="Payment Amount"
                      type="number"
                      min="0"
                      value={
                        modalType === 'editMilestone'
                          ? formData.milestone?.paymentAmount
                          : formData.paymentAmount
                      }
                      onChange={(event) => {
                        const value = event.target.value === '' ? '' : Number(event.target.value);
                        if (modalType === 'editMilestone') {
                          setFormData({
                            ...formData,
                            milestone: {
                              ...formData.milestone,
                              paymentAmount: value,
                            },
                          });
                        } else {
                          setFormData({ ...formData, paymentAmount: value });
                        }
                      }}
                    />

                    <select
                      className="p-2 border rounded"
                      value={
                        (modalType === 'editMilestone'
                          ? formData.milestone?.status
                          : formData.status) || 'To Do'
                      }
                      onChange={(event) => {
                        if (modalType === 'editMilestone') {
                          setFormData({
                            ...formData,
                            milestone: { ...formData.milestone, status: event.target.value },
                          });
                        } else {
                          setFormData({ ...formData, status: event.target.value });
                        }
                      }}
                    >
                      {MILESTONE_STATUS_OPTIONS.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>

                    <DatePicker
                      selected={
                        modalType === 'editMilestone'
                          ? getDatePickerValue(formData.milestone?.startDate)
                          : getDatePickerValue(formData.startDate)
                      }
                      maxDate={
                        modalType === 'editMilestone'
                          ? getDatePickerValue(formData.milestone?.dueDate)
                          : getDatePickerValue(formData.dueDate)
                      }
                      onChange={(date) => {
                        const value = date ? getDateInputValue(date) : '';

                        if (modalType === 'editMilestone') {
                          setFormData({
                            ...formData,
                            milestone: { ...formData.milestone, startDate: value },
                          });
                        } else {
                          setFormData({ ...formData, startDate: value });
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
                        modalType === 'editMilestone'
                          ? getDatePickerValue(formData.milestone?.dueDate)
                          : getDatePickerValue(formData.dueDate)
                      }
                      minDate={
                        modalType === 'editMilestone'
                          ? getDatePickerValue(formData.milestone?.startDate)
                          : getDatePickerValue(formData.startDate)
                      }
                      onChange={(date) => {
                        const value = date ? getDateInputValue(date) : '';

                        if (modalType === 'editMilestone') {
                          setFormData({
                            ...formData,
                            milestone: { ...formData.milestone, dueDate: value },
                          });
                        } else {
                          setFormData({ ...formData, dueDate: value });
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
                <button type="button" className="btn-danger" onClick={closeModal}>
                  Cancel
                </button>
                <button className="btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              onChange={(event) =>
                setInvoicePrompt((prev) => ({ ...prev, clientName: event.target.value }))
              }
              style={{ marginBottom: '0.5rem', width: '100%', padding: '0.5rem' }}
            />

            <input
              type="text"
              placeholder="Freelancer Name*"
              value={invoicePrompt.freelancerName}
              className="invoice-prompt-text"
              onChange={(event) =>
                setInvoicePrompt((prev) => ({ ...prev, freelancerName: event.target.value }))
              }
              style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
            />

            <div className="modal-actions">
              <button
                className="btn-danger"
                onClick={() =>
                  setInvoicePrompt({
                    open: false,
                    milestoneId: null,
                    clientName: '',
                    freelancerName: '',
                  })
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
                  setInvoicePrompt({
                    open: false,
                    milestoneId: null,
                    clientName: '',
                    freelancerName: '',
                  });
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
