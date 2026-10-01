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
    const [instructor, setInstructor] = useState(null);

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

                            <h2>
                                Stream
                            </h2>

                            <p className="tab-description">
                                Announcements and recent
                                classroom activity will appear here.
                            </p>

                            <div className="empty-classroom-content">

                                <h3>
                                    No announcements yet
                                </h3>

                                <p>
                                    Classroom activity will appear here.
                                </p>

                            </div>

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
                                                    Projects
                                                </h3>

                                            </div>

                                            {projects.length === 0 ? (

                                                <div className="content-placeholder">
                                                    No projects in this classroom.
                                                </div>

                                            ) : (

                                                <div className="classwork-list">

                                                    {projects.map(
                                                        (project) => {

                                                            const submission =
                                                                submissions[
                                                                    project.id
                                                                ];

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
                                                                <div
                                                                    className="classwork-item"
                                                                    key={project._id}
                                                                >

                                                                    <div>

                                                                        <h4>
                                                                            {project.title}
                                                                        </h4>

                                                                        <p>
                                                                            {project.description ||
                                                                                "No description available."}
                                                                        </p>

                                                                        {project.dueDate && (
                                                                            <span>
                                                                                Due:{" "}
                                                                                {new Date(
                                                                                    project.dueDate
                                                                                ).toLocaleDateString()}
                                                                            </span>
                                                                        )}

                                                                        {/* PROJECT ATTACHMENTS */}

                                                                        {project.attachments &&
                                                                            project.attachments.length > 0 && (

                                                                                <div className="document-attachments">

                                                                                    {project.attachments.map(
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

                                                                        {/* ================================= */}
                                                                        {/* STUDENT SUBMISSION */}
                                                                        {/* ================================= */}

                                                                        {isStudent && (

                                                                            <div className="submission-section">

                                                                                {!submission ? (

                                                                                    // ---------------------------------
                                                                                    // NOT TURNED IN
                                                                                    // ---------------------------------

                                                                                    <>

                                                                                        <div className="submission-status">
                                                                                            Not turned in
                                                                                        </div>

                                                                                        <h5>
                                                                                            Submit Assignment
                                                                                        </h5>

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
                                                                                                    (
                                                                                                        file,
                                                                                                        index
                                                                                                    ) => (

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

                                                                                        <button
                                                                                            type="button"
                                                                                            className="attachment-button"
                                                                                            disabled={
                                                                                                submittingProject ===
                                                                                                project.id
                                                                                            }
                                                                                            onClick={() =>
                                                                                                submitAssignment(
                                                                                                    project
                                                                                                )
                                                                                            }
                                                                                        >

                                                                                            {submittingProject ===
                                                                                            project.id
                                                                                                ? "Turning in..."
                                                                                                : "Turn In"}

                                                                                        </button>

                                                                                        {projectMessage && (
                                                                                            <p>
                                                                                                {projectMessage}
                                                                                            </p>
                                                                                        )}

                                                                                    </>

                                                                                ) : (

                                                                                    // ---------------------------------
                                                                                    // TURNED IN
                                                                                    // ---------------------------------

                                                                                    <div className="submitted-assignment">

                                                                                        <div className="submission-status submitted">
                                                                                            Turned in
                                                                                        </div>

                                                                                        <h5>
                                                                                            Submitted Files
                                                                                        </h5>

                                                                                        {submission.attachments &&
                                                                                            submission.attachments.map(
                                                                                                (attachment) => (

                                                                                                    <div
                                                                                                        className="submission-file"
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
                                                                                                            {attachment.fileName}
                                                                                                        </button>

                                                                                                    </div>

                                                                                                )
                                                                                            )}

                                                                                        {projectError && (
                                                                                            <p className="classroom-error">
                                                                                                {projectError}
                                                                                            </p>
                                                                                        )}

                                                                                        <button
                                                                                            type="button"
                                                                                            className="attachment-button"
                                                                                            disabled={
                                                                                                unsubmittingProject ===
                                                                                                project.id
                                                                                            }
                                                                                            onClick={() =>
                                                                                                unsubmitAssignment(
                                                                                                    project
                                                                                                )
                                                                                            }
                                                                                        >

                                                                                            {unsubmittingProject ===
                                                                                            project.id
                                                                                                ? "Unsubmitting..."
                                                                                                : "Unsubmit"}

                                                                                        </button>

                                                                                    </div>

                                                                                )}

                                                                            </div>

                                                                        )}

                                                                    </div>

                                                                </div>
                                                            );
                                                        }
                                                    )}

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