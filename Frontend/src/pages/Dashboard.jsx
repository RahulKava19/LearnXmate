
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {

    const navigate = useNavigate();

    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);

    const [classroomForm, setClassroomForm] = useState({
        name: "",
        description: ""
    });

    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState("");

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const isTeacher = user?.role === "teacher";


    // ================= FETCH CLASSROOMS =================

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


    // ================= FORM HANDLER =================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setClassroomForm((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    // ================= CREATE CLASSROOM =================

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


            /*
             * Our backend currently requires
             * a numeric classroom ID.
             *
             * We generate a unique numeric ID here.
             */
            const classroomId =
                Date.now();


            const response = await axios.post(
                "http://localhost:5000/api/classrooms",
                {
                    id: classroomId,
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


    // ================= CLOSE MODAL =================

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


    return (
        <div className="dashboard-layout">

            <Sidebar />


            <main className="dashboard-main">

                <Navbar />


                <section className="dashboard-content">


                    {/* ================= WELCOME ================= */}

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


                    {/* ================= CLASSROOM HEADER ================= */}

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


                        {/* Teacher-only button */}

                        {isTeacher && (

                            <button
                                className="create-classroom-button"
                                onClick={() =>
                                    setShowCreateModal(true)
                                }
                            >
                                <span>+</span>
                                Create Classroom
                            </button>

                        )}

                    </div>


                    {/* ================= LOADING ================= */}

                    {loading && (

                        <div className="classroom-message">

                            Loading classrooms...

                        </div>

                    )}


                    {/* ================= ERROR ================= */}

                    {error && (

                        <div className="classroom-error">

                            {error}

                        </div>

                    )}


                    {/* ================= EMPTY STATE ================= */}

                    {!loading &&
                        !error &&
                        classrooms.length === 0 && (

                            <div className="empty-state">

                                <div className="empty-icon">
                                    {isTeacher ? "+" : ""}
                                </div>


                                <h3>

                                    {isTeacher
                                        ? "No classrooms yet"
                                        : "No classrooms yet"
                                    }

                                </h3>


                                <p>

                                    {isTeacher
                                        ? "Create your first classroom to get started."
                                        : "Join a classroom to get started."
                                    }

                                </p>


                                {isTeacher && (

                                    <button
                                        className="empty-create-button"
                                        onClick={() =>
                                            setShowCreateModal(true)
                                        }
                                    >
                                        Create Classroom
                                    </button>

                                )}

                            </div>

                        )
                    }


                    {/* ================= CLASSROOM GRID ================= */}

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

                                            <h3>
                                                {classroom.name}
                                            </h3>


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


            {/* ================= CREATE CLASSROOM MODAL ================= */}

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

                                <label htmlFor="classroom-name">
                                    Classroom Name
                                </label>

                                <input
                                    id="classroom-name"
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

                                <label htmlFor="classroom-description">
                                    Description
                                </label>

                                <textarea
                                    id="classroom-description"
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

        </div>
    );
}

export default Dashboard;

