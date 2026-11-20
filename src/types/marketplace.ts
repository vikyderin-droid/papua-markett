export type UserRole = 'buyer' | 'seller' | 'admin';

export type SellerPackageTier = 'reguler' | 'premium';

export type OrderStatus =
  | 'menunggu'
  | 'diproses'
  | 'dikirim'
  | 'selesai'
  | 'dibatalkan';

export type PaymentMethod = 'transfer_bank' | 'qris' | 'cod';

export type PaymentStatus =
  | 'simulasi_menunggu'
  | 'simulasi_terkonfirmasi'
  | 'cod_bayar_ditempat';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  originCity: string;
  description: string;
  packageTier: SellerPackageTier;
  isVerified: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  originLocation: string;
  weightGram: number;
  imageUrl: string;
  soldCount: number;
  isFeatured: boolean;
  isPromoted: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface EnrichedProduct extends Product {
  categoryName: string;
  sellerName: string;
  sellerCity: string;
  sellerPackageTier: SellerPackageTier;
  averageRating: number;
  reviewCount: number;
}

export interface CartItemView {
  productId: string;
  quantity: number;
  product: EnrichedProduct;
  lineTotal: number;
}

export interface Address {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  referenceCode: string;
  isSimulated: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  payment: PaymentRecord;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export type SortOption = 'popular' | 'newest' | 'price_asc' | 'price_desc';

export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: SortOption;
  includeInactive?: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  eta: string;
  cost: number;
}

export interface BootstrapResponse {
  user: PublicUser | null;
  seller: Seller | null;
  categories: Category[];
  products: EnrichedProduct[];
  commissionRate: number;
  cartCount: number;
  favoriteIds: string[];
  unreadNotifications: number;
}
