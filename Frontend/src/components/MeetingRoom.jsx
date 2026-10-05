import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import "./MeetingRoom.css";

function MeetingRoom() {

    const { meetingCode } = useParams();

    const navigate = useNavigate();

    // =============================================
    // REFS
    // =============================================

    const videoRef = useRef(null);

    const localStreamRef = useRef(null);

    const socketRef = useRef(null);

    // Stores RTCPeerConnection for every remote user
    const peerConnectionsRef = useRef({});

    // Stores ICE candidates that arrive before
    // the corresponding peer connection is ready
    const pendingIceCandidatesRef = useRef({});

    // Prevent joining the same Socket.IO room twice
    const socketRoomJoinedRef = useRef(false);


    // =============================================
    // STATE
    // =============================================

    const [meeting, setMeeting] = useState(null);

    const [participants, setParticipants] = useState([]);

    const [remoteStreams, setRemoteStreams] = useState([]);

    const [loading, setLoading] = useState(true);

    const [joining, setJoining] = useState(false);

    const [leaving, setLeaving] = useState(false);

    const [ending, setEnding] = useState(false);

    const [cameraOn, setCameraOn] = useState(false);

    const [microphoneOn, setMicrophoneOn] = useState(false);

    const [mediaReady, setMediaReady] = useState(false);

    const [mediaError, setMediaError] = useState("");

    const [error, setError] = useState("");


    // =============================================
    // USER
    // =============================================

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const isTeacher = user.role === "teacher";

    const token = localStorage.getItem("token");


    // =============================================
    // WEBRTC CONFIGURATION
    // =============================================

    const rtcConfiguration = {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ]
    };


    // =============================================
    // SOCKET.IO CONNECTION
    // =============================================

    useEffect(() => {

        const socket = io("http://localhost:5000");

        socketRef.current = socket;


        // -----------------------------------------
        // SOCKET CONNECTED
        // -----------------------------------------

        socket.on("connect", () => {

            console.log(
                "Socket connected:",
                socket.id
            );

        });


        // -----------------------------------------
        // EXISTING USERS
        // -----------------------------------------

        socket.on(
            "existing-users",
            async (users) => {

                console.log(
                    "Users already in meeting:",
                    users
                );

                /*
                 * The NEW user creates offers to
                 * users who are already in the room.
                 */

                for (const remoteSocketId of users) {

                    try {

                        const peerConnection =
                            createPeerConnection(
                                remoteSocketId
                            );

                        const offer =
                            await peerConnection.createOffer();

                        await peerConnection.setLocalDescription(
                            offer
                        );

                        socket.emit(
                            "offer",
                            {
                                target: remoteSocketId,
                                offer
                            }
                        );

                    } catch (error) {

                        console.error(
                            "Error creating offer:",
                            error
                        );

                    }

                }

            }
        );


        // -----------------------------------------
        // USER JOINED
        // -----------------------------------------

        socket.on(
            "user-joined",
            (socketId) => {

                console.log(
                    "New user joined:",
                    socketId
                );

            }
        );


        // -----------------------------------------
        // RECEIVE OFFER
        // -----------------------------------------

        socket.on(
            "offer",
            async ({ sender, offer }) => {

                console.log(
                    "Received offer from:",
                    sender
                );

                try {

                    const peerConnection =
                        createPeerConnection(sender);


                    await peerConnection.setRemoteDescription(
                        new RTCSessionDescription(offer)
                    );


                    // Add any ICE candidates that
                    // arrived before the offer
                    await addPendingIceCandidates(
                        sender,
                        peerConnection
                    );


                    const answer =
                        await peerConnection.createAnswer();


                    await peerConnection.setLocalDescription(
                        answer
                    );


                    socket.emit(
                        "answer",
                        {
                            target: sender,
                            answer
                        }
                    );


                    console.log(
                        "Answer sent to:",
                        sender
                    );

                } catch (error) {

                    console.error(
                        "Error handling offer:",
                        error
                    );

                }

            }
        );


        // -----------------------------------------
        // RECEIVE ANSWER
        // -----------------------------------------

        socket.on(
            "answer",
            async ({ sender, answer }) => {

                console.log(
                    "Received answer from:",
                    sender
                );

                try {

                    const peerConnection =
                        peerConnectionsRef.current[
                            sender
                        ];


                    if (!peerConnection) {

                        console.warn(
                            "Peer connection not found for answer:",
                            sender
                        );

                        return;

                    }


                    await peerConnection.setRemoteDescription(
                        new RTCSessionDescription(answer)
                    );


                    await addPendingIceCandidates(
                        sender,
                        peerConnection
                    );


                } catch (error) {

                    console.error(
                        "Error handling answer:",
                        error
                    );

                }

            }
        );


        // -----------------------------------------
        // RECEIVE ICE CANDIDATE
        // -----------------------------------------

        socket.on(
            "ice-candidate",
            async ({ sender, candidate }) => {

                console.log(
                    "Received ICE candidate from:",
                    sender
                );

                try {

                    const peerConnection =
                        peerConnectionsRef.current[
                            sender
                        ];


                    if (
                        peerConnection &&
                        peerConnection.remoteDescription
                    ) {

                        await peerConnection.addIceCandidate(
                            new RTCIceCandidate(candidate)
                        );

                    } else {

                        if (
                            !pendingIceCandidatesRef.current[
                                sender
                            ]
                        ) {

                            pendingIceCandidatesRef.current[
                                sender
                            ] = [];

                        }


                        pendingIceCandidatesRef.current[
                            sender
                        ].push(candidate);

                    }

                } catch (error) {

                    console.error(
                        "Error adding ICE candidate:",
                        error
                    );

                }

            }
        );


        // -----------------------------------------
        // USER LEFT
        // -----------------------------------------

        socket.on(
            "user-left",
            (socketId) => {

                console.log(
                    "User left:",
                    socketId
                );

                removePeerConnection(
                    socketId
                );

            }
        );


        // -----------------------------------------
        // SOCKET DISCONNECTED
        // -----------------------------------------

        socket.on("disconnect", () => {

            console.log(
                "Socket disconnected"
            );

        });


        // -----------------------------------------
        // CLEANUP
        // -----------------------------------------

        return () => {

            Object.values(
                peerConnectionsRef.current
            ).forEach((peerConnection) => {

                peerConnection.close();

            });


            peerConnectionsRef.current = {};


            pendingIceCandidatesRef.current = {};


            socket.disconnect();

            socketRef.current = null;

            socketRoomJoinedRef.current = false;

        };

    }, []);


    // =============================================
    // CREATE PEER CONNECTION
    // =============================================

    const createPeerConnection = (
        remoteSocketId
    ) => {

        // Reuse existing connection
        if (
            peerConnectionsRef.current[
                remoteSocketId
            ]
        ) {

            return (
                peerConnectionsRef.current[
                    remoteSocketId
                ]
            );

        }


        console.log(
            "Creating peer connection for:",
            remoteSocketId
        );


        const peerConnection =
            new RTCPeerConnection(
                rtcConfiguration
            );


        peerConnectionsRef.current[
            remoteSocketId
        ] = peerConnection;


        // -----------------------------------------
        // ADD LOCAL CAMERA + MICROPHONE
        // -----------------------------------------

        if (localStreamRef.current) {

            localStreamRef.current
                .getTracks()
                .forEach((track) => {

                    peerConnection.addTrack(
                        track,
                        localStreamRef.current
                    );

                });

        }


        // -----------------------------------------
        // RECEIVE REMOTE MEDIA
        // -----------------------------------------

        peerConnection.ontrack = (event) => {

            console.log(
                "Remote track received from:",
                remoteSocketId
            );


            const remoteStream =
                event.streams[0];


            if (!remoteStream) {
                return;
            }


            setRemoteStreams(
                (currentStreams) => {

                    const existing =
                        currentStreams.find(
                            (item) =>
                                item.socketId ===
                                remoteSocketId
                        );


                    if (existing) {

                        return currentStreams;

                    }


                    return [
                        ...currentStreams,
                        {
                            socketId:
                                remoteSocketId,
                            stream:
                                remoteStream
                        }
                    ];

                }
            );

        };


        // -----------------------------------------
        // ICE CANDIDATES
        // -----------------------------------------

        peerConnection.onicecandidate = (
            event
        ) => {

            if (!event.candidate) {
                return;
            }


            if (
                !socketRef.current ||
                !socketRef.current.connected
            ) {

                return;

            }


            socketRef.current.emit(
                "ice-candidate",
                {
                    target:
                        remoteSocketId,
                    candidate:
                        event.candidate
                }
            );

        };


        // -----------------------------------------
        // CONNECTION STATE
        // -----------------------------------------

        peerConnection.onconnectionstatechange =
            () => {

                console.log(
                    `WebRTC connection with ${remoteSocketId}:`,
                    peerConnection.connectionState
                );


                if (
                    peerConnection.connectionState ===
                        "failed" ||
                    peerConnection.connectionState ===
                        "closed" ||
                    peerConnection.connectionState ===
                        "disconnected"
                ) {

                    removePeerConnection(
                        remoteSocketId
                    );

                }

            };


        return peerConnection;

    };


    // =============================================
    // ADD PENDING ICE CANDIDATES
    // =============================================

    const addPendingIceCandidates = async (
        remoteSocketId,
        peerConnection
    ) => {

        const candidates =
            pendingIceCandidatesRef.current[
                remoteSocketId
            ] || [];


        for (const candidate of candidates) {

            try {

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

            } catch (error) {

                console.error(
                    "Error adding pending ICE candidate:",
                    error
                );

            }

        }


        delete pendingIceCandidatesRef.current[
            remoteSocketId
        ];

    };


    // =============================================
    // REMOVE PEER CONNECTION
    // =============================================

    const removePeerConnection = (
        remoteSocketId
    ) => {

        const peerConnection =
            peerConnectionsRef.current[
                remoteSocketId
            ];


        if (peerConnection) {

            peerConnection.close();

        }


        delete peerConnectionsRef.current[
            remoteSocketId
        ];


        delete pendingIceCandidatesRef.current[
            remoteSocketId
        ];


        setRemoteStreams(
            (currentStreams) =>
                currentStreams.filter(
                    (item) =>
                        item.socketId !==
                        remoteSocketId
                )
        );

    };


    // =============================================
    // GET MEETING
    // =============================================

    const fetchMeeting = async () => {

        try {

            setLoading(true);

            setError("");


            const response = await axios.get(
                `http://localhost:5000/api/meetings/code/${meetingCode}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            setMeeting(
                response.data
            );

        } catch (error) {

            console.error(
                "Unable to load meeting:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to load meeting."
            );

        } finally {

            setLoading(false);

        }

    };


    // =============================================
    // JOIN MEETING REST API
    // =============================================

    const joinMeeting = async () => {

        try {

            setJoining(true);

            setError("");


            const response = await axios.post(
                "http://localhost:5000/api/meetings/join",
                {
                    meetingCode
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            if (response.data?.meeting) {

                setMeeting(
                    response.data.meeting
                );

            }

        } catch (error) {

            console.error(
                "Unable to join meeting:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to join meeting."
            );

        } finally {

            setJoining(false);

        }

    };


    // =============================================
    // START CAMERA + MICROPHONE
    // =============================================

    const startMedia = async () => {

        try {

            setMediaError("");


            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: true,
                        audio: true
                    }
                );


            localStreamRef.current =
                stream;


            if (videoRef.current) {

                videoRef.current.srcObject =
                    stream;

            }


            setCameraOn(true);

            setMicrophoneOn(true);

            setMediaReady(true);

        } catch (error) {

            console.error(
                "Unable to access camera/microphone:",
                error
            );


            setMediaReady(false);


            if (
                error.name ===
                "NotAllowedError"
            ) {

                setMediaError(
                    "Camera and microphone permission was denied."
                );

            } else if (
                error.name ===
                "NotFoundError"
            ) {

                setMediaError(
                    "Camera or microphone was not found."
                );

            } else {

                setMediaError(
                    "Unable to access camera or microphone."
                );

            }

        }

    };


    // =============================================
    // STOP MEDIA
    // =============================================

    const stopMedia = () => {

        if (localStreamRef.current) {

            localStreamRef.current
                .getTracks()
                .forEach((track) => {

                    track.stop();

                });


            localStreamRef.current =
                null;

        }


        if (videoRef.current) {

            videoRef.current.srcObject =
                null;

        }


        setCameraOn(false);

        setMicrophoneOn(false);

        setMediaReady(false);

    };


    // =============================================
    // CAMERA TOGGLE
    // =============================================

    const toggleCamera = () => {

        const stream =
            localStreamRef.current;


        if (!stream) {
            return;
        }


        const videoTracks =
            stream.getVideoTracks();


        if (videoTracks.length === 0) {
            return;
        }


        const newState =
            !cameraOn;


        videoTracks.forEach(
            (track) => {

                track.enabled =
                    newState;

            }
        );


        setCameraOn(
            newState
        );

    };


    // =============================================
    // MICROPHONE TOGGLE
    // =============================================

    const toggleMicrophone = () => {

        const stream =
            localStreamRef.current;


        if (!stream) {
            return;
        }


        const audioTracks =
            stream.getAudioTracks();


        if (audioTracks.length === 0) {
            return;
        }


        const newState =
            !microphoneOn;


        audioTracks.forEach(
            (track) => {

                track.enabled =
                    newState;

            }
        );


        setMicrophoneOn(
            newState
        );

    };


    // =============================================
    // GET PARTICIPANTS
    // =============================================

    const fetchParticipants = async () => {

        if (
            !meeting?._id ||
            !isTeacher
        ) {

            return;

        }


        try {

            const response =
                await axios.get(
                    `http://localhost:5000/api/meetings/${meeting._id}/participants`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            setParticipants(
                response.data.participants ||
                []
            );

        } catch (error) {

            console.error(
                "Unable to load participants:",
                error
            );

        }

    };


    // =============================================
    // LOAD MEETING
    // =============================================

    useEffect(() => {

        if (!meetingCode) {

            setError(
                "Meeting code is missing."
            );

            setLoading(false);

            return;

        }


        fetchMeeting();

    }, [meetingCode]);


    // =============================================
    // JOIN MEETING AFTER LOAD
    // =============================================

    useEffect(() => {

        if (
            meeting &&
            !joining &&
            meeting.status !== "ended"
        ) {

            joinMeeting();

        }

    }, [meeting?._id]);


    // =============================================
    // START MEDIA AFTER MEETING LOAD
    // =============================================

    useEffect(() => {

        if (!meeting) {
            return;
        }


        if (
            meeting.status === "ended"
        ) {

            return;

        }


        startMedia();


        return () => {

            stopMedia();

        };

    }, [meeting?._id]);


    // =============================================
    // JOIN SOCKET.IO ROOM
    // =============================================

    useEffect(() => {

        if (
            !meetingCode ||
            !mediaReady
        ) {

            return;

        }


        const socket =
            socketRef.current;


        if (!socket) {
            return;
        }


        const joinRoom = () => {

            if (
                socketRoomJoinedRef.current
            ) {

                return;

            }


            socket.emit(
                "join-meeting",
                meetingCode
            );


            socketRoomJoinedRef.current =
                true;


            console.log(
                "Joined Socket.IO meeting room:",
                meetingCode
            );

        };


        if (socket.connected) {

            joinRoom();

        } else {

            socket.on(
                "connect",
                joinRoom
            );

        }


        return () => {

            socket.off(
                "connect",
                joinRoom
            );

        };

    }, [
        meetingCode,
        mediaReady
    ]);


    // =============================================
    // LOAD PARTICIPANTS
    // =============================================

    useEffect(() => {

        if (
            !meeting?._id ||
            !isTeacher
        ) {

            return;

        }


        fetchParticipants();


        const interval =
            setInterval(() => {

                fetchParticipants();

            }, 5000);


        return () => {

            clearInterval(
                interval
            );

        };

    }, [
        meeting?._id,
        isTeacher
    ]);


    // =============================================
    // LEAVE MEETING
    // =============================================

    const leaveMeeting = async () => {

        if (!meeting?._id) {

            navigate(-1);

            return;

        }


        try {

            setLeaving(true);


            // Stop WebRTC peer connections
            Object.values(
                peerConnectionsRef.current
            ).forEach(
                (peerConnection) => {

                    peerConnection.close();

                }
            );


            peerConnectionsRef.current = {};


            setRemoteStreams([]);


            stopMedia();


            if (socketRef.current) {

                socketRef.current.disconnect();

                socketRef.current = null;

                socketRoomJoinedRef.current =
                    false;

            }


            await axios.post(
                `http://localhost:5000/api/meetings/${meeting._id}/leave`,
                {},
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            navigate(-1);

        } catch (error) {

            console.error(
                "Unable to leave meeting:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to leave meeting."
            );

        } finally {

            setLeaving(false);

        }

    };


    // =============================================
    // END MEETING
    // =============================================

    const endMeeting = async () => {

        if (!meeting?._id) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to end this meeting for everyone?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setEnding(true);

            setError("");


            const response =
                await axios.put(
                    `http://localhost:5000/api/meetings/${meeting._id}/end`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            // Close peer connections
            Object.values(
                peerConnectionsRef.current
            ).forEach(
                (peerConnection) => {

                    peerConnection.close();

                }
            );


            peerConnectionsRef.current = {};


            setRemoteStreams([]);


            stopMedia();


            if (socketRef.current) {

                socketRef.current.disconnect();

                socketRef.current = null;

                socketRoomJoinedRef.current =
                    false;

            }


            setMeeting(
                response.data.meeting
            );

        } catch (error) {

            console.error(
                "Unable to end meeting:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to end meeting."
            );

        } finally {

            setEnding(false);

        }

    };


    // =============================================
    // STATUS
    // =============================================

    const getStatusText = () => {

        if (!meeting) {
            return "";
        }


        if (
            meeting.status ===
            "ended"
        ) {

            return "Ended";

        }


        if (
            meeting.status ===
            "live"
        ) {

            return "Live";

        }


        return "Scheduled";

    };


    // =============================================
    // LOADING
    // =============================================

    if (loading) {

        return (

            <div className="meeting-room-page">

                <div className="meeting-room-loading">

                    Loading meeting...

                </div>

            </div>

        );

    }


    // =============================================
    // ERROR
    // =============================================

    if (
        error &&
        !meeting
    ) {

        return (

            <div className="meeting-room-page">

                <div className="meeting-room-error-card">

                    <h2>
                        Unable to open meeting
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Go Back
                    </button>

                </div>

            </div>

        );

    }


    // =============================================
    // MAIN UI
    // =============================================

    return (

        <div className="meeting-room-page">


            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <header className="meeting-room-header">

                <div className="meeting-room-header-left">

                    <button
                        type="button"
                        className="meeting-back-button"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        ←
                    </button>


                    <div>

                        <h1>
                            {meeting?.title ||
                                "Meeting"}
                        </h1>


                        <div className="meeting-room-meta">

                            <span>

                                Code:{" "}

                                <strong>
                                    {meeting?.meetingCode}
                                </strong>

                            </span>


                            <span
                                className={
                                    `meeting-room-status meeting-room-status-${meeting?.status}`
                                }
                            >
                                {getStatusText()}
                            </span>

                        </div>

                    </div>

                </div>


                <div className="meeting-room-header-actions">

                    {isTeacher &&
                        meeting?.status !==
                            "ended" && (

                        <button
                            type="button"
                            className="meeting-end-button"
                            onClick={
                                endMeeting
                            }
                            disabled={
                                ending
                            }
                        >

                            {ending
                                ? "Ending..."
                                : "End Meeting"}

                        </button>

                    )}


                    <button
                        type="button"
                        className="meeting-leave-button"
                        onClick={
                            leaveMeeting
                        }
                        disabled={
                            leaving ||
                            ending
                        }
                    >

                        {leaving
                            ? "Leaving..."
                            : "Leave Meeting"}

                    </button>

                </div>

            </header>


            {/* ================================= */}
            {/* ERROR */}
            {/* ================================= */}

            {error && (

                <div className="meeting-room-inline-error">

                    {error}

                </div>

            )}


            {/* ================================= */}
            {/* MEDIA ERROR */}
            {/* ================================= */}

            {mediaError && (

                <div className="meeting-room-media-error">

                    {mediaError}

                </div>

            )}


            {/* ================================= */}
            {/* MAIN */}
            {/* ================================= */}

            <main className="meeting-room-content">


                {/* ================================= */}
                {/* VIDEO AREA */}
                {/* ================================= */}

                <section className="meeting-video-section">


                    {/* ================================= */}
                    {/* LOCAL + REMOTE VIDEOS */}
                    {/* ================================= */}

                    {meeting?.status !==
                        "ended" ? (

                        <div
                            className="meeting-video-container"
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    remoteStreams.length === 0
                                        ? "1fr"
                                        : "repeat(auto-fit, minmax(300px, 1fr))",
                                gap: "10px",
                                padding: "10px"
                            }}
                        >


                            {/* ================================= */}
                            {/* LOCAL VIDEO */}
                            {/* ================================= */}

                            <div
                                style={{
                                    position:
                                        "relative",
                                    width:
                                        "100%",
                                    height:
                                        "100%",
                                    minHeight:
                                        "300px",
                                    background:
                                        "#111827",
                                    borderRadius:
                                        "10px",
                                    overflow:
                                        "hidden"
                                }}
                            >

                                <video
                                    ref={
                                        videoRef
                                    }
                                    className="meeting-local-video"
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width:
                                            "100%",
                                        height:
                                            "100%",
                                        objectFit:
                                            "cover"
                                    }}
                                />


                                {!cameraOn && (

                                    <div className="meeting-camera-off">

                                        <div className="meeting-camera-avatar">

                                            {(user.name ||
                                                "U")
                                                .charAt(0)
                                                .toUpperCase()}

                                        </div>


                                        <span>
                                            Camera is off
                                        </span>

                                    </div>

                                )}


                                <div className="meeting-video-name">

                                    {user.name ||
                                        "You"}

                                </div>

                            </div>


                            {/* ================================= */}
                            {/* REMOTE VIDEOS */}
                            {/* ================================= */}

                            {remoteStreams.map(
                                (remote) => (

                                    <RemoteVideo
                                        key={
                                            remote.socketId
                                        }
                                        stream={
                                            remote.stream
                                        }
                                        name="Participant"
                                    />

                                )
                            )}


                            {/* ================================= */}
                            {/* CONTROLS */}
                            {/* ================================= */}

                            <div className="meeting-controls">

                                <button
                                    type="button"
                                    className={
                                        `meeting-control-button ${
                                            !microphoneOn
                                                ? "meeting-control-off"
                                                : ""
                                        }`
                                    }
                                    onClick={
                                        toggleMicrophone
                                    }
                                    title={
                                        microphoneOn
                                            ? "Mute microphone"
                                            : "Unmute microphone"
                                    }
                                >

                                    {microphoneOn
                                        ? "Mic On"
                                        : "Mic Off"}

                                </button>


                                <button
                                    type="button"
                                    className={
                                        `meeting-control-button ${
                                            !cameraOn
                                                ? "meeting-control-off"
                                                : ""
                                        }`
                                    }
                                    onClick={
                                        toggleCamera
                                    }
                                    title={
                                        cameraOn
                                            ? "Turn camera off"
                                            : "Turn camera on"
                                    }
                                >

                                    {cameraOn
                                        ? "Camera On"
                                        : "Camera Off"}

                                </button>

                            </div>

                        </div>

                    ) : (

                        <div className="meeting-video-placeholder">

                            <div className="meeting-video-icon">
                                🎥
                            </div>

                            <h2>
                                Meeting Ended
                            </h2>

                            <p>
                                This meeting has been ended
                                by the instructor.
                            </p>

                        </div>

                    )}

                </section>


                {/* ================================= */}
                {/* PARTICIPANTS */}
                {/* ================================= */}

                <aside className="meeting-participants-panel">

                    <div className="meeting-participants-header">

                        <div>

                            <h3>
                                People
                            </h3>

                            <p>

                                {isTeacher
                                    ? `${participants.length} participant${
                                        participants.length === 1
                                            ? ""
                                            : "s"
                                    }`
                                    : "You are in this meeting"}

                            </p>

                        </div>

                    </div>


                    {isTeacher && (

                        <div className="meeting-participants-list">

                            {participants.length === 0 && (

                                <div className="meeting-no-participants">

                                    No participants yet.

                                </div>

                            )}


                            {participants.map(
                                (participant) => (

                                    <div
                                        className="meeting-participant"
                                        key={
                                            participant._id
                                        }
                                    >

                                        <div className="meeting-participant-avatar">

                                            {(
                                                participant.user?.name ||
                                                "U"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}

                                        </div>


                                        <div className="meeting-participant-info">

                                            <strong>

                                                {participant.user?.name ||
                                                    "Unknown User"}

                                            </strong>


                                            <span>

                                                {participant.user?.role ||
                                                    "user"}

                                            </span>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}


                    {!isTeacher && (

                        <div className="meeting-student-info">

                            <div className="meeting-student-avatar">

                                {(user.name ||
                                    "U")
                                    .charAt(0)
                                    .toUpperCase()}

                            </div>


                            <div>

                                <strong>

                                    {user.name ||
                                        "You"}

                                </strong>


                                <span>
                                    You
                                </span>

                            </div>

                        </div>

                    )}

                </aside>

            </main>

        </div>

    );
}


// =============================================
// REMOTE VIDEO COMPONENT
// =============================================

function RemoteVideo({
    stream,
    name
}) {

    const videoRef =
        useRef(null);


    useEffect(() => {

        if (
            videoRef.current &&
            stream
        ) {

            videoRef.current.srcObject =
                stream;

        }


        return () => {

            if (
                videoRef.current
            ) {

                videoRef.current.srcObject =
                    null;

            }

        };

    }, [stream]);


    return (

        <div
            style={{
                position:
                    "relative",
                width:
                    "100%",
                height:
                    "100%",
                minHeight:
                    "300px",
                background:
                    "#111827",
                borderRadius:
                    "10px",
                overflow:
                    "hidden"
            }}
        >

            <video
                ref={
                    videoRef
                }
                autoPlay
                playsInline
                style={{
                    width:
                        "100%",
                    height:
                        "100%",
                    objectFit:
                        "cover"
                }}
            />


            <div
                style={{
                    position:
                        "absolute",
                    bottom:
                        "15px",
                    left:
                        "15px",
                    padding:
                        "7px 11px",
                    borderRadius:
                        "6px",
                    background:
                        "rgba(0, 0, 0, 0.65)",
                    color:
                        "#ffffff",
                    fontSize:
                        "13px"
                }}
            >

                {name}

            </div>

        </div>

    );

}


export default MeetingRoom;