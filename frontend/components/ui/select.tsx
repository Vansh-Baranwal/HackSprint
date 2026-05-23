import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  searchable?: boolean;
  onChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, required, disabled, searchable = false, onChange, value, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const selectId = props.id || props.name;

    const filteredOptions = searchable
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    const selectedOption = options.find((opt) => opt.value === value);

    if (searchable) {
      return (
        <div className="w-full">
          {label && (
            <label
              htmlFor={selectId}
              className={cn(
                'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
                disabled && 'opacity-50'
              )}
            >
              {label}
              {required && <span className="ml-1 text-red-500" aria-label="required">*</span>}
            </label>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              className={cn(
                'flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
                'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'dark:border-white/10 dark:bg-neutral-900/40 dark:text-gray-100 backdrop-blur-sm',
                'max-sm:text-black dark:max-sm:text-black max-sm:bg-white dark:max-sm:bg-white',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                className
              )}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              <span className={cn(!selectedOption && 'text-gray-400')}>
                {selectedOption?.label || 'Select an option'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {isOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/10 dark:bg-neutral-900/40 dark:text-gray-100 backdrop-blur-sm"
                    />
                  </div>
                </div>
                <ul className="max-h-60 overflow-auto py-1" role="listbox">
                  {filteredOptions.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">No options found</li>
                  ) : (
                    filteredOptions.map((option) => (
                      <li
                        key={option.value}
                        onClick={() => {
                          onChange?.(option.value);
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className={cn(
                          'cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                          option.value === value && 'bg-orange-500/20 text-orange-400 dark:bg-orange-950/40 dark:text-orange-300'
                        )}
                        role="option"
                        aria-selected={option.value === value}
                      >
                        {option.label}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
          {error && (
            <p
              id={`${selectId}-error`}
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && <span className="ml-1 text-red-500" aria-label="required">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm',
              'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:border-white/10 dark:bg-neutral-900/40 dark:text-gray-100 backdrop-blur-sm',
              'max-sm:text-black dark:max-sm:text-black max-sm:bg-white dark:max-sm:bg-white',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
