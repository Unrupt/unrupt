/**
 * Created by thp on 31/10/2017.
 */
var properties = {
    versionname :"Unrupt Demo 1.1.1", // update this to indicate which version of the settings this is
    procFramesize: 4096, // how many samples (at 44k1 Hz) in a frame. default 4096 ->  ~100ms
                         // this impacts the latency - but go too low and the audio will break up
    scopeFftSize : 2048, // number of samples in the FFT for the oscilloscope. default 2048 seems ok
    micSilenceThreshold : 0.0175, // minumum mean mic volume (in range of 0.0->1.0) of a frame that contains voice
                                  // used to trigger pause/unpause
                                  // default 0.0175 ok on imacs
    farSilenceThreshold : 0.0175, // minimum mean remote volume (in range of 0.0->1.0) of a frame that contains voice
                                  // used to trim silence from playout
                                  // default 0.0175 ok on imacs

    useAudioOnlyLayout: false, // If true then the audio layout should be used instead of the main video/audio layout.
    minFramesSilenceForPause: 15, // number of non-silent frames before we pause. default 3 (300ms)
    minFramesSilenceForPlay: 5,  // number of silent frames before we start to clip silence from playback. default 3 (300ms)
    maxStashFrames: 500, // longest possible pause (in frames). default 1000 -> 100 sec
    websocketURL: "wss://pi.pe/websocket/?finger=" // where to find the redezvous server.
};
