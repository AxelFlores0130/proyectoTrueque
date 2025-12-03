import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, PerfilPrivado } from '../../services/usuario.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mi-perfil-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Mi perfil</h2>
          <button type="button" (click)="cerrar()" class="btn-cerrar">✕</button>
        </div>
        
        <div *ngIf="perfil" class="form-group">
          <label>Nombre completo</label>
          <input [(ngModel)]="form.nombre_completo" type="text" />

          <label>Correo (no editable)</label>
          <input [value]="perfil.correo" type="email" disabled />

          <label>Teléfono</label>
          <input [(ngModel)]="form.telefono" type="tel" />

          <label>Rol</label>
          <input [value]="perfil.rol" type="text" disabled />

          <label>Verificado</label>
          <input [value]="perfil.verificado ? 'Sí' : 'No'" type="text" disabled />

          <div class="botones">
            <button (click)="guardar()" class="btn-guardar">Guardar cambios</button>
            <button (click)="cerrar()" class="btn-cancelar">Cancelar</button>
          </div>

          <p *ngIf="mensaje" [class.exito]="esExito" [class.error]="!esExito" class="mensaje">
            {{ mensaje }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mi-perfil-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    h2 {
      margin: 0;
    }
    .btn-cerrar {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #999;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    label {
      font-weight: 600;
      font-size: 14px;
      margin-top: 8px;
    }
    input {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
    }
    input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }
    .botones {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    .btn-guardar,
    .btn-cancelar {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-guardar {
      background: #10b3a5;
      color: #fff;
    }
    .btn-cancelar {
      background: #e5e7eb;
      color: #333;
    }
    .mensaje {
      margin-top: 12px;
      font-size: 14px;
    }
    .exito {
      color: #16a34a;
    }
    .error {
      color: #e11d48;
    }
  `]
})
export class MiPerfilComponent implements OnInit {
  @Output() cerrarModal = new EventEmitter<void>();

  perfil: PerfilPrivado | null = null;
  form = {
    nombre_completo: '',
    telefono: '',
  };
  mensaje = '';
  esExito = false;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.usuarioService.obtenerMiPerfil().subscribe((p) => {
      this.perfil = p;
      this.form = {
        nombre_completo: p.nombre_completo,
        telefono: p.telefono || '',
      };
    });
  }

  guardar(): void {
    this.usuarioService.editarMiPerfil(this.form).subscribe(
      (p) => {
        this.perfil = p;
        this.mensaje = 'Perfil actualizado correctamente';
        this.esExito = true;
        setTimeout(() => {
          this.mensaje = '';
          this.cerrar();
        }, 2000);
      },
      (err) => {
        this.mensaje = err.error?.error || 'Error al guardar';
        this.esExito = false;
      }
    );
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}
