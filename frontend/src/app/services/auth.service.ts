import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { tap, map } from "rxjs/operators";
import { Observable } from "rxjs";
import { Router } from "@angular/router";

export interface UsuarioLogueado {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: "cliente" | "administrador" | string;
  verificado: number;
  fecha_registro?: string | null;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private API = environment.apiUrl; // ej: https://tu-backend.railway.app/api

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // =======================
  // LOGIN NORMAL (correo + contraseña)
  // =======================
  login(payload: { correo: string; contrasena: string }): Observable<void> {
    const body = {
      correo: (payload.correo || "").toLowerCase(),
      contrasena: payload.contrasena
    };

    return this.http.post<any>(`${this.API}/auth/login`, body).pipe(
      tap(res => {
        const token =
          res?.token ||
          res?.access_token ||
          res?.jwt ||
          null;

        const usuario: UsuarioLogueado =
          res?.usuario ||
          res?.user ||
          res?.datos ||
          null;

        if (token && usuario) {
          this.setSession(token, usuario);

          // 👇 detectar rol y redirigir
          const rol = (usuario.rol || "").toLowerCase();
          if (rol === "administrador") {
            this.router.navigate(["/admin"]);
          } else {
            // ruta normal de cliente (ajusta si tu ruta es otra)
            this.router.navigate(["/productos"]);
          }
        } else {
          console.warn("Respuesta de login sin token/usuario esperado:", res);
        }
      }),
      map(() => void 0)
    );
  }

  // =======================
  // REGISTRO
  // =======================
  register(
    nombre: string,
    correo: string,
    telefono: string,
    contrasena: string,
    _rol: "cliente" | "administrador" = "cliente" // se ignora, el backend fuerza "cliente"
  ) {
    const body = {
      nombre_completo: nombre.trim(),
      correo: (correo || "").toLowerCase().trim(),
      telefono: (telefono || "").trim(),
      contrasena
      // rol y verificado LOS DEFINE EL BACKEND
    };

    return this.http.post(`${this.API}/auth/register`, body);
  }

  // =======================
  // GOOGLE AUTH (redirección)
  // =======================

  getGoogleAuthUrl(): string {
    return `${this.API}/auth/google/login`;
  }

  googleLogin(credential: string): Observable<void> {
    return this.http.post<any>(`${this.API}/auth/google`, { credential }).pipe(
      tap(res => {
        const token =
          res?.token ||
          res?.access_token ||
          res?.jwt ||
          null;

        const usuario: UsuarioLogueado =
          res?.usuario ||
          res?.user ||
          res?.datos ||
          null;

        if (token && usuario) {
          this.setSession(token, usuario);

          const rol = (usuario.rol || "").toLowerCase();
          if (rol === "administrador") {
            this.router.navigate(["/admin"]);
          } else {
            this.router.navigate(["/productos"]);
          }
        } else {
          console.warn("Respuesta de login Google sin token/usuario esperado:", res);
        }
      }),
      map(() => void 0)
    );
  }

  // =======================
  // MANEJO DE SESIÓN
  // =======================
  setSession(token: string, usuario: UsuarioLogueado) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(usuario));
  }

  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  getUser(): UsuarioLogueado | null {
    const raw = localStorage.getItem("user");
    try {
      return raw ? (JSON.parse(raw) as UsuarioLogueado) : null;
    } catch {
      return null;
    }
  }

  getUserId(): number | null {
    const user = this.getUser();
    if (!user) return null;
    return (
      user.id_usuario ??  // lo más probable
      (user as any).id ?? // fallback
      null
    );
  }

  isAuth(): boolean {
    return !!this.getToken();
  }

  // 👇 NUEVO: para guards y UI
  isAdmin(): boolean {
    const user = this.getUser();
    return (user?.rol || "").toLowerCase() === "administrador";
  }

  logout() {
    this.clearSession();
    this.router.navigate(["/login"]);
  }

  authHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ "ngsw-bypass": "true" });
    const token = this.getToken();
    if (token) {
      headers = headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }
}



