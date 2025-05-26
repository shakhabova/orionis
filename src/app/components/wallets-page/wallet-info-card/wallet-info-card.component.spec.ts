import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletInfoCardComponent } from './wallet-info-card.component';

describe('WalletInfoCardComponent', () => {
	let component: WalletInfoCardComponent;
	let fixture: ComponentFixture<WalletInfoCardComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [WalletInfoCardComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(WalletInfoCardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
