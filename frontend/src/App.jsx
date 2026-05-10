import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { TripLayout } from './components/layout/TripLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import InvitePage from './pages/InvitePage';

// App pages
import TripsPage from './pages/TripsPage';
import NewTripPage from './pages/NewTripPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ArchivePage from './pages/ArchivePage';

// Trip sub-pages
import TripOverview from './pages/trip/TripOverview';
import ItineraryPage from './pages/trip/ItineraryPage';
import BudgetPage from './pages/trip/BudgetPage';
import ChecklistsPage from './pages/trip/ChecklistsPage';
import ReservationsPage from './pages/trip/ReservationsPage';
import FilesPage from './pages/trip/FilesPage';
import PeoplePage from './pages/trip/PeoplePage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* Protected app layout */}
      <Route element={<AppLayout />}>
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/new" element={<NewTripPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/archive" element={<ArchivePage />} />

        {/* Trip with nested layout */}
        <Route path="/trips/:tripId" element={<TripLayout />}>
          <Route index element={<TripOverview />} />
          <Route path="itinerary" element={<ItineraryPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="checklists" element={<ChecklistsPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="people" element={<PeoplePage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
