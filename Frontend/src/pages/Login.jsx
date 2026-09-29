import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
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
                "http://localhost:5000/api/users/login",
                {
                    email: formData.email,
                    password: formData.password
                }
            );

            console.log("Login successful:", response.data);

            const { token, user } = response.data;

            // Store JWT
            localStorage.setItem("token", token);

            // Store user information
            localStorage.setItem("user", JSON.stringify(user));

            alert("Login successful!");

            navigate("/dashboard");

        } catch (error) {

            console.error(error);

            setError(
                error.response?.data?.message ||
                "Login failed"
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-left">

                <div className="brand">
                    <div className="brand-logo">L</div>
                    <span>LearnXmate</span>
                </div>

                <div className="welcome-content">

                    <h1>
                        Learn together.
                        <br />
                        <span>Grow together.</span>
                    </h1>

                    <p>
                        A simple learning platform for classrooms,
                        assignments, documents and live meetings.
                    </p>

                </div>

            </div>

            <div className="login-right">

                <div className="login-card">

                    <div className="login-header">

                        <h2>Welcome back</h2>

                        <p>
                            Login to your LearnXmate account
                        </p>

                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

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
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Logging in..."
                                : "Login"
                            }

                        </button>

                    </form>

                    <div className="register-link">

                        <span>
                            Don't have an account?
                        </span>

                        <Link to="/register">
                            Create account
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Login;