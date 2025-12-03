import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SolicitudesService, SolicitudCard } from "../../services/solicitudes.service";

@Component({
  selector: "app-solicitudes",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./solicitudes.component.html",
  styleUrls: ["./solicitudes.component.css"],
})
export class SolicitudesComponent implements OnInit {
  tab: "recibidas" | "enviadas" = "recibidas";
  recibidasList: SolicitudCard[] = [];
  enviadasList: SolicitudCard[] = [];

  constructor(private solicitudesService: SolicitudesService) {}

  ngOnInit(): void {
    this.cargarRecibidas();
  }

  cambiarTab(t: "recibidas" | "enviadas"): void {
    this.tab = t;
    if (t === "recibidas") {
      this.cargarRecibidas();
    } else {
      this.cargarEnviadas();
    }
  }

  cargarRecibidas(): void {
    this.solicitudesService.recibidas().subscribe((s) => (this.recibidasList = s));
  }

  cargarEnviadas(): void {
    this.solicitudesService.enviadas().subscribe((s) => (this.enviadasList = s));
  }

  aceptar(s: SolicitudCard): void {
    this.solicitudesService.aceptar(s.id_solicitud).subscribe(() => this.cargarRecibidas());
  }

  rechazar(s: SolicitudCard): void {
    this.solicitudesService.rechazar(s.id_solicitud).subscribe(() => this.cargarRecibidas());
  }

  cancelar(s: SolicitudCard): void {
    this.solicitudesService.cancelar(s.id_solicitud).subscribe(() => this.cargarEnviadas());
  }

  resolverImagen(url?: string | null): string | null {
    if (!url) return null;
    return url;
  }
}
