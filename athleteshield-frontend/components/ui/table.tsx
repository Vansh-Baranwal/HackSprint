import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyMessage?: string;
  className?: string;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(keyExtractor));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      onSelectionChange?.(selectedRows.filter((rowId) => rowId !== id));
    } else {
      onSelectionChange?.([...selectedRows, id]);
    }
  };

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <table className="w-full border-collapse bg-white text-left text-sm dark:bg-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {selectable && (
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 font-medium text-gray-900 dark:text-gray-100',
                  column.sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp
                        className={cn(
                          'h-3 w-3',
                          sortConfig?.key === column.key && sortConfig.direction === 'asc'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 -mt-1',
                          sortConfig?.key === column.key && sortConfig.direction === 'desc'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        )}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedData.map((row) => {
            const rowId = keyExtractor(row);
            const isSelected = selectedRows.includes(rowId);

            return (
              <tr
                key={rowId}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700',
                  isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectRow(rowId);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      aria-label={`Select row ${rowId}`}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {column.render ? column.render(row) : String((row as any)[column.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';

export { Table };
