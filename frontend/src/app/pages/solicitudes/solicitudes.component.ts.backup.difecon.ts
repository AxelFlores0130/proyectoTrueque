import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SolicitudesService } from "../../services/solicitudes.service";

@Component({
  standalone: true,
  selector: "app-solicitudes",
  imports: [CommonModule],
  template: `
    <h1>Mis Solicitudes</h1>
    <div class="tabs">
      <button (click)="tab='recibidas'" [class.active]="tab==='recibidas'">Recibidas</button>
      <button (click)="tab='enviadas'" [class.active]="tab==='enviadas'">Enviadas</button>
    </div>

    <ul class="list" *ngIf="tab==='recibidas'">
      <li *ngFor="let s of recibidas">
        <div>
          <strong>Solicitud #{{ s.id_solicitud }}</strong>
          <div class="meta">Estado: {{ s.estado }} · {{ s.ubicacion || 'Sin ubicación' }}</div>
          <p *ngIf="s.mensaje">{{ s.mensaje }}</p>
        </div>
        <div class="actions">
          <button class="btn primary" (click)="aceptar(s.id_solicitud)" [disabled]="s.estado!=='pendiente'">Aceptar</button>
          <button class="btn outline" (click)="rechazar(s.id_solicitud)" [disabled]="s.estado!=='pendiente'">Rechazar</button>
        </div>
      </li>
    </ul>

    <ul class="list" *ngIf="tab==='enviadas'">
      <li *ngFor="let s of enviadas">
        <div>
          <strong>Solicitud #{{ s.id_solicitud }}</strong>
          <div class="meta">Estado: {{ s.estado }} · {{ s.ubicacion || 'Sin ubicación' }}</div>
          <p *ngIf="s.mensaje">{{ s.mensaje }}</p>
        </div>
        <div class="actions">
          <button class="btn outline" (click)="cancelar(s.id_solicitud)" [disabled]="s.estado!=='pendiente'">Cancelar</button>
        </div>
      </li>
    </ul>
  `,
  styles:[`
    .tabs{display:flex;gap:8px;margin:8px 0}
    .tabs button{padding:8px 12px;border-radius:9999px;border:1px solid #e5e7eb;background:#fff}
    .tabs .active{background:#10b3a5;color:#fff;border-color:#10b3a5}
    .list{display:grid;gap:10px;padding:0}
    .list li{list-style:none;border:1px solid #e5e7eb;border-radius:12px;padding:12px;display:flex;justify-content:space-between;gap:10px}
    .meta{color:#64748b}
    .btn{padding:8px 12px;border-radius:10px;cursor:pointer}
    .primary{background:#10b3a5;color:#fff;border:none}
    .outline{background:#fff;border:1px solid #e5e7eb}
    .actions{display:flex;gap:8px}
  `]
})
export class SolicitudesComponent implements OnInit {
  private s = inject(SolicitudesService);
  tab:"recibidas"|"enviadas" = "recibidas";
  recibidas:any[]=[]; enviadas:any[]=[];

  ngOnInit(){ this.load(); }
  load(){ this.s.recibidas().subscribe(r => this.recibidas=r||[]); this.s.enviadas().subscribe(r => this.enviadas=r||[]); }
  aceptar(id:number){ this.s.aceptar(id).subscribe(_ => this.load()); }
  rechazar(id:number){ this.s.rechazar(id).subscribe(_ => this.load()); }
  cancelar(id:number){ this.s.cancelar(id).subscribe(_ => this.load()); }
}
