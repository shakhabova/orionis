import {
	Component,
	computed,
	DestroyRef,
	inject,
	INJECTOR,
	model,
	runInInjectionContext,
	type Signal,
	signal,
	TemplateRef,
	viewChild,
} from '@angular/core';
import { SelectListComponent } from '../shared/select-list/select-list.component';
import { type WalletDto, WalletsService } from 'services/wallets.service';
import { finalize, map, type Observable, of } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { CurrenciesService } from 'services/currencies.service';
import { tuiDialog, type TuiDialogContext, TuiDialogService, TuiError, TuiIcon, TuiLoader } from '@taiga-ui/core';
import { injectContext, PolymorpheusTemplate } from '@taiga-ui/polymorpheus';
import { tuiPure } from '@taiga-ui/cdk';
import { TuiInputModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TUI_VALIDATION_ERRORS, TuiConfirmService, TuiFieldErrorPipe, TuiUnmaskHandler } from '@taiga-ui/kit';
import { MaskitoDirective } from '@maskito/angular';
import { type MaskitoOptions } from '@maskito/core';
import { maskitoCaretGuard, maskitoPostfixPostprocessorGenerator } from '@maskito/kit';
import { TransactionsService } from 'services/transactions.service';
import { DialogService } from 'services/dialog.service';
import { WithdrawConfirmComponent } from './withdraw-confirm/withdraw-confirm.component';
import { addressPatternValidator, amountMinValidator, amountPatternValidator } from './validators';
import { maskitoMask, onBlurMaskitoPlugin } from './maskito-options';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-withdraw',
	standalone: true,
	imports: [
		SelectListComponent,
		AsyncPipe,
		TuiIcon,
		TuiInputModule,
		TuiTextfieldControllerModule,
		ReactiveFormsModule,
		TuiError,
		TuiFieldErrorPipe,
		MaskitoDirective,
		TuiUnmaskHandler,
		TuiLoader,
	],
	templateUrl: './withdraw.component.html',
	styleUrl: './withdraw.component.css',
	providers: [
		TuiConfirmService,
		{
			provide: TUI_VALIDATION_ERRORS,
			useValue: {
				required: 'Value is required',
				minlength: 'A wallet address must be a minimum of 20 characters in length',
			},
		},
	],
})
export class WithdrawComponent {
	private walletService = inject(WalletsService);
	private currenciesService = inject(CurrenciesService);
	private transactionsService = inject(TransactionsService);
	private destroyRef = inject(DestroyRef);
	private dialogService = inject(DialogService);
	private tuiDialogService = inject(TuiDialogService);
	private injector = inject(INJECTOR);

	public transactionCreating = signal(false);

	public confirmContent = viewChild('confirmContent', { read: TemplateRef });

	public context = injectContext<TuiDialogContext<boolean | undefined, WalletDto | undefined>>();

	formGroup = new FormBuilder().nonNullable.group({
		address: ['', [Validators.required, addressPatternValidator(/^[A-Za-z0-9]+$/), Validators.minLength(20)]],
		amount: ['', [Validators.required, amountMinValidator, amountPatternValidator]],
		cryptocurrency: [''],
	});

	amountMaskOptions: Signal<MaskitoOptions> = computed(() => {
		const postfix = this.amountPostfix();
		return {
			mask: maskitoMask(postfix),
			postprocessors: [
				// customMaskitoPostprocessor,
				maskitoPostfixPostprocessorGenerator(postfix),
			],
			plugins: [maskitoCaretGuard((value) => [0, value.length - postfix.length]), onBlurMaskitoPlugin(postfix)],
		};
	});

	amountPostfix = computed(() => ` ${this.selected()?.cryptocurrency ?? ''}`);

	selected = model<WalletDto | null>(null);
	phase = signal<'from' | 'to'>('from');
	title = computed(() => (this.phase() === 'from' ? 'Withdraw from' : 'Withdraw to'));

	protected readonly wallets$ = this.walletService
		.getWallets({
			statusIn: ['ACTIVE'],
			size: 2000,
			page: 0,
		})
		.pipe(map((data) => data.data));

	amountUnmask = (value: string) => value.substring(0, value.length - this.amountPostfix().length);

	ngOnInit() {
		if (this.context.data) {
			this.selected.set(this.context.data);
			this.formGroup.controls.cryptocurrency.setValue(this.context.data.cryptocurrency);
			this.phase.set('to');
		}

		// this.context = { ...this.context, dismissible: false };
	}

	@tuiPure
	getCryptoIcon(crypto?: string): Observable<string> {
		if (!crypto) return of('');

		return this.currenciesService.getCurrencyLinkUrl(crypto);
	}

	@tuiPure
	getCryptoName(crypto?: string): Observable<string> {
		if (!crypto) return of('');

		return this.currenciesService.getCurrencyName(crypto);
	}

	onContinue() {
		const selected = this.selected();
		if (!selected) {
			return;
		}

		this.formGroup.controls.cryptocurrency.setValue(selected.cryptocurrency);

		this.phase.set('to');
	}

	onNext() {
		this.formGroup.updateValueAndValidity();
		if (this.formGroup.invalid) {
			return;
		}

		const formValue = this.formGroup.getRawValue();
		const selectedWallet = this.selected();
		if (!selectedWallet) {
			return;
		}

		this.transactionCreating.set(true);
		this.transactionsService
			.makeTransaction({
				amount: Number.parseFloat(formValue.amount),
				fromTrxAddress: selectedWallet.trxAddress,
				toTrxAddress: formValue.address,
				cryptocurrency: selectedWallet.cryptocurrency,
			})
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.transactionCreating.set(false)),
			)
			.subscribe({
				next: ({ id }) => {
					this.confirm(id);
				},
				error: (err) => {
					switch (err.error?.code) {
						case 'insufficient_balance':
							this.formGroup.controls.amount.setErrors({
								other: 'Insufficient balance. Please re-enter the amount',
							});
							break;
						case 'minimum_amount_not_met':
							this.formGroup.controls.amount.setErrors({
								other: 'Selected amount should be equal or more than 1 EUR',
							});
							break;
						case 'resource_missing':
							this.dialogService
								.showInfo({
									type: 'warning',
									title: 'Error',
									text: 'Wallet address does not correspond to given cryptocurrency.',
								})
								.subscribe();
								break;
						default:
							this.dialogService
								.showInfo({
									type: 'warning',
									title: 'Error',
									text: 'An unexpected error has appeared. Please try again later.',
								})
								.subscribe();
					}
				},
			});
	}

	confirm(transactionId: string) {
		const toWalletInfo = this.selected();
		const formValue = this.formGroup.getRawValue();
		if (!toWalletInfo || !formValue.amount || !formValue.address) {
			return;
		}

		let ignoreComplete = false;
		runInInjectionContext(this.injector, () => {
			const confirmDialog = this.getConfirmDialog();

			confirmDialog({
				toTrxAddress: formValue.address,
				amount: Number.parseFloat(formValue.amount),
				cryptocurrency: toWalletInfo.cryptocurrency,
			})
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe({
					next: (result) => {
						ignoreComplete = true;

						if (result) {
							this.confirmTransaction(transactionId);
						} else {
							this.removeTransaction(transactionId);
						}
					},
					complete: () => {
						if (!ignoreComplete) {
							this.removeTransaction(transactionId);
						}
					},
				});
		});
	}

	backToFromPhase() {
		this.selected.set(null);
		this.phase.set('from');
	}

	private getConfirmDialog() {
		const closeable = this.tuiDialogService.open<boolean>(new PolymorpheusTemplate(this.confirmContent()), {
			size: 's',
			closeable: false,
		});

		return tuiDialog(WithdrawConfirmComponent, {
			size: 'm',
			closeable: false,
			dismissible: closeable,
		});
	}

	private confirmTransaction(transactionId: string) {
		this.transactionsService
			.confirmTransaction(transactionId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					const formValue = this.formGroup.getRawValue();

					this.dialogService
						.showInfo({
							type: 'success',
							title: 'Successful operation',
							text: `Wallet address {${formValue.address}} will recieve {${formValue.amount} ${formValue.cryptocurrency}}`,
						})
						.subscribe(() => this.context.completeWith(true));
				},
				error: (err) => {
					console.error(err.error);

					if (err.error?.code === 'insufficient_balance') {
						this.dialogService
							.showInfo({
								type: 'warning',
								title: 'Insufficient balance',
								text: 'The transaction was unsuccessful. Please check your balance and try again.',
							})
							.subscribe();
						return;
					}

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

	private removeTransaction(transactionId: string) {
		this.transactionsService
			.deleteTransaction(transactionId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				error: (err) => {
					console.error(err.error);
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
}

// export function getWithdrawModal() {
//   const confirm = tuiDialog(WithdrawConfirmComponent, {
//     closeable: false,
//     dismissible: false,
//   });
//   return tuiDialog(WithdrawComponent, {
//     closeable: confirm(),
//     dismissible: confirm(),
//   });
// }
