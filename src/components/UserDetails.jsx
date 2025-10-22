import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function UserDetails({ token }) {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user
        const userRes = await api.get(`/users/${id}`);
        setUser(userRes.data);
        setUsername(userRes.data.username);
        setEmail(userRes.data.email);
        
        // Fetch balance ✅ NOW WORKS
        const balanceRes = await api.get('/balances/user');
        setBalance(balanceRes.data);
        
        // Fetch transactions ✅ NEW
        const transactionsRes = await api.get('/transactions');
        setTransactions(transactionsRes.data);
        
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/users/${id}`, { username, email });
      setUser(res.data);
      alert('✅ Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('⚠️ Are you sure you want to delete this account?')) {
      try {
        await api.delete(`/users/${id}`);
        alert('✅ Account deleted');
        navigate('/login');
      } catch (err) {
        setError('Delete failed');
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Loading...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>💰 Transaction Dashboard</h1>
      
      {/* BALANCE CARD */}
      <div style={{ 
        background: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '30px',
        textAlign: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2e7d32', margin: 0 }}>💵 Current Balance</h2>
        <h1 style={{ color: '#2e7d32', fontSize: '2.5em' }}>
          ${balance?.balance?.toFixed(2) || '0.00'}
        </h1>
      </div>

      {/* USER PROFILE */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '30px' 
      }}>
        <h3>👤 Update Profile</h3>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username"
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
            required 
          />
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email"
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '5px' }}
            required 
          />
          <button 
            type="submit"
            style={{ 
              padding: '12px', 
              background: '#4caf50', 
              color: 'white', 
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Update Profile
          </button>
        </form>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
      }}>
        <h3>📊 Recent Transactions ({transactions.length})</h3>
        {transactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No transactions yet. <a href="#add-transaction">Add one!</a></p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Tax</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Net</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        color: tx.type === 'credit' ? '#4caf50' : '#f44336',
                        fontWeight: 'bold'
                      }}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${tx.amount.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>${tx.tax.toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                      ${tx.netAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px' }}>{tx.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE BUTTON */}
      <button 
        onClick={handleDelete} 
        style={{ 
          marginTop: '20px', 
          padding: '12px 24px', 
          backgroundColor: '#f44336', 
          color: 'white', 
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ❌ Delete Account
      </button>

      {error && <p style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>{error}</p>}
    </div>
  );
}

export default UserDetails;