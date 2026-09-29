import { Link } from "react-router-dom";
import "./Login.css";

function Login() {
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
                        <p>Login to your LearnXmate account</p>
                    </div>

                    <form>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>

                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>

                            <input
                                type="password"
                                id="password"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button type="submit" className="login-button">
                            Login
                        </button>

                    </form>

                    <div className="register-link">
                        <span>Don't have an account?</span>

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