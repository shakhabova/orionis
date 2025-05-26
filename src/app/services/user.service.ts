import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, finalize, map, type Observable, of, tap } from 'rxjs';
import type { MfaStatus } from './login-api.service';
import { ConfigService } from './config.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface UserInfoDto {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	country: string;
	city: string;
	zipCode: string;
	address: string;
	status: string;
	mfaStatus: MfaStatus;
	role: string;
	institutionId: string;
}

@Injectable({
	providedIn: 'root',
})
export class UserService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);
	private destroyRef = inject(DestroyRef);

	currentUser$ = new BehaviorSubject<UserInfoDto | null>(null);
	currentUserUpdating$ = new BehaviorSubject<boolean>(false);
	currentUserId$ = this.currentUser$.pipe(map((info) => info?.id));

	constructor() {
		this.updateCurrentUser();
	}

	getInfo(): Observable<UserInfoDto> {
		return this.httpClient.get<UserInfoDto>(`${this.configService.serverUrl}/v1/users/current`);
	}

	updateCurrentUser() {
		this.currentUserUpdating$.next(true);
		this.getInfo()
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => {
					this.currentUserUpdating$.next(false);
				}),
			)
			.subscribe({
				next: (info) => this.currentUser$.next(info),
			});
	}

	getUser(email: string): Observable<UserInfoDto> {
		return this.httpClient.get<UserInfoDto>(`${this.configService.serverUrl}/v1/internal/users`, {
			params: { email: decodeURIComponent(email) },
		});
	}

	clearCurrentUser(): void {
		this.currentUser$.next(null);
	}
}
