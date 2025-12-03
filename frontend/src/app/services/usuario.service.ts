import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PerfilPrivado {
  id_usuario: number;
  nombre_completo: string;
  correo: string;
  telefono?: string;
  ciudad?: string;
  estado?: string;
  avatar_url?: string;
}

export interface PerfilPublico {
  id_usuario: number;
  nombre_completo: string;
  ciudad?: string;
  estado?: string;
  avatar_url?: string;
  total_intercambios?: number;
  reputacion_promedio?: number;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Lo que usa mi-perfil y mi-perfil-dropdown
  obtenerMiPerfil(): Observable<PerfilPrivado> {
    return this.http.get<PerfilPrivado>(`${this.API}/mi-perfil`);
  }

  editarMiPerfil(payload: Partial<PerfilPrivado>): Observable<PerfilPrivado> {
    return this.http.put<PerfilPrivado>(`${this.API}/mi-perfil`, payload);
  }

  // Lo que usa perfil-publico
  obtenerPerfil(id_usuario: number): Observable<PerfilPublico> {
    return this.http.get<PerfilPublico>(`${this.API}/usuarios/${id_usuario}/perfil-publico`);
  }
}

