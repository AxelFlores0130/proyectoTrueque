import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-wrapper">
      <div class="auth-card">
        <h1>Iniciar sesión</h1>
        <p class="subtitle">Accede a tu cuenta para comenzar a intercambiar.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label>
            Correo electrónico
            <input
              type="email"
              formControlName="correo"
              placeholder="tucorreo@ejemplo.com"
            />
          </label>
          <div class="error" *ngIf="submitted && form.controls['correo'].invalid">
            Ingresa un correo válido.
          </div>

          <label>
            Contraseña
            <input
              type="password"
              formControlName="contrasena"
              placeholder="********"
            />
          </label>
          <div class="error" *ngIf="submitted && form.controls['contrasena'].invalid">
            La contraseña es obligatoria.
          </div>

          <div class="error" *ngIf="errorMsg">
            {{ errorMsg }}
          </div>

          <button type="submit" [disabled]="loading">
            {{ loading ? 'Entrando...' : 'Iniciar sesión' }}
          </button>
        </form>

        <p class="alt">
          ¿Aún no tienes cuenta?
          <a routerLink="/registro">Crear cuenta</a>
        </p>
      </div>
    </section>
  `,
  styles: [`
    .auth-wrapper{
      min-height:calc(100vh - 64px);
      display:flex;
      align-items:flex-start;
      justify-content:center;
      padding-top:60px;
    }
    .auth-card{
      background:#ffffff;
      padding:32px 40px;
      border-radius:18px;
      box-shadow:0 18px 45px rgba(15,23,42,.16);
      max-width:420px;
      width:100%;
    }
    h1{
      margin:0 0 8px;
      font-size:28px;
      font-weight:700;
      color:#0f172a;
    }
    .subtitle{
      margin:0 0 24px;
      color:#64748b;
      font-size:14px;
    }
    form{
      display:flex;
      flex-direction:column;
      gap:16px;
    }
    label{
      display:flex;
      flex-direction:column;
      font-size:14px;
      color:#0f172a;
      gap:6px;
    }
    input{
      padding:8px 10px;
      border-radius:10px;
      border:1px solid #cbd5e1;
      font-size:14px;
      outline:none;
    }
    input:focus{
      border-color:#0ea5e9;
      box-shadow:0 0 0 1px rgba(14,165,233,.3);
    }
    .error{
      color:#b91c1c;
      font-size:12px;
      margin-top:-6px;
    }
    button{
      margin-top:8px;
      padding:10px 14px;
      border:none;
      border-radius:999px;
      background:#0ea5e9;
      color:#fff;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
      transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
    }
    button:hover:not(:disabled){
      background:#0284c7;
      box-shadow:0 10px 25px rgba(37,99,235,.35);
      transform:translateY(-1px);
    }
    button:disabled{
      opacity:.7;
      cursor:default;
    }
    .alt{
      margin-top:16px;
      font-size:13px;
      color:#64748b;
      text-align:center;
    }
    .alt a{
      color:#0ea5e9;
      font-weight:600;
      text-decoration:none;
    }
  `]
})
export class LoginPage {
  form: FormGroup;
  submitted = false;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]]
    });
  }

  onSubmit() {
    this.submitted = true;
    this.errorMsg = '';

    if (this.form.invalid) return;

    const { correo, contrasena } = this.form.value;
    this.loading = true;

    this.auth.login({
      correo: correo.trim(),
      contrasena
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/productos');
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg =
          err?.error?.message ||
          'No fue posible iniciar sesión. Verifica tus datos.';
      }
    });
  }
}


