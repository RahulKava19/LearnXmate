import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import ProtectedRoute from "./components/ProtectedRoute";
import ClassroomDetails from "./pages/ClassroomDetails";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* Public routes */}

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* Protected routes */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/classrooms"
                    element={
                        <ProtectedRoute>
                            <Classrooms />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/classrooms/:id"
                    element={
                        <ProtectedRoute>
                            <ClassroomDetails />
                        </ProtectedRoute>
                    }
                />

                
            </Routes>

        </BrowserRouter>
    );
}

export default App;