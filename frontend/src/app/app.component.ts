import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, RouterOutlet, RouterLinkActive, Router } from "@angular/router";
import { AuthService } from "./services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">
        <span class="logo">
          <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#10b3a5"></stop>
                <stop offset="100%" stop-color="#0ea5e9"></stop>
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#g)"></rect>
            <text x="24" y="30" text-anchor="middle" font-size="20" fill="#fff" font-weight="700">T</text>
          </svg>
        </span>
        <strong>Trueque</strong>
      </a>

      <nav class="nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
        <a routerLink="/productos" routerLinkActive="active">Productos</a>
        <a routerLink="/como" routerLinkActive="active">Cómo funciona</a>

        <!-- Zona de usuario autenticado -->
        <a *ngIf="auth.isAuth()" routerLink="/solicitudes" routerLinkActive="active">
          Solicitudes
        </a>

        <!-- 👇 NUEVO: historial al lado de solicitudes -->
        <a *ngIf="auth.isAuth()" routerLink="/historial-intercambios" routerLinkActive="active">
          Historial de intercambios
        </a>

        <span class="spacer"></span>

        <!-- Botones de login / registro -->
        <a *ngIf="!auth.isAuth()" routerLink="/login">Iniciar sesión</a>
        <a *ngIf="!auth.isAuth()" routerLink="/registro" class="cta">Crear cuenta</a>

        <button *ngIf="auth.isAuth()" class="logout" (click)="logout()">
          Cerrar sesión
        </button>
      </nav>
    </header>

    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .topbar{position:sticky;top:0;display:flex;gap:16px;align-items:center;padding:12px 20px;background:#0f172a;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.12);z-index:10}
    .brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}
    .logo{display:inline-flex;align-items:center;justify-content:center}
    .nav{display:flex;gap:14px;align-items:center;width:100%}
    .nav a{color:#cbd5e1;text-decoration:none}
    .nav a.active{color:#fff;font-weight:600;border-bottom:2px solid #22d3ee}
    .spacer{flex:1 1 auto}
    .cta{background:#10b3a5;color:#fff;padding:6px 10px;border-radius:10px}
    .logout{background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:10px;cursor:pointer}
    .container{padding:20px;max-width:1100px;margin:0 auto}
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  logout(){
    const ok = window.confirm("¿Estás seguro que deseas cerrar sesión?");
    if(!ok) return;
    this.auth.logout();
    this.router.navigateByUrl("/");
  }
}

