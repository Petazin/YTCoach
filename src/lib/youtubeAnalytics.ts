
const ANALYTICS_BASE_URL = 'https://youtubeanalytics.googleapis.com/v2';

export interface DailyMetric {
    date: string;
    views: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
    subscribersGained: number;
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
    dailyUrl.searchParams.append('metrics', 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained');
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
    } catch (error) {
        console.error('Error in getPrivateChannelStats:', error);
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
