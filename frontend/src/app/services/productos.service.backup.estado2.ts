import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Producto {
  id_producto: number;
  id_usuario: number;
  id_categoria: number;
  categoria_nombre?: string;
  titulo: string;
  descripcion: string;
  valor_estimado: number;
  imagen_url: string | null;
  ubicacion: string | null;
  estado: 'disponible' | 'baja' | 'intercambiado';
  es_tuyo?: boolean;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private baseUrl = 'http://127.0.0.1:5000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // =========================
  // LISTADO DE PRODUCTOS
  // =========================
  listar(opts?: {
    q?: string;
    id_categoria?: number;
    solo_mios?: boolean;
    solo_otros?: boolean;
    incluir_bajas?: boolean;
  }): Observable<Producto[]> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.id_categoria) params = params.set('id_categoria', opts.id_categoria);
    if (opts?.solo_mios) params = params.set('solo_mios', '1');
    if (opts?.solo_otros) params = params.set('solo_otros', '1');
    if (opts?.incluir_bajas) params = params.set('incluir_bajas', '1');

    return this.http.get<Producto[]>(`${this.baseUrl}/productos`, {
      params,
      headers: this.auth.authHeaders(),
    });
  }

  // =========================
  // CATEGORÍAS (para this.api.categorias())
  // =========================
  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`, {
      headers: this.auth.authHeaders(),
    });
  }

  // =========================
  // CREAR / EDITAR PRODUCTO
  // =========================
  crear(data: {
    id_categoria: number;
    titulo: string;
    descripcion: string;
    valor_estimado: number;
    ubicacion: string;
    imagen_url?: string | null;
  }): Observable<Producto> {
    return this.http.post<Producto>(`${this.baseUrl}/productos`, data, {
      headers: this.auth.authHeaders(),
    });
  }

  actualizar(id_producto: number, data: Partial<{
    id_categoria: number;
    titulo: string;
    descripcion: string;
    valor_estimado: number;
    ubicacion: string;
    imagen_url: string | null;
  }>): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id_producto}`, data, {
      headers: this.auth.authHeaders(),
    });
  }

  // =========================
  // CAMBIAR ESTADO (baja/alta)
  // =========================
  cambiarEstado(id_producto: number, estado: 'disponible' | 'baja'): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id_producto}/estado`, { estado }, {
      headers: this.auth.authHeaders(),
    });
  }

  // Alias para compatibilidad con el componente viejo:
  // this.api.actualizarEstado(x.id_producto, estado)
  actualizarEstado(id_producto: number, estado: 'disponible' | 'baja'): Observable<Producto> {
    return this.cambiarEstado(id_producto, estado);
  }

  // =========================
  // SUBIR IMAGEN
  // =========================
  upload(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<{ url: string }>(`${this.baseUrl}/upload`, formData, {
      headers: this.auth.authHeaders(),
    });
  }
}
