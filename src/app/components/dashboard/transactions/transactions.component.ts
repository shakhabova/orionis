import { Component, computed, DestroyRef, inject, type OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type TransactionDto, TransactionsService } from 'services/transactions.service';
import { groupBy, sortBy } from 'lodash-es';
import { enUS } from 'date-fns/locale/en-US';
import { formatRelative, type FormatRelativeOptions } from 'date-fns';
import { TransactionItemComponent } from './transaction-item/transaction-item.component';
import { finalize } from 'rxjs';
import { EmptyDisplayComponent } from 'components/shared/empty-display/empty-display.component';
import { ErrorDisplayComponent } from 'components/shared/error-display/error-display.component';
import { LoaderComponent } from 'components/shared/loader/loader.component';
import { RouterModule } from '@angular/router';

interface DayTransactionsModel {
	title: string;
	sortData: string;
	items: TransactionDto[];
}

@Component({
	selector: 'app-transactions',
	imports: [TransactionItemComponent, EmptyDisplayComponent, ErrorDisplayComponent, LoaderComponent, RouterModule],
	templateUrl: './transactions.component.html',
	styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
	private transactionsService = inject(TransactionsService);
	private destroyRef = inject(DestroyRef);

	protected loading = signal(false);
	protected hasError = signal(false);

	protected displayEmpty = computed(() => !this.loading() && !this.hasError() && !this.daysGroups?.length);
	protected displayError = computed(() => !this.loading() && this.hasError());

	protected daysGroups: DayTransactionsModel[] = [];

	ngOnInit(): void {
		this.loading.set(true);
		this.hasError.set(false);

		this.transactionsService
			.getTransactions({ size: 3 })
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.loading.set(false)),
			)
			.subscribe({
				next: (transactions) => {
					if (!transactions.data?.length) {
						this.daysGroups = [];
					}

					this.mapTransactionsData(transactions.data);
				},
				error: (err) => {
					this.hasError.set(true);
					console.error(err);
				},
			});
	}

	private mapTransactionsData(transactions: TransactionDto[]): void {
		const withDayDict = groupBy(
			transactions.map((tr) => ({
				...tr,
				dayTitle: getDayTitle(tr.createdAt),
			})),
			'dayTitle',
		);
		this.daysGroups = sortBy(
			Object.entries(withDayDict).map((entry) => ({
				title: entry[0],
				items: entry[1],
				sortData: entry[1][0].createdAt,
			})),
			'sortData',
		).reverse();
	}
}

function getDayTitle(date: string): 'Today' | 'Yesterday' | string {
	const formatRelativeLocale = {
		lastWeek: 'dd MMM',
		yesterday: "'Yesterday'",
		today: "'Today'",
		tomorrow: 'dd MMM',
		nextWeek: 'dd MMM',
		other: 'dd MMM',
	};

	const options: FormatRelativeOptions = {
		locale: {
			...enUS,
			formatRelative: (token) => formatRelativeLocale[token],
		},
	};

	return formatRelative(new Date(date), new Date(), options);
}
