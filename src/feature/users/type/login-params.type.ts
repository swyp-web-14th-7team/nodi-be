import { type Provider } from '@/common/enum/provider.enum';

export type LoginParams = {
  name: string;
  email: string;
  provider: keyof typeof Provider;
  providerId: string;
};
