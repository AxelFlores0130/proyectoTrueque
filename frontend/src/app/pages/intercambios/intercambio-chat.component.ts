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
import { environment } from "../../../environments/environment";  // 👈 OJO: 3 puntos

@Component({
  selector: "app-intercambio-chat",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./intercambio-chat.component.html",
  styleUrls: ["./intercambio-chat.component.css"],
})
export class IntercambioChatComponent implements OnInit, OnDestroy {
  id_intercambio!: number;
  intercambio?: IntercambioDetalle;
  mensajes: MensajeIntercambio[] = [];
  nuevoMensaje = "";
  idUsuarioActual!: number;

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
  }

  ngOnDestroy(): void {
    this.chatService.salirIntercambio(this.id_intercambio);
    this.subMensajes?.unsubscribe();
  }

  cargarIntercambio(): void {
    this.intercambiosService.obtenerDetalle(this.id_intercambio).subscribe({
      next: (res) => (this.intercambio = res),
    });
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
        alert("Intercambio cancelado");
        this.router.navigate(["/intercambios"]);
      },
    });
  }

  finalizar(): void {
    if (!confirm("¿Confirmas que el intercambio se realizó correctamente?")) return;
    this.intercambiosService.finalizar(this.id_intercambio).subscribe({
      next: () => {
        alert(
          "Tu estado fue actualizado. Cuando ambos confirmen, el intercambio se dará por finalizado."
        );
        this.cargarIntercambio();
      },
    });
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
}


