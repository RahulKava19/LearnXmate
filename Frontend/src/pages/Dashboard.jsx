import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    // =====================================================
    // STATE
    // =====================================================

    const [classrooms, setClassrooms] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState("");

    // Edit
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

    // Delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingClassroom, setDeletingClassroom] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Join
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [classCode, setClassCode] = useState("");
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState("");

    // Form
    const [classroomForm, setClassroomForm] = useState({
        name: "",
        description: ""
    });

    // =====================================================
    // USER
    // =====================================================

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const isTeacher = user?.role === "teacher";

    // =====================================================
    // FETCH CLASSROOMS
    // =====================================================

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/classrooms",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setClassrooms(response.data);

        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "Unable to load classrooms"
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setClassroomForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // =====================================================
    // CREATE CLASSROOM
    // =====================================================

    const handleCreateClassroom = async (event) => {
        event.preventDefault();

        setCreateError("");

        if (!classroomForm.name.trim()) {
            setCreateError(
                "Classroom name is required"
            );

            return;
        }

        try {
            setCreateLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5000/api/classrooms",
                {
                    id: Date.now(),
                    name: classroomForm.name.trim(),
                    description:
                        classroomForm.description.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Add newly created classroom
            setClassrooms((previous) => [
                response.data,
                ...previous
            ]);

            // Reset form
            setClassroomForm({
                name: "",
                description: ""
            });

            // Close modal
            setShowCreateModal(false);

        } catch (error) {
            console.error(error);

            setCreateError(
                error.response?.data?.message ||
                "Unable to create classroom"
            );

        } finally {
            setCreateLoading(false);
        }
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const openEditModal = (event, classroom) => {
        // Prevent classroom card click
        event.stopPropagation();

        setEditingClassroom(classroom);

        setClassroomForm({
            name: classroom.name || "",
            description: classroom.description || ""
        });

        setEditError("");

        setShowEditModal(true);
    };

    // =====================================================
    // UPDATE CLASSROOM
    // =====================================================

    const handleEditClassroom = async (event) => {
        event.preventDefault();

        setEditError("");

        if (!classroomForm.name.trim()) {
            setEditError(
                "Classroom name is required"
            );

            return;
        }

        if (!editingClassroom) {
            return;
        }

        try {
            setEditLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.put(
                `http://localhost:5000/api/classrooms/${editingClassroom.id}`,
                {
                    name: classroomForm.name.trim(),
                    description:
                        classroomForm.description.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Replace old classroom with updated classroom
            setClassrooms((previous) =>
                previous.map((classroom) =>
                    classroom._id === editingClassroom._id
                        ? response.data
                        : classroom
                )
            );

            setShowEditModal(false);

            setEditingClassroom(null);

            setClassroomForm({
                name: "",
                description: ""
            });

        } catch (error) {
            console.error(error);

            setEditError(
                error.response?.data?.message ||
                "Unable to update classroom"
            );

        } finally {
            setEditLoading(false);
        }
    };

    // =====================================================
    // OPEN DELETE MODAL
    // =====================================================

    const openDeleteModal = (event, classroom) => {
        // Prevent classroom card click
        event.stopPropagation();

        setDeletingClassroom(classroom);

        setDeleteError("");

        setShowDeleteModal(true);
    };

    // =====================================================
    // DELETE CLASSROOM
    // =====================================================

    const handleDeleteClassroom = async () => {
        if (!deletingClassroom) {
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteError("");

            const token = localStorage.getItem("token");

            await axios.delete(
                `http://localhost:5000/api/classrooms/${deletingClassroom.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Remove classroom from frontend
            setClassrooms((previous) =>
                previous.filter(
                    (classroom) =>
                        classroom._id !==
                        deletingClassroom._id
                )
            );

            // Close modal
            setShowDeleteModal(false);

            setDeletingClassroom(null);

        } catch (error) {
            console.error(error);

            setDeleteError(
                error.response?.data?.message ||
                "Unable to delete classroom"
            );

        } finally {
            setDeleteLoading(false);
        }
    };

    // =====================================================
    // OPEN JOIN MODAL
    // =====================================================

    const openJoinModal = () => {
        setClassCode("");
        setJoinError("");
        setShowJoinModal(true);
    };

    // =====================================================
    // JOIN CLASSROOM
    // =====================================================

    const handleJoinClassroom = async (event) => {
        event.preventDefault();

        setJoinError("");

        if (!classCode.trim()) {
            setJoinError(
                "Class code is required"
            );

            return;
        }

        try {
            setJoinLoading(true);

            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5000/api/classrooms/join",
                {
                    classCode: classCode
                        .trim()
                        .toUpperCase()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Add joined classroom to dashboard
            setClassrooms((previous) => [
                response.data.classroom,
                ...previous
            ]);

            // Reset
            setClassCode("");
            setJoinError("");

            // Close modal
            setShowJoinModal(false);

        } catch (error) {
            console.error(error);

            setJoinError(
                error.response?.data?.message ||
                "Unable to join classroom"
            );

        } finally {
            setJoinLoading(false);
        }
    };

    // =====================================================
    // CLOSE CREATE MODAL
    // =====================================================

    const closeCreateModal = () => {
        if (createLoading) {
            return;
        }

        setShowCreateModal(false);

        setCreateError("");

        setClassroomForm({
            name: "",
            description: ""
        });
    };

    // =====================================================
    // CLOSE EDIT MODAL
    // =====================================================

    const closeEditModal = () => {
        if (editLoading) {
            return;
        }

        setShowEditModal(false);

        setEditingClassroom(null);

        setEditError("");

        setClassroomForm({
            name: "",
            description: ""
        });
    };

    // =====================================================
    // CLOSE DELETE MODAL
    // =====================================================

    const closeDeleteModal = () => {
        if (deleteLoading) {
            return;
        }

        setShowDeleteModal(false);

        setDeletingClassroom(null);

        setDeleteError("");
    };

    // =====================================================
    // CLOSE JOIN MODAL
    // =====================================================

    const closeJoinModal = () => {
        if (joinLoading) {
            return;
        }

        setShowJoinModal(false);

        setClassCode("");

        setJoinError("");
    };

    // =====================================================
    // JSX
    // =====================================================

    return (
        <div className="dashboard-layout">

            <Sidebar />

            <main className="dashboard-main">

                <Navbar />

                <section className="dashboard-content">

                    {/* =================================================
                        WELCOME
                    ================================================= */}

                    <div className="welcome-section">

                        <div>

                            <h1>
                                Welcome back, {user?.name}
                            </h1>

                            <p>
                                {isTeacher
                                    ? "Manage your classrooms, classwork and students."
                                    : "Continue learning from your classrooms."
                                }
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        CLASSROOM HEADER
                    ================================================= */}

                    <div className="classroom-header">

                        <div>

                            <h2>
                                My Classrooms
                            </h2>

                            <p>
                                {isTeacher
                                    ? "Create and manage the classrooms you teach."
                                    : "Access your classes, classwork and resources."
                                }
                            </p>

                        </div>


                        {/* Teacher / Student action */}

                        {isTeacher ? (

                            <button
                                className="create-classroom-button"
                                onClick={() =>
                                    setShowCreateModal(true)
                                }
                            >

                                <span>
                                    +
                                </span>

                                Create Classroom

                            </button>

                        ) : (

                            <button
                                className="create-classroom-button"
                                onClick={openJoinModal}
                            >

                                <span>
                                    +
                                </span>

                                Join Classroom

                            </button>

                        )}

                    </div>


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loading && (

                        <div className="classroom-message">

                            Loading classrooms...

                        </div>

                    )}


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div className="classroom-error">

                            {error}

                        </div>

                    )}


                    {/* =================================================
                        EMPTY STATE
                    ================================================= */}

                    {!loading &&
                        !error &&
                        classrooms.length === 0 && (

                            <div className="empty-state">

                                <div className="empty-icon">

                                    {isTeacher ? "+" : ""}

                                </div>


                                <h3>
                                    No classrooms yet
                                </h3>


                                <p>

                                    {isTeacher
                                        ? "Create your first classroom to get started."
                                        : "Join a classroom to get started."
                                    }

                                </p>


                                {isTeacher ? (

                                    <button
                                        className="empty-create-button"
                                        onClick={() =>
                                            setShowCreateModal(true)
                                        }
                                    >
                                        Create Classroom
                                    </button>

                                ) : (

                                    <button
                                        className="empty-create-button"
                                        onClick={openJoinModal}
                                    >
                                        Join Classroom
                                    </button>

                                )}

                            </div>

                        )
                    }


                    {/* =================================================
                        CLASSROOM GRID
                    ================================================= */}

                    {!loading &&
                        !error &&
                        classrooms.length > 0 && (

                            <div className="classroom-grid">

                                {classrooms.map((classroom) => (

                                    <div
                                        className="classroom-card"
                                        key={classroom._id}
                                        onClick={() =>
                                            navigate(
                                                `/classrooms/${classroom.id}`
                                            )
                                        }
                                    >

                                        {/* Banner */}

                                        <div className="classroom-banner">

                                            <div className="classroom-pattern">

                                                {classroom.name
                                                    ?.charAt(0)
                                                    .toUpperCase()
                                                }

                                            </div>

                                        </div>


                                        {/* Information */}

                                        <div className="classroom-info">

                                            {/* Title + Actions */}

                                            <div className="classroom-title-row">

                                                <h3>
                                                    {classroom.name}
                                                </h3>


                                                {isTeacher && (

                                                    <div className="classroom-actions">

                                                        {/* EDIT */}

                                                        <button
                                                            className="edit-classroom-button"
                                                            onClick={(event) =>
                                                                openEditModal(
                                                                    event,
                                                                    classroom
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>


                                                        {/* DELETE */}

                                                        <button
                                                            className="delete-classroom-button"
                                                            onClick={(event) =>
                                                                openDeleteModal(
                                                                    event,
                                                                    classroom
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                )}

                                            </div>


                                            {/* Description */}

                                            <p>
                                                {classroom.description ||
                                                    "No description available."
                                                }
                                            </p>


                                            {/* Teacher class code */}

                                            {isTeacher && (

                                                <div className="classroom-code">

                                                    <span>
                                                        Class Code
                                                    </span>

                                                    <strong>
                                                        {classroom.classCode}
                                                    </strong>

                                                </div>

                                            )}


                                            {/* Footer */}

                                            <div className="classroom-footer">

                                                <span>

                                                    {isTeacher
                                                        ? "Manage classroom"
                                                        : "Open classroom"
                                                    }

                                                </span>


                                                <span className="arrow">
                                                    →
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )
                    }

                </section>

            </main>


            {/* =========================================================
                CREATE CLASSROOM MODAL
                IMPORTANT:
                This is OUTSIDE classrooms.map()
            ========================================================= */}

            {showCreateModal && (

                <div
                    className="modal-overlay"
                    onMouseDown={closeCreateModal}
                >

                    <div
                        className="create-classroom-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Create Classroom
                                </h2>

                                <p>
                                    Set up a new classroom for your students.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={closeCreateModal}
                                disabled={createLoading}
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={handleCreateClassroom}
                        >

                            <div className="modal-form-group">

                                <label>
                                    Classroom Name
                                </label>

                                <input
                                    name="name"
                                    type="text"
                                    placeholder="e.g. Data Structures"
                                    value={classroomForm.name}
                                    onChange={handleChange}
                                    disabled={createLoading}
                                    autoFocus
                                />

                            </div>


                            <div className="modal-form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    placeholder="Add a short description..."
                                    value={classroomForm.description}
                                    onChange={handleChange}
                                    disabled={createLoading}
                                    rows="4"
                                />

                            </div>


                            {createError && (

                                <div className="modal-error">

                                    {createError}

                                </div>

                            )}


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeCreateModal}
                                    disabled={createLoading}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="submit-create-button"
                                    disabled={createLoading}
                                >

                                    {createLoading
                                        ? "Creating..."
                                        : "Create Classroom"
                                    }

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =========================================================
                EDIT CLASSROOM MODAL
                IMPORTANT:
                This is OUTSIDE classrooms.map()
            ========================================================= */}

            {showEditModal && (

                <div
                    className="modal-overlay"
                    onMouseDown={closeEditModal}
                >

                    <div
                        className="create-classroom-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Edit Classroom
                                </h2>

                                <p>
                                    Update your classroom information.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={closeEditModal}
                                disabled={editLoading}
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={handleEditClassroom}
                        >

                            <div className="modal-form-group">

                                <label>
                                    Classroom Name
                                </label>

                                <input
                                    name="name"
                                    type="text"
                                    value={classroomForm.name}
                                    onChange={handleChange}
                                    disabled={editLoading}
                                    autoFocus
                                />

                            </div>


                            <div className="modal-form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={classroomForm.description}
                                    onChange={handleChange}
                                    disabled={editLoading}
                                    rows="4"
                                />

                            </div>


                            {editError && (

                                <div className="modal-error">

                                    {editError}

                                </div>

                            )}


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeEditModal}
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="submit-create-button"
                                    disabled={editLoading}
                                >

                                    {editLoading
                                        ? "Saving..."
                                        : "Save Changes"
                                    }

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* =========================================================
                DELETE CLASSROOM MODAL
                IMPORTANT:
                THIS IS OUTSIDE classrooms.map()
                So only ONE modal exists.
            ========================================================= */}

            {showDeleteModal && (

                <div
                    className="modal-overlay"
                    onMouseDown={closeDeleteModal}
                >

                    <div
                        className="delete-classroom-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="delete-icon">
                            !
                        </div>


                        <h2>
                            Delete Classroom?
                        </h2>


                        <p>

                            Are you sure you want to delete{" "}

                            <strong>
                                {deletingClassroom?.name}
                            </strong>

                            ?

                            <br />

                            This action cannot be undone.

                        </p>


                        {deleteError && (

                            <div className="modal-error">

                                {deleteError}

                            </div>

                        )}


                        <div className="delete-modal-actions">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={closeDeleteModal}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="confirm-delete-button"
                                onClick={handleDeleteClassroom}
                                disabled={deleteLoading}
                            >

                                {deleteLoading
                                    ? "Deleting..."
                                    : "Delete Classroom"
                                }

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =========================================================
                JOIN CLASSROOM MODAL
            ========================================================= */}

            {showJoinModal && (

                <div
                    className="modal-overlay"
                    onMouseDown={closeJoinModal}
                >

                    <div
                        className="create-classroom-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Join Classroom
                                </h2>

                                <p>
                                    Enter the class code provided by your instructor.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={closeJoinModal}
                                disabled={joinLoading}
                            >
                                ×
                            </button>

                        </div>


                        <form
                            onSubmit={handleJoinClassroom}
                        >

                            <div className="modal-form-group">

                                <label>
                                    Class Code
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. ABC123"
                                    value={classCode}
                                    onChange={(event) =>
                                        setClassCode(
                                            event.target.value.toUpperCase()
                                        )
                                    }
                                    disabled={joinLoading}
                                    autoFocus
                                    maxLength={6}
                                />

                            </div>


                            {joinError && (

                                <div className="modal-error">

                                    {joinError}

                                </div>

                            )}


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeJoinModal}
                                    disabled={joinLoading}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="submit-create-button"
                                    disabled={joinLoading}
                                >

                                    {joinLoading
                                        ? "Joining..."
                                        : "Join Classroom"
                                    }

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Dashboard;