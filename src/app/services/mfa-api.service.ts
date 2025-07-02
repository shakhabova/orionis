import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface SubmitResetInfo {
	email: string;
	otp: string;
}

export interface SubmitResetMfaDto {
	qr: string;
	secret: string;
}

@Injectable({
	providedIn: 'root',
})
export class MfaApiService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);

	resetMfa(email: string): Observable<void> {
		return this.httpClient.post<void>(`${this.configService.serverUrl}/v1/auth/srp/reset-mfa`, { email });
	}

	submitResetMfa(req: SubmitResetInfo): Observable<SubmitResetMfaDto> {
		return this.httpClient.post<SubmitResetMfaDto>(`${this.configService.serverUrl}/v1/auth/srp/reset-mfa/submit`, req);
	}

	rejectMfa(email: string, userId: number): Observable<void> {
		return this.httpClient.put<void>(`${this.configService.serverUrl}/v1/users/mfa-status?mfaStatus=REJECTED`, null, {
			headers: { 'Custody-User-ID': userId?.toString?.() },
		});
	}
}
