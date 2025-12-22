'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPrivateChannelStats, PrivateChannelData } from '@/lib/youtubeAnalytics';
import styles from './PrivateDashboard.module.css';

interface Props {
    channelId: string;
}

export default function PrivateDashboard({ channelId }: Props) {
    const { data: session } = useSession();
    const [data, setData] = useState<PrivateChannelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!session || !(session as any).user.accessToken) return;

            try {
                const stats = await getPrivateChannelStats((session as any).user.accessToken, channelId);
                setData(stats);
            } catch (err) {
                console.error(err);
                setError('No se pudieron cargar los datos privados. Asegúrate de que el canal logueado es el mismo que estás analizando.');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [session, channelId]);

    if (loading) return <div className="text-center py-8">Cargando datos de YouTube Studio...</div>;
    if (error) {
        return (
            <div className="text-center py-4 text-red-400 bg-red-900/20 rounded-lg my-4">
                <p>⚠️ {error}</p>
                <p className="text-sm opacity-70 mt-1">Verifica la consola para más detalles (F12).</p>
            </div>
        );
    }
    if (!data) return null;

    return (
        <div className={styles.container}>
            <div className={styles.watermark}>STUDIO</div>
            <div className={styles.header}>
                <div className={styles.title}>
                    <span className={styles.titleIcon}>🔒</span> Analytics Privados (Últimos 30 días)
                </div>
            </div>

            <div className={styles.grid}>
                {/* Traffic Sources */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Fuentes de Tráfico</h3>
                    {data.topSources.map((source, i) => (
                        <div key={i} className={styles.metricRow}>
                            <span className={styles.metricName}>{source.source}</span>
                            <span className={styles.metricValue}>{new Intl.NumberFormat('es-MX').format(source.views)}</span>
                        </div>
                    ))}
                </div>

                {/* Demographics - Age */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Edad de la Audiencia</h3>
                    {data.demographics
                        .filter((d, i, self) => i === self.findIndex(t => t.ageGroup === d.ageGroup)) // Unique ages
                        .slice(0, 5)
                        .map((demo, i) => (
                            <div key={i} className={styles.barContainer}>
                                <span className={styles.barLabel}>{demo.ageGroup.replace('age', '')}</span>
                                <div className={styles.barBg}>
                                    <div
                                        className={styles.barFill}
                                        style={{ width: `${demo.viewerPercentage}%`, background: '#ff4d4d' }}
                                    ></div>
                                </div>
                                <span className={styles.barValue}>{demo.viewerPercentage.toFixed(1)}%</span>
                            </div>
                        ))}
                </div>

                {/* Demographics - Gender */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Género</h3>
                    {data.demographics
                        .filter((d, i, self) => i === self.findIndex(t => t.gender === d.gender))
                        .map((demo, i) => (
                            <div key={i} className={styles.metricRow}>
                                <span className={styles.metricName}>{demo.gender === 'male' ? 'Hombres' : demo.gender === 'female' ? 'Mujeres' : 'Otro'}</span>
                                <span className={styles.metricValue}>{demo.viewerPercentage.toFixed(1)}%</span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
