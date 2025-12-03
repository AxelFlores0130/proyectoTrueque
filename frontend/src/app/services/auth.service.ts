import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AuthService {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // LOGIN: recibe un solo objeto { correo, contrasena }
  login(payload: { correo: string; contrasena: string }): Observable<any> {
    const body = {
      correo: (payload.correo || "").toLowerCase(),
      contrasena: payload.contrasena
    };

    return this.http.post<any>(`${this.API}/auth/login`, body).pipe(
      tap(res => {
        // Soportar varias formas de respuesta por si acaso
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
          console.warn('Respuesta de login sin token/usuario esperado:', res);
        }
      })
    );
  }

  // REGISTRO
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

  // SESIÓN
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
    // (seguramente es id_usuario)
    return (
      user.id_usuario ??  // lo más probable
      user.id ??          // por si viene como id
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

