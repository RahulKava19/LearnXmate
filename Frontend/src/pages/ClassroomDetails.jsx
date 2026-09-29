import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import "../pages/ClassroomDetails.css";

function ClassroomDetails() {

    const { id } = useParams();

    const [classroom, setClassroom] = useState(null);
    const [activeTab, setActiveTab] = useState("stream");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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


    if (loading) {
        return (
            <div className="page-loading">
                Loading classroom...
            </div>
        );
    }


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
                                .toUpperCase()
                            }
                        </div>

                        <div>

                            <h1>
                                {classroom.name}
                            </h1>

                            <p>
                                {classroom.description ||
                                    "No description available."
                                }
                            </p>

                            <span>
                                Class Code: {classroom.classCode}
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
                        onClick={() => setActiveTab("stream")}
                    >
                        Stream
                    </button>

                    <button
                        className={
                            activeTab === "classwork"
                                ? "active"
                                : ""
                        }
                        onClick={() => setActiveTab("classwork")}
                    >
                        Classwork
                    </button>

                    <button
                        className={
                            activeTab === "people"
                                ? "active"
                                : ""
                        }
                        onClick={() => setActiveTab("people")}
                    >
                        People
                    </button>

                </nav>


                {/* CONTENT */}

                <section className="classroom-content">

                    {activeTab === "stream" && (

                        <div className="tab-content">

                            <h2>
                                Stream
                            </h2>

                            <p className="tab-description">
                                Announcements and recent classroom activity
                                will appear here.
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


                    {activeTab === "classwork" && (

                        <div className="tab-content">

                            <h2>
                                Classwork
                            </h2>

                            <p className="tab-description">
                                Documents and projects for this classroom.
                            </p>


                            <div className="content-section">

                                <h3>
                                    Documents
                                </h3>

                                <div className="content-placeholder">
                                    Documents for this classroom will appear
                                    here.
                                </div>

                            </div>


                            <div className="content-section">

                                <h3>
                                    Projects
                                </h3>

                                <div className="content-placeholder">
                                    Projects and assignments for this
                                    classroom will appear here.
                                </div>

                            </div>

                        </div>

                    )}


                    {activeTab === "people" && (

                        <div className="tab-content">

                            <h2>
                                People
                            </h2>

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

        </div>
    );
}

export default ClassroomDetails;