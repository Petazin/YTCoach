import React, { useState } from 'react';
import { ActionPoint } from '@/lib/analysis';
import { VideoData } from '@/lib/youtube';
import styles from './StatsDashboard.module.css';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface ActionCardProps {
    action: ActionPoint;
    videos: VideoData[];
    channelId: string;
    isTracked: boolean;
    onTrack: (id: string, channelId: string, title: string, videoId?: string, videoSnapshot?: { title: string, tagsCount: number, descriptionLength: number }) => void;
}

export const ActionCard = ({ action, videos, channelId, isTracked, onTrack }: ActionCardProps) => {
    const [selectedVideoId, setSelectedVideoId] = useState<string>('');
    const [isSelecting, setIsSelecting] = useState(false);

    const handleTrackBase = () => {
        // If user hasn't selected a video, check if we should prompt or just track generically
        if (selectedVideoId) {
            const video = videos.find(v => v.id === selectedVideoId);
            const snapshot = video ? {
                title: video.snippet.title,
                tagsCount: video.snippet.tags?.length || 0,
                descriptionLength: video.snippet.description.length
            } : undefined;

            onTrack(action.id, channelId, action.title, selectedVideoId, snapshot);
        } else {
            onTrack(action.id, channelId, action.title);
        }
        setIsSelecting(false);
    };

    if (isTracked) {
        return (
            <div className={styles.actionCard}>
                <div className={styles.actionContent}>
                    <span className={`${styles.badge} ${action.priority === 'High' ? styles.badgeHigh : styles.badgeMedium}`}>
                        {action.priority} Priority
                    </span>
                    <h4>{action.title}</h4>
                    <p>{action.description}</p>
                </div>
                <Button variant="ghost" disabled>
                    ✓ En seguimiento
                </Button>
            </div>
        );
    }

    return (
        <div className={styles.actionCard}>
            <div className={styles.actionContent}>
                <span className={`${styles.badge} ${action.priority === 'High' ? styles.badgeHigh : styles.badgeMedium}`}>
                    {action.priority} Priority
                </span>
                <h4>{action.title}</h4>
                <p>{action.description}</p>

                {isSelecting && (
                    <div className="mt-4 animate-fadeIn">
                        <label className="text-xs text-gray-400 mb-1 block">Vincular a un video (Requerido):</label>
                        <Select
                            value={selectedVideoId}
                            onChange={(e) => setSelectedVideoId(e.target.value)}
                            className="w-full mb-2 bg-gray-900 border-gray-700 text-sm"
                        >
                            <option value="">-- Selecciona un video --</option>
                            {videos.slice(0, 5).map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.snippet.title.substring(0, 40)}...
                                </option>
                            ))}
                        </Select>
                        {!selectedVideoId && (
                            <p className="text-[10px] text-yellow-500 mb-2">Debes seleccionar un video para verificar el impacto.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 min-w-[120px]">
                {isSelecting ? (
                    <>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleTrackBase}
                            disabled={!selectedVideoId} // Force selection
                            className={!selectedVideoId ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            Confirmar
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSelecting(false)}
                            className="text-xs"
                        >
                            Cancelar
                        </Button>
                    </>
                ) : (
                    <Button
                        // variant="outline" // Assuming outline variant exists or standard
                        className={styles.trackBtn}
                        onClick={() => setIsSelecting(true)}
                    >
                        Implementar
                    </Button>
                )}
            </div>
        </div>
    );
};
