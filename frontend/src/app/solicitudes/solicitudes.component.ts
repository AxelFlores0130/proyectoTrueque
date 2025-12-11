import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import {
  SolicitudesService,
  SolicitudCard,
} from "../services/solicitudes.service"; // 👈 desde app/solicitudes -> app/services
import { environment } from "../../environments/environment"; // 👈 desde app/solicitudes -> environments

@Component({
  selector: "app-solicitudes",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./solicitudes.component.html",
  styleUrls: ["./solicitudes.component.css"],
})
export class SolicitudesComponent implements OnInit {
  loading = false;

  // base del backend (para armar URL completas de imágenes)
  private API = environment.apiUrl; // 👈

  // pestaña actual
  tab: "recibidas" | "enviadas" = "recibidas";

  // crudo
  enviadas: SolicitudCard[] = [];
  recibidasPendientes: SolicitudCard[] = [];

  // separadas por estado (enviadas)
  enviadasPendientes: SolicitudCard[] = [];
  enviadasAceptadas: SolicitudCard[] = [];
  enviadasRechazadas: SolicitudCard[] = [];
  enviadasCanceladas: SolicitudCard[] = [];

  // reoferta sobre la misma solicitud
  reOfertaAbiertaId: number | null = null;
  nuevaDiferencia: number | null = null;

  constructor(
    private solicitudesService: SolicitudesService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cambiarTab(t: "recibidas" | "enviadas"): void {
    this.tab = t;
  }

  cargarSolicitudes(): void {
    this.loading = true;

    // ENVIADAS (todas, luego filtramos por estado)
    this.solicitudesService.enviadas().subscribe({
      next: (data) => {
        this.enviadas = data;
        this.enviadasPendientes = data.filter(
          (s) => s.estado === "pendiente"
        );
        this.enviadasAceptadas = data.filter(
          (s) => s.estado === "aceptado"
        );
        this.enviadasRechazadas = data.filter(
          (s) => s.estado === "rechazado"
        );
        this.enviadasCanceladas = data.filter(
          (s) => s.estado === "cancelado"
        );
      },
      error: (err) => {
        console.error("Error cargando enviadas", err);
      },
    });

    // RECIBIDAS (backend ya devuelve solo pendientes)
    this.solicitudesService.recibidas().subscribe({
      next: (data) => {
        this.recibidasPendientes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error("Error cargando recibidas", err);
        this.loading = false;
      },
    });
  }

  // ------- acciones en recibidas -------

  aceptar(s: SolicitudCard): void {
    if (!confirm("¿Aceptar esta oferta de intercambio?")) return;

    this.solicitudesService.aceptar(s.id_solicitud).subscribe({
      next: () => {
        this.recibidasPendientes = this.recibidasPendientes.filter(
          (sol) => sol.id_solicitud !== s.id_solicitud
        );
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error("Error al aceptar solicitud", err);
      },
    });
  }

  rechazar(s: SolicitudCard): void {
    if (!confirm("¿Rechazar esta solicitud?")) return;

    this.solicitudesService.rechazar(s.id_solicitud).subscribe({
      next: () => {
        this.recibidasPendientes = this.recibidasPendientes.filter(
          (sol) => sol.id_solicitud !== s.id_solicitud
        );
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error("Error al rechazar solicitud", err);
      },
    });
  }

  // ------- acciones en enviadas -------

  cancelar(s: SolicitudCard): void {
    if (!confirm("¿Cancelar esta solicitud?")) return;

    this.solicitudesService.cancelar(s.id_solicitud).subscribe({
      next: () => {
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error("Error al cancelar solicitud", err);
      },
    });
  }

  // REOFERTA SOBRE LA MISMA FILA

  abrirReoferta(s: SolicitudCard): void {
    this.reOfertaAbiertaId = s.id_solicitud;
    this.nuevaDiferencia = s.diferencia_propuesta ?? null;
  }

  cerrarReoferta(): void {
    this.reOfertaAbiertaId = null;
    this.nuevaDiferencia = null;
  }

  enviarReoferta(s: SolicitudCard): void {
    if (this.nuevaDiferencia == null || isNaN(this.nuevaDiferencia)) {
      alert("Ingresa una diferencia económica válida");
      return;
    }

    const payload = {
      id_producto_ofrece: s.producto_ofrece
        ? s.producto_ofrece.id_producto
        : undefined,
      mensaje: s.mensaje || "Me interesa tu producto",
      diferencia_propuesta: this.nuevaDiferencia,
    };

    this.solicitudesService.reofertar(s.id_solicitud, payload).subscribe({
      next: () => {
        alert("Solicitud actualizada y reenviada.");
        this.cerrarReoferta();
        this.cargarSolicitudes();
      },
      error: (err) => {
        console.error("Error al reofertar solicitud", err);
        alert("Ocurrió un error al volver a enviar la solicitud.");
      },
    });
  }

  // ------- helpers de UI -------

  getEstadoLabel(estado: SolicitudCard["estado"]): string {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "aceptado":
        return "Aceptada";
      case "rechazado":
        return "Rechazada";
      case "cancelado":
        return "Cancelada";
      default:
        return estado;
    }
  }

  getEstadoClass(estado: SolicitudCard["estado"]): string {
    switch (estado) {
      case "pendiente":
        return "badge badge-pendiente";
      case "aceptado":
        return "badge badge-aceptado";
      case "rechazado":
        return "badge badge-rechazado";
      case "cancelado":
        return "badge badge-cancelado";
      default:
        return "badge";
    }
  }

  // ------- resolver imágenes (igual que en Productos) -------

  resolverImagen(url: string | null): string {
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


