import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Meetings.css";

function Meetings() {

    const navigate = useNavigate();

    const [meetings, setMeetings] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =============================================
    // LOAD ALL MEETINGS
    // =============================================

    const fetchMeetings = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/meetings",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setMeetings(
                response.data.meetings || []
            );

        } catch (error) {

            console.error(
                "Unable to load meetings:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load meetings."
            );

        } finally {

            setLoading(false);

        }

    };


    // =============================================
    // LOAD ON PAGE OPEN
    // =============================================

    useEffect(() => {

        fetchMeetings();

    }, []);


    // =============================================
    // OPEN MEETING
    // =============================================

    const openMeeting = (meetingCode) => {

        navigate(
            `/meetings/${meetingCode}`
        );

    };


    // =============================================
    // FORMAT DATE
    // =============================================

    const formatDate = (date) => {

        if (!date) {
            return "Not scheduled";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    };


    // =============================================
    // STATUS
    // =============================================

    const getStatusText = (status) => {

        if (status === "live") {
            return "Live";
        }

        if (status === "ended") {
            return "Ended";
        }

        return "Scheduled";

    };


    // =============================================
    // LOADING
    // =============================================

    if (loading) {

        return (

            <div className="meetings-page">

                <div className="meetings-loading">

                    Loading meetings...

                </div>

            </div>

        );

    }


    // =============================================
    // ERROR
    // =============================================

    if (error) {

        return (

            <div className="meetings-page">

                <div className="meetings-header">

                    <h1>
                        Meetings
                    </h1>

                </div>


                <div className="meetings-error">

                    {error}

                </div>

            </div>

        );

    }


    // =============================================
    // PAGE
    // =============================================

    return (

        <div className="meetings-page">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div className="meetings-header">

                <div>

                    <h1>
                        Meetings
                    </h1>

                    <p>
                        View and join meetings from
                        your classrooms.
                    </p>

                </div>

            </div>


            {/* ================================= */}
            {/* EMPTY STATE */}
            {/* ================================= */}

            {meetings.length === 0 && (

                <div className="meetings-empty">

                    <div className="meetings-empty-icon">
                        📹
                    </div>

                    <h2>
                        No meetings yet
                    </h2>

                    <p>
                        There are no meetings available
                        in your classrooms.
                    </p>

                </div>

            )}


            {/* ================================= */}
            {/* MEETING LIST */}
            {/* ================================= */}

            {meetings.length > 0 && (

                <div className="meetings-grid">

                    {meetings.map(
                        (meeting) => (

                            <div
                                className="meeting-card"
                                key={meeting._id}
                            >

                                {/* ===================== */}
                                {/* CARD HEADER */}
                                {/* ===================== */}

                                <div className="meeting-card-header">

                                    <div>

                                        <h2>
                                            {meeting.title}
                                        </h2>

                                        <p className="meeting-classroom-name">

                                            {meeting.classroom?.name ||
                                                "Classroom"}

                                        </p>

                                    </div>


                                    <span
                                        className={
                                            `meeting-status meeting-status-${meeting.status}`
                                        }
                                    >

                                        {getStatusText(
                                            meeting.status
                                        )}

                                    </span>

                                </div>


                                {/* ===================== */}
                                {/* INFORMATION */}
                                {/* ===================== */}

                                <div className="meeting-card-info">

                                    <div>

                                        <span className="meeting-info-label">
                                            Instructor
                                        </span>

                                        <span className="meeting-info-value">

                                            {meeting.instructor?.name ||
                                                "Unknown"}

                                        </span>

                                    </div>


                                    <div>

                                        <span className="meeting-info-label">
                                            Scheduled
                                        </span>

                                        <span className="meeting-info-value">

                                            {formatDate(
                                                meeting.scheduledAt
                                            )}

                                        </span>

                                    </div>


                                    <div>

                                        <span className="meeting-info-label">
                                            Meeting Code
                                        </span>

                                        <span className="meeting-info-value meeting-code">

                                            {meeting.meetingCode}

                                        </span>

                                    </div>

                                </div>


                                {/* ===================== */}
                                {/* ACTION */}
                                {/* ===================== */}

                                <div className="meeting-card-footer">

                                    <button
                                        type="button"
                                        className="meeting-join-button"
                                        disabled={
                                            meeting.status ===
                                            "ended"
                                        }
                                        onClick={() =>
                                            openMeeting(
                                                meeting.meetingCode
                                            )
                                        }
                                    >

                                        {meeting.status ===
                                        "ended"
                                            ? "Meeting Ended"
                                            : "Join Meeting"}

                                    </button>

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}

        </div>

    );

}

export default Meetings;