'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import StatsDashboard from '@/components/StatsDashboard';
import LoginButton from '@/components/LoginButton';
import PrivateDashboard from '@/components/PrivateDashboard';
import { useSession } from 'next-auth/react';
import { getChannelDetails, getRecentVideos, ChannelData, VideoData } from '@/lib/youtube';
import { analyzeChannel, AnalysisResult } from '@/lib/analysis';
import styles from './page.module.css';

export default function Home() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    channel: ChannelData;
    analysis: AnalysisResult;
    videos: VideoData[];
  } | null>(null);

  const handleSearch = async (term: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // 1. Fetch Channel
      const channel = await getChannelDetails(term);
      if (!channel) {
        throw new Error('Canal no encontrado. Verifica el ID o Handle.');
      }

      // 2. Fetch Recent Videos (Uploads playlist)
      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
      const videos = await getRecentVideos(uploadsPlaylistId, 15);

      // 3. Analyze
      const analysis = analyzeChannel(channel, videos);

      setData({ channel, analysis, videos });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al analizar el canal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.brandWhite}>YT</span>
          <span className={styles.brandGradient}>Coach</span>
        </h1>
        <p className={styles.subtitle}>Analiza, Optimiza y Crece en YouTube con IA</p>
        <div className="mt-6">
          <LoginButton />
        </div>
      </div>

      <SearchBar onSearch={handleSearch} isLoading={loading} />

      {loading && !data && (
        <div className={styles.results} style={{ opacity: 0.7 }}>
          {/* Header Skeleton */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
            <div className="skeleton" style={{ width: '300px', height: '40px', margin: '0 auto 0.5rem' }}></div>
            <div className="skeleton" style={{ width: '200px', height: '20px', margin: '0 auto' }}></div>
          </div>

          {/* Stats Grid Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ padding: '2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div className="skeleton" style={{ width: '60%', height: '40px', margin: '0 auto 1rem' }}></div>
                <div className="skeleton" style={{ width: '40%', height: '16px', margin: '0 auto' }}></div>
              </div>
            ))}
          </div>
        </div>
      )}



      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {data && (
        <div className={styles.results}>
          <StatsDashboard
            channel={data.channel}
            analysis={data.analysis}
            videos={data.videos}
          />

          {session && (
            <div className="mt-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <PrivateDashboard channelId={data.channel.id} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
