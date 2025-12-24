
const ANALYTICS_BASE_URL = 'https://youtubeanalytics.googleapis.com/v2';

export interface DailyMetric {
    date: string;
    views: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
    subscribersGained: number;
    annotationClickThroughRate: number;
}

export interface Demographics {
    ageGroup: string;
    gender: string;
    viewerPercentage: number;
}

export interface PrivateChannelData {
    dailyMetrics: DailyMetric[];
    demographics: Demographics[];
    topSources: { source: string; views: number }[];
}

export async function getPrivateChannelStats(accessToken: string, channelId: string): Promise<PrivateChannelData> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 30 days

    // 1. Daily Metrics (Views, Watch Time, Subs)
    const dailyUrl = new URL(`${ANALYTICS_BASE_URL}/reports`);
    dailyUrl.searchParams.append('ids', `channel==MINE`);
    dailyUrl.searchParams.append('startDate', startDate);
    dailyUrl.searchParams.append('endDate', endDate);
    dailyUrl.searchParams.append('metrics', 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,annotationClickThroughRate');
    dailyUrl.searchParams.append('dimensions', 'day');
    dailyUrl.searchParams.append('sort', 'day');

    // 2. Demographics
    const demoUrl = new URL(`${ANALYTICS_BASE_URL}/reports`);
    demoUrl.searchParams.append('ids', `channel==MINE`);
    demoUrl.searchParams.append('startDate', startDate);
    demoUrl.searchParams.append('endDate', endDate);
    demoUrl.searchParams.append('metrics', 'viewerPercentage');
    demoUrl.searchParams.append('dimensions', 'ageGroup,gender');
    demoUrl.searchParams.append('sort', '-viewerPercentage');

    // 3. Traffic Sources
    const trafficUrl = new URL(`${ANALYTICS_BASE_URL}/reports`);
    trafficUrl.searchParams.append('ids', `channel==MINE`);
    trafficUrl.searchParams.append('startDate', startDate);
    trafficUrl.searchParams.append('endDate', endDate);
    trafficUrl.searchParams.append('metrics', 'views');
    trafficUrl.searchParams.append('dimensions', 'insightTrafficSourceType');
    trafficUrl.searchParams.append('sort', '-views');
    trafficUrl.searchParams.append('maxResults', '5');

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
    };

    try {
        const [dailyRes, demoRes, trafficRes] = await Promise.all([
            fetch(dailyUrl.toString(), { headers }),
            fetch(demoUrl.toString(), { headers }),
            fetch(trafficUrl.toString(), { headers }),
        ]);

        if (!dailyRes.ok || !demoRes.ok || !trafficRes.ok) {
            if (dailyRes.status === 401 || demoRes.status === 401 || trafficRes.status === 401) {
                // Token expired
                throw new Error('UNAUTHENTICATED');
            }

            const dailyErr = !dailyRes.ok ? await dailyRes.text() : null;
            const demoErr = !demoRes.ok ? await demoRes.text() : null;
            const trafficErr = !trafficRes.ok ? await trafficRes.text() : null;

            console.error('Analytics API Error:', { dailyErr, demoErr, trafficErr });
            throw new Error(`API Error: ${dailyRes.status} | ${demoRes.status} | ${trafficRes.status}`);
        }

        const dailyJson = await dailyRes.json();
        const demoJson = await demoRes.json();
        const trafficJson = await trafficRes.json();

        return {
            dailyMetrics: mapDailyMetrics(dailyJson.rows || []),
            demographics: mapDemographics(demoJson.rows || []),
            topSources: mapTrafficSources(trafficJson.rows || [])
        };
    } catch (error: any) {
        const msg = error?.message || String(error);
        if (!msg.includes('UNAUTHENTICATED')) {
            console.error('Error in getPrivateChannelStats:', error);
        }
        throw error;
    }
}

function mapDailyMetrics(rows: any[]): DailyMetric[] {
    return rows.map((row: any) => ({
        date: row[0],
        views: row[1],
        estimatedMinutesWatched: row[2],
        averageViewDuration: row[3],
        subscribersGained: row[4],
        annotationClickThroughRate: row[5] || 0,
    }));
}

function mapDemographics(rows: any[]): Demographics[] {
    return rows.map((row: any) => ({
        ageGroup: row[0],
        gender: row[1],
        viewerPercentage: row[2],
    }));
}

function mapTrafficSources(rows: any[]): { source: string; views: number }[] {
    return rows.map((row: any) => ({
        source: formatTrafficSource(row[0]),
        views: row[1],
    }));
}


export interface VideoAnalytics {
    videoId: string;
    views: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
    annotationClickThroughRate: number; // For detailed CTR
    likes: number; // Needed if public API quota is concern, but usually public is better.
    comments: number;
}

export async function getVideoSpecificAnalytics(accessToken: string, videoId: string): Promise<VideoAnalytics | null> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = '2000-01-01'; // Lifetime

    const url = new URL(`${ANALYTICS_BASE_URL}/reports`);
    url.searchParams.append('ids', `channel==MINE`);
    url.searchParams.append('filters', `video==${videoId}`);
    url.searchParams.append('startDate', startDate);
    url.searchParams.append('endDate', endDate);
    url.searchParams.append('metrics', 'views,estimatedMinutesWatched,averageViewDuration,annotationClickThroughRate,likes,comments');

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
    };

    try {
        const res = await fetch(url.toString(), { headers });
        if (!res.ok) {
            if (res.status === 401) {
                throw new Error('UNAUTHENTICATED');
            }
            console.error('Video Analytics Error', await res.text());
            return null;
        }

        const json = await res.json();
        if (!json.rows || json.rows.length === 0) return null;

        const row = json.rows[0];
        return {
            videoId,
            views: row[0],
            estimatedMinutesWatched: row[1],
            averageViewDuration: row[2],
            annotationClickThroughRate: row[3], // Note: Main CTR is often hidden in 'impressions' metrics which are channel-level with filters
            likes: row[4],
            comments: row[5]
        };
    } catch (error: any) {
        // Suppress logging for auth errors as they are handled by UI
        const msg = error?.message || String(error);
        if (!msg.includes('UNAUTHENTICATED')) {
            console.error('Error fetching video analytics:', error);
        }
        throw error;
    }
}

function formatTrafficSource(source: string): string {
    const map: Record<string, string> = {
        'NO_LINK_OTHER': 'Directo / Desconocido',
        'yt_search': 'Búsqueda de YouTube',
        'related_video': 'Videos sugeridos',
        'yt_channel': 'Página del canal',
        'ext_URL': 'Externo',
        'playlist': 'Listas de reproducción',
        'notification': 'Notificaciones'
    };
    return map[source] || source;
}
