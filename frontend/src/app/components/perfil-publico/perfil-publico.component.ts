import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService, PerfilPublico } from '../../services/usuario.service';

@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="perfil-card" *ngIf="perfil">
      <div class="avatar">{{ iniciales }}</div>
      <div class="info">
        <p class="nombre">{{ perfil.nombre_completo }}</p>
      </div>
    </div>
  `,
  styles: [`
    .perfil-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b3a5, #0ea5e9);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
    }
    .info { flex: 1; }
    .nombre {
      margin: 0;
      font-weight: 600;
      font-size: 13px;
      color: #1f2937;
    }
  `]
})
export class PerfilPublicoComponent implements OnInit {
  @Input() id_usuario!: number;
  perfil: PerfilPublico | null = null;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    if (this.id_usuario) {
      this.usuarioService.obtenerPerfil(this.id_usuario).subscribe(
        (p) => (this.perfil = p)
      );
    }
  }

  get iniciales(): string {
    if (!this.perfil) return '?';
    const partes = this.perfil.nombre_completo.split(' ');
    return (partes[0]?.charAt(0) + (partes[1]?.charAt(0) || '')).toUpperCase();
  }
}
