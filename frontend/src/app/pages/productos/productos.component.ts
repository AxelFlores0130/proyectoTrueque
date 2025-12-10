import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SolicitudesService } from '../../services/solicitudes.service';

export interface ProductoCard {
  id_producto: number;
  id_usuario: number;
  id_categoria?: number | null;
  titulo: string;
  descripcion: string;
  valor_estimado: number;
  imagen_url: string | null;
  ubicacion: string;
  estado: string; // "disponible" | "baja"
  fecha_publicacion: string | null;

  categoria_nombre?: string | null;
  estado_fisico?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-productos',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
})
export class ProductosComponent implements OnInit {
  private API = environment.apiUrl;

  // Toolbar / filtros
  busqueda = '';
  categoriaSeleccionada: number | null = null;

  categorias: { id_categoria: number; nombre: string }[] = [
    { id_categoria: 1, nombre: 'Electrónicos' },
    { id_categoria: 2, nombre: 'Celulares' },
    { id_categoria: 3, nombre: 'Hogar' },
    { id_categoria: 4, nombre: 'Deportes' },
    { id_categoria: 5, nombre: 'Ropa' },
    { id_categoria: 6, nombre: 'Otros' },
  ];

  // datos
  productosAll: ProductoCard[] = [];
  productosBaseExplorar: ProductoCard[] = []; // solo disponibles
  productosExplorar: ProductoCard[] = [];
  misProductos: ProductoCard[] = [];

  // formulario / modal producto
  mostrarFormulario = false;
  editando = false;
  form: {
    id_producto: number | null;
    titulo: string;
    descripcion: string;
    id_categoria: number | null;
    ubicacion: string;
    valor_estimado: number;
    estado_fisico: string;
  } = this.crearFormVacio();

  previewUrl: string | null = null;
  archivo: File | null = null;
  guardando = false;

  // ------------------------------------------------
  // MODAL SOLICITUD / MATCH
  // ------------------------------------------------
  mostrarModalSolicitud = false;
  productoObjetivo: ProductoCard | null = null;
  productoOfreceId: number | null = null;
  mensajeSolicitud = 'Me interesa tu producto';
  diferenciaPropuesta: number | null = null;
  guardandoSolicitud = false;

  // Filtro y selección de producto que ofrece
  busquedaMisProductos = '';
  productoOfreceSeleccionado: ProductoCard | null = null;

  get misProductosFiltrados(): ProductoCard[] {
    const texto = (this.busquedaMisProductos || '').toLowerCase().trim();
    if (!texto) return this.misProductos;
    return this.misProductos.filter(p =>
      p.titulo.toLowerCase().includes(texto) ||
      (p.descripcion || '').toLowerCase().includes(texto)
    );
  }

  // ------------------------------------------------
  // MODAL CONFIRMAR BAJA
  // ------------------------------------------------
  mostrarConfirmarBaja = false;
  productoAConfirmarBaja: ProductoCard | null = null;
  guardandoBaja = false;

  get isAuth(): boolean {
    return this.auth.isAuth();
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private solicitudes: SolicitudesService
  ) {}

  // ------------------------------------------------
  // INIT
  // ------------------------------------------------
  ngOnInit(): void {
    this.cargarProductos();
  }

  // ------------------------------------------------
  // AUTH HELPERS
  // ------------------------------------------------
  private authHeaders() {
    return this.auth.authHeaders();
  }

  private getIdUsuarioActual(): number | null {
    const u = this.auth.getUser();
    return u?.id_usuario ?? null;
  }

  private mapCategoria(id_categoria: number | null | undefined): string | null {
    switch (id_categoria) {
      case 1: return 'Electrónicos';
      case 2: return 'Celulares';
      case 3: return 'Hogar';
      case 4: return 'Deportes';
      case 5: return 'Ropa';
      case 6: return 'Otros';
      default: return null;
    }
  }

  // ------------------------------------------------
  // CARGA DE PRODUCTOS
  // ------------------------------------------------
  private cargarProductos() {
    const idActual = this.getIdUsuarioActual();

    // Si el usuario está logueado, pedimos también los productos en "baja"
    const options: any = {};
    if (idActual) {
      options.params = { incluir_bajas: '1' };
    }

    // Listado público: no hace falta mandar headers aquí
    this.http.get(`${this.API}/productos`, options).subscribe(
      (res: any) => {
        const rawList: any[] = (res as any[]) || [];

        const lista: ProductoCard[] = rawList.map((raw) => {
          const estado = (raw.estado || raw.ESTADO || '')
            .toString()
            .toLowerCase();

          const id_cat =
            raw.id_categoria !== undefined && raw.id_categoria !== null
              ? Number(raw.id_categoria)
              : null;

          const p: ProductoCard = {
            id_producto: Number(raw.id_producto),
            id_usuario: Number(raw.id_usuario),
            id_categoria: id_cat,
            titulo: raw.titulo ?? '',
            descripcion: raw.descripcion ?? '',
            valor_estimado: Number(raw.valor_estimado) || 0,
            imagen_url: raw.imagen_url || null,
            ubicacion: raw.ubicacion || '',
            estado,
            fecha_publicacion: raw.fecha_publicacion || null,
            categoria_nombre:
              raw.categoria_nombre ?? this.mapCategoria(id_cat),
            estado_fisico: raw.estado_fisico || null,
          };

          return p;
        });

        this.productosAll = lista;

        if (idActual) {
          // 👇 MIS PRODUCTOS: TODOS (disponibles + baja)
          this.misProductos = lista.filter((p) => p.id_usuario === idActual);

          // 👇 EXPLORAR: solo productos de otros usuarios y disponibles
          this.productosBaseExplorar = lista.filter(
            (p) => p.id_usuario !== idActual && p.estado === 'disponible'
          );
        } else {
          this.misProductos = [];
          this.productosBaseExplorar = lista.filter(
            (p) => p.estado === 'disponible'
          );
        }

        this.aplicarFiltrosExplorar();
      },
      (err) => {
        console.error('Error al cargar productos', err);
        this.productosAll = [];
        this.productosBaseExplorar = [];
        this.productosExplorar = [];
        this.misProductos = [];
      }
    );
  }

  // ------------------------------------------------
  // FILTROS
  // ------------------------------------------------
  limpiarFiltros() {
    this.busqueda = '';
    this.categoriaSeleccionada = null;
    this.aplicarFiltrosExplorar();
  }

  onBuscar() {
    this.aplicarFiltrosExplorar();
  }

  private aplicarFiltrosExplorar() {
    const texto = (this.busqueda || '').toLowerCase().trim();
    const idCat = this.categoriaSeleccionada;

    const base = this.productosBaseExplorar;

    this.productosExplorar = base.filter((p) => {
      const coincideTexto =
        !texto ||
        p.titulo.toLowerCase().includes(texto) ||
        (p.descripcion || '').toLowerCase().includes(texto) ||
        (p.ubicacion || '').toLowerCase().includes(texto);

      const coincideCategoria =
        idCat === null || p.id_categoria === idCat;

      return coincideTexto && coincideCategoria;
    });
  }

  // ------------------------------------------------
  // UTILIDADES UI
  // ------------------------------------------------
  resolverImagen(url: string | null): string {
    // Si no hay imagen, usamos placeholder
    if (!url) {
      return 'assets/img/placeholder-producto.png';
    }

    // Si ya viene como URL absoluta, la dejamos tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Base del backend (sin "/api")
    const baseBackend = this.API.replace('/api', '');

    // Nos aseguramos de que la ruta empiece con "/"
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    return baseBackend + url;
  }

  // ------------------------------------------------
  // MATCH / SOLICITUD
  // ------------------------------------------------
  crearMatch(p: ProductoCard) {
    if (!this.isAuth) {
      alert('Inicia sesión para proponer un intercambio.');
      return;
    }

    this.productoObjetivo = p;

    // Por defecto, seleccionamos el primer producto propio (si hay)
    if (this.misProductos.length > 0) {
      this.productoOfreceId = this.misProductos[0].id_producto;
      this.productoOfreceSeleccionado = this.misProductos[0];
    } else {
      this.productoOfreceId = null;
      this.productoOfreceSeleccionado = null;
    }

    this.mensajeSolicitud = 'Me interesa tu producto';
    this.diferenciaPropuesta = null;
    this.guardandoSolicitud = false;
    this.busquedaMisProductos = '';
    this.mostrarModalSolicitud = true;
  }

  seleccionarProductoOfrece(mp: ProductoCard) {
    this.productoOfreceId = mp.id_producto;
    this.productoOfreceSeleccionado = mp;
  }

  cerrarModalSolicitud() {
    if (this.guardandoSolicitud) return;
    this.mostrarModalSolicitud = false;
  }

  enviarSolicitud() {
    if (!this.productoObjetivo) {
      alert('No se encontró el producto objetivo.');
      return;
    }

    this.guardandoSolicitud = true;

    // 👇 Aseguramos que sea número o null
    let diffNumber: number | null = null;
    if (this.diferenciaPropuesta !== null && this.diferenciaPropuesta !== undefined) {
      const parsed = Number(this.diferenciaPropuesta);
      diffNumber = isNaN(parsed) ? null : parsed;
    }

    const payload = {
      id_producto_objetivo: this.productoObjetivo.id_producto,
      id_producto_ofrece: this.productoOfreceId || undefined,
      mensaje: this.mensajeSolicitud || undefined,
      diferencia_propuesta: diffNumber,   // 👈 aquí ya va como número o null
    };

    console.log('Payload solicitud que se envía:', payload);

    this.solicitudes.crear(payload).subscribe({
      next: () => {
        this.guardandoSolicitud = false;
        this.mostrarModalSolicitud = false;
        alert('Solicitud enviada correctamente.');
      },
      error: (err) => {
        console.error('Error al crear solicitud', err);
        this.guardandoSolicitud = false;
        alert('Error al enviar la solicitud.');
      },
    });
  }

  // ------------------------------------------------
  // FORMULARIO / MODAL PRODUCTO
  // ------------------------------------------------
  private crearFormVacio() {
    return {
      id_producto: null as number | null,
      titulo: '',
      descripcion: '',
      id_categoria: null as number | null,
      ubicacion: '',
      valor_estimado: 0,
      estado_fisico: 'Usado',
    };
  }

  abrirFormularioNuevo() {
    if (!this.isAuth) {
      alert('Inicia sesión para publicar un producto.');
      return;
    }

    this.editando = false;
    this.form = this.crearFormVacio();
    this.previewUrl = null;
    this.archivo = null;
    this.guardando = false;
    this.mostrarFormulario = true;
  }

  prepararEditar(p: ProductoCard) {
    if (!this.isAuth) return;

    this.editando = true;
    this.form = {
      id_producto: p.id_producto,
      titulo: p.titulo,
      descripcion: p.descripcion,
      id_categoria: p.id_categoria ?? null,
      ubicacion: p.ubicacion,
      valor_estimado: p.valor_estimado,
      estado_fisico: p.estado_fisico || 'Usado',
    };

    this.previewUrl = p.imagen_url || null;
    this.archivo = null;
    this.guardando = false;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    if (this.guardando) return;
    this.mostrarFormulario = false;
  }

  onArchivoSeleccionado(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files?.length) {
      const file = (input.files[0] as File) || null;
      if (!file) return;

      this.archivo = file;
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  // ------------------------------------------------
  // CREAR / EDITAR PRODUCTO
  // ------------------------------------------------
  guardarProducto() {
    if (this.guardando) return;

    if (
      !this.form.titulo ||
      !this.form.descripcion ||
      !this.form.id_categoria ||
      !this.form.ubicacion ||
      this.form.valor_estimado <= 0
    ) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    this.guardando = true;

    const publicarOEditar = (imagen_url: string | null) => {
  const body: any = {
    id_categoria: this.form.id_categoria,
    titulo: this.form.titulo,
    descripcion: this.form.descripcion,
    valor_estimado: this.form.valor_estimado,
    ubicacion: this.form.ubicacion,
    imagen_url,
  };

  if (this.editando && this.form.id_producto) {
    const id = this.form.id_producto;
    this.http
      .put(`${this.API}/productos/${id}`, body, {
        headers: this.auth.authHeaders(),   // 👈 aquí
      })
      .subscribe(
        () => {
          this.guardando = false;
          this.mostrarFormulario = false;
          alert('Producto actualizado correctamente.');
          this.cargarProductos();
        },
        (err) => {
          console.error('Error al editar producto', err);
          this.guardando = false;
          alert('Error al editar producto.');
        }
      );
  } else {
    this.http
      .post(`${this.API}/productos`, body, {
        headers: this.auth.authHeaders(),   // 👈 y aquí
      })
      .subscribe(
        () => {
          this.guardando = false;
          this.mostrarFormulario = false;
          alert('Producto publicado correctamente.');
          this.cargarProductos();
        },
        (err) => {
          console.error('Error al crear producto', err);
          this.guardando = false;
          alert('Error al publicar producto.');
        }
      );
  }
};


    // Subida de imagen (si hay archivo nuevo)
    if (this.archivo) {
      const fd = new FormData();
      // 👇 MUY IMPORTANTE: el backend espera "archivo", no "file"
      fd.append('archivo', this.archivo);

      this.http
        .post<{ url: string }>(`${this.API}/upload`, fd, {
          headers: this.authHeaders(),
        })
        .subscribe(
          (res) => {
            const url = (res as any)?.url || null;
            publicarOEditar(url);
          },
          (err) => {
            console.error('Error al subir imagen', err);
            const urlExistente = this.editando ? this.previewUrl : null;
            publicarOEditar(urlExistente);
          }
        );
    } else {
      const urlExistente = this.editando ? this.previewUrl : null;
      publicarOEditar(urlExistente);
    }
  }

  // ------------------------------------------------
  // CAMBIAR ESTADO (BAJA / ALTA) CON CONFIRMACIÓN
  // ------------------------------------------------
  toggleEstado(p: ProductoCard) {
    if (!this.isAuth) return;

    // Si está disponible, primero preguntamos confirmación
    if (p.estado === 'disponible') {
      this.productoAConfirmarBaja = p;
      this.mostrarConfirmarBaja = true;
      return;
    }

    // Si ya está en baja, lo damos de alta directamente
    this.cambiarEstadoEnServidor(p);
  }

  private cambiarEstadoEnServidor(p: ProductoCard) {
  this.http
    .put(
      `${this.API}/productos/${p.id_producto}/estado`,
      {},
      { headers: this.auth.authHeaders() }   // 👈 directo desde AuthService
    )
    .subscribe(
      (res: any) => {
        const estadoBackend = (res?.estado || '').toString().toLowerCase();

        if (estadoBackend) {
          p.estado = estadoBackend; // 'disponible' o 'baja'
        } else {
          p.estado = p.estado === 'disponible' ? 'baja' : 'disponible';
        }
      },
      (err) => {
        console.error('Error al cambiar estado del producto', err);
        alert('Error al cambiar el estado del producto.');
      }
    );
}


  cancelarBaja() {
    if (this.guardandoBaja) return;
    this.mostrarConfirmarBaja = false;
    this.productoAConfirmarBaja = null;
  }

  confirmarBaja() {
    if (!this.productoAConfirmarBaja) return;

    this.guardandoBaja = true;

    const p = this.productoAConfirmarBaja;
    this.cambiarEstadoEnServidor(p);

    this.guardandoBaja = false;
    this.mostrarConfirmarBaja = false;
    this.productoAConfirmarBaja = null;
  }
}










