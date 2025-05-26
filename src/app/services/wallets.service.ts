import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { map, type Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { UserInfoDto } from './user.service';

export interface GetWalletsParams {
	statusIn: WalletStatus[];
	size: number;
	page: number;
	sort?: string;
	cryptocurrency?: string;
}

export type WalletStatus = 'ACTIVE' | 'CUSTOMER_BLOCKED' | 'DEACTIVATED';

export interface WalletsPageableDto {
	pageNumber: number;
	pageSize: number;
	totalElements: number;
	data: WalletDto[];
}

export interface WalletDto {
	id: number;
	oprAddress: string;
	trxAddress: string;
	walletName: string;
	walletStatus: WalletStatus;
	cryptocurrency: string;
	oprBalance: number;
	availableOprBalance: number;
	trxBalance: number;
	nativeTokenBalance: number | null;
	createdAt: string;
	updatedAt: string;
	status: string | null;
}

export const DASHBOARD_WALLETS_COUNT = 7;

@Injectable({
	providedIn: 'root',
})
export class WalletsService {
	private httpClient = inject(HttpClient);
	private configService = inject(ConfigService);

	getWallets(params: GetWalletsParams): Observable<WalletsPageableDto> {
		//return of(mockWallets(params.page));
		const queryParams: GetWalletsParams = {
			statusIn: params.statusIn,
			page: params.page,
			size: params.size,
		};
		if (params.sort) {
			queryParams.sort = params.sort;
		}
		if (params.cryptocurrency) {
			queryParams.cryptocurrency = params.cryptocurrency;
		}

		return this.httpClient.get<WalletsPageableDto>(`${this.configService.serverUrl}/v1/bff-custody/wallets/customer`, {
			params: queryParams as Required<GetWalletsParams>,
		});
	}

	createWallet(cryptocurrency: string, user: UserInfoDto) {
		return this.httpClient.post<void>(
			`${this.configService.serverUrl}/v1/bff-custody/wallets/customer`,
			{ cryptocurrency },
			{
				headers: {
					'Custody-User-ID': user.id.toString(),
					'Customer-ID': environment.customerId,
					'Institution-ID': user.institutionId,
				},
			},
		);
	}

	getWalletInfo(trxAddress: string): Observable<WalletDto | null> {
		return this.httpClient
			.get<WalletsPageableDto>(`${this.configService.serverUrl}/v1/bff-custody/wallets/customer`, {
				params: { trxAddress },
			})
			.pipe(map((res) => res.data?.[0] ?? null));
	}

	getWalletsForDashboard(): Observable<WalletDto[]> {
		return this.getWallets({
			statusIn: ['ACTIVE', 'CUSTOMER_BLOCKED', 'DEACTIVATED'],
			page: 0,
			size: DASHBOARD_WALLETS_COUNT,
			sort: 'id,desc',
		}).pipe(map((pageable) => pageable.data));
	}

	blockWallet(wallet: WalletDto): Observable<void> {
		return this.setWalletStatus(wallet.trxAddress, 'CUSTOMER_BLOCKED');
	}

	unblockWallet(wallet: WalletDto): Observable<void> {
		return this.setWalletStatus(wallet.trxAddress, 'ACTIVE');
	}

	deactivateWallet(wallet: WalletDto): Observable<void> {
		return this.setWalletStatus(wallet.trxAddress, 'DEACTIVATED');
	}

	getEligibleCryptos(): Observable<{ cryptoCurrency: string }[]> {
		// return this.currenciesService.getCurrenciesRequest.pipe(
		// 	map((infos) => infos.map((info) => ({ cryptocurrency: info.cryptoCurrency }))),
		// );
		return this.httpClient.get<{ cryptoCurrency: string }[]>(
			`${this.configService.serverUrl}/v1/bff-custody/wallets/eligible-cryptocurrencies`,
			{
				headers: { 'Customer-ID': environment.customerId },
			},
		);
	}

	private setWalletStatus(trxAddress: string, status: WalletStatus): Observable<void> {
		return this.httpClient.put<void>(
			`${this.configService.serverUrl}/v1/bff-custody/wallets/customer/update-status/${trxAddress}?status=${status}`,
			status,
		);
	}
}
