import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { Observable, Subject } from "rxjs";
import { MensajeIntercambio } from "./intercambios.service";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";   // 👈 IMPORTANTE

@Injectable({ providedIn: "root" })
export class ChatService {
  private socket?: Socket;
  private mensajes$ = new Subject<MensajeIntercambio>();

  // 👇 Base del backend sin "/api" (funciona en local y en producción)
  private socketUrl = environment.apiUrl.replace("/api", "");

  constructor(private auth: AuthService) {}

  private ensureSocket(): void {
    if (this.socket) return;

    const token = this.auth.getToken(); // desde tu AuthService

    this.socket = io(this.socketUrl, {
      transports: ["websocket"],
      query: { token },
      // Si en algún momento cambias el path de socket.io en el backend,
      // aquí podrías agregar: path: "/socket.io"
    });

    this.socket.on("mensaje_recibido", (msg: MensajeIntercambio) => {
      this.mensajes$.next(msg);
    });
  }

  unirseIntercambio(id_intercambio: number): void {
    this.ensureSocket();
    const token = this.auth.getToken();
    this.socket?.emit("join_intercambio", { id_intercambio, token });
  }

  salirIntercambio(id_intercambio: number): void {
    this.socket?.emit("leave_intercambio", { id_intercambio });
  }

  enviarTexto(id_intercambio: number, contenido: string): void {
    const token = this.auth.getToken();
    this.socket?.emit("nuevo_mensaje", {
      token,
      id_intercambio,
      tipo: "texto",
      contenido,
    });
  }

  enviarUbicacion(id_intercambio: number, lat: number, lng: number): void {
    const token = this.auth.getToken();
    this.socket?.emit("nuevo_mensaje", {
      token,
      id_intercambio,
      tipo: "ubicacion",
      lat,
      lng,
    });
  }

  onMensaje(): Observable<MensajeIntercambio> {
    return this.mensajes$.asObservable();
  }

  desconectar(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}

