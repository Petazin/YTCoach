'use client';

// 'use client' is still needed for useSession maybe? Or we can make it Server Component if we extract Login?
// Let's keep it client for now for simplicity of LoginButton interaction but remove the heavy states.
import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import LoginButton from '@/components/LoginButton';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.brandWhite}>YT</span>
          <span className={styles.brandGradient}>Coach</span>
        </h1>
        <p className={styles.subtitle}>Analiza, Optimiza y Crece en YouTube con IA</p>
        <div className="mt-6">
          <LoginButton />
        </div>
      </div>

      <SearchBar mode="redirect" isLoading={false} />

      {/* Empty state or specific intro content could go here */}
      <div className="text-center mt-12 text-gray-500 max-w-md mx-auto">
        <p>Ingresa un ID de canal o Handle para obtener un informe detallado con IA.</p>
      </div>
    </main>
  );
}
