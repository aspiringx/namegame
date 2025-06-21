import type { RouteDefinitionsToRoutes, OptionalRouteOptions } from './types';
export declare const routes: {
    readonly RootRoute: {
        readonly to: "/";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly LoginPage: {
        readonly to: "/login";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly SignupPage: {
        readonly to: "/signup";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
};
export type Routes = RouteDefinitionsToRoutes<typeof routes>;
export { Link } from './Link';
