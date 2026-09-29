import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    return (
        <aside className="sidebar">

            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    L
                </div>

                <span>
                    LearnXmate
                </span>
            </div>


            <nav className="sidebar-nav">

                <NavLink to="/dashboard">
                    Dashboard
                </NavLink>

                <NavLink to="/meetings">
                    Meetings
                </NavLink>

                <NavLink to="/assignments">
                    Assignments
                </NavLink>

            </nav>


            <button
                className="logout-button"
                onClick={handleLogout}
            >
                Logout
            </button>

        </aside>
    );
}

export default Sidebar;