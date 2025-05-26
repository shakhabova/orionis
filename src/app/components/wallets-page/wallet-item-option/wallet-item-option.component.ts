import { Component, input, output } from '@angular/core';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { type WalletDto, WalletStatus } from 'services/wallets.service';

@Component({
	selector: 'app-wallet-item-option',
	imports: [TuiDropdown, TuiDataList, TuiIcon, TuiButton],
	templateUrl: './wallet-item-option.component.html',
	styleUrl: './wallet-item-option.component.css',
})
export class WalletItemOptionComponent {
	wallet = input.required<WalletDto>();
	moreIconSize = input<'m' | 'l' | 'xl' | 's' | 'xs'>('m');

	block = output();
	unblock = output();
	deactivate = output();

	protected open = false;

	deactivateWallet() {
		this.deactivate.emit();
		this.open = false;
	}

	unblockWallet() {
		this.unblock.emit();
		this.open = false;
	}

	blockWallet() {
		this.block.emit();
		this.open = false;
	}
}
