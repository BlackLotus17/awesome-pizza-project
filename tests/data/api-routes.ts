// Every API path the tests use, in one place.

export const API = {
    prefix: '/api/',
    menu: '/api/daily-menu',
    orders: '/api/orders',
    order: (id: string) => `/api/orders/${encodeURIComponent(id)}`,
    orderPrefix: '/api/orders/',
    login: '/api/login',
    protected: '/api/protected',
    admin: '/api/admin',
};

/** Glob for page.route() that matches a path on any host. */
export const anyHost = (path: string) => `**${path}`;

/** Path part of a request URL. */
export const pathOf = (url: string) => new URL(url).pathname;
