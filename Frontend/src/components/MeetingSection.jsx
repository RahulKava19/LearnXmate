import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function MeetingSection({ classroomId, isStudent }) {
    const navigate = useNavigate();

    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [title, setTitle] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const [joiningMeeting, setJoiningMeeting] = useState(null);

    const token = localStorage.getItem("token");

    // =============================================
    // GET CLASSROOM MEETINGS
    // =============================================

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `http://localhost:5000/api/meetings/classroom/${classroomId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMeetings(response.data || []);
        } catch (error) {
            console.error("Unable to load meetings:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load meetings."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (classroomId) {
            fetchMeetings();
        }
    }, [classroomId]);

    // =============================================
    // CREATE MEETING
    // =============================================

    const createMeeting = async (event) => {
        event.preventDefault();

        setCreateError("");

        if (!title.trim()) {
            setCreateError("Meeting title is required.");
            return;
        }

        try {
            setCreating(true);

            const response = await axios.post(
                "http://localhost:5000/api/meetings",
                {
                    title: title.trim(),
                    classroomId: Number(classroomId),
                    scheduledAt: scheduledAt
                        ? new Date(scheduledAt).toISOString()
                        : null
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMeetings((previous) => [
                response.data.meeting,
                ...previous
            ]);

            setTitle("");
            setScheduledAt("");
            setShowCreateForm(false);

        } catch (error) {
            console.error("Unable to create meeting:", error);

            setCreateError(
                error.response?.data?.message ||
                "Unable to create meeting."
            );
        } finally {
            setCreating(false);
        }
    };

    // =============================================
    // JOIN MEETING
    // =============================================

    const joinMeeting = async (meeting) => {
        try {
            setJoiningMeeting(meeting._id);

            const response = await axios.post(
                "http://localhost:5000/api/meetings/join",
                {
                    meetingCode: meeting.meetingCode
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data?.meeting) {
                navigate(
                    `/meetings/${response.data.meeting.meetingCode}`
                );
            }

        } catch (error) {
            console.error("Unable to join meeting:", error);

            alert(
                error.response?.data?.message ||
                "Unable to join meeting."
            );
        } finally {
            setJoiningMeeting(null);
        }
    };

    // =============================================
    // HELPERS
    // =============================================

    const formatDate = (date) => {
        if (!date) {
            return "Now";
        }

        return new Date(date).toLocaleString();
    };

    const getMeetingStatus = (meeting) => {
        if (meeting.status === "ended") {
            return "Ended";
        }

        if (meeting.status === "live") {
            return "Live";
        }

        return "Available";
    };

    return (
        <section className="meeting-section">

            <div className="meeting-section-header">

                <div>
                    <h3>Meetings</h3>

                    <p>
                        {isStudent
                            ? "Join live and scheduled classroom meetings."
                            : "Start and manage meetings for this classroom."}
                    </p>
                </div>

                {!isStudent && (
                    <button
                        type="button"
                        className="meeting-create-button"
                        onClick={() => {
                            setTitle("");
                            setScheduledAt("");
                            setCreateError("");
                            setShowCreateForm(true);
                        }}
                    >
                        + Start Meeting
                    </button>
                )}

            </div>

            {/* CREATE MEETING FORM */}

            {!isStudent && showCreateForm && (
                <div className="meeting-form-card">

                    <div className="meeting-form-header">

                        <div>
                            <h4>Create Meeting</h4>

                            <p>
                                Create a meeting for students in this classroom.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="meeting-close-button"
                            onClick={() => {
                                if (!creating) {
                                    setShowCreateForm(false);
                                    setCreateError("");
                                }
                            }}
                            disabled={creating}
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={createMeeting}>

                        <div className="meeting-form-group">

                            <label>
                                Meeting Title
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. DSA Live Lecture"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                disabled={creating}
                            />

                        </div>

                        <div className="meeting-form-group">

                            <label>
                                Schedule
                            </label>

                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(event) =>
                                    setScheduledAt(event.target.value)
                                }
                                disabled={creating}
                            />

                            <small>
                                Leave empty to start the meeting now.
                            </small>

                        </div>

                        {createError && (
                            <div className="meeting-error">
                                {createError}
                            </div>
                        )}

                        <div className="meeting-form-actions">

                            <button
                                type="button"
                                className="meeting-cancel-button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setCreateError("");
                                }}
                                disabled={creating}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="meeting-submit-button"
                                disabled={creating}
                            >
                                {creating
                                    ? "Creating..."
                                    : "Create Meeting"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* LOADING */}

            {loading && (
                <div className="meeting-placeholder">
                    Loading meetings...
                </div>
            )}

            {/* ERROR */}

            {!loading && error && (
                <div className="meeting-error">
                    {error}
                </div>
            )}

            {/* NO MEETINGS */}

            {!loading &&
                !error &&
                meetings.length === 0 && (
                    <div className="meeting-placeholder">
                        <h4>No meetings yet</h4>

                        <p>
                            {isStudent
                                ? "Your teacher has not created any meetings yet."
                                : "Create a meeting to start a live class."}
                        </p>
                    </div>
                )}

            {/* MEETING LIST */}

            {!loading &&
                !error &&
                meetings.length > 0 && (
                    <div className="meeting-list">

                        {meetings.map((meeting) => {

                            const status =
                                getMeetingStatus(meeting);

                            return (
                                <article
                                    className="meeting-card"
                                    key={meeting._id}
                                >

                                    <div className="meeting-card-main">

                                        <div className="meeting-icon">
                                            🎥
                                        </div>

                                        <div className="meeting-info">

                                            <h4>
                                                {meeting.title}
                                            </h4>

                                            <p>
                                                By{" "}
                                                {meeting.instructor?.name ||
                                                    "Instructor"}
                                            </p>

                                            <p>
                                                {meeting.scheduledAt
                                                    ? formatDate(
                                                        meeting.scheduledAt
                                                    )
                                                    : "Available now"}
                                            </p>

                                            <span
                                                className={`meeting-status meeting-status-${status.toLowerCase()}`}
                                            >
                                                {status}
                                            </span>

                                        </div>

                                    </div>

                                    <div className="meeting-card-actions">

                                        <div className="meeting-code">
                                            Code:{" "}
                                            <strong>
                                                {meeting.meetingCode}
                                            </strong>
                                        </div>

                                        {meeting.status !== "ended" && (
                                            <button
                                                type="button"
                                                className="meeting-join-button"
                                                onClick={() =>
                                                    joinMeeting(meeting)
                                                }
                                                disabled={
                                                    joiningMeeting ===
                                                    meeting._id
                                                }
                                            >
                                                {joiningMeeting ===
                                                meeting._id
                                                    ? "Joining..."
                                                    : isStudent
                                                        ? "Join Meeting"
                                                        : "Open Meeting"}
                                            </button>
                                        )}

                                    </div>

                                </article>
                            );
                        })}

                    </div>
                )}

        </section>
    );
}

export default MeetingSection;