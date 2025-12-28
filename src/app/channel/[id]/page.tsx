import { Metadata } from 'next';
import { getChannelDetails, getRecentVideos } from '@/lib/youtube';
import { analyzeChannel } from '@/lib/analysis';
import StatsDashboard from '@/components/StatsDashboard';
import PrivateDashboard from '@/components/PrivateDashboard';
import SearchBar from '@/components/SearchBar';
import LoginButton from '@/components/LoginButton';
import styles from '../../page.module.css';
import Link from 'next/link';
import { headers } from 'next/headers';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { id } = await params;
    try {
        const channel = await getChannelDetails(id);
        if (!channel) return { title: 'Canal no encontrado - YT Coach' };

        return {
            title: `${channel.snippet.title} - YT Coach Analytics`,
            description: `Analiza las estadísticas de ${channel.snippet.title}: ${parseInt(channel.statistics.subscriberCount).toLocaleString()} suscriptores. Informe detallado de rendimiento y consejos IA.`,
            openGraph: {
                images: [channel.snippet.thumbnails.high.url],
            },
        };
    } catch (e) {
        return { title: 'Error - YT Coach' };
    }
}

export default async function ChannelPage({ params }: Props) {
    const { id } = await params;
    let data = null;
    let error = null;

    try {
        // Parallel Fetching
        const channelPromise = getChannelDetails(id);

        // We need channel details to get upload ID, but we can optimistically try to fetch if we had it.
        // For now sequential is safer as we need the upload playlist ID. 
        // OPTIMIZATION: We could cache these.

        const channel = await channelPromise;
        if (!channel) throw new Error('Canal no encontrado');

        const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
        const videos = await getRecentVideos(uploadsPlaylistId, 15);
        const analysis = analyzeChannel(channel, videos);

        data = { channel, videos, analysis };

    } catch (err: any) {
        console.error(err);
        error = err.message || 'Error al cargar datos del canal';
    }

    return (
        <main className={styles.main}>
            {/* Header Mini (Navigation) */}
            <div className="w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-center mb-8 px-4 gap-4">
                <Link href="/" className="text-xl font-bold no-underline hover:text-white transition-colors">
                    <span className={styles.brandWhite}>YT</span>
                    <span className={styles.brandGradient}>Coach</span>
                </Link>

                <div className="flex-1 w-full max-w-md mx-4">
                    <SearchBar mode="redirect" isLoading={false} className={styles.searchBarHeader} />
                </div>

                <LoginButton />
            </div>

            {error && (
                <div className={styles.error} style={{ margin: '4rem auto' }}>
                    {error}
                    <div className="mt-4">
                        <Link href="/" className="text-blue-400 hover:underline">Volver al inicio</Link>
                    </div>
                </div>
            )}

            {data && (
                <div className={styles.results}>
                    <StatsDashboard
                        channel={data.channel}
                        analysis={data.analysis}
                        videos={data.videos}
                    />

                    {/* Private Dashboard (Client Component) handles its own session check */}
                    <div className="mt-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        <PrivateDashboard channelId={data.channel.id} />
                    </div>
                </div>
            )}
        </main>
    );
}
