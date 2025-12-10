import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero-text">
        <h1>Con Trueque, tus productos valen más</h1>
        <p class="hero-sub">
          La forma más segura y profesional de intercambiar productos.
          Verifica usuarios, acuerda encuentros y realiza transacciones protegidas.
        </p>

        <div class="hero-cta">
          <a routerLink="/productos" class="btn-primary">Explorar productos</a>
          <a routerLink="/como" class="btn-outline">Cómo funciona</a>
        </div>

        <div class="hero-badges">
          <span>
            <span class="dot"></span>
            Verificación de usuarios
          </span>
          <span>
            <span class="dot"></span>
            Transacciones protegidas
          </span>
          <span>
            <span class="dot"></span>
            Soporte 24/7
          </span>
        </div>
      </div>

      <div class="hero-image">
        <img src="assets/hero/portada.jpg" alt="Intercambio seguro de productos" />
      </div>
    </section>

    <section class="home-section">
      <h2>Explorar por categoría</h2>
      <div class="cat-grid">
        <button class="cat-card">
          <span class="icon">💻</span>
          <span>Electrónicos</span>
        </button>
        <button class="cat-card">
          <span class="icon">📱</span>
          <span>Celulares</span>
        </button>
        <button class="cat-card">
          <span class="icon">🏡</span>
          <span>Hogar</span>
        </button>
        <button class="cat-card">
          <span class="icon">🏀</span>
          <span>Deportes</span>
        </button>
        <button class="cat-card">
          <span class="icon">⋯</span>
          <span>Otros</span>
        </button>
      </div>
    </section>

    <section class="home-section stats">
      <div class="stat">
        <span class="value">10,000+</span>
        <span class="label">Intercambios completados</span>
      </div>
      <div class="stat">
        <span class="value">4.9★</span>
        <span class="label">Calificación promedio</span>
      </div>
      <div class="stat">
        <span class="value">100%</span>
        <span class="label">Transacciones seguras</span>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display:block;
      padding:32px 24px 60px;
      max-width:1120px;
      margin:0 auto;
    }

    .hero{
      display:grid;
      grid-template-columns:minmax(0,1.3fr) minmax(0,1.1fr);
      gap:40px;
      align-items:center;
      margin-bottom:40px;
    }
    .hero-text h1{
      font-size:40px;
      line-height:1.1;
      margin:0 0 12px;
      color:#0f172a;
      font-weight:700;
    }
    .hero-sub{
      margin:0 0 20px;
      color:#475569;
      font-size:16px;
      max-width:480px;
    }
    .hero-cta{
      display:flex;
      gap:12px;
      margin-bottom:16px;
    }
    .btn-primary{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:10px 20px;
      border-radius:999px;
      background:#0f9f8f;
      color:#fff;
      font-weight:600;
      font-size:14px;
      text-decoration:none;
      box-shadow:0 14px 30px rgba(15,159,143,.35);
      transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
    }
    .btn-primary:hover{
      background:#0d8a7c;
      transform:translateY(-1px);
      box-shadow:0 18px 40px rgba(15,159,143,.45);
    }
    .btn-outline{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:10px 18px;
      border-radius:999px;
      border:1px solid #cbd5e1;
      background:#fff;
      color:#0f172a;
      font-weight:500;
      font-size:14px;
      text-decoration:none;
      transition:background .12s ease, border-color .12s ease, color .12s ease;
    }
    .btn-outline:hover{
      background:#f1f5f9;
      border-color:#94a3b8;
    }
    .hero-badges{
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      margin-top:8px;
      color:#64748b;
      font-size:13px;
    }
    .hero-badges span{
      display:inline-flex;
      align-items:center;
      gap:6px;
    }
    .dot{
      width:8px;
      height:8px;
      border-radius:999px;
      background:#0f9f8f;
    }
    .hero-image{
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 30px 70px rgba(15,23,42,.38);
    }
    .hero-image img{
      display:block;
      width:100%;
      height:auto;
      object-fit:cover;
    }

    .home-section{
      margin-top:8px;
      margin-bottom:28px;
    }
    .home-section h2{
      font-size:20px;
      margin:0 0 14px;
      color:#0f172a;
    }
    .cat-grid{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
      gap:14px;
    }
    .cat-card{
      border:none;
      background:#f8fafc;
      border-radius:16px;
      padding:14px 16px;
      display:flex;
      align-items:center;
      gap:10px;
      cursor:pointer;
      justify-content:flex-start;
      font-size:14px;
      color:#0f172a;
      transition:background .12s ease, transform .1s ease, box-shadow .12s ease;
    }
    .cat-card .icon{
      width:28px;
      height:28px;
      border-radius:999px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background:#e2f3f1;
    }
    .cat-card:hover{
      background:#e2f3f1;
      transform:translateY(-1px);
      box-shadow:0 12px 26px rgba(15,23,42,.14);
    }

    .stats{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
      gap:16px;
      margin-top:10px;
    }
    .stat{
      background:#ffffff;
      border-radius:18px;
      padding:14px 18px;
      box-shadow:0 16px 40px rgba(15,23,42,.12);
      text-align:center;
    }
    .stat .value{
      display:block;
      font-size:22px;
      font-weight:700;
      color:#0f9f8f;
      margin-bottom:4px;
    }
    .stat .label{
      font-size:13px;
      color:#64748b;
    }

    @media (max-width:900px){
      :host{padding-top:20px;}
      .hero{
        grid-template-columns:1fr;
        gap:24px;
      }
      .hero-image{order:-1;}
    }
  `]
})
export class HomePage {}

