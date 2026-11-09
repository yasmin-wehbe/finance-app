import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import AddSnapshotModal from '../components/AddSnapshotModal';
import CommentModal from '../components/CommentModal';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { useCurrency } from '../contexts/CurrencyContext';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { 
    Line, Bar, Area, ComposedChart, Tooltip, XAxis, YAxis, 
    ResponsiveContainer, CartesianGrid, ReferenceLine 
} from 'recharts';

function Wealth() {
    const { format, convert, currency } = useCurrency();
    const [rawHistory, setRawHistory] = useState([]);
    const [view, setView] = useState('chart');
    const [chartType, setChartType] = useState('stacked');
    const [expandedSections, setExpandedSections] = useState({
        cashCurrent: true,
        cashSavings: true,
        gold: true,
        investments: true,
        other: true,
        liabilities: true
    });

    const [editingSnapshot, setEditingSnapshot] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ============================================
    // TABLE CONFIGURATION (inline)
    // ============================================
    const wealthSections = useMemo(() => [
        {
            id: 'cashCurrent',
            label: 'Cash current',
            bgColor: 'bg-blue-50',
            hoverColor: 'hover:bg-blue-100',
            textColor: 'text-blue-900',
            getValue: (h) => format((h.cash_current || 0) + (h.cash_current_2 || 0) + (h.cash_current_3 || 0) + (h.cash_ibkr || 0) + (h.cash_hand || 0)),
            subRows: [
                {
                    label: 'NBD',
                    getValue: (h) => format(h.cash_current || 0)
                },
                {
                    label: 'Wio',
                    getValue: (h) => format(h.cash_current_2 || 0)
                },
                {
                    label: 'Rev',
                    getValue: (h) => format(h.cash_current_3 || 0)
                },
                {
                    label: 'IBKR',
                    getValue: (h) => format(h.cash_ibkr || 0)
                },
                {
                    label: 'In hand',
                    getValue: (h) => format(h.cash_hand || 0)
                }
            ]
        },
        {
            id: 'cashSavings',
            label: 'Cash savings',
            bgColor: 'bg-blue-50',
            hoverColor: 'hover:bg-blue-100',
            textColor: 'text-blue-900',
            getValue: (h) => format(h.cash_savings || 0),
            subRows: [
                {
                    label: 'Banks',
                    getValue: (h) => format(h.cash_savings || 0)
                },
                {
                    label: 'Interest rate',
                    getValue: (h) => h.savings_rate || 0,
                    isItalic: true,
                    indent: 12
                }
            ]
        },
        {
            id: 'gold',
            label: 'Gold',
            bgColor: 'bg-blue-50',
            hoverColor: 'hover:bg-blue-100',
            textColor: 'text-blue-900',
            getValue: (h) => format(h.gold_weight * h.gold_price),
            subRows: [
                {
                    label: 'Weight',
                    getValue: (h) => `${h.gold_weight}g`,
                    isItalic: true
                },
                {
                    label: 'Price',
                    getValue: (h) => format(h.gold_price),
                    isItalic: true
                }
            ]
        },
        {
            id: 'investments',
            label: 'Investments',
            bgColor: 'bg-blue-50',
            hoverColor: 'hover:bg-blue-100',
            textColor: 'text-blue-900',
            getValue: (h) => format(h.sp500_shares * h.sp500_price + h.global_shares * h.global_price + h.bond_shares * h.bond_price ),
            subRows: [
                {
                    label: 'S&P shares',
                    getValue: (h) => `${h.sp500_shares} shares`,
                    isItalic: true
                },
                {
                    label: 'S&P price',
                    getValue: (h) => format(h.sp500_price),
                    isItalic: true
                },
                {
                    label: 'Global (ex-US) shares',
                    getValue: (h) => `${h.global_shares} shares`,
                    isItalic: true
                },
                {
                    label: 'Global (ex-US) price',
                    getValue: (h) => format(h.global_price),
                    isItalic: true
                },
                {
                    label: 'Treasury bond shares',
                    getValue: (h) => `${h.bond_shares} shares`,
                    isItalic: true
                },
                {
                    label: 'Treasury bond price',
                    getValue: (h) => format(h.bond_price),
                    isItalic: true
                }
            ]
        },
        {
            id: 'other',
            label: 'Other assets',
            bgColor: 'bg-blue-50',
            hoverColor: 'hover:bg-blue-100',
            textColor: 'text-blue-900',
            getValue: (h) => format(h.receivables || 0),
            subRows: [
                {
                    label: 'Receivables',
                    getValue: (h) => format(h.receivables || 0)
                }
            ]
        },
        {
            id: 'liabilities',
            label: 'Liabilities',
            bgColor: 'bg-red-50',
            hoverColor: 'hover:bg-red-100',
            textColor: 'text-red-700',
            getValue: (h) => `-${format(h.credit_card || 0)}`,
            subRows: [
                {
                    label: 'Credit card debt',
                    getValue: (h) => `-${format(h.credit_card || 0)}`,
                    textColor: 'text-red-600'
                }
            ]
        }
    ], [format]); // Memoize based on format function

    // ============================================
    // CHART CONFIGURATION (inline)
    // ============================================
    
    const CATEGORIES = [
        { id: 'cashCurrent', label: 'Cash Current', color: '#1E3A8A' },
        { id: 'cashSavings', label: 'Cash Savings', color: '#60A5FA' },
        { id: 'gold', label: 'Gold', color: '#F59E0B' },
        { id: 'investmentsUS', label: 'S&P 500', color: '#755ef9' },
        { id: 'investmentsGlobal', label: 'Global (ex-US)', color: '#9481ff81' },
        { id: 'investmentsBond', label: 'Treasury Bond', color: '#b6adeb81' },
        { id: 'other', label: 'Other', color: '#94A3B8' },
        { id: 'liabilities', label: 'Liabilities', color: '#EF4444' }
    ];

    const [visibleCats, setVisibleCats] = useState(CATEGORIES.map(c => c.id));
    const [hoveredCat, setHoveredCat] = useState(null);
    const [viewingComment, setViewingComment] = useState(null);
    const [monthsToShow, setMonthsToShow] = useState(12);

    const UniversalChartLabel = (props) => {
        const { x, y, value, payload, index, data } = props;

        // 1. Try to find the value from all possible Recharts sources
        // Trends usually use 'value', Stacked labels usually use 'payload'
        const rawValue = value || payload?.netWorth || payload?.dynamicNetWorth || (data && data[index]?.dynamicNetWorth);

        if (rawValue === undefined || rawValue === null) return null;

        // 2. Format to (Currency) XXk
        const labelText = `${currency} ${(rawValue / 1000).toFixed(0)}k`;
        
        const badgeWidth = labelText.length * 8 + 10;

        return (
            <g>
                <rect
                    x={x - badgeWidth / 2}
                    y={y - 35}
                    width={badgeWidth}
                    height={22}
                    rx={11}
                    fill="#ffffff"
                    fillOpacity={0.9}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                />
                <path 
                    d={`M ${x - 4} ${y - 13} L ${x} ${y - 9} L ${x + 4} ${y - 13} Z`}
                    fill="#ffffff"
                    stroke="#e5e7eb"
                    strokeWidth={1}
                />
                <text
                    x={x}
                    y={y - 20}
                    fill="#374151"
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                >
                    {labelText}
                </text>
            </g>
        );
    };


    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        
        const data = payload[0].payload;
        
        return (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[200px]">
                {/* Date Header */}
                <div className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                    {label}
                </div>
                
                {/* Categories */}
                <div className="space-y-2 mb-3">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs text-gray-600">{entry.name}</span>
                            </div>
                            <span className="text-sm font-semibold">
                                {currency} {(entry.value / 1000).toFixed(0)}k
                            </span>
                        </div>
                    ))}
                </div>
                
                {/* Growth Indicator */}
                {data.growth !== 0 && (
                    <div className={`mt-3 pt-3 border-t flex items-center justify-between ${
                        data.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                        <span className="text-xs font-medium">
                            {data.growth >= 0 ? '↑' : '↓'} Month Growth
                        </span>
                        <span className="font-bold text-sm">
                            {data.growthFormatted}
                        </span>
                    </div>
                )}
                
                {/* Comment Indicator */}
                {data.comment && (
                    <div className="mt-2 pt-2 border-t">
                        <div className="flex items-start gap-2">
                            <span className="text-purple-500">💬</span>
                            <p className="text-xs text-gray-600 italic">{data.comment}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ============================================
    // HANDLERS
    // ============================================
    const handleEditClick = (snapshot) => {
        setEditingSnapshot(snapshot);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        const preload = latest ? { ...latest, date: new Date().toISOString().split('T')[0] } : null;
        setEditingSnapshot(preload);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setEditingSnapshot(null);
        setIsModalOpen(false);
    };

    const handleDeleteClick = async (date) => {
        if (window.confirm(`Are you sure you want to delete the snapshot for ${date}?`)) {
            const result = await window.electronAPI.deleteSnapshot(date);
            if (result.status === 'success') {
                refreshData();
            } else {
                alert("Error deleting snapshot");
            }
        }
    };

    // Automatically sorted whenever rawHistory changes
    const history = useMemo(() => {
        return [...rawHistory].sort((a, b) => 
            new Date(b.date) - new Date(a.date) // Newest first
        );
    }, [rawHistory]);

    const refreshData = async () => {
        try {
            const result = await window.electronAPI.getSnapshots();

            if (Array.isArray(result)) {
                // Electron returns the snapshots array directly
                setRawHistory(result);
            } else if (result?.status === 'success') {
                setRawHistory(result.data);
            } 
        } catch (err) {
            console.error('Error in refreshData:', err);
        }
    };
 

    const getLastEntryPerMonth = (data, months = 12) => {
        // Group snapshots by year-month
        const grouped = data.reduce((acc, snapshot) => {
            const date = new Date(snapshot.date);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[yearMonth]) {
                acc[yearMonth] = [];
            }
            acc[yearMonth].push(snapshot);
            return acc;
    }, {});
    
    // Get the last entry for each month
    const monthlyData = Object.entries(grouped).map(([yearMonth, snapshots]) => {
        // Sort snapshots within the month and take the last one
        const sortedSnapshots = snapshots.sort((a, b) => new Date(b.date) - new Date(a.date));
        return sortedSnapshots[0];
    });
    
    // Sort by date descending and take last N months
    return monthlyData
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, months);
    };


    useEffect(() => {
        refreshData();
    }, []);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const toggleAllSections = () => {
        const allExpanded = Object.values(expandedSections).every(v => v);
        const newState = Object.keys(expandedSections).reduce((acc, key) => {
            acc[key] = !allExpanded;
            return acc;
        }, {});
        setExpandedSections(newState);
    };

    const handleStackClick = (data) => {
        const clickedId = data?.tooltipPayload?.[0]?.dataKey;
        if (clickedId) {
            setVisibleCats(prev => 
                prev.length === 1 && prev[0] === clickedId 
                    ? CATEGORIES.map(c => c.id)
                    : [clickedId]
            );
        }
    };

    // ============================================
    // COMPUTED DATA
    // ============================================
    const latest = history[0] || {};
    // Find the latest snapshot from the previous month
    const previous = useMemo(() => {
        if (!latest.date) return {};
        
        const latestDate = new Date(latest.date);
        const latestYear = latestDate.getFullYear();
        const latestMonth = latestDate.getMonth();
        
        // Find all snapshots from the previous month
        const previousMonthSnapshots = history.filter(snapshot => {
            const snapshotDate = new Date(snapshot.date);
            const snapshotYear = snapshotDate.getFullYear();
            const snapshotMonth = snapshotDate.getMonth();
            
            // Check if it's from previous month
            if (latestMonth === 0) {
                // If current is January, previous month is December of last year
                return snapshotYear === latestYear - 1 && snapshotMonth === 11;
            } else {
                // Normal case: same year, previous month
                return snapshotYear === latestYear && snapshotMonth === latestMonth - 1;
            }
        });
        
        // Return the latest snapshot from previous month (first one after sorting)
        return previousMonthSnapshots[0] || {};
    }, [history, latest.date]);

    const chartData = useMemo(() => {
        const monthlySnapshots = getLastEntryPerMonth(history, 12);
        
        return monthlySnapshots.map(snapshot => {
            const cashCurrent = convert((snapshot.cash_current || 0) + (snapshot.cash_current_2 || 0) + (snapshot.cash_current_3 || 0) + (snapshot.cash_ibkr || 0) + (snapshot.cash_hand || 0));
            const cashSavings = convert(snapshot.cash_savings || 0);
            const gold = convert((snapshot.gold_weight || 0) * (snapshot.gold_price || 0));
            const investmentsUS = convert((snapshot.sp500_shares || 0) * (snapshot.sp500_price || 0));
            const investmentsGlobal = convert((snapshot.global_shares || 0) * (snapshot.global_price || 0));
            const investmentsBond = convert((snapshot.bond_shares || 0) * (snapshot.bond_price || 0));
            const other = convert(snapshot.receivables || 0);
            const liabilities = -convert(Math.abs(snapshot.credit_card || 0));
            const netWorth = convert(snapshot.net_worth || 0);
            
            // Calculate total assets (excluding liabilities)
            const totalAssets = cashCurrent + cashSavings + gold + investmentsUS + investmentsGlobal + investmentsBond + other;
            
            // Format date to show as "Jan 2024" or "Jan '24"
            const date = new Date(snapshot.date);
            const formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            
            return {
                date: formattedDate,
                originalDate: snapshot.date,
                cashCurrent,
                cashSavings,
                gold,
                investmentsUS,
                investmentsGlobal,
                investmentsBond,
                other,
                liabilities,
                netWorth,
                // Allocation percentages
                cashCurrentPct: totalAssets ? ((cashCurrent / totalAssets) * 100).toFixed(1) : 0,
                cashSavingsPct: totalAssets ? ((cashSavings / totalAssets) * 100).toFixed(1) : 0,
                goldPct: totalAssets ? ((gold / totalAssets) * 100).toFixed(1) : 0,
                investmentsUSPct: totalAssets ? ((investmentsUS / totalAssets) * 100).toFixed(1) : 0,
                investmentsGlobalPct: totalAssets ? ((investmentsGlobal / totalAssets) * 100).toFixed(1) : 0,
                investmentsBondPct: totalAssets ? ((investmentsBond / totalAssets) * 100).toFixed(1) : 0,
                otherPct: totalAssets ? ((other / totalAssets) * 100).toFixed(1) : 0,
                totalAssets,
            };
        });
    }, [history, convert]);

    const chartDataWithDynamicNetWorth = useMemo(() => {
        return chartData.map(item => {
            // Sum only the visible categories
            const visibleTotal = visibleCats.reduce((sum, catId) => {
                return sum + (item[catId] || 0);
            }, 0);
            
            return {
                ...item,
                dynamicNetWorth: visibleTotal
            };
        });
    }, [chartData, visibleCats]);

    const chartDataWithDynamicAllocation = useMemo(() => {
        return chartData.map(item => {
            // Only asset categories (exclude liabilities)
            const activeCats = visibleCats.filter(c => c !== 'liabilities');

            const visibleTotal = activeCats.reduce((sum, catId) => {
                return sum + (item[catId] || 0);
            }, 0);

            const dynamicPcts = {};

            activeCats.forEach(catId => {
                dynamicPcts[`${catId}PctDynamic`] = visibleTotal
                    ? Math.round(((item[catId] / visibleTotal) * 100) * 10) / 10
                    : 0;
            });

            return {
                ...item,
                ...dynamicPcts
            };
        });
    }, [chartData, visibleCats]);


    const chartDataWithGrowth = useMemo(() => {
        return chartDataWithDynamicNetWorth.map((item, idx, arr) => {
            const previous = arr[idx + 1]; // Remember: array is reversed
            const growth = previous ? item.dynamicNetWorth - previous.dynamicNetWorth : 0;
            const growthPct = previous 
                ? ((growth / previous.dynamicNetWorth) * 100).toFixed(1) 
                : 0;
            
            return {
                ...item,
                growth,
                growthPct,
                growthFormatted: growth >= 0 ? `+${currency} ${growth.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}` : growth.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}),
                growthPctFormatted: growth >= 0 ? `+${growthPct}%` : `${growthPct}%`
            };
        });
    }, [chartDataWithDynamicNetWorth, format]);

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="px-4 py-2">
            <PageHeader title="Wealth" /> 

            {/* Top Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <Card 
                    title="Net Worth" 
                    value={format(latest.net_worth || 0)}
                    subtitle={latest.date || 'No data yet'}
                />
                <Card 
                    title="This Month" 
                    value={`${latest.net_worth > previous.net_worth ? '+' : ''}${format((latest.net_worth || 0) - (previous.net_worth || 0))}`}
                    subtitle={previous.net_worth ? `${(((latest.net_worth - previous.net_worth) / previous.net_worth) * 100).toFixed(1)}% change` : 'No previous data'}
                />
            </div>

            {/* Main Content */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-center mb-4">
                    {/* View Tabs */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setView('chart')}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                view === 'chart' 
                                    ? 'bg-gray-900 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Chart
                        </button>
                        <button 
                            onClick={() => setView('table')}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                view === 'table' 
                                    ? 'bg-gray-900 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Table
                        </button>
                        <button 
                            onClick={() => setView('cards')}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                view === 'cards' 
                                    ? 'bg-gray-900 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Cards
                        </button>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 items-center">
                        {view === 'table' && (
                            <button 
                                onClick={toggleAllSections}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                {Object.values(expandedSections).every(v => v) ? 'Collapse All' : 'Expand All'}
                            </button>
                        )}
                        <button 
                            onClick={handleAddNew} 
                            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium py-1.5 px-4 rounded-md shadow-sm transition-all"
                        >
                            + Add snapshot
                        </button>
                        <AddSnapshotModal 
                            isOpen={isModalOpen}
                            setIsOpen={setIsModalOpen}
                            onSaveSuccess={refreshData} 
                            initialData={editingSnapshot}
                            onClose={handleModalClose}
                        />
                        <CommentModal
                            isOpen={viewingComment !== null}
                            onClose={() => setViewingComment(null)}
                            comment={viewingComment?.comment}
                            date={viewingComment?.date}
                        />
                    </div>
                </div>
                
                {/* CHART VIEW */}
                {view === 'chart' && (
                    <div className="flex flex-col gap-4">
                        {/* Chart Type Selector */}
                        <div className="flex gap-2 border-b pb-3">
                            <button
                                onClick={() => setChartType('stacked')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    chartType === 'stacked'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Stacked View
                            </button>
                            <button
                                onClick={() => setChartType('allocation')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    chartType === 'allocation'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Allocation %
                            </button>
                            <button
                                onClick={() => setChartType('networth')}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                    chartType === 'networth'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Net Worth Trend
                            </button>
                        </div>

                        {/* Category Toggles */}
                        {chartType !== 'networth' && (
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setVisibleCats(prev => 
                                                prev.includes(cat.id) 
                                                    ? prev.filter(c => c !== cat.id) 
                                                    : [...prev, cat.id]
                                            )
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                            visibleCats.includes(cat.id)
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-white text-gray-400 border-gray-200'
                                        }`}
                                    >
                                        <span 
                                            className="inline-block w-2 h-2 rounded-full mr-2" 
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* STACKED VIEW */}
                        {chartType === 'stacked' && (
                            <div className="w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                {/* Header with filters */}
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setMonthsToShow(6)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                monthsToShow === 6
                                                    ? 'bg-gray-900 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            6M
                                        </button>
                                        <button 
                                            onClick={() => setMonthsToShow(12)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                monthsToShow === 12
                                                    ? 'bg-gray-900 text-white shadow-sm'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            12M
                                        </button>
                                    </div>

                                {/* Chart */}
                                <ResponsiveContainer width="100%" height={400}>
                                    <ComposedChart
                                        data={[...chartDataWithGrowth].reverse().slice(0, monthsToShow)}
                                        margin={{ top: 30, right: 10, left: 10, bottom: 30 }}
                                        barGap={0}
                                    >

                                        <CartesianGrid 
                                            vertical={false} 
                                            strokeDasharray="3 3" 
                                            stroke="#E5E7EB"
                                            strokeOpacity={0.5}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `${currency} ${(val / 1000).toFixed(0)}k`}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            width={80}
                                        />
                                        <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
                                        <Tooltip content={<CustomTooltip />} />

                                        {CATEGORIES.map(cat => {
                                            const stackId = cat.id === 'liabilities' ? 'b' : 'a';
                                            return (
                                                <Bar
                                                    key={cat.id}
                                                    dataKey={cat.id}
                                                    name={cat.label}
                                                    stackId={stackId}
                                                    fill={cat.color}
                                                    hide={!visibleCats.includes(cat.id)}
                                                />
                                            );
                                        })}

                                        <Line
                                            type="monotone"
                                            dataKey="dynamicNetWorth"
                                            label={<UniversalChartLabel data={[...chartDataWithGrowth].reverse().slice(0, monthsToShow)} />}
                                            name="Total"
                                            stroke="#000000"
                                            strokeWidth={3}
                                            dot={{ r: 5, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 7 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>

                                {/* Summary Statistics */}
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {(() => {
                                        const latest = chartData[0]?.netWorth || 0;
                                        const oldest = chartData[chartData.length - 1]?.netWorth || 0;
                                        const growth = latest - oldest;
                                        const growthPct = oldest ? ((growth / oldest) * 100).toFixed(1) : 0;
                                        const avgMonthly = chartData.length > 1 ? growth / (chartData.length - 1) : 0;

                                        return (
                                            <>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                    <p className="text-xs text-gray-600 mb-1">Total Growth</p>
                                                    <p className={`text-xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {growth >= 0 ? '+' : ''}{currency} {growth.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{growthPct}% over {chartData.length} months</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                    <p className="text-xs text-gray-600 mb-1">Avg Monthly</p>
                                                    <p className={`text-xl font-bold ${avgMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {avgMonthly >= 0 ? '+' : ''}{currency} {avgMonthly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                                    </p>
                                                    <p className="text-xs text-gray-400">per month</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                    <p className="text-xs text-gray-600 mb-1">Latest</p>
                                                    <p className="text-xl font-bold text-gray-900">{currency} {latest.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                                                    <p className="text-xs text-gray-400">{chartData[0]?.date}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}



                        {/* ALLOCATION % VIEW */}
                        {chartType === 'allocation' && (
                            <div className="w-full border border-gray-100 rounded-lg p-4 bg-gray-50/30">
                                <ResponsiveContainer width="100%" height={500}>
                                    <ComposedChart
                                        data={[...chartDataWithDynamicAllocation].reverse()}
                                        margin={{ top: 10, right: 10, left: 20, bottom: 30 }}
                                    >
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `${Math.round(val)}%`}
                                            domain={[0, 100]}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(val) => `${val.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}%`} 
                                        />

                                        {CATEGORIES.filter(cat => cat.id !== 'liabilities').map(cat => (
                                            <Bar
                                                key={cat.id}
                                                dataKey={`${cat.id}PctDynamic`}
                                                name={cat.label}
                                                stackId="allocation"
                                                fill={cat.color}
                                                hide={!visibleCats.includes(cat.id)}
                                            />
                                        ))}
                                    </ComposedChart>
                                </ResponsiveContainer>

                                {/* Latest Allocation Summary */}
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {CATEGORIES.filter(cat => cat.id !== 'liabilities').map(cat => {
                                        const latestData = chartDataWithDynamicAllocation[0];
                                        const pct = latestData?.[`${cat.id}PctDynamic`] || 0;
                                        return (
                                            <div key={cat.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: cat.color }}
                                                    />
                                                    <span className="text-xs text-gray-600">{cat.label}</span>
                                                </div>
                                                <p className="text-xl font-bold">{pct}%</p>
                                                <p className="text-xs text-gray-400">
                                                    {currency} {latestData?.[cat.id]?.toLocaleString() || 0}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* NET WORTH TREND VIEW */}
                        {chartType === 'networth' && (
                            <div className="w-full border border-gray-100 rounded-lg p-4 bg-gray-50/30">
                                <ResponsiveContainer width="100%" height={500}>
                                    <ComposedChart
                                        data={[...chartData].reverse()}
                                        margin={{ top: 10, right: 40, left: 20, bottom: 30 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            tickFormatter={(val) => `${currency} ${(val / 1000).toFixed(0)}k`}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                            width={70}
                                        />
                                        <Tooltip
                                            cursor={{ strokeDasharray: '3 3' }}
                                            contentStyle={{
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            formatter={(val) => [`${currency} ${(val / 1000).toFixed(0)}k`, 'Net Worth']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="netWorth"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fill="url(#colorNetWorth)"
                                            tooltipType="none"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="netWorth"
                                            stroke="#1e40af"
                                            strokeWidth={3}
                                            dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                            label={<UniversalChartLabel />}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>

                                {/* Growth Statistics */}
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {(() => {
                                        const latest = chartData[0]?.netWorth || 0;
                                        const oldest = chartData[chartData.length - 1]?.netWorth || 0;
                                        const growth = latest - oldest;
                                        const growthPct = oldest ? ((growth / oldest) * 100).toFixed(1) : 0;
                                        const avgMonthly = chartData.length > 1 ? growth / (chartData.length - 1) : 0;

                                        return (
                                            <>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                    <p className="text-xs text-gray-600 mb-1">Total Growth</p>
                                                    <p className={`text-xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {growth >= 0 ? '+' : ''}{currency} {growth.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{growthPct}% over {chartData.length} months</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                    <p className="text-xs text-gray-600 mb-1">Avg Monthly</p>
                                                    <p className={`text-xl font-bold ${avgMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {avgMonthly >= 0 ? '+' : ''}{currency} {avgMonthly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                                    </p>
                                                    <p className="text-xs text-gray-400">per month</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                                    <p className="text-xs text-gray-600 mb-1">Latest</p>
                                                    <p className="text-xl font-bold text-gray-900">{currency} {latest.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                                                    <p className="text-xs text-gray-400">{chartData[0]?.date}</p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Data Info */}
                        <p className="text-xs text-gray-400 text-center">
                            Showing last entry per month for the past {chartData.length} months
                        </p>
                    </div>
                )}

                {/* TABLE VIEW - Now using generic DataTable component */}
                {view === 'table' && (
                    <div className="overflow-x-auto">
                        <DataTable
                            data={history}
                            sections={wealthSections}
                            expandedSections={expandedSections}
                            onToggleSection={toggleSection}
                            onEdit={handleEditClick}
                            onDelete={(item) => handleDeleteClick(item.date)}
                            onViewComment={(item) => {
                                // Only open if there is actually a comment to show
                                if (item.comment) {
                                    setViewingComment({
                                        date: item.date,
                                        comment: item.comment
                                    });
                                }
                            }}
                            footerRow={{
                                label: 'Net Worth',
                                getValue: (h) => format(h.net_worth),
                                className: 'bg-blue-900 text-white font-bold text-sm'
                            }}
                        />
                    </div>
                )}

                {/* CARDS VIEW - Keep as is */}
                {view === 'cards' && (
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No snapshots yet. Add your first one!</p>
                        ) : (
                            history.map((snapshot, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-4 pb-3 border-b">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-semibold text-gray-700">{snapshot.date}</h4>
                                            {snapshot.comment && (
                                                <button
                                                    onClick={() => setViewingComment({ date: snapshot.date, comment: snapshot.comment })}
                                                    className= "text-gray-500 hover:text-gray-800 rounded transition-colors"
                                                    title="View comment"
                                                >
                                                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>    
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">{format(snapshot.net_worth)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-xs text-blue-900 font-medium mb-1">Cash Current</p>
                                            <p className="font-semibold">{format((snapshot.cash_current || 0) + (snapshot.cash_current_2 || 0) + (snapshot.cash_current_3 || 0) + (snapshot.cash_ibkr || 0) + (snapshot.cash_hand || 0))}</p>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-xs text-blue-900 font-medium mb-1">Cash Savings</p>
                                            <p className="font-semibold">{format(snapshot.cash_savings || 0)}</p>
                                            <p className="text-xs text-gray-400">{snapshot.savings_rate || 0}% APY</p>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-xs text-blue-900 font-medium mb-1">Gold</p>
                                            <p className="font-semibold">{format(snapshot.gold_weight * snapshot.gold_price)}</p>
                                            <p className="text-xs text-gray-400">{snapshot.gold_weight}g @ {format(snapshot.gold_price)}</p>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-xs text-blue-900 font-medium mb-1">Investments</p>
                                            <p className="font-semibold">{format(snapshot.sp500_shares * snapshot.sp500_price + snapshot.global_shares * snapshot.global_price + snapshot.bond_shares * snapshot.bond_price)}</p>
                                            <p className="text-xs text-gray-400">{snapshot.sp500_shares} @ {format(snapshot.sp500_price)}</p>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-xs text-blue-900 font-medium mb-1">Other assets</p>
                                            <p className="font-semibold">{format(snapshot.receivables || 0)}</p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded">
                                            <p className="text-xs text-red-600 font-medium mb-1">Liabilities</p>
                                            <p className="font-semibold text-red-600">-{format(snapshot.credit_card || 0)}</p>
                                        </div>
                                    </div>

                                    {idx < history.length - 1 && (
                                        <div className="pt-2 mt-3 border-t text-xs text-gray-500">
                                            Change from previous: 
                                            <span className={snapshot.net_worth > history[idx + 1].net_worth ? 'text-green-600 font-medium ml-1' : 'text-red-600 font-medium ml-1'}>
                                                {snapshot.net_worth > history[idx + 1].net_worth ? '↑' : '↓'} 
                                                {format(Math.abs(snapshot.net_worth - (history[idx + 1]?.net_worth || 0)))}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
               
            </div>
        </div>
    );
}

export default Wealth;