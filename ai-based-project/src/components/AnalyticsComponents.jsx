import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

/**
 * Confidence Ring - A circular progress SVG
 */
export const ConfidenceRing = ({ value = 75, label = "Confidence" }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center group">
            <svg className="w-32 h-32 -rotate-90">
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-foreground/5 fill-none"
                    strokeWidth="8"
                />
                <motion.circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-primary fill-none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-2xl font-black block leading-none">{value}%</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/40">{label}</span>
            </div>
        </div>
    );
};

/**
 * Trend Chart - A slim line chart for performance over time
 */
export const TrendChart = ({ data = [] }) => {
    const chartData = data.length > 0 ? data : [
        { score: 65 }, { score: 72 }, { score: 68 }, { score: 85 }, { score: 82 }, { score: 90 }, { score: 95 }
    ];

    return (
        <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="glass px-2 py-1 rounded-lg border-primary/20">
                                        <p className="text-[10px] font-bold text-primary">{payload[0].value}%</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={false}
                        animationDuration={2000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * MiniTrend - A tiny sparkline for data depth
 */
export const MiniTrend = ({ data = [40, 55, 45, 60, 50, 75, 84], color = "var(--color-primary)" }) => {
    const points = data.map((val, i) => `${(i / (data.length - 1)) * 60},${20 - (val / 100) * 20}`).join(" ");

    return (
        <svg className="w-16 h-6 overflow-visible">
            <motion.polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
        </svg>
    );
};

/**
 * Readiness Gauge - Semicircle progress
 */
export const ReadinessGauge = ({ value = 65 }) => {
    const radius = 30;
    const circumference = Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center group pt-2">
            <svg className="w-20 h-12 overflow-visible">
                <path
                    d="M 10 40 A 30 30 0 0 1 70 40"
                    className="stroke-foreground/5 fill-none"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
                <motion.path
                    d="M 10 40 A 30 30 0 0 1 70 40"
                    className="stroke-primary fill-none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                />
            </svg>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
                <span className="text-xs font-black block leading-none tracking-tight">{value}%</span>
            </div>
        </div>
    );
};

import { AreaChart, Area, XAxis, CartesianGrid } from 'recharts';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

/**
 * TrendIndicator - Standardized up/down arrows with percentage
 */
export const TrendIndicator = ({ value = 5.2, isUp = true }) => (
    <div className={`flex items-center gap-1 font-black text-[10px] ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
        {isUp ? <FiArrowUpRight /> : <FiArrowDownRight />}
        {isUp ? '+' : '-'}{value}%
    </div>
);

/**
 * WeeklyTrendGraph - Full scale analytical line chart
 */
export const WeeklyTrendGraph = ({ data = [
    { day: 'Mon', score: 65 },
    { day: 'Tue', score: 58 },
    { day: 'Wed', score: 72 },
    { day: 'Thu', score: 68 },
    { day: 'Fri', score: 85 },
    { day: 'Sat', score: 82 },
    { day: 'Sun', score: 90 },
] }) => (
    <div className="h-40 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 800 }}
                    dy={10}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="glass px-3 py-2 rounded-xl border-white/10 shadow-xl">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{payload[0].payload.day}</p>
                                    <p className="text-sm font-black text-white">{payload[0].value}% Readiness</p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    animationDuration={2000}
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

/**
 * DataPoint - Small micro-label with value
 */
export const DataPoint = ({ label, value, subValue }) => (
    <div className="flex flex-col">
        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em]">{label}</span>
        <div className="flex items-baseline gap-2">
            <span className="text-xl font-black tracking-tighter">{value}</span>
            {subValue && <span className="text-[10px] font-bold text-foreground/30">{subValue}</span>}
        </div>
    </div>
);
