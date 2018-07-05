var webRTCconfiguration = {
    "iceServers": [
        {
            urls: "stun:146.148.121.175:3478"
        },
        {
            urls: "turn:146.148.121.175:3478?transport=udp",
            'credential': 'nexus5x',
            'username': 'smartphone'
        }
    ],
    "bundlePolicy": "max-bundle",
    "iceCandidatePoolSize": 1
};



var pc; // actual peer connection to our friend
var socket; // used to set up connection with our peer.
var mid;
var fid;
var cid;
var myac;
var yourac;
var yourBuffer;
var myBuffer;
var initiator;
var lcandyStash = [];
var rcandyStash = [];
var localStream;
var remoteStream;
var scopes = [];
var procs = [];
var backlog = 0; // Overall backlog
var backlog_sil = 0; // Silent backlog for other/far user.
var backlog_spk = 0;  // Speak backlog for other/far user. Display the yellow progress bar when not equal to zero.
var tick;
var iamspeaking = false;
var mute = false;
var paused = false;
var videoEnabled = true;
var myVideoELement, otherUserVideoElement;
var peerConnectionOfferAnswerCriteria = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: false
};
var toggleMute;
var unruptEnabled = true;
var toggleUnrupt;
var AudioContext = window.AudioContext || window.webkitAudioContext;
var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
var framecount = 0;
var mode = "waiting";
var offerSendLoop;
var session;
var call_has_ended = true;
var call_history = {};
var is_speaking = {
    "farscope": false,
    "nearscope": false,
    "earscope": false
};

// message stuff - used to create direct connection to peer over WEBRTC

function messageDeal(event) {
    //console.log("message is ", event.data);
    var data = JSON.parse(event.data);
    console.log("message data is ", data);
    if (data.to != mid) {
        alert("message mixup");
    }
    switch (data.type) {
        case "cheatUnruptToggle":
            toggleUnrupt();
            break;
        case "offer":
            if (pc) {
                if (session == null) {
                    session = data.session;
                } else {
                    console.log("we got a duplicate offer ?!?")
                }
                if (fid == null) {
                    fid = data.from;
                }
                pc.setRemoteDescription(data).then(_ =>
                        pc.createAnswer(peerConnectionOfferAnswerCriteria).then(ans =>
                            pc.setLocalDescription(ans).then(_ =>
                                sendMessage(fid, mid, "answer", ans.sdp)
                            )
                        )
                    )
                    .catch((e) => console.log("set Remote offer error", e));
            } else {
                console.log("not ready yet, no pc created.");
            }
            break;
        case "answer":
            if ((session) && (session === data.session)) {
                window.clearInterval(offerSendLoop);
                pc.setRemoteDescription(data)
                    .then(_ => {
//                        $("#action").text("hangup");
                    })
                    .catch(e => console.log("set Remote answer error", e));
            } else {
                console.log("Got answer we were not expecting. Session was " + session + " data.session was " + data.session);
                alert("Mixup in sessions for answer");
            }
            break;
        case "candidate":
            if ((session) && (session === data.session)) {
                var jc = {
                    sdpMLineIndex: 0,
                    candidate: data.sdp
                };
                console.log("adding candidate ", jc);
                var nc = new RTCIceCandidate(jc);
                pc.addIceCandidate(nc)
                    .then(_ => console.log("added remote candidate"))
                    .catch((e) => console.log("couldn't add candidate ", e));
            } else {
                console.log("Session error for candidates. Session was " + session + " data.session was " + data.session);
            }
            break;
    }
}

function sendJ(m) {
    var message = JSON.stringify(m);
    console.log("sending ", m);
    socket.send(message);
}

function sendMessage(to, from, type, data) {

    var messageJ = {
        to: to,
        retry: 0,
        from: from,
        type: type,
        sdp: data
    };
    if (type === 'offer') {
        messageJ.retry = 5;
        session = Date.now();
        messageJ.session = session;
        offerSendLoop = window.setInterval((it) => {
            if (messageJ.retry > 0) {
                messageJ.retry--;
                sendJ(messageJ);
            } else {
                window.clearInterval(offerSendLoop);
                console.log("given up on ", messageJ);
            }
        }, 10000);
    } else {
        messageJ.session = session;
    }
    // so either way we send it once _immediately_
    // offers we keep sending for a minute - 'till we see an answer or....
    sendJ(messageJ);
}

// button actions

function startCall(cid) {
    lcandyStash = [];
    rcandyStash = [];
    fid = cid;
    pc.createOffer(peerConnectionOfferAnswerCriteria)
        .then(desc => {
            console.log("offer created", );
            pc.setLocalDescription(desc).then(d => sendMessage(fid, mid, desc.type, desc.sdp));
        })
        .catch(e => console.log("offer not created due to ", e));
}

function stopCall() {
    localStorage.setItem("call_has_ended", true);
    window.location.href = window.location.href;
}

function videoCapture() {
    var video = document.getElementById("out");
    var videoWidth = video.videoWidth,
        videoHeight = video.videoHeight;
    var canvas = document.getElementById('pauseOther');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    var context = canvas.getContext('2d');
    context.translate(canvas.width, 0);

    // flip context horizontally
    context.scale(-1, 1);

    context.drawImage(
        video, 0, 0, videoWidth, videoHeight
    );

    var img = new Image();
    img.onload = function () {
        context.drawImage(img, (videoWidth / 2) - 24, (videoHeight / 2) - 24);
    }
    img.src = "pause.svg";
}

// webaudio processing
// display waveform for diagnostics
function doScopeNode(ac, node, scopename) {
    console.log("making scope node ", scopename);
    var analyser = ac.createAnalyser();
    analyser.fftSize = properties.scopeFftSize;
    node.connect(analyser);
    makeDraw(scopename, analyser);
    scopes.push(analyser);
    return analyser;
}

// processing incoming audio
function yourProc(node) {
    var buffer = yourBuffer;
    console.log("made unrupt buffer of size ", buffer.bufferSize, buffer);
    var silentcount = 0;
    var audiostash = [];

    var ub = $('#unruptToggle');

    var pb = $("#pause");

    console.log('PauseButton!!!', pb);

    var oldmute = false;

    toggleUnrupt = () => {
        var ubi = $('#pwsIcon');
        if (unruptEnabled) {
            unruptEnabled = false;
            console.log('disconnecting the buffer');
            node.disconnect(buffer);
            document.getElementById('out').muted = false;
            document.getElementById('out').play();
            $('#pauseOther').hide();
            ubi.removeClass("fa-exchange-alt");
            ubi.addClass("fa-arrows-alt-h");
        } else {
            unruptEnabled = true;
            console.log('connecting the buffer');
            node.connect(buffer);
            document.getElementById('out').muted = true;
            ubi.removeClass("fa-arrows-alt-h");
            ubi.addClass("fa-exchange-alt");
        }
    }


    ub.off('click').on('click', (e) => {
        e.stopImmediatePropagation();
        toggleUnrupt();
        sendMessage(fid, mid, "cheatUnruptToggle", true);
    });

    pb.off('click').on('click', (e) => {
        e.stopImmediatePropagation();
        var pbi = $("#pauseIcon");
        console.log('clicked on pause!');

        console.log('paused variable is', paused);

        if (!paused) {
            paused = true;
            pbi.removeClass("fa-play-circle");
            pbi.addClass("fa-pause-circle");
            oldmute = mute;
            setMute(true);
        } else {
            paused = false;
            pbi.removeClass("fa-pause-circle");
            pbi.addClass("fa-play-circle");
            setMute(oldmute);
        }
    });

    buffer.onaudioprocess = (ape) => {
        console.log('ARE WE STILL PROCESSING AUDIO!?!');
        framecount++;

        if (!unruptEnabled) {
            console.log('unrupt isnt enabled so clearing the backlog numbers');
            backlog_sil = backlog_spk = 0;
            return;
        }

        var inputBuffer = ape.inputBuffer;
        // The output buffer contains the samples that will be modified and played
        var outputBuffer = ape.outputBuffer;

        // Loop through the output channels (in this case there is only one)
        if (inputBuffer.numberOfChannels == 1) {
            var inputData = inputBuffer.getChannelData(0);
            var outputData = outputBuffer.getChannelData(0);

            // we (almost) always stash the inbound data
            if (audiostash.length < properties.maxStashFrames) {
                var buff = new Float32Array(inputBuffer.length);
                var avg = 0.0;

                for (var sample = 0; sample < inputBuffer.length; sample++) {
                    buff[sample] = inputData[sample]; // copy
                    avg += Math.abs(buff[sample]); // sample
                }
                avg = avg / inputBuffer.length;
                var silent = (avg < properties.farSilenceThreshold);
                is_speaking["farscope"] = !silent;
                if (silent) {
                    silentcount++;
                    backlog_sil++;
                } else {
                    silentcount = 0;
                    backlog_spk++;
                }
                audiostash.unshift({
                    silent: silent,
                    buff: buff,
                    silentcount: silentcount
                });
                // store annotated version
            }
            backlog = audiostash.length / 10;
            if (paused || iamspeaking) {
                for (var sample = 0; sample < inputBuffer.length; sample++) {
                    outputData[sample] = 0.0; // silence
                }
            } else {
                var stash = audiostash.pop();
                if (stash.silent) {
                    backlog_sil--;
                } else {
                    backlog_spk--;
                }

                var deleteme = (stash.silent);

                while ((audiostash.length > 0) && (deleteme)) {
                    console.log("have backlog", audiostash.length);
                    deleteme = false;
                    if (audiostash[0].silent) {
                        console.log("next one is silent too");
                        if (stash.silentcount > properties.minFramesSilenceForPlay) {
                            console.log("silentcount = ", stash.silentcount);
                            deleteme = true;
                            stash = audiostash.pop();
                            if (stash.silent) {
                                backlog_sil--;
                            } else {
                                backlog_spk--;
                            }
                        }
                    }
                }
                var buff = stash.buff;
                for (var sample = 0; sample < inputBuffer.length; sample++) {
                    outputData[sample] = buff[sample];
                }
            }
        }
    };
    node.connect(buffer);
    procs.push(buffer)
    return buffer;
}

// mute management
function setMute(m) {
    var mi = $("#muteIcon");
    mute = m;
    var audioTracks = localStream.getAudioTracks();
    if (m) {
        mi.removeClass("fa-microphone");
        mi.addClass("fa-microphone-slash");
        audioTracks[0].enabled = false;
        document.getElementById("out").muted = false;
        document.getElementById("out").pause();
    } else {
        mi.removeClass("fa-microphone-slash");
        mi.addClass("fa-microphone");
        audioTracks[0].enabled = true;
        document.getElementById("out").muted = true;
        document.getElementById("out").play();
    }
}

// processing audio from the local microphone
function myProc(node) {
    var mb = $("#mute");
    mb.click(() => {
        setMute(!mute);
    });
    var buffer = myBuffer;
    console.log("made unrupt buffer of size ", buffer.bufferSize);
    var silentcount = 0;
    buffer.onaudioprocess = ape => {
        var inputBuffer = ape.inputBuffer;

        var outputBuffer = ape.outputBuffer;

        // Loop through the output channels (in this case there is only one)
        if (inputBuffer.numberOfChannels == 1) {
            var inputData = inputBuffer.getChannelData(0);
            var outputData = outputBuffer.getChannelData(0);
            // Loop through the 4096 samples
            var avg = 0.0;

            for (var sample = 0; sample < inputBuffer.length; sample++) {
                // make output equal to the same as the input
                outputData[sample] = inputData[sample];
                avg += Math.abs(outputData[sample]); // sample
            }
            avg = avg / inputBuffer.length;
            var silent = (avg < properties.micSilenceThreshold);
            if (iamspeaking) {
                if (silent) {
                    silentcount++;
                }
                if (silentcount > properties.minFramesSilenceForPause) {
                    iamspeaking = false;
                    is_speaking["nearscope"] = false;
                }else{
                    is_speaking["nearscope"] = true;
                }
            } else {
                is_speaking["nearscope"] = !silent;
                if (!silent) {
                    iamspeaking = true;
                    silentcount = 0;
                }
            }
        }
    };
    node.connect(buffer);
    procs.push(buffer);
    return buffer;
}

// called when webRTC presents us with a fresh remote audio stream
function addStream(stream, kind) {
    if (!kind) {
        kind = "audio/video";
    }
    console.log("=====> Kind is " + kind);
    console.log("got new stream" + stream + " kind =" + kind);
    if (kind.indexOf("video") != -1) {
        remoteStream = stream;
        var mediaElement = document.getElementById('out');
        
        // Older browsers may not have srcObject
        if ("srcObject" in mediaElement) {
            mediaElement.srcObject = stream;
        } else {
            // Avoid using this in new browsers, as it is going away.
            mediaElement.src = URL.createObjectURL(stream);
        }
        //mediaElement.muted = true;
        console.log('Video stream');

        mediaElement.onloadedmetadata = function (e) {
            //mediaElement.play();
            mediaElement.muted = true;
        };
    }
     if (kind.indexOf("audio") != -1) {
        var peer = yourac.createMediaStreamSource(stream);

        console.log('Audio sample Rate is ' + yourac.sampleRate);

        var scope = doScopeNode(yourac, peer, "farscope");
        var buffproc = yourProc(scope);
        var scope2 = doScopeNode(yourac, buffproc, "earscope");
        scope2.connect(yourac.destination);
        //$("#chosenAction").show();
     }
}

// configure local peerconnection and handlers
function setupRTC() {
    pc = new RTCPeerConnection(webRTCconfiguration, null);
    console.log("created peer connection");

    pc.onicecandidate = (e) => {
        console.log("local ice candidate", e.candidate);
        if (e.candidate != null) {
            if (pc.signalingState == 'stable') {
                sendMessage(fid, mid, "candidate", e.candidate.candidate);
            } else {
                console.log("stashing ice candidate");
                lcandyStash.push(e.candidate);
            }
        }
    };
    pc.oniceconnectionstatechange = (e) => {
        console.log("ice state is changed", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
            stopCall();
        }
    };
    // specification of WEBRTC is in flux - so we test to see if ontrack callback exists
    if ('ontrack' in pc) {
        // if so we use it
        pc.ontrack = (event) => {
            var stream = event.streams[0];
            console.log("got remote track ", event.track.kind);
            addStream(stream, event.track.kind);
        };
    } else {
        // if not we use add stream instead
        pc.onaddstream = (event) => {
            var stream = event.stream;
            console.log("got remote stream ", stream.kind);
            addStream(stream);
        }
    }

    // use this to determine the state of the 'hangup' button and send any candidates we found quickly
    pc.onsignalingstatechange = (evt) => {
        console.log("signalling state is ", pc.signalingState);
        if (pc.signalingState == 'stable') {
            var can;
            while (can = lcandyStash.pop()) {
                console.log("popping candidate off stash")
                sendMessage(fid, mid, "candidate", can.candidate);
            }
            var act = $("#action");
            // act.text("hangup call");
            act.click(_ => stopCall());
        }
    };
}

// plumb the local audio together.
function setupAudio() {

    myac = new AudioContext();
    yourac = new AudioContext();

    yourBuffer = yourac.createScriptProcessor(properties.procFramesize, 1, 1);
    myBuffer = myac.createScriptProcessor(properties.procFramesize, 1, 1);
    let supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
    console.log("Supported constraints");
    for (let constraint in supportedConstraints) {
        if (supportedConstraints.hasOwnProperty(constraint)) {
            console.log("\t" + constraint + "=" + supportedConstraints[constraint]);
        }
    }
    //var gumConstraints = {audio: true, video: videoEnabled ? {width: 640, height: 480} : false};
    var gumConstraints = {
        audio: true,
        video: videoEnabled
    };

    var promise = new Promise(function (resolve, reject) {

        navigator.mediaDevices.getUserMedia(gumConstraints)
            .then((stream) => {
                localStream = stream; // in case we need it
                var node = myac.createMediaStreamSource(stream);
                var detect = myProc(node);
                var manl = doScopeNode(myac, detect, "nearscope");
                var dest = myac.createMediaStreamDestination();
                manl.connect(dest);
                var lstream = dest.stream;

                if (pc.addTrack) {
                    stream.getTracks().forEach(track => {
                        pc.addTrack(track, stream);
                        console.log("added local track ", track.id, track.kind);
                    });
                } else {
                    pc.addStream(stream);
                    console.log("added local stream");
                }
                if (videoEnabled) {
                    var ourMediaElement = document.getElementById('in');
                    // Older browsers may not have srcObject
                    if ("srcObject" in ourMediaElement) {
                        ourMediaElement.srcObject = stream;
                    } else {
                        // Avoid using this in new browsers, as it is going away.
                        ourMediaElement.src = URL.createObjectURL(stream);
                    }

                    ourMediaElement.onloadedmetadata = function (e) {
                        ourMediaElement.play();
                    };
                    ourMediaElement.onclick = function (e) {
                        console.log("onclick for in video");
                        ourMediaElement.play();
                        var theirMediaElement = document.getElementById('out');
                        theirMediaElement.play();
                    };
                }
                resolve(videoEnabled);
            })
            .catch((e) => {
                console.log('getUserMedia() error:' + e);
                reject(e);
            });
    });
    return promise;

}

function doPlay() {
    var ourMediaElement = document.getElementById('in');
    if ( ourMediaElement  ){
        console.log("onclick for in video");
        ourMediaElement.play();
    }
    var theirMediaElement = document.getElementById('out');
    if ( theirMediaElement ){
        theirMediaElement.play();
    }
    turnOffVideo();
}


function shared() {
    setupRTC();
    setupAudio().then(_ => {
        console.log("ready for offer");
        localStorage.setItem("call_has_ended", false);
        doPlay();
    });
}

function accepted() {
    setupRTC();
    setupAudio().then(_ => {
        console.log("ready for offer");
        localStorage.setItem("call_has_ended", false);
        startCall(cid);
        doPlay();
    });
}

/** Set the pair of ids from localStorage to call history. */
function getConversationEntries(){
    var data = localStorage['call_history'];
    if (data == null)
        call_history = {};
    else
        call_history = JSON.parse(data);
}

/**
 * Get mid
 * @returns Returns mid from the cEntries if found, else return null;
 */
function getMID() {
    var cid = $.getUrlVar("unruptId");
    if ( cid != undefined ){
        cid = cid.replace("#", "");
    }
    if (!mid) {
        getConversationEntries();
    }
    return call_history[cid];
}

/**
 * Save the cid and mid as key-value pairs in localStorage.
 * @param {string} id - mid or current user id
 */
function saveMID(id){
    var cid = $.getUrlVar("unruptId");
    if ( cid != undefined ){
        cid = cid.replace("#", "");
    }
    call_history[cid] = id;
    data = JSON.stringify(call_history)
    localStorage.setItem('call_history', data);
}

// decide who we are initiator or recpient.
// notice that the actual call goes in the reverse direction
// the recipient of the invite actually creates the audiobearing peerconnection
// the initiator then accepts this audio - This allows the initiator the chance to
// change their mind, if their circumstances have changed since the invite was sent.

function setRole() {
    cid = $.getUrlVar("unruptId");
    if ( cid != undefined ){
        cid = cid.replace("#", "");
    }
    mid = localStorage['unruptId'];
    console.log('URL unrupt ID:', cid);
    console.log('localStorage unrupt ID:', mid);
    if (!mid) {
        var array = new Uint32Array(8);
        window.crypto.getRandomValues(array);
        var hexCodes = [];
        for (var i = 0; i < array.length; i++) {
            // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
            var value = array[i];
            // toString(16) will give the hex representation of the number without padding
            var stringValue = value.toString(16)
            // We use concatenation and slice for padding
            var padding = '00000000'
            var paddedValue = (padding + stringValue).slice(-padding.length)
            hexCodes.push(paddedValue);
        }
        mid = hexCodes.join("").toLowerCase();
        console.log("mid =", mid);
        localStorage['unruptId'] = mid;
    }
    if (cid == null) {
        document.location = location.pathname + "?" + "unruptId=" + mid;
        // this has the effect of getting our id into the browser bar -
        // making it easy to share etc
    } else {

        $('#audioInfo').show();

        if (videoEnabled) {
            $('#videoRow').css('display', 'flex');
        }
        var qrcode = new QRCode(document.getElementById("shareQR"), {
            width: 280,
            height: 280,
            correctLevel: QRCode.CorrectLevel.L
        });

        socket = new WebSocket(properties.websocketURL + mid);
        socket.onmessage = messageDeal;
        socket.onopen = (_) => {
            var url = document.location.href;
            console.log("href = " + url);
            if (url) {
                qrcode.makeCode(url);
            }
            initiator = (mid === cid);
            console.log(initiator ? 'We are the initiator' : 'We are not the initiator');
            var smodal = initiator ? "#share" : "#accept";
            if( call_has_ended ){
                $(smodal).modal('show');
            }else if ( initiator ) {
                shared();
            }else{
                accepted();
            }
        };
        socket.onerror = (e) => {
            console.log("can't open websocket", e);
        };
        socket.onclose = (e) => {
            console.log(" websocket closed", e);
        };

    }
}

function turnOffVideo(){
    videoEnabled = !(localStream.getVideoTracks()[0].enabled);

    if(videoEnabled){
        videoBtnIcon.removeClass("fa-video-slash");
        videoBtnIcon.addClass("fa-video");
        voicePanel.hide();
    }else{
        videoBtnIcon.removeClass("fa-video");
        videoBtnIcon.addClass("fa-video-slash");
        voicePanel.show();
    }
    $("body").attr("has-video", videoEnabled);
    localStream.getVideoTracks()[0].enabled = videoEnabled;
}


$(document).on('click', "#chooseActionVideo", function () {
    turnOffVideo();
});

// thing that draws the scopes...
function makeDraw(canvName, anode) {
    var analyser = anode;
    var speaking = false;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    var canvas = document.getElementById(canvName);
    var badge = document.getElementById(canvName + "-badge");
    var card = document.getElementById("card-voice-" + canvName);
    var cTimeout = null;
    if ((badge) && (canvas)) {
        var canvasCtx = canvas.getContext("2d");
        // oscilloscope - for debug.
        var draw = _ => {
            // Get a canvas defined with ID "oscilloscope"
            var drawVisual = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

            canvasCtx.beginPath();

            if (canvName == "earscope" && backlog_spk == 0 ){
//                    bufferLength = 1;
                canvasCtx.moveTo(canvas.width, canvas.height / 2);
                canvasCtx.lineTo(canvas.width, canvas.height / 2);
            }else{

                var sliceWidth = canvas.width * 1.0 / bufferLength;
                var x = 0;
                var tot = 0.0;

                for (var i = 0; i < bufferLength; i++) {


                    var v = dataArray[i] / 128.0;
                    tot += Math.abs(dataArray[i] - 128);
                    var y = v * canvas.height / 2;

                    if (i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

            }
            var mean = tot / bufferLength;
            var newspeak = (mean > 2.0);
            if (newspeak != speaking) {
                speaking = newspeak;
                //console.log("newspeak "+newspeak+" mean "+mean);
                if (!speaking){
//                    cTimeout = setTimeout(function(){
                        card.setAttribute(
                            "mode",
                            "silent"
                        );
                        badge.innerText = "Silent";
//                    }, 500);
                }else{
                    if (canvName == "earscope" && backlog_spk != 0 ){
                        card.setAttribute(
                            "mode",
                            "speaking"
                        );
                        badge.innerText = "Speaking";
                    } else if (canvName != "earscope") {
//                        if (cTimeout != null){
//                            clearTimeout(cTimeout);
//                        }
                        card.setAttribute(
                            "mode",
                            "speaking"
                        );
                        badge.innerText = "Speaking";
                    }
                }
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };
        draw();
    }
}



// some housekeeping

$.extend({
    getUrlVars: function () {
        var vars = [],
            hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function (name) {
        return $.getUrlVars()[name];
    }
});

$(document).ready(_ => {

//    call_has_ended = localStorage.getItem('call_has_ended', true);
    videoBtnIcon = $("#videoOff");
    voicePanel = $("#voice-panel");

    $("body").attr("has-video", videoEnabled);

    if (videoEnabled) {
        peerConnectionOfferAnswerCriteria = {};
        var otherUserMediaElement = document.createElement('video');
        otherUserMediaElement.id = 'out';
        otherUserMediaElement.muted = true;
        otherUserMediaElement.className = "video";
        otherUserMediaElement.setAttribute("playsinline", "true");

        videoBtnIcon.removeClass("fa-video-slash");
        videoBtnIcon.addClass("fa-video");

        voicePanel.hide();
        //otherUserMediaElement.setAttribute("autoplay", "true");


        document.getElementById('other-webcam').appendChild(otherUserMediaElement);

        var thisUserMediaElement = document.createElement('video');
        thisUserMediaElement.id = 'in';
        thisUserMediaElement.muted = true;
        thisUserMediaElement.setAttribute("playsinline", "true");
        //thisUserMediaElement.setAttribute("autoplay", "true");


        document.getElementById('my-webcam').appendChild(thisUserMediaElement);


    } else {
        var mediaElement = document.createElement('audio');
        mediaElement.id = 'out';
        mediaElement.muted = true;
        document.body.appendChild(mediaElement);
    }

    // Manual unmute on the remote stream element
    $("#btnRemoteAudio").off('click').on('click', (e) => {
	var otherUserMediaElement = document.getElementById('out');
        if (otherUserMediaElement.muted) {
            otherUserMediaElement.muted = false;
            otherUserMediaElement.pause();
        } else {
            otherUserMediaElement.muted = true;
            otherUserMediaElement.play();
        }
    });

    // Manual resume buffer for the remote stream
    $("#btnResumeBuffer").off('click').on('click', (e) => {
        if (resumeBuffer != undefined){
            resumeBuffer();
        }else{
            console.log("No remote stream is not connected");
        }
    });

    //$("#chosenAction").hide();
    setRole();

    $('#version').text(properties.versionname);
    tick = window.setInterval(t => {
        var scale = properties.maxStashFrames / 100.0;
        var timeline_length = Math.floor(properties.maxStashFrames * properties.procFramesize / 44100);
        var spk = backlog_spk / scale;
        var sil = backlog_sil / scale;
        var timeline = Math.floor((backlog_spk + backlog_sil) * properties.procFramesize / 44100.0);
        $('#unruptbuffer_len').text(timeline + "/" + timeline_length + " seconds");
        $('#unruptbuffer_sil').css('width', sil + "%").attr('aria-valuenow', sil);
        $('#unruptbuffer_spk').css('width', spk + "%").attr('aria-valuenow', spk);
        var playout = backlog > 1 ? "playing" : "direct";
        var newmode = (iamspeaking || paused) ? "paused" : playout;
        if (newmode != mode) {
            if (remoteStream && videoEnabled && unruptEnabled) {
                mode = newmode;
                $('#mode').text(mode);
                var pauseIcon = $('#pauseOther');
                var pause = false;
                if (mode === "paused") {
                    //otherUserMediaElement.pause();
                    //videoCapture();
                    pauseIcon.show();
                    //$('#out').hide();
                    pause = true;
                } else {
                    //otherUserMediaElement.play();
                    pauseIcon.hide();
                    //$('#out').show();
                }
                // ideally if this is pause-start, we'd snapshot the video and pull a still
                //otherUserMediaElement.srcObject.getTracks().forEach(t => t.enabled = !pause);
            }
        }
    }, 250);
});


$(document).ready(function () {
    var unrupturltag = $("#unrupturl");
    unrupturltag.val(window.location.href)
    var clipboard = new Clipboard('.unrupt-action-btn');


    clipboard.on('success', function (e) {
        //
        var message_holder = $("#message_holder");
        var message = "copied to clipboard";
        message_holder.html('<strong>' + message + '</strong>');
        message_holder.addClass("flash-message");
        setTimeout(function () {
            message_holder.removeClass("flash-message");
        }, 3000);
    });

    clipboard.on('error', function (e) {
        // console.log(e);
    });
});
