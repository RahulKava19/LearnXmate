import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./MeetingRoom.css";

function MeetingRoom() {
    const { meetingCode } = useParams();
    const navigate = useNavigate();

    const videoRef = useRef(null);
    const localStreamRef = useRef(null);

    const [meeting, setMeeting] = useState(null);
    const [participants, setParticipants] = useState([]);

    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [ending, setEnding] = useState(false);

    const [cameraOn, setCameraOn] = useState(false);
    const [microphoneOn, setMicrophoneOn] = useState(false);

    const [mediaError, setMediaError] = useState("");
    const [error, setError] = useState("");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const isTeacher = user.role === "teacher";

    const token = localStorage.getItem("token");

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
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMeeting(response.data);

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
    // JOIN MEETING
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
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data?.meeting) {
                setMeeting(response.data.meeting);
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
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

            localStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setCameraOn(true);
            setMicrophoneOn(true);

        } catch (error) {
            console.error(
                "Unable to access camera/microphone:",
                error
            );

            if (error.name === "NotAllowedError") {
                setMediaError(
                    "Camera and microphone permission was denied."
                );
            } else if (error.name === "NotFoundError") {
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

            localStreamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOn(false);
        setMicrophoneOn(false);
    };

    // =============================================
    // CAMERA TOGGLE
    // =============================================

    const toggleCamera = () => {
        const stream = localStreamRef.current;

        if (!stream) {
            return;
        }

        const videoTracks =
            stream.getVideoTracks();

        if (videoTracks.length === 0) {
            return;
        }

        const newState = !cameraOn;

        videoTracks.forEach((track) => {
            track.enabled = newState;
        });

        setCameraOn(newState);
    };

    // =============================================
    // MICROPHONE TOGGLE
    // =============================================

    const toggleMicrophone = () => {
        const stream = localStreamRef.current;

        if (!stream) {
            return;
        }

        const audioTracks =
            stream.getAudioTracks();

        if (audioTracks.length === 0) {
            return;
        }

        const newState = !microphoneOn;

        audioTracks.forEach((track) => {
            track.enabled = newState;
        });

        setMicrophoneOn(newState);
    };

    // =============================================
    // GET PARTICIPANTS
    // =============================================

    const fetchParticipants = async () => {
        if (!meeting?._id || !isTeacher) {
            return;
        }

        try {
            const response = await axios.get(
                `http://localhost:5000/api/meetings/${meeting._id}/participants`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setParticipants(
                response.data.participants || []
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
            setError("Meeting code is missing.");
            setLoading(false);
            return;
        }

        fetchMeeting();
    }, [meetingCode]);

    // =============================================
    // JOIN AFTER MEETING LOADS
    // =============================================

    useEffect(() => {
        if (meeting && !joining) {
            joinMeeting();
        }
    }, [meeting?._id]);

    // =============================================
    // START MEDIA AFTER JOIN
    // =============================================

    useEffect(() => {
        if (!meeting) {
            return;
        }

        if (meeting.status === "ended") {
            return;
        }

        startMedia();

        return () => {
            stopMedia();
        };
    }, [meeting?._id]);

    // =============================================
    // LOAD PARTICIPANTS
    // =============================================

    useEffect(() => {
        if (!meeting?._id || !isTeacher) {
            return;
        }

        fetchParticipants();

        const interval = setInterval(() => {
            fetchParticipants();
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [meeting?._id, isTeacher]);

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

            stopMedia();

            await axios.post(
                `http://localhost:5000/api/meetings/${meeting._id}/leave`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
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

        const confirmed = window.confirm(
            "Are you sure you want to end this meeting for everyone?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setEnding(true);
            setError("");

            const response = await axios.put(
                `http://localhost:5000/api/meetings/${meeting._id}/end`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            stopMedia();

            setMeeting(response.data.meeting);

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

        if (meeting.status === "ended") {
            return "Ended";
        }

        if (meeting.status === "live") {
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

    if (error && !meeting) {
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
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </button>

                </div>
            </div>
        );
    }

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
                        onClick={() => navigate(-1)}
                    >
                        ←
                    </button>

                    <div>

                        <h1>
                            {meeting?.title || "Meeting"}
                        </h1>

                        <div className="meeting-room-meta">

                            <span>
                                Code:{" "}
                                <strong>
                                    {meeting?.meetingCode}
                                </strong>
                            </span>

                            <span
                                className={`meeting-room-status meeting-room-status-${meeting?.status}`}
                            >
                                {getStatusText()}
                            </span>

                        </div>

                    </div>

                </div>

                <div className="meeting-room-header-actions">

                    {isTeacher &&
                        meeting?.status !== "ended" && (
                            <button
                                type="button"
                                className="meeting-end-button"
                                onClick={endMeeting}
                                disabled={ending}
                            >
                                {ending
                                    ? "Ending..."
                                    : "End Meeting"}
                            </button>
                        )}

                    <button
                        type="button"
                        className="meeting-leave-button"
                        onClick={leaveMeeting}
                        disabled={leaving || ending}
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

                    {meeting?.status !== "ended" ? (
                        <div className="meeting-video-container">

                            <video
                                ref={videoRef}
                                className="meeting-local-video"
                                autoPlay
                                playsInline
                                muted
                            />

                            {!cameraOn && (
                                <div className="meeting-camera-off">

                                    <div className="meeting-camera-avatar">
                                        {(user.name || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <span>
                                        Camera is off
                                    </span>

                                </div>
                            )}

                            <div className="meeting-video-name">
                                {user.name || "You"}
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

                    {/* ================================= */}
                    {/* CONTROLS */}
                    {/* ================================= */}

                    {meeting?.status !== "ended" && (
                        <div className="meeting-controls">

                            <button
                                type="button"
                                className={`meeting-control-button ${
                                    !microphoneOn
                                        ? "meeting-control-off"
                                        : ""
                                }`}
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
                                className={`meeting-control-button ${
                                    !cameraOn
                                        ? "meeting-control-off"
                                        : ""
                                }`}
                                onClick={toggleCamera}
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
                                {(user.name || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>

                                <strong>
                                    {user.name || "You"}
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

export default MeetingRoom;