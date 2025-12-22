import { useState, useEffect } from 'react';
import { ChannelStatistics } from '@/lib/youtube';

export interface TrackedAction {
    id: string;
    channelId: string;
    title: string;
    implementedAt: number;
    initialStats: ChannelStatistics;
}

const STORAGE_KEY = 'yt_coach_tracker';

export function useTracker() {
    const [trackedActions, setTrackedActions] = useState<TrackedAction[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setTrackedActions(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse tracker data', e);
            }
        }
        setIsLoaded(true);
    }, []);

    const saveActions = (actions: TrackedAction[]) => {
        setTrackedActions(actions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
    };

    const trackAction = (id: string, channelId: string, title: string, currentStats: ChannelStatistics) => {
        // Avoid duplicates
        if (trackedActions.find(a => a.id === id)) return;

        const newAction: TrackedAction = {
            id,
            channelId,
            title,
            implementedAt: Date.now(),
            initialStats: { ...currentStats } // Snapshot
        };

        saveActions([...trackedActions, newAction]);
    };

    const untrackAction = (id: string) => {
        saveActions(trackedActions.filter(a => a.id !== id));
    };

    const getImpact = (actionId: string, currentStats: ChannelStatistics) => {
        const action = trackedActions.find(a => a.id === actionId);
        if (!action) return null;

        const initialViews = parseInt(action.initialStats.viewCount);
        const currentViews = parseInt(currentStats.viewCount);
        const initialSubs = parseInt(action.initialStats.subscriberCount);
        const currentSubs = parseInt(currentStats.subscriberCount);

        return {
            viewGrowth: currentViews - initialViews,
            subGrowth: currentSubs - initialSubs,
            daysSince: Math.floor((Date.now() - action.implementedAt) / (1000 * 60 * 60 * 24))
        };
    };

    return {
        trackedActions,
        trackAction,
        untrackAction,
        getImpact,
        isLoaded
    };
}
