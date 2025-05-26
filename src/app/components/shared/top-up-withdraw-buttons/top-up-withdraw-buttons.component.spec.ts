import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { TopUpWithdrawButtonsComponent } from './top-up-withdraw-buttons.component';

describe('TopUpWithdrawButtonsComponent', () => {
	let component: TopUpWithdrawButtonsComponent;
	let fixture: ComponentFixture<TopUpWithdrawButtonsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TopUpWithdrawButtonsComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TopUpWithdrawButtonsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
