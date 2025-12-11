import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import {
  IntercambiosService,
  IntercambioCard,
} from "../../services/intercambios.service";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-intercambios-en-proceso",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./intercambios-en-proceso.component.html",
  styleUrls: ["./intercambios-en-proceso.component.css"],
})
export class IntercambiosEnProcesoComponent implements OnInit {
  intercambios: IntercambioCard[] = [];
  cargando = false;

  constructor(
    private intercambiosService: IntercambiosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.intercambiosService.listarEnProceso().subscribe({
      next: (res) => {
        this.intercambios = res;
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error al cargar intercambios en proceso", err);
        this.cargando = false;
      },
    });
  }

  verChat(i: IntercambioCard): void {
    this.router.navigate(["/intercambios", i.id_intercambio]);
  }

  cancelar(i: IntercambioCard): void {
    if (!confirm("¿Seguro que quieres cancelar este intercambio?")) return;
    this.intercambiosService.cancelar(i.id_intercambio).subscribe({
      next: () => this.cargar(),
    });
  }

  // Texto bonito del estado, usando los flags de cada lado
  textoEstado(i: IntercambioCard): string {
    if (i.estado === "cancelado") {
      return "Cancelado";
    }

    const yoConfirme = i.soy_ofertante
      ? i.estado_solicitante === "aceptado"
      : i.estado_receptor === "aceptado";

    const otroConfirme = i.soy_ofertante
      ? i.estado_receptor === "aceptado"
      : i.estado_solicitante === "aceptado";

    if (i.estado === "aceptado" && yoConfirme && otroConfirme) {
      return "Intercambio completado";
    }

    if (yoConfirme && !otroConfirme) {
      return "Ya confirmaste, esperando al otro usuario";
    }

    if (!yoConfirme && otroConfirme) {
      return "El otro usuario ya confirmó, falta tu confirmación";
    }

    return "En proceso";
  }

  // Para aplicar estilos distintos al estado
  claseEstado(i: IntercambioCard): string {
    if (i.estado === "cancelado") return "estado-cancelado";

    const yoConfirme = i.soy_ofertante
      ? i.estado_solicitante === "aceptado"
      : i.estado_receptor === "aceptado";

    const otroConfirme = i.soy_ofertante
      ? i.estado_receptor === "aceptado"
      : i.estado_solicitante === "aceptado";

    if (i.estado === "aceptado" && yoConfirme && otroConfirme) {
      return "estado-completado";
    }

    if (yoConfirme && !otroConfirme) {
      return "estado-esperando-otro";
    }

    if (!yoConfirme && otroConfirme) {
      return "estado-falta-tu-confirmacion";
    }

    return "estado-en-proceso";
  }

  // Igual que en productos / solicitudes
  resolverImagen(url: string | null | undefined): string {
    if (!url) {
      return "assets/img/placeholder-producto.png";
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const baseBackend = environment.apiUrl.replace("/api", "");

    if (!url.startsWith("/")) {
      url = "/" + url;
    }

    return baseBackend + url;
  }
}


