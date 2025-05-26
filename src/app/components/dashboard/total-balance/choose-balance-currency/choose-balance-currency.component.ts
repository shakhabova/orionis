import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, type OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogModule } from '@angular/material/dialog';
import type { TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';
import { finalize } from 'rxjs';
import { BalanceService, type TotalBalanceCurrency } from 'services/balance.service';
import { DialogService } from 'services/dialog.service';

export interface ChooseBalanceDialogResultData {
	balance: number;
	currency: TotalBalanceCurrency;
}

@Component({
	selector: 'app-choose-balance-currency',
	imports: [MatDialogModule, CurrencyPipe],
	templateUrl: './choose-balance-currency.component.html',
	styleUrl: './choose-balance-currency.component.css',
})
export class ChooseBalanceCurrencyComponent implements OnInit {
	private balanceService = inject(BalanceService);
	private destroyRef = inject(DestroyRef);
	private dialogService = inject(DialogService);

	public context =
		injectContext<
			TuiDialogContext<{ balance: number; currency: TotalBalanceCurrency }, { currentCurrency: TotalBalanceCurrency }>
		>();

	protected isLoading = signal(false);

	selected = signal<TotalBalanceCurrency>(this.context.data.currentCurrency || 'EUR');
	balances = signal<Record<TotalBalanceCurrency, number>>({
		EUR: 0,
		GBP: 0,
	});

	radioIcons: Map<boolean, string> = new Map([
		[true, 'assets/icons/radio-active.svg'],
		[false, 'assets/icons/radio-inactive.svg'],
	]);

	public ngOnInit(): void {
		this.isLoading.set(true);

		this.balanceService
			.getBalance(['EUR', 'GBP'])
			.pipe(
				finalize(() => this.isLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: ([EUR, GBP]) => this.balances.set({ EUR: EUR.totalBalance, GBP: GBP.totalBalance }),
				error: (err) => {
					console.error(err);
					this.dialogService.showInfo({
						type: 'warning',
						title: 'Oops, something went wrong while loading total balance',
					});
				},
			});
	}

	choose() {
		this.context.completeWith({
			balance: this.balances()[this.selected()],
			currency: this.selected(),
		});
	}
}
