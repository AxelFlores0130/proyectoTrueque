import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';   // 👈 para *ngIf, *ngFor, date, etc.
import { FormsModule } from '@angular/forms';     // 👈 para [(ngModel)]

import { AdminService, UsuarioAdmin, HistorialIntercambioItem } from '../../services/admin.service';
import { Categoria } from '../../services/productos.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,                               // 👈 IMPORTANTE
  imports: [CommonModule, FormsModule],           // 👈 AQUÍ metemos FormsModule
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  usuarios: UsuarioAdmin[] = [];
  cargandoUsuarios = false;

  selectedUsuario?: UsuarioAdmin;
  historial: HistorialIntercambioItem[] = [];
  cargandoHistorial = false;

  categorias: Categoria[] = [];
  cargandoCategorias = false;

  nuevaCategoriaNombre = '';
  nuevaCategoriaDescripcion = '';

  mensaje?: string;
  error?: string;

  constructor(
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarCategorias();
  }

  // ===== USUARIOS =====
  cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.adminService.getUsuarios().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.cargandoUsuarios = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Error al cargar usuarios';
        this.cargandoUsuarios = false;
      }
    });
  }

  toggleVerificado(u: UsuarioAdmin, event: MouseEvent): void {
    event.stopPropagation();

    const nuevoValor = u.verificado === 1 ? false : true;
    this.adminService.actualizarVerificado(u.id_usuario, nuevoValor).subscribe({
      next: res => {
        u.verificado = res.verificado;
        this.mensaje = nuevoValor ? 'Usuario dado de alta' : 'Usuario dado de baja';
      },
      error: err => {
        console.error(err);
        this.error = 'No se pudo actualizar el estado del usuario';
      }
    });
  }

  seleccionarUsuario(u: UsuarioAdmin): void {
    if (this.selectedUsuario && this.selectedUsuario.id_usuario === u.id_usuario) {
      this.selectedUsuario = undefined;
      this.historial = [];
      return;
    }

    this.selectedUsuario = u;
    this.cargandoHistorial = true;
    this.historial = [];

    this.adminService.getHistorialIntercambios(u.id_usuario).subscribe({
      next: hist => {
        this.historial = hist;
        this.cargandoHistorial = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Error al cargar historial de intercambios';
        this.cargandoHistorial = false;
      }
    });
  }

  // ===== CATEGORÍAS =====
  cargarCategorias(): void {
    this.cargandoCategorias = true;
    this.adminService.getCategorias().subscribe({
      next: cats => {
        this.categorias = cats;
        this.cargandoCategorias = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Error al cargar categorías';
        this.cargandoCategorias = false;
      }
    });
  }

  crearCategoria(): void {
    this.mensaje = undefined;
    this.error = undefined;

    const nombre = this.nuevaCategoriaNombre.trim();
    const descripcion = this.nuevaCategoriaDescripcion.trim();

    if (!nombre) {
      this.error = 'El nombre de la categoría es obligatorio';
      return;
    }

    this.adminService.crearCategoria(nombre, descripcion || undefined).subscribe({
      next: cat => {
        this.categorias.push(cat);
        this.nuevaCategoriaNombre = '';
        this.nuevaCategoriaDescripcion = '';
        this.mensaje = 'Categoría creada correctamente';
      },
      error: err => {
        console.error(err);
        this.error = 'No se pudo crear la categoría';
      }
    });
  }

  cerrarAlertas(): void {
    this.mensaje = undefined;
    this.error = undefined;
  }
}


