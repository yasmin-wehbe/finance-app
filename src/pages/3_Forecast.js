// ============================================
// src/pages/Forecast.js
// ============================================
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useCurrency } from '../contexts/CurrencyContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, Label } from 'recharts';

// Number input component with formatting
const NumberInput = ({ value, onChange, label, placeholder = "0" }) => {
    const [displayValue, setDisplayValue] = useState('');
    
    useEffect(() => {
        if (value === 0 || value === '') {
            setDisplayValue('');
        } else {
            setDisplayValue(value.toLocaleString());
        }
    }, [value]);
    
    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue === '' || !isNaN(rawValue)) {
            onChange(rawValue === '' ? 0 : Number(rawValue));
        }
    };
    
    const handleFocus = () => {
        if (value === 0) {
            setDisplayValue('');
        }
    };
    
    const handleBlur = () => {
        if (displayValue === '') {
            onChange(0);
        }
    };
    
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
        </div>
    );
};

function Forecast() {
    const { format, currency, convert } = useCurrency();
    
    // Load saved settings immediately during initialization
    const savedSettings = JSON.parse(localStorage.getItem('forecastSettings') || "{}");
    
    // Custom Label Component for Net Worth values
    const NetWorthLabel = (props) => {
        const { x, y, value, payload, index } = props;

        // Get the net worth value
        const rawValue = value || payload?.netWorth || payload?.dynamicNetWorth;

        if (rawValue === undefined || rawValue === null) return null;

        // Format to (Currency) XXk
        const labelText = `${currency} ${Math.round(rawValue / 1000).toLocaleString()}k`;
        
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
    
    // Income inputs - initialize with saved values
    const [baseSalary, setBaseSalary] = useState(savedSettings.baseSalary ?? 0);
    const [salaryIncreasePercent, setSalaryIncreasePercent] = useState(savedSettings.salaryIncreasePercent ?? 0);
    const [annualBonus, setAnnualBonus] = useState(savedSettings.annualBonus ?? 0);
    const [bonusMonth, setBonusMonth] = useState(savedSettings.bonusMonth ?? 12);
    const [otherIncome, setOtherIncome] = useState(savedSettings.otherIncome ?? 0);
    
    // Expense inputs - initialize with saved values
    const [housing, setHousing] = useState(savedSettings.housing ?? 0);
    const [livingExpenses, setLivingExpenses] = useState(savedSettings.livingExpenses ?? 0);
    const [parentsAllowance, setParentsAllowance] = useState(savedSettings.parentsAllowance ?? 0);
    const [utilities, setUtilities] = useState(savedSettings.utilities ?? 0);
    const [car, setCar] = useState(savedSettings.car ?? 0);
    const [buffer, setBuffer] = useState(savedSettings.buffer ?? 0);
    
    // Assumptions - initialize with saved values
    const [inflationPercent, setInflationPercent] = useState(savedSettings.inflationPercent ?? 0);
    const [salaryIncreaseMonth, setSalaryIncreaseMonth] = useState(savedSettings.salaryIncreaseMonth ?? 1);
    
    // One-off adjustments
    const [oneOffAdjustments, setOneOffAdjustments] = useState(savedSettings.oneOffAdjustments ?? []);
    const [showOneOffModal, setShowOneOffModal] = useState(false);
    
    // Data
    const [latestNetWorth, setLatestNetWorth] = useState(0);
    const [actualSnapshots, setActualSnapshots] = useState([]);
    
    // Save settings whenever they change
    useEffect(() => {
        const settings = {
            baseSalary,
            salaryIncreasePercent,
            annualBonus,
            bonusMonth,
            otherIncome,
            housing,
            livingExpenses,
            parentsAllowance,
            utilities,
            car,
            buffer,
            inflationPercent,
            salaryIncreaseMonth,
            oneOffAdjustments
        };
        localStorage.setItem('forecastSettings', JSON.stringify(settings));
    }, [baseSalary, salaryIncreasePercent, annualBonus, bonusMonth, otherIncome, housing, livingExpenses, parentsAllowance, utilities, car, buffer, inflationPercent, salaryIncreaseMonth, oneOffAdjustments]);
    
    // Fetch snapshots
    useEffect(() => {
        const fetchSnapshots = async () => {
            const result = await window.electronAPI.getSnapshots();
            if (result.status === 'success' && result.data.length > 0) {
                const sorted = result.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Get latest January 2026 snapshot
                const jan2026Snapshots = sorted.filter(s => {
                    const date = new Date(s.date);
                    return date.getFullYear() === 2026 && date.getMonth() === 0;
                });
                
                if (jan2026Snapshots.length > 0) {
                    setLatestNetWorth(jan2026Snapshots[0].net_worth || 0);
                } else {
                    // Fallback to overall latest snapshot
                    setLatestNetWorth(sorted[0].net_worth || 0);
                }
                
                // Get all 2026 snapshots for actual line
                const snapshots2026 = sorted.filter(s => {
                    const date = new Date(s.date);
                    return date.getFullYear() === 2026;
                });
                setActualSnapshots(snapshots2026);
            }
        };
        
        fetchSnapshots();
    }, []);
    
    // Reset function
    const handleReset = () => {
        setBaseSalary(0);
        setSalaryIncreasePercent(0);
        setAnnualBonus(0);
        setBonusMonth(12);
        setOtherIncome(0);
        setHousing(0);
        setLivingExpenses(0);
        setParentsAllowance(0);
        setUtilities(0);
        setCar(0);
        setBuffer(0);
        setInflationPercent(0);
        setSalaryIncreaseMonth(1);
        setOneOffAdjustments([]);
    };
    
    // One-off adjustment handlers
    const handleAddOneOff = (adjustment) => {
        setOneOffAdjustments([...oneOffAdjustments, { ...adjustment, id: Date.now() }]);
        setShowOneOffModal(false);
    };
    
    const handleDeleteOneOff = (id) => {
        setOneOffAdjustments(oneOffAdjustments.filter(adj => adj.id !== id));
    };
    
    // Modal amount input state
    const [oneOffAmount, setOneOffAmount] = useState('');
    
    const handleOneOffAmountChange = (e) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw === '' || !isNaN(raw)) {
            setOneOffAmount(raw);
        }
    };
    
    const formatOneOffAmount = () => {
        if (oneOffAmount === '' || oneOffAmount === '0') return '';
        return Number(oneOffAmount).toLocaleString();
    };
    
    // Calculate 12-month forecast
    const monthlyForecast = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let cumulativeNetWorth = convert(latestNetWorth);
        
        return months.map((month, index) => {
            const monthNum = index + 1;
            
            // For January, use the snapshot value directly (don't add savings)
            if (index === 0) {
                // Check if there's an actual snapshot for January
                const janSnapshot = actualSnapshots.find(s => {
                    const date = new Date(s.date);
                    return date.getMonth() === 0;
                });
                
                return {
                    month,
                    monthNum,
                    salary: convert(baseSalary),
                    bonus: 0,
                    other: convert(otherIncome),
                    totalIncome: convert(baseSalary + otherIncome),
                    housing: convert(housing),
                    livingExpenses: convert(livingExpenses),
                    parentsAllowance: convert(parentsAllowance),
                    utilities: convert(utilities),
                    car: convert(car),
                    buffer: convert(buffer),
                    totalExpenses: convert(housing + livingExpenses + parentsAllowance + utilities + car + buffer),
                    savings: 0,
                    netWorth: cumulativeNetWorth,
                    actualNetWorth: janSnapshot ? convert(janSnapshot.net_worth) : null
                };
            }
            
            // Income (converted to selected currency)
            const salary = convert(baseSalary);
            const bonus = monthNum === bonusMonth ? convert(annualBonus) : 0;
            const other = convert(otherIncome);
            let totalIncome = salary + bonus + other;
            
            // Expenses (converted to selected currency)
            const housingConverted = convert(housing);
            const livingConverted = convert(livingExpenses);
            const parentsConverted = convert(parentsAllowance);
            const utilitiesConverted = convert(utilities);
            const carConverted = convert(car);
            const bufferConverted = convert(buffer);
            let totalExpenses = housingConverted + livingConverted + parentsConverted + utilitiesConverted + carConverted + bufferConverted;
            
            // Apply one-off adjustments for this month
            const adjustmentsForMonth = oneOffAdjustments.filter(adj => 
                adj.year === 2026 && adj.month === monthNum
            );
            
            adjustmentsForMonth.forEach(adj => {
                const adjAmount = convert(adj.amount);
                if (adj.type === 'income') {
                    totalIncome += adjAmount;
                } else {
                    totalExpenses += adjAmount;
                }
            });
            
            // Net savings this month
            const monthlySavings = totalIncome - totalExpenses;
            
            // Cumulative net worth
            cumulativeNetWorth += monthlySavings;
            
            // Check if there's an actual snapshot for this month
            const actualSnapshot = actualSnapshots.find(s => {
                const date = new Date(s.date);
                return date.getMonth() === index;
            });
            
            return {
                month,
                monthNum,
                salary,
                bonus,
                other,
                totalIncome,
                housing: housingConverted,
                livingExpenses: livingConverted,
                parentsAllowance: parentsConverted,
                utilities: utilitiesConverted,
                car: carConverted,
                buffer: bufferConverted,
                totalExpenses,
                savings: monthlySavings,
                netWorth: cumulativeNetWorth,
                actualNetWorth: actualSnapshot ? convert(actualSnapshot.net_worth) : null
            };
        });
    }, [latestNetWorth, baseSalary, annualBonus, bonusMonth, otherIncome, housing, livingExpenses, parentsAllowance, utilities, car, buffer, actualSnapshots, convert, oneOffAdjustments]);
    
    // Calculate 5-year forecast
    const fiveYearForecast = useMemo(() => {
        const years = [2026, 2027, 2028, 2029, 2030];
        let currentSalary = baseSalary;
        let currentExpenses = housing + livingExpenses + parentsAllowance + utilities + car + buffer;
        let cumulativeNetWorth = convert(latestNetWorth);
        
        return years.map((year, index) => {
            // Apply salary increase (from specified month onwards in first year, then full year after)
            if (index > 0) {
                currentSalary = currentSalary * (1 + salaryIncreasePercent / 100);
                currentExpenses = currentExpenses * (1 + inflationPercent / 100);
            }
            
            // Annual income (converted)
            const annualSalary = convert(currentSalary * 12);
            const annualBonusConverted = convert(annualBonus);
            const annualOther = convert(otherIncome * 12);
            let totalAnnualIncome = annualSalary + annualBonusConverted + annualOther;
            
            // Annual expenses (converted)
            let totalAnnualExpenses = convert(currentExpenses * 12);
            
            // Apply one-off adjustments for this year
            const adjustmentsForYear = oneOffAdjustments.filter(adj => adj.year === year);
            adjustmentsForYear.forEach(adj => {
                const adjAmount = convert(adj.amount);
                if (adj.type === 'income') {
                    totalAnnualIncome += adjAmount;
                } else {
                    totalAnnualExpenses += adjAmount;
                }
            });
            
            // Annual savings
            const annualSavings = totalAnnualIncome - totalAnnualExpenses;
            
            // For 2026, calculate based on remaining months if salary increase is mid-year
            let adjustedSavings = annualSavings;
            if (index === 0 && salaryIncreaseMonth > 1) {
                const monthsBeforeIncrease = salaryIncreaseMonth - 1;
                const monthsAfterIncrease = 12 - monthsBeforeIncrease;
                const increasedSalary = baseSalary * (1 + salaryIncreasePercent / 100);
                
                // Recalculate for 2026 with salary increase timing
                const baseIncome = convert((baseSalary * monthsBeforeIncrease + increasedSalary * monthsAfterIncrease + annualBonus + otherIncome * 12));
                const baseExpenses = convert(currentExpenses * 12);
                
                // Apply one-offs again for adjusted calculation
                let adjustedIncome = baseIncome;
                let adjustedExpenses = baseExpenses;
                adjustmentsForYear.forEach(adj => {
                    const adjAmount = convert(adj.amount);
                    if (adj.type === 'income') {
                        adjustedIncome += adjAmount;
                    } else {
                        adjustedExpenses += adjAmount;
                    }
                });
                
                adjustedSavings = adjustedIncome - adjustedExpenses;
            }
            
            cumulativeNetWorth += adjustedSavings;
            
            return {
                year,
                salary: annualSalary,
                bonus: annualBonusConverted,
                other: annualOther,
                totalIncome: totalAnnualIncome,
                housing: convert(housing * 12),
                livingExpenses: convert(livingExpenses * 12),
                parentsAllowance: convert(parentsAllowance * 12),
                utilities: convert(utilities * 12),
                car: convert(car * 12),
                buffer: convert(buffer * 12),
                totalExpenses: totalAnnualExpenses,
                savings: index === 0 ? adjustedSavings : annualSavings,
                netWorth: cumulativeNetWorth
            };
        });
    }, [latestNetWorth, baseSalary, salaryIncreasePercent, annualBonus, bonusMonth, otherIncome, housing, livingExpenses, parentsAllowance, utilities, car, buffer, inflationPercent, salaryIncreaseMonth, convert, oneOffAdjustments]);
    
    // Summary calculations
    const totalExpected2026 = useMemo(() => {
        if (monthlyForecast.length === 0) return 0;
        return monthlyForecast[11]?.netWorth - convert(latestNetWorth);
    }, [monthlyForecast, latestNetWorth, convert]);
    
    const totalExpected5Year = useMemo(() => {
        if (fiveYearForecast.length === 0) return 0;
        return fiveYearForecast[4]?.netWorth - convert(latestNetWorth);
    }, [fiveYearForecast, latestNetWorth, convert]);
    
    const savingsRate2026 = useMemo(() => {
        if (monthlyForecast.length === 0 || monthlyForecast[0]?.totalIncome === 0) return 0;
        return ((monthlyForecast[0]?.totalIncome - monthlyForecast[0]?.totalExpenses) / monthlyForecast[0]?.totalIncome * 100);
    }, [monthlyForecast]);

    return (
        <div className="px-4 py-2">
            <PageHeader title="Wealth Forecast" />
            
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <Card 
                    title="2026 Expected Savings" 
                    value={`${currency} ${totalExpected2026.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`}
                    subtitle={`Savings Rate: ${savingsRate2026.toFixed(1)}%`}
                />
                <Card 
                    title="5-Year Projection" 
                    value={`${currency} ${totalExpected5Year.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`}
                    subtitle="Total growth (2026-2030)"
                />
                <Card 
                    title="Starting Net Worth" 
                    value={`${currency} ${convert(latestNetWorth).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`}
                    subtitle="Jan 2026 (latest snapshot)"
                />
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Income Inputs */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Income</h3>
                    
                    <div className="space-y-3">
                        <NumberInput
                            label="Base Salary (Monthly)"
                            value={baseSalary}
                            onChange={setBaseSalary}
                        />
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Annual Salary Increase (%)
                            </label>
                            <input
                                type="number"
                                value={salaryIncreasePercent === 0 ? '' : salaryIncreasePercent}
                                onChange={(e) => setSalaryIncreasePercent(e.target.value === '' ? 0 : Number(e.target.value))}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Increase Effective Month
                            </label>
                            <select
                                value={salaryIncreaseMonth}
                                onChange={(e) => setSalaryIncreaseMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        
                        <NumberInput
                            label="Annual Bonus"
                            value={annualBonus}
                            onChange={setAnnualBonus}
                        />
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bonus Month
                            </label>
                            <select
                                value={bonusMonth}
                                onChange={(e) => setBonusMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        
                        <NumberInput
                            label="Other Income (Monthly)"
                            value={otherIncome}
                            onChange={setOtherIncome}
                        />
                    </div>
                </div>
                
                {/* Expense Inputs */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Monthly Expenses</h3>
                    
                    <div className="space-y-3">
                        <NumberInput
                            label="Housing"
                            value={housing}
                            onChange={setHousing}
                        />
                        
                        <NumberInput
                            label="Living Expenses"
                            value={livingExpenses}
                            onChange={setLivingExpenses}
                        />
                        
                        <NumberInput
                            label="Allowance for Parents"
                            value={parentsAllowance}
                            onChange={setParentsAllowance}
                        />
                        
                        <NumberInput
                            label="Utilities"
                            value={utilities}
                            onChange={setUtilities}
                        />

                        <NumberInput
                            label="Car"
                            value={car}
                            onChange={setCar}
                        />
                        
                        <NumberInput
                            label="Extra Buffer"
                            value={buffer}
                            onChange={setBuffer}
                        />
                    </div>
                </div>
                
                {/* Assumptions */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Assumptions</h3>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Annual Inflation (%)
                            </label>
                            <input
                                type="number"
                                value={inflationPercent === 0 ? '' : inflationPercent}
                                onChange={(e) => setInflationPercent(e.target.value === '' ? 0 : Number(e.target.value))}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Applies to expenses year-over-year</p>
                        </div>
                        
                        <div className="pt-4 border-t">
                            <button
                                onClick={handleReset}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                                Reset All Inputs
                            </button>
                        </div>
                        
                        <div className="pt-2">
                            <button
                                onClick={() => setShowOneOffModal(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                                + Add One-Off Adjustment
                            </button>
                        </div>
                        
                        {/* One-off adjustments list */}
                        {oneOffAdjustments.length > 0 && (
                            <div className="pt-4 border-t">
                                <p className="text-xs font-semibold text-gray-700 mb-2">One-Off Adjustments:</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {oneOffAdjustments.map(adj => (
                                        <div key={adj.id} className="bg-gray-50 rounded p-2 flex justify-between items-center text-xs">
                                            <div>
                                                <span className={adj.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                    {adj.type === 'income' ? '+' : '-'}{currency} {adj.amount.toLocaleString()}
                                                </span>
                                                <span className="text-gray-500 ml-2">
                                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][adj.month - 1]} {adj.year}
                                                </span>
                                                {adj.description && (
                                                    <p className="text-gray-600 italic mt-1">{adj.description}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteOneOff(adj.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-4 border-t">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-700 font-medium mb-2">Monthly Summary</p>
                                <div className="space-y-1 text-xs text-blue-600">
                                    <div className="flex justify-between">
                                        <span>Income:</span>
                                        <span className="font-semibold">{format(baseSalary + otherIncome)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Expenses:</span>
                                        <span className="font-semibold">{format(housing + livingExpenses + parentsAllowance + utilities + car + buffer)}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-blue-200">
                                        <span>Net:</span>
                                        <span className="font-bold">{format((baseSalary + otherIncome) - (housing + livingExpenses + parentsAllowance + utilities + car + buffer))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 12-Month Forecast Chart - IMPROVED */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">2026 Monthly Forecast</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={monthlyForecast} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(val) => `${currency} ${Math.round(val / 1000).toLocaleString()}k`}
                            width={70}
                        />
                        <Tooltip 
                            formatter={(val, name) => {
                                // Format value with commas
                                const formattedVal = `${currency} ${val.toLocaleString()}`;
                                return [formattedVal, name];
                            }}
                            contentStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        
                        {/* Net worth area (background) */}
                        <Area 
                            type="monotone" 
                            dataKey="netWorth" 
                            fill="url(#netWorthGradient)" 
                            stroke="none"
                        />
                        
                        {/* Monthly savings bar */}
                        <Bar 
                            dataKey="savings" 
                            fill="#10B981" 
                            name="Monthly Savings"
                            radius={[4, 4, 0, 0]}
                        />
                        
                        {/* Net worth lines */}
                        <Line 
                            type="monotone" 
                            dataKey="netWorth" 
                            stroke="#000000" 
                            strokeWidth={3} 
                            name="Projected Net Worth" 
                            dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                            label={<NetWorthLabel />}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="actualNetWorth" 
                            stroke="#9381FF" 
                            strokeWidth={3} 
                            name="Actual Net Worth" 
                            connectNulls={false}
                            dot={{ r: 5, fill: '#9381FF', strokeWidth: 2, stroke: '#fff' }}
                            label={<NetWorthLabel />}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
                
                {/* Monthly breakdown toggle */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            View Income & Expense Breakdown
                        </summary>
                        <div className="mt-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={monthlyForecast} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${currency}${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip 
                                        formatter={(val) => `${currency} ${val.toLocaleString()}`}
                                        contentStyle={{ fontSize: 11 }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    
                                    {/* Income bars */}
                                    <Bar dataKey="salary" stackId="income" fill="#3B82F6" name="Salary" />
                                    <Bar dataKey="bonus" stackId="income" fill="#60A5FA" name="Bonus" />
                                    <Bar dataKey="other" stackId="income" fill="#93C5FD" name="Other" />
                                    
                                    {/* Expense bars */}
                                    <Bar dataKey="housing" stackId="expense" fill="#EF4444" name="Housing" />
                                    <Bar dataKey="livingExpenses" stackId="expense" fill="#F87171" name="Living" />
                                    <Bar dataKey="parentsAllowance" stackId="expense" fill="#FCA5A5" name="Parents" />
                                    <Bar dataKey="utilities" stackId="expense" fill="#FEE2E2" name="Utilities" />
                                    <Bar dataKey="car" stackId="expense" fill="#FDBA74" name="Car" />
                                    <Bar dataKey="buffer" stackId="expense" fill="#FEF2F2" name="Buffer" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </details>
                </div>
            </div>
            
            {/* 5-Year Forecast Chart */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">5-Year Projection (2026-2030)</h3>
                    <p className="text-xs text-gray-500 italic">End of year projections</p>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={fiveYearForecast} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis 
                            tick={{ fontSize: 12 }} 
                            tickFormatter={(val) => `${currency} ${Math.round(val / 1000).toLocaleString()}k`}
                            width={70}
                        />
                        <Tooltip 
                            formatter={(val, name) => {
                                const formattedVal = `${currency} ${val.toLocaleString()}`;
                                return [formattedVal, name];
                            }}
                            contentStyle={{ fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        
                        {/* Annual income bars */}
                        <Bar dataKey="salary" stackId="income" fill="#3B82F6" name="Salary" />
                        <Bar dataKey="bonus" stackId="income" fill="#60A5FA" name="Bonus" />
                        <Bar dataKey="other" stackId="income" fill="#93C5FD" name="Other" />
                        
                        {/* Annual expense bars */}
                        <Bar dataKey="housing" stackId="expense" fill="#EF4444" name="Housing" />
                        <Bar dataKey="livingExpenses" stackId="expense" fill="#F87171" name="Living" />
                        <Bar dataKey="parentsAllowance" stackId="expense" fill="#FCA5A5" name="Parents" />
                        <Bar dataKey="utilities" stackId="expense" fill="#FEE2E2" name="Utilities" />
                        <Bar dataKey="car" stackId="expense" fill="#FDBA74" name="Car" />
                        <Bar dataKey="buffer" stackId="expense" fill="#FEF2F2" name="Buffer" />
                        
                        {/* Net worth line */}
                        <Line 
                            type="monotone" 
                            dataKey="netWorth" 
                            stroke="#000000" 
                            strokeWidth={3} 
                            name="Net Worth"
                            dot={{ r: 5, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                            label={<NetWorthLabel />}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            {/* One-Off Adjustment Modal */}
            {showOneOffModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add One-Off Adjustment</h3>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleAddOneOff({
                                type: formData.get('type'),
                                year: Number(formData.get('year')),
                                month: Number(formData.get('month')),
                                amount: Number(oneOffAmount || 0),
                                description: formData.get('description')
                            });
                            setOneOffAmount(''); // Reset after submit
                        }}>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                        <select name="year" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            <option value="2026">2026</option>
                                            <option value="2027">2027</option>
                                            <option value="2028">2028</option>
                                            <option value="2029">2029</option>
                                            <option value="2030">2030</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                        <select name="month" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="text"
                                        value={formatOneOffAmount()}
                                        onChange={handleOneOffAmountChange}
                                        required
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                    <input
                                        type="text"
                                        name="description"
                                        placeholder="e.g., Loan from S&P"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOneOffModal(false);
                                        setOneOffAmount(''); // Reset on cancel
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Forecast;