import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: 'default' | 'error';
    inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', variant = 'default', inputSize = 'md', ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`
          ${styles.input} 
          ${styles[inputSize]} 
          ${variant === 'error' ? styles.error : ''} 
          ${className}
        `}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
