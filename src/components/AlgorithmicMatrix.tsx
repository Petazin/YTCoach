'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { VideoData } from '@/lib/youtube';
import { getVideoSpecificAnalytics, VideoAnalytics } from '@/lib/youtubeAnalytics';
import { calculateAlgorithmicMetrics, AlgorithmicMetrics } from '@/lib/insightEngine';
import styles from './AlgorithmicMatrix.module.css';

interface Props {
    videos: VideoData[];
}

interface RowData {
    video: VideoData;
    metrics: AlgorithmicMetrics | null;
}

export default function AlgorithmicMatrix({ videos }: Props) {
    const { data: session } = useSession();
    const [rows, setRows] = useState<RowData[]>([]);
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState(false);

    useEffect(() => {
        if (!session?.user || videos.length === 0) return;

        const fetchData = async () => {
            setLoading(true);
            const newRows: RowData[] = [];

            // Fetch top 5 videos to save quota/time
            const videosToAnalyze = videos.slice(0, 5);

            for (const video of videosToAnalyze) {
                try {
                    const analytics = await getVideoSpecificAnalytics(
                        (session as any).user.accessToken,
                        video.id
                    );

                    let metrics = null;
                    if (analytics) {
                        metrics = calculateAlgorithmicMetrics(video, analytics);
                    }

                    newRows.push({ video, metrics });
                } catch (err: any) {
                    if (err.message === 'UNAUTHENTICATED') {
                        setAuthError(true);
                        break; // Stop fetching to avoid spamming errors
                    }
                    console.error(err);
                }
            }

            setRows(newRows);
            setLoading(false);
        };

        fetchData();
    }, [videos, session]);

    if (!session) return null;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>🧬 Matriz de Decodificación Algorítmica</h2>

            {authError && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-center text-xs">
                    ⚠️ Sesión expirada. Recarga la página.
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>Analizando métricas profundas...</div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Video</th>
                            <th title="Total estimated minutes watched">Tiempo Total</th>
                            <th title="(AVD / Duration) * 100">Retención Real</th>
                            <th title="Click Through Rate (Annotations/Cards proxy if main unavailable)">CTR</th>
                            <th title="Views / Hours since publish">Velocidad (V/h)</th>
                            <th title="Engagement Ratio">Eng. Ratio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.video.id}>
                                <td>
                                    <div className={styles.videoCell}>
                                        <img
                                            src={row.video.snippet.thumbnails.default.url}
                                            alt=""
                                            className={styles.thumb}
                                        />
                                        <span className={styles.videoTitle}>{row.video.snippet.title}</span>
                                    </div>
                                </td>
                                <td className={styles.metricCell}>
                                    {row.metrics ? `${Math.round(row.metrics.watchTimeTotal)} min` : '-'}
                                </td>
                                <td className={styles.metricCell}>
                                    {row.metrics ? (
                                        <span className={row.metrics.retentionRelative > 50 ? styles.good : ''}>
                                            {row.metrics.retentionRelative.toFixed(1)}%
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className={styles.metricCell}>
                                    {row.metrics ? `${row.metrics.ctr.toFixed(2)}%` : '-'}
                                </td>
                                <td className={styles.metricCell}>
                                    {row.metrics ? Math.round(row.metrics.velocity) : '-'}
                                </td>
                                <td className={styles.metricCell}>
                                    {row.metrics ? `${row.metrics.engagementRatio.toFixed(1)}%` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
