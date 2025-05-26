import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseBalanceCurrencyComponent } from './choose-balance-currency.component';

describe('ChooseBalanceCurrencyComponent', () => {
	let component: ChooseBalanceCurrencyComponent;
	let fixture: ComponentFixture<ChooseBalanceCurrencyComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ChooseBalanceCurrencyComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(ChooseBalanceCurrencyComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
