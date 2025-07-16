import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import { useNavigate } from 'react-router-dom';
import server from '../environment';


import styles from '../styles/videoComponent.module.css';

const server_url = server;
const connections = {};
const peerConfigConnections = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, 
  ]
};

function VideoMeetComponent() {
const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();
  const videoRef = useRef([]);
  const navigate = useNavigate();
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvaliable, setAudioAvaliable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessages, setNewMessages] = useState("");  // <== this should be a string, not array



  const handleVideo = () => {
    setVideo(prev => {
      const updated = !prev;
      if (window.localStream) {
        const videoTrack = window.localStream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = updated;
      }
      return updated;
    });
  };

  const handleAudio = () => {
    setAudio(prev => {
      const updated = !prev;
      if (window.localStream) {
        const audioTrack = window.localStream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = updated;
      }
      return updated;
    });
  };

  let sendMessage = () =>{
    socketRef.current.emit("chat-message", newMessages, username);
    setNewMessages("");
  }
  

  let getDisplayMediaSuccess =(stream) =>{
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch(e) {console.log(e)}

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for(let id in connections) {
      if(id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream)
      connections[id].createOffer().then((description)=>{
        connections[id].setLocalDescription(description)
        .then(()=>{
          socketRef.current.emit("signal",id, JSON.stringify({"sdp": description}))
        })
        .catch(e => console.log(e)) 
      })
    }
    stream.getTracks().forEach(track => {
      track.onended = () => {
       setScreen(false);

        try {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        } catch (e) {
          console.log(e);
        }

        const blackslience = (...args) => new MediaStream([black(...args), slience()]);
        window.localStream = blackslience();
        localVideoRef.current.srcObject = window.localStream;

       getUserMedia();
      };
    });
  };
  

  let getDisplayMedia = () =>{
    if(screen) {
      if(navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({video: true, audio: true})
        .then(getDisplayMediaSuccess)
        .then((stream) =>{ })
        .catch((e)=> console.log(e))
      }
    }
  }

  useEffect(()=>{
    if(screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen])

  let handleScreen = () =>{
    setScreen(!screen);
  }

  //ask browser for the permission
  const getPermission = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoAvailable(!!videoPermission);

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvaliable(!!audioPermission);

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      if (videoPermission || audioPermission) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        window.localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.error("Permission error:", err);
    }
  };

  useEffect(() => {
    getPermission();
  }, []);

  const slience = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };
//hamdle local stream setup and set offer to other
  const getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
       // console.log("local stream set", stream);
      }
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play();//add this 
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then(description => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
          }).catch(console.log);
      }).catch(console.log);
    }

    stream.getTracks().forEach(track => {
      track.onended = () => {
        setVideo(false);
        setAudio(false);

        try {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        } catch (e) {
          console.log(e);
        }

        const blackslience = (...args) => new MediaStream([black(...args), slience()]);
        window.localStream = blackslience();
        localVideoRef.current.srcObject = window.localStream;

        for (let id in connections) {
          connections[id].addStream(window.localStream);
          connections[id].createOffer().then(description => {
            connections[id].setLocalDescription(description).then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));
            }).catch(console.log);
          }).catch(console.log);
        }
      };
    });
  };

  // call camera /mic whne user click
  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvaliable)) {
      navigator.mediaDevices.getUserMedia({ video, audio })
        .then(getUserMediaSuccess)
        .catch(console.log);
    } else {
      try {
        const tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (e) { }
    }
  };
  

 // useEffect(() => {
 //   if (video !== undefined && audio !== undefined) {
 //     getUserMedia();
  //  }
 // }, [audio, video]);

//handle incoming SDP and ICE message
  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then(description => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
              }).catch(console.log);
            }).catch(console.log);
          }
        }).catch(console.log);
      }

      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(console.log);
      }
    }
  };
  // connect to socket and setup peer
 let addMessages = (data, sender, socketIdSender) => {
 // console.log("message is recieved",  { sender, data, socketIdSender })
  setMessages((prevMessages) => [
    ...prevMessages,
    { sender, data }
  ]);
 }

   // if(socketIdSender !== socketIdRef.current){
    //  setMessages((prev)=> prev + 1)
   // }
 // }

  const connect = () => {
    setAskForUsername(false);
    setVideo(videoAvailable);
    setAudio(audioAvaliable);
    // get user media immediately here 
    getUserMedia();

  //  let routerTo = useNavigate();
  // for the check purpose

    socketRef.current = io(server_url, {
       transports: ["websocket"],
      withCredentials: true
    });
  

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", "room-123");
    });

    socketRef.current.on("signal", gotMessageFromServer);

    //socketRef.current.on('chat-messages', addMessages)
    socketRef.current.on('chat-message', addMessages);


    socketRef.current.on("user-left", (id) => {
      setVideos(videos => videos.filter(v => v.socketId !== id));
    });

   // socketRef.current.on("user-joined", (id, clients) => {
   //   clients.forEach((socketListId) => {
   //     connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

   //     connections[socketListId].onicecandidate = (event) => {
   //       if (event.candidate) {
   //         socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
   //       }
   //     };
    socketRef.current.on("user-joined", (id, clients) => {
    if (Array.isArray(clients)) {
    clients.forEach((socketListId) => {
      connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
  

      connections[socketListId].onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));
        }
      };

        connections[socketListId].onaddstream = (event) => {
          const existing = videoRef.current.find(v => v.socketId === socketListId);
          const newVideo = {
            socketId: socketListId,
            stream: event.stream,
            autoPlay: true,
            playsInline: true
          };

          if (existing) {
            setVideos(prev => {
              const updatedVideos = prev.map(v => v.socketId === socketListId ? { ...v, stream: event.stream } : v);
              videoRef.current = updatedVideos;
              return updatedVideos;
            });
          } else {
            setVideos(prev => {
              const updatedVideos = [...prev, newVideo];
              videoRef.current = updatedVideos;
              return updatedVideos;
            });
          }
        };

        if (window.localStream) {
          connections[socketListId].addStream(window.localStream);
        } else {
          const blackslience = (...args) => new MediaStream([black(...args), slience()]);
          window.localStream = blackslience();
          connections[socketListId].addStream(window.localStream);
        }
      });
    }

      if (id === socketIdRef.current) {
        for (let id2 in connections) {
          if (id2 === socketIdRef.current) continue;
          try {
            connections[id2].addStream(window.localStream);
          } catch (e) { }

          connections[id2].createOffer().then(description => {
            connections[id2].setLocalDescription(description).then(() => {
              socketRef.current.emit("signal", id2, JSON.stringify({ sdp: connections[id2].localDescription }));
            }).catch(console.log);
          }).catch(console.log);
        }
      }
    });
  }
// clean up when component unmounts
  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);


let handleEndCall = () =>{
  try{
    let tracks = localVideoRef.current.srcObject.getTracks();
    tracks.forEach(track => track.stop())
  } catch (e) {}

  navigate("/home")
  
}
  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={connect}>Connect</Button>
          <div>
            <video ref={localVideoRef} autoPlay muted playsInline />
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>

        {showModal ?  <div className={styles.chatRoom}>
            
            <div className={styles.chatContainer}>
              <h1>Chat</h1>

              <div className={styles.chattingDisplay}>

                 {messages.length !== 0 ? messages.map((item, index) => {

                   console.log(messages);
                     return (
                     <div style={{ marginBottom: "20px" }} key={index}>
                       <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                         <p>{item.data}</p>
                            </div>
                              )
                       }) : <p>No Messages Yet</p>}
              </div>
              <div className={styles.chattingArea}>
              <TextField value={newMessages} onChange={(e) => setNewMessages(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
              <Button variant='contained' onClick={sendMessage}>Send</Button>
              </div>
              </div>
          </div> : <></>}

        <div className={styles.buttonContainers}>
          <IconButton onClick={handleVideo} style={{color: "white"}}>
            {(video===true) ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
          <IconButton onClick={ handleEndCall} style={{color: "red"}}>
             <CallEndIcon />
          </IconButton>
          <IconButton  onClick={handleAudio} style={{color: "white"}}>
            {audio === true ? <MicIcon /> : <MicOffIcon />}
          </IconButton>

          {screenAvailable === true ?
          <IconButton onClick={handleScreen} style={{color: "white"}}>
            {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
          </IconButton> : <></>}

          <Badge badgeContent={messages.length} max={999} color='secondary'>
            <IconButton onClick={()=> setModal(!showModal)} style={{color: "white"}}>
            <ChatIcon />
          </IconButton>
          </Badge>
        </div>
         <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted playsInline />
         <div className={styles.conferenceView}>
         {videos.map((video) => (
        <div key={video.socketId}>
        
         <video
         autoPlay
         playsInline
         muted={false}
         ref={(ref) => {
        if (ref && video.stream) {
          ref.srcObject = video.stream;
        }
      }}
    />
  </div>
))}
</div>

        </div>
      )}
    </div>
  );
}

export default VideoMeetComponent;  
