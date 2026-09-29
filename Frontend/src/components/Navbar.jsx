function Navbar() {

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    return (
        <header className="navbar">

            <div>
                <h2>Dashboard</h2>
                <p>Manage your learning from here.</p>
            </div>

            <div className="navbar-user">

                <div className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>

                <div className="user-info">
                    <strong>{user?.name}</strong>
                    <span>{user?.role}</span>
                </div>

            </div>

        </header>
    );
}

export default Navbar;