import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, Lock, Sparkles, ChevronRight, CheckCircle, AlertCircle, ThumbsUp, Lightbulb } from 'lucide-react';
import './ResumeOptimizer.css';

const API_BASE = 'http://localhost:3000/api';

function BentoBox({ children, className = '' }) {
    return <div className={`ro-bento ${className}`}>{children}</div>;
}

function StatusBadge({ status }) {
    const good = status === 'good';
    return (
        <span className={`ro-badge ${good ? 'ro-badge--good' : 'ro-badge--warn'}`}>
            {good
                ? <><CheckCircle size={12} /> Looks good</>
                : <><AlertCircle size={12} /> Suggestions</>}
        </span>
    );
}

const toTitleCase = (str) => {
    return str
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const ResumeOptimizer = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState(null);
    const [critique, setCritique] = useState(null);   // { overall, sections[] }

    const [isAnalysing, setIsAnalysing] = useState(false);
    const [hasResume, setHasResume] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const res = await axios.get(`${API_BASE}/resume`, { headers });
                const list = res.data?.resumes || [];
                setResumes(list);
                setHasResume(list.length > 0);
            } catch {
                setHasResume(false);
            }
        };
        fetchResumes();
    }, [headers]);

    const handleAnalyse = async () => {
        if (!selectedResume) return;
        setIsAnalysing(true);
        setError('');
        setCritique(null);
        try {
            const res = await axios.post(
                `${API_BASE}/resume/${selectedResume.resumeId}/optimize`,
                {},
                { headers }
            );
            setCritique({
                overall:  res.data.overall  || '',
                sections: res.data.sections || [],
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed. Please verify the AI service is running.');
        } finally {
            setIsAnalysing(false);
        }
    };

    const handleViewResume = async (resumeId) => {
        try {
            const res = await fetch(`${API_BASE}/resume/${resumeId}/view`, { headers });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch {
            setError('Failed to open resume. Please try again.');
        }
    };

    const needsWorkCount = critique?.sections?.filter(s => s.status === 'needs_work').length ?? 0;
    const goodCount      = critique?.sections?.filter(s => s.status === 'good').length ?? 0;
    const totalImprovements = critique?.sections?.reduce((n, s) => n + (s.improvements?.length ?? 0), 0) ?? 0;

    const isLocked = hasResume === false;

    if (hasResume === null) return null;

    return (
        <div className={`ro-page${isLocked ? ' ro-locked' : ''}`}>

            <div className="ro-hero">
                <h1>Resume Optimiser</h1>
                <p className="ro-subtext">Get honest, section-by-section feedback on your resume.</p>
            </div>

            <div className="ro-grid">

                {/* ── Sidebar ───────────────────────────────────────────── */}
                <BentoBox className="ro-sidebar">
                    <p className="ro-sidebar-label">Your Resumes</p>

                    {resumes.length === 0 ? (
                        <p className="ro-empty-hint">No resumes found. Upload one in Settings.</p>
                    ) : (
                        <div className="ro-resume-list">
                            {resumes.map((r) => (
                                <div
                                    key={r.resumeId}
                                    className={`ro-resume-row${selectedResume?.resumeId === r.resumeId ? ' ro-resume-row--active' : ''}`}
                                >
                                    <button
                                        className="ro-resume-select"
                                        onClick={() => { setSelectedResume(r); setCritique(null); setError(''); }}
                                        disabled={isAnalysing}
                                        title="Select to review"
                                    >
                                        <FileText size={15} className="ro-resume-icon" />
                                        <span className="ro-resume-name">{r.filename}</span>
                                        {selectedResume?.resumeId === r.resumeId && (
                                            <ChevronRight size={14} className="ro-resume-chevron" />
                                        )}
                                    </button>
                                    <button
                                        className="ro-view-btn"
                                        onClick={() => handleViewResume(r.resumeId)}
                                        disabled={isAnalysing}
                                        title="View PDF"
                                    >
                                        <Eye size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        className="ro-optimize-btn"
                        onClick={handleAnalyse}
                        disabled={!selectedResume || isAnalysing}
                    >
                        {isAnalysing
                            ? <><span className="ro-spinner" /> Analysing…</>
                            : <><Sparkles size={15} /> Review Resume</>}
                    </button>
                </BentoBox>

                {/* ── Main panel ────────────────────────────────────────── */}
                <BentoBox className="ro-workspace">

                    {error && (
                        <div className="ro-error-banner">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {!critique && !isAnalysing && (
                        <div className="ro-placeholder">
                            <Sparkles size={40} className="ro-placeholder-icon" />
                            <p>Select a resume and click <strong>Review Resume</strong> to get detailed feedback.</p>
                        </div>
                    )}

                    {isAnalysing && (
                        <div className="ro-loading-state">
                            <div className="ro-loading-spinner" />
                            <p>Reviewing your resume…</p>
                            <span className="ro-loading-note">This may take up to 30 seconds.</span>
                        </div>
                    )}

                    {critique && !isAnalysing && (
                        <div className="ro-critique">

                            {/* Summary strip — only shown when structured sections exist */}
                            {critique.sections.length > 0 && (
                                <div className="ro-critique-meta">
                                    <span className="ro-meta-filename">{selectedResume?.filename}</span>
                                    <div className="ro-meta-counts">
                                        {goodCount > 0 && (
                                            <span className="ro-meta-pill ro-meta-pill--good">
                                                <CheckCircle size={11} /> {goodCount} section{goodCount !== 1 ? 's' : ''} good
                                            </span>
                                        )}
                                        {needsWorkCount > 0 && (
                                            <span className="ro-meta-pill ro-meta-pill--warn">
                                                <AlertCircle size={11} /> {needsWorkCount} to improve
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Overall assessment */}
                            {critique.overall && (
                                <div className="ro-overall">
                                    <p className="ro-overall-label">
                                        {critique.sections.length > 0 ? 'Overall Assessment' : 'Resume Feedback'}
                                    </p>
                                    <p className="ro-overall-text">{critique.overall}</p>
                                </div>
                            )}

                            {/* Section cards */}
                            {critique.sections.length > 0 && (
                                <div className="ro-cards">
                                    {critique.sections.map((section, i) => (
                                        <div
                                            key={i}
                                            className={`ro-card ro-card--${section.status === 'good' ? 'good' : 'warn'}`}
                                        >
                                            <div className="ro-card-hd">
                                                <span className="ro-card-title">{toTitleCase(section.name)}</span>
                                                <StatusBadge status={section.status} />
                                            </div>

                                            <div className="ro-card-body">
                                                {section.highlights && (
                                                    <div className="ro-highlights">
                                                        <p className="ro-sub-label">
                                                            <ThumbsUp size={11} /> What's working
                                                        </p>
                                                        <p className="ro-highlights-text">{section.highlights}</p>
                                                    </div>
                                                )}

                                                {section.improvements?.length > 0 && (
                                                    <div className="ro-improvements">
                                                        <p className="ro-sub-label ro-sub-label--warn">
                                                            <Lightbulb size={11} /> Suggestions
                                                        </p>
                                                        <ul className="ro-suggestions">
                                                            {section.improvements.map((sg, si) => (
                                                                <li key={si} className="ro-suggestion">{sg}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </BentoBox>
            </div>

            {/* ── Lock overlay ──────────────────────────────────────────── */}
            {isLocked && (
                <div className="ro-lock-overlay">
                    <div className="ro-lock-card">
                        <div className="ro-lock-icon"><Lock size={34} /></div>
                        <h2>Resume required</h2>
                        <p>Upload at least one resume in Settings before using the reviewer.</p>
                        <button className="ro-unlock-btn" onClick={() => navigate('/settings')}>
                            Go to Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeOptimizer;
