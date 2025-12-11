import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";  // 👈 NUEVO

export interface IntercambioCard {
  id_intercambio: number;
  estado: string;
  estado_solicitante: string;
  estado_receptor: string;
  diferencia_monetaria: string;
  soy_ofertante: boolean;
  yo: { id_usuario: number; nombre: string; avatar_url?: string | null };
  otro: { id_usuario: number; nombre: string; avatar_url?: string | null };
  producto_ofrece?: {
    id_producto: number;
    titulo: string;
    imagen?: string | null;      // 👈 aquí luego usaremos resolverImagen(...)
    precio?: number | null;
  } | null;
  producto_objetivo: {
    id_producto: number;
    titulo: string;
    imagen?: string | null;
    precio?: number | null;
  };
  fecha_solicitud?: string | null;
}

export interface IntercambioDetalle extends IntercambioCard {
  usuario_ofrece: IntercambioCard["yo"];
  usuario_recibe: IntercambioCard["yo"];
  yo_soy_ofertante: boolean;
}

export interface MensajeIntercambio {
  id_mensaje: number;
  id_intercambio: number;
  id_usuario: number;
  tipo: "texto" | "ubicacion";
  contenido?: string | null;
  lat?: number | null;
  lng?: number | null;
  creado: string;
}

@Injectable({ providedIn: "root" })
export class IntercambiosService {
  // ❌ ANTES:
  // private baseUrl = "http://127.0.0.1:5000/api/intercambios";

  // ✅ AHORA: usar la misma base del backend que en el resto
  private baseUrl = `${environment.apiUrl}/intercambios`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  listarEnProceso(): Observable<IntercambioCard[]> {
    return this.http.get<IntercambioCard[]>(
      `${this.baseUrl}/en_proceso`,
      { headers: this.auth.authHeaders() }
    );
  }

  obtenerDetalle(id_intercambio: number): Observable<IntercambioDetalle> {
    return this.http.get<IntercambioDetalle>(
      `${this.baseUrl}/${id_intercambio}`,
      { headers: this.auth.authHeaders() }
    );
  }

  cancelar(id_intercambio: number): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${id_intercambio}/cancelar`,
      {},
      { headers: this.auth.authHeaders() }
    );
  }

  finalizar(id_intercambio: number): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${id_intercambio}/finalizar`,
      {},
      { headers: this.auth.authHeaders() }
    );
  }

  listarMensajes(id_intercambio: number): Observable<MensajeIntercambio[]> {
    return this.http.get<MensajeIntercambio[]>(
      `${this.baseUrl}/${id_intercambio}/mensajes`,
      { headers: this.auth.authHeaders() }
    );
  }
}


