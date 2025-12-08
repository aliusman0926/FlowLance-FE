import React from 'react';
import './TransactionTable.css';

// --- Reusable Icon Button ---
const TableIconButton = ({ icon, label, onClick, className = '' }) => (
  <button onClick={onClick} className={`table-icon-button ${className}`} aria-label={label}>
    {icon}
  </button>
);

// --- Icons ---
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V12h2.293z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
  </svg>
);


function TransactionTable({ transactions, onEdit, onDelete, currency = 'USD', rate = 1 }) {
  // Helper to format currency
  const formatCurrency = (amount) => {
    // Convert USD amount to selected currency
    const value = parseFloat(amount) * rate;
    
    const options = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    // Format credits as green, debits as default
    return (
      <span className={value > 0 ? 'txn-credit' : 'txn-debit'}>
        {value.toLocaleString('en-US', options)}
      </span>
    );
  };

  // Helper to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="table-empty-state">
        <p>You have no transactions recorded.</p>
        <p>Click "Log Transaction" to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th className="th-amount">Amount</th>
            <th className="th-amount">Tax ({transactions[0]?.taxPercentage || 0}%)</th>
            <th className="th-amount">Total</th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const totalUSD = txn.type === 'credit' ? txn.amount - txn.tax : txn.amount + txn.tax;
            
            return (
              <tr key={txn.id || txn._id}>
                <td data-label="Date">{formatDate(txn.createdAt)}</td>
                <td data-label="Type">
                  <span className={`txn-type-badge ${txn.type}`}>
                    {txn.type}
                  </span>
                </td>
                <td data-label="Description" className="td-description">
                  {txn.description || 'N/A'}
                </td>
                <td data-label="Amount" className="td-amount">
                  {formatCurrency(txn.amount)}
                </td>
                <td data-label="Tax" className="td-amount">
                  ({formatCurrency(txn.tax)})
                </td>
                <td data-label="Total" className="td-amount td-total">
                  {formatCurrency(totalUSD)}
                </td>
                <td data-label="Actions" className="td-actions">
                  <TableIconButton
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => onEdit(txn)}
                    className="edit-btn"
                  />
                  <TableIconButton
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => onDelete(txn)}
                    className="delete-btn"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionTable;