import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TbRefresh } from 'react-icons/tb';
import './ExpenseSummary.css';

const API_BASE_URL = 'http://localhost:3000/api';
const CHART_COLORS = ['#22c55e', '#14b8a6', '#60a5fa', '#c084fc', '#f472b6', '#f97316', '#facc15', '#38bdf8'];
const DEBIT_COLORS = ['#e11d48', '#be123c', '#9f1239', '#881337', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e'];

const formatCurrency = (amount = 0) =>
  Number(amount || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function ChartCard({ title, label, data, colors = CHART_COLORS }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const newLabel = label.split(' ')[0].toLowerCase();
  const pillClass = newLabel === 'income' ? 'total-pill-credit' : 'total-pill-debit';

  return (
    <div className="bento-card chart-card">
      <div className="card-head">
        <div>
          <p className="label">{label}</p>
          <h3>{title}</h3>
        </div>
        <span className={'pill ' + pillClass}>{formatCurrency(total)}</span>
      </div>
      <div className="chart-shell">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ background: 'var(--card-color)', border: '1px solid var(--border-color)', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.9rem' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart">No data yet for this type.</div>
        )}
      </div>
    </div>
  );
}

function ExpenseSummary() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const headers = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/transactions/user`, { headers });
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to load transactions by category', err);
      setError('Unable to fetch transactions right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadTransactions();
    }
  }, [token]);

  const buildCategoryData = useCallback(
    (type) => {
      const totals = transactions
        .filter((txn) => txn.type === type)
        .reduce((acc, txn) => {
          const category = txn.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + Number(txn.amount || 0);
          return acc;
        }, {});

      return Object.entries(totals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    [transactions]
  );

  const creditData = useMemo(() => buildCategoryData('credit'), [buildCategoryData]);
  const debitData = useMemo(() => buildCategoryData('debit'), [buildCategoryData]);

  const creditCategories = useMemo(() => {
    const categories = new Set(['All']);
    transactions
      .filter((txn) => txn.type === 'credit')
      .forEach((txn) => categories.add(txn.category || 'Uncategorized'));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const debitCategories = useMemo(() => {
    const categories = new Set(['All']);
    transactions
      .filter((txn) => txn.type === 'debit')
      .forEach((txn) => categories.add(txn.category || 'Uncategorized'));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const [creditFilter, setCreditFilter] = useState('All');
  const [debitFilter, setDebitFilter] = useState('All');

  const groupedByType = useCallback(
    (type, categoryFilter) => {
      const grouped = transactions
        .filter((txn) => txn.type === type)
        .filter((txn) => categoryFilter === 'All' || (txn.category || 'Uncategorized') === categoryFilter)
        .reduce((acc, txn) => {
          const category = txn.category || 'Uncategorized';
          if (!acc[category]) acc[category] = [];
          acc[category].push(txn);
          return acc;
        }, {});

      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, txns]) => ({
          category,
          txns: txns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        }));
    },
    [transactions]
  );

  const groupedCredits = useMemo(() => groupedByType('credit', creditFilter), [groupedByType, creditFilter]);
  const groupedDebits = useMemo(() => groupedByType('debit', debitFilter), [groupedByType, debitFilter]);

  if (loading) {
    return (
      <div className="expense-summary">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">Spending overview</p>
            <h1>Expense Summary</h1>
          </div>
        </div>
        <div className="loading-state">Loading your categories…</div>
      </div>
    );
  }

  return (
    <div className="expense-summary">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Spending overview</p>
          <h1>AI Analytics</h1>
          <p className="subtext">See how your credits and debits break down across categories.</p>
        </div>
        <button className="ghost-button" onClick={loadTransactions} disabled={loading}>
          {loading ? 'Refreshing…' : <TbRefresh />}
        </button>
      </div>

      {error && <div className="summary-error">{error}</div>}

      <div className="bento-grid chart-grid">
        <ChartCard title="Credit Distribution" label="Income mix" data={creditData} />
        <ChartCard title="Debit Distribution" label="Expense mix" data={debitData} colors={DEBIT_COLORS} />
      </div>

      <div className="bento-card category-card">
        <div className="card-head">
          <div>
            <p className="label">Transactions</p>
            <h3>Sorted by category</h3>
          </div>
          <span className="pill muted-pill">{transactions.length} total</span>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-chart">No transactions recorded yet.</div>
        ) : (
          <div className="transaction-columns">
            <div className="transaction-column credit-column">
              <div className="column-head">
                <div>
                  <p className="label">Credits</p>
                  <h4>By category</h4>
                </div>
                <select
                  className="category-select"
                  value={creditFilter}
                  onChange={(e) => setCreditFilter(e.target.value)}
                >
                  {creditCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {groupedCredits.length === 0 ? (
                <div className="empty-chart">No credits match this category.</div>
              ) : (
                <div className="category-list">
                  {groupedCredits.map(({ category, txns }) => {
                    const total = txns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

                    return (
                      <div className="category-group credit-group" key={`credit-${category}`}>
                        <div className="category-header">
                          <div>
                            <p className="label">Category</p>
                            <h4>{category}</h4>
                          </div>
                          <div className="category-totals">
                            <span className="pill success-pill">{formatCurrency(total)}</span>
                          </div>
                        </div>
                        <div className="transaction-list">
                          {txns.map((txn) => (
                            <div className="transaction-row" key={txn._id || txn.id}>
                              <div>
                                <p className="txn-title">{txn.description || 'No description'}</p>
                                <p className="txn-sub">{new Date(txn.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="txn-amount positive">+{formatCurrency(txn.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="transaction-column debit-column">
              <div className="column-head">
                <div>
                  <p className="label">Debits</p>
                  <h4>By category</h4>
                </div>
                <select
                  className="category-select"
                  value={debitFilter}
                  onChange={(e) => setDebitFilter(e.target.value)}
                >
                  {debitCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {groupedDebits.length === 0 ? (
                <div className="empty-chart">No debits match this category.</div>
              ) : (
                <div className="category-list">
                  {groupedDebits.map(({ category, txns }) => {
                    const total = txns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

                    return (
                      <div className="category-group debit-group" key={`debit-${category}`}>
                        <div className="category-header">
                          <div>
                            <p className="label">Category</p>
                            <h4>{category}</h4>
                          </div>
                          <div className="category-totals">
                            <span className="pill danger-pill">{formatCurrency(total)}</span>
                          </div>
                        </div>
                        <div className="transaction-list">
                          {txns.map((txn) => (
                            <div className="transaction-row" key={txn._id || txn.id}>
                              <div>
                                <p className="txn-title">{txn.description || 'No description'}</p>
                                <p className="txn-sub">{new Date(txn.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="txn-amount negative">-{formatCurrency(txn.amount)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseSummary;