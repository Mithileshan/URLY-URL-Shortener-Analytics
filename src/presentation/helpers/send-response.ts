import { Response } from 'express';
import { HttpResponse } from '../contracts/http';

const errorCodeMap: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
};

export const sendResponse = (res: Response, httpResponse: HttpResponse): void => {
    if (httpResponse.statusCode >= 400) {
        const code = errorCodeMap[httpResponse.statusCode] ?? 'ERROR';
        const raw = httpResponse.data;
        const message =
            typeof raw === 'string' ? raw :
            raw?.message             ? raw.message :
            'Request failed';
        res.status(httpResponse.statusCode).json({ error: { code, message } });
    } else {
        res.status(httpResponse.statusCode).json(httpResponse.data);
    }
};
