import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import ProtectedRoute from "./components/ProtectedRoute";
import ClassroomDetails from "./pages/ClassroomDetails";
import Assignments from "./pages/Assignments";
import Meetings from "./pages/Meetings";
import MeetingRoom from "./components/MeetingRoom";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ========================= */}
        {/* PUBLIC ROUTES */}
        {/* ========================= */}

        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />


        {/* ========================= */}
        {/* PROTECTED ROUTES */}
        {/* ========================= */}

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


        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          }
        />


        {/* ========================= */}
        {/* MEETINGS PAGE */}
        {/* ========================= */}

        <Route
          path="/meetings"
          element={
            <ProtectedRoute>
              <Meetings />
            </ProtectedRoute>
          }
        />


        {/* ========================= */}
        {/* INDIVIDUAL MEETING ROOM */}
        {/* ========================= */}

        <Route
          path="/meetings/:meetingCode"
          element={
            <ProtectedRoute>
              <MeetingRoom />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;