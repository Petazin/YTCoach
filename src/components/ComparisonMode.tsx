'use client';

import { useState, useEffect, useMemo } from 'react';
import { VideoData } from '@/lib/youtube';
import { VideoAnalytics, getVideoSpecificAnalytics, getPrivateChannelStats, PrivateChannelData } from '@/lib/youtubeAnalytics';
import { classifyContent } from '@/lib/insightEngine';
import AIChatWidget from './AIChatWidget';
import styles from './ComparisonMode.module.css';
import { generateExpertReport, ExpertReport } from '@/lib/expertAnalysis';

// ... (imports)

// ...

// Helper to calc Engagement Rate (Likes / Views) * 100
const getEngRate = (stats?: any) => {
    if (!stats) return '0';
    const views = parseInt(stats.viewCount || stats.views || '0');
    if (views === 0) return '0';
    const likes = parseInt(stats.likeCount || stats.likes || '0');
    return ((likes / views) * 100).toFixed(2);
};

interface Props {
    videos: VideoData[];
    accessToken?: string;
}

export default function ComparisonMode({ videos, accessToken }: Props) {
    const [videoA, setVideoA] = useState<VideoData | null>(null);
    const [videoB, setVideoB] = useState<VideoData | null>(null);

    // Detailed analytics (private data if available)
    const [analyticsA, setAnalyticsA] = useState<VideoAnalytics | null>(null);
    const [analyticsB, setAnalyticsB] = useState<VideoAnalytics | null>(null);

    const [isSelecting, setIsSelecting] = useState<'A' | 'B' | null>(null);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ExpertReport | null>(null);
    const [channelStats, setChannelStats] = useState<PrivateChannelData | null>(null);
    const [authError, setAuthError] = useState(false);

    // Fetch Channel Global Stats for AVG fallback
    useEffect(() => {
        if (accessToken && !channelStats) {
            getPrivateChannelStats(accessToken, 'MINE')
                .then(setChannelStats)
                .catch(err => {
                    if (err.message === 'UNAUTHENTICATED') setAuthError(true);
                    else console.error(err);
                });
        }
    }, [accessToken]);

    // Helper to calculate Average Video
    const averages = useMemo(() => {
        if (videos.length === 0) return { video: null, short: null };

        const longVideos = videos.filter(v => classifyContent(v) === 'video');
        const shortVideos = videos.filter(v => classifyContent(v) === 'short');

        const calcAvg = (list: VideoData[], title: string, id: string) => {
            if (list.length === 0) return null;
            const totalViews = list.reduce((acc, v) => acc + parseInt(v.statistics.viewCount), 0);
            const totalLikes = list.reduce((acc, v) => acc + parseInt(v.statistics.likeCount || '0'), 0);
            const totalComments = list.reduce((acc, v) => acc + parseInt(v.statistics.commentCount || '0'), 0);

            return {
                id: id, // AVG_VIDEO or AVG_SHORT
                snippet: {
                    title: title,
                    description: 'Rendimiento medio calculado.',
                    publishedAt: new Date().toISOString(),
                    thumbnails: {
                        default: { url: 'https://placehold.co/120x90/333/FFF?text=AVG' },
                        medium: { url: 'https://placehold.co/320x180/333/FFF?text=AVG' },
                        high: { url: 'https://placehold.co/480x360/333/FFF?text=AVG' }
                    },
                    channelTitle: 'Tu Canal',
                    categoryId: '0'
                },
                statistics: {
                    viewCount: Math.round(totalViews / list.length).toString(),
                    likeCount: Math.round(totalLikes / list.length).toString(),
                    favoriteCount: '0',
                    commentCount: Math.round(totalComments / list.length).toString()
                },
                contentDetails: {
                    duration: 'PT0M0S',
                    dimension: '2d',
                    definition: 'hd',
                    caption: 'false',
                    licensedContent: false
                }
            } as VideoData;
        };

        return {
            video: calcAvg(longVideos, '📊 Promedio (Videos)', 'AVG_VIDEO'),
            short: calcAvg(shortVideos, '📱 Promedio (Shorts)', 'AVG_SHORT')
        };
    }, [videos]);

    // Initial load: Select first two videos by default if available
    useEffect(() => {
        if (!videoA && videos.length > 0) setVideoA(videos[0]);
        if (!videoB && averages.video) setVideoB(averages.video as VideoData);
    }, [videos, averages]);

    // Fetch deep analytics when videos change
    useEffect(() => {
        async function fetchComparison() {
            setLoading(true);

            try {
                const getAnalytics = (video: VideoData | null): Promise<VideoAnalytics | null> => {
                    if (!video) return Promise.resolve(null);

                    // Synthetic Analytics for Averages
                    if (video.id.startsWith('AVG')) {
                        if (!channelStats) return Promise.resolve(null);

                        // Calculate simple averages from the last 30 days of channel data
                        const avgDuration = channelStats.dailyMetrics.reduce((acc, d) => acc + d.averageViewDuration, 0) / channelStats.dailyMetrics.length || 0;
                        const avgCTR = channelStats.dailyMetrics.reduce((acc, d) => acc + d.annotationClickThroughRate, 0) / channelStats.dailyMetrics.length || 0;

                        return Promise.resolve({
                            videoId: video.id,
                            views: parseInt(video.statistics.viewCount),
                            likes: parseInt(video.statistics.likeCount || '0'),
                            comments: parseInt(video.statistics.commentCount || '0'),
                            estimatedMinutesWatched: 0, // Not critical for expert analysis current logic
                            averageViewDuration: avgDuration,
                            annotationClickThroughRate: avgCTR
                        });
                    }

                    // Real Video
                    if (accessToken) return getVideoSpecificAnalytics(accessToken, video.id);
                    return Promise.resolve(null);
                };

                const [resA, resB] = await Promise.all([
                    getAnalytics(videoA),
                    getAnalytics(videoB)
                ]);

                setAnalyticsA(resA);
                setAnalyticsB(resB);
            } catch (err: any) {
                if (err.message === 'UNAUTHENTICATED') {
                    setAuthError(true);
                } else {
                    console.error("Error fetching comparison analytics", err);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchComparison();
    }, [videoA, videoB, accessToken, channelStats]);

    // Generate Report when data is ready
    useEffect(() => {
        if (videoA && videoB) {
            const newReport = generateExpertReport(videoA, videoB, analyticsA, analyticsB);
            setReport(newReport);
        }
    }, [videoA, videoB, analyticsA, analyticsB]);

    const handleSelectVideo = (video: VideoData) => {
        if (isSelecting === 'A') setVideoA(video);
        if (isSelecting === 'B') setVideoB(video);
        setIsSelecting(null);
    };

    const renderMetricRow = (label: string, valA: string | number, valB: string | number, format: 'number' | 'time' | 'percent' = 'number', higherIsBetter = true) => {
        // Parse values for comparison
        let numA = typeof valA === 'string' ? parseFloat(valA.replace(/,/g, '')) : valA;
        let numB = typeof valB === 'string' ? parseFloat(valB.replace(/,/g, '')) : valB;

        if (format === 'time' && typeof valA === 'string' && valA.includes(':')) {
            // Simple fallback for pre-formatted time, though ideally we pass raw seconds
            numA = 0; numB = 0;
        }

        let delta = numA - numB;
        let diffStr = '';
        let winner: 'A' | 'B' | 'Tie' = 'Tie';

        if (numA > numB) winner = 'A';
        if (numB > numA) winner = 'B';

        // Calculate Delta Display
        if (format === 'percent') {
            diffStr = `${Math.abs(delta).toFixed(1)}%`;
        } else if (format === 'time') {
            // Assume raw seconds input for valid delta
            diffStr = `${Math.abs(delta).toFixed(0)}s`;
        } else {
            // Compact number
            diffStr = new Intl.NumberFormat('en', { notation: 'compact' }).format(Math.abs(delta));
        }

        return (
            <div className={styles.metricRow}>
                <div className={`${styles.metricCell} ${winner === 'A' ? styles.winnerCell : ''}`}>
                    <span className={styles.metricLabel}>{label}</span>
                    <span className={styles.metricValue}>
                        {format === 'percent' ? `${valA}%` : valA}
                    </span>
                </div>

                <div className={styles.deltaCell}>
                    {winner === 'A' ? <span className={styles.positive}>{'<<'}</span> : <span className={styles.neutral}></span>}
                    <span className={styles.deltaValue}>{diffStr}</span>
                    {winner === 'B' ? <span className={styles.positive}>{'>>'}</span> : <span className={styles.neutral}></span>}
                </div>

                <div className={`${styles.metricCell} ${winner === 'B' ? styles.winnerCell : ''}`}>
                    <span className={styles.metricLabel}>{label}</span>
                    <span className={styles.metricValue}>
                        {format === 'percent' ? `${valB}%` : valB}
                    </span>
                </div>
            </div>
        );
    };

    // Helper to calc Engagement Rate (Likes / Views) * 100
    const getEngRate = (stats?: any) => {
        if (!stats) return '0';
        const views = parseInt(stats.viewCount || stats.views || '0');
        if (views === 0) return 0;
        const likes = parseInt(stats.likeCount || stats.likes || '0');
        return ((likes / views) * 100).toFixed(2);
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredVideos = videos.filter(v => {
        if (searchTerm === '') return true;
        return v.snippet.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className={styles.container}>
            <div className={styles.title}>⚔️ Versus Mode</div>

            {authError && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-6 text-center text-sm">
                    ⚠️ <strong>Sesión Expirada:</strong> Google ha revocado el acceso.
                    <button onClick={() => window.location.reload()} className="ml-2 underline hover:text-white">
                        Recarga la página y vuelve a iniciar sesión
                    </button>.
                </div>
            )}

            {/* Video Selectors */}
            <div className={styles.selectorContainer}>
                {/* Selector A */}
                <div className={`${styles.selector} ${videoA ? styles.selected : ''}`} onClick={() => { setIsSelecting('A'); setSearchTerm(''); }}>
                    {videoA ? (
                        <div className={styles.selectedCard}>
                            <img src={videoA.snippet.thumbnails.medium.url} className={styles.thumbnail} />
                            <div className={styles.videoTitle}>{videoA.snippet.title}</div>
                        </div>
                    ) : (
                        <span>Seleccionar Video A</span>
                    )}
                </div>

                <div className={styles.vsBadge}>VS</div>

                {/* Selector B */}
                <div className={`${styles.selector} ${videoB ? styles.selected : ''}`} onClick={() => { setIsSelecting('B'); setSearchTerm(''); }}>
                    {videoB ? (
                        <div className={styles.selectedCard}>
                            <img src={videoB.snippet.thumbnails.medium.url} className={styles.thumbnail} />
                            <div className={styles.videoTitle}>{videoB.snippet.title}</div>
                        </div>
                    ) : (
                        <span>Seleccionar Video B</span>
                    )}
                </div>
            </div>

            {/* Comparison Table */}
            {videoA && videoB && (
                <div className={styles.comparisonTable}>
                    {/* Public Metrics */}
                    {renderMetricRow('Vistas',
                        parseInt(videoA.statistics.viewCount).toLocaleString(),
                        parseInt(videoB.statistics.viewCount).toLocaleString()
                    )}

                    {renderMetricRow('Engagement Rate',
                        getEngRate(videoA.statistics),
                        getEngRate(videoB.statistics),
                        'percent'
                    )}

                    {/* Private Metrics (if available) */}
                    {analyticsA && analyticsB ? (
                        <>
                            {renderMetricRow('Duración Promedio',
                                `${Math.floor(analyticsA.averageViewDuration / 60)}:${(analyticsA.averageViewDuration % 60).toString().padStart(2, '0')}`,
                                `${Math.floor(analyticsB.averageViewDuration / 60)}:${(analyticsB.averageViewDuration % 60).toString().padStart(2, '0')}`,
                                'time'
                            )}
                            {/* Calculated AVD Delta for Logic */}
                            {/* We can just pass the raw seconds if we refactor renderMetricRow, but for now visual comparison is ok */}
                        </>
                    ) : (
                        loading && <div className="col-span-3 text-center py-4 opacity-50 text-sm">Cargando datos privados para mayor precisión...</div>
                    )}
                </div>
            )}

            {/* Insights / Conclusion */}
            {videoA && videoB && (
                <div className="mt-8 p-4 bg-white/5 rounded-lg text-center">
                    <h3 className="text-xl font-bold mb-2">🏆 Análisis del Ganador</h3>
                    <p className="text-gray-300">
                        {parseInt(videoA.statistics.viewCount) > parseInt(videoB.statistics.viewCount)
                            ? `El video "${videoA.snippet.title}" ganó en alcance.`
                            : `El video "${videoB.snippet.title}" ganó en alcance.`}
                        {' '}
                        {parseFloat(getEngRate(videoA.statistics)) > parseFloat(getEngRate(videoB.statistics))
                            ? `A tiene mejor engagement (${getEngRate(videoA.statistics)}%).`
                            : `B tiene mejor engagement (${getEngRate(videoB.statistics)}%).`}
                    </p>
                </div>
            )}

            {/* EXPERT ANALYSIS SECTION */}
            {report && videoA && videoB && (
                <div className="mt-8 border-t border-gray-700 pt-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        🧠 Análisis Experto <span className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white font-normal uppercase">AI Logic</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* The Verdict */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700">
                            <h4 className="text-gray-400 text-sm uppercase mb-2 tracking-wider">Veredicto Final</h4>
                            <p className="text-lg leading-relaxed font-light">
                                {report.verdict}
                            </p>

                            <div className="mt-4 flex gap-2">
                                {report.recommendations.map((rec, i) => (
                                    <div key={i} className="text-xs bg-yellow-900/30 text-yellow-200 border border-yellow-700/50 p-2 rounded">
                                        💡 {rec}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Factor Breakdown */}
                        <div className="space-y-3">
                            <FactorRow label="Estructura del Título" dimension={report.dimensions.title} />
                            <FactorRow label="Poder de Miniatura (Est.)" dimension={report.dimensions.thumbnail} />
                            <FactorRow label="Conexión (Engagement)" dimension={report.dimensions.engagement} />
                            <FactorRow label="Retención de Audiencia" dimension={report.dimensions.retention} />
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Modal */}
            {isSelecting && (
                <div className={styles.modalOverlay} onClick={() => setIsSelecting(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Seleccionar Video {isSelecting}</h3>
                            <button className={styles.closeBtn} onClick={() => setIsSelecting(null)}>×</button>
                        </div>
                        <div className="p-4 border-b border-gray-700">
                            <input
                                type="text"
                                placeholder="🔍 Buscar por título..."
                                className="w-full bg-black/30 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.videoList}>
                            {/* Option: Average Videos */}
                            {averages.video && (searchTerm === '' || 'promedio videos media'.includes(searchTerm.toLowerCase())) && (
                                <div className={`${styles.videoOption} border border-dashed border-gray-500 bg-gray-900/50`} onClick={() => handleSelectVideo(averages.video!)}>
                                    <div className="w-[120px] h-[67px] bg-gray-800 flex items-center justify-center rounded text-2xl">
                                        📊
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="font-bold text-yellow-500">Promedio (Videos Largos)</div>
                                        <div className="text-xs text-gray-400">Media de tus videos horizontales</div>
                                    </div>
                                </div>
                            )}

                            {/* Option: Average Shorts */}
                            {averages.short && (searchTerm === '' || 'promedio shorts media'.includes(searchTerm.toLowerCase())) && (
                                <div className={`${styles.videoOption} border border-dashed border-gray-500 bg-gray-900/50`} onClick={() => handleSelectVideo(averages.short!)}>
                                    <div className="w-[120px] h-[67px] bg-gray-800 flex items-center justify-center rounded text-2xl">
                                        📱
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="font-bold text-red-500">Promedio (Shorts)</div>
                                        <div className="text-xs text-gray-400">Media de tus videos verticales</div>
                                    </div>
                                </div>
                            )}

                            {filteredVideos.map(video => (
                                <div key={video.id} className={styles.videoOption} onClick={() => handleSelectVideo(video)}>
                                    <img src={video.snippet.thumbnails.default.url} />
                                    <div>
                                        <div className="font-bold line-clamp-1">{video.snippet.title}</div>
                                        <div className="text-xs text-gray-400">{new Date(video.snippet.publishedAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                            {filteredVideos.length === 0 && (
                                <div className="text-center py-8 text-gray-500">No hay videos que coincidan con "{searchTerm}"</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* AI Analyst Widget */}
            {videoA && videoB && (
                <AIChatWidget contextData={{
                    videoA: { title: videoA.snippet.title, stats: videoA.statistics, analytics: analyticsA },
                    videoB: { title: videoB.snippet.title, stats: videoB.statistics, analytics: analyticsB },
                    comparison: report ? {
                        winner: report.winnerId,
                        verdict: report.verdict,
                        scoreA: report.scoreA,
                        scoreB: report.scoreB
                    } : null
                }} />
            )}
        </div>
    );
}

function FactorRow({ label, dimension }: { label: string, dimension: any }) {
    let color = 'text-gray-500';
    let icon = '➖';
    if (dimension.winner !== 'Tie') {
        // We act as if 'A' is left/green for demonstration, but here we just show who won
        color = 'text-green-400';
        icon = '✅';
    }

    return (
        <div className="flex items-center justify-between bg-white/5 p-3 rounded">
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <div className={`text-xs ${color} flex items-center gap-2 text-right`}>
                <span>{dimension.reason}</span>
                {dimension.winner !== 'Tie' && <span className="font-bold bg-white/10 px-1 rounded">Gana {dimension.winner}</span>}
            </div>
        </div>
    );
}
