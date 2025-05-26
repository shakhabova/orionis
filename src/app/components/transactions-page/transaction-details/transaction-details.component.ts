import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { type TransactionDto } from 'services/transactions.service';
import { TransactionStatusChipComponent } from '../../shared/transaction-status-chip/transaction-status-chip.component';
import { CopyIconComponent } from '../../shared/copy-icon/copy-icon.component';
import { CurrenciesService } from 'services/currencies.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectContext } from '@taiga-ui/polymorpheus';
import { type TuiDialogContext, TuiIcon } from '@taiga-ui/core';
import { DatePipe } from '@angular/common';
import html2canvas from 'html2canvas';

@Component({
	selector: 'app-transaction-details',
	imports: [TransactionStatusChipComponent, CopyIconComponent, DatePipe, TuiIcon],
	templateUrl: './transaction-details.component.html',
	styleUrl: './transaction-details.component.scss',
})
export class TransactionDetailsComponent {
	private destroyRef = inject(DestroyRef);
	private cryptocurrenciesService = inject(CurrenciesService);
	public readonly context = injectContext<TuiDialogContext<void, TransactionDto>>();

	transaction = signal<TransactionDto>({} as unknown as TransactionDto);
	scanUrl = signal('');
	scanWalletUrl = signal('');
	fromScanUrl = signal('');
	fromScanWalletUrl = signal('');
	toScanUrl = signal('');
	toScanWalletUrl = signal('');
	screenshotIsTaking = signal(false);

	toTrxAddressUrl = computed(() =>
		this.toScanWalletUrl() ? this.toScanWalletUrl().replace('{address}', this.transaction().toTrxAddress) : '#',
	);
	fromTrxAddressUrl = computed(() =>
		this.fromScanWalletUrl() ? this.fromScanWalletUrl().replace('{address}', this.transaction().fromTrxAddress) : '#',
	);
	transactionHashAddress = computed(() =>
		this.scanUrl() ? this.scanUrl().replace('{hash}', this.transaction().transactionHash) : '#',
	);

	isOutTransaction = computed(() => ['CSTD_OUT', 'C2F', 'OUT'].includes(this.transaction().type));
	displayToWallet = computed(() => ['CSTD_OUT', 'CSTD_IN'].includes(this.transaction().type));

	ngOnInit() {
		this.transaction.set(this.context.data);

		if (this.transaction().cryptocurrency) {
			this.cryptocurrenciesService
				.getCryptoInfo(this.transaction().cryptocurrency)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((info) => {
					this.scanUrl.set(info?.scanUrl ?? '');
					this.scanWalletUrl.set(info?.scanWalletUrl ?? '');
				});
		}

		if (this.transaction().currencyFrom) {
			this.cryptocurrenciesService
				.getCryptoInfo(this.transaction().currencyFrom)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((info) => {
					this.fromScanUrl.set(info?.scanUrl ?? '');
					this.fromScanWalletUrl.set(info?.scanWalletUrl ?? '');
				});
		}

		if (this.transaction().currencyTo) {
			this.cryptocurrenciesService
				.getCryptoInfo(this.transaction().currencyTo)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((info) => {
					this.toScanUrl.set(info?.scanUrl ?? '');
					this.toScanWalletUrl.set(info?.scanWalletUrl ?? '');
				});
		}
	}

	async download() {
		this.screenshotIsTaking.set(true);
		const el = document.querySelector<HTMLElement>('.screenshot-wrapper');
		if (!el) return;

		setTimeout(async () => {
			const canvas = await html2canvas(el);
			const imageBase64 = canvas.toDataURL('image/png');
			const a = document.createElement('a');
			a.href = imageBase64;
			a.download = 'transaction.png';
			a.click();
			this.screenshotIsTaking.set(false);
		}, 0);
	}
}
