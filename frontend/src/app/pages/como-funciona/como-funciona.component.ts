import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  selector: "app-como-funciona",
  imports: [CommonModule, RouterLink],
  template: `
    <section class="how">
      <h1>¿Cómo funciona Trueque?</h1>
      <ol>
        <li>Publica lo que ya no usas con fotos y detalles.</li>
        <li>Explora y solicita intercambios a otros usuarios.</li>
        <li>Acuerden un punto de encuentro seguro y confirmen ambos el intercambio.</li>
      </ol>
      <a *ngIf="!logged()" routerLink="/registro" class="cta">Empezar ahora</a>
    </section>
  `,
  styles:[`
    .how{background:#f8fbff;border:1px solid #e5e7eb;border-radius:16px;padding:20px}
    .cta{display:inline-block;margin-top:12px;padding:10px 16px;background:#10b3a5;color:#fff;border-radius:9999px;text-decoration:none}
  `]
})
export class ComoFuncionaComponent {
  private auth = inject(AuthService);
  logged = () => !!this.auth.getToken();
}
