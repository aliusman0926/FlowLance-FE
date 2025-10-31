import { useState, useEffect, useCallback } from 'react';
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

// --- Reusable Bento Box Component ---
function BentoBox({ children, className = '' }) {
  return <div className={`bento-box ${className}`}>{children}</div>;
}

// --- Main Dashboard Component ---
function TransactionDashboard() {
  const token = localStorage.getItem('token'); // Get token from localStorage
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Modal State ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); // <-- RENAMED
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // <-- ADDED
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        axios.get(BALANCE_URL, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(TRANSACTIONS_URL, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setBalance(balanceRes.data.balance || 0);
      const sortedTransactions = transactionsRes.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setTransactions(sortedTransactions);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [token]); // <-- Correct: Depends on token

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]); // <-- Correct: Depends on token and fetchData

  // --- Modal Control Handlers ---
  const openAddModal = useCallback(() => {
    setModalMode('add');
    setSelectedTransaction(null);
    setIsFormModalOpen(true); // <-- UPDATED
  }, []); // <-- Correct: No dependencies

  const openEditModal = useCallback((transaction) => {
    setModalMode('edit');
    setSelectedTransaction(transaction); // <-- This sets the state
    setIsFormModalOpen(true); // <-- UPDATED
  }, []); // <-- Correct: No dependencies

  const closeFormModal = useCallback(() => { // <-- RENAMED
    setIsFormModalOpen(false); // <-- UPDATED
    setSelectedTransaction(null);
    setModalMode('add'); // Reset mode
  }, []); // <-- Correct: No dependencies

  // --- ADDED: Delete Modal Handlers ---
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
        // --- THIS IS THE FIX ---

        // 1. Change the safeguard to check for `id` OR `_id`.
        //    This also makes the console log *much* clearer.
        if (!selectedTransaction || (!selectedTransaction.id && !selectedTransaction._id)) {
          console.error('Submit error: selectedTransaction is missing an ID', selectedTransaction);
          throw new Error('No transaction selected for editing.');
        }

        // 2. Get the ID, preferring `id` but falling back to `_id`.
        const transactionId = selectedTransaction.id || selectedTransaction._id;

        await axios.put(
          // 3. Use the correct `transactionId` in the API call.
          `${TRANSACTIONS_API}/${transactionId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      await fetchData(); // Refresh all data
      closeFormModal(); // <-- UPDATED
    } catch (err) {
      console.error(`Failed to ${modalMode} transaction:`, err);
      throw err; // Re-throw to be caught by TransactionForm
    } finally {
      setFormLoading(false);
    }
  }, 
  [
    // --- THIS IS THE FIX ---
    // The function MUST be rebuilt when these values change.
    // Your old version was likely missing `selectedTransaction` or `modalMode`.
    modalMode, 
    selectedTransaction, 
    token, 
    fetchData, 
    closeFormModal // <-- UPDATED
  ]);

  // --- UPDATED: This is now the actual delete logic ---
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTransaction || (!selectedTransaction.id && !selectedTransaction._id)) {
      console.error('Delete error: No transaction selected.');
      return;
    }
    const transactionId = selectedTransaction.id || selectedTransaction._id;
    
    setFormLoading(true); // Reuse loading state to disable buttons
    try {
      await axios.delete(`${TRANSACTIONS_API}/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchData(); // Refresh data
      closeDeleteModal(); // Close modal on success
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      // You could set a specific error state for the delete modal here
    } finally {
      setFormLoading(false);
    }
  }, [selectedTransaction, token, fetchData, closeDeleteModal]);

  // --- Helper to format currency ---
  const formatCurrency = (amount) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '$0.00';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return <div className="dashboard-loading"></div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="bento-grid-container">
      <div className="bento-grid">
        {/* --- Balance Box --- */}
        <BentoBox className="balance-box">
          <h3 className="bento-title">Current Balance</h3>
          <p className="balance-amount">{formatCurrency(balance)}</p>
          <button className="log-txn-btn" onClick={openAddModal}>
            + Log Transaction
          </button>
        </BentoBox>

        <BentoBox className="graph-box">
          <h3 className="bento-title">Transaction History</h3>
          <TransactionChart transactions={transactions} />
        </BentoBox>

        {/* --- Table Box --- */}
        <BentoBox className="table-box">
          <h3 className="bento-title">All Transactions</h3>
          <TransactionTable 
            transactions={transactions}
            onEdit={openEditModal}
            onDelete={openDeleteModal} // <-- UPDATED
          />
        </BentoBox>
      </div>
      <Modal
        isOpen={isFormModalOpen} // <-- UPDATED
        onClose={closeFormModal} // <-- UPDATED
        title={modalMode === 'add' ? 'Log New Transaction' : 'Edit Transaction'}
      >
        <TransactionForm
          onSubmit={handleFormSubmit}
          onComplete={closeFormModal} // <-- UPDATED
          initialData={selectedTransaction}
          loading={formLoading}
        />
      </Modal>

      {/* --- ADDED: Delete Confirmation Modal --- */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirm Deletion"
      >
        <ConfirmDeleteModal
          message={`Are you sure you want to delete this transaction? ${
            selectedTransaction?.description
              ? `(${selectedTransaction.description})`
              : ''
          }`}
          onConfirm={handleConfirmDelete}
          onCancel={closeDeleteModal}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}

export default TransactionDashboard;


