import { APIRequestContext, APIResponse } from '@playwright/test';
import { API } from '../data/api-routes';

export type OrderStatus = 'RECEIVED' | 'DELIVERING' | 'DELIVERED' | 'CANCELED';
export type OrderItem = { name: string; quantity: number };
export type Order = { id: string; sender: string; status: OrderStatus; contents: OrderItem[] };

/** Thin typed wrapper around the Awesome Pizza REST API. */
export class ApiClient {
    constructor(private readonly request: APIRequestContext) {}

    getMenu(): Promise<APIResponse> {
        return this.request.get(API.menu);
    }

    getOrder(id: string): Promise<APIResponse> {
        return this.request.get(API.order(id));
    }

    createOrderRaw(body: unknown): Promise<APIResponse> {
        return this.request.post(API.orders, { data: body });
    }

    updateOrderRaw(id: string, body: unknown): Promise<APIResponse> {
        return this.request.put(API.order(id), { data: body });
    }

    async createOrder(sender: string, contents: OrderItem[]): Promise<Order> {
        const response = await this.createOrderRaw({ sender, contents });
        if (response.status() !== 201) throw new Error(`createOrder failed: ${response.status()} ${await response.text()}`);
        return (await response.json()).data;
    }

    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const response = await this.updateOrderRaw(id, { status });
        if (response.status() !== 200) throw new Error(`updateStatus failed: ${response.status()} ${await response.text()}`);
        return (await response.json()).data;
    }

    /** Moves a freshly created order through the UI lifecycle to the wanted status. */
    async moveToStatus(id: string, status: OrderStatus): Promise<Order> {
        const path: Record<OrderStatus, OrderStatus[]> = {
            RECEIVED: [],
            DELIVERING: ['DELIVERING'],
            DELIVERED: ['DELIVERING', 'DELIVERED'],
            CANCELED: ['CANCELED'],
        };
        let order = (await (await this.getOrder(id)).json()).data as Order;
        for (const step of path[status]) order = await this.updateStatus(id, step);
        return order;
    }

    login(username: string, password: string): Promise<APIResponse> {
        return this.request.post(API.login, { data: { username, password } });
    }

    async loginToken(username: string, password: string): Promise<string> {
        return (await (await this.login(username, password)).json()).token;
    }

    send(method: string, path: string, options: { data?: unknown; headers?: Record<string, string> } = {}): Promise<APIResponse> {
        return this.request.fetch(path, { method, ...options });
    }
}
