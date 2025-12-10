import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './SummaryDashboard.css';
import { TbRefresh } from "react-icons/tb";

const API_BASE_URL = 'http://localhost:3000/api';

const formatCurrency = (amount = 0) => {
  return Number(amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function StatPill({ label, value, tone = 'neutral' }) {
  return (
    <div className={`stat-pill stat-pill-${tone}`}>
      <p className="pill-label">{label}</p>
      <p className="pill-value">{value}</p>
    </div>
  );
}

function SummaryDashboard({ user }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = useMemo(() => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [balanceRes, txnRes, gigRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/balances/user`, { headers }),
        axios.get(`${API_BASE_URL}/transactions/user`, { headers }),
        axios.get(`${API_BASE_URL}/gigs/user`, { headers }),
      ]);

      setBalance(balanceRes.data?.balance || 0);

      const sortedTransactions = (txnRes.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setTransactions(sortedTransactions);

      const gigList = gigRes.data || [];
      setGigs(gigList);

      const milestoneEntries = await Promise.all(
        gigList.map(async (gig) => {
          try {
            const res = await axios.get(`${API_BASE_URL}/milestones/gig/${gig._id}`, { headers });
            return [gig._id, res.data || []];
          } catch (milestoneErr) {
            console.error('Milestone fetch failed', milestoneErr);
            return [gig._id, []];
          }
        })
      );

      setMilestones(Object.fromEntries(milestoneEntries));
    } catch (err) {
      console.error('Dashboard summary failed', err);
      setError('Unable to load dashboard data right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshDashboard();
    }
  }, [token]);

  const totalCredits = useMemo(
    () => transactions.filter((t) => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [transactions]
  );

  const totalDebits = useMemo(
    () => transactions.filter((t) => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [transactions]
  );

  const netChange = totalCredits - totalDebits;

  const allMilestones = useMemo(
    () =>
      gigs.flatMap((gig) =>
        (milestones[gig._id] || []).map((m) => ({
          ...m,
          gigTitle: gig.title || 'Untitled gig',
          gigStatus: gig.status,
        }))
      ),
    [gigs, milestones]
  );

  const upcomingMilestones = useMemo(() => {
    return allMilestones
      .filter((m) => m.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [allMilestones]);

  const pendingPayouts = useMemo(
    () =>
      allMilestones
        .filter((m) => m.status !== 'Done')
        .reduce((sum, m) => sum + Number(m.paymentAmount || 0), 0),
    [allMilestones]
  );

  const gigStatusCounts = useMemo(() => {
    const defaults = { Open: 0, 'In Progress': 0, Completed: 0, Archived: 0 };
    return gigs.reduce((acc, gig) => {
      acc[gig.status] = (acc[gig.status] || 0) + 1;
      return acc;
    }, defaults);
  }, [gigs]);

  const topGigs = useMemo(() => {
    const earningsByGig = gigs.map((gig) => {
      const total = (milestones[gig._id] || []).reduce((sum, m) => sum + Number(m.paymentAmount || 0), 0);
      return {
        id: gig._id,
        title: gig.title || 'Untitled gig',
        client: gig.clientName || 'Client',
        total,
      };
    });

    return earningsByGig
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [gigs, milestones]);

  const topClients = useMemo(() => {
    const clientTotals = {};

    transactions.forEach((t) => {
      const name = t.counterparty || t.clientName || 'Client';
      clientTotals[name] = (clientTotals[name] || 0) + Number(t.amount || 0);
    });

    return Object.entries(clientTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [transactions]);

  const latestTransactions = transactions.slice(0, 6);

  return (
    <div className="summary-dashboard">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Unified overview</p>
          <h1>Welcome, {user.username || 'User'} </h1>
          <p className="subtext">Balances, gig health, and transaction activity at a glance.</p>
        </div>
        <button className="ghost-button" onClick={refreshDashboard} disabled={loading}>
          {loading ? 'Refreshing…' : <TbRefresh />}
        </button>
      </div>

      {error && <div className="summary-error">{error}</div>}

      <div className="bento-grid">
        <div className="bento-card balance-card">
          <div className="card-head">
            <p className="label">Current balance</p>
            <span className={`badge ${netChange >= 0 ? 'badge-success' : 'badge-danger'}`}>
              {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)} this period
            </span>
          </div>
          <h2 className="balance-figure">{formatCurrency(balance)}</h2>
          <div className="stat-row">
            <StatPill label="Total Incoming" value={formatCurrency(totalCredits)} tone="positive" />
            <StatPill label="Total Outgoing" value={formatCurrency(totalDebits)} tone="muted" />
            <StatPill label="Pending payouts" value={formatCurrency(pendingPayouts)} tone="accent" />
          </div>
        </div>

        <div className="bento-card gig-health">
          <div className="card-head">
            <p className="label">Gig pipeline</p>
            <p className="muted">Open → Completed</p>
          </div>
          <div className="gig-stats">
            {Object.entries(gigStatusCounts).map(([status, count]) => (
              <div className="gig-pill" key={status}>
                <span className={`pill-dot status-${{
                  Open: 'open',
                  'In Progress': 'progress',
                  Completed: 'completed',
                  Archived: 'archived',
                }[status] || 'default'}`} />
                <div>
                  <p className="pill-label">{status}</p>
                  <p className="pill-value">{count} gig{count === 1 ? '' : 's'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card milestones-card">
          <div className="card-head">
            <p className="label">Upcoming milestones</p>
            <p className="muted">Next due items</p>
          </div>
          <div className="milestone-list">
            {upcomingMilestones.length === 0 ? (
              <p className="muted">No milestones scheduled.</p>
            ) : (
              upcomingMilestones.map((m) => (
                <div className="milestone-row" key={m._id}>
                  <div>
                    <p className="milestone-title">{m.title || 'Milestone'}</p>
                    <p className="muted">{m.gigTitle}</p>
                  </div>
                  <div className="milestone-meta">
                    <span className={`chip ${m.status === 'Done' ? 'chip-success' : 'chip-warning'}`}>
                      {m.status || 'Pending'}
                    </span>
                    <span className="muted">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'No date'}</span>
                    <span className="pill-value">{formatCurrency(m.paymentAmount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bento-card transactions-card">
          <div className="card-head">
            <p className="label">Latest transactions</p>
            <p className="muted">Recent activity</p>
          </div>
          <div className="txn-list">
            {latestTransactions.length === 0 ? (
              <p className="muted">No transactions recorded yet.</p>
            ) : (
              latestTransactions.map((txn) => (
                <div className="txn-row" key={txn._id || txn.id}>
                  <div className="txn-info">
                    <span className={`chip ${txn.type === 'credit' ? 'chip-success' : 'chip-danger'}`}>
                      {txn.type || 'txn'}
                    </span>
                    <div>
                      <p className="txn-title">{txn.description || 'Transaction'}</p>
                      <p className="muted">{new Date(txn.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`txn-amount ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* <div className="bento-card insights-card">
          <div className="card-head">
            <p className="label">Top performers</p>
            <p className="muted">Gigs and clients</p>
          </div>
          <div className="insights-grid">
            <div>
              <p className="pill-label">Top gigs</p>
              {topGigs.length === 0 ? (
                <p className="muted">No gigs yet.</p>
              ) : (
                topGigs.map((gig) => (
                  <div className="insight-row" key={gig.id}>
                    <div>
                      <p className="milestone-title">{gig.title}</p>
                      <p className="muted">{gig.client}</p>
                    </div>
                    <p className="pill-value">{formatCurrency(gig.total)}</p>
                  </div>
                ))
              )}
            </div>
            <div>
              <p className="pill-label">Top clients</p>
              {topClients.length === 0 ? (
                <p className="muted">Waiting for transactions.</p>
              ) : (
                topClients.map((client) => (
                  <div className="insight-row" key={client.name}>
                    <p className="milestone-title">{client.name}</p>
                    <p className="pill-value">{formatCurrency(client.total)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default SummaryDashboard;