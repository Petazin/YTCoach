import React from 'react';
import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    variant?: 'default' | 'error';
    selectSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', variant = 'default', selectSize = 'md', children, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={`
          ${styles.select} 
          ${styles[selectSize]} 
          ${variant === 'error' ? styles.error : ''} 
          ${className}
        `}
                {...props}
            >
                {children}
            </select>
        );
    }
);

Select.displayName = 'Select';
