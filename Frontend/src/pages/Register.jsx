import { Link } from "react-router-dom";
import "./Register.css";

function Register() {
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
                        <p>Join LearnXmate today</p>
                    </div>

                    <form>

                        <div className="form-group">
                            <label htmlFor="name">Name</label>

                            <input
                                type="text"
                                id="name"
                                placeholder="Enter your name"
                            />
                        </div>

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
                                placeholder="Create a password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Account type</label>

                            <select id="role" defaultValue="">
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
                        >
                            Create account
                        </button>

                    </form>

                    <div className="login-link">
                        <span>Already have an account?</span>

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