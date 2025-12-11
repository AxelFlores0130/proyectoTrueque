import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Categoria } from './productos.service';

export interface UsuarioAdmin {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  telefono: string;
  fecha_registro: string | null;
  verificado: number;
  rol: string;
}

export interface HistorialIntercambioItem {
  id_intercambio: number;
  estado_actual: string;
  creado: string | null;
  producto_objetivo: string | null;
  producto_ofrece: string | null;
  historial: {
    id_historial: number;
    estado: string;
    fecha_cambio: string | null;
    comentario: string | null;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // ===== USUARIOS =====

  getUsuarios(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(`${this.baseUrl}/usuarios`, {
      headers: this.auth.authHeaders()
    });
  }

  actualizarVerificado(
    id_usuario: number,
    verificado: boolean
  ): Observable<{ id_usuario: number; verificado: number }> {
    return this.http.patch<{ id_usuario: number; verificado: number }>(
      `${this.baseUrl}/usuarios/${id_usuario}/verificado`,
      { verificado },
      { headers: this.auth.authHeaders() }
    );
  }

  getHistorialIntercambios(
    id_usuario: number
  ): Observable<HistorialIntercambioItem[]> {
    return this.http.get<HistorialIntercambioItem[]>(
      `${this.baseUrl}/usuarios/${id_usuario}/historial`,
      { headers: this.auth.authHeaders() }
    );
  }

  // ===== CATEGORÍAS =====

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`, {
      headers: this.auth.authHeaders()
    });
  }

  crearCategoria(
    nombre: string,
    descripcion?: string
  ): Observable<Categoria> {
    return this.http.post<Categoria>(
      `${this.baseUrl}/categorias`,
      { nombre, descripcion: descripcion ?? null },
      { headers: this.auth.authHeaders() }
    );
  }
}

