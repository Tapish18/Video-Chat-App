const socket = io.connect();

const roomId = document.getElementById("roomId");
const joinBtn = document.getElementById("join-btn");
const userVideo = document.getElementById("user-video");
const peerVideo = document.getElementById("peer-video");
const formDetails = document.getElementById("form-details");
const videoLobby = document.getElementById("video-chat-loby");
const chatBtns = document.getElementById("chat-btns");
const muteBtn = document.getElementById("speaker-btn");
const hideBtn = document.getElementById("video-btn");
const leaveBtn = document.getElementById("leave-room");
// let iceCandidateQueue = [];
let creater = false;
let rtcPeerConnection;
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

let userStream;
let audioToggle = true;
let videoToggle = true;

joinBtn.addEventListener("click", async () => {
  if (roomId.value == "") {
    alert("Please Enter Room Id");
  } else {
    // console.log(socket);
    socket.emit("joinRoom", roomId.value);
  }
});

socket.on("created", () => {
  userVideo.style = "display:block";
  chatBtns.style = "display:flex";
  navigator.getUserMedia(
    { audio: true, video: { height: 1280, width: 720 } },
    (stream) => {
      userStream = stream;
      creater = true;
      formDetails.style = "display:none";
      console.log("stream", stream);
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function () {
        userVideo.play();
      };
    },
    (e) => {
      console.log("Error Occured : ", e);
    }
  );
});
socket.on("joined", () => {
  userVideo.style = "display:block";
  peerVideo.style = "display:block";
  chatBtns.style = "display:flex";
  navigator.getUserMedia(
    { audio: true, video: { height: 1280, width: 720 } },
    (stream) => {
      userStream = stream;
      creater = false;
      formDetails.style = "display:none";
      console.log("stream", stream);
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function () {
        userVideo.play();
      };
      socket.emit("ready", roomId.value);
    },
    (e) => {
      console.log("Error Occured : ", e);
    }
  );
});

socket.on("peerJoined", () => {
  peerVideo.style = "display:block";
});

socket.on("full", () => {
  alert("Can't join room with Room Id : " + roomId.value);
});

socket.on("ready", () => {
  console.log("listening ready event");
  // console.log(creater);
  // console.log(userStream.getTracks());
  if (creater) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    // console.log(sendCandidate);

    rtcPeerConnection.onicecandidate = sendCandidate; // This will pass an event directy to the function.This type of architecture is called as an interface.
    rtcPeerConnection.ontrack = onTrackFunction; //This is when we recieve stream at our end;

    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); // Audio stream of creator
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // Video stream of creator
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomId.value);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

function sendCandidate(event) {
  //   console.log(event);
  //   console.log(event.candidates);
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomId.value);
  }
}

function onTrackFunction(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function () {
    peerVideo.play();
  };
}
socket.on("offer", (offer) => {
  console.log(userStream.getTracks(), userStream);
  if (!creater) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    // console.log(sendCandidate);

    rtcPeerConnection.onicecandidate = sendCandidate; // This will pass an event directy to the function.This type of architecture is called as an interface.
    rtcPeerConnection.ontrack = onTrackFunction; //This is when we recieve stream at our end;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); // Audio stream of peer
    // console.log(userStream.getTracks(), userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream); // Video stream of peer
    // rtcPeerConnection
    //   .setRemoteDescription(new RTCSessionDescription(offer))
    //   .then(() => {
    //     rtcPeerConnection.createAnswer();
    //   })
    //   .then((answer) => {
    //     rtcPeerConnection.setLocalDescription(answer);
    //   })
    //   .then(() => {
    //     socket.emit("answer", rtcPeerConnection.localDescription, roomId.value);
    //     processQueuedCandidates();
    //   })
    //   .catch((e) => {
    //     console.log("Error Occurred : ", e);
    //   });
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomId.value);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

socket.on("answer", (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);
  // rtcPeerConnection
  //   .setRemoteDescription(new RTCSessionDescription(answer))
  //   .then(() => {
  //     processQueuedCandidates();
  //   })
  //   .catch((e) => {
  //     console.log("Error Occurred : ", e);
  //   });
});

socket.on("candidate", (candidate) => {
  const iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);

  // if (rtcPeerConnection && rtcPeerConnection.remoteDescription) {
  //   rtcPeerConnection
  //     .addIceCandidate(iceCandidate)
  //     .then(() => {
  //       console.log("Successfully added the remote ICE candidate");
  //     })
  //     .catch((e) => {
  //       console.error("Error occurred in adding remote ICE candidates: ", e);
  //     });
  // } else {
  //   iceCandidateQueue.push(iceCandidate);
  // }
});

// function processQueuedCandidates() {
//   while (iceCandidateQueue.length > 0) {
//     const candidate = iceCandidateQueue.shift();
//     rtcPeerConnection
//       .addIceCandidate(candidate)
//       .then(() => {
//         console.log("Successfully added the remote ICE candidate from queue");
//       })
//       .catch((e) => {
//         console.error(
//           "Error occurred in adding remote ICE candidates from queue: ",
//           e
//         );
//       });
//   }
// }

muteBtn.addEventListener("click", () => {
  if (audioToggle == true) {
    //mute it
    audioToggle = false;
    muteBtn.innerText = "Unmute";
  } else {
    audioToggle = true;
    muteBtn.innerText = "Mute";
  }
  userStream.getTracks()[0].enabled = audioToggle;
});

hideBtn.addEventListener("click", () => {
  if (videoToggle == true) {
    videoToggle = false;
    hideBtn.innerText = "Unhide";
  } else {
    videoToggle = true;
    hideBtn.innerText = "Hide";
  }
  userStream.getTracks()[1].enabled = videoToggle;
});

leaveBtn.addEventListener("click", () => {
  formDetails.style = "display:flex";
  peerVideo.style = "display:none";
  userVideo.style = "display:none";
  chatBtns.style = "display:none";

  socket.emit("leave", roomId.value);
  roomId.value = "";
  if (userVideo.srcObject) {
    userVideo.srcObject.getTracks().forEach((track) => {
      track.stop();
    });
  }
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks().forEach((track) => {
      track.stop();
    });
  }
  if (rtcPeerConnection) {
    rtcPeerConnection.onicecandidate = null;
    rtcPeerConnection.ontrack = null;
    rtcPeerConnection.addTrack = null;
    rtcPeerConnection.close();
  }
});

socket.on("leave", () => {
  if (creater) {
    peerVideo.style = "display:none";
    if (peerVideo.srcObject) {
      peerVideo.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (rtcPeerConnection) {
      rtcPeerConnection.onicecandidate = null;
      rtcPeerConnection.ontrack = null;
      rtcPeerConnection.addTrack = null;
      rtcPeerConnection.close();
    }
  } else {
    formDetails.style = "display:flex";
    userVideo.style = "display:none";
    peerVideo.style = "display:none";
    chatBtns.style = "display:none";

    socket.emit("leave", roomId.value);
    roomId.value = "";

    if (userVideo.srcObject) {
      userVideo.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (peerVideo.srcObject) {
      peerVideo.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (rtcPeerConnection) {
      rtcPeerConnection.onicecandidate = null;
      rtcPeerConnection.ontrack = null;
      rtcPeerConnection.addTrack = null;
      rtcPeerConnection.close();
    }
    alert("Owner has end the meeting");
  }
});
