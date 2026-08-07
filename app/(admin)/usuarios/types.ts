export interface Owner {
  key: string;
  ownerName: string | null;
  phoneE164: string | null;
  phoneRaw: string | null;
  sellerType: string | null;
  propertyCount: number;
  lastActivity: string;
  inDnc: boolean;
}
