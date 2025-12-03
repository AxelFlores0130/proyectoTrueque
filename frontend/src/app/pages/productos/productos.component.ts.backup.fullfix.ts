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

  // productos que veré para intercambiar (de otros usuarios)
  productosExplorar: Producto[] = [];
  // productos que yo publiqué
  misProductos: Producto[] = [];

  // filtros
  categoriaSeleccionada: number | null = null;
  busqueda = '';

  // formulario publicar / editar
  editando = false;
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
  previewUrl: string | null = null; // vista previa

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

  onBuscar(): void {
    this.cargarExplorar();
  }

  seleccionarCategoria(cat: Categoria): void {
    this.categoriaSeleccionada =
      this.categoriaSeleccionada === cat.id_categoria ? null : cat.id_categoria;
    this.cargarExplorar();
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.archivoImagen = input.files[0];

      // vista previa local (data URL)
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.archivoImagen);
    }
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
    this.previewUrl = this.resolverImagen(p.imagen_url); // usar URL absoluta
  }

  guardarProducto(): void {
    if (!this.form.id_categoria) {
      alert('Selecciona una categoría');
      return;
    }

    const afterUpload = (imagen_url?: string) => {
      const payload = {
        id_categoria: this.form.id_categoria!,
        titulo: this.form.titulo,
        descripcion: this.form.descripcion,
        valor_estimado: this.form.valor_estimado,
        ubicacion: this.form.ubicacion,
        imagen_url: imagen_url ?? this.form.imagen_url || undefined,
      };

      if (this.editando && this.productoEditando) {
        this.productosService
          .actualizar(this.productoEditando.id_producto, payload)
          .subscribe(() => {
            alert('Producto actualizado');
            this.prepararNuevo();
            this.cargarExplorar();
            this.cargarMisProductos();
          });
      } else {
        this.productosService.crear(payload).subscribe(() => {
          alert('Producto publicado');
          this.prepararNuevo();
          this.cargarExplorar();
          this.cargarMisProductos();
        });
      }
    };

    if (this.archivoImagen) {
      this.productosService.upload(this.archivoImagen).subscribe((res) => {
        // la API devuelve algo tipo "/static/uploads/archivo.jpg"
        this.previewUrl = this.resolverImagen(res.url);
        afterUpload(res.url);
      });
    } else {
      afterUpload();
    }
  }

  toggleEstado(p: Producto): void {
    const nuevoEstado = p.estado === 'disponible' ? 'baja' : 'disponible';
    this.productosService
      .actualizarEstado(p.id_producto, nuevoEstado)
      .subscribe((prodActualizado) => {
        p.estado = prodActualizado.estado;
        // actualizar listas
        this.cargarExplorar();
        this.cargarMisProductos();
      });
  }

  /**
   * Convierte lo que viene en imagen_url (por ejemplo "/static/uploads/x.jpg")
   * a una URL completa que apunte al backend (http://127.0.0.1:5000/...).
   */
  resolverImagen(url: string | null): string | null {
    if (!url) return null;

    // Si ya es URL absoluta, la regresamos tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    let path = url;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }

    // Servidor Flask en dev
    return `http://127.0.0.1:5000/${path}`;
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
}
