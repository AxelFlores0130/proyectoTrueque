import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ProductosService } from "../../services/productos.service";
import { AuthService } from "../../services/auth.service";
import { SolicitudesService } from "../../services/solicitudes.service";
import { environment } from "../../../environments/environment";

@Component({
  standalone: true,
  selector: "app-productos",
  imports: [CommonModule, FormsModule],
  template: `
    <h1 style="margin:0 0 12px">Productos</h1>

    <div class="toolbar">
      <input [(ngModel)]="f.q" placeholder="Buscar..." />
      <input [(ngModel)]="f.ubicacion" placeholder="Ubicación" />
      <button class="btn primary" (click)="cargar()">Buscar</button>
      <button class="btn ghost" (click)="limpiar()">Limpiar</button>
      <span class="sp"></span>
      <a class="btn primary" *ngIf="auth.isAuth()" (click)="showForm = !showForm">{{ showForm ? "Cerrar" : "Publicar producto" }}</a>
      <a class="btn ghost" *ngIf="!auth.isAuth()" routerLink="/login">Inicia sesión para publicar</a>
    </div>

    <div class="card" *ngIf="showForm && auth.isAuth()">
      <h3>Publicar</h3>
      <form (ngSubmit)="publicar()" class="grid">
        <input [(ngModel)]="p.titulo" name="titulo" placeholder="Título" required />
        <select [(ngModel)]="p.id_categoria" name="id_categoria" required>
          <option [ngValue]="null" disabled>Selecciona categoría</option>
          <option *ngFor="let c of cats" [ngValue]="c.id_categoria">{{ c.nombre }}</option>
        </select>
        <input [(ngModel)]="p.valor_estimado" name="valor" placeholder="Valor estimado" type="number" required />
        <input [(ngModel)]="p.ubicacion" name="ubicacion" placeholder="Ciudad, Estado" />
        <label class="uploader">
          <input type="file" (change)="onFile($event)" />
          <span>{{ p.imagen_url ? "Imagen cargada" : "Subir imagen..." }}</span>
        </label>
        <textarea [(ngModel)]="p.descripcion" name="descripcion" placeholder="Descripción" class="col2"></textarea>
        <button class="btn primary col2">Publicar</button>
      </form>
      <div><span class="ok" *ngIf="ok">{{ ok }}</span><span class="error" *ngIf="err">{{ err }}</span></div>
    </div>

    <ul class="cards">
      <li *ngFor="let x of items">
        <img *ngIf="x.imagen_url" [src]="x.imagen_url" alt="img" />
        <div class="info">
          <strong>{{ x.titulo }}</strong>
          <div class="meta">{{ x.valor_estimado | currency:"MXN":"symbol-narrow" }} · Cat {{ x.id_categoria }} <span *ngIf="x.ubicacion">· {{ x.ubicacion }}</span></div>
          <p *ngIf="x.descripcion" class="desc">{{ x.descripcion }}</p>

          <div class="actions">
            <button class="btn outline" *ngIf="isMine(x)" (click)="cambiarEstado(x, x.estado === 'baja' ? 'disponible' : 'baja')">
              {{ x.estado === 'baja' ? "Dar de alta" : "Dar de baja" }}
            </button>
            <button class="btn primary" *ngIf="!isMine(x) && auth.isAuth()" (click)="meInteresa(x)">Me interesa</button>
            <a class="btn ghost" *ngIf="!auth.isAuth()" routerLink="/login">Inicia sesión para hacer match</a>
          </div>
        </div>
      </li>
    </ul>
  `,
  styles: [`
    .toolbar{display:flex;gap:10px;align-items:center;margin:10px 0}
    .toolbar input{padding:10px;border:1px solid #e5e7eb;border-radius:10px}
    .sp{flex:1 1 auto}
    .btn{padding:8px 12px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-block}
    .primary{background:#10b3a5;color:#fff;border:none}
    .ghost{background:#0f172a10;color:#0f172a;border:1px solid #0f172a30}
    .outline{background:#fff;border:1px solid #e5e7eb}
    .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:12px 0}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .col2{grid-column:1/3}
    .uploader{display:flex;align-items:center;gap:8px}
    .uploader input{display:none}
    .ok{color:#16a34a}.error{color:#e11d48}
    .cards{display:grid;gap:12px;padding:0;margin:16px 0}
    .cards li{list-style:none;display:flex;gap:12px;border:1px solid #e5e7eb;border-radius:12px;padding:10px}
    .cards img{width:92px;height:92px;object-fit:cover;border-radius:10px}
    .meta{color:#64748b}
    .desc{margin:.25rem 0}
    .actions{display:flex;gap:8px}
    @media (max-width: 640px){
      .grid{grid-template-columns:1fr}
      .col2{grid-column:auto}
      .cards li{flex-direction:column}
      .cards img{width:100%;height:180px}
    }
  `]
})
export class ProductosComponent implements OnInit {
  private api = inject(ProductosService);
  auth = inject(AuthService);
  private sol = inject(SolicitudesService);

  items:any[]=[]; cats:any[]=[];
  ok=""; err=""; showForm=false;

  f:any = { q:"", ubicacion:"" };
  p:any = { titulo:"", id_categoria:null, valor_estimado:0, imagen_url:"", descripcion:"", ubicacion:"", estado:"disponible" };

  // añadir propiedades para edición
  editingId: number | null = null;

  ngOnInit(){ this.cargar(); this.api.categorias().subscribe(r => this.cats = r || []); }

  isMine(x:any){ return this.auth.getUser()?.id_usuario === x.id_usuario; }

  // abrir edición
  editar(item:any){
    this.showForm = true;
    this.editingId = item.id_producto;
    this.p = { 
      titulo: item.titulo,
      id_categoria: item.id_categoria,
      valor_estimado: item.valor_estimado,
      imagen_url: item.imagen_url,
      descripcion: item.descripcion,
      ubicacion: item.ubicacion,
      estado: item.estado
    };
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  cargar(){ this.api.listar(this.f).subscribe(r => this.items = r || []); }
  limpiar(){ this.f = { q:"", ubicacion:"" }; this.cargar(); }

  onFile(ev:any){
    const file = (ev?.target?.files || [])[0];
    if(!file) return;
    this.api.upload(file).subscribe({
      next: r => {
        const base = environment.apiUrl.replace(/\/api$/, "");
        this.p.imagen_url = r.url?.startsWith("http") ? r.url : (base + r.url);
      },
      error: _ => this.err = "No se pudo subir la imagen"
    });
  }

  publicar(){
    this.ok=""; this.err="";
    const body = { ...this.p, estado: this.p.estado || "disponible" };
    if(this.editingId){
      // editar
      this.api.actualizar(this.editingId, body).subscribe({
        next: _ => { this.ok="Producto actualizado"; this.editingId = null; this.p={ titulo:"", id_categoria:null, valor_estimado:0, imagen_url:"", descripcion:"", ubicacion:"", estado:"disponible" }; this.cargar(); },
        error: e => this.err = e?.error?.msg || "No se pudo actualizar"
      });
    } else {
      // crear
      this.api.crear(body).subscribe({
        next: _ => { this.ok="Publicado"; this.p={ titulo:"", id_categoria:null, valor_estimado:0, imagen_url:"", descripcion:"", ubicacion:"", estado:"disponible" }; this.cargar(); },
        error: e => this.err = e?.error?.msg || "Debes iniciar sesión"
      });
    }
  }

  cambiarEstado(x:any, estado:string){
    this.api.actualizarEstado(x.id_producto, estado).subscribe({
      next: _ => this.cargar(),
      error: _ => this.err = "No autorizado o error"
    });
  }

  meInteresa(x:any){
    const payload:any = {
      id_producto_objetivo: x.id_producto,
      mensaje: "Hola, me interesa tu producto",
      ubicacion: this.auth.getUser()?.ubicacion || "",
      fecha_propuesta: null
    };
    this.sol.crear(payload).subscribe({
      next: _ => this.ok = "Solicitud enviada",
      error: e => this.err = e?.error?.msg || "No se pudo enviar la solicitud"
    });
  }
}
