import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef } from '@angular/core';

@Component({
	selector: 'app-error-display',
	imports: [CommonModule],
	templateUrl: './error-display.component.html',
	styleUrl: './error-display.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDisplayComponent {
	text = input<string>();
	action = input<TemplateRef<unknown>>();
}
