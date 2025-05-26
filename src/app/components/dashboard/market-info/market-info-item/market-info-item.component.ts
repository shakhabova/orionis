import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { CurrenciesService } from 'services/currencies.service';
import { CurrentCurrencyService } from 'services/current-currency.service';

export interface MarketInfoItemModel {
	shortName: string;
	balance: number;
	invertedBalance: number;
}

@Component({
	selector: 'app-market-info-item',
	imports: [CurrencyPipe, AsyncPipe, TuiSkeleton],
	templateUrl: './market-info-item.component.html',
	styleUrl: './market-info-item.component.css',
})
export class MarketInfoItemComponent {
	public info = input.required<MarketInfoItemModel>();
	public loading = input.required<boolean>();

	protected shortName = computed(() => this.info().shortName);
	// protected fullName = computed(() => this.info().fullName);
	protected balance = computed(() => (this.loading() ? '' : this.info().balance));
	protected invertedBalance = computed(() => this.info().invertedBalance);

	private currentCurrencyService = inject(CurrentCurrencyService);
	private cryptoService = inject(CurrenciesService);

	cryptoIcon = computed(() => this.cryptoService.getCurrencyLinkUrl(this.shortName()));
	fullName = computed(() => this.cryptoService.getCurrencyName(this.shortName()));
	protected currentCurrency = this.currentCurrencyService.currentCurrency;

	protected rate = computed(() =>
		this.loading() ? '' : `1 ${this.currentCurrency()} = ${this.invertedBalance().toFixed(7)} ${this.shortName()}`,
	);
}
