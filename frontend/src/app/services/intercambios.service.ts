import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";

export interface IntercambioUserRef {
  id_usuario: number;
  nombre: string;
  avatar_url?: string | null;
}

export interface IntercambioProductoRef {
  id_producto: number;
  titulo: string;
  imagen?: string | null;
  precio?: number | null;
}

// Lo que regresa /api/intercambios/en_proceso y /api/intercambios/historial
export interface IntercambioCard {
  id_intercambio: number;
  estado: string;
  estado_solicitante: string;
  estado_receptor: string;
  diferencia_monetaria: string;
  soy_ofertante: boolean;

  yo: IntercambioUserRef;
  otro: IntercambioUserRef;

  producto_ofrece?: IntercambioProductoRef | null;
  producto_objetivo: IntercambioProductoRef;

  fecha_solicitud?: string | null;
  // Para el contador / info extra si aplica
  fecha_limite_confirmacion?: string | null;
}

// Lo que regresa /api/intercambios/:id
export interface IntercambioDetalle {
  id_intercambio: number;
  estado: string;
  estado_solicitante: string;
  estado_receptor: string;
  diferencia_monetaria: string;

  yo_soy_ofertante: boolean;

  usuario_ofrece: IntercambioUserRef;
  usuario_recibe: IntercambioUserRef;

  producto_ofrece?: IntercambioProductoRef | null;
  producto_objetivo: IntercambioProductoRef;

  fecha_limite_confirmacion?: string | null;
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
  private baseUrl = `${environment.apiUrl}/intercambios`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private optsAuth() {
    return { headers: this.auth.authHeaders() };
  }

  // Intercambios aún en proceso (pendiente / esperando confirmaciones)
  listarEnProceso(): Observable<IntercambioCard[]> {
    return this.http.get<IntercambioCard[]>(
      `${this.baseUrl}/en_proceso`,
      this.optsAuth()
    );
  }

  // 👇 NUEVO: historial de intercambios ya aceptados
  listarHistorial(): Observable<IntercambioCard[]> {
    return this.http.get<IntercambioCard[]>(
      `${this.baseUrl}/historial`,
      this.optsAuth()
    );
  }

  // Detalle de un intercambio específico
  obtenerDetalle(id_intercambio: number): Observable<IntercambioDetalle> {
    return this.http.get<IntercambioDetalle>(
      `${this.baseUrl}/${id_intercambio}`,
      this.optsAuth()
    );
  }

  cancelar(id_intercambio: number): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${id_intercambio}/cancelar`,
      {},
      this.optsAuth()
    );
  }

  finalizar(id_intercambio: number): Observable<IntercambioDetalle & { msg: string }> {
    return this.http.put<IntercambioDetalle & { msg: string }>(
      `${this.baseUrl}/${id_intercambio}/finalizar`,
      {},
      this.optsAuth()
    );
  }

  listarMensajes(id_intercambio: number): Observable<MensajeIntercambio[]> {
    return this.http.get<MensajeIntercambio[]>(
      `${this.baseUrl}/${id_intercambio}/mensajes`,
      this.optsAuth()
    );
  }
}




