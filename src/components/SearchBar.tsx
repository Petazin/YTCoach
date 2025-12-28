'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './SearchBar.module.css';

import { useRouter } from 'next/navigation';

interface SearchBarProps {
    onSearch?: (term: string) => void;
    isLoading?: boolean;
    mode?: 'redirect' | 'direct'; // 'direct' calls onSearch, 'redirect' pushes to URL
    className?: string; // [NEW]
}

export default function SearchBar({ onSearch, isLoading = false, mode = 'direct', className = '' }: SearchBarProps) {
    const [term, setTerm] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!term.trim()) return;

        if (mode === 'redirect') {
            // Basic heuristic: Is it an ID or Handle?
            // If Handle, we might need to resolve it first OR just assume the API supports both in URL?
            // API supports both in fetch, but our route is /channel/[id]. 
            // Ideally we resolve handle -> ID on client OR server.
            // For now, let's pass the raw term to the route. Wait, page.tsx expects ID in params...
            // Actually getChannelDetails supports "forHandle" so if we pass handle in URL it might work if we tweak page.tsx logic
            // But standard is /channel/UC..... 
            // If user types @handle, we probably shouldn't redirect blindly to /channel/@handle unless we handle that.
            // Let's rely on props for now or simplistic redirect.

            // FIX: We need to resolve it or let the landing page handle it.
            // Actually, simplest is: Landing page keeps using Client Fetch (onSearch), 
            // THEN pushes to router on success?
            // OR: We redirect to `/channel/${term}` and let the server page handle resolution.

            // Let's do the redirect strategy:
            router.push(`/channel/${encodeURIComponent(term.trim())}`);
        } else {
            if (onSearch) onSearch(term.trim());
        }
    };

    return (
        <div className={`${styles.container} ${className}`}>
            <form onSubmit={handleSubmit} className={styles.wrapper}>
                <Input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="ID del canal o Handle (ej. @PewDiePie)"
                    className={styles.input}
                    disabled={isLoading}
                    inputSize="lg"
                />
                <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                    variant="primary"
                    className={styles.button}
                >
                    Analizar
                </Button>
            </form>
            <div className={styles.glow}></div>
            <p className={styles.hint}>
                Usa el ID del canal (UC...) o el Handle (@Nombre) para analizar.
            </p>
        </div>
    );
}
