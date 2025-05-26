import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { WalletStatusChipComponent } from 'components/shared/wallet-status-chip/wallet-status-chip.component';
import { CurrenciesService } from 'services/currencies.service';
import { type WalletDto } from 'services/wallets.service';

@Component({
	selector: 'app-wallet-card',
	imports: [AsyncPipe, WalletStatusChipComponent, DecimalPipe],
	templateUrl: './wallet-card.component.html',
	styleUrl: './wallet-card.component.css',
})
export class WalletCardComponent {
	wallet = input.required<WalletDto>();

	private cryptoService = inject(CurrenciesService);

	cryptoIcon = computed(() => this.cryptoService.getCurrencyLinkUrl(this.wallet().cryptocurrency));
	cryptoName = computed(() => this.cryptoService.getCurrencyName(this.wallet().cryptocurrency));
}
