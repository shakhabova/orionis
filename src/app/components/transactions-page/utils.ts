import { TransactionDto } from 'services/transactions.service';

export function isTransactionIn(type: TransactionDto['type']): boolean {
	return ['IN', 'F2C', 'C2C', 'CSTD_IN'].includes(type);
}
