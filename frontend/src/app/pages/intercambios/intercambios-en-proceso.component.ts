import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import {
  IntercambiosService,
  IntercambioCard,
} from "../../services/intercambios.service";

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
      error: () => (this.cargando = false),
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
}
