// ============================================
// 1. DataTable.jsx - Main Generic Table Component
// ============================================
import React from 'react';
import { PencilIcon, TrashIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import CollapsibleSection from './CollapsibleSection';
import TableRow from './TableRow';

const DataTable = ({ 
  data = [],
  columns = [],
  sections = [],
  expandedSections = {},
  onToggleSection,
  onEdit,
  onDelete,
  onViewComment,
  emptyMessage = "No data yet. Add your first entry!",
  scrollHint = "← Scroll horizontally to see all columns →",
  showActions = true,
  stickyHeader = true,
  footerRow = null
}) => {
  if (data.length === 0) {
    return <p className="text-gray-400 text-center py-8">{emptyMessage}</p>;
  }

  return (
    <>
      {scrollHint && <p className="text-xs text-gray-400 mb-3">{scrollHint}</p>}
      
      <div className="overflow-y-auto">
        <table className="w-full text-sm">
          {/* HEADER */}
          <thead>
            <tr className={`border-b bg-gray-50 ${stickyHeader ? 'sticky top-0 z-20' : ''}`}>
              <th className="whitespace-nowrap sticky left-0 bg-gray-50 z-10 p-3 text-left font-semibold text-gray-700">
                {columns[0]?.label || 'Category'}
              </th>
              {data.map((item, index) => (
                <th key={index} className="p-3 text-right font-semibold text-gray-900 min-w-[120px]">
                  <div className="flex flex-col items-end">
                    <span>{item[columns[0]?.key] || item.date || item.id}</span>
                    {showActions && (
                      <div className="flex gap-2">
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(item)} 
                            className="text-gray-500 hover:text-gray-800 rounded transition-colors" 
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4"/>
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(item)} 
                            className="text-gray-500 hover:text-gray-800 rounded transition-colors" 
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4"/>
                          </button>
                        )}

                        {item.comment && (
                            <button
                                onClick={() => onViewComment(item)}
                                className="text-gray-500 hover:text-gray-800 rounded transition-colors"
                                title="View comment"
                            >
                                <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* BODY - Sections */}
          <tbody>
            {sections.map(section => (
              <CollapsibleSection
                key={section.id}
                id={section.id}
                label={section.label}
                isExpanded={expandedSections[section.id]}
                onToggle={onToggleSection}
                data={data}
                getValue={section.getValue}
                bgColor={section.bgColor}
                hoverColor={section.hoverColor}
                textColor={section.textColor}
              >
                {section.subRows?.map((subRow, idx) => (
                  <TableRow
                    key={idx}
                    label={subRow.label}
                    data={data}
                    getValue={subRow.getValue}
                    indent={subRow.indent}
                    isItalic={subRow.isItalic}
                    textColor={subRow.textColor}
                  />
                ))}
              </CollapsibleSection>
            ))}

            {/* Optional Footer Row (e.g., Totals) */}
            {footerRow && (
              <tr className={footerRow.className || "bg-gray-900 text-white font-bold text-sm"}>
                <td className="sticky left-0 bg-gray-900 z-10 p-3">
                  {footerRow.label}
                </td>
                {data.map((item, i) => (
                  <td key={i} className="p-3 text-right">
                    {footerRow.getValue(item)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DataTable;