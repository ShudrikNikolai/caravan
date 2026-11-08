import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

interface SocketJwtPayload {
  sub?: string | number;
}

export function extractUserIdFromSocket(
  client: Socket,
  jwtService: JwtService,
  jwtSecret: string,
): string | null {
  const cookieHeader = client.handshake.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('access_token='));

  if (!cookie) {
    return null;
  }

  const rawValue = cookie.slice('access_token='.length);
  let token: string;

  try {
    token = decodeURIComponent(rawValue);
  } catch {
    token = rawValue;
  }

  try {
    const payload = jwtService.verify<SocketJwtPayload>(token, {
      secret: jwtSecret,
    });

    return payload.sub === undefined ? null : String(payload.sub);
  } catch {
    return null;
  }
}
