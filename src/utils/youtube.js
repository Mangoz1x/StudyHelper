/**
 * YouTube Utilities
 *
 * Functions for extracting metadata from YouTube videos.
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
 * Get YouTube video metadata
 *
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{title: string, duration?: number, description?: string} | null>}
 */
export async function getYouTubeMetadata(videoId) {
    try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        if (!response.ok) {
            return null;
        }

        const html = await response.text();

        // Extract title from meta tags
        let title = null;
        const metaTitleMatch = html.match(/<meta name="title" content="([^"]+)"/);
        if (metaTitleMatch) {
            title = decodeHTMLEntities(metaTitleMatch[1]);
        } else {
            const titleMatch = html.match(/<title>([^<]+)<\/title>/);
            if (titleMatch) {
                title = titleMatch[1].replace(' - YouTube', '').trim();
            }
        }

        // Extract duration from the page data
        const durationMatch = html.match(/"lengthSeconds":\s*"(\d+)"/);
        const duration = durationMatch ? parseInt(durationMatch[1], 10) : undefined;

        return {
            title,
            duration,
        };
    } catch (error) {
        console.error('[YouTube] Failed to fetch metadata:', error.message);
        return null;
    }
}

/**
 * Decode HTML entities in text
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
    };

    let decoded = text;
    for (const [entity, char] of Object.entries(entities)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), char);
    }

    return decoded;
}
