import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import {
  IntercambiosService,
  IntercambioCard,
} from "../../services/intercambios.service";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-historial-intercambios",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./historial-intercambios.component.html",
  styleUrls: ["./historial-intercambios.component.css"],
})
export class HistorialIntercambiosComponent implements OnInit {
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
    this.intercambiosService.listarHistorial().subscribe({
      next: (res) => {
        this.intercambios = res;
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error al cargar historial de intercambios", err);
        this.cargando = false;
      },
    });
  }

  verChat(i: IntercambioCard): void {
    // permitir ver el chat histórico si quieres
    this.router.navigate(["/intercambios", i.id_intercambio]);
  }

  textoEstado(i: IntercambioCard): string {
    // aquí todos son aceptados, pero podemos personalizar el mensaje
    return "Intercambio realizado correctamente";
  }

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
