import { VideoData } from './youtube';
import { VideoAnalytics } from './youtubeAnalytics';

export type ContentType = 'video' | 'short' | 'live';

export interface Insight {
    type: 'strength' | 'weakness' | 'opportunity';
    contentType: ContentType;
    title: string;
    description: string;
    metric?: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
}

export interface AlgorithmicMetrics {
    watchTimeTotal: number;       // 1. Critical
    retentionRelative: number;    // 2. Quality
    ctr: number;                  // 3. Filter
    satisfaction: number;         // 4. Feedback (Like Ratio)
    velocity: number;             // 5. Trend (Views/Hour)
    sessionValue: number;         // 6. Contiguity (Placeholder)
    engagementRatio: number;      // 7. Community
}

export function calculateAlgorithmicMetrics(video: VideoData, analytics: VideoAnalytics): AlgorithmicMetrics {
    const durationSec = parseDuration(video.contentDetails.duration);
    const publishDate = new Date(video.snippet.publishedAt);
    const hoursSincePublish = Math.max(1, (new Date().getTime() - publishDate.getTime()) / (1000 * 60 * 60));

    // 1. Watch Time (from Analytics)
    const watchTimeTotal = analytics.estimatedMinutesWatched;

    // 2. Retention Relative (AVD / Duration)
    const retentionRelative = durationSec > 0
        ? (analytics.averageViewDuration / durationSec) * 100
        : 0;

    // 3. CTR (from Analytics)
    const ctr = analytics.annotationClickThroughRate; // Using available API metric

    // 4. Satisfaction (Like Ratio)
    const views = analytics.views || 1;
    const satisfaction = (analytics.likes / views) * 100;

    // 5. Velocity (Views / Hours)
    const velocity = views / hoursSincePublish;

    // 6. Session Value (Placeholder - unavailable via API)
    const sessionValue = 0;

    // 7. Engagement Ratio (Interactions / Views)
    const engagementRatio = ((analytics.likes + analytics.comments) / views) * 100;

    return {
        watchTimeTotal,
        retentionRelative,
        ctr,
        satisfaction,
        velocity,
        sessionValue,
        engagementRatio
    };
}

// Helper to parse ISO 8601 duration (PT1M30S)
function parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (parseInt(match[1]) || 0) * 3600;
    const minutes = (parseInt(match[2]) || 0) * 60;
    const seconds = parseInt(match[3]) || 0;

    return hours + minutes + seconds;
}

export function classifyContent(video: VideoData): ContentType {
    // Live detection (snippet.liveBroadcastContent)
    // 'live' = currently live, 'upcoming' = scheduled, 'none' = VOD
    // Note: Completed lives often appear as 'none' but have certain characteristics or tags
    // For simplicity in MVP, distinct Short vs Long first.

    const durationSec = parseDuration(video.contentDetails.duration);

    // Shorts are usually < 60s and vertical (we can't easily check aspect ratio without downloading, 
    // but < 60s is a strong proxy combined with high view velocity if we had it).
    // The official API mostly relies on < 60s rule for Shorts category.
    if (durationSec > 0 && durationSec <= 60) {
        return 'short';
    }

    // Check if it was a live stream (often has 'live' in broadcast content or specific tags)
    // This is approximate for VODs of lives.
    return 'video';
}

export function generateAdvancedInsights(videos: VideoData[]): Insight[] {
    const insights: Insight[] = [];

    // Group content
    const segments = {
        video: videos.filter(v => classifyContent(v) === 'video'),
        short: videos.filter(v => classifyContent(v) === 'short'),
        live: videos.filter(v => classifyContent(v) === 'live'), // Currently logic above doesn't set 'live' yet for VODs
    };

    // --- SHORTS STRATEGY ---
    if (segments.short.length > 0) {
        const avgShortViews = segments.short.reduce((a, b) => a + parseInt(b.statistics.viewCount), 0) / segments.short.length;

        segments.short.forEach(short => {
            const views = parseInt(short.statistics.viewCount);
            const likes = parseInt(short.statistics.likeCount);
            const engagement = (likes / views) * 100;

            // Viral Potential but Low Engagement
            if (views > avgShortViews * 1.5 && engagement < 3) {
                insights.push({
                    type: 'opportunity',
                    contentType: 'short',
                    title: 'Alto Alcance, Interacción Baja',
                    description: `El Short "${short.snippet.title.substring(0, 30)}..." llegó a mucha gente pero pocos dieron like.`,
                    metric: `${engagement.toFixed(1)}% Likes/Views`,
                    suggestion: 'Tu gancho visual funciona, pero el contenido no satisface. Intenta pedir que se suscriban o den like visualmente a la mitad del video.',
                    priority: 'high'
                });
            }
        });
    }

    // --- VIDEO STRATEGY ---
    if (segments.video.length > 0) {
        const avgViews = segments.video.reduce((a, b) => a + parseInt(b.statistics.viewCount), 0) / segments.video.length;

        segments.video.forEach(video => {
            const views = parseInt(video.statistics.viewCount);
            const comments = parseInt(video.statistics.commentCount);
            const commentRatio = (comments / views) * 100;

            // Community Builder
            if (commentRatio > 0.5) { // 0.5% comments is very high
                insights.push({
                    type: 'strength',
                    contentType: 'video',
                    title: 'Generador de Comunidad',
                    description: `El video "${video.snippet.title.substring(0, 30)}..." provocó mucha conversación.`,
                    metric: `${commentRatio.toFixed(2)}% Comentarios/Visitas`,
                    suggestion: 'Este tema toca la fibra sensible. Haz una segunda parte o responde a los comentarios con otro video (Video Reply).',
                    priority: 'medium'
                });
            }

            // Underperformer
            if (views < avgViews * 0.4) {
                insights.push({
                    type: 'weakness',
                    contentType: 'video',
                    title: 'Video Estancado',
                    description: `"${video.snippet.title.substring(0, 30)}..." tiene un 60% menos visitas que tu media.`,
                    suggestion: 'Cambia la miniatura y el título AHORA. Usa palabras clave más buscadas o una imagen con más contraste.',
                    priority: 'high'
                });
            }
        });
    }

    return insights.slice(0, 5); // Return top 5 insights
}
