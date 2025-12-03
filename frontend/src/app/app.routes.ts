import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { PublishPage } from './pages/publish/publish.page';
import { ExchangesPage } from './pages/exchanges/exchanges.page';
import { ProfilePage } from './pages/profile/profile.page';
import { AdminPage } from './pages/admin/admin.page';

// 👇 IMPORTA el componente standalone de solicitudes
import { SolicitudesComponent } from './solicitudes/solicitudes.component';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'publish', component: PublishPage },
  { path: 'exchanges', component: ExchangesPage },
  { path: 'profile', component: ProfilePage },
  { path: 'admin', component: AdminPage },

  // 👇 NUEVA RUTA
  { path: 'solicitudes', component: SolicitudesComponent },
];

