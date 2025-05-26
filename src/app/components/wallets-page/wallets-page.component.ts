import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, NgZone, type OnInit, computed, inject, model, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TuiTable } from '@taiga-ui/addon-table';
import { tuiPure } from '@taiga-ui/cdk';
import { TuiDataList, TuiDropdown, TuiIcon, TuiLoader, tuiDialog } from '@taiga-ui/core';
import { TuiFilterByInputPipe } from '@taiga-ui/kit';
import { TuiComboBoxModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import {
	BehaviorSubject,
	type Observable,
	Subscription,
	catchError,
	debounceTime,
	filter,
	finalize,
	map,
	mergeMap,
	of,
	scan,
	tap,
	throttleTime,
} from 'rxjs';
import { ConfigService } from 'services/config.service';
import { CurrenciesService, type CurrencyDto } from 'services/currencies.service';
import { type GetWalletsParams, type WalletDto, WalletsService } from 'services/wallets.service';
import { WalletStatusChipComponent } from '../shared/wallet-status-chip/wallet-status-chip.component';
import { CreateWalletModalComponent } from './create-wallet-modal/create-wallet-modal.component';
import { WalletInfoCardComponent } from './wallet-info-card/wallet-info-card.component';
import { WalletItemOptionComponent } from './wallet-item-option/wallet-item-option.component';
import { DialogService } from 'services/dialog.service';
import { CopyIconComponent } from '../shared/copy-icon/copy-icon.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { EmptyDisplayComponent } from '../shared/empty-display/empty-display.component';
import { ErrorDisplayComponent } from '../shared/error-display/error-display.component';
import { explicitEffect } from 'ngxtension/explicit-effect';

@Component({
	selector: 'app-wallets-page',
	imports: [
		TuiComboBoxModule,
		TuiSelectModule,
		TuiIcon,
		FormsModule,
		TuiTable,
		TuiTextfieldControllerModule,
		TuiDropdown,
		TuiDataList,
		WalletStatusChipComponent,
		AsyncPipe,
		WalletItemOptionComponent,
		PaginatorModule,
		TuiFilterByInputPipe,
		RouterModule,
		WalletInfoCardComponent,
		ScrollingModule,
		CopyIconComponent,
		LoaderComponent,
		EmptyDisplayComponent,
		ErrorDisplayComponent,
		TuiLoader,
	],
	templateUrl: './wallets-page.component.html',
	styleUrl: './wallets-page.component.css',
})
export class WalletsPageComponent implements OnInit {
	private ngZone = inject(NgZone);
	private cryptocurrenciesService = inject(CurrenciesService);
	private walletsService = inject(WalletsService);
	private destroyRef = inject(DestroyRef);
	private createWalletDialog = tuiDialog(CreateWalletModalComponent, { size: 'auto' });
	public configService = inject(ConfigService);
	private router = inject(Router);
	private dialogService = inject(DialogService);

	public viewport = viewChild(CdkVirtualScrollViewport);
	viewportScrolled = computed(() => this.viewport()?.elementScrolled?.());

	protected cryptocurrencies = signal<CurrencyDto[]>([]);
	protected selectedCurrency = model<CurrencyDto | null>(null);
	protected isLoading = signal(false);
	protected page = signal(0);
	protected pageSize = 10;
	protected totalElements = signal(0);

	protected wallets = signal<WalletDto[]>([]);
	protected columns = ['trxAddress', 'availableOprBalance', 'walletStatus', 'actions'];
	protected open = false;

	private loadBatch = new BehaviorSubject<boolean | void>(void 0);
	public mobileWallets$: Observable<WalletDto[] | undefined>;
	isMobileLoading = signal(false);
	error = signal<unknown>(null);

	isEmpty = computed(() => !this.isLoading() && !this.wallets()?.length && !this.hasError());
	hasError = computed(() => !this.isLoading() && !!this.error());

	isMobileEmpty = computed(() => !this.isMobileLoading() && !this.hasMobileError());
	hasMobileError = computed(() => !this.isMobileLoading() && !!this.error());

	constructor() {
		explicitEffect([this.selectedCurrency], ([currency]) => {
			this.page.set(0);
			this.loadBatch.next(true);
			this.loadWallets(currency?.cryptoCurrency);
		});

		let toClear: boolean | void = false;
		this.mobileWallets$ = this.loadBatch.pipe(
			filter(() => this.configService.isMobile()),
			throttleTime(500),
			tap((clear) => (toClear = clear)),
			tap(() => {
				this.isMobileLoading.set(true);
				if (this.page() === 0) {
					this.isLoading.set(true);
				}
			}),
			mergeMap(() => this.getWallets()),
			scan((acc, batch) => {
				if (!acc || !batch) {
					return [];
				}

				if (toClear) {
					return batch;
				}

				return [...acc, ...batch];
			}),
			tap(() => {
				this.isMobileLoading.set(false);
				this.isLoading.set(false);
			}),
			catchError((err) => {
				console.error(err);
				this.error.set(err);
				this.isMobileLoading.set(false);
				this.isLoading.set(false);
				return of([]);
			}),
		);

		explicitEffect([this.viewport], ([viewport]) => {
			let sub: Subscription | undefined;
			this.ngZone.runOutsideAngular(() => {
				sub = viewport
					?.elementScrolled()
					.pipe(debounceTime(300))
					.subscribe(() => {
						const scrollingLeft =
							viewport.measureRenderedContentSize() -
							viewport.measureViewportSize('vertical') -
							viewport.measureScrollOffset();

						if (scrollingLeft > 0) {
							return;
						}

						this.ngZone.run(() => this.nextBatch());
					});
			});

			return () => sub?.unsubscribe();
		});
	}

	ngOnInit() {
		this.loadCurrencies();
	}

	openDetails(wallet: WalletDto): void {
		this.router.navigate(['wallets', wallet.trxAddress]);
	}

	navigateDetails(wallet: WalletDto): void {
		this.router.navigateByUrl(`/wallets/${wallet.trxAddress}`);
	}

	nextBatch() {
		const end = this.viewport()?.getRenderedRange().end;
		const total = this.viewport()?.getDataLength();
		if (end === total) {
			if ((this.page() + 1) * this.pageSize >= this.totalElements()) {
				return;
			}
			this.page.update((n) => {
				return n + 1;
			});
			this.loadBatch.next();
		}
	}

	createWallet() {
		this.createWalletDialog()
			.pipe(
				filter((toUpdate) => !!toUpdate),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe(() => {
				this.loadWallets();
			});
	}

	trackById(i: number): number {
		return i;
	}

	@tuiPure
	getCryptoIcon(crypto: string): Observable<string> {
		return this.cryptocurrenciesService.getCurrencyLinkUrl(crypto);
	}

	onPageChange(state: PaginatorState) {
		if (state.page != null) {
			this.page.set(state.page);
			this.loadWallets();
		}
	}

	onBlock(wallet: WalletDto): void {
		this.walletsService
			.blockWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => (wallet.walletStatus = 'CUSTOMER_BLOCKED'),
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
	}

	onUnblock(wallet: WalletDto): void {
		this.walletsService
			.unblockWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => (wallet.walletStatus = 'ACTIVE'),
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
	}

	onDeactivate(wallet: WalletDto): void {
		this.walletsService
			.deactivateWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => (wallet.walletStatus = 'DEACTIVATED'),
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
	}

	stringifyCryptoSelectItem(item: CurrencyDto): string {
		return item.cryptoCurrencyName;
	}

	currencyMatcher(item: CurrencyDto, search: string): boolean {
		return (
			item.cryptoCurrency.toLowerCase().includes(search.toLowerCase()) ||
			item.cryptoCurrencyName.toLowerCase().includes(search.toLowerCase())
		);
	}

	private loadWallets(selectedCurrency?: string) {
		if (this.configService.isMobile()) {
			return;
		}

		this.error.set(null);
		this.isLoading.set(true);
		const params: GetWalletsParams = {
			statusIn: ['ACTIVE', 'CUSTOMER_BLOCKED', 'DEACTIVATED'],
			page: this.page(),
			size: this.pageSize,
			sort: 'id,desc',
		};
		if (selectedCurrency) {
			params.cryptocurrency = selectedCurrency;
		}

		this.walletsService
			.getWallets(params)
			.pipe(
				finalize(() => this.isLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: (walletsResponse) => {
					this.wallets.set(walletsResponse.data);
					this.totalElements.set(walletsResponse.totalElements);
				},
				error: (err) => {
					console.error(err);
					this.error.set(err);
				},
			});
	}

	private getWallets(): Observable<WalletDto[]> {
		const params: GetWalletsParams = {
			statusIn: ['ACTIVE', 'CUSTOMER_BLOCKED', 'DEACTIVATED'],
			page: this.page(),
			size: this.pageSize,
			sort: 'id,desc',
		};
		const crypto = this.selectedCurrency()?.cryptoCurrency;
		if (crypto) {
			params.cryptocurrency = crypto;
		}
		return this.walletsService.getWallets(params).pipe(
			map((res) => {
				this.totalElements.set(res.totalElements);
				return res.data;
			}),
		);
	}

	private loadCurrencies() {
		this.cryptocurrenciesService.getCurrenciesRequest
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((currencies) => this.cryptocurrencies.set(currencies));
	}
}
