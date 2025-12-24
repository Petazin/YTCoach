import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'neutral' | 'primary';
    className?: string;
}

export const Badge = ({
    children,
    variant = 'neutral',
    className = ''
}: BadgeProps) => {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${className}`}>
            {children}
        </span>
    );
};
