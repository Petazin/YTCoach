'use client';

import { ChannelData, VideoData } from '@/lib/youtube';
import { AnalysisResult } from '@/lib/analysis';
import { useTracker } from '@/hooks/useTracker';
import styles from './StatsDashboard.module.css';

interface Props {
    channel: ChannelData;
    analysis: AnalysisResult;
    videos: VideoData[]; // Potentially for further visualization
}

export default function StatsDashboard({ channel, analysis, videos }: Props) {
    const { trackAction, trackedActions, getImpact, isLoaded } = useTracker();

    const formatNumber = (num: string) => {
        return new Intl.NumberFormat('es-MX', { notation: 'compact' }).format(parseInt(num));
    };

    return (
        <div className="container animate-fadeIn">
            {/* Header */}
            <div className="text-center mb-12">
                <img
                    src={channel.snippet.thumbnails.medium.url}
                    alt={channel.snippet.title}
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-800"
                />
                <h1 className="text-4xl font-bold text-white mb-2">{channel.snippet.title}</h1>
                <p className="text-gray-400 max-w-2xl mx-auto line-clamp-2">{channel.snippet.description}</p>
            </div>

            {/* KPI Grid */}
            <div className={styles.grid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatNumber(channel.statistics.subscriberCount)}</div>
                    <div className={styles.statLabel}>Suscriptores</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatNumber(channel.statistics.viewCount)}</div>
                    <div className={styles.statLabel}>Vistas Totales</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{formatNumber(channel.statistics.videoCount)}</div>
                    <div className={styles.statLabel}>Videos</div>
                </div>
                <div className={styles.statCard} style={{ borderColor: analysis.score > 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    <div className={styles.statValue}>{Math.round(analysis.score)}</div>
                    <div className={styles.statLabel}>Channel Score</div>
                </div>
            </div>

            {/* Analysis Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Análisis de Rendimiento</h2>
                <div className={styles.analysisGrid}>
                    <div className={styles.listBox}>
                        <h3 className={`${styles.listHeader} ${styles.strengthsHeader}`}>
                            <span>🚀</span> Puntos Fuertes
                        </h3>
                        <ul className={styles.list}>
                            {analysis.strengths.length > 0 ? (
                                analysis.strengths.map((s, i) => <li key={i} className={styles.listItem}>{s}</li>)
                            ) : (
                                <li className={styles.listItem}>No se detectaron fortalezas claras.</li>
                            )}
                        </ul>
                    </div>
                    <div className={styles.listBox}>
                        <h3 className={`${styles.listHeader} ${styles.weaknessesHeader}`}>
                            <span>⚠️</span> Áreas de Mejora
                        </h3>
                        <ul className={styles.list}>
                            {analysis.weaknesses.length > 0 ? (
                                analysis.weaknesses.map((w, i) => <li key={i} className={styles.listItem}>{w}</li>)
                            ) : (
                                <li className={styles.listItem}>¡Excelente trabajo! No hay debilidades críticas.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Action Points */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Plan de Acción</h2>
                <div>
                    {analysis.actionPoints.map((ap) => {
                        const isTracked = trackedActions.some(t => t.id === ap.id && t.channelId === channel.id);
                        return (
                            <div key={ap.id} className={styles.actionCard}>
                                <div className={styles.actionContent}>
                                    <span className={`${styles.badge} ${ap.priority === 'High' ? styles.badgeHigh : styles.badgeMedium}`}>
                                        {ap.priority} Priority
                                    </span>
                                    <h4>{ap.title}</h4>
                                    <p>{ap.description}</p>
                                </div>
                                <button
                                    className={styles.trackBtn}
                                    onClick={() => trackAction(ap.id, channel.id, ap.title, channel.statistics)}
                                    disabled={isTracked}
                                >
                                    {isTracked ? '✓ En seguimiento' : 'Implementar'}
                                </button>
                            </div>
                        );
                    })}
                    {analysis.actionPoints.length === 0 && (
                        <p className="text-gray-500 text-center">No hay sugerencias pendientes.</p>
                    )}
                </div>
            </div>

            {/* Tracker Section - Only show if there are tracked items for THIS channel */}
            {isLoaded && trackedActions.some(t => t.channelId === channel.id) && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Seguimiento de Impacto</h2>
                    <div className={styles.impactGrid}>
                        {trackedActions.filter(t => t.channelId === channel.id).map(action => {
                            const impact = getImpact(action.id, channel.statistics);
                            return (
                                <div key={action.id} className={styles.impactCard}>
                                    <h4 className="font-bold text-white mb-2">{action.title}</h4>
                                    <p className="text-xs text-gray-400">Implementado hace {impact?.daysSince} días</p>

                                    {impact && (
                                        <div className={styles.impactMetrics}>
                                            <div className={styles.metric}>
                                                <span className={styles.metricVal}>{impact.viewGrowth > 0 ? '+' : ''}{formatNumber(impact.viewGrowth.toString())}</span>
                                                <span className={styles.metricLabel}>Vistas Nuevas</span>
                                            </div>
                                            <div className={styles.metric}>
                                                <span className={styles.metricVal}>{impact.subGrowth > 0 ? '+' : ''}{impact.subGrowth}</span>
                                                <span className={styles.metricLabel}>Subs Nuevos</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
