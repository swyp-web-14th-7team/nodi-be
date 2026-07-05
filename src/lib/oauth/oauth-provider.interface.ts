export interface OauthProfile {
  providerId: string;
  email: string;
  name: string;
}

export interface OauthProvider {
  getAuthUrl(state: string, origin: string): string;
  getProfile(
    code: string,
    origin: string,
    state: string,
  ): Promise<OauthProfile>;
}
