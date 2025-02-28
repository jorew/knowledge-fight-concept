import { get, writable } from 'svelte/store';
import type { Playlist, Track } from './player'; 
import { AudioPlayer } from './player';
import { browser } from '$app/environment';

let audioManager: AudioManager | undefined; // Declare but don't instantiate

class AudioManager {
    audio: AudioPlayer;

    public isPlaying = writable(false);
    public currentTrack = writable<Track | null>(null);

    public playlist = writable<Playlist>({ songs: [], index: 0 });

    // watch playlist to update current track
    public watchPlaylist() {
        this.playlist.subscribe(playlistValue => {
            const currentSong = playlistValue.songs[playlistValue.index];
            this.currentTrack.set(currentSong);
        });
    }

    constructor() {
        this.audio = new AudioPlayer(); 
        this.watchPlaylist()
    }


    private playCurrentSong() {
        this.playlist.subscribe(playlistValue => { // Use subscribe within the method
            const currentSong = playlistValue.songs[playlistValue.index];
            console.log("Current song:", currentSong)
            this.audio.playCurrent(currentSong.path);
        });
    }

    public playPause() {
        const isAudioPlaying = this.audio.isPlaying(); 
        if (isAudioPlaying) {
            this.pause();
        } else {
            this.play();
        }
        console.log("Is audio playing:", !isAudioPlaying)
        this.isPlaying.set(!isAudioPlaying); // Update the store
    }

    public prev() {
        this.playlist.update(playlist => {
            if (playlist.songs.length > 0) {
                playlist.index = (playlist.index - 1 + playlist.songs.length) % playlist.songs.length;
                this.playCurrentSong();
            }
            return playlist;
        });
    }

    public next() {
        this.playlist.update(playlist => {
            if (playlist.songs.length > 0) {
                playlist.index = (playlist.index + 1) % playlist.songs.length;
                this.playCurrentSong();
            }
            return playlist;
        });
    }

    public play() {
        // if no current object and there is smth in queue
        if (!this.audio.audioElement.currentSrc && get(this.playlist).songs.length > 0) {
            this.playCurrentSong();
        }
        this.audio.play(); // Directly call play on the audio object
        this.isPlaying.set(true);
    }

    public pause() {
        this.audio.pause();
        this.isPlaying.set(false);
    }

    public setPlaylist(newPlaylist: Playlist) {
        this.playlist.set(newPlaylist);
    }

    public enqueue(track: Track) {
        this.playlist.update(queue => {
            queue.songs.push(track);
            return queue;
        });
    }

    public clearPlaylist() {
        this.playlist.set({ songs: [], index: 0 });
    }

}

if (browser) { 
    audioManager = new AudioManager();
}

export { audioManager };

export const {isPlaying, currentTrack, playlist} = audioManager ?? {}
