import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './MessagingAgent.css';

const API_BASE_URL = 'http://localhost:3000/api';

const MessagingAgent = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = useMemo(
    () => ({ ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    [token]
  );

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClientName, setNewClientName] = useState('Client');
  const [newGigName, setNewGigName] = useState('New project collaboration');
  const [newGigDescription, setNewGigDescription] = useState('Help me build a polished product landing page with authentication.');
  const [latestMessage, setLatestMessage] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [intent, setIntent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages`, { headers });
      setThreads(response.data.threads || []);
    } catch (error) {
      console.error('Failed to fetch messaging threads:', error);
    }
  };

  const selectThread = (thread) => {
    setSelectedThread(thread);
    setLatestMessage(thread.latestMessage || '');
    setReplyDraft(thread.lastReply || '');
    setSentiment('');
    setIntent('');
    setErrorMessage('');
  };

  const createChat = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/messages/create`,
        {
          clientName: newClientName,
          gigName: newGigName,
          gigDescription: newGigDescription
        },
        { headers }
      );

      const thread = response.data.thread;
      setThreads((prev) => [thread, ...prev]);
      setSelectedThread(thread);
      setLatestMessage(thread.latestMessage || '');
      setReplyDraft('');
      setSentiment('');
      setIntent('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Create chat error:', error);
      setErrorMessage(error.response?.data?.error || 'Unable to create chat.');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeLatestMessage = async () => {
    if (!latestMessage) {
      setErrorMessage('There is no client message to analyze.');
      return;
    }

    setErrorMessage('');
    setIsAnalyzing(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/messages/analyze`,
        {
          clientName: selectedThread?.clientName || newClientName,
          gigDescription: selectedThread?.gigDescription || newGigDescription,
          latestMessage
        },
        { headers }
      );

      setSentiment(response.data.sentiment || '');
      setIntent(response.data.intent || '');
    } catch (error) {
      console.error('Analyze message error:', error);
      setErrorMessage(error.response?.data?.error || 'Unable to analyze the message.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSuggestedReply = async () => {
    if (!latestMessage) {
      setErrorMessage('Please provide the latest client message first.');
      return;
    }

    setErrorMessage('');
    setIsGenerating(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/messages/reply`,
        {
          clientName: selectedThread?.clientName || newClientName,
          gigName: selectedThread?.gigName || newGigName,
          gigDescription: selectedThread?.gigDescription || newGigDescription,
          latestMessage,
          conversationHistory: selectedThread?.conversationHistory || [],
          threadId: selectedThread?.threadId
        },
        { headers }
      );

      const thread = response.data.thread;
      
      // Only set the reply draft, don't send it
      setReplyDraft(response.data.reply || '');
      setSentiment(response.data.sentiment || '');
      setIntent(response.data.intent || '');

      if (thread) {
        setSelectedThread(thread);
        setThreads((prev) => {
          const updated = prev.filter((item) => item.threadId !== thread.threadId);
          return [thread, ...updated];
        });
      } else {
        fetchThreads();
      }
    } catch (error) {
      console.error('Generate reply error:', error);
      setErrorMessage(error.response?.data?.error || 'Unable to generate a suggested reply.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReply = async () => {
    if (!selectedThread) {
      setErrorMessage('Select a thread before sending a reply.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/messages/send`,
        {
          threadId: selectedThread.threadId,
          reply: replyDraft
        },
        { headers }
      );

      const thread = response.data.thread;
      setSelectedThread(thread);
      setReplyDraft('');
      setLatestMessage(''); // Clear the input
      setSentiment('');
      setIntent('');
      
      setThreads((prev) => {
        const updated = prev.filter((item) => item.threadId !== thread.threadId);
        return [thread, ...updated];
      });

      // Auto-generate next client message
      setTimeout(() => {
        generateNextClientMessage(thread);
      }, 800);
    } catch (error) {
      console.error('Send reply error:', error);
      setErrorMessage(error.response?.data?.error || 'Unable to send the reply.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNextClientMessage = async (thread) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/messages/simulate`,
        {
          clientName: thread.clientName || 'Client',
          gigContext: thread.gigDescription || '',
          conversationHistory: thread.conversationHistory || []
        },
        { headers }
      );

      if (response.data.latestMessage) {
        setLatestMessage(response.data.latestMessage);
      }
    } catch (error) {
      console.error('Failed to generate next client message:', error);
    }
  };

  const renderThreadHistory = () => {
    const history = selectedThread?.conversationHistory || [];
    const clientName = selectedThread?.clientName || 'Client';
    
    // Create a display list that includes the latest message if not already in history
    const displayHistory = [...history];
    if (latestMessage && !history.some(msg => msg.text === latestMessage && msg.sender === 'client')) {
      displayHistory.push({ sender: 'client', text: latestMessage });
    }

    if (displayHistory.length === 0) {
      return <p className="muted">No messages yet. Start the conversation.</p>;
    }

    return displayHistory.map((message, index) => (
      <div key={index} className={`message-bubble ${message.sender}`}>
        <div className="message-content">
          <p className="message-sender">{message.sender === 'freelancer' ? 'You' : clientName}</p>
          <p className="message-text">{message.text}</p>
        </div>
      </div>
    ));
  };

  return (
    <div className="messaging-dashboard">
      <div className="messaging-hero">
        <div>
          <h1>Messages</h1>
          <p className="subtext">Keep client chats organized, review sentiment, and approve suggested replies.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowCreateDialog(true)}>
          + New Chat
        </button>
      </div>

      <div className="messaging-grid">
        <aside className="threads-panel">
          <h2>Inbox</h2>
          {threads.length === 0 ? (
            <p className="muted">No threads yet. Create a new chat to begin.</p>
          ) : (
            <div className="threads-list">
              {threads.map((thread) => (
                <button
                  key={thread.threadId}
                  type="button"
                  className={`thread-card ${selectedThread?.threadId === thread.threadId ? 'active' : ''}`}
                  onClick={() => selectThread(thread)}
                >
                  <div>
                    <strong>{thread.gigName || 'Untitled gig'}</strong>
                    <p className="thread-client">{thread.clientName || 'Client'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="chat-panel">
          {selectedThread ? (
            <>
              <div className="chat-header">
                <div>
                  <h2>{selectedThread.gigName}</h2>
                </div>
                <span className="chat-badge">{selectedThread.clientName}</span>
              </div>

              <div className="chat-history">{renderThreadHistory()}</div>

              <div className="reply-panel">
                <div className="action-buttons">
                  <div className="button-row">
                    <button className="outline-btn" onClick={analyzeLatestMessage} disabled={isAnalyzing}>
                      {isAnalyzing ? 'Analyzing…' : 'Analyze sentiment'}
                    </button>
                    <button className="outline-btn" onClick={generateSuggestedReply} disabled={isGenerating}>
                      {isGenerating ? 'Generating…' : 'Suggest reply'}
                    </button>
                  </div>

                  {(sentiment || intent) && (
                    <div className="metadata-row">
                      {sentiment && <div className="metadata-item"><strong>Sentiment:</strong> <span>{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}</span></div>}
                      {intent && <div className="metadata-item"><strong>Intent:</strong> <span>{intent.charAt(0).toUpperCase() + intent.slice(1)}</span></div>}
                    </div>
                  )}
                </div>

                <div className="reply-input-section">
                  <label>Your reply</label>
                  <textarea
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    rows={5}
                    placeholder="Type or review the suggested reply before sending."
                    className="reply-input"
                  />

                  {replyDraft && (
                    <div className="button-row">
                      <button className="primary-btn" onClick={sendReply} disabled={isLoading || !replyDraft.trim()}>
                        {isLoading ? 'Sending…' : 'Send reply'}
                      </button>
                      <button className="outline-btn" onClick={() => setReplyDraft('')}>
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {errorMessage && <p className="error-text">{errorMessage}</p>}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No chat selected</h2>
              <p>Choose a thread from the inbox or create a new chat to begin messaging.</p>
            </div>
          )}
        </main>
      </div>

      {showCreateDialog && (
        <div className="dialog-backdrop" onClick={() => setShowCreateDialog(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <h3>Create a new chat</h3>
            <label>Client name</label>
            <input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
            <label>Gig title</label>
            <input value={newGigName} onChange={(e) => setNewGigName(e.target.value)} />
            <label>Gig description</label>
            <textarea value={newGigDescription} onChange={(e) => setNewGigDescription(e.target.value)} rows={4} />
            <div className="button-row dialog-actions">
              <button type="button" className="outline-btn" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={createChat} disabled={isLoading}>
                {isLoading ? 'Creating…' : 'Create chat'}
              </button>
            </div>
            {errorMessage && <p className="error-text">{errorMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingAgent;
