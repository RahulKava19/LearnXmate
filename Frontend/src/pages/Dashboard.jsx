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

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    useEffect(() => {

        const fetchClassrooms = async () => {

            try {

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

        fetchClassrooms();

    }, []);

    return (
        <div className="dashboard-layout">

            <Sidebar />

            <main className="dashboard-main">

                <Navbar />

                <section className="dashboard-content">

                    <div className="welcome-section">

                        <h1>
                            Welcome back, {user?.name} 
                        </h1>

                        <p>
                            Continue learning from your classrooms.
                        </p>

                    </div>


                    <div className="classroom-header">

                        <div>
                            <h2>My Classrooms</h2>

                            <p>
                                Access your classes, classwork and resources.
                            </p>
                        </div>

                    </div>


                    {loading && (
                        <div className="classroom-message">
                            Loading classrooms...
                        </div>
                    )}


                    {error && (
                        <div className="classroom-error">
                            {error}
                        </div>
                    )}


                    {!loading &&
                        !error &&
                        classrooms.length === 0 && (

                            <div className="empty-state">

                                <div className="empty-icon">
                                    
                                </div>

                                <h3>
                                    No classrooms yet
                                </h3>

                                <p>
                                    Join a classroom or create one to get started.
                                </p>

                            </div>
                        )
                    }


                    {!loading &&
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

                                        <div className="classroom-banner">

                                            <div className="classroom-pattern">
                                                {classroom.name
                                                    ?.charAt(0)
                                                    .toUpperCase()
                                                }
                                            </div>

                                        </div>


                                        <div className="classroom-info">

                                            <h3>
                                                {classroom.name}
                                            </h3>

                                            <p>
                                                {classroom.description ||
                                                    "No description available."
                                                }
                                            </p>
                                        </div>

                                    </div>

                                ))}

                            </div>
                        )
                    }

                </section>

            </main>

        </div>
    );
}

export default Dashboard;