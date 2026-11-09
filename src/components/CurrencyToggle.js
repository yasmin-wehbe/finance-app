import { useCurrency } from '../contexts/CurrencyContext';

function CurrencyToggle() {
  const contextValue = useCurrency();
  console.log('Context value:', contextValue);
  
  // Destructure first, check after
  if (!contextValue) {
    return <div>Error: No currency context!</div>;
  }
  
  const { currency, toggleCurrency } = contextValue;
  
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={toggleCurrency}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          currency === 'AED'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        AED
      </button>
      <button
        onClick={toggleCurrency}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
          currency === 'USD'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        USD
      </button>
    </div>
  );
}

export default CurrencyToggle;