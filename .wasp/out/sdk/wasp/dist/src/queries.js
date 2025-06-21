import { HttpError } from 'wasp/server';
export const getUser = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.User.findUnique({ where: { id } });
};
export const getUsers = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.User.findMany();
};
export const getGroup = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Group.findUnique({ where: { id } });
};
export const getGroups = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Group.findMany();
};
export const getLink = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Link.findUnique({ where: { id } });
};
export const getLinks = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Link.findMany();
};
export const getCode = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Code.findUnique({ where: { id } });
};
export const getCodes = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Code.findMany();
};
export const getPhoto = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Photo.findUnique({ where: { id } });
};
export const getPhotos = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Photo.findMany();
};
export const getMessage = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Message.findUnique({ where: { id } });
};
export const getMessages = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Message.findMany();
};
export const getGreeting = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Greeting.findUnique({ where: { id } });
};
export const getGreetings = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.Greeting.findMany();
};
export const getIceBreaker = async ({ id }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.IceBreaker.findUnique({ where: { id } });
};
export const getIceBreakers = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.IceBreaker.findMany();
};
//# sourceMappingURL=queries.js.map