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

/**
 * Custom Tooltip for the chart
 */
const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-credits">{`Credits: ${payload[0].value.toLocaleString('en-US', { style: 'currency', currency })}`}</p>
        <p className="tooltip-debits">{`Debits: ${payload[1].value.toLocaleString('en-US', { style: 'currency', currency })}`}</p>
      </div>
    );
  }
  return null;
};

/**
 * A bar chart showing credits and debits over time.
 * @param {object} props
 * @param {Array} props.transactions - The list of transaction objects
 * @param {string} props.currency - The selected currency code
 * @param {number} props.rate - The exchange rate to apply
 */
function TransactionChart({ transactions, currency = 'USD', rate = 1 }) {
  
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

      // Convert amount using the rate
      const convertedAmount = txn.amount * rate;

      if (txn.type === 'credit') {
        groupedData[date].credits += convertedAmount;
      } else {
        groupedData[date].debits += convertedAmount;
      }
    });

    // Convert to array and sort chronologically (oldest to newest)
    return Object.values(groupedData).reverse();
  }, [transactions, rate]);

  if (chartData.length === 0) {
    return (
      <div className="chart-empty-state">
        <p>Log some transactions to see your history chart.</p>
      </div>
    );
  }

  // Helper for Y-axis formatting
  const formatYAxis = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency, 
      notation: "compact", 
      compactDisplay: "short" 
    }).format(value);
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 5, right: 0, left: -10, bottom: 5 }}
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
            tickFormatter={formatYAxis}
          />
          <Tooltip 
            content={<CustomTooltip currency={currency} />} 
            cursor={{ fill: "var(--card-color)" }} 
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar dataKey="credits" fill="#4ade80" radius={[4, 4, 0, 0]} name="Income" />
          <Bar dataKey="debits" fill="#f87171" radius={[4, 4, 0, 0]} name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TransactionChart;