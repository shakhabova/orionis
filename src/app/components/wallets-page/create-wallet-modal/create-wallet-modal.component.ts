import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { tuiPure } from '@taiga-ui/cdk';
import { type TuiDialogContext, TuiIcon, TuiScrollbar } from '@taiga-ui/core';
import { forkJoin, map, type Observable, of, switchMap, tap } from 'rxjs';
import { CurrenciesService, type CurrencyDto } from 'services/currencies.service';
import { WalletsService } from 'services/wallets.service';
import { injectContext } from '@taiga-ui/polymorpheus';
import { UserService } from 'services/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from 'services/dialog.service';

@Component({
	selector: 'app-create-wallet-modal',
	imports: [AsyncPipe],
	templateUrl: './create-wallet-modal.component.html',
	styleUrl: './create-wallet-modal.component.css',
})
export class CreateWalletModalComponent {
	private currenciesService = inject(CurrenciesService);
	private walletService = inject(WalletsService);
	private userService = inject(UserService);
	private destroyRef = inject(DestroyRef);
	private dialogService = inject(DialogService);

	public readonly context = injectContext<TuiDialogContext<boolean, void>>();

	selected = signal('');

	radioIcons: Map<boolean, string> = new Map([
		[true, 'assets/icons/radio-active.svg'],
		[false, 'assets/icons/radio-inactive.svg'],
	]);

	cryptos$ = this.walletService.getEligibleCryptos().pipe(
		switchMap((eligibles) => {
			if (!eligibles?.length) {
				return of([]);
			}

			return forkJoin(
				eligibles.map((eligibleCrypto) =>
					this.currenciesService.getCurrenciesRequest.pipe(
						map((cryptoInfos) => cryptoInfos.find((info) => info.cryptoCurrency === eligibleCrypto.cryptoCurrency)),
					),
				),
			);
		}),
		map((cryptos) => cryptos.filter((crypto) => !!crypto)),
		tap((cryptos) => {
			if (!cryptos?.length) {
				this.dialogService
					.showInfo({
						type: 'empty',
						title: 'Unsuccessful operation',
						text: 'No available cryptocurrency to create a wallet.',
					})
					.subscribe(() => this.context.completeWith(false));
			}
		}),
	);

	selectCrypto(crypto?: CurrencyDto): void {
		if (!crypto) return;

		this.selected.set(crypto.cryptoCurrency);
	}

	closeModal(): void {
		this.context.completeWith(false);
	}

	@tuiPure
	getCryptoIcon(crypto?: string): Observable<string> {
		if (!crypto) return of('');

		return this.currenciesService.getCurrencyLinkUrl(crypto);
	}

	confirm() {
		const selected = this.selected();
		const currentUser = this.userService.currentUser$.value;
		if (!selected || !currentUser) {
			return;
		}

		this.walletService
			.createWallet(selected, currentUser)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () =>
					this.dialogService
						.showInfo({
							type: 'success',
							title: 'Successfull operation!',
							text: 'Your order for a new wallet has been completed successfully.',
						})
						.subscribe(() => this.context.completeWith(true)),
				error: (err) => {
					console.error(err);
					this.dialogService
						.showInfo({
							type: 'warning',
							title: 'Error',
							text: 'An unexpected error has appeared. Please try again later.',
						})
						.subscribe();
				},
			});

		// this.context.completeWith(!!this.selected());
	}
}
