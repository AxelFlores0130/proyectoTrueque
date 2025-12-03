import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-registro',
  template: `
    <div class="container">
      <h2>Crear cuenta</h2>
      <form (ngSubmit)="onSubmit()" style="max-width:480px">
        <label>Nombre completo</label>
        <input [(ngModel)]="nombre" name="nombre" required />
        <label>Correo</label>
        <input [(ngModel)]="correo" name="correo" type="email" required />
        <label>Contraseña</label>
        <input [(ngModel)]="contrasena" name="contrasena" type="password" required />
        <div style="display:flex; gap:8px; margin-top:12px">
          <button type="submit">Crear cuenta</button>
          <a routerLink="/login"><button type="button" class="secondary">Volver</button></a>
        </div>
        <p *ngIf="mensaje" class="text-muted mt-2">{{ mensaje }}</p>
      </form>
    </div>
  `
})
export class RegistroPage {
  nombre = '';
  correo = '';
  contrasena = '';
  mensaje = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.nombre || !this.correo || !this.contrasena) {
      this.mensaje = 'Completa todos los campos';
      return;
    }
    if (this.auth && typeof (this.auth as any).register === 'function') {
      (this.auth as any).register({
        nombre_completo: this.nombre,
        correo: this.correo,
        contrasena: this.contrasena
      }).subscribe({
        next: () => this.router.navigateByUrl('/login'),
        error: (err) => this.mensaje = err?.error?.error || err?.error?.msg || 'Error al registrar'
      });
    } else {
      this.router.navigateByUrl('/login');
    }
  }
}
