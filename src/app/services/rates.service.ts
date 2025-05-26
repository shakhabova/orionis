import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import type { Observable } from 'rxjs';

export interface RateModel {
	from: string;
	to: string;
	provider: string;
	rate: number;
	exchangeRate: number;
	date: string;
	isInversed: boolean;
}

export type RatesBulkDto = Record<string, Record<string, RateModel>>;

@Injectable({
	providedIn: 'root',
})
export class RatesService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);

	ratesBulk(): Observable<RatesBulkDto> {
		return this.httpClient.get<RatesBulkDto>(
			`${this.configService.serverUrl}/v1/bff-custody/exchange/rates/bulk?from=BTC,ETH,USDC,USDT,EUR,GBP&to=BTC,ETH,USDC,USDT,EUR,GBP`,
		);
	}
}
