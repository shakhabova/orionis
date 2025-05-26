import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { CurrenciesService } from 'services/currencies.service';
import type { WalletDto } from 'services/wallets.service';
import { CopyIconComponent } from '../../shared/copy-icon/copy-icon.component';
import { WalletStatusChipComponent } from '../../shared/wallet-status-chip/wallet-status-chip.component';
import { WalletItemOptionComponent } from '../wallet-item-option/wallet-item-option.component';

@Component({
	selector: 'app-wallet-info-card',
	imports: [DecimalPipe, AsyncPipe, WalletStatusChipComponent, CopyIconComponent, WalletItemOptionComponent],
	templateUrl: './wallet-info-card.component.html',
	styleUrl: './wallet-info-card.component.css',
})
export class WalletInfoCardComponent {
	wallet = input.required<WalletDto>();

	block = output();
	unblock = output();
	deactivate = output();

	private cryptoService = inject(CurrenciesService);

	cryptoIcon = computed(() => this.cryptoService.getCurrencyLinkUrl(this.wallet().cryptocurrency));
	cryptoName = computed(() => this.cryptoService.getCurrencyName(this.wallet().cryptocurrency));

	onDeactivate() {
		this.deactivate.emit();
	}

	onUnblock() {
		this.unblock.emit();
	}

	onBlock() {
		this.block.emit();
	}
}
