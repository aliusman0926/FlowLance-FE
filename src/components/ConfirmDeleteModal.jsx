import React from 'react';
import './ConfirmDeleteModal.css';

/**
 * A simple confirmation component to be placed inside a Modal.
 * @param {object} props
 * @param {string} props.message - The confirmation message (e.g., "Are you sure...")
 * @param {Function} props.onConfirm - Function to call when "Confirm" is clicked
 * @param {Function} props.onCancel - Function to call when "Cancel" is clicked
 * @param {boolean} props.loading - Disables buttons when true
 */
function ConfirmDeleteModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="confirm-delete-container">
      <p className="confirm-message">{message}</p>
      <div className="confirm-actions">
        <button
          onClick={onCancel}
          disabled={loading}
          className="confirm-btn cancel-btn"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="confirm-btn delete-btn"
        >
          {loading ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
