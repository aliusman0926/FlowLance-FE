import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  TbArrowUpRight,
  TbCloudUpload,
  TbEye,
  TbFileDescription,
  TbLink,
  TbLoader2,
  TbLogout,
  TbSparkles,
  TbTrash,
  TbUser,
} from 'react-icons/tb';
import './SettingsPage.css';

const FIVERR_LOGIN_URL = 'https://www.fiverr.com/login';
const UPWORK_LOGIN_URL = 'https://www.upwork.com/ab/account-security/login';

const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Update your public account identity.',
    icon: TbUser,
  },
  {
    id: 'resumes',
    label: 'Resumes',
    description: 'Manage the files used by AI memory.',
    icon: TbFileDescription,
  },
  {
    id: 'connections',
    label: 'Connections',
    description: 'Open linked freelancer platforms.',
    icon: TbLink,
  },
  {
    id: 'session',
    label: 'Session',
    description: 'Sign out of your current workspace.',
    icon: TbLogout,
  },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

function SettingsPage({ user, onUserUpdate, onLogout }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [username, setUsername] = useState(user?.username || '');
  const [profileFeedback, setProfileFeedback] = useState({ type: '', message: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const fileInputRef = useRef(null);
  const hasLoadedResumesRef = useRef(false);

  useEffect(() => {
    setUsername(user?.username || '');
    setProfileFeedback({ type: '', message: '' });
  }, [user?.username]);

  const fetchResumes = useEffectEvent(async () => {
    setIsLoadingResumes(true);
    setResumeError('');

    try {
      const response = await axios.get('/api/resume', getAuthHeaders());
      if (response.data.success) {
        setResumes(response.data.resumes || []);
      } else {
        setResumes([]);
      }
    } catch (err) {
      console.error('Failed to fetch resumes', err);
      hasLoadedResumesRef.current = false;
      setResumeError('Failed to load resumes. Please try again.');
    } finally {
      setIsLoadingResumes(false);
    }
  });

  useEffect(() => {
    if (activeSection !== 'resumes' || hasLoadedResumesRef.current) {
      return;
    }

    hasLoadedResumesRef.current = true;
    fetchResumes();
  }, [activeSection]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setProfileFeedback({ type: 'error', message: 'Username is required.' });
      return;
    }

    if (trimmedUsername === (user?.username || '').trim()) {
      setProfileFeedback({ type: 'success', message: 'Your username is already up to date.' });
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback({ type: '', message: '' });

    try {
      const response = await axios.put('/api/users/me', { username: trimmedUsername }, getAuthHeaders());
      onUserUpdate?.(response.data);
      setUsername(response.data.username || trimmedUsername);
      setProfileFeedback({ type: 'success', message: 'Username updated successfully.' });
    } catch (err) {
      console.error('Failed to update username', err);
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update username. Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileChange = (event) => {
    setResumeError('');
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setSelectedFile(null);
      setResumeError('Only PDF files are supported.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  const resetFileSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);
    setResumeError('');

    const formData = new FormData();
    formData.append('file', selectedFile, selectedFile.name);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/resume/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        resetFileSelection();
        await fetchResumes();
      }
    } catch (err) {
      console.error('Failed to upload resume', err);
      setResumeError(err.response?.data?.error || 'Failed to process and upload resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    setDeletingId(resumeId);
    setResumeError('');

    try {
      const response = await axios.delete(`/api/resume/${resumeId}`, getAuthHeaders());
      if (response.data.success) {
        setResumes((currentResumes) => currentResumes.filter((resume) => resume.resumeId !== resumeId));
        resetFileSelection();
      }
    } catch (err) {
      console.error('Failed to delete resume', err);
      setResumeError(err.response?.data?.error || 'Failed to delete resume.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = async (resumeId) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/resume/${resumeId}/view`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (err) {
      console.error('Failed to open resume', err);
      setResumeError('Failed to open resume. Please try again.');
    }
  };

  const currentSection = SETTINGS_SECTIONS.find((section) => section.id === activeSection) || SETTINGS_SECTIONS[0];

  return (
    <section className="settings-page">
      <div className="settings-hero">
        <div>
          <p className="settings-kicker">Workspace Control Panel</p>
          <h1>Settings</h1>
          <p className="settings-subtitle">
            Adjust your profile, AI resume memory, connected platforms, and session controls.
          </p>
        </div>
        <div className="settings-hero-badge">
          <span>Signed in as</span>
          <strong>{user?.username || 'User'}</strong>
        </div>
      </div>

      <div className="settings-shell">
        <aside className="settings-sidebar" aria-label="Settings sections">
          <div className="settings-sidebar-header">
            <span className="settings-sidebar-eyebrow">Categories</span>
            <h2>Account Center</h2>
          </div>

          <nav className="settings-sidebar-nav">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`settings-nav-item ${activeSection === section.id ? 'is-active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="settings-nav-item-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="settings-nav-item-copy">
                    <span className="settings-nav-item-label">{section.label}</span>
                    <span className="settings-nav-item-description">{section.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="settings-main">
          <div className="settings-main-header">
            <div>
              <p className="settings-panel-kicker">Now editing</p>
              <h2>{currentSection.label}</h2>
            </div>
            <p>{currentSection.description}</p>
          </div>

          {activeSection === 'profile' && (
            <div className="settings-panel">
              <form className="settings-form" onSubmit={handleProfileSave}>
                <div className="settings-field-grid">
                  <label className="settings-field">
                    <span>Username</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Enter your username"
                      disabled={isSavingProfile}
                    />
                  </label>

                  <label className="settings-field">
                    <span>Email Address</span>
                    <input type="email" value={user?.email || ''} readOnly disabled />
                  </label>
                </div>

                <div className="settings-panel-note">
                  <strong>Profile note</strong>
                  <p>
                    Username changes update the name shown in the account dropdown and dashboard greeting
                    immediately after save.
                  </p>
                </div>

                {profileFeedback.message && (
                  <div className={`settings-feedback ${profileFeedback.type === 'error' ? 'is-error' : 'is-success'}`}>
                    {profileFeedback.message}
                  </div>
                )}

                <div className="settings-actions">
                  <button
                    type="submit"
                    className="settings-button settings-button-primary"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? <TbLoader2 className="spin-icon" aria-hidden="true" /> : null}
                    {isSavingProfile ? 'Saving...' : 'Save Username'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'resumes' && (
            <div className="settings-panel settings-panel-resumes">
              <div className="settings-resume-upload">
                <div className="settings-card-header">
                  <div>
                    <p className="settings-panel-kicker">AI Memory</p>
                    <h3>Resume Library</h3>
                  </div>
                  <TbFileDescription className="settings-card-header-icon" aria-hidden="true" />
                </div>

                <p className="settings-muted-copy">
                  Upload PDF resumes that your AI tools can reference while generating proposals and insights.
                </p>

                <label className="settings-upload-dropzone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <TbCloudUpload aria-hidden="true" />
                  <span>{selectedFile ? selectedFile.name : 'Choose a PDF resume to upload'}</span>
                  <small>Only PDF files are supported.</small>
                </label>

                <div className="settings-actions">
                  <button
                    type="button"
                    className="settings-button settings-button-primary"
                    disabled={!selectedFile || isUploading}
                    onClick={handleUpload}
                  >
                    {isUploading ? <TbLoader2 className="spin-icon" aria-hidden="true" /> : <TbCloudUpload aria-hidden="true" />}
                    {isUploading ? 'Processing...' : 'Upload Resume'}
                  </button>
                  {selectedFile && !isUploading && (
                    <button
                      type="button"
                      className="settings-button settings-button-secondary"
                      onClick={resetFileSelection}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {resumeError && <div className="settings-feedback is-error">{resumeError}</div>}
              </div>

              <div className="settings-resume-list-panel">
                <div className="settings-card-header">
                  <div>
                    <p className="settings-panel-kicker">Stored Files</p>
                    <h3>Active Resumes ({resumes.length})</h3>
                  </div>
                  <button
                    type="button"
                    className="settings-ai-button"
                    onClick={() => navigate('/agents/resume-optimizer')}
                  >
                    <TbSparkles aria-hidden="true" />
                    Optimise with AI
                  </button>
                </div>

                {isLoadingResumes ? (
                  <div className="settings-empty-state">
                    <TbLoader2 className="spin-icon" aria-hidden="true" />
                    <span>Loading your resume library...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="settings-empty-state">
                    <TbFileDescription aria-hidden="true" />
                    <span>No resumes stored yet. Upload one to start using AI memory.</span>
                  </div>
                ) : (
                  <div className="settings-resume-list">
                    {resumes.map((resume) => (
                      <article key={resume.resumeId} className="settings-resume-item">
                        <button
                          type="button"
                          className="settings-resume-main"
                          onClick={() => handleView(resume.resumeId)}
                        >
                          <span className="settings-resume-file-icon">
                            <TbFileDescription aria-hidden="true" />
                          </span>
                          <span className="settings-resume-copy">
                            <strong>{resume.filename}</strong>
                            <span>Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                          </span>
                        </button>

                        <div className="settings-resume-actions">
                          <button
                            type="button"
                            className="settings-icon-button"
                            onClick={() => handleView(resume.resumeId)}
                            title="View PDF"
                            aria-label={`View ${resume.filename}`}
                          >
                            <TbEye aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="settings-icon-button is-danger"
                            onClick={() => handleDelete(resume.resumeId)}
                            disabled={deletingId === resume.resumeId}
                            title="Delete resume"
                            aria-label={`Delete ${resume.filename}`}
                          >
                            {deletingId === resume.resumeId ? (
                              <TbLoader2 className="spin-icon" aria-hidden="true" />
                            ) : (
                              <TbTrash aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'connections' && (
            <div className="settings-panel settings-connections-panel">
              <div className="settings-connection-card">
                <div className="settings-card-header">
                  <div>
                    <p className="settings-panel-kicker">Marketplace Link</p>
                    <h3>Fiverr</h3>
                  </div>
                  <TbLink className="settings-card-header-icon" aria-hidden="true" />
                </div>
                <p className="settings-muted-copy">
                  Open Fiverr sign-in in a new tab so you can continue linking your freelance workflow manually.
                </p>
                <a
                  className="settings-button settings-button-primary settings-link-button"
                  href={FIVERR_LOGIN_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Fiverr
                  <TbArrowUpRight aria-hidden="true" />
                </a>
              </div>

              <div className="settings-connection-card">
                <div className="settings-card-header">
                  <div>
                    <p className="settings-panel-kicker">Marketplace Link</p>
                    <h3>Upwork</h3>
                  </div>
                  <TbLink className="settings-card-header-icon" aria-hidden="true" />
                </div>
                <p className="settings-muted-copy">
                  Open Upwork account login in a new tab using the same shortcut available in the account menu.
                </p>
                <a
                  className="settings-button settings-button-secondary settings-link-button"
                  href={UPWORK_LOGIN_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Upwork
                  <TbArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </div>
          )}

          {activeSection === 'session' && (
            <div className="settings-panel">
              <div className="settings-session-card">
                <div className="settings-card-header">
                  <div>
                    <p className="settings-panel-kicker">Security</p>
                    <h3>Current Session</h3>
                  </div>
                  <TbLogout className="settings-card-header-icon" aria-hidden="true" />
                </div>

                <p className="settings-muted-copy">
                  Logging out clears your local authentication state and returns you to the login screen.
                </p>

                <div className="settings-panel-note is-warning">
                  <strong>Before you log out</strong>
                  <p>Make sure any in-progress changes on other pages have been saved.</p>
                </div>

                <div className="settings-actions">
                  <button
                    type="button"
                    className="settings-button settings-button-danger"
                    onClick={onLogout}
                  >
                    <TbLogout aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
