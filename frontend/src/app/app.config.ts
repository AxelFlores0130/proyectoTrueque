import { ApplicationConfig } from "@angular/core";
import { provideRouter, Routes } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";

const routes: Routes = [
  { 
    path: "", 
    loadComponent: () => import("./pages/home/home.page").then(m => m.HomePage) 
  },

  // Productos
  { 
    path: "productos", 
    loadComponent: () => import("./pages/productos/productos.component").then(m => m.ProductosComponent) 
  },

  // Cómo funciona
  { 
    path: "como", 
    loadComponent: () => import("./pages/como/como.page").then(m => m.ComoPage) 
  },

  // Login
  { 
    path: "login", 
    loadComponent: () => import("./pages/login/login.page").then(m => m.LoginPage) 
  },

  // Registro principal
  { 
    path: "registro", 
    loadComponent: () => import("./pages/registro/registro.page").then(m => m.RegistroPage) 
  },

  // Alias /register → /registro (por si algún link viejo apunta ahí)
  {
    path: "register",
    redirectTo: "registro",
    pathMatch: "full"
  },

  // Intercambios en proceso
  {
    path: "intercambios",
    loadComponent: () =>
      import("./pages/intercambios/intercambios-en-proceso.component").then(
        (m) => m.IntercambiosEnProcesoComponent,
      ),
  },

  // Chat de un intercambio
  {
    path: "intercambios/:id",
    loadComponent: () =>
      import("./pages/intercambios/intercambio-chat.component").then(
        (m) => m.IntercambioChatComponent,
      ),
  },

  // ✅ NUEVA RUTA: Historial de intercambios
  {
    path: "historial-intercambios",
    loadComponent: () =>
      import("./pages/intercambios/historial-intercambios.component").then(
        (m) => m.HistorialIntercambiosComponent,
      ),
  },

  // Solicitudes
  { 
    path: "solicitudes", 
    loadComponent: () => import("./solicitudes/solicitudes.component").then(m => m.SolicitudesComponent) 
  },

  // Cualquier otra ruta → inicio
  { 
    path: "**", 
    redirectTo: "" 
  }
];

export const appConfig: ApplicationConfig = {
  providers: [ provideRouter(routes), provideHttpClient() ]
};


