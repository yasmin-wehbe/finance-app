// ============================================
// 2. CollapsibleSection.jsx - Generic Collapsible Row
// ============================================
import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const CollapsibleSection = ({ 
  id,
  label, 
  isExpanded, 
  onToggle, 
  data, 
  getValue,
  children,
  bgColor = 'bg-blue-50',
  hoverColor = 'hover:bg-blue-100',
  textColor = 'text-blue-900'
}) => {
  return (
    <>
      <tr 
        onClick={() => onToggle?.(id)}
        className={`${bgColor} ${onToggle ? 'cursor-pointer' : ''} ${hoverColor} transition-colors`}
      >
        <td className={`whitespace-nowrap sticky left-0 ${bgColor} ${hoverColor} z-10 p-2 font-semibold ${textColor}`}>
          <div className="flex items-center gap-2">
            {onToggle && (isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />)}
            {label}
          </div>
        </td>
        {data.map((item, i) => (
          <td key={i} className="p-2 text-right font-semibold">
            {getValue(item)}
          </td>
        ))}
      </tr>
      {isExpanded && children}
    </>
  );
};

export default CollapsibleSection;
