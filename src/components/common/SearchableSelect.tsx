import React, { useState, useRef, useEffect } from 'react';
import { classNames } from '@/utils/helpers';
import { FiChevronDown, FiX, FiSearch } from 'react-icons/fi';

export interface SearchableSelectOption {
  value: string | number;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiple?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  loading?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  required = false,
  multiple = false,
  fullWidth = false,
  disabled = false,
  searchPlaceholder = 'Search...',
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : value ? [value] : [];
      const valueStr = optionValue.toString();
      
      if (currentValues.includes(valueStr)) {
        onChange(currentValues.filter((v) => v !== valueStr));
      } else {
        onChange([...currentValues, valueStr]);
      }
    } else {
      onChange(optionValue.toString());
      setIsOpen(false);
    }
    setSearchQuery('');
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      onChange(currentValues.filter((v) => v !== optionValue));
    } else {
      onChange('');
    }
  };

  const getSelectedOptions = () => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return options.filter((opt) => values.includes(opt.value.toString()));
  };

  const selectedOptions = getSelectedOptions();
  const displayText = selectedOptions.length > 0
    ? selectedOptions.map((opt) => opt.label).join(', ')
    : placeholder;

  return (
    <div className={classNames('relative', fullWidth && 'w-full')} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected display / trigger */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={classNames(
          'relative w-full rounded-md border bg-white px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
          error && 'border-red-300',
          !error && 'border-gray-300',
          disabled && 'bg-gray-100 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:bg-gray-50'
        )}
      >
        <div className="flex items-center justify-between">
          <span className={classNames(
            'block truncate',
            selectedOptions.length === 0 && 'text-gray-400'
          )}>
            {loading ? 'Loading...' : displayText}
          </span>
          <FiChevronDown
            className={classNames(
              'h-5 w-5 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Selected tags for multiple mode */}
      {multiple && selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-primary-100 text-primary-800"
            >
              {option.label}
              <button
                type="button"
                onClick={(e) => handleRemove(option.value.toString(), e)}
                className="ml-1 inline-flex items-center hover:text-primary-600"
              >
                <FiX className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = Array.isArray(value)
                  ? value.includes(option.value.toString())
                  : value === option.value.toString();

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={classNames(
                      'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100',
                      isSelected && 'bg-primary-50 text-primary-900 font-medium'
                    )}
                  >
                    <div>{option.label}</div>
                    {option.subtitle && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.subtitle}</div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
