import { ChannelData, VideoData } from './youtube';

export interface AnalysisResult {
    strengths: string[];
    weaknesses: string[];
    actionPoints: ActionPoint[];
    score: number; // 0-100
}

export interface ActionPoint {
    id: string;
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    category: 'SEO' | 'Content' | 'Engagement';
    videoId?: string; // [NEW] Suggested video context
}

function calculateEngagement(likes: string, comments: string, views: string): number {
    const viewCount = parseInt(views) || 0;
    if (viewCount === 0) return 0;
    const interactions = (parseInt(likes) || 0) + (parseInt(comments) || 0);
    return (interactions / viewCount) * 100;
}

export function analyzeChannel(channel: ChannelData, videos: VideoData[]): AnalysisResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const actionPoints: ActionPoint[] = [];

    const subCount = parseInt(channel.statistics.subscriberCount) || 0;
    const viewCount = parseInt(channel.statistics.viewCount) || 0;
    const videoCount = parseInt(channel.statistics.videoCount) || 0;

    // 1. Consistency Analysis
    // Check upload frequency (based on last 10 videos)
    let uploadDates = videos.map(v => new Date(v.snippet.publishedAt).getTime());
    uploadDates.sort((a, b) => b - a); // Descending

    let avgGapDays = 0;
    if (uploadDates.length > 1) {
        let gaps = 0;
        for (let i = 0; i < uploadDates.length - 1; i++) {
            gaps += (uploadDates[i] - uploadDates[i + 1]);
        }
        avgGapDays = (gaps / (uploadDates.length - 1)) / (1000 * 60 * 60 * 24);
    }

    const isConsistent = avgGapDays > 0 && avgGapDays < 10; // Avg 1 video every 10 days
    if (isConsistent) {
        strengths.push('Constancia de subida');
    } else if (avgGapDays > 14) {
        weaknesses.push('Frecuencia de subida baja o irregular');
        actionPoints.push({
            id: 'ap_schedule',
            title: 'Establecer calendario de publicación',
            description: `Actualmente subes video cada ~${Math.round(avgGapDays)} días. Intenta definir un día fijo a la semana.`,
            priority: 'High',
            category: 'Content'
        });
    }

    // 2. Engagement Analysis
    const avgEngagement = videos.reduce((acc, v) => acc + calculateEngagement(v.statistics.likeCount, v.statistics.commentCount, v.statistics.viewCount), 0) / (videos.length || 1);

    if (avgEngagement > 4) { // > 4% is very good
        strengths.push('Alto Engagement Rate');
    } else if (avgEngagement < 2) {
        weaknesses.push('Baja interacción (Likes/Comentarios)');
        actionPoints.push({
            id: 'ap_cta',
            title: 'Mejorar Call-to-Action (CTA)',
            description: 'Pide explícitamente likes y comentarios con una pregunta específica en tus videos.',
            priority: 'Medium',
            category: 'Engagement'
        });
    }

    // 3. SEO Analysis (Tags)
    const videosWithTags = videos.filter(v => v.snippet.tags && v.snippet.tags.length > 5).length;
    if (videosWithTags === videos.length) {
        strengths.push('Buen uso de etiquetas (SEO)');
    } else {
        weaknesses.push('Etiquetado SEO deficiente');
        actionPoints.push({
            id: 'ap_seo',
            title: 'Optimizar Etiquetas de Video',
            description: 'Asegúrate de usar al menos 5-10 tags relevantes en cada video incluyendo variaciones de palabras clave.',
            priority: 'High',
            category: 'SEO'
        });
    }

    // 4. Titles & Thumbnails (Heuristic)
    // Check title length
    const shortTitles = videos.filter(v => v.snippet.title.length < 20).length;
    if (shortTitles > 2) {
        weaknesses.push('Títulos demasiado cortos');
        actionPoints.push({
            id: 'ap_titles',
            title: 'Alargar y detallar títulos',
            description: 'Los títulos cortos pierden oportunidades de búsqueda. Usa entre 40-60 caracteres.',
            priority: 'Medium',
            category: 'SEO'
        });
    }

    // Calculate generic score
    let score = 50;
    score += strengths.length * 10;
    score -= weaknesses.length * 5;
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return { strengths, weaknesses, actionPoints, score };
}
