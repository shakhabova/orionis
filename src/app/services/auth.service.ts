import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { catchError, combineLatest, delayWhen, filter, map, type Observable, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from './user.service';

export interface RefreshTokenDto {
	accessToken: string;
	refreshToken: string;
}

export const ACCESS_TOKEN_KEY = 'AUTH_TOKEN';
const REFRESH_TOKEN_KEY = 'AUTH_REFRESH_TOKEN';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);
	private router = inject(Router);
	private userService = inject(UserService);

	private refreshTokenEndpoint = '/v1/auth/srp/refresh';

	public get isAuthenticated$() {
		return combineLatest([this.userService.currentUser$, this.userService.currentUserUpdating$]).pipe(
			filter(([_, updating]) => !updating),
			catchError(() => of([null])),
			map(([user]) => !!user),
		);
	}

	public refreshToken(): Observable<RefreshTokenDto> {
		const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

		return this.httpClient
			.post<RefreshTokenDto>(`${this.configService.serverUrl}/${this.refreshTokenEndpoint}`, { refreshToken })
			.pipe(
				tap((response) => {
					// Update the access token in the local storage
					localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
					localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
				}),
				catchError((error) => {
					// Handle refresh token error (e.g., redirect to login page)
					console.error('Error refreshing access token:', error);
					return throwError(() => error);
				}),
			);
	}

	saveToken(accessToken: string | undefined, refreshToken: string | undefined) {
		if (!accessToken || !refreshToken) {
			return;
		}

		localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
		localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
	}

	logout() {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
		this.userService.clearCurrentUser();
		this.router.navigateByUrl('/auth/login');
	}
}
