/**
 * YouTube Utilities
 *
 * Functions for extracting transcripts and metadata from YouTube videos.
 */

/**
 * Extract video ID from various YouTube URL formats
 *
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if invalid
 */
export function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
        /youtube\.com\/shorts\/([^&?\s]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Fetch YouTube video transcript using multiple methods
 *
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{transcript: string, language: string} | null>}
 */
export async function getYouTubeTranscript(videoId) {
    // Try the YouTube transcript API (unofficial but commonly used)
    try {
        const transcript = await fetchTranscriptFromYouTube(videoId);
        if (transcript) {
            return transcript;
        }
    } catch (error) {
        console.warn('[YouTube] Failed to fetch transcript:', error.message);
    }

    return null;
}

/**
 * Fetch transcript directly from YouTube's internal API
 *
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{transcript: string, language: string} | null>}
 */
async function fetchTranscriptFromYouTube(videoId) {
    // Fetch the video page to get the caption tracks
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch video page: ${response.status}`);
    }

    const html = await response.text();

    // Extract the caption tracks from the page
    const captionTracksMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionTracksMatch) {
        // No captions available
        return null;
    }

    let captionTracks;
    try {
        captionTracks = JSON.parse(captionTracksMatch[1]);
    } catch {
        return null;
    }

    if (!captionTracks || captionTracks.length === 0) {
        return null;
    }

    // Prefer English captions, otherwise use the first available
    const englishTrack = captionTracks.find(
        (track) => track.languageCode === 'en' || track.languageCode?.startsWith('en')
    );
    const selectedTrack = englishTrack || captionTracks[0];

    if (!selectedTrack?.baseUrl) {
        return null;
    }

    // Fetch the transcript XML
    const transcriptResponse = await fetch(selectedTrack.baseUrl);
    if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
    }

    const transcriptXml = await transcriptResponse.text();

    // Parse the XML and extract text
    const textSegments = [];
    const textRegex = /<text[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = textRegex.exec(transcriptXml)) !== null) {
        // Decode HTML entities
        const text = decodeHTMLEntities(match[1]);
        if (text.trim()) {
            textSegments.push(text.trim());
        }
    }

    if (textSegments.length === 0) {
        return null;
    }

    return {
        transcript: textSegments.join(' '),
        language: selectedTrack.languageCode || 'en',
    };
}

/**
 * Decode HTML entities in transcript text
 *
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHTMLEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#32;': ' ',
        '&nbsp;': ' ',
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    // Handle numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

    return decoded;
}

/**
 * Get YouTube video metadata (title, duration, etc.)
 *
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{title: string, duration?: number, description?: string} | null>}
 */
export async function getYouTubeMetadata(videoId) {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        if (!response.ok) {
            return null;
        }

        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        let title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : null;

        // Try to get a cleaner title from meta tags
        const metaTitleMatch = html.match(/<meta name="title" content="([^"]+)"/);
        if (metaTitleMatch) {
            title = metaTitleMatch[1];
        }

        // Extract duration from the page data
        const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
        const duration = durationMatch ? parseInt(durationMatch[1], 10) : undefined;

        return {
            title,
            duration,
        };
    } catch (error) {
        console.error('[YouTube] Failed to fetch metadata:', error);
        return null;
    }
}
