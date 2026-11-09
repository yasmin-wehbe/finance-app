import React, { useState } from 'react';

// Input component remains outside to maintain focus
const FormInput = ({ label, name, value, onChange, isRed = false }) => (
  <div className="flex flex-col">
    <label className={`text-[11px] mb-1.5 pl-0.5 font-medium ${isRed ? 'text-red-500' : 'text-gray-500'}`}>
      {label}
    </label>
    <input 
      type="text" 
      name={name} 
      value={value} 
      onChange={onChange} 
      placeholder="0"
      className={`border rounded-md p-2.5 text-sm outline-none transition-all hover:shadow-md transition-shadow ${
        isRed 
          ? 'bg-red-50/50 border-red-100 text-red-600 focus:border-red-300' 
          : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
      }`} 
    />
  </div>
);

const AddSnapshotModal = ({ onSaveSuccess, initialData = null, isOpen, setIsOpen }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cash_savings: 0, savings_rate: 0,
    cash_current: 0, cash_current_2: 0, cash_current_3: 0, 
    cash_ibkr: 0, cash_hand: 0, 
    gold_weight: 0, gold_price: 0,
    sp500_shares: 0, sp500_price: 0, 
    global_shares: 0, global_price: 0,
    bond_shares:0, bond_price: 0,
    receivables: 0, credit_card: 0,
    net_worth: 0,
    comment: ''
  });

  // When initialData changes (e.g. user clicks Edit), update the form
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset for "Add New"
      setFormData({
        date: new Date().toISOString().split('T')[0],
        cash_savings: 0, savings_rate: 0,
        cash_current: 0, cash_current_2: 0, cash_current_3: 0, 
        cash_ibkr: 0, cash_hand: 0, 
        gold_weight: 0, gold_price: 0,
        sp500_shares: 0, sp500_price: 0, 
        global_shares: 0, global_price: 0,
        bond_shares:0, bond_price: 0,
        receivables: 0, credit_card: 0,
        net_worth: 0,
        comment: ''
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'date' || name === 'comment') {
      setFormData({ ...formData, [name]: value });
      return;
    }

    const cleanValue = value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(cleanValue)) {
      setFormData({ ...formData, [name]: cleanValue });
    }
  };

  const formatForDisplay = (val) => {
    if (val === 0 || val === "" || val === undefined) return "";
    if (val.toString().endsWith('.')) return parseFloat(val).toLocaleString() + ".";
    const num = parseFloat(val);
    return isNaN(num) ? "" : num.toLocaleString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = { ...formData };
    Object.keys(submissionData).forEach(key => {
        if (key !== 'date' && key !== 'comment') submissionData[key] = parseFloat(submissionData[key]) || 0;
    });

    const result = await window.electronAPI.addSnapshot(submissionData);
    if (result.status === 'success') {
      setIsOpen(false);
      onSaveSuccess(); 
    }
  };

  // Fixed: Removed 'uppercase' and 'tracking-wider', adjusted font weight
  const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-3 mt-8 mb-2">
      <h4 className="text-[13px] font-semibold text-blue-900 whitespace-nowrap">{title}</h4>
      <div className="h-[1px] w-full bg-gray-100"></div>
    </div>
  );

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-gray-100 animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-xl font-bold text-gray-800">New financial snapshot</h3>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              className="text-xs font-semibold border border-gray-200 rounded-md px-3 py-1.5 bg-gray-50 text-gray-600 outline-none focus:border-blue-400 focus:bg-white hover:shadow-md transition-shadow" 
            />
          </div>
          
          <form onSubmit={handleSubmit}>
            <SectionHeader title="Cash Current" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="NBD" name="cash_current" value={formatForDisplay(formData.cash_current)} onChange={handleChange} />
              <FormInput label="Wio" name="cash_current_2" value={formatForDisplay(formData.cash_current_2)} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormInput label="Rev" name="cash_current_3" value={formatForDisplay(formData.cash_current_3)} onChange={handleChange} />
              <FormInput label="IBKR" name="cash_ibkr" value={formatForDisplay(formData.cash_ibkr)} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormInput label="In hand" name="cash_hand" value={formatForDisplay(formData.cash_hand)} onChange={handleChange} />
            </div>

            <SectionHeader title="Cash Saving" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Savings" name="cash_savings" value={formatForDisplay(formData.cash_savings)} onChange={handleChange} />
              <FormInput label="Interest rate (%)" name="savings_rate" value={formatForDisplay(formData.savings_rate)} onChange={handleChange} />
            </div>

            <SectionHeader title="Gold" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Weight (Units)" name="gold_weight" value={formatForDisplay(formData.gold_weight)} onChange={handleChange} />
              <FormInput label="Price (AED)" name="gold_price" value={formatForDisplay(formData.gold_price)} onChange={handleChange} />
            </div>

            <SectionHeader title="Investments" />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="S&P shares" name="sp500_shares" value={formatForDisplay(formData.sp500_shares)} onChange={handleChange} />
              <FormInput label="S&P price" name="sp500_price" value={formatForDisplay(formData.sp500_price)} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Global (ex-US) shares" name="global_shares" value={formatForDisplay(formData.global_shares)} onChange={handleChange} />
              <FormInput label="Global (ex-US) price" name="global_price" value={formatForDisplay(formData.global_price)} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Bond shares" name="bond_shares" value={formatForDisplay(formData.bond_shares)} onChange={handleChange} />
              <FormInput label="Bond price" name="bond_price" value={formatForDisplay(formData.bond_price)} onChange={handleChange} />
            </div>

            <SectionHeader title="Other assets" />
            <div className="grid grid-cols-1 gap-4">
              <FormInput label="Receivables" name="receivables" value={formatForDisplay(formData.receivables)} onChange={handleChange} />
            </div>

            <SectionHeader title="Liabilities" />
            <div className="mb-4">
              <FormInput label="Credit card debt" name="credit_card" value={formatForDisplay(formData.credit_card)} onChange={handleChange} isRed />
            </div>

            {/* 3. Refined Comment Section */}
            <SectionHeader title="Context (optional)" />
            <div className="mb-4">
              <label className="text-[11px] mb-1.5 pl-0.5 font-medium text-gray-500 block">
                  Notes (Optional)
              </label>
              <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="e.g., 'Received bonus', 'Market crash', 'Yearly medical insurance paid'"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none placeholder:text-gray-300 hover:shadow-md transition-shadow"
              />
            </div>

            <div className="flex gap-4 pt-10 border-t mt-10">
              <button type="submit" className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-blue-900/20 active:scale-[0.98]">
                Save snapshot
              </button>
              <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 py-3 rounded-xl font-semibold text-sm transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default AddSnapshotModal;