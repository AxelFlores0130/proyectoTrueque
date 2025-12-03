import { inject } from "@angular/core";
import { CanMatchFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.getToken()) return true;
  router.navigateByUrl("/login");
  return false;
};

export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = (typeof auth.getUser === 'function') ? auth.getUser() : null;
  if (auth.getToken() && user && user.rol === 'administrador') return true;
  router.navigateByUrl("/");
  return false;
};
