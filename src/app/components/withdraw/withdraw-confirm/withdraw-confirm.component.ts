import { Component, DestroyRef, inject } from '@angular/core';
import { TuiIcon, type TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';

interface WithdrawConfirmData {
	toTrxAddress: string;
	amount: number;
	cryptocurrency: string;
}

@Component({
	selector: 'app-withdraw-confirm',
	imports: [TuiIcon],
	templateUrl: './withdraw-confirm.component.html',
	styleUrl: './withdraw-confirm.component.css',
})
export class WithdrawConfirmComponent {
	public context = injectContext<TuiDialogContext<boolean, WithdrawConfirmData>>();
}
