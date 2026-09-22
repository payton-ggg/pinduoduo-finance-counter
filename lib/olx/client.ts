export const OLX_BASE_URL = "https://api.olx.ua";
export const OLX_AUTH_URL = "https://www.olx.ua/oauth/authorize/";
export const OLX_TOKEN_URL = "https://api.olx.ua/open/oauth/token";

export interface OlxTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface OlxUserProfile {
  id: number | string;
  email?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
}

export interface OlxAdvertData {
  id: number | string;
  title: string;
  description?: string;
  url?: string;
  price?: {
    value: number;
    currency: string;
  };
  photos?: Array<{
    id: number;
    link: string;
  }>;
}

export interface OlxThreadData {
  id: number | string;
  advert_id: number | string;
  user_id: number | string;
  interlocutor_id: number | string;
  unread_count: number;
  created_at: string;
  item_title?: string;
  item_url?: string;
  item_price?: number;
  interlocutor_name?: string;
  interlocutor_avatar?: string;
  last_message?: {
    id: number | string;
    text: string;
    created_at: string;
    is_from_me?: boolean;
  };
}

export interface OlxMessageData {
  id: number | string;
  thread_id: number | string;
  user_id: number | string;
  text: string;
  type?: string;
  attachments?: Array<{
    id: number | string;
    url: string;
    thumbnail?: string;
  }>;
  created_at: string;
  is_from_me?: boolean;
}

export class OlxApiClient {
  /**
   * Сформировать ссылку для авторизации пользователя через OAuth 2.0
   */
  static getAuthorizationUrl(params: {
    clientId: string;
    redirectUri: string;
    state?: string;
    scope?: string;
  }): string {
    const url = new URL(OLX_AUTH_URL);
    url.searchParams.set("client_id", params.clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("scope", params.scope || "read write v2");
    if (params.state) {
      url.searchParams.set("state", params.state);
    }
    return url.toString();
  }

  /**
   * Обменять authorization_code на access & refresh токены
   */
  static async exchangeCodeForTokens(params: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
  }): Promise<OlxTokens> {
    const response = await fetch(OLX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Version": "2.0",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: params.clientId,
        client_secret: params.clientSecret,
        code: params.code,
        scope: "read write v2",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX Token exchange failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Получить токен напрямую через Client ID и Client Secret (Client Credentials)
   */
  static async getTokensWithCredentials(params: {
    clientId: string;
    clientSecret: string;
  }): Promise<OlxTokens> {
    const response = await fetch(OLX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Version: "2.0",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: params.clientId,
        client_secret: params.clientSecret,
        scope: "read write v2",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX Auth failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Обновить access_token по refresh_token
   */
  static async refreshAccessToken(params: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }): Promise<OlxTokens> {
    const response = await fetch(OLX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Version": "2.0",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: params.clientId,
        client_secret: params.clientSecret,
        refresh_token: params.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX Token refresh failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Получить профиль авторизованного пользователя
   */
  static async getMe(accessToken: string): Promise<OlxUserProfile> {
    const response = await fetch(`${OLX_BASE_URL}/api/partner/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Version": "2.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX getMe failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Получить список диалогов (тредов)
   */
  static async getThreads(
    accessToken: string,
    params: { offset?: number; limit?: number; advertId?: string | number } = {}
  ): Promise<OlxThreadData[]> {
    const url = new URL(`${OLX_BASE_URL}/api/partner/threads`);
    if (params.offset !== undefined) url.searchParams.set("offset", String(params.offset));
    if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit || 25));
    if (params.advertId) url.searchParams.set("advert_id", String(params.advertId));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Version": "2.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX getThreads failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Получить детальную информацию по треду
   */
  static async getThread(accessToken: string, threadId: string | number): Promise<any> {
    const response = await fetch(`${OLX_BASE_URL}/api/partner/threads/${threadId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Version": "2.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX getThread failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Получить список сообщений в треде
   */
  static async getThreadMessages(
    accessToken: string,
    threadId: string | number,
    params: { offset?: number; limit?: number } = {}
  ): Promise<OlxMessageData[]> {
    const url = new URL(`${OLX_BASE_URL}/api/partner/threads/${threadId}/messages`);
    if (params.offset !== undefined) url.searchParams.set("offset", String(params.offset));
    if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit || 50));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Version": "2.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX getThreadMessages failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Отправить сообщение в тред
   */
  static async sendMessage(
    accessToken: string,
    threadId: string | number,
    params: { text: string; attachments?: string[] }
  ): Promise<any> {
    const response = await fetch(`${OLX_BASE_URL}/api/partner/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Version": "2.0",
      },
      body: JSON.stringify({
        text: params.text,
        attachments: params.attachments || [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OLX sendMessage failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Отметить тред как прочитанный
   */
  static async markThreadAsRead(accessToken: string, threadId: string | number): Promise<boolean> {
    try {
      const response = await fetch(`${OLX_BASE_URL}/api/partner/threads/${threadId}/commands`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Version": "2.0",
        },
        body: JSON.stringify({
          command: "read",
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Получить информацию об объявлении
   */
  static async getAdvert(accessToken: string, advertId: string | number): Promise<OlxAdvertData | null> {
    try {
      const response = await fetch(`${OLX_BASE_URL}/api/partner/adverts/${advertId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Version": "2.0",
        },
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.data || data;
    } catch {
      return null;
    }
  }
}
