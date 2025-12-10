import { useState, useEffect } from 'react';
import './TransactionForm.css';

const TAX_RATE_PERCENTAGE = 3; 

function TransactionForm({ onSubmit, onComplete, initialData, loading }) {
  const [formData, setFormData] = useState({
    type: 'debit',
    amount: '',
    description: '',
  });
  const [error, setError] = useState('');

  const isEditMode = !!initialData;

  // If initialData is provided (for editing), populate the form
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        type: initialData.type,
        amount: initialData.amount,
        description: initialData.description || '',
      });
    } else {
      // Reset form for "add" mode
      setFormData({
        type: 'debit',
        amount: '',
        description: '',
      });
    }
  }, [initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    // Calculate tax based on the amount
    const tax = (parsedAmount * TAX_RATE_PERCENTAGE) / 100;
    const transactionData = {
      ...formData,
      amount: parsedAmount,
      tax: tax,
      taxPercentage: TAX_RATE_PERCENTAGE,
    };

    if (formData.type === 'debit') {
      transactionData.tax = 0;
      transactionData.taxPercentage = 0;
    }

    // The onSubmit prop will be an async function that handles the API call
    try {
      await onSubmit(transactionData);
      onComplete(); // This will close the modal
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} transaction.`);
    }
  };

  return (
    <form className="txn-form" onSubmit={handleSubmit}>
      {error && <div className="txn-form-error">{error}</div>}
      
      {/* --- Type Toggle --- */}
      <div className="txn-form-group">
        <label>Type</label>
        <div className="txn-type-toggle">
          <button
            type="button"
            className={formData.type === 'debit' ? 'active' : ''}
            onClick={() => handleTypeChange('debit')}
          >
            Debit (Expense)
          </button>
          <button
            type="button"
            className={formData.type === 'credit' ? 'active' : ''}
            onClick={() => handleTypeChange('credit')}
          >
            Credit (Income)
          </button>
        </div>
      </div>

      {/* --- Amount --- */}
      <div className="txn-form-group">
        <label htmlFor="amount">Amount ($)</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          required
        />
      </div>

      {/* --- Description --- */}
      <div className="txn-form-group">
        <label htmlFor="description">Description (Optional)</label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Groceries, Paycheck"
        />
      </div>

      {/* --- Submit Button --- */}
      <div className="txn-form-actions">
        <button type="submit" className="txn-submit-btn" disabled={loading}>
          {loading ? (
            <span className="auth-spinner small"></span>
          ) : (
            isEditMode ? 'Save Changes' : 'Log Transaction'
          )}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;
