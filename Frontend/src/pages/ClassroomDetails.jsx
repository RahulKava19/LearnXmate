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

    const [activeTab, setActiveTab] = useState("stream");

    const [loading, setLoading] = useState(true);
    const [classworkLoading, setClassworkLoading] = useState(false);

    const [error, setError] = useState("");
    const [classworkError, setClassworkError] = useState("");

    // File viewer
    const [selectedFile, setSelectedFile] = useState(null);


    // ---------------------------------------------
    // GET CLASSROOM
    // ---------------------------------------------

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


    // ---------------------------------------------
    // GET DOCUMENTS + PROJECTS
    // ---------------------------------------------

    const fetchClasswork = async () => {
        try {
            setClassworkLoading(true);
            setClassworkError("");

            const token = localStorage.getItem("token");

            const [documentsResponse, projectsResponse] =
                await Promise.all([
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


    // ---------------------------------------------
    // LOAD CLASSWORK
    // ---------------------------------------------

    useEffect(() => {
        if (activeTab === "classwork" && classroom) {
            fetchClasswork();
        }
    }, [activeTab, classroom, id]);


    // ---------------------------------------------
    // OPEN FILE
    // ---------------------------------------------

    const openFile = (attachment) => {
        const fileUrl =
            `http://localhost:5000${attachment.fileUrl}`;

        setSelectedFile({
            name: attachment.fileName,
            type: attachment.fileType,
            url: fileUrl
        });
    };


    // ---------------------------------------------
    // CLOSE FILE VIEWER
    // ---------------------------------------------

    const closeFile = () => {
        setSelectedFile(null);
    };


    // ---------------------------------------------
    // LOADING
    // ---------------------------------------------

    if (loading) {
        return (
            <div className="page-loading">
                Loading classroom...
            </div>
        );
    }


    // ---------------------------------------------
    // ERROR
    // ---------------------------------------------

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

                {/* CLASSROOM HEADER */}

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


                {/* TABS */}

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


                {/* CONTENT */}

                <section className="classroom-content">


                    {/* ================================= */}
                    {/* STREAM */}
                    {/* ================================= */}

                    {activeTab === "stream" && (

                        <div className="tab-content">

                            <h2>Stream</h2>

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

                            <h2>Classwork</h2>

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


                                                                    {/* ATTACHMENTS */}

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
                                                                                                onKeyDown={(e) => {
                                                                                                    if (
                                                                                                        e.key ===
                                                                                                        "Enter"
                                                                                                    ) {
                                                                                                        openFile(
                                                                                                            attachment
                                                                                                        );
                                                                                                    }
                                                                                                }}
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
                                                        (project) => (

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

                                                                </div>

                                                            </div>

                                                        )
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

                            <h2>People</h2>

                            <p className="tab-description">
                                Instructor and students in this classroom.
                            </p>

                            <div className="empty-classroom-content">

                                <h3>
                                    Classroom members
                                </h3>

                                <p>
                                    Student and instructor information
                                    will appear here.
                                </p>

                            </div>

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

                            {/* IMAGE */}

                            {selectedFile.type?.startsWith(
                                "image/"
                            ) && (

                                <img
                                    src={selectedFile.url}
                                    alt={selectedFile.name}
                                    className="viewer-image"
                                />

                            )}


                            {/* PDF */}

                            {selectedFile.type ===
                                "application/pdf" && (

                                <iframe
                                    src={selectedFile.url}
                                    title={selectedFile.name}
                                    className="viewer-pdf"
                                />

                            )}


                            {/* OTHER FILE */}

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