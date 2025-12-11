import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';  // 👈 IMPORTANTE

export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Producto {
  id_producto: number;
  id_usuario: number;
  id_categoria: number;
  categoria_nombre: string | null;
  titulo: string;
  descripcion: string;
  valor_estimado: number;
  imagen_url: string | null;
  ubicacion: string | null;
  estado: 'disponible' | 'baja' | string;
  es_tuyo: boolean;
}

/** 👇 NUEVO: respuesta de la IA de moderación */
export interface ModeracionImagenResponse {
  allowed: boolean;
  category: string;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  // 👇 ahora usa environment.apiUrl
  // en dev:  http://localhost:5000/api
  // en prod: https://proyectotrueque-production-5fb5.up.railway.app/api
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

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
      headers: this.auth.authHeaders(),   // puede ir con o sin token, no afecta
    });
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

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

  actualizar(
    id_producto: number,
    data: Partial<{
      id_categoria: number;
      titulo: string;
      descripcion: string;
      valor_estimado: number;
      ubicacion: string;
      imagen_url: string | null;
    }>
  ): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/productos/${id_producto}`, data, {
      headers: this.auth.authHeaders(),
    });
  }

  actualizarEstado(
    id_producto: number,
    estado: 'disponible' | 'baja' | string
  ): Observable<Producto> {
    return this.http.put<Producto>(
      `${this.baseUrl}/productos/${id_producto}/estado`,
      { estado },
      { headers: this.auth.authHeaders() }
    );
  }

  upload(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<{ url: string }>(`${this.baseUrl}/upload`, formData, {
      headers: this.auth.authHeaders(),
    });
  }

  // 👇👇👇 NUEVO: llamar a la IA para validar la imagen del producto
  validarImagenProducto(file: File): Observable<ModeracionImagenResponse> {
    const formData = new FormData();
    // el backend espera el campo 'imagen'
    formData.append('imagen', file);

    return this.http.post<ModeracionImagenResponse>(
      `${this.baseUrl}/moderacion/imagen-producto`,
      formData,
      {
        headers: this.auth.authHeaders(),  // necesita JWT porque el endpoint tiene @jwt_required
      }
    );
  }
}


