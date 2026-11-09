import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('AED');
    const EXCHANGE_RATE = 3.67;

    // 1. Wrap 'convert' in useCallback
    const convert = useCallback((amount) => {
        if (!amount) return 0;
        return currency === 'USD' ? amount / EXCHANGE_RATE : amount;
    }, [currency]); // Only changes when currency changes

    // 2. Wrap 'format' in useCallback 
    // It depends on 'convert' and 'currency'
    const format = useCallback((amount) => {
        const converted = convert(amount);
        return `${currency} ${converted.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    }, [currency, convert]);

    const toggleCurrency = useCallback(() => {
        setCurrency(prev => (prev === 'AED' ? 'USD' : 'AED'));
    }, []);

    // 3. Now the useMemo dependency array is safe and complete
    const value = useMemo(() => ({
        currency,
        setCurrency,
        toggleCurrency,
        convert,
        format,
        EXCHANGE_RATE
    }), [currency, toggleCurrency, convert, format]);

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};