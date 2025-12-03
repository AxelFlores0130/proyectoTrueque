import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { Producto } from "./productos.service";

export interface SolicitudCard {
  id_solicitud: number;
  estado: "pendiente" | "aceptado" | "rechazado" | "cancelado"; // 👈 mejor tipado
  mensaje: string;
  creado: string;
  soy_solicitante: boolean;
  diferencia_propuesta?: number | null;
  producto_objetivo: Producto;
  producto_ofrece?: Producto | null;
  solicitante: {
    id_usuario: number;
    nombre: string;
  };
  receptor?: {
    id_usuario: number;
    nombre: string;
  } | null;
}

@Injectable({ providedIn: "root" })
export class SolicitudesService {
  private baseUrl = "http://127.0.0.1:5000/api";

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  crear(payload: {
    id_producto_objetivo: number;
    id_producto_ofrece?: number;
    mensaje?: string;
    diferencia_propuesta?: number | null;
  }): Observable<SolicitudCard> {
    return this.http.post<SolicitudCard>(
      `${this.baseUrl}/solicitudes`,
      payload,
      {
        headers: this.auth.authHeaders(), // 👈 mantenemos JWT
      }
    );
  }

  // Recibidas (sólo pendientes, por el backend que ya ajustaste)
  recibidas(): Observable<SolicitudCard[]> {
    return this.http.get<SolicitudCard[]>(
      `${this.baseUrl}/solicitudes/recibidas`,
      {
        headers: this.auth.authHeaders(),
      }
    );
  }

  // Enviadas (todas, separaremos por estado en el componente)
  enviadas(): Observable<SolicitudCard[]> {
    return this.http.get<SolicitudCard[]>(
      `${this.baseUrl}/solicitudes/enviadas`,
      {
        headers: this.auth.authHeaders(),
      }
    );
  }

  aceptar(id: number): Observable<SolicitudCard> {
    return this.http.put<SolicitudCard>(
      `${this.baseUrl}/solicitudes/${id}/aceptar`,
      {},
      {
        headers: this.auth.authHeaders(),
      }
    );
  }

  rechazar(id: number): Observable<SolicitudCard> {
    return this.http.put<SolicitudCard>(
      `${this.baseUrl}/solicitudes/${id}/rechazar`,
      {},
      {
        headers: this.auth.authHeaders(),
      }
    );
  }

  cancelar(id: number): Observable<SolicitudCard> {
    return this.http.put<SolicitudCard>(
      `${this.baseUrl}/solicitudes/${id}/cancelar`,
      {},
      {
        headers: this.auth.authHeaders(),
      }
    );
  }

    reofertar(
    id: number,
    payload: {
      id_producto_ofrece?: number;
      mensaje?: string;
      diferencia_propuesta?: number | null;
    }
  ): Observable<SolicitudCard> {
    return this.http.put<SolicitudCard>(
      `${this.baseUrl}/solicitudes/${id}/reofertar`,
      payload,
      {
        headers: this.auth.authHeaders(),
      }
    );
  }

}


