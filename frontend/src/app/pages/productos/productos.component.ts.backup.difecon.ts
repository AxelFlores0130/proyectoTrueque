import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProductosService,
  Producto,
  Categoria,
} from "../../services/productos.service";
import { SolicitudesService } from "../../services/solicitudes.service";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-productos",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./productos.component.html",
  styleUrls: ["./productos.component.css"],
})
export class ProductosComponent implements OnInit {
  categorias: Categoria[] = [];

  // Productos de otros usuarios (para explorar)
  productosExplorar: Producto[] = [];
  // Mis productos
  misProductos: Producto[] = [];

  // Filtros
  categoriaSeleccionada: number | null = null;
  busqueda = "";

  // Tabs: explorar / mis productos
  tab: "explorar" | "mis" = "explorar";

  // Form publicar / editar
  editando = false;
  productoEditando: Producto | null = null;
  form = {
    id_categoria: null as number | null,
    titulo: "",
    descripcion: "",
    valor_estimado: 0,
    ubicacion: "",
    imagen_url: "",
  };

  archivoImagen: File | null = null;
  previewUrl: string | null = null;

  // Modal formulario
  mostrarFormulario = false;

  // Modal para elegir qué producto ofrezco al hacer match
  mostrarModalMatch = false;
  productoObjetivoSeleccionado: Producto | null = null;
  productoOfreceSeleccionadoId: number | null = null;

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

  // ----- Navegación por tabs -----
  cambiarTab(t: "explorar" | "mis"): void {
    this.tab = t;
    if (t === "explorar") {
      this.cargarExplorar();
    } else {
      this.cargarMisProductos();
    }
  }

  // ----- Datos base -----
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

  // ----- Filtros -----
  onBuscar(): void {
    this.cargarExplorar();
  }

  limpiarFiltros(): void {
    this.busqueda = "";
    this.categoriaSeleccionada = null;
    this.cargarExplorar();
  }

  seleccionarCategoria(cat: Categoria): void {
    this.categoriaSeleccionada =
      this.categoriaSeleccionada === cat.id_categoria ? null : cat.id_categoria;
    this.cargarExplorar();
  }

  // ----- Utilidades -----
  resolverImagen(url: string | null | undefined): string | null {
    if (!url) return null;
    return url;
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

  // ----- Modal publicar / editar -----
  abrirFormularioNuevo(): void {
    this.editando = false;
    this.productoEditando = null;
    this.form = {
      id_categoria: null,
      titulo: "",
      descripcion: "",
      valor_estimado: 0,
      ubicacion: "",
      imagen_url: "",
    };
    this.archivoImagen = null;
    this.previewUrl = null;
    this.mostrarFormulario = true;
  }

  abrirFormularioEditar(p: Producto): void {
    this.editando = true;
    this.productoEditando = p;
    this.form = {
      id_categoria: p.id_categoria,
      titulo: p.titulo,
      descripcion: p.descripcion,
      valor_estimado: p.valor_estimado,
      ubicacion: p.ubicacion || "",
      imagen_url: p.imagen_url || "",
    };
    this.archivoImagen = null;
    this.previewUrl = this.resolverImagen(p.imagen_url);
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  guardarProducto(): void {
    if (!this.form.id_categoria) {
      alert("Selecciona una categoría");
      return;
    }

    const construirPayload = (imagenSubida?: string) => {
      let imagenFinal: string | undefined = undefined;
      if (imagenSubida) {
        imagenFinal = imagenSubida;
      } else if (this.form.imagen_url) {
        imagenFinal = this.form.imagen_url;
      }

      const payload: any = {
        id_categoria: this.form.id_categoria,
        titulo: this.form.titulo,
        descripcion: this.form.descripcion,
        valor_estimado: this.form.valor_estimado,
        ubicacion: this.form.ubicacion,
      };

      if (imagenFinal) {
        payload.imagen_url = imagenFinal;
      }

      return payload;
    };

    const despuesDeGuardar = (payload: any) => {
      if (this.editando && this.productoEditando) {
        this.productosService
          .actualizar(this.productoEditando.id_producto, payload)
          .subscribe(() => {
            alert("Producto actualizado");
            this.cerrarFormulario();
            this.cargarExplorar();
            this.cargarMisProductos();
          });
      } else {
        this.productosService.crear(payload).subscribe(() => {
          alert("Producto publicado");
          this.cerrarFormulario();
          this.cargarExplorar();
          this.cargarMisProductos();
        });
      }
    };

    if (this.archivoImagen) {
      this.productosService.upload(this.archivoImagen).subscribe((res) => {
        this.previewUrl = res.url;
        const payload = construirPayload(res.url);
        despuesDeGuardar(payload);
      });
    } else {
      const payload = construirPayload();
      despuesDeGuardar(payload);
    }
  }

  // ----- Alta / baja -----
  toggleEstado(p: Producto): void {
    const nuevoEstado = p.estado === "disponible" ? "baja" : "disponible";
    this.productosService
      .actualizarEstado(p.id_producto, nuevoEstado)
      .subscribe((prodActualizado) => {
        p.estado = prodActualizado.estado;
        this.cargarExplorar();
        this.cargarMisProductos();
      });
  }

  // ----- Match: elegir qué producto ofrezco -----
  abrirModalMatch(p: Producto): void {
    if (!this.isAuth) {
      alert("Debes iniciar sesión para hacer match");
      return;
    }
    this.productoObjetivoSeleccionado = p;
    this.productoOfreceSeleccionadoId = null;
    this.cargarMisProductos();
    this.mostrarModalMatch = true;
  }

  cerrarModalMatch(): void {
    this.mostrarModalMatch = false;
    this.productoObjetivoSeleccionado = null;
    this.productoOfreceSeleccionadoId = null;
  }

  confirmarMatch(): void {
    if (!this.productoObjetivoSeleccionado) {
      return;
    }
    if (!this.productoOfreceSeleccionadoId) {
      alert("Selecciona un producto para ofrecer");
      return;
    }

    this.solicitudesService
      .crear({
        id_producto_objetivo: this.productoObjetivoSeleccionado.id_producto,
        id_producto_ofrece: this.productoOfreceSeleccionadoId,
        mensaje: "Me interesa tu producto y te ofrezco uno a cambio",
      })
      .subscribe(() => {
        alert("Solicitud enviada");
        this.cerrarModalMatch();
      });
  }
}
