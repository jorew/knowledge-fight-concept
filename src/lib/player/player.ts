import { writable, readable } from 'svelte/store';

class AudioPlayer {
	audioElement: HTMLAudioElement;

	duration: ReturnType<typeof readable<number>>;
	currentTime: ReturnType<typeof readable<number>>;
	//volume: ReturnType<typeof readable<number>>;
	playbackRate: ReturnType<typeof readable<number>>;
	//muted: ReturnType<typeof readable<boolean>>;

	constructor() {
		this.audioElement = new Audio();

		this.duration = readable(0, (set) => {
			const onDurationChange = () => {
				set(this.audioElement.duration);
			};

			// Add event listener
			this.audioElement.addEventListener('durationchange', onDurationChange);

			return () => {
				// Cleanup: Remove the event listener when the store is no longer needed
				this.audioElement.removeEventListener('durationchange', onDurationChange);
			};
		});

		this.currentTime = readable(0, (set) => {
			const onTimeChange = () => {
				set(this.audioElement.currentTime);
			};
			this.audioElement.addEventListener('timeupdate', onTimeChange);
			return () => {
				this.audioElement.removeEventListener('timeupdate', onTimeChange);
			};
		});

		this.playbackRate = readable(0, (set) => {
			const onPlaybackRateChange = () => {
				set(this.audioElement.playbackRate);
			};
			this.audioElement.addEventListener('playbackrate', onPlaybackRateChange);
			return () => {
				this.audioElement.removeEventListener('playbackrate', onPlaybackRateChange);
			};
		});
	}

	playCurrent(path: string) {
		this.audioElement.src = path;
		this.audioElement.play();
	}

	play() {
		this.audioElement.play();
	}

	pause() {
		this.audioElement.pause();
	}

	isPlaying() {
		console.log(this);
		console.log('Is playing:', this.audioElement.buffered);
		return !this.audioElement.paused;
	}

	setVolume(volume: number) {
		this.audioElement.volume = volume;
	}

	getVolume() {
		return this.audioElement.volume;
	}

	setPlaybackRate(rate: number) {
		this.audioElement.playbackRate = rate;
	}

	getPlaybackRate() {
		return this.audioElement.playbackRate;
	}

	setMuted(muted: boolean) {
		this.audioElement.muted = muted;
	}

	getMuted() {
		return this.audioElement.muted;
	}

	setCurrentTime(time: number) {
		this.audioElement.currentTime = time;
	}

	getCurrentTime() {
		return this.audioElement.currentTime;
	}
}

export { AudioPlayer };

export interface Track {
	id: string;
	path: string;
	title: string;
	artist: string;
	album?: string;
	cover?: string;
}

export interface Playlist {
	songs: Track[];
	index: number;
}
