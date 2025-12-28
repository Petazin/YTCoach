import React from 'react';
import styles from './Tabs.module.css';

export interface TabOption {
    value: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
}

interface TabsProps {
    options: TabOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function Tabs({ options, value, onChange, className = '' }: TabsProps) {
    return (
        <div className={`${styles.container} ${className}`}>
            {options.map((option) => (
                <button
                    key={option.value}
                    className={`${styles.tab} ${value === option.value ? styles.active : ''}`}
                    onClick={() => onChange(option.value)}
                    type="button"
                    aria-selected={value === option.value}
                    role="tab"
                >
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    {option.label}
                </button>
            ))}
        </div>
    );
}
