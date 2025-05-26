import type { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Injector, inject, runInInjectionContext } from '@angular/core';
import { type Observable, Subject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { ACCESS_TOKEN_KEY, AuthService } from 'services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new Subject<string | null>();

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
	const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
	const injector = inject(Injector);

	if (req.url.includes('auth/srp/authenticate') || req.url.includes('auth/srp/refresh') || req.url.includes('users/registration')) {
		return next(req);
	}

	let reqCopy = req;
	if (accessToken) {
		reqCopy = addToken(req, accessToken);
	}

	return next(reqCopy).pipe(
		catchError((error) => {
			// Check if the error is due to an expired access token
			if (error.status === 401 && accessToken) {
				return runInInjectionContext(injector, () => {
					return handle401Error(reqCopy, next);
				});
			}

			return throwError(error);
		}),
	);
}

function addToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
	return request.clone({
		setHeaders: {
			Authorization: `Bearer ${token}`,
		},
	});
}

// function handleTokenExpired(
// 	request: HttpRequest<any>,
// 	next: HttpHandlerFn,
// ): Observable<HttpEvent<any>> {
// 	const authService = inject(AuthService);
// 	const router = inject(Router);
//
// 	// Call the refresh token endpoint to get a new access token
// 	return authService.refreshToken().pipe(
// 		switchMap(() => {
// 			const newAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
// 			// Retry the original request with the new access token
// 			return next(addToken(request, newAccessToken));
// 		}),
// 		catchError((error) => {
// 			// Handle refresh token error (e.g., redirect to login page)
// 			console.error('Error handling expired access token:', error);
// 			router.navigateByUrl('/auth/login');
// 			return throwError(() => new Error(error));
// 		}),
// 	);
// }

function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn) {
	const authService = inject(AuthService);

	if (!isRefreshing) {
		isRefreshing = true;
		refreshTokenSubject.next(null);

		return authService.refreshToken().pipe(
			switchMap((token) => {
				isRefreshing = false;
				refreshTokenSubject.next(token.accessToken);
				return next(addToken(request, token.accessToken));
			}),
		);
	}
	return refreshTokenSubject.pipe(
		filter((token) => token != null),
		take(1),
		switchMap((jwt) => {
			return next(addToken(request, jwt));
		}),
	);
}
