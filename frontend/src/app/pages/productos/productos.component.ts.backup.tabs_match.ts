import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProductosService,
  Producto,
  Categoria,
} from '../../services/productos.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
})
export class ProductosComponent implements OnInit {
  categorias: Categoria[] = [];

  // Productos de otros usuarios (para explorar / hacer match)
  productosExplorar: Producto[] = [];
  // Productos del usuario logueado
  misProductos: Producto[] = [];

  // Filtros
  categoriaSeleccionada: number | null = null;
  busqueda = '';

  // Formulario publicar / editar
  editando = false;
  mostrarFormulario = false;
  productoEditando: Producto | null = null;

  form = {
    id_categoria: null as number | null,
    titulo: '',
    descripcion: '',
    valor_estimado: 0,
    ubicacion: '',
    imagen_url: '',
  };

  archivoImagen: File | null = null;
  previewUrl: string | null = null; // vista previa en el modal

  constructor(
    private productosService: ProductosService,
    private solicitudesService: SolicitudesService,
    private auth: AuthService
  ) {}

  get isAuth(): boolean {
    return this.auth.isAuth();
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarExplorar();
    this.cargarMisProductos();
  }

  // ====================
  // Carga de datos
  // ====================

  cargarCategorias(): void {
    this.productosService.categorias().subscribe((cats) => {
      this.categorias = cats || [];
    });
  }

  cargarExplorar(): void {
    this.productosService
      .listar({
        q: this.busqueda || undefined,
        id_categoria: this.categoriaSeleccionada || undefined,
        solo_otros: true,
      })
      .subscribe((p) => (this.productosExplorar = p));
  }

  cargarMisProductos(): void {
    if (!this.isAuth) {
      this.misProductos = [];
      return;
    }

    this.productosService
      .listar({
        solo_mios: true,
        incluir_bajas: true,
      })
      .subscribe((p) => (this.misProductos = p));
  }

  // ====================
  // Filtros / toolbar
  // ====================

  onBuscar(): void {
    this.cargarExplorar();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.categoriaSeleccionada = null;
    this.cargarExplorar();
  }

  // ====================
  // Formulario (modal)
  // ====================

  abrirFormularioNuevo(): void {
    this.prepararNuevo();
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.prepararNuevo();
  }

  prepararNuevo(): void {
    this.editando = false;
    this.productoEditando = null;
    this.form = {
      id_categoria: null,
      titulo: '',
      descripcion: '',
      valor_estimado: 0,
      ubicacion: '',
      imagen_url: '',
    };
    this.archivoImagen = null;
    this.previewUrl = null;
  }

  prepararEditar(p: Producto): void {
    this.editando = true;
    this.mostrarFormulario = true;
    this.productoEditando = p;
    this.form = {
      id_categoria: p.id_categoria,
      titulo: p.titulo,
      descripcion: p.descripcion,
      valor_estimado: p.valor_estimado,
      ubicacion: p.ubicacion || '',
      imagen_url: p.imagen_url || '',
    };
    this.archivoImagen = null;
    this.previewUrl = this.resolverImagen(p.imagen_url);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.archivoImagen = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.archivoImagen);
    }
  }

  guardarProducto(): void {
    if (!this.form.id_categoria) {
      alert('Selecciona una categoría');
      return;
    }

    const afterUpload = (imagen_url?: string) => {
      const imagenFinal = imagen_url || this.form.imagen_url || undefined;

      const payload = {
        id_categoria: this.form.id_categoria!,
        titulo: this.form.titulo,
        descripcion: this.form.descripcion,
        valor_estimado: this.form.valor_estimado,
        ubicacion: this.form.ubicacion,
        imagen_url: imagenFinal,
      };

      if (this.editando && this.productoEditando) {
        this.productosService
          .actualizar(this.productoEditando.id_producto, payload)
          .subscribe(() => {
            alert('Producto actualizado');
            this.cerrarFormulario();
            this.cargarExplorar();
            this.cargarMisProductos();
          });
      } else {
        this.productosService.crear(payload).subscribe(() => {
          alert('Producto publicado');
          this.cerrarFormulario();
          this.cargarExplorar();
          this.cargarMisProductos();
        });
      }
    };

    if (this.archivoImagen) {
      this.productosService.upload(this.archivoImagen).subscribe((res) => {
        this.previewUrl = res.url;
        afterUpload(res.url);
      });
    } else {
      afterUpload();
    }
  }

  // ====================
  // Estado / match
  // ====================

  toggleEstado(p: Producto): void {
    const nuevoEstado = p.estado === 'disponible' ? 'baja' : 'disponible';
    this.productosService
      .actualizarEstado(p.id_producto, nuevoEstado)
      .subscribe((prodActualizado) => {
        p.estado = prodActualizado.estado;
        this.cargarExplorar();
        this.cargarMisProductos();
      });
  }

  crearMatch(p: Producto): void {
    if (!this.isAuth) {
      alert('Debes iniciar sesión para hacer match');
      return;
    }
    this.solicitudesService
      .crear({
        id_producto_objetivo: p.id_producto,
        mensaje: 'Me interesa tu producto',
      })
      .subscribe(() => {
        alert('Solicitud enviada');
      });
  }

  // ====================
  // Utilidad imágenes
  // ====================

  resolverImagen(url: string | null | undefined): string | null {
    if (!url) return null;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return 'http://127.0.0.1:5000' + url;
    }

    return 'http://127.0.0.1:5000/' + url;
  }
}
