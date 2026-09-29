import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        id: "",
        name: "",
        email: "",
        password: "",
        role: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await axios.post(
                "http://localhost:5000/api/users/register",
                {
                    id: Number(formData.id),
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                }
            );

            console.log("Registration successful:", response.data);

            alert("Registration successful!");

            navigate("/login");

        } catch (error) {

            console.error(error);

            setError(
                error.response?.data?.message ||
                "Registration failed"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-left">

                <div className="brand">
                    <div className="brand-logo">L</div>
                    <span>LearnXmate</span>
                </div>

                <div className="register-welcome">

                    <h1>
                        Start your
                        <br />
                        <span>learning journey.</span>
                    </h1>

                    <p>
                        Create your account and connect with
                        classrooms, instructors and fellow learners.
                    </p>

                </div>

            </div>

            <div className="register-right">

                <div className="register-card">

                    <div className="register-header">

                        <h2>Create account</h2>

                        <p>
                            Join LearnXmate today
                        </p>

                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">

                            <label htmlFor="id">
                                User ID
                            </label>

                            <input
                                type="number"
                                id="id"
                                placeholder="Enter your user ID"
                                value={formData.id}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="name">
                                Name
                            </label>

                            <input
                                type="text"
                                id="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="email">
                                Email
                            </label>

                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                type="password"
                                id="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="role">
                                Account type
                            </label>

                            <select
                                id="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >

                                <option value="" disabled>
                                    Select account type
                                </option>

                                <option value="student">
                                    Student
                                </option>

                                <option value="teacher">
                                    Teacher
                                </option>

                            </select>

                        </div>

                        <button
                            type="submit"
                            className="register-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Creating account..."
                                : "Create account"
                            }

                        </button>

                    </form>

                    <div className="login-link">

                        <span>
                            Already have an account?
                        </span>

                        <Link to="/login">
                            Login
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Register;