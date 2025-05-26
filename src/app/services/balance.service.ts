import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { type Observable, switchMap } from 'rxjs';
import { UserService } from './user.service';
import { environment } from '../../environment/environment';

export type TotalBalanceCurrency = 'EUR' | 'GBP';

export interface TotalBalanceDto {
	currency: TotalBalanceCurrency;
	customerId: string;
	totalBalance: number;
}

@Injectable({
	providedIn: 'root',
})
export class BalanceService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);
	private userService = inject(UserService);

	getBalance(currency: TotalBalanceCurrency[]): Observable<TotalBalanceDto[]> {
		return this.httpClient.get<TotalBalanceDto[]>(
			`${this.configService.serverUrl}/v1/bff-custody/wallets/customer/total-balance`,
			{
				params: { currency },
				headers: { 'Customer-ID': environment.customerId },
			},
		);
	}
}
