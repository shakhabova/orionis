import { Component } from '@angular/core';
import type { TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';

export interface ConfirmModalInfo {
	text: string;
}
@Component({
	selector: 'app-confirm-modal',
	imports: [],
	templateUrl: './confirm-modal.component.html',
	styleUrl: './confirm-modal.component.css',
})
export class ConfirmModalComponent {
	public readonly context = injectContext<TuiDialogContext<boolean, ConfirmModalInfo>>();
}
