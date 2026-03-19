import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import * as Diff from 'diff'; 
import './ProposalAgent.css';

const API_BASE_URL = 'http://localhost:3000/api';

function BentoBox({ children, className = '' }) {
  return <div className={`bento-box ${className}`}>{children}</div>;
}

const ProposalAgent = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = useMemo(() => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  // History State
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('new'); 

  // Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [initialPrompt, setInitialPrompt] = useState(''); 
  
  // Editor & Diff State
  const [draft, setDraft] = useState('');
  const [pendingDraft, setPendingDraft] = useState(null); 
  const [showDiff, setShowDiff] = useState(true);
  const [threadId, setThreadId] = useState(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  
  // 🚀 Text Tracking (Prevents unnecessary saves)
  const originalDraftRef = useRef('');

  // 🚀 UI States
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/proposals`, { headers });
      setHistory(response.data.proposals || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const loadHistoryItem = (item) => {
    if (isLoading || isSaving) return; 

    setActiveTab(item.threadId);
    setThreadId(item.threadId);
    setJobTitle(item.jobTitle);
    setJobDescription(item.jobDescription);
    setDraft(item.lastDraft || '');
    setPendingDraft(null); 
    setShowDiff(true); 
    setIsContextExpanded(false); // 🚀 Reset collapse state
  };

  const handleNewProposal = () => {
    if (isLoading || isSaving) return;

    setActiveTab('new');
    setThreadId(null);
    setJobTitle('');
    setJobDescription('');
    setInitialPrompt('');
    setDraft('');
    setPendingDraft(null);
    setRefinementPrompt('');
    setShowDiff(true);
    setIsContextExpanded(false); // 🚀 Reset collapse state
  };

  const handleGenerate = async () => {
    if (!jobTitle || !jobDescription) return;
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/proposals/generate`, {
        jobTitle,
        jobDescription,
        userPrompt: initialPrompt,
        threadId: threadId
      }, { headers });

      const newProposal = response.data.proposal;
      setThreadId(newProposal.threadId);
      setDraft(newProposal.lastDraft);
      setActiveTab(newProposal.threadId);
      fetchHistory();
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementPrompt || isSaving) return; 

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/proposals/generate`, {
        jobTitle, 
        jobDescription,
        userPrompt: refinementPrompt, 
        threadId: threadId,
        currentDraft: draft 
      }, { headers });

      setPendingDraft(response.data.proposal.lastDraft);
      setRefinementPrompt('');
      setShowDiff(true); 
      fetchHistory(); 
    } catch (error) {
      console.error("Refinement failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptDiff = () => {
    setDraft(pendingDraft);
    setPendingDraft(null);
  };

  const handleRejectDiff = async () => {
    setIsSaving(true); 
    setPendingDraft(null);
    try {
      await axios.put(`${API_BASE_URL}/proposals/save`, {
        threadId: threadId,
        draft: draft 
      }, { headers });
    } catch (error) {
      console.error("Failed to revert draft in database:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManualEdit = async (currentText) => {
    if (!threadId || pendingDraft || isLoading || isSaving) return; 
    
    // 🚀 Skip saving if the text hasn't changed at all!
    if (currentText === originalDraftRef.current) return;
    
    setIsSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/proposals/save`, {
        threadId: threadId,
        draft: currentText 
      }, { headers });
      
      // Update reference to prevent double saves
      originalDraftRef.current = currentText; 
      
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } catch (error) {
      console.error("Failed to save manual edit:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderDiff = () => {
    if (!pendingDraft) return null;
    const diffParts = Diff.diffWordsWithSpace(draft, pendingDraft);

    return (
      <div className="diff-viewer">
        {diffParts.map((part, index) => {
          let className = 'diff-unchanged';
          if (part.added) className = 'diff-added';
          if (part.removed) className = 'diff-removed';
          
          return (
            <span key={index} className={className}>
              {part.value}
            </span>
          );
        })}
      </div>
    );
  };

  const isBusy = isLoading || isSaving;

  return (
    <div className="proposal-dashboard">
      <div className="dashboard-hero">
        <div>
          <h1>AI Proposal Writer</h1>
          <p className="subtext">Generate bespoke, highly-targeted proposals tailored to your freelancer profile.</p>
        </div>
      </div>

      <div className="proposal-grid">
        
        {/* LEFT: History Sidebar */}
        <BentoBox className="history-bento">
          <button 
            className="new-proposal-btn" 
            onClick={handleNewProposal}
            disabled={isBusy} 
          >
            + New Proposal
          </button>
          <div className="history-list">
            {history.map((item) => (
              <div 
                key={item.threadId} 
                className={`history-card ${activeTab === item.threadId ? 'active' : ''}`}
                onClick={() => loadHistoryItem(item)}
                style={{ opacity: isBusy ? 0.5 : 1, pointerEvents: isBusy ? 'none' : 'auto' }} 
              >
                <p className="history-title">{item.jobTitle || 'Untitled Job'}</p>
                <p className="muted text-xs">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </BentoBox>

        {/* RIGHT: Workspace */}
        <BentoBox className="workspace-bento">
          
          {/* View 1: Initial Form */}
          {!draft && !isLoading && (
            <div className="workspace-form">
              <div className="dark-input-group">
                <label>Job Title / Role <span className="required-asterisk">*</span></label>
                <input 
                  type="text" 
                  className="dark-input" 
                  placeholder="e.g. Senior React Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              <div className="dark-input-group">
                <label>Job Description <span className="required-asterisk">*</span></label>
                <textarea 
                  className="dark-input" 
                  rows="6" 
                  placeholder="Paste the client's job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              <div className="dark-input-group">
                <label>Specific Instructions <span className="optional-text">(Optional)</span></label>
                <input 
                  type="text" 
                  className="dark-input" 
                  placeholder="e.g. Highlight my experience with Stripe integration"
                  value={initialPrompt}
                  onChange={(e) => setInitialPrompt(e.target.value)}
                  disabled={isBusy}
                />
              </div>

              <button 
                className="action-btn"
                onClick={handleGenerate}
                disabled={!jobTitle || !jobDescription || isBusy}
              >
                Generate Proposal
              </button>
            </div>
          )}

          {/* View 2: Loading State for Initial Generation */}
          {!draft && isLoading && (
            <div className="editor-loading-overlay" style={{position: 'relative', height: '100%', borderRadius: '12px'}}>
              <div className="loading-spinner"></div>
              <p>Analyzing job & crafting your proposal...</p>
            </div>
          )}

          {/* View 3: Living Document & Diff Viewer */}
          {draft && (
            <div className="workspace-document">
              
              <div className="document-header">
                <div className="header-top-row">
                  {/* Title and Toggle grouped tightly together */}
                  <div className="title-context-group">
                    <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{jobTitle}</h3>
                    <button 
                      className="context-toggle-btn"
                      onClick={() => setIsContextExpanded(!isContextExpanded)}
                    >
                      {isContextExpanded ? 'Hide Details' : 'Additional Details'}
                    </button>
                  </div>
                  
                  <div className="header-actions">
                    {/* Status Indicators */}
                    <div className="save-status-indicator">
                      {isSaving && <span style={{ color: 'var(--text-secondary)' }}>Saving...</span>}
                      {showSavedToast && !isSaving && <span style={{ color: '#2ea043' }}>✓ Saved</span>}
                    </div>
                  </div>
                </div>

                {/* Collapsible Job Context */}
                {isContextExpanded && (
                  <div className="context-collapse-content">
                    <p className="context-label">Original Job Description:</p>
                    <div className="context-text">{jobDescription}</div>
                  </div>
                )}
              </div>

              <div className="editor-wrapper">
                {isLoading && (
                  <div className="editor-loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Refining...</p>
                  </div>
                )}
                
                {/* Render Textarea OR Diff Viewer */}
                {pendingDraft ? (
                  showDiff ? renderDiff() : (
                    <textarea 
                      className="dark-living-document"
                      value={pendingDraft} 
                      readOnly 
                      style={{ cursor: 'not-allowed', opacity: 0.9 }}
                    />
                  )
                ) : (
                  <textarea 
                    className="dark-living-document"
                    value={draft} 
                    onChange={(e) => setDraft(e.target.value)} 
                    onFocus={(e) => { originalDraftRef.current = e.target.value; }} 
                    onBlur={(e) => handleSaveManualEdit(e.target.value)} 
                    readOnly={isBusy} 
                  />
                )}
              </div>

              {/* Action Bars */}
              {pendingDraft ? (
                <div className="diff-action-bar">
                  <div className="diff-view-toggles">
                    <button 
                      className={`toggle-btn ${showDiff ? 'active' : ''}`} 
                      onClick={() => setShowDiff(true)}
                      disabled={isSaving}
                    >
                      Show Diff
                    </button>
                    <button 
                      className={`toggle-btn ${!showDiff ? 'active' : ''}`} 
                      onClick={() => setShowDiff(false)}
                      disabled={isSaving}
                    >
                      Preview Clean
                    </button>
                  </div>

                  <div className="diff-buttons">
                    <button className="diff-btn diff-reject" onClick={handleRejectDiff} disabled={isSaving}>Reject</button>
                    <button className="diff-btn diff-accept" onClick={handleAcceptDiff} disabled={isSaving}>Accept Changes</button>
                  </div>
                </div>
              ) : (
                <div className="refinement-container">
                  <label className="refinement-label">How would you like to refine this draft?</label>
                  <div className="refinement-bar">
                    <input 
                      type="text" 
                      className="dark-input refinement-input"
                      placeholder="e.g., 'Make it shorter', 'Tone down the enthusiasm'"
                      value={refinementPrompt} 
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && refinementPrompt && !isBusy) {
                          handleRefine();
                        }
                      }}
                      disabled={isBusy} 
                    />
                    <button 
                      className="ghost-button refine-btn"
                      onClick={handleRefine}
                      disabled={isBusy || !refinementPrompt} 
                    >
                      Refine
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </BentoBox>
      </div>
    </div>
  );
};

export default ProposalAgent;