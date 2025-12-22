'use client';

import { useState } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    onSearch: (term: string) => void;
    isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
    const [term, setTerm] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim()) {
            onSearch(term.trim());
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.wrapper}>
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="ID del canal o Handle (ej. @PewDiePie)"
                    className={styles.input}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.button}
                >
                    {isLoading ? '...' : 'Analizar'}
                </button>
            </form>
            <div className={styles.glow}></div>
            <p className={styles.hint}>
                Usa el ID del canal (UC...) o el Handle (@Nombre) para analizar.
            </p>
        </div>
    );
}
