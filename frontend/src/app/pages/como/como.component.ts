import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  selector: "app-como",
  imports: [CommonModule, RouterLink],
  template: `
    <section class="wrap">
      <h1>¿Cómo funciona Trueque?</h1>
      <ol class="steps">
        <li><strong>Regístrate.</strong> Creamos un entorno confiable para todos.</li>
        <li><strong>Publica tus productos.</strong> Sube fotos, elige categoría y añade valor estimado.</li>
        <li><strong>Explora y haz match.</strong> Encuentra productos que te interesen y envía una solicitud.</li>
        <li><strong>Acuerden lugar y hora.</strong> Usa el chat de la solicitud para definir el punto de encuentro.</li>
        <li><strong>Confirma el intercambio.</strong> Ambos confirman y el sistema registra la operación.</li>
      </ol>

      <div class="cta">
        <a class="btn primary" routerLink="/productos">Ver productos</a>
        <a *ngIf="!auth.isAuth()" class="btn ghost" routerLink="/registro">Empezar ahora</a>
      </div>
    </section>
  `,
  styles:[`
    .wrap{max-width:900px;margin:0 auto;padding:16px}
    h1{font-size:clamp(26px,4vw,38px)}
    .steps{display:grid;gap:10px;margin:16px 0 0}
    .cta{display:flex;gap:12px;margin-top:18px}
    .btn{padding:10px 14px;border-radius:9999px;text-decoration:none}
    .btn.primary{background:#10b3a5;color:#fff}
    .btn.ghost{border:1px solid #0f172a30;color:#0f172a}
  `]
})
export class ComoComponent { auth = inject(AuthService); }
