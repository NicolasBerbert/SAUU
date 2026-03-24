import { UserType, PaymentStatus, OrderStatus } from "@prisma/client";
import "next-auth";

// ─────────────────────────────────────────────
// NextAuth type augmentation
// ─────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      type: UserType;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    type: UserType;
  }
}

// ─────────────────────────────────────────────
// Tipos de domínio
// ─────────────────────────────────────────────

export type { UserType, PaymentStatus, OrderStatus };

export interface PresentationWithCount {
  id: string;
  title: string;
  speaker: string;
  bio: string | null;
  imageUrl: string | null;
  day: number;
  slot: string;
  maxCapacity: number;
  _count: { slots: number };
  spotsLeft: number;
  isUserRegistered?: boolean;
}

export interface UserDashboard {
  id: string;
  name: string;
  email: string;
  type: UserType;
  eventRegistration: {
    paymentStatus: PaymentStatus;
  } | null;
  presentationSlots: Array<{
    presentation: {
      id: string;
      title: string;
      speaker: string;
      day: number;
      slot: string;
    };
  }>;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
