import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { map, type Observable, shareReplay } from 'rxjs';

export interface CurrencyDto {
	cryptoCurrency: string;
	cryptoCurrencyName: string;
	logoUrl: string;
	shortName: string;
	scanUrl: string;
	scanWalletUrl: string;
}

@Injectable({
	providedIn: 'root',
})
export class CurrenciesService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);

	public getCurrenciesRequest = this.getCurrencies();

	private getCurrencies(): Observable<CurrencyDto[]> {
		return this.httpClient
			.get<CurrencyDto[]>(`${this.configService.serverUrl}/v1/bff-custody/dict/currencies`)
			.pipe(shareReplay({ bufferSize: 1, refCount: true }));
	}

	getCryptoInfo(crypto: string): Observable<CurrencyDto | undefined> {
		return this.getCurrenciesRequest.pipe(
			map((currencies) => currencies.find((curr) => curr.cryptoCurrency === crypto)),
		);
	}

	getCurrencyLinkUrl(currency: string): Observable<string> {
		return this.getCryptoInfo(currency).pipe(map((info) => `${this.configService.s3BucketLink}${info?.logoUrl}`));
	}

	getCurrencyName(currency: string): Observable<string> {
		return this.getCryptoInfo(currency).pipe(map((info) => info?.cryptoCurrencyName ?? ''));
	}
}
