import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  standalone: true,
  selector: "app-login",
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth card">
      <div class="brand">
        <div class="logo">T</div>
        <span>Trueque</span>
      </div>

      <h1>Iniciar sesión</h1>

      <form (ngSubmit)="submit()" class="form">
        <input
          [(ngModel)]="f.correo"
          name="correo"
          type="email"
          placeholder="Correo"
          required
        />
        <input
          [(ngModel)]="f.contrasena"
          name="contrasena"
          type="password"
          placeholder="Contraseña"
          required
        />
        <button class="btn primary" type="submit" [disabled]="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="err" *ngIf="err">{{ err }}</p>

      <p class="hint">
        ¿No tienes una cuenta?
        <a routerLink="/registro">Crear una</a>
      </p>
    </div>
  `,
  styles: [`
    .auth.card{
      max-width:560px;
      margin:32px auto;
      padding:24px;
      border-radius:16px;
      background:#fff;
      border:1px solid #e5e7eb
    }
    .brand{
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom:8px
    }
    .logo{
      width:28px;
      height:28px;
      border-radius:8px;
      background:#10b3a5;
      color:#fff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700
    }
    h1{margin:6px 0 14px}
    .form{display:grid;gap:10px}
    input{
      padding:10px;
      border:1px solid #d1d5db;
      border-radius:10px
    }
    .btn.primary{
      background:#10b3a5;
      color:#fff;
      border:none;
      border-radius:10px;
      padding:10px 14px;
      cursor:pointer
    }
    .btn.primary[disabled]{
      opacity:.7;
      cursor:default
    }
    .err{color:#e11d48;margin-top:8px}
    .hint{margin-top:14px}
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  err = "";

  f = { correo: "", contrasena: "" };

  submit() {
    this.err = "";
    this.loading = true;

    this.auth.login({
      correo: this.f.correo.trim(),
      contrasena: this.f.contrasena
    })
    .subscribe({
      next: () => {
        this.loading = false;
        // redirige a donde quieras después de login
        this.router.navigateByUrl("/productos"); // o "/" si prefieres
      },
      error: (err) => {
        console.error("Error de login", err);
        this.loading = false;
        this.err =
          err?.error?.message ||
          "Correo o contraseña incorrectos. Inténtalo de nuevo.";
      },
    });
  }
}

