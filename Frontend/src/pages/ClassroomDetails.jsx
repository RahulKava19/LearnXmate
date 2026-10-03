import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./ClassroomDetails.css";

function ClassroomDetails() {
    const { id } = useParams();

    const [classroom, setClassroom] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [students, setStudents] = useState([]);

    // Teacher project creation states
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [projectForm, setProjectForm] = useState({
        title: "",
        description: "",
        dueDate: ""
    });
    const [projectFiles, setProjectFiles] = useState([]);
    const [creatingProject, setCreatingProject] = useState(false);
    const [projectCreateError, setProjectCreateError] = useState("");

    // Teacher project editing states
    const [editingProject, setEditingProject] = useState(null);
    const [updatingProject, setUpdatingProject] = useState(false);
    const [projectUpdateError, setProjectUpdateError] = useState("");

    // Teacher project deletion states
    const [deletingProject, setDeletingProject] = useState(null);
    const [projectDeleteLoading, setProjectDeleteLoading] = useState(false);
    const [projectDeleteError, setProjectDeleteError] = useState("");

    // Teacher submission states
    const [viewingSubmissionsProject, setViewingSubmissionsProject] =
        useState(null);
    const [projectSubmissions, setProjectSubmissions] = useState([]);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [submissionsError, setSubmissionsError] = useState("");

    const [instructor, setInstructor] = useState(null);

    // Teacher people management states
    const [removingStudent, setRemovingStudent] = useState(null);
    const [removeStudentLoading, setRemoveStudentLoading] = useState(false);
    const [removeStudentError, setRemoveStudentError] = useState("");

    const [activeTab, setActiveTab] = useState("stream");

    const [loading, setLoading] = useState(true);
    const [classworkLoading, setClassworkLoading] = useState(false);
    const [peopleLoading, setPeopleLoading] = useState(false);

    const [error, setError] = useState("");
    const [classworkError, setClassworkError] = useState("");
    const [peopleError, setPeopleError] = useState("");

    const [selectedFile, setSelectedFile] = useState(null);

    // Submission states
    const [submissions, setSubmissions] = useState({});
    const [selectedSubmissionFiles, setSelectedSubmissionFiles] =
        useState({});
    const [submittingProject, setSubmittingProject] = useState(null);
    const [submissionMessages, setSubmissionMessages] = useState({});
    const [submissionErrors, setSubmissionErrors] = useState({});
    const [unsubmittingProject, setUnsubmittingProject] =
        useState(null);

    // Announcement states
    const [announcements, setAnnouncements] = useState([]);
    const [announcementLoading, setAnnouncementLoading] =
        useState(false);
    const [announcementError, setAnnouncementError] =
        useState("");
    const [showAnnouncementForm, setShowAnnouncementForm] =
        useState(false);
    const [announcementForm, setAnnouncementForm] = useState({
        title: "",
        content: ""
    });
    const [postingAnnouncement, setPostingAnnouncement] =
        useState(false);
    const [announcementPostError, setAnnouncementPostError] =
        useState("");
    const [editingAnnouncement, setEditingAnnouncement] =
        useState(null);
    const [deletingAnnouncement, setDeletingAnnouncement] =
        useState(null);
    const [announcementDeleteLoading, setAnnouncementDeleteLoading] =
        useState(false);
    const [announcementDeleteError, setAnnouncementDeleteError] =
        useState("");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const isStudent = user.role === "student";

    // =============================================
    // GET CLASSROOM
    // =============================================

    useEffect(() => {
        const fetchClassroom = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `http://localhost:5000/api/classrooms/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setClassroom(response.data);

            } catch (error) {
                console.error(error);

                setError(
                    error.response?.data?.message ||
                    "Unable to load classroom"
                );

            } finally {
                setLoading(false);
            }
        };

        fetchClassroom();
    }, [id]);

    // =============================================
    // GET DOCUMENTS + PROJECTS
    // =============================================

    const fetchClasswork = async () => {
        try {
            setClassworkLoading(true);
            setClassworkError("");

            const token = localStorage.getItem("token");

            const [
                documentsResponse,
                projectsResponse
            ] = await Promise.all([
                axios.get(
                    `http://localhost:5000/api/classrooms/${id}/documents`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                ),

                axios.get(
                    `http://localhost:5000/api/classrooms/${id}/projects`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
            ]);

            setDocuments(documentsResponse.data);
            setProjects(projectsResponse.data);

            // If student, check which projects are already turned in
            if (
                isStudent &&
                projectsResponse.data.length > 0
            ) {
                await fetchExistingSubmissions(
                    projectsResponse.data
                );
            }

        } catch (error) {
            console.error(error);

            setClassworkError(
                error.response?.data?.message ||
                "Unable to load classwork"
            );

        } finally {
            setClassworkLoading(false);
        }
    };

    // =============================================
    // GET MY SUBMISSIONS
    // =============================================

    const fetchExistingSubmissions = async (projectList) => {
        const token = localStorage.getItem("token");

        const submissionResults = {};

        await Promise.all(
            projectList.map(async (project) => {
                try {
                    const response = await axios.get(
                        `http://localhost:5000/api/classrooms/${id}/projects/${project.id}/submissions/mine`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    submissionResults[project.id] =
                        response.data;

                } catch (error) {
                    // 404 means the student has not
                    // turned in this project.
                    if (
                        error.response?.status !== 404
                    ) {
                        console.error(
                            "Unable to check submission:",
                            error
                        );
                    }
                }
            })
        );

        setSubmissions(submissionResults);
    };

    // =============================================
    // CREATE PROJECT / ASSIGNMENT
    // =============================================

    const handleProjectFormChange = (event) => {
        const { name, value } = event.target;

        setProjectForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setProjectCreateError("");
    };

    const handleProjectFileChange = (event) => {
        const files = Array.from(event.target.files || []);

        if (files.length > 10) {
            setProjectCreateError(
                "You can upload maximum 10 attachments."
            );
            setProjectFiles(files.slice(0, 10));
            return;
        }

        setProjectFiles(files);
        setProjectCreateError("");
    };

    const createAssignment = async (event) => {
        event.preventDefault();
        setProjectCreateError("");

        if (!projectForm.title.trim()) {
            setProjectCreateError("Assignment title is required.");
            return;
        }

        try {
            setCreatingProject(true);

            const token = localStorage.getItem("token");
            const formData = new FormData();

            formData.append("id", Date.now());
            formData.append("title", projectForm.title.trim());
            formData.append(
                "description",
                projectForm.description.trim()
            );

            if (projectForm.dueDate) {
                formData.append("dueDate", projectForm.dueDate);
            }

            projectFiles.forEach((file) => {
                formData.append("attachments", file);
            });

            const response = await axios.post(
                `http://localhost:5000/api/classrooms/${id}/projects`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProjects((previous) => [
                response.data,
                ...previous
            ]);

            setProjectForm({
                title: "",
                description: "",
                dueDate: ""
            });
            setProjectFiles([]);
            setShowProjectForm(false);

            // Reset the file input after successful creation.
            const fileInput = document.getElementById(
                "assignment-attachments"
            );

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (error) {
            console.error(error);

            setProjectCreateError(
                error.response?.data?.message ||
                "Unable to create assignment."
            );
        } finally {
            setCreatingProject(false);
        }
    };

    // =============================================
    // OPEN EDIT ASSIGNMENT
    // =============================================

    const openEditAssignment = (project) => {
        const dueDate = project.dueDate
            ? new Date(project.dueDate).toISOString().slice(0, 16)
            : "";

        setEditingProject(project);
        setProjectForm({
            title: project.title || "",
            description: project.description || "",
            dueDate
        });
        setProjectUpdateError("");
    };

    // =============================================
    // UPDATE ASSIGNMENT
    // =============================================

    const updateAssignment = async (event) => {
        event.preventDefault();
        setProjectUpdateError("");

        if (!projectForm.title.trim()) {
            setProjectUpdateError("Assignment title is required.");
            return;
        }

        if (!editingProject) {
            return;
        }

        try {
            setUpdatingProject(true);

            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://localhost:5000/api/classrooms/${id}/projects/${editingProject.id}`,
                {
                    title: projectForm.title.trim(),
                    description: projectForm.description.trim(),
                    dueDate: projectForm.dueDate || null
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProjects((previous) =>
                previous.map((project) =>
                    project.id === editingProject.id
                        ? response.data
                        : project
                )
            );

            setEditingProject(null);
            setProjectForm({
                title: "",
                description: "",
                dueDate: ""
            });
        } catch (error) {
            console.error(error);

            setProjectUpdateError(
                error.response?.data?.message ||
                "Unable to update assignment."
            );
        } finally {
            setUpdatingProject(false);
        }
    };

    // =============================================
    // DELETE ASSIGNMENT
    // =============================================

    const handleDeleteAssignment = async () => {
        if (!deletingProject) {
            return;
        }

        try {
            setProjectDeleteLoading(true);
            setProjectDeleteError("");

            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/api/classrooms/${id}/projects/${deletingProject.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProjects((previous) =>
                previous.filter(
                    (project) => project.id !== deletingProject.id
                )
            );

            setDeletingProject(null);
        } catch (error) {
            console.error(error);

            setProjectDeleteError(
                error.response?.data?.message ||
                "Unable to delete assignment."
            );
        } finally {
            setProjectDeleteLoading(false);
        }
    };

    // =============================================
    // GET PEOPLE
    // =============================================

    const fetchPeople = async () => {
        try {
            setPeopleLoading(true);
            setPeopleError("");

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5000/api/classrooms/${id}/students`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setStudents(
                response.data.students || []
            );

            setInstructor(
                response.data.instructor || null
            );

        } catch (error) {
            console.error(error);

            setPeopleError(
                error.response?.data?.message ||
                "Unable to load people"
            );

        } finally {
            setPeopleLoading(false);
        }
    };

    // =============================================
    // REMOVE STUDENT FROM CLASSROOM
    // =============================================

    const handleRemoveStudent = async () => {
        if (!removingStudent?.student?._id) {
            return;
        }

        try {
            setRemoveStudentLoading(true);
            setRemoveStudentError("");

            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/api/classrooms/${id}/students/${removingStudent.student._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setStudents((previous) =>
                previous.filter(
                    (item) => item._id !== removingStudent._id
                )
            );

            setRemovingStudent(null);

        } catch (error) {
            console.error(error);

            setRemoveStudentError(
                error.response?.data?.message ||
                "Unable to remove student from classroom."
            );

        } finally {
            setRemoveStudentLoading(false);
        }
    };

    // =============================================
    // GET ANNOUNCEMENTS
    // =============================================

    const fetchAnnouncements = async () => {
        try {
            setAnnouncementLoading(true);
            setAnnouncementError("");

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5000/api/classrooms/${id}/announcements`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAnnouncements(response.data || []);
        } catch (error) {
            console.error(error);

            setAnnouncementError(
                error.response?.data?.message ||
                "Unable to load announcements"
            );
        } finally {
            setAnnouncementLoading(false);
        }
    };

    // =============================================
    // LOAD CLASSWORK
    // =============================================

    useEffect(() => {
        if (
            activeTab === "classwork" &&
            classroom
        ) {
            fetchClasswork();
        }
    }, [activeTab, classroom, id]);

    // =============================================
    // LOAD PEOPLE
    // =============================================

    useEffect(() => {
        if (
            activeTab === "people" &&
            classroom
        ) {
            fetchPeople();
        }
    }, [activeTab, classroom, id]);

    // =============================================
    // LOAD ANNOUNCEMENTS
    // =============================================

    useEffect(() => {
        if (
            activeTab === "stream" &&
            classroom
        ) {
            fetchAnnouncements();
        }
    }, [activeTab, classroom, id]);

    // =============================================
    // ANNOUNCEMENT FORM CHANGE
    // =============================================

    const handleAnnouncementChange = (event) => {
        const { name, value } = event.target;

        setAnnouncementForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setAnnouncementPostError("");
    };

    // =============================================
    // CREATE / UPDATE ANNOUNCEMENT
    // =============================================

    const saveAnnouncement = async (event) => {
        event.preventDefault();
        setAnnouncementPostError("");

        if (!announcementForm.title.trim()) {
            setAnnouncementPostError(
                "Announcement title is required."
            );
            return;
        }

        if (!announcementForm.content.trim()) {
            setAnnouncementPostError(
                "Announcement message is required."
            );
            return;
        }

        try {
            setPostingAnnouncement(true);

            const token = localStorage.getItem("token");

            if (editingAnnouncement) {
                const response = await axios.put(
                    `http://localhost:5000/api/classrooms/${id}/announcements/${editingAnnouncement._id}`,
                    {
                        title: announcementForm.title.trim(),
                        content: announcementForm.content.trim()
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setAnnouncements((previous) =>
                    previous.map((announcement) =>
                        announcement._id === editingAnnouncement._id
                            ? response.data
                            : announcement
                    )
                );
            } else {
                const response = await axios.post(
                    `http://localhost:5000/api/classrooms/${id}/announcements`,
                    {
                        title: announcementForm.title.trim(),
                        content: announcementForm.content.trim()
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setAnnouncements((previous) => [
                    response.data,
                    ...previous
                ]);
            }

            setAnnouncementForm({
                title: "",
                content: ""
            });

            setEditingAnnouncement(null);
            setShowAnnouncementForm(false);
        } catch (error) {
            console.error(error);

            setAnnouncementPostError(
                error.response?.data?.message ||
                "Unable to save announcement."
            );
        } finally {
            setPostingAnnouncement(false);
        }
    };

    // =============================================
    // OPEN EDIT ANNOUNCEMENT
    // =============================================

    const openEditAnnouncement = (announcement) => {
        setEditingAnnouncement(announcement);

        setAnnouncementForm({
            title: announcement.title || "",
            content: announcement.content || ""
        });

        setAnnouncementPostError("");
        setShowAnnouncementForm(true);
    };

    // =============================================
    // DELETE ANNOUNCEMENT
    // =============================================

    const handleDeleteAnnouncement = async () => {
        if (!deletingAnnouncement) {
            return;
        }

        try {
            setAnnouncementDeleteLoading(true);
            setAnnouncementDeleteError("");

            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/api/classrooms/${id}/announcements/${deletingAnnouncement._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAnnouncements((previous) =>
                previous.filter(
                    (announcement) =>
                        announcement._id !== deletingAnnouncement._id
                )
            );

            setDeletingAnnouncement(null);
        } catch (error) {
            console.error(error);

            setAnnouncementDeleteError(
                error.response?.data?.message ||
                "Unable to delete announcement."
            );
        } finally {
            setAnnouncementDeleteLoading(false);
        }
    };

    // =============================================
    // VIEW PROJECT SUBMISSIONS
    // =============================================

    const openProjectSubmissions = async (project) => {
        try {
            setViewingSubmissionsProject(project);
            setProjectSubmissions([]);
            setSubmissionCount(0);
            setSubmissionsError("");
            setSubmissionsLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5000/api/classrooms/${id}/projects/${project.id}/submissions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProjectSubmissions(response.data.submissions || []);
            setSubmissionCount(response.data.totalSubmissions || 0);

        } catch (error) {
            console.error(error);

            setSubmissionsError(
                error.response?.data?.message ||
                "Unable to load submissions."
            );
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const closeProjectSubmissions = () => {
        if (!submissionsLoading) {
            setViewingSubmissionsProject(null);
            setProjectSubmissions([]);
            setSubmissionCount(0);
            setSubmissionsError("");
        }
    };

    // =============================================
    // OPEN FILE
    // =============================================

    const openFile = (attachment) => {
        const fileUrl =
            attachment.fileUrl?.startsWith("http")
                ? attachment.fileUrl
                : `http://localhost:5000${attachment.fileUrl}`;

        setSelectedFile({
            name: attachment.fileName,
            type: attachment.fileType,
            url: fileUrl
        });
    };

    // =============================================
    // CLOSE FILE
    // =============================================

    const closeFile = () => {
        setSelectedFile(null);
    };

    // =============================================
    // SELECT FILES
    // =============================================

    const handleSubmissionFileChange = (
        projectId,
        files
    ) => {
        setSelectedSubmissionFiles(
            (previous) => ({
                ...previous,
                [projectId]: Array.from(files)
            })
        );

        setSubmissionErrors(
            (previous) => ({
                ...previous,
                [projectId]: ""
            })
        );

        setSubmissionMessages(
            (previous) => ({
                ...previous,
                [projectId]: ""
            })
        );
    };

    // =============================================
    // TURN IN ASSIGNMENT
    // =============================================

    const submitAssignment = async (project) => {
        const files =
            selectedSubmissionFiles[project.id] || [];

        if (files.length === 0) {
            setSubmissionErrors(
                (previous) => ({
                    ...previous,
                    [project.id]:
                        "Please select at least one file."
                })
            );

            return;
        }

        if (files.length > 10) {
            setSubmissionErrors(
                (previous) => ({
                    ...previous,
                    [project.id]:
                        "You can submit maximum 10 files."
                })
            );

            return;
        }

        try {
            setSubmittingProject(project.id);

            setSubmissionErrors(
                (previous) => ({
                    ...previous,
                    [project.id]: ""
                })
            );

            const token =
                localStorage.getItem("token");

            const formData = new FormData();

            files.forEach((file) => {
                formData.append(
                    "attachments",
                    file
                );
            });

            const response = await axios.post(
                `http://localhost:5000/api/classrooms/${id}/projects/${project.id}/submissions`,
                formData,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            // Mark project as turned in
            setSubmissions(
                (previous) => ({
                    ...previous,
                    [project.id]:
                        response.data
                })
            );

            // Clear selected files
            setSelectedSubmissionFiles(
                (previous) => ({
                    ...previous,
                    [project.id]: []
                })
            );

            setSubmissionMessages(
                (previous) => ({
                    ...previous,
                    [project.id]:
                        "Assignment turned in successfully."
                })
            );

        } catch (error) {
            console.error(error);

            setSubmissionErrors(
                (previous) => ({
                    ...previous,
                    [project.id]:
                        error.response?.data?.message ||
                        "Unable to turn in assignment."
                })
            );

        } finally {
            setSubmittingProject(null);
        }
    };

    // =============================================
    // UNSUBMIT ASSIGNMENT
    // =============================================

    const unsubmitAssignment = async (project) => {
        const submission =
            submissions[project.id];

        if (!submission) {
            return;
        }

        try {
            setUnsubmittingProject(project.id);

            setSubmissionErrors(
                (previous) => ({
                    ...previous,
                    [project.id]: ""
                })
            );

            setSubmissionMessages(
                (previous) => ({
                    ...previous,
                    [project.id]: ""
                })
            );

            const token =
                localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/api/classrooms/${id}/projects/${project.id}/submissions/${submission.id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            // Remove submission from frontend state
            setSubmissions(
                (previous) => {
                    const updated = {
                        ...previous
                    };

                    delete updated[project.id];

                    return updated;
                }
            );

            setSubmissionMessages(
                (previous) => ({
                    ...previous,
                    [project.id]:
                        "Assignment unsubmitted. You can submit it again."
                })
            );

        } catch (error) {
            console.error(error);

            setSubmissionErrors(
                (previous) => ({
                    ...previous,
                    [project.id]:
                        error.response?.data?.message ||
                        "Unable to unsubmit assignment."
                })
            );

        } finally {
            setUnsubmittingProject(null);
        }
    };

    // =============================================
    // LOADING
    // =============================================

    if (loading) {
        return (
            <div className="page-loading">
                Loading classroom...
            </div>
        );
    }

    // =============================================
    // ERROR
    // =============================================

    if (error) {
        return (
            <div className="page-error">
                {error}
            </div>
        );
    }

    if (!classroom) {
        return (
            <div className="page-error">
                Classroom not found.
            </div>
        );
    }

    return (
        <div className="classroom-layout">

            <Sidebar />

            <main className="classroom-main">

                {/* ================================= */}
                {/* CLASSROOM HEADER */}
                {/* ================================= */}

                <section className="classroom-header">

                    <div className="classroom-header-content">

                        <div className="classroom-avatar">
                            {classroom.name
                                ?.charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>

                            <h1>
                                {classroom.name}
                            </h1>

                            <p>
                                {classroom.description ||
                                    "No description available."}
                            </p>

                            <span>
                                Class Code:{" "}
                                {classroom.classCode}
                            </span>

                        </div>

                    </div>

                </section>

                {/* ================================= */}
                {/* TABS */}
                {/* ================================= */}

                <nav className="classroom-tabs">

                    <button
                        className={
                            activeTab === "stream"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveTab("stream")
                        }
                    >
                        Stream
                    </button>

                    <button
                        className={
                            activeTab === "classwork"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveTab("classwork")
                        }
                    >
                        Classwork
                    </button>

                    <button
                        className={
                            activeTab === "people"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveTab("people")
                        }
                    >
                        People
                    </button>

                </nav>

                {/* ================================= */}
                {/* CONTENT */}
                {/* ================================= */}

                <section className="classroom-content">

                    {/* ================================= */}
                    {/* STREAM */}
                    {/* ================================= */}

                    {activeTab === "stream" && (

                        <div className="tab-content">

                            <div className="stream-header">

                                <div>

                                    <h2>
                                        Stream
                                    </h2>

                                    <p className="tab-description">
                                        Announcements and recent classroom activity.
                                    </p>

                                </div>

                                {!isStudent && (
                                    <button
                                        type="button"
                                        className="create-announcement-button"
                                        onClick={() => {
                                            setEditingAnnouncement(null);
                                            setAnnouncementForm({
                                                title: "",
                                                content: ""
                                            });
                                            setAnnouncementPostError("");
                                            setShowAnnouncementForm(true);
                                        }}
                                    >
                                        + Post Announcement
                                    </button>
                                )}

                            </div>

                            {!isStudent && showAnnouncementForm && (
                                <div className="announcement-form-card">

                                    <div className="announcement-form-header">

                                        <div>
                                            <h3>
                                                {editingAnnouncement
                                                    ? "Edit Announcement"
                                                    : "Post Announcement"}
                                            </h3>

                                            <p>
                                                {editingAnnouncement
                                                    ? "Update this announcement for your students."
                                                    : "Share an update with your students."}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="announcement-close-button"
                                            onClick={() => {
                                                if (!postingAnnouncement) {
                                                    setShowAnnouncementForm(false);
                                                    setEditingAnnouncement(null);
                                                }
                                            }}
                                            disabled={postingAnnouncement}
                                        >
                                            ×
                                        </button>

                                    </div>

                                    <form onSubmit={saveAnnouncement}>

                                        <div className="announcement-form-group">
                                            <label>
                                                Title
                                            </label>

                                            <input
                                                type="text"
                                                name="title"
                                                placeholder="e.g. Important update"
                                                value={announcementForm.title}
                                                onChange={handleAnnouncementChange}
                                                disabled={postingAnnouncement}
                                            />
                                        </div>

                                        <div className="announcement-form-group">
                                            <label>
                                                Message
                                            </label>

                                            <textarea
                                                name="content"
                                                placeholder="Write your announcement..."
                                                value={announcementForm.content}
                                                onChange={handleAnnouncementChange}
                                                rows="5"
                                                disabled={postingAnnouncement}
                                            />
                                        </div>

                                        {announcementPostError && (
                                            <div className="announcement-form-error">
                                                {announcementPostError}
                                            </div>
                                        )}

                                        <div className="announcement-form-actions">
                                            <button
                                                type="button"
                                                className="announcement-cancel-button"
                                                onClick={() => {
                                                    setShowAnnouncementForm(false);
                                                    setEditingAnnouncement(null);
                                                    setAnnouncementPostError("");
                                                }}
                                                disabled={postingAnnouncement}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                className="announcement-submit-button"
                                                disabled={postingAnnouncement}
                                            >
                                                {postingAnnouncement
                                                    ? "Saving..."
                                                    : editingAnnouncement
                                                        ? "Save Changes"
                                                        : "Post Announcement"}
                                            </button>
                                        </div>

                                    </form>

                                </div>
                            )}

                            {announcementLoading && (
                                <div className="content-placeholder">
                                    Loading announcements...
                                </div>
                            )}

                            {announcementError && (
                                <div className="classroom-error">
                                    {announcementError}
                                </div>
                            )}

                            {!announcementLoading && !announcementError && (
                                <div className="announcement-list">

                                    {announcements.length === 0 ? (

                                        <div className="empty-classroom-content">
                                            <h3>
                                                No announcements yet
                                            </h3>

                                            <p>
                                                {isStudent
                                                    ? "Your teacher has not posted any announcements yet."
                                                    : "Post an announcement to share an update with your students."}
                                            </p>
                                        </div>

                                    ) : (

                                        announcements.map((announcement) => (
                                            <div
                                                className="announcement-card"
                                                key={announcement._id}
                                            >

                                                <div className="announcement-card-top">

                                                    <div className="announcement-avatar">
                                                        {announcement.instructor?.name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="announcement-meta">
                                                        <h3>
                                                            {announcement.title}
                                                        </h3>

                                                        <p>
                                                            {announcement.instructor?.name || "Instructor"}
                                                            {" • "}
                                                            {new Date(announcement.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {!isStudent && (
                                                        <div className="announcement-actions">
                                                            <button
                                                                type="button"
                                                                className="announcement-edit-button"
                                                                onClick={() =>
                                                                    openEditAnnouncement(announcement)
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="announcement-delete-button"
                                                                onClick={() => {
                                                                    setDeletingAnnouncement(announcement);
                                                                    setAnnouncementDeleteError("");
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}

                                                </div>

                                                <div className="announcement-content">
                                                    {announcement.content}
                                                </div>

                                            </div>
                                        ))
                                    )}

                                </div>
                            )}

                        </div>

                    )}

                    {/* ================================= */}
                    {/* CLASSWORK */}
                    {/* ================================= */}

                    {activeTab === "classwork" && (

                        <div className="tab-content">

                            <h2>
                                Classwork
                            </h2>

                            <p className="tab-description">
                                Documents and projects for this classroom.
                            </p>

                            {classworkLoading && (
                                <div className="content-placeholder">
                                    Loading classwork...
                                </div>
                            )}

                            {classworkError && (
                                <div className="classroom-error">
                                    {classworkError}
                                </div>
                            )}

                            {!classworkLoading &&
                                !classworkError && (
                                    <>

                                        {/* ================================= */}
                                        {/* DOCUMENTS */}
                                        {/* ================================= */}

                                        <div className="content-section">

                                            <div className="section-header">

                                                <h3>
                                                    Documents
                                                </h3>

                                            </div>

                                            {documents.length === 0 ? (

                                                <div className="content-placeholder">
                                                    No documents in this classroom.
                                                </div>

                                            ) : (

                                                <div className="classwork-list">

                                                    {documents.map(
                                                        (document) => (

                                                            <div
                                                                className="classwork-item"
                                                                key={document._id}
                                                            >

                                                                <div>

                                                                    <h4>
                                                                        {document.title}
                                                                    </h4>

                                                                    <p>
                                                                        {document.content ||
                                                                            "No description available."}
                                                                    </p>

                                                                    {document.attachments &&
                                                                        document.attachments.length > 0 && (

                                                                            <div className="document-attachments">

                                                                                {document.attachments.map(
                                                                                    (attachment) => (

                                                                                        <div
                                                                                            className="document-attachment"
                                                                                            key={
                                                                                                attachment._id
                                                                                            }
                                                                                        >

                                                                                            <button
                                                                                                type="button"
                                                                                                className="attachment-button"
                                                                                                onClick={() =>
                                                                                                    openFile(
                                                                                                        attachment
                                                                                                    )
                                                                                                }
                                                                                            >

                                                                                                {attachment.fileType?.startsWith(
                                                                                                    "image/"
                                                                                                )
                                                                                                    ? "View Image"
                                                                                                    : attachment.fileType ===
                                                                                                      "application/pdf"
                                                                                                    ? "View PDF"
                                                                                                    : `Open ${attachment.fileName}`}

                                                                                            </button>

                                                                                        </div>

                                                                                    )
                                                                                )}

                                                                            </div>

                                                                        )}

                                                                </div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            )}

                                        </div>

                                        {/* ================================= */}
                                        {/* PROJECTS */}
                                        {/* ================================= */}

                                        <div className="content-section">

                                            <div className="section-header">

                                                <h3>
                                                    {isStudent ? "Projects" : "Assignments"}
                                                </h3>

                                                {!isStudent && (
                                                    <button
                                                        type="button"
                                                        className="create-announcement-button"
                                                        onClick={() => {
                                                            setProjectForm({
                                                                title: "",
                                                                description: "",
                                                                dueDate: ""
                                                            });
                                                            setProjectFiles([]);
                                                            setProjectCreateError("");
                                                            setShowProjectForm(true);
                                                        }}
                                                    >
                                                        + Create Assignment
                                                    </button>
                                                )}

                                            </div>

                                            {!isStudent && showProjectForm && (
                                                <div className="announcement-form-card">

                                                    <div className="announcement-form-header">

                                                        <div>
                                                            <h3>Create Assignment</h3>
                                                            <p>
                                                                Add an assignment for the students in this classroom.
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="announcement-close-button"
                                                            onClick={() => {
                                                                if (!creatingProject) {
                                                                    setShowProjectForm(false);
                                                                    setProjectCreateError("");
                                                                }
                                                            }}
                                                            disabled={creatingProject}
                                                        >
                                                            ×
                                                        </button>

                                                    </div>

                                                    <form onSubmit={createAssignment}>

                                                        <div className="announcement-form-group">
                                                            <label>
                                                                Title
                                                            </label>

                                                            <input
                                                                type="text"
                                                                name="title"
                                                                placeholder="e.g. Data Structures Assignment 1"
                                                                value={projectForm.title}
                                                                onChange={handleProjectFormChange}
                                                                disabled={creatingProject}
                                                            />
                                                        </div>

                                                        <div className="announcement-form-group">
                                                            <label>
                                                                Description
                                                            </label>

                                                            <textarea
                                                                name="description"
                                                                placeholder="Describe the assignment..."
                                                                value={projectForm.description}
                                                                onChange={handleProjectFormChange}
                                                                rows="5"
                                                                disabled={creatingProject}
                                                            />
                                                        </div>

                                                        <div className="announcement-form-group">
                                                            <label>
                                                                Due Date
                                                            </label>

                                                            <input
                                                                type="datetime-local"
                                                                name="dueDate"
                                                                value={projectForm.dueDate}
                                                                onChange={handleProjectFormChange}
                                                                disabled={creatingProject}
                                                            />
                                                        </div>

                                                        <div className="announcement-form-group">
                                                            <label>
                                                                Attachments
                                                            </label>

                                                            <input
                                                                id="assignment-attachments"
                                                                type="file"
                                                                multiple
                                                                onChange={handleProjectFileChange}
                                                                disabled={creatingProject}
                                                            />

                                                            {projectFiles.length > 0 && (
                                                                <div className="document-attachments">
                                                                    {projectFiles.map((file, index) => (
                                                                        <div
                                                                            className="document-attachment"
                                                                            key={`${file.name}-${index}`}
                                                                        >
                                                                            {file.name}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {projectCreateError && (
                                                            <div className="announcement-form-error">
                                                                {projectCreateError}
                                                            </div>
                                                        )}

                                                        <div className="announcement-form-actions">
                                                            <button
                                                                type="button"
                                                                className="announcement-cancel-button"
                                                                onClick={() => {
                                                                    setShowProjectForm(false);
                                                                    setProjectCreateError("");
                                                                }}
                                                                disabled={creatingProject}
                                                            >
                                                                Cancel
                                                            </button>

                                                            <button
                                                                type="submit"
                                                                className="announcement-submit-button"
                                                                disabled={creatingProject}
                                                            >
                                                                {creatingProject
                                                                    ? "Creating..."
                                                                    : "Create Assignment"}
                                                            </button>
                                                        </div>

                                                    </form>

                                                </div>
                                            )}

                                            {projects.length === 0 ? (

                                                <div className="content-placeholder">
                                                    No projects in this classroom.
                                                </div>

                                            ) : (

                                                <div className="classwork-list">

                                                    {projects.map((project) => {

                                                        const submission =
                                                            submissions[project.id];

                                                        const selectedFiles =
                                                            selectedSubmissionFiles[
                                                                project.id
                                                            ] || [];

                                                        const projectError =
                                                            submissionErrors[
                                                                project.id
                                                            ];

                                                        const projectMessage =
                                                            submissionMessages[
                                                                project.id
                                                            ];

                                                        return (
                                                            <article
                                                                className="classwork-item project-card"
                                                                key={project._id}
                                                            >

                                                                {/* ASSIGNMENT HEADER */}
                                                                <div className="project-title-row">

                                                                    <div className="project-heading">
                                                                        <h4>
                                                                            {project.title}
                                                                        </h4>
                                                                    </div>

                                                                    {!isStudent && (
                                                                        <div className="project-actions">
                                                                            <button
                                                                                type="button"
                                                                                className="project-edit-button"
                                                                                onClick={() =>
                                                                                    openEditAssignment(project)
                                                                                }
                                                                            >
                                                                                Edit
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                className="project-delete-button"
                                                                                onClick={() => {
                                                                                    setDeletingProject(project);
                                                                                    setProjectDeleteError("");
                                                                                }}
                                                                            >
                                                                                Delete
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                className="project-submissions-button"
                                                                                onClick={() =>
                                                                                    openProjectSubmissions(project)
                                                                                }
                                                                            >
                                                                                View Submissions
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                </div>

                                                                {/* ASSIGNMENT DETAILS */}
                                                                <div className="project-details">

                                                                    <p className="project-description">
                                                                        {project.description ||
                                                                            "No description available."}
                                                                    </p>

                                                                    {project.dueDate && (
                                                                        <div className="project-due-date">
                                                                            Due: {new Date(
                                                                                project.dueDate
                                                                            ).toLocaleDateString()}
                                                                        </div>
                                                                    )}

                                                                    {/* PROJECT ATTACHMENTS */}
                                                                    {project.attachments &&
                                                                        project.attachments.length > 0 && (
                                                                            <div className="project-attachments">
                                                                                {project.attachments.map(
                                                                                    (attachment) => (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="project-attachment-button"
                                                                                            key={attachment._id}
                                                                                            onClick={() =>
                                                                                                openFile(attachment)
                                                                                            }
                                                                                        >
                                                                                            {attachment.fileType?.startsWith(
                                                                                                "image/"
                                                                                            )
                                                                                                ? `View ${attachment.fileName}`
                                                                                                : attachment.fileType ===
                                                                                                  "application/pdf"
                                                                                                ? `View ${attachment.fileName}`
                                                                                                : attachment.fileName}
                                                                                        </button>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                </div>

                                                                {/* STUDENT SUBMISSION */}
                                                                {isStudent && (
                                                                    <div className="submission-section">

                                                                        {!submission ? (
                                                                            <>
                                                                                <div className="submission-header-row">
                                                                                    <div>
                                                                                        <div className="submission-status">
                                                                                            Not turned in
                                                                                        </div>
                                                                                        <h5>
                                                                                            Submit Assignment
                                                                                        </h5>
                                                                                    </div>
                                                                                </div>

                                                                                <input
                                                                                    type="file"
                                                                                    multiple
                                                                                    onChange={(e) =>
                                                                                        handleSubmissionFileChange(
                                                                                            project.id,
                                                                                            e.target.files
                                                                                        )
                                                                                    }
                                                                                />

                                                                                {selectedFiles.length > 0 && (
                                                                                    <div className="selected-files">
                                                                                        <p>
                                                                                            Selected files:
                                                                                        </p>
                                                                                        {selectedFiles.map(
                                                                                            (file, index) => (
                                                                                                <div
                                                                                                    key={`${file.name}-${index}`}
                                                                                                >
                                                                                                    {file.name}
                                                                                                </div>
                                                                                            )
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {projectError && (
                                                                                    <p className="classroom-error">
                                                                                        {projectError}
                                                                                    </p>
                                                                                )}

                                                                                <div className="submission-action-row">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="submit-assignment-button"
                                                                                        disabled={
                                                                                            submittingProject ===
                                                                                            project.id
                                                                                        }
                                                                                        onClick={() =>
                                                                                            submitAssignment(project)
                                                                                        }
                                                                                    >
                                                                                        {submittingProject ===
                                                                                        project.id
                                                                                            ? "Turning in..."
                                                                                            : "Turn In"}
                                                                                    </button>
                                                                                </div>

                                                                                {projectMessage && (
                                                                                    <p className="submission-success">
                                                                                        {projectMessage}
                                                                                    </p>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <div className="submitted-assignment">

                                                                                <div className="submission-header-row">
                                                                                    <div>
                                                                                        <div className="submission-status submitted">
                                                                                            Turned in
                                                                                        </div>
                                                                                        <h5>
                                                                                            Submitted Files
                                                                                        </h5>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="submitted-files-list">
                                                                                    {submission.attachments &&
                                                                                        submission.attachments.map(
                                                                                            (attachment) => (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="project-attachment-button"
                                                                                                    key={attachment._id}
                                                                                                    onClick={() =>
                                                                                                        openFile(attachment)
                                                                                                    }
                                                                                                >
                                                                                                    {attachment.fileName}
                                                                                                </button>
                                                                                            )
                                                                                        )}
                                                                                </div>

                                                                                {projectError && (
                                                                                    <p className="classroom-error">
                                                                                        {projectError}
                                                                                    </p>
                                                                                )}

                                                                                <div className="submission-action-row">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="attachment-button"
                                                                                        disabled={
                                                                                            unsubmittingProject ===
                                                                                            project.id
                                                                                        }
                                                                                        onClick={() =>
                                                                                            unsubmitAssignment(project)
                                                                                        }
                                                                                    >
                                                                                        {unsubmittingProject ===
                                                                                        project.id
                                                                                            ? "Unsubmitting..."
                                                                                            : "Unsubmit"}
                                                                                    </button>
                                                                                </div>

                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                )}

                                                            </article>
                                                        );
                                                    })}

                                                </div>

                                            )}

                                        </div>

                                    </>
                                )}

                        </div>

                    )}

                    {/* ================================= */}
                    {/* PEOPLE */}
                    {/* ================================= */}

                    {activeTab === "people" && (

                        <div className="tab-content">

                            <h2>
                                People
                            </h2>

                            <p className="tab-description">
                                Instructor and students in this classroom.
                            </p>

                            {peopleLoading && (
                                <div className="content-placeholder">
                                    Loading people...
                                </div>
                            )}

                            {peopleError && (
                                <div className="classroom-error">
                                    {peopleError}
                                </div>
                            )}

                            {!peopleLoading &&
                                !peopleError && (

                                    <div className="people-list">

                                        {instructor && (
                                            <>

                                                <h3 className="people-section-title">
                                                    Instructor
                                                </h3>

                                                <div className="person-card">

                                                    <div className="person-avatar">
                                                        {instructor.name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="person-info">

                                                        <h3>
                                                            {instructor.name}
                                                        </h3>

                                                        <p>
                                                            {instructor.email}
                                                        </p>

                                                    </div>

                                                </div>

                                            </>
                                        )}

                                        <h3 className="people-section-title">
                                            Students
                                        </h3>

                                        {students.length === 0 ? (

                                            <div className="empty-classroom-content">

                                                <p>
                                                    No students have joined
                                                    this classroom yet.
                                                </p>

                                            </div>

                                        ) : (

                                            students.map((item) => (

                                                <div
                                                    className="person-card"
                                                    key={item._id}
                                                >

                                                    <div className="person-avatar">

                                                        {item.student?.name
                                                            ?.charAt(0)
                                                            .toUpperCase()}

                                                    </div>

                                                    <div className="person-info">

                                                        <h3>
                                                            {item.student?.name}
                                                        </h3>

                                                        <p>
                                                            {item.student?.email}
                                                        </p>

                                                    </div>

                                                    {!isStudent && (
                                                        <button
                                                            type="button"
                                                            className="announcement-delete-button"
                                                            onClick={() => {
                                                                setRemovingStudent(item);
                                                                setRemoveStudentError("");
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}

                                                </div>

                                            ))

                                        )}

                                    </div>

                                )}

                        </div>

                    )}

                </section>

            </main>

            {/* ================================= */}
            {/* EDIT ASSIGNMENT MODAL */}
            {/* ================================= */}

            {editingProject && (

                <div
                    className="modal-overlay"
                    onMouseDown={() => {
                        if (!updatingProject) {
                            setEditingProject(null);
                            setProjectUpdateError("");
                        }
                    }}
                >

                    <div
                        className="announcement-form-card"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="announcement-form-header">

                            <div>
                                <h3>Edit Assignment</h3>
                                <p>
                                    Update the assignment details for your students.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="announcement-close-button"
                                onClick={() => {
                                    if (!updatingProject) {
                                        setEditingProject(null);
                                        setProjectUpdateError("");
                                    }
                                }}
                                disabled={updatingProject}
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={updateAssignment}>

                            <div className="announcement-form-group">
                                <label>
                                    Title
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={projectForm.title}
                                    onChange={handleProjectFormChange}
                                    disabled={updatingProject}
                                />
                            </div>

                            <div className="announcement-form-group">
                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={projectForm.description}
                                    onChange={handleProjectFormChange}
                                    rows="5"
                                    disabled={updatingProject}
                                />
                            </div>

                            <div className="announcement-form-group">
                                <label>
                                    Due Date
                                </label>

                                <input
                                    type="datetime-local"
                                    name="dueDate"
                                    value={projectForm.dueDate}
                                    onChange={handleProjectFormChange}
                                    disabled={updatingProject}
                                />
                            </div>

                            <p className="tab-description">
                                Existing attachments are kept unchanged.
                                Attachment editing will be added separately.
                            </p>

                            {projectUpdateError && (
                                <div className="announcement-form-error">
                                    {projectUpdateError}
                                </div>
                            )}

                            <div className="announcement-form-actions">

                                <button
                                    type="button"
                                    className="announcement-cancel-button"
                                    onClick={() => {
                                        setEditingProject(null);
                                        setProjectUpdateError("");
                                    }}
                                    disabled={updatingProject}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="announcement-submit-button"
                                    disabled={updatingProject}
                                >
                                    {updatingProject
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* ================================= */}
            {/* DELETE ASSIGNMENT MODAL */}
            {/* ================================= */}

            {deletingProject && (

                <div
                    className="modal-overlay"
                    onMouseDown={() => {
                        if (!projectDeleteLoading) {
                            setDeletingProject(null);
                            setProjectDeleteError("");
                        }
                    }}
                >

                    <div
                        className="delete-announcement-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="delete-icon">
                            !
                        </div>

                        <h2>
                            Delete Assignment?
                        </h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {deletingProject.title}
                            </strong>
                            ?
                            <br />
                            This action cannot be undone.
                        </p>

                        {projectDeleteError && (
                            <div className="announcement-form-error">
                                {projectDeleteError}
                            </div>
                        )}

                        <div className="delete-modal-actions">

                            <button
                                type="button"
                                className="announcement-cancel-button"
                                onClick={() => {
                                    setDeletingProject(null);
                                    setProjectDeleteError("");
                                }}
                                disabled={projectDeleteLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="announcement-confirm-delete-button"
                                onClick={handleDeleteAssignment}
                                disabled={projectDeleteLoading}
                            >
                                {projectDeleteLoading
                                    ? "Deleting..."
                                    : "Delete Assignment"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ================================= */}
            {/* VIEW SUBMISSIONS MODAL */}
            {/* ================================= */}

            {viewingSubmissionsProject && (

                <div
                    className="modal-overlay"
                    onMouseDown={closeProjectSubmissions}
                >

                    <div
                        className="submissions-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="submissions-modal-header">

                            <div>
                                <h2>
                                    {viewingSubmissionsProject.title}
                                </h2>

                                <p>
                                    {submissionCount} {submissionCount === 1
                                        ? "submission"
                                        : "submissions"}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="announcement-close-button"
                                onClick={closeProjectSubmissions}
                                disabled={submissionsLoading}
                            >
                                ×
                            </button>

                        </div>

                        {submissionsLoading && (
                            <div className="content-placeholder">
                                Loading submissions...
                            </div>
                        )}

                        {submissionsError && (
                            <div className="classroom-error">
                                {submissionsError}
                            </div>
                        )}

                        {!submissionsLoading &&
                            !submissionsError &&
                            (projectSubmissions.length === 0 ? (
                                <div className="empty-classroom-content">
                                    <h3>No submissions yet</h3>
                                    <p>
                                        No student has submitted this assignment yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="submissions-list">
                                    {projectSubmissions.map((submission) => (
                                        <div
                                            className="submission-student-card"
                                            key={submission._id}
                                        >

                                            <div className="submission-student-info">
                                                <div className="submission-student-avatar">
                                                    {submission.learner?.name
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <h4>
                                                        {submission.learner?.name ||
                                                            "Student"}
                                                    </h4>

                                                    <p>
                                                        {submission.learner?.email ||
                                                            ""}
                                                    </p>

                                                    <span>
                                                        Submitted {new Date(
                                                            submission.createdAt
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="submission-files">
                                                {submission.attachments?.map(
                                                    (attachment) => (
                                                        <button
                                                            type="button"
                                                            className="project-attachment-button"
                                                            key={attachment._id}
                                                            onClick={() =>
                                                                openFile(attachment)
                                                            }
                                                        >
                                                            {attachment.fileName}
                                                        </button>
                                                    )
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            ))}

                    </div>

                </div>

            )}

            {/* ================================= */}
            {/* REMOVE STUDENT MODAL */}
            {/* ================================= */}

            {removingStudent && (

                <div
                    className="modal-overlay"
                    onMouseDown={() => {
                        if (!removeStudentLoading) {
                            setRemovingStudent(null);
                            setRemoveStudentError("");
                        }
                    }}
                >

                    <div
                        className="delete-announcement-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="delete-icon">
                            !
                        </div>

                        <h2>
                            Remove Student?
                        </h2>

                        <p>
                            Are you sure you want to remove{" "}
                            <strong>
                                {removingStudent.student?.name || "this student"}
                            </strong>{" "}
                            from this classroom?
                            <br />
                            The student's account will not be deleted.
                        </p>

                        {removeStudentError && (
                            <div className="announcement-form-error">
                                {removeStudentError}
                            </div>
                        )}

                        <div className="delete-modal-actions">

                            <button
                                type="button"
                                className="announcement-cancel-button"
                                onClick={() => {
                                    setRemovingStudent(null);
                                    setRemoveStudentError("");
                                }}
                                disabled={removeStudentLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="announcement-confirm-delete-button"
                                onClick={handleRemoveStudent}
                                disabled={removeStudentLoading}
                            >
                                {removeStudentLoading
                                    ? "Removing..."
                                    : "Remove Student"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ================================= */}
            {/* DELETE ANNOUNCEMENT MODAL */}
            {/* ================================= */}

            {deletingAnnouncement && (

                <div
                    className="modal-overlay"
                    onMouseDown={() => {
                        if (!announcementDeleteLoading) {
                            setDeletingAnnouncement(null);
                        }
                    }}
                >

                    <div
                        className="delete-announcement-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="delete-icon">
                            !
                        </div>

                        <h2>
                            Delete Announcement?
                        </h2>

                        <p>
                            Are you sure you want to delete{" "}
                            <strong>
                                {deletingAnnouncement.title}
                            </strong>
                            ?
                            <br />
                            This action cannot be undone.
                        </p>

                        {announcementDeleteError && (
                            <div className="announcement-form-error">
                                {announcementDeleteError}
                            </div>
                        )}

                        <div className="delete-modal-actions">

                            <button
                                type="button"
                                className="announcement-cancel-button"
                                onClick={() =>
                                    setDeletingAnnouncement(null)
                                }
                                disabled={announcementDeleteLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="announcement-confirm-delete-button"
                                onClick={handleDeleteAnnouncement}
                                disabled={announcementDeleteLoading}
                            >
                                {announcementDeleteLoading
                                    ? "Deleting..."
                                    : "Delete Announcement"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ================================= */}
            {/* FILE VIEWER */}
            {/* ================================= */}

            {selectedFile && (

                <div
                    className="file-viewer-overlay"
                    onClick={closeFile}
                >

                    <div
                        className="file-viewer"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="file-viewer-header">

                            <h3>
                                {selectedFile.name}
                            </h3>

                            <button
                                type="button"
                                className="file-viewer-close"
                                onClick={closeFile}
                            >
                                Close
                            </button>

                        </div>

                        <div className="file-viewer-content">

                            {selectedFile.type?.startsWith(
                                "image/"
                            ) && (

                                <img
                                    src={selectedFile.url}
                                    alt={selectedFile.name}
                                    className="viewer-image"
                                />

                            )}

                            {selectedFile.type ===
                                "application/pdf" && (

                                <iframe
                                    src={selectedFile.url}
                                    title={selectedFile.name}
                                    className="viewer-pdf"
                                />

                            )}

                            {!selectedFile.type?.startsWith("image/") &&
                                selectedFile.type !==
                                    "application/pdf" && (

                                    <div className="unsupported-file">

                                        <p>
                                            This file type cannot be previewed.
                                        </p>

                                        <a
                                            href={selectedFile.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open File
                                        </a>

                                    </div>

                                )}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ClassroomDetails;