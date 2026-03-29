// File: src/components/Agents/ResumeManager/ResumeManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaUpload, FaFilePdf, FaSpinner } from 'react-icons/fa';
import './ResumeManager.css';

const ResumeManager = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  // Setup your axios instance or headers based on how auth is handled (e.g., localStorage token)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchResumes = async () => {
    try {
      // Assuming you have an endpoint to list user resumes. 
      // If not, you will need to add a simple GET /api/resume route on the backend.
      const response = await axios.get('/api/resume', getAuthHeaders());
      if (response.data.success) {
        setResumes(response.data.resumes || []);
      }
    } catch (err) {
      console.error("Failed to fetch resumes", err);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    setError('');
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSelectedFile(null);
        fetchResumes(); // Refresh list after successful upload
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process and upload resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    setDeletingId(resumeId);
    setError('');

    try {
      const response = await axios.delete(`/api/resume/${resumeId}`, getAuthHeaders());
      if (response.data.success) {
        setResumes(resumes.filter(r => r.resumeId !== resumeId));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete resume.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="resume-manager-container">
      <div className="resume-upload-section">
        <FaFilePdf size={40} color="var(--text-placeholder)" />
        <p>Select a PDF resume to ingest into the AI Agent Vector Database</p>
        
        <div className="file-input-wrapper">
          <button className="btn-upload" disabled={isUploading}>
            {isUploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
            {isUploading ? 'Processing...' : 'Choose File'}
          </button>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        
        {selectedFile && <p className="text-sm mt-2 text-accent-color">Selected: {selectedFile.name}</p>}
        {selectedFile && !isUploading && (
          <button onClick={handleUpload} className="btn-upload mt-2">
            Upload
          </button>
        )}
        {error && <p className="upload-error">{error}</p>}
      </div>

      <div className="resume-list-section">
        <h3>Active Resumes ({resumes.length})</h3>
        
        {resumes.length === 0 ? (
          <div className="empty-state">
            No resumes currently stored in the RAG database. Upload one above to get started.
          </div>
        ) : (
          <div className="resume-list">
            {resumes.map((resume) => (
              <div key={resume.resumeId} className="resume-item">
                <div className="resume-info">
                  <FaFilePdf className="resume-icon" />
                  <div className="resume-details">
                    <p>{resume.filename || `Resume ${resume.resumeId.substring(0, 8)}`}</p>
                    <span>Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(resume.resumeId)}
                  disabled={deletingId === resume.resumeId}
                  title="Remove from AI Memory"
                >
                  {deletingId === resume.resumeId ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeManager;