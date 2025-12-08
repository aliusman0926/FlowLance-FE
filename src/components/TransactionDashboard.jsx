import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './TransactionDashboard.css';
import TransactionTable from '../components/TransactionTable';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TransactionChart from '../components/TransactionChart';
import TransactionForm from '../components/TransactionForm';

// --- API Endpoints ---
const API_BASE_URL = 'http://localhost:3000/api';
const BALANCE_URL = `${API_BASE_URL}/balances/user`;
const TRANSACTIONS_URL = `${API_BASE_URL}/transactions/user`;
const TRANSACTIONS_API = 'http://localhost:3000/api/transactions';

// Real-time Free Currency API (No Key Required)
const RATES_API = 'http://localhost:3000/api/rates';
function BentoBox({ children, className = '' }) {
  return <div className={`bento-box ${className}`}>{children}</div>;
}

function TransactionDashboard() {
  const token = localStorage.getItem('token');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Currency State ---
  // Default to USD only. Real rates will populate from API.
  const [rates, setRates] = useState({ USD: 1 }); 
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [currencySearch, setCurrencySearch] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [ratesError, setRatesError] = useState(null);

  // --- Modal State ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRatesError(null);

    try {
      // 1. Fetch CRITICAL Data (Balance & Transactions)
      // We await this separately so dashboard always works even if rates fail
      const [balanceRes, transactionsRes] = await Promise.all([
        axios.get(BALANCE_URL, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(TRANSACTIONS_URL, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setBalance(balanceRes.data.balance || 0);
      const sortedTransactions = transactionsRes.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setTransactions(sortedTransactions);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data.');
      setLoading(false);
      return; // Stop if critical data fails
    }

    // 2. Fetch Currency Rates (Non-Critical)
    try {
      const ratesRes = await axios.get(RATES_API);
      if (ratesRes.data && ratesRes.data.rates) {
        setRates(ratesRes.data.rates);
      }
    } catch (rateErr) {
      console.error('Currency API failed:', rateErr);
      setRatesError('Real-time currency conversion unavailable.');
      // We do NOT set static fallbacks. It stays at { USD: 1 }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // --- Currency Logic ---
  const filteredCurrencies = useMemo(() => {
    return Object.keys(rates).filter(currency => 
      currency.toLowerCase().includes(currencySearch.toLowerCase())
    );
  }, [rates, currencySearch]);

  const handleCurrencySelect = (currency) => {
    setSelectedCurrency(currency);
    setIsCurrencyDropdownOpen(false);
    setCurrencySearch('');
  };

  const currentRate = rates[selectedCurrency] || 1;

  const formatDashboardCurrency = (amountInUSD) => {
    const converted = amountInUSD * currentRate;
    return converted.toLocaleString('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // --- Modal Handlers ---
  const openAddModal = useCallback(() => {
    setModalMode('add');
    setSelectedTransaction(null);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((transaction) => {
    setModalMode('edit');
    setSelectedTransaction(transaction);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedTransaction(null);
    setModalMode('add');
  }, []);

  const openDeleteModal = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setSelectedTransaction(null);
    setIsDeleteModalOpen(false);
  }, []);

  // --- CRUD Handlers ---
  const handleFormSubmit = useCallback(async (formData) => {
    setFormLoading(true);
    try {
      if (modalMode === 'add') {
        await axios.post(TRANSACTIONS_API, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        if (!selectedTransaction || (!selectedTransaction.id && !selectedTransaction._id)) {
          throw new Error('No transaction selected for editing.');
        }
        const transactionId = selectedTransaction.id || selectedTransaction._id;
        await axios.put(
          `${TRANSACTIONS_API}/${transactionId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await fetchData();
      closeFormModal();
    } catch (err) {
      console.error(`Failed to ${modalMode} transaction:`, err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [modalMode, selectedTransaction, token, fetchData, closeFormModal]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTransaction || (!selectedTransaction.id && !selectedTransaction._id)) return;
    const transactionId = selectedTransaction.id || selectedTransaction._id;
    
    setFormLoading(true);
    try {
      await axios.delete(`${TRANSACTIONS_API}/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setFormLoading(false);
    }
  }, [selectedTransaction, token, fetchData, closeDeleteModal]);


  if (loading) return <div className="dashboard-loading"></div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <div className="bento-grid-container">
      {/* --- Currency Filter Header --- */}
      <div className="dashboard-header-controls">
        <div className="currency-selector-wrapper">
          <label>View in:</label>
          <div className="currency-dropdown">
            <input 
              type="text" 
              placeholder={selectedCurrency} 
              value={currencySearch}
              onChange={(e) => {
                setCurrencySearch(e.target.value);
                setIsCurrencyDropdownOpen(true);
              }}
              onFocus={() => setIsCurrencyDropdownOpen(true)}
              className="currency-search-input"
              disabled={!!ratesError} // Disable if API failed
            />
            {ratesError && <span className="currency-error-tooltip">Offline</span>}
            
            {isCurrencyDropdownOpen && !ratesError && (
              <ul className="currency-list">
                {filteredCurrencies.map(curr => (
                  <li 
                    key={curr} 
                    onClick={() => handleCurrencySelect(curr)}
                    className={curr === selectedCurrency ? 'active' : ''}
                  >
                    <span className="curr-code">{curr}</span>
                    <span className="curr-rate">{rates[curr].toFixed(2)}</span>
                  </li>
                ))}
                {filteredCurrencies.length === 0 && <li className="no-results">No currency found</li>}
              </ul>
            )}
            
            {isCurrencyDropdownOpen && (
              <div className="currency-backdrop" onClick={() => setIsCurrencyDropdownOpen(false)}></div>
            )}
          </div>
        </div>
      </div>

      <div className="bento-grid">
        {/* --- Balance Box --- */}
        <BentoBox className="balance-box">
          <h3 className="bento-title">Current Balance</h3>
          <p className="balance-amount">{formatDashboardCurrency(balance)}</p>
          <button className="log-txn-btn" onClick={openAddModal}>
            + Log Transaction (USD)
          </button>
        </BentoBox>

        {/* --- Chart Box --- */}
        <BentoBox className="graph-box">
          <h3 className="bento-title">Transaction History ({selectedCurrency})</h3>
          <TransactionChart 
            transactions={transactions} 
            currency={selectedCurrency}
            rate={currentRate}
          />
        </BentoBox>

        {/* --- Table Box --- */}
        <BentoBox className="table-box">
          <h3 className="bento-title">All Transactions</h3>
          <TransactionTable 
            transactions={transactions}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            currency={selectedCurrency}
            rate={currentRate}
          />
        </BentoBox>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={modalMode === 'add' ? 'Log New Transaction' : 'Edit Transaction'}
      >
        <TransactionForm
          onSubmit={handleFormSubmit}
          onComplete={closeFormModal}
          initialData={selectedTransaction}
          loading={formLoading}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirm Deletion"
      >
        <ConfirmDeleteModal
          message={`Are you sure you want to delete this transaction?`}
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteModal}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}

export default TransactionDashboard;