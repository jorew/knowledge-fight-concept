// src/lib/casts.ts
import { XMLParser } from 'fast-xml-parser';

// Use CAST_UPDATE_TIME or default to 10 minutes
const UPDATE_TIME = import.meta.env.CAST_UPDATE_TIME || 600000; // 10 minutes in ms

let data: Cast[] = [];
let meta: Meta;
let lastUpdate = new Date(0); // Initialize as epoch time

const parser = new XMLParser({
	ignoreAttributes: false // Needed to access attributes like "url"
});

/**
 * Updates the cast data if the cache is expired or if forced.
 * @param {string} rssUrl - The URL to fetch the RSS feed from.
 * @param {boolean} [force=false] - Whether to force the update.
 */
export const updateCasts = async (rssUrl: string, force: boolean = false) => {
	const now = Date.now();
	const lastUpdateTime = lastUpdate.getTime();

	// If not forced and last update was within UPDATE_TIME, skip update
	// if (!force && now - lastUpdateTime < UPDATE_TIME) {
	//   return;
	// }

	const res = await fetch(rssUrl);
	const text = await res.text();
	const parsedData = parser.parse(text);
	const channel = parsedData.rss.channel;

	// Update metadata
	meta = {
		image: channel.image.url,
		title: channel.title,
		lastUpdated: new Date(),
		podcastLastUpdated: new Date(channel.lastBuildDate),
		link: channel.link,
		owner: {
			name: channel['itunes:owner']['itunes:name'],
			email: channel['itunes:owner']['itunes:email']
		}
	};

	// Update the data array
	data = channel.item.map((r: any) => {
		return {
			title: r.title,
			pubDate: r.pubDate,
			guid: r.guid['#text'],
			link: r.link,
			itunesImage: r['itunes:image'] ? r['itunes:image']['@_href'] : null,
			description: r.description,
			duration: r['itunes:duration'],
			explicit: Boolean(r['itunes:explicit']),
			rawDescription: r['itunes:subtitle'],
			episodeType: r['itunes:episodeType'],
			streamUrl: r['enclosure']["@_url"]
		};
	});

	lastUpdate = new Date(); // Set the current update time
};

/**
 * Get paginated cast data.
 * @param {number} page - The page number.
 * @param {number} limit - The number of items per page.
 * @returns {Promise<GetCastsResponse>} The paginated cast data and metadata.
 */
export const getCasts = async (
	page: number,
	limit: number,
	search: string | null = null
): Promise<GetCastsResponse> => {
	await updateCasts('https://feeds.libsyn.com/92106/rss');

	// Handle pagination
	const startIndex = (page - 1) * limit;
	let paginatedData;
	if (search != null) {
		const regex = new RegExp(search.toLowerCase(), 'i');
		paginatedData = data
			.filter(
				(cast) => regex.test(cast.title.toLowerCase()) || regex.test(cast.description.toLowerCase())
			)
			.slice(startIndex, startIndex + limit);
	} else paginatedData = data.slice(startIndex, startIndex + limit);

	return {
		meta,
		page,
		limit,
		totalItems: data.length,
		totalPages: Math.ceil(data.length / limit),
		data: paginatedData
	};
};

export interface Cast {
	title: string;
	pubDate: string;
	guid: string;
	link: string;
	itunesImage: string;
	description: string;
	duration: string;
	explicit: boolean;
	rawDescription: string;
	episodeType: string;
	streamUrl: string;
}

export interface MetaOwner {
	name: string;
	email: string;
}

export interface Meta {
	title: string;
	lastUpdated: Date;
	podcastLastUpdated: Date;
	link: string;
	owner: MetaOwner;
	image: string;
}

export interface GetCastsResponse {
	meta: Meta;
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
	data: Cast[];
}
