export type UserRole = "SHIPPER" | "DRIVER" | "FLEET" | "DISPATCHER";

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
}

export type CargoStatus = "OPEN" | "ASSIGNED" | "COMPLETED" | "CANCELLED";
export type TripStatus = "ASSIGNED" | "LOADING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface Bid {
  id: string;
  amountUzs: number;
  note: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  driver: Pick<User, "id" | "name">;
  truck: { id: string; vehicle: string; plate: string; bodyType?: string } | null;
}

export interface Cargo {
  id: string;
  publicId: string;
  ownerId: string;
  origin: string;
  destination: string;
  cargoName: string;
  bodyType: string;
  weightTons: number;
  volumeM3: number;
  priceUzs: number;
  dealMode: "AUCTION" | "FIXED";
  status: CargoStatus;
  loadingAt: string | null;
  createdAt: string;
  owner: Pick<User, "id" | "name" | "role">;
  bids: Bid[];
}

export interface Truck {
  id: string;
  publicId: string;
  ownerId: string;
  vehicle: string;
  plate: string;
  bodyType: string;
  capacityTons: number;
  volumeM3: number;
  currentCity: string;
  targetRoute: string;
  available: boolean;
  owner: Pick<User, "id" | "name" | "role">;
}

export interface Trip {
  id: string;
  status: TripStatus;
  progressPct: number;
  cargo: Pick<Cargo, "id" | "publicId" | "origin" | "destination" | "cargoName" | "weightTons" | "loadingAt">;
  shipper: Pick<User, "id" | "name">;
  carrier: Pick<User, "id" | "name">;
  bid: { amountUzs: number };
  truck: { vehicle: string; plate: string } | null;
}
