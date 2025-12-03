const fs = require('fs');
const p = 'src/app/pages/productos/productos.component.ts';
const s = `
import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ProductosService } from "../../services/productos.service";

@Component({
  standalone: true,
  selector: "app-productos",
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Productos</h2>

    <form (ngSubmit)="publicar()" style="margin:12px 0; padding:12px; border:1px solid #ddd; border-radius:8px;">
      <h3>Publicar rápido</h3>
      <input [(ngModel)]="p.titulo" name="titulo" placeholder="Título" required />
      <input [(ngModel)]="p.id_categoria" name="id_categoria" placeholder="ID categoría (1-6)" type="number" required />
      <input [(ngModel)]="p.valor_estimado" name="valor" placeholder="Valor estimado" type="number" required />
      <input [(ngModel)]="p.imagen_url" name="img" placeholder="URL imagen (opcional)" />
      <textarea [(ngModel)]="p.descripcion" name="desc" placeholder="Descripción"></textarea>
      <button>Publicar</button>
      <span style="color:green" *ngIf="ok">{{ ok }}</span>
      <span style="color:red" *ngIf="err">{{ err }}</span>
    </form>

    <ul>
      <li *ngFor="let x of items">
        <strong>{{ x.titulo }}</strong> - Precio: {{ x.valor_estimado }} - Cat {{ x.id_categoria }}
      </li>
    </ul>
  `
})
export class ProductosComponent implements OnInit {
  private api = inject(ProductosService);
  items:any[]=[]; ok=""; err="";
  p:any = { titulo:"", id_categoria:1, valor_estimado:0, imagen_url:"", descripcion:"" };

  ngOnInit(){ this.cargar(); }
  cargar(){ this.api.listar().subscribe(r => this.items = r); }

  publicar(){
    this.ok=""; this.err="";
    this.api.crear(this.p).subscribe({
      next: _ => {
        this.ok="Publicado";
        this.p={ titulo:"", id_categoria:1, valor_estimado:0, imagen_url:"", descripcion:"" };
        this.cargar();
      },
      error: e => this.err = (e && e.error && e.error.msg) ? e.error.msg : "Error"
    });
  }
}
`;
fs.writeFileSync(p, s, { encoding: 'utf8' });
console.log('OK: productos.component.ts reescrito limpio');
