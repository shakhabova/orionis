import { Component, model, input, viewChild, ElementRef, afterNextRender, INJECTOR, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiAutoFocus } from '@taiga-ui/cdk';
import { explicitEffect } from 'ngxtension/explicit-effect';

@Component({
	selector: 'app-otp-code-input',
	imports: [FormsModule, TuiAutoFocus],
	templateUrl: './otp-code-input.component.html',
	styleUrl: './otp-code-input.component.css',
})
export class OtpCodeInputComponent {
	otpCode = model('');
	length = input(6);
	error = input(false);
	disabled = input(false);

	inputsWrapper = viewChild<ElementRef<HTMLDivElement>>('inputsWrapper');

	otpCodeArray: Array<string | null> = new Array(this.length()).fill(null);

	constructor() {
		// explicitEffect([this.otpCode], ([otpCode]) => {
		//   this.otpCodeArray = this.otpCodeArray.map((_, i) => otpCode[i]);
		// });

		explicitEffect([this.length], ([length]) => {
			this.otpCodeArray = new Array(length).fill(null);
		});
	}

	onKeydown(event: KeyboardEvent, index: number): void {
		if (event.key === 'Backspace') {
			if (index > 0 && !this.getInputByIndex(index)?.value) {
				this.getInputByIndex(index - 1)?.focus();
				event.preventDefault();
				return;
			}
		}
	}

	onFieldInput(event: KeyboardEvent, index: number): void {
		if (event.key === 'Backspace') {
			return;
		}

		const currentInput = this.getInputByIndex(index);
		if (!currentInput?.value) {
			return;
		}

		const nextInput = this.getInputByIndex(index + 1);
		if (nextInput) {
			nextInput.focus();
			nextInput.select();
		}
	}

	onInputPaste(event: ClipboardEvent, index: number): void {
		const value = event.clipboardData?.getData('text/plain');
		if (!value) {
			return;
		}

		let j = 0;
		for (let i = index; i < this.length(); i++) {
			this.otpCodeArray[i] = value[j];
			j++;
		}

		this.onCodeChange();
		this.getInputByIndex(Math.min(index + value.length, this.length()))?.focus();

		// this.otpCodeArray = this.otpCodeArray.map((_, i) => value[i]);
	}

	onCodeChange(): void {
		this.otpCode.set(this.otpCodeArray.join(''));
	}

	toClipboardEvent(event: Event): ClipboardEvent {
		return event as ClipboardEvent;
	}

	private getInputByIndex(index: number): HTMLInputElement | null {
		return this.inputsWrapper()?.nativeElement.querySelector<HTMLInputElement>(`#otp-code-input-${index}`) ?? null;
	}
}
