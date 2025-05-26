import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { MarketInfoItemComponent, type MarketInfoItemModel } from './market-info-item/market-info-item.component';
import { RatesService } from 'services/rates.service';
import { CurrentCurrencyService } from 'services/current-currency.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

const MARKET_INFO_COINS = ['BTC', 'ETH', 'USDC', 'USDT'];

@Component({
	selector: 'app-market-info',
	imports: [MarketInfoItemComponent],
	templateUrl: './market-info.component.html',
	styleUrl: './market-info.component.css',
})
export class MarketInfoComponent {
	private ratesService = inject(RatesService);
	private currentCurrencyService = inject(CurrentCurrencyService);
	private destroyRef = inject(DestroyRef);

	loading = signal(false);
	error = signal<unknown>(null);

	displayError = computed(() => !this.loading() && !!this.error());

	protected infos: MarketInfoItemModel[] = [];

	constructor() {
		effect(() => this.loadMarketInfo(this.currentCurrencyService.currentCurrency()));
	}

	private loadMarketInfo(currentCurrency: string) {
		this.loading.set(true);
		this.error.set(null);
		this.ratesService
			.ratesBulk()
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.loading.set(false)),
			)
			.subscribe({
				next: (ratesDto) => {
					this.infos = [];
					for (const coin of MARKET_INFO_COINS) {
						this.infos.push({
							shortName: coin,
							balance: ratesDto[coin][currentCurrency].rate,
							invertedBalance: ratesDto[currentCurrency][coin].rate,
						});
					}
				},
				error: (err) => {
					this.error.set(err);
				},
			});
	}
}
