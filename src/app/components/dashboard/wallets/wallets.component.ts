import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	INJECTOR,
	type WritableSignal,
	afterNextRender,
	computed,
	inject,
	signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TuiIcon, tuiDialog } from '@taiga-ui/core';
import { TuiSkeleton } from '@taiga-ui/kit';
import { EmptyDisplayComponent } from 'components/shared/empty-display/empty-display.component';
import { ErrorDisplayComponent } from 'components/shared/error-display/error-display.component';
import { CreateWalletModalComponent } from 'components/wallets-page/create-wallet-modal/create-wallet-modal.component';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { filter } from 'rxjs';
import { ConfigService } from 'services/config.service';
import { GetWalletsParams, type WalletDto, WalletsService } from 'services/wallets.service';
import { WalletCardComponent } from './wallet-card/wallet-card.component';

@Component({
	selector: 'app-wallets',
	imports: [WalletCardComponent, TuiIcon, EmptyDisplayComponent, ErrorDisplayComponent, TuiSkeleton],
	templateUrl: './wallets.component.html',
	styleUrl: './wallets.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletsComponent {
	private walletsService = inject(WalletsService);
	private destroyRef = inject(DestroyRef);
	private configService = inject(ConfigService);
	private router = inject(Router);
	private injector = inject(INJECTOR);

	private createWalletDialog = tuiDialog(CreateWalletModalComponent, { size: 'auto' });

	wallets: WritableSignal<(WalletDto | null)[]> = signal([]);

	isLoading = signal(false);
	hasError = signal(false);
	showEmpty = computed(() => !this.isLoading() && !this.hasError() && !this.wallets()?.length);
	showError = computed(() => !this.isLoading() && this.hasError());

	pageSize = computed(() => (this.configService.isMobile() ? 1 : 3));
	currentPage = signal(0);
	maxPages = signal(1);
	showPrevBtn = computed(() => this.currentPage() > 0 && !this.isLoading());
	showNextStepBtn = computed(() => this.maxPages() > this.currentPage() + 1 && !this.isLoading());

	constructor() {
		toObservable(this.configService.isMobile)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.currentPage.set(0));

		explicitEffect([this.currentPage], () => {
			this.loadWallets();
		});
	}

	// ngOnInit(): void {
	// 	this.loadWallets();
	// }

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

	seeAll() {
		this.router.navigateByUrl('/wallets');
	}

	private loadWallets() {
		this.hasError.set(false);
		this.isLoading.set(true);

		const params: GetWalletsParams = {
			page: this.currentPage(),
			size: this.pageSize(),
			statusIn: ['ACTIVE', 'CUSTOMER_BLOCKED', 'DEACTIVATED'],
			sort: 'id,desc',
		};

		this.walletsService
			.getWallets(params)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: (res) => {
					this.maxPages.set(Math.ceil(res.totalElements / this.pageSize()));

					if (params.page === 0) {
						this.wallets.set([null, ...res.data]);
					} else {
						const prevLastWallet = this.wallets().at(-1);
						if (prevLastWallet) {
							this.wallets.set([prevLastWallet, ...res.data]);
						}
					}

					afterNextRender(
						{
							write: () => this.isLoading.set(false),
						},
						{ injector: this.injector },
					);
				},
				error: (err) => {
					this.hasError.set(true);
					console.error(err);
					this.isLoading.set(false);
				},
			});
	}
}
