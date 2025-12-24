import React, { HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'interactive' | 'flat';
}

export const Card = ({
    children,
    className = '',
    variant = 'default',
    ...props
}: CardProps) => {
    return (
        <div
            className={`${styles.card} ${styles[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
