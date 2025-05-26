import { Component, input, signal } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

@Component({
	selector: 'app-copy-icon',
	imports: [TuiIcon],
	templateUrl: './copy-icon.component.html',
	styleUrl: './copy-icon.component.css',
})
export class CopyIconComponent {
	text = input<string | undefined | null>();
	width = input(20);
	height = input(20);
	displaySuccess = signal(false);

	async copy(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		const text = this.text();
		if (text) {
			await navigator.clipboard.writeText(text);

			this.displaySuccess.set(true);
			setTimeout(() => this.displaySuccess.set(false), 2000);
		}
	}
}
