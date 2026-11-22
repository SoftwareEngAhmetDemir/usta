import { Navigate, Route, Routes } from 'react-router';
import { AdminMachinesPage, StickersPage, UsersPage } from '../features/admin';
import { AlertsPage, AlertsProvider } from '../features/alerts';
import { AskPage } from '../features/ask';
import { AuthProvider, LoginPage, RegisterPage, RequireAuth } from '../features/auth';
import { DocumentPage, DocumentUploadPage } from '../features/documents';
import { NewMachinePage } from '../features/machine-new';
import { MachinePage } from '../features/machine-page';
import { MaintenanceFormPage, TechHomePage } from '../features/maintenance';
import { MyQuestionsPage } from '../features/my-questions';
import { RecorderPage } from '../features/recorder';
import { ScanPage } from '../features/scan';
import { ReplyPage, UstaHomePage, UstaProfilePage } from '../features/usta';
import { VideoPage } from '../features/video-player';
import { AppLayout } from './components/AppLayout';
import { HomeRedirect } from './components/HomeRedirect';

export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth><AlertsProvider><AppLayout /></AlertsProvider></RequireAuth>}>
          <Route index element={<HomeRedirect />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="machines/new" element={<NewMachinePage />} />
          <Route path="m/:machineId" element={<MachinePage />} />
          <Route path="m/:machineId/ask" element={<AskPage />} />
          <Route path="m/:machineId/maintenance" element={<MaintenanceFormPage />} />
          <Route path="m/:machineId/documents/new" element={<DocumentUploadPage />} />
          <Route path="videos/:videoId" element={<VideoPage />} />
          <Route path="documents/:documentId" element={<DocumentPage />} />
          <Route path="my-questions" element={<MyQuestionsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="usta" element={<UstaHomePage />} />
          <Route path="usta/questions/:questionId" element={<ReplyPage />} />
          <Route path="ustas/:ustaId" element={<UstaProfilePage />} />
          <Route path="record" element={<RecorderPage />} />
          <Route path="maintenance" element={<TechHomePage />} />
          <Route path="panel" element={<AdminMachinesPage />} />
          <Route path="panel/stickers" element={<StickersPage />} />
          <Route path="panel/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
