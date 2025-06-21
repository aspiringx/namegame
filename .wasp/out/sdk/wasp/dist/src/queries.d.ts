import { type GetUser, type GetUsers, type GetGroup, type GetGroups, type GetLink, type GetLinks, type GetCode, type GetCodes, type GetPhoto, type GetPhotos, type GetMessage, type GetMessages, type GetGreeting, type GetGreetings, type GetIceBreaker, type GetIceBreakers } from 'wasp/server/operations';
import { type User, type Group, type Link, type Code, type Photo, type Message, type Greeting, type IceBreaker } from '@prisma/client';
type GetUserInput = {
    id: number;
};
export declare const getUser: GetUser<GetUserInput, User | null>;
export declare const getUsers: GetUsers<void, User[]>;
type GetGroupInput = {
    id: number;
};
export declare const getGroup: GetGroup<GetGroupInput, Group | null>;
export declare const getGroups: GetGroups<void, Group[]>;
type GetLinkInput = {
    id: number;
};
export declare const getLink: GetLink<GetLinkInput, Link | null>;
export declare const getLinks: GetLinks<void, Link[]>;
type GetCodeInput = {
    id: number;
};
export declare const getCode: GetCode<GetCodeInput, Code | null>;
export declare const getCodes: GetCodes<void, Code[]>;
type GetPhotoInput = {
    id: number;
};
export declare const getPhoto: GetPhoto<GetPhotoInput, Photo | null>;
export declare const getPhotos: GetPhotos<void, Photo[]>;
type GetMessageInput = {
    id: number;
};
export declare const getMessage: GetMessage<GetMessageInput, Message | null>;
export declare const getMessages: GetMessages<void, Message[]>;
type GetGreetingInput = {
    id: number;
};
export declare const getGreeting: GetGreeting<GetGreetingInput, Greeting | null>;
export declare const getGreetings: GetGreetings<void, Greeting[]>;
type GetIceBreakerInput = {
    id: number;
};
export declare const getIceBreaker: GetIceBreaker<GetIceBreakerInput, IceBreaker | null>;
export declare const getIceBreakers: GetIceBreakers<void, IceBreaker[]>;
export {};
