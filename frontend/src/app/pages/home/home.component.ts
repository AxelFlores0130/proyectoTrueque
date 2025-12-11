import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  selector: "app-home",
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="left">
        <h1>Con <span class="brand">Trueque</span>, intercambia lo que tienes por lo que quieres</h1>
        <p class="lead">La forma más segura y profesional de intercambiar productos.
          publica tu producto, acuerda encuentros y realiza tu el intercambio.</p>

        <div class="cta">
          <a class="btn primary" routerLink="/productos">Explorar productos</a>
          <a class="btn ghost" routerLink="/como-funciona">Cómo funciona</a>
        </div>

        <ul class="bullets">
          <li>✔ chat integrado</li>
          <li>✔ intercambios seguros</li>
          <li>✔ Soporte 24/7</li>
        </ul>
      </div>

      <div class="right">
        <img [src]="hero" alt="Intercambio seguro" />
      </div>
    </section>

    <section class="cats">
      <h3>Explorar por categoría</h3>
      <div class="grid">
        <a routerLink="/productos" class="cat"><span>💻</span> Electrónicos</a>
        <a routerLink="/productos" class="cat"><span>📱</span> Celulares</a>
        <a routerLink="/productos" class="cat"><span>🏠</span> Hogar</a>
        <a routerLink="/productos" class="cat"><span>🏅</span> Deporte</a>
        <a routerLink="/productos" class="cat"><span>⋯</span> Otros</a>
      </div>
    </section>
  `,
  styles: [`
    .hero{display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:24px;padding:16px}
    .left h1{font-size:clamp(28px,5vw,44px);line-height:1.15;margin:0 0 12px}
    .brand{color:#10b3a5}
    .lead{color:#475569;font-size:clamp(15px,2.5vw,18px)}
    .cta{display:flex;gap:12px;margin:16px 0 12px}
    .btn{padding:10px 14px;border-radius:9999px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
    .btn.primary{background:#10b3a5;color:#fff}
    .btn.ghost{border:1px solid #0f172a30;color:#0f172a}
    .bullets{display:flex;gap:18px;color:#334155;padding:0;list-style:none;margin:8px 0 0}
    .right img{width:100%;border-radius:16px;box-shadow:0 10px 30px rgba(2,6,23,.15)}
    .cats{margin:36px 0 0}
    .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
    .cat{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;display:flex;gap:10px;align-items:center;color:#0f172a;text-decoration:none}
    .cat span{font-size:22px}
    @media (max-width: 900px){
      .hero{grid-template-columns:1fr}
    }
    @media (max-width: 640px){
      .grid{grid-template-columns:repeat(2,1fr)}
    }
  `]
})
export class HomeComponent implements OnInit{
  private http = inject(HttpClient);
  hero = environment.heroUrl;
  ngOnInit() {}
}
