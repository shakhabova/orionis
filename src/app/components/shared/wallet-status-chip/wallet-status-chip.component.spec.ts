import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletStatusChipComponent } from './wallet-status-chip.component';

describe('WalletStatusChipComponent', () => {
	let component: WalletStatusChipComponent;
	let fixture: ComponentFixture<WalletStatusChipComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [WalletStatusChipComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(WalletStatusChipComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
