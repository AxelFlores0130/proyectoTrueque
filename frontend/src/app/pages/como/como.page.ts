import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-como-page',
  imports: [CommonModule],
  template: `
    <section class="wrap">
      <h1>Cómo funciona Trueque</h1>
      <p class="intro">
        Trueque conecta a personas que quieren intercambiar productos de forma
        segura, añadiendo dinero solo cuando es necesario para equilibrar el valor.
      </p>

      <div class="grid">
        <article class="step">
          <h2>1. Crea tu cuenta</h2>
          <p>
            Regístrate con tu nombre, correo y un medio de contacto. 
            Esto nos permite relacionar tus productos y solicitudes contigo.
          </p>
        </article>

        <article class="step">
          <h2>2. Publica tus productos</h2>
          <p>
            Sube fotos, describe el estado del producto, indica su valor aproximado
            y tu ubicación. Otros usuarios podrán verlo y proponerte intercambios.
          </p>
        </article>

        <article class="step">
          <h2>3. Envía y recibe solicitudes</h2>
          <p>
            Si ves algo que te interesa, envías una solicitud indicando qué ofreces 
            a cambio y, si hace falta, una diferencia en dinero. 
            También recibirás solicitudes de otros usuarios.
          </p>
        </article>

        <article class="step">
          <h2>4. Acepta el intercambio</h2>
          <p>
            Cuando ambas partes estén de acuerdo, confirman el intercambio. 
            La app registrará el acuerdo y, si hay diferencia en efectivo no confirmes hasta recibir tu dinero.
          </p>
        </article>

        <article class="step">
          <h2>5. Encuentro y cierre</h2>
          <p>
            Acuerdan un punto de encuentro y horario. Después del intercambio,
            se registra en tu historial.
          </p>
        </article>
      </div>

      <p class="footer">
        Nuestro objetivo es que los intercambios sean claros, seguros y justos para ambas partes.
      </p>
    </section>
  `,
  styles: [`
    .wrap{
      max-width:900px;
      margin:40px auto 0;
      padding:0 16px 40px;
    }
    h1{
      font-size:32px;
      margin-bottom:12px;
      color:#0f172a;
    }
    .intro{
      color:#475569;
      max-width:640px;
      margin-bottom:28px;
    }
    .grid{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
      gap:18px;
    }
    .step{
      background:#ffffff;
      border-radius:14px;
      padding:16px 18px;
      box-shadow:0 12px 32px rgba(15,23,42,.08);
    }
    .step h2{
      font-size:18px;
      margin:0 0 6px;
      color:#0f172a;
    }
    .step p{
      margin:0;
      font-size:14px;
      color:#64748b;
    }
    .footer{
      margin-top:28px;
      font-size:14px;
      color:#475569;
    }
  `]
})
export class ComoPage {}

