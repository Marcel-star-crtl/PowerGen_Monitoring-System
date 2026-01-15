import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '@/api/endpoints/admin';
import { User } from '@/types/common.types';
import { Input } from './Input';
import { FiSearch, FiX } from 'react-icons/fi';
import { Spinner } from './Spinner';

interface SupervisorAutocompleteProps {
    value: string;
    onChange: (supervisorId: string) => void;
    label?: string;
    error?: string;
}

export const SupervisorAutocomplete: React.FC<SupervisorAutocompleteProps> = ({
    value,
    onChange,
    label,
    error,
}) => {
    const [query, setQuery] = useState('');
    const [supervisors, setSupervisors] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSupervisors();
        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // If we have an initial ID but no selected object, try to find it in the list
        if (value && supervisors.length > 0 && !selectedSupervisor) {
            const found = supervisors.find((s) => s.id === value);
            if (found) {
                setSelectedSupervisor(found);
                setQuery(found.fullName);
            }
        }
    }, [value, supervisors]);

    const loadSupervisors = async () => {
        setLoading(true);
        try {
            const result = await adminAPI.getUsers({ role: 'supervisor', limit: 100 });
            if (result.success && result.data) {
                const users = result.data.users.map((u: any) => ({ ...u, id: u._id || u.id }));
                setSupervisors(users);

                // Initial match check if value exists
                if (value) {
                    const current = users.find((u: any) => u.id === value);
                    if (current) {
                        setSelectedSupervisor(current);
                        setQuery(current.fullName);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load supervisors', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSupervisors = supervisors.filter((s) =>
        s.fullName.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (user: User) => {
        setSelectedSupervisor(user);
        setQuery(user.fullName);
        onChange(user.id);
        setIsOpen(false);
    };

    const handleClear = () => {
        setSelectedSupervisor(null);
        setQuery('');
        onChange('');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                label={label}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    if (!e.target.value) {
                        onChange('');
                        setSelectedSupervisor(null);
                    }
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Type to search supervisors..."
                error={error}
                fullWidth
                autoComplete="off"
            />
            {selectedSupervisor && (
                <button
                    onClick={handleClear}
                    className="absolute right-2 top-9 text-gray-400 hover:text-gray-600"
                    title="Clear"
                >
                    <FiX />
                </button>
            )}

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 flex justify-center">
                            <Spinner size="sm" />
                        </div>
                    ) : filteredSupervisors.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500 text-center">No supervisors found</div>
                    ) : (
                        <ul className="py-1">
                            {filteredSupervisors.map((user) => (
                                <li
                                    key={user.id}
                                    onClick={() => handleSelect(user)}
                                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                                >
                                    <p className="font-medium text-gray-900">{user.fullName}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};
