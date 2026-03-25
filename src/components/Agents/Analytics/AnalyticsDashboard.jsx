import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ComposedChart, Bar, Line
} from 'recharts';
import { 
  BrainCircuit, TrendingUp, Target, Briefcase, 
  DollarSign, CheckCircle2, CircleDashed, FileCheck, Zap,
  Compass, BookOpen
} from 'lucide-react';
import './AnalyticsDashboard.css';

const DashboardSkeleton = () => (
  <div className="analytics-container loading-state">
    <div className="ai-loading-content">
      <div className="scanner-ring">
        <BrainCircuit size={40} className="pulse-icon" />
      </div>
      <h2 className="loading-title">Synthesizing Profile Data</h2>
      <p className="loading-subtitle">Cross-referencing your resume and gig history with live market trends...</p>
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    axios.get('http://localhost:3000/api/analytics/insights')
      .then(res => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch analytics", err);
        setError("Failed to load AI Analytics. Please try again.");
        setLoading(false);
      });
  }, []);

  const personalData = useMemo(() => {
    if (!data) return null;
    const history = data.rawStats.portfolioHistory || [];
    
    let completed = 0, pending = 0;
    history.forEach(gig => {
      (gig.milestones || []).forEach(m => {
        if (m.status.toLowerCase() === 'done') completed++;
        else pending++;
      });
    });

    const timelineMap = {};
    history.forEach(gig => {
      const dateStr = gig.timeline?.start || gig.timeline?.due; 
      if (dateStr) {
        const month = new Date(dateStr).toLocaleString('default', { month: 'short' });
        if (!timelineMap[month]) timelineMap[month] = { month, revenue: 0, gigs: 0 };
        timelineMap[month].revenue += (gig.totalValue || 0);
        timelineMap[month].gigs += 1;
      }
    });
    
    return {
      milestones: [
        { name: 'Completed', value: completed, color: '#10b981' }, 
        { name: 'Pending', value: pending, color: '#94a3b8' }    
      ],
      revenueTimeline: Object.values(timelineMap)
    };
  }, [data]);

  const getInsightIcon = (key) => {
    switch(key.toLowerCase()) {
      case 'pricing': return <DollarSign size={22} />;
      case 'positioning': return <Target size={22} />;
      case 'upskill': return <BookOpen size={22} />;
      case 'strategy': return <Compass size={22} />;
      default: return <Zap size={22} />;
    }
  };

  const formatMarketCount = (count) => {
    if (!count) return "0";
    if (count >= 1000) return `${(Math.floor(count / 1000) * 1000).toLocaleString()}+`;
    if (count >= 100) return `${(Math.floor(count / 100) * 100).toLocaleString()}+`;
    return count.toString();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="analytics-error">{error}</div>;
  if (!data) return null;

  const { rawStats, aiInsights } = data;
  const { market_trends, ai_insights_text } = aiInsights;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  const customTooltip = {
    backgroundColor: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    padding: '12px'
  };

  return (
    <motion.div className="analytics-container" variants={containerVariants} initial="hidden" animate="show">
      <motion.div className="analytics-header" variants={itemVariants}>
        <div>
          <h1 className="dashboard-title">AI Analytics</h1>
          <p className="dashboard-subtitle">Your personal market position & trajectory</p>
        </div>
        <div className="header-badges">
          <div className="domain-pill">
            {market_trends.domain}
          </div>
        </div>
      </motion.div>

      {/* TOP METRICS */}
      <motion.div className="metrics-bento" variants={itemVariants}>
        <div className="bento-card stat-card">
          <div className="stat-icon"><Target size={24}/></div>
          <p className="stat-label">Active Market Roles</p>
          <h3 className="stat-value">{formatMarketCount(market_trends.metrics.active_market_listings)}</h3>
        </div>
        <div className="bento-card stat-card">
          <div className="stat-icon"><TrendingUp size={24}/></div>
          <p className="stat-label">Market Avg Rate</p>
          <h3 className="stat-value">${market_trends.charts.salary_distribution[1].rate}/hr</h3>
        </div>
        <div className="bento-card stat-card">
          <div className="stat-icon"><Briefcase size={24}/></div>
          <p className="stat-label">Active Gigs</p>
          <h3 className="stat-value">{rawStats.freelancerProfile.totalGigs}</h3>
        </div>
        <div className="bento-card stat-card">
          <div className="stat-icon"><DollarSign size={24}/></div>
          <p className="stat-label">Total Volume</p>
          <h3 className="stat-value">${rawStats.freelancerProfile.currentBalance.toFixed(2)}</h3>
        </div>
      </motion.div>

      {/* CHARTS LAYER 1: PERSONAL DATA */}
      <motion.div className="charts-bento personal-charts" variants={itemVariants}>
        <div className="bento-card chart-card">
          <div className="chart-header">
            <h3>Revenue & Gig Trajectory</h3>
            <p>Your historical performance</p>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={personalData.revenueTimeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="month" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" width={60} stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <YAxis yAxisId="right" width={40} orientation="right" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltip} itemStyle={{ color: 'var(--text-color)' }} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} opacity={0.8} />
                <Line yAxisId="right" type="monotone" dataKey="gigs" name="Gigs Secured" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-card chart-card side-chart">
          <div className="chart-header">
            <h3>Milestone Execution</h3>
            <p>Task completion rate</p>
          </div>
          <div className="chart-wrapper flex-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={personalData.milestones} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {personalData.milestones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltip} itemStyle={{ color: 'var(--text-color)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              <div className="legend-item"><CheckCircle2 size={16} color="#10b981"/> {personalData.milestones[0].value} Completed</div>
              <div className="legend-item"><CircleDashed size={16} color="#94a3b8"/> {personalData.milestones[1].value} Pending</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CHARTS LAYER 2: MARKET DATA */}
      <motion.div className="charts-bento market-charts" variants={itemVariants}>
        <div className="bento-card chart-card side-chart">
          <div className="chart-header">
            <h3>Tech Stack Demand</h3>
            <p>Market requirements mapping</p>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              {/* Reduced outerRadius to 55% to stop labels from cutting off */}
              <RadarChart cx="50%" cy="50%" outerRadius="55%" data={market_trends.charts.skills_demand}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Demand Score" dataKey="demand_score" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Tooltip contentStyle={customTooltip} itemStyle={{ color: '#10b981' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bento-card chart-card">
          <div className="chart-header">
            <h3>6-Month Industry Trend</h3>
            <p>Macro market volume ({market_trends.domain})</p>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              {/* Fixed margin and width so numbers aren't clipped */}
              <AreaChart data={market_trends.charts.historical_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="month" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                {/* Formatted to display as '12k' instead of '12000' */}
                <YAxis width={40} stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip contentStyle={customTooltip} itemStyle={{ color: 'var(--text-color)' }} />
                <Area type="monotone" dataKey="active_jobs" name="Active Roles" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorJobs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* MODERN EXECUTIVE REPORT */}
      <motion.div className="insights-section" variants={itemVariants}>
        <div className="section-header">
          <div>
            <h2>Executive Action Plan</h2>
          </div>
          <div className="badge-outline">AI Synthesized</div>
        </div>
        
        <div className="report-cards-grid">
          {Object.entries(ai_insights_text).map(([key, insight], index) => {
            const isHighlight = key === 'upskill' || key === 'strategy';
            
            return (
              <motion.div 
                className={`insight-card ${isHighlight ? 'highlight-card' : ''}`} 
                key={key}
                whileHover={{ y: -4 }}
              >
                <div className="insight-card-header">
                  <div className={`insight-icon ${isHighlight ? 'icon-highlight' : ''}`}>
                    {getInsightIcon(key)}
                  </div>
                  {isHighlight && <span className="action-tag"><Zap size={12}/> Strategic Pivot</span>}
                </div>
                <div className="insight-card-content">
                  <h3 className="insight-card-title">{insight.title}</h3>
                  <p className="insight-card-text">{insight.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsDashboard;