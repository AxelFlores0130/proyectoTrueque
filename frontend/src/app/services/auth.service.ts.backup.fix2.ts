import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  telefono: string;
  rol: "cliente" | "administrador";
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private baseUrl = "http://127.0.0.1:5000/api";

  constructor(private http: HttpClient) {}

  // ==== PETICIONES HTTP BÁSICAS ====

  login(correo: string, contrasena: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, {
      correo,
      contrasena,
    });
  }

  register(
    nombre_completo: string,
    correo: string,
    telefono: string,
    contrasena: string,
    rol: "cliente" | "administrador" = "cliente"
  ): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/register`, {
      nombre_completo,
      correo,
      telefono,
      contrasena,
      rol,
    });
  }

  // ==== SESIÓN EN LOCALSTORAGE ====

  setSession(token: string, usuario: Usuario): void {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  getUser(): Usuario | null {
    const raw = localStorage.getItem("usuario");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }

  isAuth(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  }

  /**
   * Headers de autenticación para endpoints protegidos.
   * Se usa en productos.service, solicitudes.service, etc.
   */
  authHeaders(): { [header: string]: string } {
    const token = this.getToken();
    const headers: { [header: string]: string } = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }
}
