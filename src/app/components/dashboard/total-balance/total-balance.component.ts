import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { tuiDialog, TuiIcon } from '@taiga-ui/core';
import { BalanceService, type TotalBalanceCurrency } from 'services/balance.service';
import {
	ChooseBalanceCurrencyComponent,
	type ChooseBalanceDialogResultData,
} from './choose-balance-currency/choose-balance-currency.component';
import { CurrentCurrencyService } from 'services/current-currency.service';
import { TopUpComponent } from 'components/top-up/top-up.component';
import { UserService } from 'services/user.service';
import { switchMap } from 'rxjs';
import { WithdrawComponent } from 'components/withdraw/withdraw.component';
import { DialogService } from 'services/dialog.service';

@Component({
	selector: 'app-total-balance',
	imports: [TuiIcon, CurrencyPipe],
	templateUrl: './total-balance.component.html',
	styleUrl: './total-balance.component.scss',
})
export class TotalBalanceComponent implements OnInit {
	private balanceService = inject(BalanceService);
	private currentCurrencyService = inject(CurrentCurrencyService);
	private destroyRef = inject(DestroyRef);
	private dialogService = inject(DialogService);

	private chooseBalanceDialog = tuiDialog(ChooseBalanceCurrencyComponent, { size: 'auto' });

	private topUpDialog = tuiDialog(TopUpComponent, { size: 'auto' });
	private withdrawDialog = tuiDialog(WithdrawComponent, { size: 'auto' });

	balance = signal(0);
	currency = this.currentCurrencyService.currentCurrency;

	currencyIconLinks: Record<TotalBalanceCurrency, string> = {
		EUR: 'assets/icons/euro.svg',
		GBP: 'assets/icons/gbp.svg',
	};

	ngOnInit(): void {
		this.loadBalance();
	}

	topUp() {
		this.topUpDialog(undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
	}

	withdraw() {
		this.withdrawDialog(undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
	}

	chooseCurrency() {
		this.chooseBalanceDialog({ currentCurrency: this.currency() })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((currency) => {
				if (currency) {
					this.currency.set(currency.currency);
					this.currentCurrencyService.setCurrentCurrency(currency.currency);

					this.balance.set(currency.balance);
				}
			});
	}

	private loadBalance() {
		this.balanceService
			.getBalance([this.currency()])
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (balance) => {
					this.balance.set(balance[0].totalBalance);
				},
				error: (err) => {
					console.error(err);
					this.dialogService.showInfo({
						type: 'warning',
						title: 'Oops, something went wrong while loading total balance',
					});
				},
			});
	}

	private getCurrencyFromStorage(): TotalBalanceCurrency {
		return localStorage.getItem('TOTAL_BALANCE_CURRENCY') as TotalBalanceCurrency;
	}
}
