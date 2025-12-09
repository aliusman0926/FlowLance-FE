import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './TransactionDashboard.css';
import TransactionTable from '../components/TransactionTable';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TransactionChart from '../components/TransactionChart';
import TransactionForm from '../components/TransactionForm';
import DatePicker from "react-datepicker";
import { FaFileCsv } from "react-icons/fa6";
import { TbFileTypeCsv } from "react-icons/tb";
import { PiFileCsvFill } from "react-icons/pi";

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      const [balanceRes] = await Promise.all([
        axios.get(BALANCE_URL, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setBalance(balanceRes.data.balance || 0);

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

  // --- Transaction Loading with Date Filters ---
  const loadTransactions = async (start, end) => {
    try {
      const params = {};
      if (start) params.start_date = start;
      if (end) params.end_date = end;

      const res = await axios.get(TRANSACTIONS_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      const sorted = res.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setTransactions(sorted);

    } catch (err) {
      console.error("Error loading transactions:", err);
    }
  };

  useEffect(() => {
    // Avoid calling unnecessarily if both are empty
    loadTransactions(startDate, endDate);
  }, [startDate, endDate]);

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
      await loadTransactions(startDate, endDate);
      closeFormModal();
    } catch (err) {
      console.error(`Failed to ${modalMode} transaction:`, err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [modalMode, selectedTransaction, token, fetchData, loadTransactions, closeFormModal]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTransaction || (!selectedTransaction.id && !selectedTransaction._id)) return;
    const transactionId = selectedTransaction.id || selectedTransaction._id;
    
    setFormLoading(true);
    try {
      await axios.delete(`${TRANSACTIONS_API}/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData();
      await loadTransactions(startDate, endDate);
      closeDeleteModal();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setFormLoading(false);
    }
  }, [selectedTransaction, token, fetchData, loadTransactions, closeDeleteModal]);

  // --- Report Generation ---
  // Assuming you have a startDate and endDate state variables
  const generateReport = async () => {
    try {
      // Build the query string only if dates are provided
      let query = '';
      if (startDate || endDate) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        query = `?${params.toString()}`;
      }

      const response = await fetch(`/api/transactions/report${query}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Or wherever your token is stored
        }
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob(); // Convert response to blob (PDF)
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank'); // Open PDF in new tab
    } catch (err) {
      console.error(err);
      alert('Error generating report.');
    }
  };

  // Upload CSV
  const uploadCSVHandler = async (file) => {
    if (!file) {
      throw new Error("No file selected");
    }

    if (file.type !== "text/csv") {
      throw new Error("Only CSV files are allowed");
    }

    // Read file content
    const text = await file.text();
    const lines = text.trim().split("\n");

    if (lines.length < 2) {
      throw new Error("CSV file is empty or missing data");
    }

    // ✅ Validate headers
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const requiredHeaders = ["amount", "type"];

    for (const header of requiredHeaders) {
      if (!headers.includes(header)) {
        throw new Error(`Missing required header: ${header}`);
      }
    }

    // ✅ Validate each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row = Object.fromEntries(headers.map((h, idx) => [h, values[idx]]));

      const amount = parseFloat(row.amount);
      const type = row.type?.toLowerCase();

      if (isNaN(amount)) {
        throw new Error(`Invalid amount at row ${i + 1}`);
      }

      if (!["credit", "debit"].includes(type)) {
        throw new Error(`Invalid type at row ${i + 1}. Must be credit or debit`);
      }

      if (row.taxpercentage && isNaN(parseFloat(row.taxpercentage))) {
        throw new Error(`Invalid taxPercentage at row ${i + 1}`);
      }
    }

    // ✅ If validation passes, send to backend
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${TRANSACTIONS_API}/uploadCSV`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "CSV upload failed");
    } else {
      // Refresh data after successful upload
      await fetchData();
      await loadTransactions(startDate, endDate);
    }

    return data;
  };

  if (loading) return <div className="dashboard-loading"></div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <div className="bento-grid-container">
      {/* --- Currency Filter Header --- */}
      <div className="bento-header">
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

          <div className="date-filters-inline">
              <DatePicker
                selected={startDate ? new Date(startDate) : null}
                onChange={(date) => setStartDate(date ? date.toISOString().split("T")[0] : "")}
                placeholderText="Start Date"
                dateFormat="MMM d, yyyy"
                className="date-pill"
                calendarClassName="dark-calendar"
                popperClassName="calendar-popper"
                showPopperArrow={false}
              />

              <span className="date-separator">→</span>

              <DatePicker
                selected={endDate ? new Date(endDate) : null}
                onChange={(date) => setEndDate(date ? date.toISOString().split("T")[0] : "")}
                placeholderText="End Date"
                dateFormat="MMM d, yyyy"
                className="date-pill"
                calendarClassName="dark-calendar"
                popperClassName="calendar-popper"
                showPopperArrow={false}
              />
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
          <label className="log-txn-btn">
            <TbFileTypeCsv />  Import CSV
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={uploadCSVHandler}
            />
          </label>
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
        
        {/* --- Report Box --- */}
        <BentoBox className="graph-box">
          <h3 className="bento-title">Generate Reports</h3>
          <p className="report-text">Click to generate income statement and tax report of this specified time period.</p>
          <button className="log-txn-btn"
           onClick={generateReport}
          >
            Generate Tax Report
          </button>
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