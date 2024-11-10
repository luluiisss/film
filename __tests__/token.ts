import { type AxiosInstance, type AxiosResponse } from 'axios';
import { httpsAgent, tokenPath } from './testserver.js';

type TokenResult = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    access_token: string;
};

const usernameDefault = 'admin';
const passwordDefault = 'p'; // NOSONAR

export const tokenRest = async (
    axiosInstance: AxiosInstance,
    username = usernameDefault,
    password = passwordDefault,
) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded', // eslint-disable-line @typescript-eslint/naming-convention
    };
    const response: AxiosResponse<TokenResult> = await axiosInstance.post(
        tokenPath,
        `username=${username}&password=${password}`,
        { headers, httpsAgent },
    );
    return response.data.access_token;
};
