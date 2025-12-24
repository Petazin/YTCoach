import { VideoData } from './youtube';
import { VideoAnalytics } from './youtubeAnalytics';

export interface ExpertReport {
    winnerId: string;
    verdict: string;
    scoreA: number;
    scoreB: number;
    dimensions: {
        title: AnalysisDimension;
        thumbnail: AnalysisDimension;
        engagement: AnalysisDimension;
        retention: AnalysisDimension;
    };
    recommendations: string[];
}

interface AnalysisDimension {
    winner: 'A' | 'B' | 'Tie';
    score: number; // 0-10
    reason: string;
}

export function generateExpertReport(
    videoA: VideoData,
    videoB: VideoData,
    statsA: VideoAnalytics | null,
    statsB: VideoAnalytics | null
): ExpertReport {
    const report: ExpertReport = {
        winnerId: '',
        verdict: '',
        scoreA: 0,
        scoreB: 0,
        dimensions: {
            title: analyzeTitles(videoA.snippet.title, videoB.snippet.title),
            thumbnail: analyzeThumbnails(videoA, videoB, statsA, statsB),
            engagement: analyzeEngagement(videoA, videoB),
            retention: analyzeRetention(statsA, statsB),
        },
        recommendations: [],
    };

    // Calculate Total Scores (Weighted)
    // Retention is King (40%), CTR/Thumbnail (30%), Engagement (20%), Title Optimization (10%)
    report.scoreA =
        (report.dimensions.retention.winner === 'A' ? 40 : 0) +
        (report.dimensions.thumbnail.winner === 'A' ? 30 : 0) +
        (report.dimensions.engagement.winner === 'A' ? 20 : 0) +
        (report.dimensions.title.winner === 'A' ? 10 : 0);

    report.scoreB =
        (report.dimensions.retention.winner === 'B' ? 40 : 0) +
        (report.dimensions.thumbnail.winner === 'B' ? 30 : 0) +
        (report.dimensions.engagement.winner === 'B' ? 20 : 0) +
        (report.dimensions.title.winner === 'B' ? 10 : 0);

    // Handle Ties in sub-metrics for scoring
    if (report.dimensions.retention.winner === 'Tie') { report.scoreA += 20; report.scoreB += 20; }
    if (report.dimensions.thumbnail.winner === 'Tie') { report.scoreA += 15; report.scoreB += 15; }
    if (report.dimensions.engagement.winner === 'Tie') { report.scoreA += 10; report.scoreB += 10; }
    if (report.dimensions.title.winner === 'Tie') { report.scoreA += 5; report.scoreB += 5; }

    // Final Verdict
    if (report.scoreA > report.scoreB) {
        report.winnerId = videoA.id;
        report.verdict = `El Video A gana la batalla (${report.scoreA} pts vs ${report.scoreB} pts). ${report.dimensions.retention.reason} ${report.dimensions.thumbnail.reason}`;
    } else if (report.scoreB > report.scoreA) {
        report.winnerId = videoB.id;
        report.verdict = `El Video B se lleva la victoria (${report.scoreB} pts vs ${report.scoreA} pts). ${report.dimensions.retention.reason} ${report.dimensions.thumbnail.reason}`;
    } else {
        report.winnerId = 'Tie';
        report.verdict = "Es un empate técnico. Ambos videos tienen fortalezas muy similares.";
    }

    // Generate Recommendations
    // Recommendations logic
    const isAverageComparison = videoA.id.startsWith('AVG') || videoB.id.startsWith('AVG');

    if (!isAverageComparison) {
        if (report.dimensions.title.winner === 'B' && report.scoreA > report.scoreB) {
            report.recommendations.push("Aunque A ganó, el título de B está mejor optimizado (más corto/directo). Considera aplicar ese estilo al ganador.");
        }
        if (analyzeTags(videoA.snippet.tags, videoB.snippet.tags) < 2) {
            report.recommendations.push("Ambos videos usan tags muy diferentes. Considera estandarizar tus tags principales para ayudar al algoritmo a categorizar tu canal.");
        }
    }

    if (report.dimensions.engagement.winner !== report.winnerId && report.winnerId !== 'Tie') {
        report.recommendations.push("El ganador tiene menos engagement relativo. Intenta mejorar los 'Call-to-Action' (pedir likes/comentarios) en futuros videos de este tipo.");
    }

    return report;
}

function analyzeTitles(titleA: string, titleB: string): AnalysisDimension {
    const scoreA = (titleA.length < 60 ? 5 : 0) + (titleA.includes('?') || titleA.includes('!') ? 3 : 0) + (/[0-9]/.test(titleA) ? 2 : 0);
    const scoreB = (titleB.length < 60 ? 5 : 0) + (titleB.includes('?') || titleB.includes('!') ? 3 : 0) + (/[0-9]/.test(titleB) ? 2 : 0);

    // Skip logic for Average titles
    if (titleA.includes('Promedio') || titleB.includes('Promedio')) {
        return { winner: 'Tie', score: 0, reason: "Comparativa vs Promedio (Título Neutral)." };
    }

    if (scoreA > scoreB) return { winner: 'A', score: scoreA, reason: "Su título es más corto y atractivo (tiene ganchos como preguntas o números)." };
    if (scoreB > scoreA) return { winner: 'B', score: scoreB, reason: "Su título está mejor optimizado para click (longitud ideal + ganchos)." };
    return { winner: 'Tie', score: scoreA, reason: "Ambos títulos tienen una estructura similar." };
}

function analyzeEngagement(videoA: VideoData, videoB: VideoData): AnalysisDimension {
    const getRate = (v: VideoData) => {
        const views = parseInt(v.statistics.viewCount) || 1;
        const interactions = parseInt(v.statistics.likeCount || '0') + parseInt(v.statistics.commentCount || '0');
        return interactions / views;
    };

    const rateA = getRate(videoA);
    const rateB = getRate(videoB);

    if (rateA > rateB * 1.1) return { winner: 'A', score: 10, reason: "Generó mucha más conversación y likes por vista." };
    if (rateB > rateA * 1.1) return { winner: 'B', score: 10, reason: "Conectó mejor con la audiencia (más likes/comentarios)." };
    return { winner: 'Tie', score: 5, reason: "El nivel de interacción es similar." };
}

function analyzeThumbnails(videoA: VideoData, videoB: VideoData, statsA: VideoAnalytics | null, statsB: VideoAnalytics | null): AnalysisDimension {
    // Ideally use CTR if available
    if (statsA?.annotationClickThroughRate && statsB?.annotationClickThroughRate) {
        if (statsA.annotationClickThroughRate > statsB.annotationClickThroughRate) return { winner: 'A', score: 10, reason: `Su CTR es mejor (${statsA.annotationClickThroughRate.toFixed(1)}%), indicando una miniatura más potente.` };
        if (statsB.annotationClickThroughRate > statsA.annotationClickThroughRate) return { winner: 'B', score: 10, reason: `Su CTR es superior (${statsB.annotationClickThroughRate.toFixed(1)}%), la miniatura funcionó mejor.` };
    }

    // Fallback: View Velocity approximation (Views / Days since published)
    const getVelocity = (v: VideoData) => {
        const days = (new Date().getTime() - new Date(v.snippet.publishedAt).getTime()) / (1000 * 3600 * 24);
        return parseInt(v.statistics.viewCount) / Math.max(days, 1);
    };

    const velA = getVelocity(videoA);
    const velB = getVelocity(videoB);

    if (velA > velB * 1.2) return { winner: 'A', score: 8, reason: "Atrajo visitas más rápido, sugiriendo mayor interés visual inicial." };
    if (velB > velA * 1.2) return { winner: 'B', score: 8, reason: "Tuvo mayor velocidad de visitas, señal de una miniatura efectiva." };

    return { winner: 'Tie', score: 5, reason: "Rendimiento de clicks estimado similar." };
}

function analyzeRetention(statsA: VideoAnalytics | null, statsB: VideoAnalytics | null): AnalysisDimension {
    if (!statsA || !statsB) return { winner: 'Tie', score: 0, reason: "Faltan datos privados para analizar retención." };

    // Compare AVD
    if (statsA.averageViewDuration > statsB.averageViewDuration * 1.1) return { winner: 'A', score: 10, reason: "Mantuvo a la audiencia viendo por más tiempo." };
    if (statsB.averageViewDuration > statsA.averageViewDuration * 1.1) return { winner: 'B', score: 10, reason: "Fue mucho más efectivo en retener al espectador." };

    return { winner: 'Tie', score: 5, reason: "Ambos retuvieron a la audiencia por un tiempo similar." };
}

function analyzeTags(tagsA?: string[], tagsB?: string[]): number {
    if (!tagsA || !tagsB) return 0;
    const setA = new Set(tagsA.map(t => t.toLowerCase()));
    const setB = new Set(tagsB.map(t => t.toLowerCase()));
    let intersection = 0;
    setA.forEach(t => { if (setB.has(t)) intersection++; });
    return intersection;
}
