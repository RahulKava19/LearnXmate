import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./Assignments.css";

function Assignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const token = localStorage.getItem("token");

                const classroomsResponse = await axios.get(
                    "http://localhost:5000/api/classrooms",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const classrooms = classroomsResponse.data;

                const projectResponses = await Promise.all(
                    classrooms.map((classroom) =>
                        axios.get(
                            `http://localhost:5000/api/classrooms/${classroom.id}/projects`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        )
                    )
                );

                const allAssignments = [];

                projectResponses.forEach((response, index) => {
                    const classroom = classrooms[index];

                    response.data.forEach((project) => {
                        allAssignments.push({
                            ...project,
                            classroomName: classroom.name
                        });
                    });
                });

                setAssignments(allAssignments);

            } catch (error) {
                console.error(error);

                setError(
                    error.response?.data?.message ||
                    "Unable to load assignments"
                );

            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    return (
        <div className="assignments-layout">

            <Sidebar />

            <main className="assignments-main">

                <section className="assignments-header">
                    <h1>Assignments</h1>

                    <p>
                        View assignments from all your classrooms.
                    </p>
                </section>


                {loading && (
                    <div className="assignment-message">
                        Loading assignments...
                    </div>
                )}


                {error && (
                    <div className="assignment-error">
                        {error}
                    </div>
                )}


                {!loading &&
                    !error &&
                    assignments.length === 0 && (
                        <div className="assignment-empty">
                            <h3>No assignments yet</h3>

                            <p>
                                Assignments from your classrooms
                                will appear here.
                            </p>
                        </div>
                    )}


                {!loading &&
                    !error &&
                    assignments.length > 0 && (

                        <div className="assignment-list">

                            {assignments.map((assignment) => (

                                <div
                                    className="assignment-card"
                                    key={assignment._id}
                                >

                                    <div className="assignment-info">

                                        <span className="assignment-classroom">
                                            {assignment.classroomName}
                                        </span>

                                        <h2>
                                            {assignment.title}
                                        </h2>

                                        <p>
                                            {assignment.description ||
                                                "No description available."}
                                        </p>

                                    </div>


                                    <div className="assignment-due">

                                        <span>
                                            Due
                                        </span>

                                        <strong>
                                            {assignment.dueDate
                                                ? new Date(
                                                    assignment.dueDate
                                                ).toLocaleDateString()
                                                : "No due date"}
                                        </strong>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

            </main>

        </div>
    );
}

export default Assignments;