// frontend/src/app/pages/registro/registro.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-registro',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-wrapper">
      <div class="auth-card">
        <h1>Crear cuenta</h1>
        <p class="subtitle">Únete a Trueque y comienza a intercambiar de forma segura.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <label>
            Nombre completo
            <input type="text" formControlName="nombre" placeholder="Nombre y apellidos" />
          </label>
          <div class="error" *ngIf="submitted && form.controls['nombre'].invalid">
            El nombre es obligatorio.
          </div>

          <label>
            Correo electrónico
            <input type="email" formControlName="correo" placeholder="tucorreo@ejemplo.com" />
          </label>
          <div class="error" *ngIf="submitted && form.controls['correo'].invalid">
            Ingresa un correo válido.
          </div>

          <label>
            Teléfono
            <input type="tel" formControlName="telefono" placeholder="Número de contacto" />
          </label>

          <label>
            Contraseña
            <input type="password" formControlName="contrasena" placeholder="********" />
          </label>
          <div class="error" *ngIf="submitted && form.controls['contrasena'].invalid">
            La contraseña es obligatoria (mínimo 6 caracteres).
          </div>

          <label>
            Confirmar contraseña
            <input type="password" formControlName="confirmar" placeholder="Repite la contraseña" />
          </label>
          <div class="error" *ngIf="submitted && form.errors?.['passwordMismatch']">
            Las contraseñas no coinciden.
          </div>

          <div class="error" *ngIf="errorMsg">
            {{ errorMsg }}
          </div>
          <div class="ok" *ngIf="successMsg">
            {{ successMsg }}
          </div>

          <button type="submit" [disabled]="loading">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="divider">
          <span>o continúa con</span>
        </div>

        <button type="button" class="google-btn" (click)="onGoogleRegister()">
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
            alt="Google"
          />
          Crear cuenta con Google
        </button>

        <p class="alt">
          ¿Ya tienes cuenta?
          <a routerLink="/login">Inicia sesión</a>
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
      background:#f5f7fb;
    }
    .auth-card{
      background:#ffffff;
      padding:32px 40px;
      border-radius:18px;
      box-shadow:0 18px 45px rgba(15,23,42,.16);
      max-width:480px;
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
      background:#f9fafb;
    }
    input:focus{
      border-color:#0ea5e9;
      box-shadow:0 0 0 1px rgba(14,165,233,.3);
      background:#ffffff;
    }
    .error{
      color:#b91c1c;
      font-size:12px;
      margin-top:-6px;
    }
    .ok{
      color:#15803d;
      font-size:13px;
      margin-top:4px;
    }
    button{
      margin-top:8px;
      padding:10px 14px;
      border:none;
      border-radius:999px;
      background:#10b981;
      color:#fff;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
      transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
    }
    button:hover:not(:disabled){
      background:#059669;
      box-shadow:0 10px 25px rgba(22,163,74,.35);
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
    .divider{
      display:flex;
      align-items:center;
      margin:18px 0 10px;
      font-size:12px;
      color:#9ca3af;
      gap:8px;
    }
    .divider::before,
    .divider::after{
      content:'';
      flex:1;
      height:1px;
      background:#e5e7eb;
    }
    .google-btn{
      width:100%;
      padding:9px 14px;
      border-radius:999px;
      border:1px solid #d1d5db;
      background:#ffffff;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      cursor:pointer;
      font-size:14px;
      font-weight:500;
      margin-bottom:8px;
    }
    .google-btn img{
      width:18px;
      height:18px;
    }
  `]
})
export class RegistroPage {
  form: FormGroup;
  submitted = false;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        nombre: ['', [Validators.required]],
        correo: ['', [Validators.required, Validators.email]],
        telefono: [''],
        contrasena: ['', [Validators.required, Validators.minLength(6)]],
        confirmar: ['', [Validators.required]],
      },
      {
        validators: (group: FormGroup) => {
          const pass = group.get('contrasena')?.value;
          const conf = group.get('confirmar')?.value;
          return pass && conf && pass !== conf
            ? { passwordMismatch: true }
            : null;
        }
      }
    );
  }

  onSubmit() {
    this.submitted = true;
    this.errorMsg = '';
    this.successMsg = '';

    if (this.form.invalid) return;

    const { nombre, correo, telefono, contrasena } = this.form.value;
    this.loading = true;

    this.auth.register(nombre, correo, telefono || '', contrasena, 'cliente').subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Cuenta creada correctamente. Ahora puedes iniciar sesión.';
        setTimeout(() => this.router.navigateByUrl('/login'), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg =
          err?.error?.message ||
          'No fue posible crear la cuenta. Intenta de nuevo.';
      }
    });
  }

  onGoogleRegister() {
    // de momento, redirige al backend de Google login cuando lo tengas
    window.location.href = this.auth.getGoogleAuthUrl();
  }
}

