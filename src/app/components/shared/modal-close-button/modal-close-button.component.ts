import { Component, output } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

@Component({
	selector: 'app-modal-close-button',
	imports: [TuiIcon],
	templateUrl: './modal-close-button.component.html',
	styleUrl: './modal-close-button.component.css',
})
export class ModalCloseButtonComponent {
	clicked = output<void>();

	onClick() {
		this.clicked.emit();
	}
}
