import {
	Component,
	computed,
	DestroyRef,
	inject,
	Injector,
	input,
	NgZone,
	OnInit,
	signal,
	viewChild,
} from '@angular/core';
import { TopUpWithdrawButtonsComponent } from '../shared/top-up-withdraw-buttons/top-up-withdraw-buttons.component';
import { TuiButton, TuiDialogService, TuiIcon, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransactionStatusChipComponent } from '../shared/transaction-status-chip/transaction-status-chip.component';
import { TransactionTypeIconComponent } from '../shared/transaction-type-icon/transaction-type-icon.component';
import {
	type TransactionDto,
	type TransactionPageableParams,
	TransactionsService,
} from 'services/transactions.service';
import { Paginator, PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { CopyIconComponent } from '../shared/copy-icon/copy-icon.component';
import { TuiTable } from '@taiga-ui/addon-table';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { tuiPure } from '@taiga-ui/cdk';
import {
	BehaviorSubject,
	catchError,
	debounceTime,
	filter,
	finalize,
	map,
	mergeMap,
	type Observable,
	of,
	scan,
	Subscription,
	tap,
} from 'rxjs';
import { CurrenciesService } from 'services/currencies.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	type TransactionFilterModel,
	TransactionsFilterModalComponent,
} from './transactions-filter-modal/transactions-filter-modal.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { format } from 'date-fns';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { ConfigService } from 'services/config.service';
import { TransactionItemComponent } from '../dashboard/transactions/transaction-item/transaction-item.component';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { isTransactionIn } from './utils';
import { LoaderComponent } from '../shared/loader/loader.component';
import { EmptyDisplayComponent } from '../shared/empty-display/empty-display.component';
import { ErrorDisplayComponent } from '../shared/error-display/error-display.component';
import { explicitEffect } from 'ngxtension/explicit-effect';

@Component({
	selector: 'app-transactions-page',
	imports: [
		TopUpWithdrawButtonsComponent,
		TuiTextfield,
		FormsModule,
		TuiButton,
		TuiIcon,
		TransactionStatusChipComponent,
		TransactionTypeIconComponent,
		PaginatorModule,
		CopyIconComponent,
		TuiTable,
		DatePipe,
		DecimalPipe,
		AsyncPipe,
		ReactiveFormsModule,
		TransactionItemComponent,
		ScrollingModule,
		LoaderComponent,
		EmptyDisplayComponent,
		ErrorDisplayComponent,
		TuiLoader,
	],
	templateUrl: './transactions-page.component.html',
	styleUrl: './transactions-page.component.css',
})
export class TransactionsPageComponent implements OnInit {
	private ngZone = inject(NgZone);
	private cryptocurrenciesService = inject(CurrenciesService);
	private transactionService = inject(TransactionsService);
	private destroyRef = inject(DestroyRef);
	private dialogService = inject(TuiDialogService);
	private injector = inject(Injector);
	public configService = inject(ConfigService);

	paginator = viewChild(Paginator);

	trxWalletAddress = input<string>();

	public viewport = viewChild(CdkVirtualScrollViewport);

	protected isLoading = signal(false);
	isMobileLoading = signal(false);
	protected hasError = signal(false);
	displayError = computed(() => !this.isLoading() && this.hasError());
	displayEmpty = computed(() => !this.isLoading() && !this.transactions()?.length && !this.hasError());

	protected page = signal(0);
	protected readonly pageSize = 10;
	private filters?: TransactionFilterModel;

	private loadBatch = new BehaviorSubject<boolean | void>(void 0);
	public mobileTransactions$: Observable<TransactionDto[] | undefined>;
	isMobileEmpty = computed(() => !this.isMobileLoading() && !this.hasMobileError());
	hasMobileError = computed(() => !this.isMobileLoading() && this.hasError());

	protected columns = ['createdAt', 'transactionHash', 'address', 'amount', 'status', 'type'];
	protected transactions = signal<TransactionDto[]>([]);
	protected search = new FormControl<string | null>(null, [
		Validators.minLength(64),
		Validators.pattern(/^[a-fA-F0-9x]+$/),
	]);
	protected totalElements = signal(0);

	constructor() {
		this.search.valueChanges
			.pipe(
				filter((val) => this.search.valid),
				debounceTime(300),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe(() => {
				this.loadTransactions();
				this.loadBatch.next(true);
			});

		let toClear: boolean | void = false;
		this.mobileTransactions$ = this.loadBatch.pipe(
			tap((clear) => (toClear = clear)),
			filter(() => this.configService.isMobile()),
			tap(() => {
				this.isMobileLoading.set(true);
				if (this.page() === 0) {
					this.isLoading.set(true);
				}
			}),
			mergeMap(() => this.getTransactions()),
			map((data) => data.data),
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
				this.hasError.set(true);
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
		this.loadTransactions();
	}

	@tuiPure
	getAddress(transaction: TransactionDto) {
		if (isTransactionIn(transaction.type)) {
			return transaction.toTrxAddress;
		}

		return transaction.fromTrxAddress;
	}

	@tuiPure
	getAmountPrefix(transaction: TransactionDto): '+' | '-' {
		if (isTransactionIn(transaction.type)) {
			return '+';
		}

		return '-';
	}

	@tuiPure
	getAmount(transaction: TransactionDto): string {
		if (isTransactionIn(transaction.type)) {
			return transaction.amount;
		}

		return transaction.amountInSenderCurrency;
	}

	@tuiPure
	getCryptoIcon(transaction: TransactionDto): Observable<string> {
		// return this.cryptocurrenciesService.getCurrencyLinkUrl(transaction.cryptocurrency);
		if (isTransactionIn(transaction.type)) {
			return this.cryptocurrenciesService.getCurrencyLinkUrl(transaction.currencyTo);
		}

		return this.cryptocurrenciesService.getCurrencyLinkUrl(transaction.currencyFrom);
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

	trackById(i: number): number {
		return i;
	}

	hasFilters(): boolean {
		return !!this.filters && Object.keys(this.filters).length > 0;
	}
	onPageChange(state: PaginatorState): void {
		if (state.page != null && state.page !== this.page()) {
			this.page.set(state.page);
			this.loadTransactions();
		}
	}

	openFilters() {
		this.dialogService
			.open<TransactionFilterModel>(new PolymorpheusComponent(TransactionsFilterModalComponent, this.injector), {
				data: this.filters,
			})
			.pipe(filter((val) => !!val))
			.subscribe((filters) => {
				this.filters = filters;
				this.resetTransactions();
			});
	}

	openDetails(transaction: TransactionDto) {
		this.dialogService
			.open(new PolymorpheusComponent(TransactionDetailsComponent, this.injector), {
				data: transaction,
			})
			.subscribe();
	}

	onWithdrawSuccess() {
		this.resetTransactions();
	}

	private resetTransactions() {
		this.page.set(0);
		this.loadTransactions();
		this.loadBatch.next(true);
	}

	private loadTransactions() {
		if (this.configService.isMobile()) {
			return;
		}

		this.isLoading.set(true);
		this.hasError.set(false);
		this.getTransactions()
			.pipe(
				finalize(() => this.isLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: (res) => {
					this.transactions.set(res.data);
					this.totalElements.set(res.total);
				},
				error: (err) => {
					this.hasError.set(true);
					console.error(err);
					this.transactions.set([]);
				},
			});
	}

	private getTransactions() {
		const params: TransactionPageableParams = {
			size: this.pageSize,
			sort: 'id,desc',
			page: this.page(),
		};
		if (this.search.value) {
			params.transactionHash = this.search.value;
		}
		if (this.filters?.dateFrom) params.dateFrom = this.formatDate(this.filters.dateFrom.toLocalNativeDate());
		if (this.filters?.dateTo) params.dateTo = this.formatDate(this.filters.dateTo.toLocalNativeDate());
		if (this.filters?.cryptocurrency) params.cryptocurrency = this.filters.cryptocurrency.cryptoCurrency;
		if (this.filters?.statuses) params.statuses = this.filters.statuses;
		if (this.trxWalletAddress()) params.trxAddress = this.trxWalletAddress();

		return this.transactionService.getTransactions(params);
	}

	private formatDate(date: Date): string {
		return format(date, 'yyyy-MM-dd HH:mm');
	}
}
