import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletCardComponent } from './wallet-card.component';

describe('WalletCardComponent', () => {
	let component: WalletCardComponent;
	let fixture: ComponentFixture<WalletCardComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [WalletCardComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(WalletCardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
