// ============================================
// 3. TableRow.jsx - Generic Data Row
// ============================================
import React from 'react';

const TableRow = ({ 
  label, 
  data, 
  getValue, 
  indent = 8,
  isItalic = false,
  textColor = 'text-gray-600',
  bgColor = 'bg-white',
  hoverBg = 'hover:bg-gray-50'
}) => {
  return (
    <tr className={`border-b ${hoverBg}`}>
      <td 
        className={`sticky left-0 ${bgColor} ${hoverBg} z-10 p-2 pl-${indent} ${textColor} ${isItalic ? 'text-xs italic' : ''}`}
      >
        {label}
      </td>
      {data.map((item, i) => (
        <td 
          key={i} 
          className={`p-2 text-right ${textColor} ${isItalic ? 'text-xs' : ''}`}
        >
          {getValue(item)}
        </td>
      ))}
    </tr>
  );
};

export default TableRow;