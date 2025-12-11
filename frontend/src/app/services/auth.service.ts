import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthService {
  private API = environment.apiUrl; // ej: https://tu-backend.railway.app/api

  constructor(private http: HttpClient) {}

  // =======================
  // LOGIN NORMAL (correo + contraseña)
  // =======================
  login(payload: { correo: string; contrasena: string }): Observable<any> {
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

        const usuario =
          res?.usuario ||
          res?.user ||
          res?.datos ||
          null;

        if (token && usuario) {
          this.setSession(token, usuario);
        } else {
          console.warn("Respuesta de login sin token/usuario esperado:", res);
        }
      })
    );
  }

  // =======================
  // REGISTRO
  // =======================
  // ⚠️ Aunque recibimos "rol" desde algunos componentes viejos,
  //    aquí YA NO lo mandamos al backend.
  //    Tampoco mandamos "verificado": eso lo pone el backend.
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
      // rol y verificado LOS DEFINE EL BACKEND:
      //  - rol = "cliente"
      //  - verificado = 1
      //  - fecha_registro = NOW()
    };

    return this.http.post(`${this.API}/auth/register`, body);
  }

  // =======================
  // GOOGLE AUTH (redirección)
  // =======================

  /**
   * URL del backend que inicia el flujo de Google (OAuth / GIS redirect).
   * En el backend tendrías algo como:
   *   GET /api/auth/google/login
   * que redirige a Google.
   */
  getGoogleAuthUrl(): string {
    return `${this.API}/auth/google/login`;
  }

  /**
   * Si usas Google Identity Services (botón que te da un "credential" JWT),
   * puedes mandar ese credential a tu backend en /auth/google.
   * Ejemplo de uso en el front:
   *   this.auth.googleLogin(credential).subscribe(...)
   */
  googleLogin(credential: string): Observable<any> {
    return this.http.post<any>(`${this.API}/auth/google`, { credential }).pipe(
      tap(res => {
        const token =
          res?.token ||
          res?.access_token ||
          res?.jwt ||
          null;

        const usuario =
          res?.usuario ||
          res?.user ||
          res?.datos ||
          null;

        if (token && usuario) {
          this.setSession(token, usuario);
        } else {
          console.warn("Respuesta de login Google sin token/usuario esperado:", res);
        }
      })
    );
  }

  // =======================
  // MANEJO DE SESIÓN
  // =======================
  setSession(token: string, usuario: any) {
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

  getUser(): any {
    const raw = localStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getUserId(): number | null {
    const user = this.getUser();
    if (!user) return null;

    // Ajusta estos nombres según cómo venga del backend
    return (
      user.id_usuario ??  // lo más probable
      user.id ??          // fallback
      null
    );
  }

  isAuth(): boolean {
    return !!this.getToken();
  }

  logout() {
    this.clearSession();
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


