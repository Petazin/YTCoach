
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface ChannelStatistics {
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}

export interface ChannelSnippet {
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  country?: string;
}

export interface ContentDetails {
  relatedPlaylists: {
    likes: string;
    uploads: string;
  };
}

export interface ChannelData {
  id: string;
  snippet: ChannelSnippet;
  statistics: ChannelStatistics;
  contentDetails: ContentDetails;
}

export interface VideoStatistics {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}

export interface VideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
    standard?: { url: string };
    maxres?: { url: string };
  };
  channelTitle: string;
  tags?: string[];
  categoryId: string;
}

export interface VideoData {
  id: string;
  snippet: VideoSnippet;
  statistics: VideoStatistics;
}

export class YouTubeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'YouTubeError';
  }
}

async function fetchFromYouTube<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('NEXT_PUBLIC_YOUTUBE_API_KEY is not defined in environment variables');
  }

  const queryParams = new URLSearchParams({
    ...params,
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(`${BASE_URL}/${endpoint}?${queryParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new YouTubeError(response.status, errorData.error?.message || `YouTube API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getChannelDetails(identifier: string): Promise<ChannelData | null> {
  try {
    const params: Record<string, string> = {
      part: 'snippet,statistics,contentDetails',
    };

    if (identifier.startsWith('@')) {
      params.forHandle = identifier;
    } else {
      params.id = identifier;
    }

    const data = await fetchFromYouTube<{ items?: any[] }>('channels', params);

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      id: item.id,
      snippet: item.snippet,
      statistics: item.statistics,
      contentDetails: item.contentDetails,
    };
  } catch (error) {
    console.error('Error fetching channel details:', error);
    throw error;
  }
}

export async function getRecentVideos(playlistId: string, maxResults: number = 10): Promise<VideoData[]> {
  // 1. Get playlist items (video IDs)
  const playlistData = await fetchFromYouTube<{ items?: any[] }>('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId: playlistId,
    maxResults: maxResults.toString(),
  });

  if (!playlistData.items || playlistData.items.length === 0) {
    return [];
  }

  const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');

  // 2. Get video statistics
  const videosData = await fetchFromYouTube<{ items?: any[] }>('videos', {
    part: 'snippet,statistics',
    id: videoIds,
  });

  if (!videosData.items) {
    return [];
  }

  return videosData.items.map((item: any) => ({
    id: item.id,
    snippet: item.snippet,
    statistics: item.statistics,
  }));
}
