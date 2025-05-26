import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { TotalBalanceComponent } from './total-balance/total-balance.component';
import { WalletsComponent } from './wallets/wallets.component';
import { MarketInfoComponent } from './market-info/market-info.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { type UserInfoDto, UserService } from 'services/user.service';
import { CurrenciesService, type CurrencyDto } from 'services/currencies.service';
import { finalize, forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-dashboard',
	imports: [CommonModule, TotalBalanceComponent, WalletsComponent, MarketInfoComponent, TransactionsComponent],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
	private destroyRef = inject(DestroyRef);
	private userService = inject(UserService);
	private currenciesService = inject(CurrenciesService);

	protected userInfo: UserInfoDto | null = null;
	protected currencies: CurrencyDto[] = [];

	protected isLoading = signal(false);

	public ngOnInit(): void {
		this.loadInfo();
	}

	private loadInfo() {
		this.isLoading.set(true);

		forkJoin([this.userService.currentUser$, this.currenciesService.getCurrenciesRequest])
			.pipe(
				finalize(() => this.isLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: ([info, currencies]) => {
					this.userInfo = info;
					this.currencies = currencies;
				},
				error: (err) => {},
			});
	}
}
