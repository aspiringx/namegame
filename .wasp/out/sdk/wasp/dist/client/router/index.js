import { interpolatePath } from './linkHelpers';
// PUBLIC API
export const routes = {
    RootRoute: {
        to: "/",
        build: (options) => interpolatePath("/", undefined, options === null || options === void 0 ? void 0 : options.search, options === null || options === void 0 ? void 0 : options.hash),
    },
    LoginPage: {
        to: "/login",
        build: (options) => interpolatePath("/login", undefined, options === null || options === void 0 ? void 0 : options.search, options === null || options === void 0 ? void 0 : options.hash),
    },
    SignupPage: {
        to: "/signup",
        build: (options) => interpolatePath("/signup", undefined, options === null || options === void 0 ? void 0 : options.search, options === null || options === void 0 ? void 0 : options.hash),
    },
};
// PUBLIC API
export { Link } from './Link';
//# sourceMappingURL=index.js.map