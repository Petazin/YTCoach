import { TrackedAction } from '@/hooks/useTracker';
import { VideoData } from './youtube';

export type InspectionStatus = 'verified' | 'failed' | 'pending';

interface InspectionResult {
    status: InspectionStatus;
    message: string;
}

export function inspectAction(action: TrackedAction, currentVideo: VideoData): InspectionResult {
    // If no snapshot, we can't verify changes
    if (!action.videoSnapshot) {
        return { status: 'pending', message: 'No snapshot data available for verification.' };
    }

    // 1. Check Title Optimization
    if (action.id === 'ap_titles') {
        const oldLength = action.videoSnapshot.title.length;
        const newLength = currentVideo.snippet.title.length;
        const hasChanged = currentVideo.snippet.title !== action.videoSnapshot.title;

        if (hasChanged && newLength > 20 && newLength <= 60) {
            return { status: 'verified', message: 'Title length is now optimal.' };
        }
        if (hasChanged && newLength > oldLength) {
            return { status: 'verified', message: 'Title length increased.' };
        }
        return { status: 'failed', message: 'Title has not been improved.' };
    }

    // 2. Check SEO Tags
    if (action.id === 'ap_seo') {
        const oldTags = action.videoSnapshot.tagsCount;
        const newTags = currentVideo.snippet.tags?.length || 0;

        if (newTags > oldTags && newTags >= 5) {
            return { status: 'verified', message: 'Tags count increased and is optimal.' };
        }
        return { status: 'failed', message: 'Still missing sufficient tags.' };
    }

    // 3. Fallback for generic actions
    return { status: 'pending', message: 'Automatic verification not supported for this action type.' };
}
