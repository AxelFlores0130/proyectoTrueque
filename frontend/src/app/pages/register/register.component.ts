import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  selector: "app-register",
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth">
      <div class="brand">
        <div class="logo">↕</div>
        <div class="name">Trueque</div>
      </div>

      <h1>Crear cuenta</h1>

      <form (ngSubmit)="registrar()" style="display:grid;gap:10px">
        <input [(ngModel)]="nombre" name="nombre" placeholder="Nombre completo" required />
        <input [(ngModel)]="correo" name="correo" placeholder="Correo" type="email" required />
        <input [(ngModel)]="telefono" name="telefono" placeholder="Teléfono" />
        <select [(ngModel)]="rol" name="rol">
          <option value="cliente">cliente</option>
          <option value="administrador">administrador</option>
        </select>
        <input [(ngModel)]="password" name="password" type="password" placeholder="Contraseña" required />
        <button class="btn primary" type="submit">Registrarme</button>
      </form>

      <p class="error" *ngIf="err">{{ err }}</p>
      <p class="muted">¿Ya tienes una cuenta? <a routerLink="/login">Inicia sesión</a></p>
    </div>
  `,
  styles:[`
    .auth{max-width:520px;margin:40px auto;padding:24px;border-radius:16px;background:#fff;border:1px solid #e5e7eb}
    .brand{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .logo{width:28px;height:28px;border-radius:8px;background:#10b3a5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
    .name{font-weight:700}
    input,select{padding:10px;border:1px solid #e5e7eb;border-radius:10px}
    .btn.primary{background:#10b3a5;color:#fff;border:none;border-radius:9999px;padding:10px 14px}
    .error{color:#e11d48;margin-top:8px}
    .muted{color:#64748b;margin-top:14px}
  `]
})
export class RegisterComponent {
  nombre = "";
  correo = "";
  telefono = "";
  password = "";
  rol: "cliente"|"administrador" = "cliente";
  err = "";

  constructor(private auth: AuthService, private router: Router) {}

  registrar(){
    this.err = "";
    this.auth.register(this.nombre, this.correo, this.telefono, this.password, this.rol).subscribe({
      next: _ => this.router.navigateByUrl("/login"),
      error: e => this.err = e?.error?.msg || "No se pudo registrar"
    });
  }
}
