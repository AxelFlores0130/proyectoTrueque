import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  IntercambiosService,
  IntercambioDetalle,
  MensajeIntercambio,
} from "../../services/intercambios.service";
import { ChatService } from "../../services/chat.service";
import { AuthService } from "../../services/auth.service";
import { Subscription } from "rxjs";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-intercambio-chat",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./intercambio-chat.component.html",
  styleUrls: ["./intercambio-chat.component.css"],
})
export class IntercambioChatComponent implements OnInit, OnDestroy {
  id_intercambio!: number;
  // puedo recibir campos extra del backend sin problema
  intercambio?: IntercambioDetalle | any;
  mensajes: MensajeIntercambio[] = [];
  nuevoMensaje = "";
  idUsuarioActual!: number;

  // estado del flujo de confirmación
  estadoIntercambio: "pendiente" | "aceptado" | "cancelado" | string = "pendiente";
  yaConfirmeYo = false;
  confirmoOtro = false;

  // overlays
  mostrandoEsperando = false;
  mostrandoExito = false;
  mostrandoCancelado = false;
  // (si más adelante usas penalización por socket, aquí añades otra bandera)

  // contador
  deadline: Date | null = null;
  contador = "15:00";
  private contadorIntervalId: any = null;

  private subMensajes?: Subscription;

  // Base del backend
  private API = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private intercambiosService: IntercambiosService,
    private chatService: ChatService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.id_intercambio = Number(this.route.snapshot.paramMap.get("id"));
    this.idUsuarioActual = this.auth.getUserId();

    this.cargarIntercambio();
    this.cargarMensajes();

    this.chatService.unirseIntercambio(this.id_intercambio);

    this.subMensajes = this.chatService.onMensaje().subscribe((msg) => {
      if (msg.id_intercambio === this.id_intercambio) {
        this.mensajes.push(msg);
        setTimeout(() => this.scrollAbajo(), 50);
      }
    });

    // opcional: cada cierto tiempo refrescamos el estado por si cambió en el otro usuario
    setInterval(() => {
      this.cargarIntercambio(true);
    }, 10000); // cada 10 segundos
  }

  ngOnDestroy(): void {
    this.chatService.salirIntercambio(this.id_intercambio);
    this.subMensajes?.unsubscribe();
    this.detenerContador();
  }

  cargarIntercambio(silencioso = false): void {
    this.intercambiosService.obtenerDetalle(this.id_intercambio).subscribe({
      next: (res) => {
        this.intercambio = res;
        this.actualizarEstadoDesdeDetalle(res as any);
        if (!silencioso) {
          setTimeout(() => this.scrollAbajo(), 100);
        }
      },
    });
  }

  private actualizarEstadoDesdeDetalle(detalle: any): void {
    if (!detalle) return;

    this.estadoIntercambio = detalle.estado || "pendiente";

    const soyOfertante = !!detalle.yo_soy_ofertante;
    const miEstado = soyOfertante ? detalle.estado_solicitante : detalle.estado_receptor;
    const otroEstado = soyOfertante ? detalle.estado_receptor : detalle.estado_solicitante;

    this.yaConfirmeYo = miEstado === "aceptado";
    this.confirmoOtro = otroEstado === "aceptado";

    // limpiar overlays
    this.mostrandoEsperando = false;
    this.mostrandoExito = false;
    this.mostrandoCancelado = false;

    if (this.estadoIntercambio === "cancelado") {
      // alguien canceló → mostrar aviso y luego redirigir
      this.mostrandoCancelado = true;
      return;
    }

    if (this.estadoIntercambio === "aceptado" && this.yaConfirmeYo && this.confirmoOtro) {
      // ambos confirmaron → éxito total
      this.mostrandoExito = true;
      this.detenerContador();
    } else if (this.yaConfirmeYo && !this.confirmoOtro) {
      // yo ya confirmé, el otro no → pantalla de espera
      this.mostrandoEsperando = true;
    }

    // manejar fecha límite para el contador
    if (detalle.fecha_limite_confirmacion) {
      this.deadline = new Date(detalle.fecha_limite_confirmacion);
      this.iniciarContador();
    } else {
      this.deadline = null;
      this.detenerContador();
    }
  }

  cargarMensajes(): void {
    this.intercambiosService.listarMensajes(this.id_intercambio).subscribe({
      next: (res) => {
        this.mensajes = res;
        setTimeout(() => this.scrollAbajo(), 100);
      },
    });
  }

  enviarTexto(): void {
    const texto = this.nuevoMensaje.trim();
    if (!texto) return;

    this.chatService.enviarTexto(this.id_intercambio, texto);
    this.nuevoMensaje = "";
  }

  enviarUbicacion(): void {
    if (!navigator.geolocation) {
      alert("La geolocalización no está disponible en este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.chatService.enviarUbicacion(this.id_intercambio, lat, lng);
      },
      () => alert("No se pudo obtener la ubicación.")
    );
  }

  esMio(m: MensajeIntercambio): boolean {
    return m.id_usuario === this.idUsuarioActual;
  }

  cancelar(): void {
    if (!confirm("¿Seguro que quieres cancelar este intercambio?")) return;
    this.intercambiosService.cancelar(this.id_intercambio).subscribe({
      next: () => {
        // mostramos overlay de cancelado y luego redirigimos
        this.mostrandoCancelado = true;
        setTimeout(() => this.router.navigate(["/intercambios"]), 1500);
      },
    });
  }

  finalizar(): void {
    if (!confirm("¿Confirmas que el intercambio se realizó correctamente?")) return;
    this.intercambiosService.finalizar(this.id_intercambio).subscribe({
      next: (data: any) => {
        // el backend ya nos regresa el detalle actualizado
        this.intercambio = data;
        this.actualizarEstadoDesdeDetalle(data);
      },
    });
  }

  irATienda(): void {
    this.router.navigate(["/"]);
  }

  scrollAbajo(): void {
    const contenedor = document.getElementById("chat-scroll");
    if (contenedor) contenedor.scrollTop = contenedor.scrollHeight;
  }

  abrirMapa(m: MensajeIntercambio): void {
    if (m.lat == null || m.lng == null) return;
    const url = `https://www.google.com/maps?q=${m.lat},${m.lng}`;
    window.open(url, "_blank");
  }

  volver(): void {
    this.router.navigate(["/intercambios"]);
  }

  // --------- IMÁGENES: igual que en productos / solicitudes ----------
  resolverImagen(url: string | null | undefined): string {
    if (!url) {
      return "assets/img/placeholder-producto.png";
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const baseBackend = this.API.replace("/api", "");

    if (!url.startsWith("/")) {
      url = "/" + url;
    }

    return baseBackend + url;
  }

  // --------- CONTADOR 15 MIN ---------
  private iniciarContador(): void {
    if (!this.deadline) return;
    this.detenerContador();
    this.actualizarContador();
    this.contadorIntervalId = setInterval(() => this.actualizarContador(), 1000);
  }

  private detenerContador(): void {
    if (this.contadorIntervalId) {
      clearInterval(this.contadorIntervalId);
      this.contadorIntervalId = null;
    }
  }

  private actualizarContador(): void {
    if (!this.deadline) return;

    const ahora = Date.now();
    const fin = this.deadline.getTime();
    const diff = fin - ahora;

    if (diff <= 0) {
      this.contador = "00:00";
      this.detenerContador();
      return;
    }

    const totalSeg = Math.floor(diff / 1000);
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    const mm = min.toString().padStart(2, "0");
    const ss = seg.toString().padStart(2, "0");
    this.contador = `${mm}:${ss}`;
  }
}



