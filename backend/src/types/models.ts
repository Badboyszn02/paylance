// Shared domain types for PayLance.

export type UserRole = 'client' | 'freelancer' | 'creator' | 'admin';

export type OrderStatus =
  | 'OFFER_SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'FUNDED' | 'IN_PROGRESS'
  | 'DELIVERED' | 'REVIEWING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export type MessageType = 'text' | 'offer' | 'system' | 'delivery';

export type TxType = 'escrow' | 'release' | 'refund' | 'fee';

/** The JWT payload we sign and the shape attached to req.user. */
export interface AuthUser {
  id: number;
  role: UserRole;
  name: string;
}

export interface JwtPayload {
  sub: number | string;
  role: UserRole;
  name: string;
}

/** Search filters parsed from a plain-English query. */
export interface ParsedFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDelivery?: number;
  rating?: number;
  platforms?: string[];
  minFollowers?: number;
}

export interface EscrowResult {
  txHash: string;
  simulated: boolean;
  escrowAddress?: string;
}
