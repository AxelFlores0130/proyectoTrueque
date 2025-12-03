import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthService {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Login (usa campo "contrasena" como en tu BD)
  login(payload: { correo: string; contrasena: string }): Observable<any> {
    return this.http.post<any>(`${this.API}/auth/login`, payload).pipe(
      tap(res => {
        if (res?.token) {
          this.setSession(res.token, res.usuario);
        }
      })
    );
  }

  // Registro
  register(
    nombre: string,
    correo: string,
    telefono: string,
    contrasena: string,
    rol: "cliente" | "administrador" = "cliente"
  ) {
    const body = {
      nombre_completo: nombre,
      correo: (correo || "").toLowerCase(),
      telefono: telefono || "",
      contrasena,
      rol,
      verificado: 1
    };
    return this.http.post(`${this.API}/auth/register`, body);
  }

  // Sesión
  setSession(token: string, usuario: any) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(usuario));
  }
  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  getToken(): string | null { return localStorage.getItem("token"); }
  getUser(): any {
    const raw = localStorage.getItem("user");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  isAuth(): boolean { return !!this.getToken(); }
  logout() { this.clearSession(); }

  // Encabezados privados (Bearer)
  authHeaders(): HttpHeaders {
    let h = new HttpHeaders({ "ngsw-bypass": "true" });
    const t = this.getToken();
    if (t) h = h.set("Authorization", `Bearer ${t}`);
    return h;
  }
}
