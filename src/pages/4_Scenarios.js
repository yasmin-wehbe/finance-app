// ============================================
// src/pages/Scenarios.js
// ============================================
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { useCurrency } from '../contexts/CurrencyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const PRESET_SCENARIOS = {
    cash: {
        name: 'Cash Only',
        stocks: 0,
        stockReturn: 0,
        gold: 0,
        goldReturn: 0,
        savings: 100,
        savingsRate: 0
    },
    conservative: {
        name: 'Conservative',
        stocks: 20,
        stockReturn: 10,
        gold: 10,
        goldReturn: 4,
        savings: 70,
        savingsRate: 4.5
    },
    balanced: {
        name: 'Balanced',
        stocks: 50,
        stockReturn: 10,
        gold: 10,
        goldReturn: 4,
        savings: 40,
        savingsRate: 4.5
    },
    aggressive: {
        name: 'Aggressive',
        stocks: 80,
        stockReturn: 12,
        gold: 10,
        goldReturn: 4,
        savings: 10,
        savingsRate: 4.5
    },
    goldHedge: {
        name: 'Gold Hedge',
        stocks: 30,
        stockReturn: 10,
        gold: 50,
        goldReturn: 4,
        savings: 20,
        savingsRate: 4.5
    },
    custom: {
        name: 'Custom',
        stocks: 33,
        stockReturn: 10,
        gold: 33,
        goldReturn: 4,
        savings: 34,
        savingsRate: 4.5
    }
};

const SCENARIO_COLORS = ['#1E3A8A', '#9381FF', '#10B981', '#EF4444', '#F59E0B', '#EC4899'];

function Scenarios() {
    const { format, currency, convert } = useCurrency();
    
    // Load from localStorage or use defaults
    const savedSettings = JSON.parse(localStorage.getItem('scenariosSettings') || '{}');
    
    // Global settings
    const [initialInvestment, setInitialInvestment] = useState(savedSettings.initialInvestment ?? 0);
    const [biweeklyContribution, setBiweeklyContribution] = useState(savedSettings.biweeklyContribution ?? 0);
    const [timeHorizonMonths, setTimeHorizonMonths] = useState(savedSettings.timeHorizonMonths ?? 60);
    
    // Scenarios
    const [scenarios, setScenarios] = useState(savedSettings.scenarios ?? [
        { id: 1, ...PRESET_SCENARIOS.conservative },
        { id: 2, ...PRESET_SCENARIOS.balanced },
        { id: 3, ...PRESET_SCENARIOS.aggressive }
    ]);
    
    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('scenariosSettings', JSON.stringify({
            initialInvestment,
            biweeklyContribution,
            timeHorizonMonths,
            scenarios
        }));
    }, [initialInvestment, biweeklyContribution, timeHorizonMonths, scenarios]);
    
    // Number input handlers
    const handleNumberInput = (setter) => (e) => {
        const raw = e.target.value.replace(/,/g, '');
        if (raw === '' || !isNaN(raw)) {
            setter(raw === '' ? 0 : Number(raw));
        }
    };
    
    const formatNumber = (value) => {
        if (value === '' || value === 0) return '';
        return Number(value).toLocaleString();
    };
    
    // Calculate future value with bi-weekly contributions
    const calculateFV = (initial, biweekly, annualRate, months) => {
        const biweeklyRate = Math.pow(1 + annualRate / 100, 1 / 26) - 1;
        const totalPeriods = (months / 12) * 26;
        
        // Future value of initial lump sum
        const fvInitial = initial * Math.pow(1 + biweeklyRate, totalPeriods);
        
        // Future value of recurring contributions
        const fvContributions = biweekly * (Math.pow(1 + biweeklyRate, totalPeriods) - 1) / biweeklyRate;
        
        return fvInitial + fvContributions;
    };
    
    // Calculate weighted return for mixed portfolio
    const calculatePortfolioReturn = (scenario) => {
        const stockWeight = scenario.stocks / 100;
        const goldWeight = scenario.gold / 100;
        const savingsWeight = scenario.savings / 100;
        
        return (stockWeight * scenario.stockReturn) + 
               (goldWeight * scenario.goldReturn) + 
               (savingsWeight * scenario.savingsRate);
    };
    
    // Calculate results for all scenarios
    const results = useMemo(() => {
        return scenarios.map(scenario => {
            const avgReturn = calculatePortfolioReturn(scenario);
            const finalValue = convert(calculateFV(initialInvestment, biweeklyContribution, avgReturn, timeHorizonMonths));
            const totalContributed = convert(initialInvestment + (biweeklyContribution * (timeHorizonMonths / 12) * 26));
            const totalGain = finalValue - totalContributed;
            const roi = totalContributed > 0 ? (totalGain / totalContributed) * 100 : 0;
            
            // Risk level
            let risk = 'Low';
            if (scenario.stocks > 60) risk = 'High';
            else if (scenario.stocks > 30) risk = 'Medium';
            
            return {
                ...scenario,
                avgReturn,
                finalValue,
                totalContributed,
                totalGain,
                roi,
                risk
            };
        });
    }, [scenarios, initialInvestment, biweeklyContribution, timeHorizonMonths, convert]);
    
    // Generate chart data (monthly snapshots)
    const chartData = useMemo(() => {
        const data = [];
        
        for (let month = 0; month <= timeHorizonMonths; month += 3) { // Every 3 months for performance
            const point = { month: `${month}m` };
            
            scenarios.forEach((scenario, idx) => {
                const avgReturn = calculatePortfolioReturn(scenario);
                const value = convert(calculateFV(initialInvestment, biweeklyContribution, avgReturn, month));
                point[`scenario${idx}`] = value;
            });
            
            data.push(point);
        }
        
        return data;
    }, [scenarios, initialInvestment, biweeklyContribution, timeHorizonMonths, convert]);

    // Chart data: Total Value vs Total Contributed
    const contributionChartData = useMemo(() => {
        const data = [];

        for (let month = 0; month <= timeHorizonMonths; month += 3) {
            const periods = (month / 12) * 26;
            const contributed =
                initialInvestment + biweeklyContribution * periods;

            const point = {
                month: `${month}m`,
                contributed: convert(contributed)
            };

            scenarios.forEach((scenario, idx) => {
                const avgReturn = calculatePortfolioReturn(scenario);
                const value = convert(
                    calculateFV(initialInvestment, biweeklyContribution, avgReturn, month)
                );
                point[`value${idx}`] = value;
            });

            data.push(point);
        }

        return data;
    }, [
        scenarios,
        initialInvestment,
        biweeklyContribution,
        timeHorizonMonths,
        convert
    ]);

    
    // Breakeven analysis
    const breakevens = useMemo(() => {
        const insights = [];
        
        if (scenarios.length < 2) return insights;
        
        // Sort scenarios by expected return
        const sortedScenarios = [...scenarios].sort((a, b) => {
            const aReturn = calculatePortfolioReturn(a);
            const bReturn = calculatePortfolioReturn(b);
            return aReturn - bReturn;
        });
        
        // Compare each scenario to the one below it
        for (let i = 1; i < sortedScenarios.length; i++) {
            const lowerScenario = sortedScenarios[i - 1];
            const higherScenario = sortedScenarios[i];
            
            const lowerReturn = calculatePortfolioReturn(lowerScenario);
            const higherReturn = calculatePortfolioReturn(higherScenario);
            
            // Find when higher scenario overtakes lower
            for (let month = 1; month <= timeHorizonMonths; month++) {
                const lowerValue = calculateFV(initialInvestment, biweeklyContribution, lowerReturn, month);
                const higherValue = calculateFV(initialInvestment, biweeklyContribution, higherReturn, month);
                
                if (higherValue > lowerValue) {
                    insights.push({
                        lowerScenario: lowerScenario.name,
                        higherScenario: higherScenario.name,
                        months: month,
                        message: `${higherScenario.name} overtakes ${lowerScenario.name} after ${month} month${month > 1 ? 's' : ''}`
                    });
                    break;
                }
            }
        }
        
        // Add some general insights
        if (results.length > 0) {
            const bestScenario = results.reduce((best, current) => 
                current.finalValue > best.finalValue ? current : best
            );
            const worstScenario = results.reduce((worst, current) => 
                current.finalValue < worst.finalValue ? current : worst
            );
            
            const difference = bestScenario.finalValue - worstScenario.finalValue;
            
            insights.push({
                message: `${bestScenario.name} will earn you ${currency} ${difference.toLocaleString()} more than ${worstScenario.name} over ${(timeHorizonMonths/12).toFixed(1)} years`
            });
            
            // Show contribution milestone
            const totalContributed = initialInvestment + (biweeklyContribution * (timeHorizonMonths / 12) * 26);
            insights.push({
                message: `You'll have contributed ${currency} ${totalContributed.toLocaleString()} over ${(timeHorizonMonths/12).toFixed(1)} years (${(biweeklyContribution * 26).toLocaleString()}/year)`
            });
        }
        
        return insights;
    }, [scenarios, initialInvestment, biweeklyContribution, timeHorizonMonths, results, currency]);
    
    // Add scenario
    const addScenario = (preset = null) => {
        if (scenarios.length >= 6) {
            alert('Maximum 6 scenarios allowed');
            return;
        }
        
        const newScenario = {
            id: Date.now(),
            ...(preset ? PRESET_SCENARIOS[preset] : PRESET_SCENARIOS.custom)
        };
        
        setScenarios([...scenarios, newScenario]);
    };
    
    // Update scenario
    const updateScenario = (id, updates) => {
        setScenarios(scenarios.map(s => s.id === id ? { ...s, ...updates } : s));
    };
    
    // Delete scenario
    const deleteScenario = (id) => {
        setScenarios(scenarios.filter(s => s.id !== id));
    };
    
    // Validate allocation
    const validateAllocation = (scenario) => {
        const total = scenario.stocks + scenario.gold + scenario.savings;
        return Math.abs(total - 100) < 0.1; // Allow for floating point errors
    };

    return (
        <div className="px-4 py-2">
            <PageHeader title="Investment Scenarios" />
            
            {/* Global Settings */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4">Global Settings</h3>
                
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initial Investment
                        </label>
                        <input
                            type="text"
                            value={formatNumber(initialInvestment)}
                            onChange={handleNumberInput(setInitialInvestment)}
                            placeholder="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bi-weekly Contribution
                        </label>
                        <input
                            type="text"
                            value={formatNumber(biweeklyContribution)}
                            onChange={handleNumberInput(setBiweeklyContribution)}
                            placeholder="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Every 2 weeks (26 times/year)</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Horizon: {timeHorizonMonths} months ({(timeHorizonMonths / 12).toFixed(1)} years)
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="120"
                            value={timeHorizonMonths}
                            onChange={(e) => setTimeHorizonMonths(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1m</span>
                            <span>120m</span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                        <strong>Total you'll contribute:</strong> {currency} {convert(initialInvestment + (biweeklyContribution * (timeHorizonMonths / 12) * 26)).toLocaleString()}
                        {' '}over {(timeHorizonMonths / 12).toFixed(1)} years
                    </p>
                </div>
            </div>
            
            {/* Scenarios */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Scenarios ({scenarios.length}/6)</h3>
                    
                    <div className="flex gap-2">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    addScenario(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">Load Preset...</option>
                            <option value="cash">Cash Only</option>
                            <option value="conservative">Conservative</option>
                            <option value="balanced">Balanced</option>
                            <option value="aggressive">Aggressive</option>
                            <option value="goldHedge">Gold Hedge</option>
                            <option value="custom">Custom</option>
                        </select>
                        
                        <button
                            onClick={() => addScenario()}
                            disabled={scenarios.length >= 6}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Scenario
                        </button>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {scenarios.map((scenario, idx) => {
                        const isValid = validateAllocation(scenario);
                        
                        return (
                            <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <input
                                        type="text"
                                        value={scenario.name}
                                        onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                                        className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                                    />
                                    
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            results[idx].risk === 'High' ? 'bg-red-100 text-red-700' :
                                            results[idx].risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {results[idx].risk === 'High' ? '🔴' : results[idx].risk === 'Medium' ? '🟡' : '🟢'} {results[idx].risk} Risk
                                        </span>
                                        
                                        <button
                                            onClick={() => deleteScenario(scenario.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                {!isValid && (
                                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                        ⚠️ Allocation must total 100% (currently {(scenario.stocks + scenario.gold + scenario.savings).toFixed(1)}%)
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Stocks */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stocks/ETFs: {scenario.stocks}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={scenario.stocks}
                                            onChange={(e) => updateScenario(scenario.id, { stocks: Number(e.target.value) })}
                                            className="w-full mb-2"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={scenario.stockReturn}
                                                onChange={(e) => updateScenario(scenario.id, { stockReturn: Number(e.target.value) })}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                            <span className="text-sm text-gray-600">% annual return</span>
                                        </div>
                                    </div>
                                    
                                    {/* Gold */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gold: {scenario.gold}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={scenario.gold}
                                            onChange={(e) => updateScenario(scenario.id, { gold: Number(e.target.value) })}
                                            className="w-full mb-2"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={scenario.goldReturn}
                                                onChange={(e) => updateScenario(scenario.id, { goldReturn: Number(e.target.value) })}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                            <span className="text-sm text-gray-600">% annual return</span>
                                        </div>
                                    </div>
                                    
                                    {/* Savings */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Savings: {scenario.savings}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={scenario.savings}
                                            onChange={(e) => updateScenario(scenario.id, { savings: Number(e.target.value) })}
                                            className="w-full mb-2"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={scenario.savingsRate}
                                                onChange={(e) => updateScenario(scenario.id, { savingsRate: Number(e.target.value) })}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                            <span className="text-sm text-gray-600">% annual rate</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 p-3 bg-gray-50 rounded flex justify-between text-sm">
                                    <span>Expected Annual Return:</span>
                                    <span className="font-bold">{results[idx].avgReturn.toFixed(2)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Results - Comparison Table */}
            {scenarios.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-6 h-6" />
                        Comparison Results
                    </h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 text-left">Scenario</th>
                                    <th className="p-3 text-right">Initial</th>
                                    <th className="p-3 text-right">Bi-weekly</th>
                                    <th className="p-3 text-right">After {(timeHorizonMonths/12).toFixed(1)}Y</th>
                                    <th className="p-3 text-right">Total Contributed</th>
                                    <th className="p-3 text-right">Total Gain</th>
                                    <th className="p-3 text-right">ROI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result, idx) => (
                                    <tr key={result.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SCENARIO_COLORS[idx] }} />
                                            {result.name}
                                        </td>
                                        <td className="p-3 text-right">{currency} {initialInvestment.toLocaleString()}</td>
                                        <td className="p-3 text-right">{currency} {biweeklyContribution.toLocaleString()}</td>
                                        <td className="p-3 text-right font-bold">{currency} {result.finalValue.toLocaleString()}</td>
                                        <td className="p-3 text-right">{currency} {result.totalContributed.toLocaleString()}</td>
                                        <td className={`p-3 text-right font-medium ${result.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.totalGain >= 0 ? '+' : ''}{currency} {result.totalGain.toLocaleString()}
                                        </td>
                                        <td className={`p-3 text-right font-bold ${result.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {result.roi.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Chart */}
            {scenarios.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold mb-4">Growth Over Time</h3>
                    
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis 
                                tickFormatter={(val) => `${currency} ${(val / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip 
                                formatter={(val) => `${currency} ${val.toLocaleString()}`}
                                contentStyle={{ fontSize: 12 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            
                            {scenarios.map((scenario, idx) => (
                                <Line
                                    key={scenario.id}
                                    type="monotone"
                                    dataKey={`scenario${idx}`}
                                    name={scenario.name}
                                    stroke={SCENARIO_COLORS[idx]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Total Value vs Contributions Chart */}
            {scenarios.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
                    <h3 className="text-lg font-semibold mb-4">
                        Total Value vs Total Contributed
                    </h3>

                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={contributionChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis
                                tickFormatter={(val) => `${currency} ${(val / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(val) => `${currency} ${val.toLocaleString()}`}
                                contentStyle={{ fontSize: 12 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />

                            {/* Total Contributed Line */}
                            <Line
                                type="monotone"
                                dataKey="contributed"
                                name="Total Contributed"
                                stroke="#6B7280"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />

                            {/* Portfolio Value Lines */}
                            {scenarios.map((scenario, idx) => (
                                <Line
                                    key={scenario.id}
                                    type="monotone"
                                    dataKey={`value${idx}`}
                                    name={`${scenario.name} (Value)`}
                                    stroke={SCENARIO_COLORS[idx]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            
            {/* Breakeven Analysis */}
            {breakevens.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">💡 Breakeven Insights</h3>
                    
                    <div className="space-y-2">
                        {breakevens.map((insight, idx) => (
                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-900">{insight.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Scenarios;