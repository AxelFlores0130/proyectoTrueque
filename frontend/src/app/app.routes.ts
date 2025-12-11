import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { LoginPage } from './pages/login/login.page';

// 👇 ahora usamos la página "registro"
import { RegistroPage } from './pages/registro/registro.page';

import { PublishPage } from './pages/publish/publish.page';
import { ExchangesPage } from './pages/exchanges/exchanges.page';
import { ProfilePage } from './pages/profile/profile.page';
import { AdminPage } from './pages/admin/admin.page';

// componente standalone de solicitudes
import { SolicitudesComponent } from './solicitudes/solicitudes.component';

// componentes de intercambios
import { IntercambiosEnProcesoComponent } from './pages/intercambios/intercambios-en-proceso.component';
import { IntercambioChatComponent } from './pages/intercambios/intercambio-chat.component';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'login', component: LoginPage },

  // ruta principal de registro
  { path: 'register', component: RegistroPage },

  // por compatibilidad: /registro también lleva a la misma pantalla
  { path: 'registro', component:  RegistroPage },

  { path: 'publish', component: PublishPage },
  { path: 'exchanges', component: ExchangesPage },
  { path: 'profile', component: ProfilePage },
  { path: 'admin', component: AdminPage },

  // solicitudes
  { path: 'solicitudes', component: SolicitudesComponent },

  // intercambios
  { path: 'intercambios', component: IntercambiosEnProcesoComponent },
  { path: 'intercambios/:id', component: IntercambioChatComponent },
];




