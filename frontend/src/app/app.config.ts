import { ApplicationConfig } from "@angular/core";
import { provideRouter, Routes } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";

const routes: Routes = [
  { 
    path: "", 
    loadComponent: () => import("./pages/home/home.page").then(m => m.HomePage) 
  },

  // ⬇️ AQUÍ EL CAMBIO: ahora apunta a ./pages/productos/productos.component
  { 
    path: "productos", 
    loadComponent: () => import("./pages/productos/productos.component").then(m => m.ProductosComponent) 
  },

  { 
    path: "como", 
    loadComponent: () => import("./pages/como/como.page").then(m => m.ComoPage) 
  },
  { 
    path: "login", 
    loadComponent: () => import("./pages/login/login.page").then(m => m.LoginPage) 
  },
  { 
    path: "registro", 
    loadComponent: () => import("./pages/registro/registro.page").then(m => m.RegistroPage) 
  },

    {
    path: 'intercambios',
    loadComponent: () =>
      import('./pages/intercambios/intercambios-en-proceso.component').then(
        (m) => m.IntercambiosEnProcesoComponent,
      ),
  },
  {
    path: 'intercambios/:id',
    loadComponent: () =>
      import('./pages/intercambios/intercambio-chat.component').then(
        (m) => m.IntercambioChatComponent,
      ),
  },

  { 
    path: "solicitudes", 
    loadComponent: () => import("./solicitudes/solicitudes.component").then(m => m.SolicitudesComponent) 
  },
  { 
    path: "**", 
    redirectTo: "" 
  }
];

export const appConfig: ApplicationConfig = {
  providers: [ provideRouter(routes), provideHttpClient() ]
};

