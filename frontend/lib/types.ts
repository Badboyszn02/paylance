// Shared frontend types.

export type UserRole = 'client' | 'freelancer' | 'creator' | 'admin';

export type OrderStatus =
  | 'OFFER_SENT' | 'NEGOTIATING' | 'ACCEPTED' | 'FUNDED' | 'IN_PROGRESS'
  | 'DELIVERED' | 'REVIEWING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

export type MessageType = 'text' | 'offer' | 'system' | 'delivery';

export interface User {
  id: number;
  name: string | null;
  wallet_address: string;
  role: UserRole;
  created_at?: string;
  profile?: Profile;
}

export interface Profile {
  company?: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  wallet_address?: string;
  category?: string;
  skills?: string[];
  portfolio_links?: string[];
  niche?: string;
  social_instagram?: string;
  social_tiktok?: string;
  social_youtube?: string;
  social_twitter?: string;
  social_verified?: boolean;
  follower_count_instagram?: number;
  follower_count_tiktok?: number;
  follower_count_youtube?: number;
  follower_count_twitter?: number;
  engagement_rate?: number;
  rate_per_post_usdc?: number;
  average_rating?: number;
  review_count?: number;
  completed_orders?: number;
}

export interface Listing {
  id: number;
  freelancer_id: number;
  freelancer_name?: string | null;
  freelancer_wallet?: string;
  title: string;
  description: string;
  price_usdc: number;
  delivery_days: number;
  category: string;
  subcategory?: string;
  tags?: string[];
  status?: string;
  kind?: 'service' | 'job';
  created_at?: string;
  avatar_url?: string;
  average_rating?: number;
  review_count?: number;
  location?: string;
  bio?: string;
  skills?: string[];
  portfolio_links?: string[];
  completed_orders?: number;
  listing_hash?: string | null;
  tx_hash?: string | null;
}

export interface Order {
  id: number;
  client_id: number;
  freelancer_id: number;
  listing_id?: number;
  amount_usdc: number;
  platform_fee_usdc?: number;
  status: OrderStatus;
  is_campaign?: boolean;
  client_satisfied?: boolean;
  freelancer_satisfied?: boolean;
  client_cancelled?: boolean;
  freelancer_cancelled?: boolean;
  escrow_contract_address?: string;
  arc_tx_hash?: string;
  client_name?: string;
  freelancer_name?: string;
  client_avatar?: string;
  freelancer_avatar?: string;
  freelancer_wallet?: string;
  listing_title?: string;
  created_at?: string;
  completed_at?: string;
}

export interface Message {
  id: number;
  order_id: number;
  sender_id: number | null;
  sender_name?: string;
  content?: string;
  file_url?: string;
  message_type: MessageType;
  meta?: Record<string, unknown>;
  sent_at?: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  reviewer_name?: string;
  reviewee_id?: number;
  reviewer_id?: number;
  created_at?: string;
}

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

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
