import { Injectable, model, signal, type WritableSignal } from '@angular/core';
import type { TotalBalanceCurrency } from './balance.service';

@Injectable({
	providedIn: 'root',
})
export class CurrentCurrencyService {
	currentCurrency: WritableSignal<TotalBalanceCurrency> = signal(this.getCurrencyFromStorage() || 'EUR');

	public setCurrentCurrency(currency: TotalBalanceCurrency): void {
		this.currentCurrency.set(currency);
		localStorage.setItem('TOTAL_BALANCE_CURRENCY', currency);
	}

	private getCurrencyFromStorage(): TotalBalanceCurrency | null {
		return localStorage.getItem('TOTAL_BALANCE_CURRENCY') as TotalBalanceCurrency;
	}
}
