import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import BuilderFeed from './components/feed/BuilderFeed';
import ProfilePage from './components/profile/ProfilePage';
import ConnectRequestsPage from './components/requests/ConnectRequestsPage';
import MatchesPage from './components/matches/MatchesPage';
import ChatPage from './components/chat/ChatPage';
import NotificationsPage from './components/notifications/NotificationsPage';
import SettingsPage from './components/settings/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/feed" replace />} />
            <Route path="feed" element={<BuilderFeed />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="requests" element={<ConnectRequestsPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="chat/:targetUserId" element={<ChatPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
