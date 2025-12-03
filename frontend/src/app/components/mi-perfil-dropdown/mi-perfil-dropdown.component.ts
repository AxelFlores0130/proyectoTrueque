import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, PerfilPrivado } from '../../services/usuario.service';

@Component({
  selector: 'app-mi-perfil-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dropdown-menu" (click)="$event.stopPropagation()">
      <div *ngIf="perfil" class="perfil-container">
        <h3>Mi perfil</h3>

        <!-- MODO LECTURA: Nombre completo -->
        <div class="campo" *ngIf="!editando['nombre_completo']">
          <label>Nombre completo</label>
          <div class="valor-con-editar">
            <span>{{ perfil.nombre_completo }}</span>
            <button (click)="iniciarEdicion('nombre_completo')" class="btn-editar-campo" type="button">✏️</button>
          </div>
        </div>

        <!-- MODO EDICIÓN: Nombre completo -->
        <div class="campo" *ngIf="editando['nombre_completo']">
          <label>Nombre completo</label>
          <div class="input-con-botones">
            <input [(ngModel)]="valoresEdicion['nombre_completo']" type="text" />
            <button (click)="guardarCampo('nombre_completo')" class="btn-ok" type="button">✓</button>
            <button (click)="cancelarEdicion('nombre_completo')" class="btn-cancel" type="button">✕</button>
          </div>
        </div>

        <!-- Correo (no editable) -->
        <div class="campo">
          <label>Correo</label>
          <div class="valor-con-editar">
            <span>{{ perfil.correo }}</span>
            <span class="no-editable">🔒</span>
          </div>
        </div>

        <!-- MODO LECTURA: Teléfono -->
        <div class="campo" *ngIf="!editando['telefono']">
          <label>Teléfono</label>
          <div class="valor-con-editar">
            <span>{{ perfil.telefono || '—' }}</span>
            <button (click)="iniciarEdicion('telefono')" class="btn-editar-campo" type="button">✏️</button>
          </div>
        </div>

        <!-- MODO EDICIÓN: Teléfono -->
        <div class="campo" *ngIf="editando['telefono']">
          <label>Teléfono</label>
          <div class="input-con-botones">
            <input [(ngModel)]="valoresEdicion['telefono']" type="tel" />
            <button (click)="guardarCampo('telefono')" class="btn-ok" type="button">✓</button>
            <button (click)="cancelarEdicion('telefono')" class="btn-cancel" type="button">✕</button>
          </div>
        </div>

        <!-- Rol (no editable) -->
        <div class="campo">
          <label>Rol</label>
          <div class="valor-con-editar">
            <span class="rol-badge">{{ perfil.rol | titlecase }}</span>
            <span class="no-editable">🔒</span>
          </div>
        </div>

        <!-- Verificado (no editable) -->
        <div class="campo">
          <label>Verificado</label>
          <div class="valor-con-editar">
            <span>{{ perfil.verificado ? '✓ Sí' : '✕ No' }}</span>
            <span class="no-editable">🔒</span>
          </div>
        </div>

        <p *ngIf="mensaje" [class.exito]="esExito" [class.error]="!esExito" class="mensaje">
          {{ mensaje }}
        </p>

        <button (click)="cerrarDropdown()" class="btn-cerrar" type="button">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      width: 320px;
      margin-top: 8px;
      z-index: 999;
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
    }

    h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #0f172a;
    }

    .perfil-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .campo {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-weight: 600;
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .valor-con-editar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      background: #f5f5f5;
      border-radius: 6px;
      min-height: 32px;
    }

    .valor-con-editar span {
      font-size: 13px;
      color: #333;
      flex: 1;
    }

    .rol-badge {
      background: #10b3a5;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .no-editable {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .btn-editar-campo {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      padding: 4px;
      margin-left: 8px;
    }

    .btn-editar-campo:hover {
      transform: scale(1.1);
    }

    .input-con-botones {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    input {
      flex: 1;
      padding: 8px 10px;
      border: 2px solid #10b3a5;
      border-radius: 6px;
      font-size: 13px;
    }

    .btn-ok,
    .btn-cancel {
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    }

    .btn-ok {
      background: #16a34a;
      color: #fff;
    }

    .btn-cancel {
      background: #e5e7eb;
      color: #333;
    }

    .btn-cerrar {
      width: 100%;
      padding: 10px;
      background: #e5e7eb;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      margin-top: 8px;
    }

    .btn-cerrar:hover {
      background: #d4d4d8;
    }

    .mensaje {
      font-size: 12px;
      text-align: center;
      padding: 8px;
      border-radius: 4px;
      margin: 0;
    }

    .exito {
      background: #dcfce7;
      color: #166534;
    }

    .error {
      background: #fee2e2;
      color: #991b1b;
    }
  `]
})
export class MiPerfilDropdownComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  perfil: PerfilPrivado | null = null;
  
  // Controla qué campos están en modo edición
  editando: { [key: string]: boolean } = {
    nombre_completo: false,
    telefono: false,
  };

  // Guarda los valores mientras se editan
  valoresEdicion: { [key: string]: string } = {
    nombre_completo: '',
    telefono: '',
  };

  mensaje = '';
  esExito = false;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.usuarioService.obtenerMiPerfil().subscribe(
      (p) => {
        this.perfil = p;
        this.valoresEdicion['nombre_completo'] = p.nombre_completo;
        this.valoresEdicion['telefono'] = p.telefono || '';
      },
      (err) => console.error('Error cargando perfil:', err)
    );
  }

  iniciarEdicion(campo: string): void {
    if (this.perfil) {
      this.editando[campo] = true;
    }
  }

  cancelarEdicion(campo: string): void {
    this.editando[campo] = false;
    if (this.perfil) {
      this.valoresEdicion[campo] = 
        campo === 'nombre_completo' 
          ? this.perfil.nombre_completo 
          : this.perfil.telefono || '';
    }
    this.mensaje = '';
  }

  guardarCampo(campo: string): void {
    const payload: any = {
      [campo]: this.valoresEdicion[campo],
    };

    this.usuarioService.editarMiPerfil(payload).subscribe(
      (p) => {
        this.perfil = p;
        this.valoresEdicion[campo] = 
          campo === 'nombre_completo' 
            ? p.nombre_completo 
            : p.telefono || '';
        this.editando[campo] = false;
        this.mensaje = `${campo} actualizado ✓`;
        this.esExito = true;
        setTimeout(() => {
          this.mensaje = '';
        }, 2000);
      },
      (err) => {
        this.mensaje = err.error?.error || 'Error al guardar';
        this.esExito = false;
      }
    );
  }

  cerrarDropdown(): void {
    this.cerrar.emit();
  }
}
