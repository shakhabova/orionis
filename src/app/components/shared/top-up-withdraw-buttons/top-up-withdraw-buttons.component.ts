import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tuiDialog, TuiIcon } from '@taiga-ui/core';
import { TopUpComponent } from 'components/top-up/top-up.component';
import { WithdrawComponent } from 'components/withdraw/withdraw.component';

@Component({
	selector: 'app-top-up-withdraw-buttons',
	imports: [TuiIcon],
	templateUrl: './top-up-withdraw-buttons.component.html',
	styleUrl: './top-up-withdraw-buttons.component.css',
	host: {
		'[class.full-width]': 'fullWidth()',
	},
})
export class TopUpWithdrawButtonsComponent {
	private readonly destroyRef = inject(DestroyRef);
	fullWidth = input<boolean>(false);
	withdrawSuccess = output();
	private topUpDialog = tuiDialog(TopUpComponent, { size: 'auto' });
	private withdrawDialog = tuiDialog(WithdrawComponent, { size: 'auto' });

	topUp() {
		this.topUpDialog(undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
	}

	withdraw() {
		this.withdrawDialog(undefined)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((result) => {
				if (result) {
					this.withdrawSuccess.emit();
				}
			});
	}
}
