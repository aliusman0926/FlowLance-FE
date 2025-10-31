import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar 
} from 'recharts';
import './TransactionChart.css';

// Helper to format currency for the chart
const formatCurrency = (value) => `$${value.toLocaleString()}`;

/**
 * Custom Tooltip for the chart
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-credits">{`Credits: ${formatCurrency(payload[0].value)}`}</p>
        <p className="tooltip-debits">{`Debits: ${formatCurrency(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};

/**
 * A bar chart showing credits and debits over time.
 * @param {object} props
 * @param {Array} props.transactions - The list of transaction objects
 */
function TransactionChart({ transactions }) {
  
  // Process transactions into data for the chart
  const chartData = useMemo(() => {
    const groupedData = {};

    // Group transactions by date
    transactions.forEach(txn => {
      const date = new Date(txn.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!groupedData[date]) {
        groupedData[date] = { date, credits: 0, debits: 0 };
      }

      if (txn.type === 'credit') {
        groupedData[date].credits += txn.amount;
      } else {
        groupedData[date].debits += txn.amount;
      }
    });

    // Convert to array and sort chronologically (oldest to newest)
    // The incoming `transactions` are newest-first, so we reverse the final array.
    return Object.values(groupedData).reverse();
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>Log some transactions to see your history chart.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-dim)" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--text-dim)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--card-color)" }} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar dataKey="credits" fill="#4ade80" radius={[4, 4, 0, 0]} />
          <Bar dataKey="debits" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TransactionChart;
