// ============================================
// src/pages/4_Emergency Fund.js
// ============================================
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { useCurrency } from '../contexts/CurrencyContext';

function EmergencyFund() {
    const { format } = useCurrency();

    const savedSettings = JSON.parse(localStorage.getItem('emergencyFundSettings') || "{}");
    
    // Emergency fund inputs
    const [monthlyHousing, setMonthlyHousing] = useState(savedSettings.monthlyHousing ?? "");
    const [livingExpenses, setLivingExpenses] = useState(savedSettings.livingExpenses ?? "");
    const [parentsAllowance, setParentsAllowance] = useState(savedSettings.parentsAllowance ?? "");
    const [utilities, setUtilities] = useState(savedSettings.utilities ?? "");
    const [car, setCar] = useState(savedSettings.car ?? "");
    const [buffer, setBuffer] = useState(savedSettings.buffer ?? "");
    const [multiplier, setMultiplier] = useState(savedSettings.multiplier ?? 6);
    
    // Data from Wealth
    const [totalCash, setTotalCash] = useState(0);
    const [latestSnapshot, setLatestSnapshot] = useState(null);
    
    // Load saved settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('emergencyFundSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            setMonthlyHousing(settings.monthlyHousing ?? "");
            setLivingExpenses(settings.livingExpenses ?? "");
            setParentsAllowance(settings.parentsAllowance ?? "");
            setUtilities(settings.utilities ?? "");
            setCar(settings.car ?? "");
            setBuffer(settings.buffer ?? "");
            setMultiplier(settings.multiplier || 6);
        }
    }, []);
    
    // Save settings to localStorage whenever they change
    useEffect(() => {
        const settings = {
            monthlyHousing,
            livingExpenses,
            parentsAllowance,
            utilities,
            car,
            buffer,
            multiplier
        };
        localStorage.setItem('emergencyFundSettings', JSON.stringify(settings));
    }, [monthlyHousing, livingExpenses, parentsAllowance, utilities, car, buffer, multiplier]);
    
    // Fetch latest snapshot from Excel
    useEffect(() => {
        const fetchLatestSnapshot = async () => {
            const result = await window.electronAPI.getSnapshots();
            if (result.status === 'success' && result.data.length > 0) {
                // Sort by date descending and get the latest
                const sorted = result.data.sort((a, b) => 
                    new Date(b.date) - new Date(a.date)
                );
                const latest = sorted[0];
                setLatestSnapshot(latest);
                
                // Calculate total cash (savings + current + hand)
                const cash =    (latest.cash_savings || 0) + 
                                (latest.cash_current || 0) +
                                (latest.cash_current_2 || 0) + 
                                (latest.cash_current_3 || 0) +
                                (latest.cash_ibkr || 0) +
                                (latest.cash_hand || 0) -
                                (latest.credit_card || 0)
                                ;
                setTotalCash(cash);
            }
        };
        
        fetchLatestSnapshot();
    }, []);

    // Reset inputs
    const resetEmergencyFund = () => {
        setMonthlyHousing("");
        setLivingExpenses("");
        setParentsAllowance("");
        setUtilities("");
        setCar("");
        setBuffer("");
        setMultiplier(6); // or whatever default you want

        localStorage.removeItem('emergencyFundSettings');
    };
        
    // Calculate totals
    const monthlyTotal = useMemo(() => {
        return (
            Number(monthlyHousing || 0) +
            Number(livingExpenses || 0) +
            Number(parentsAllowance || 0) +
            Number(utilities || 0) +
            Number(car || 0) +
            Number(buffer || 0)
        );
    }, [monthlyHousing, livingExpenses, parentsAllowance, utilities, car, buffer]);
    
    const emergencyFundTarget = useMemo(() => {
        return monthlyTotal * multiplier;
    }, [monthlyTotal, multiplier]);
    
    const difference = useMemo(() => {
        return totalCash - emergencyFundTarget;
    }, [totalCash, emergencyFundTarget]);
    
    const percentageCovered = useMemo(() => {
        if (emergencyFundTarget === 0) return 0;
        return (totalCash / emergencyFundTarget) * 100;
    }, [totalCash, emergencyFundTarget]);

    function handleNumberInput(setter) {
        return (e) => {
            // Remove non-digit characters (strip commas)
            const raw = e.target.value.replace(/\D/g, '');
            // Store empty string or numeric value
            setter(raw === '' ? '' : Number(raw));
        };
    }
    
    
    function formatNumber(value) {
        if (value === '' || value === null) return '';
        return Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
    }

    return (
        <div className="px-4 py-2">
            <PageHeader title="Emergency Fund Calculator" />
            
            {/* Top Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <Card 
                    title="Total Cash Available" 
                    value={format(totalCash)}
                    subtitle={latestSnapshot ? `As of ${latestSnapshot.date}` : 'No data'}
                />
                <Card 
                    title="Emergency Fund Target" 
                    value={format(emergencyFundTarget)}
                    subtitle={`${multiplier} months of expenses`}
                />
                <Card 
                    title={difference >= 0 ? "Surplus" : "Shortfall"}
                    value={difference >= 0 ? `+${format(difference)}` : format(difference)}
                    subtitle={`${percentageCovered.toFixed(0)}% covered`}
                />
            </div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Inputs */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            Monthly Expenses
                        </h3>
                        <button type="button" onClick={resetEmergencyFund} className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"                        >
                            Reset
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Monthly Housing */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monthly Housing (Rent/Mortgage)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(monthlyHousing)}
                                onChange={handleNumberInput(setMonthlyHousing)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-md transition-shadow"
                                
                            />
                        </div>
                        
                        {/* Living Expenses */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Living Expenses (Food, Transport, etc.)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(livingExpenses)}
                                onChange={handleNumberInput(setLivingExpenses)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-md transition-shadow"
                                
                            />
                        </div>
                        
                        {/* Parents Allowance */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Allowance for Parents
                            </label>
                            <input
                                type="text"
                                value={formatNumber(parentsAllowance)}
                                onChange={handleNumberInput(setParentsAllowance)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-md transition-shadow"
                                
                            />
                        </div>
                        
                        {/* Utilities */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Utilities (Electricity, Water, Internet)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(utilities)}
                                onChange={handleNumberInput(setUtilities)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-md transition-shadow"
                                
                            />
                        </div>

                        {/* Car */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Car
                            </label>
                            <input
                                type="text"
                                value={formatNumber(car)}
                                onChange={handleNumberInput(setCar)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-md transition-shadow"
                                
                            />
                        </div>
                        
                        {/* Buffer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Extra Buffer (Optional)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(buffer)}
                                onChange={handleNumberInput(setBuffer)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-md transition-shadow"
                                
                            />
                        </div>
                        
                        {/* Monthly Total */}
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700">
                                    Total Monthly Expenses
                                </span>
                                <span className="text-xl font-bold text-gray-900">
                                    {format(monthlyTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Side - Multiplier & Results */}
                <div className="space-y-4">
                    {/* Multiplier Slider */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-white">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            Risk Tolerance
                        </h3>
                        
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Number of Months
                                </label>
                                <span className="text-3xl font-bold text-blue-600">
                                    {multiplier}x
                                </span>
                            </div>
                            
                            <input
                                type="range"
                                min="3"
                                max="12"
                                step="1"
                                value={multiplier}
                                onChange={(e) => setMultiplier(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>3 months (High risk)</span>
                                <span>12 months (Low risk)</span>
                            </div>
                        </div>
                        
                        {/* Risk Level Indicator */}
                        <div className="mt-4">
                            <div className={`px-4 py-3 rounded-lg ${
                                multiplier <= 4 
                                    ? 'bg-red-50 border border-red-200' 
                                    : multiplier <= 8 
                                    ? 'bg-yellow-50 border border-yellow-200' 
                                    : 'bg-green-50 border border-green-200'
                            }`}>
                                <p className={`text-sm font-medium ${
                                    multiplier <= 4 
                                        ? 'text-red-700' 
                                        : multiplier <= 8 
                                        ? 'text-yellow-700' 
                                        : 'text-green-700'
                                }`}>
                                    {multiplier <= 4 && '⚠️ Higher Risk: Suitable if you have stable income and low expenses'}
                                    {multiplier > 4 && multiplier <= 8 && '✓ Moderate: Good balance for most situations'}
                                    {multiplier > 8 && '✓✓ Conservative: Recommended for unstable income or high expenses'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-white">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            Progress
                        </h3>
                        
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Cash (current + savings)</span>
                                <span className="font-semibold text-gray-900">
                                    {percentageCovered.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        percentageCovered >= 100 
                                            ? 'bg-green-500' 
                                            : percentageCovered >= 75 
                                            ? 'bg-blue-500' 
                                            : percentageCovered >= 50 
                                            ? 'bg-yellow-500' 
                                            : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(percentageCovered, 100)}%` }}
                                />
                            </div>
                        </div>
                        
                        {/* Status Message */}
                        <div className={`mt-4 p-4 rounded-lg ${
                            difference >= 0 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                        }`}>
                            {difference >= 0 ? (
                                <div>
                                    <p className="text-sm font-semibold text-green-700 mb-1">
                                        ✓ Emergency Fund Goal Met!
                                    </p>
                                    <p className="text-sm text-green-600">
                                        You have a surplus of {format(difference)}. Consider investing the excess.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm font-semibold text-red-700 mb-1">
                                        ⚠ Emergency Fund Not Met
                                    </p>
                                    <p className="text-sm text-red-600">
                                        You need {format(Math.abs(difference))} more to reach your target.
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Breakdown */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                Breakdown
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Monthly Expenses</span>
                                    <span className="font-medium">{format(monthlyTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Multiplier</span>
                                    <span className="font-medium">×{multiplier}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="font-semibold text-gray-900">Target</span>
                                    <span className="font-bold text-blue-600">{format(emergencyFundTarget)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmergencyFund;