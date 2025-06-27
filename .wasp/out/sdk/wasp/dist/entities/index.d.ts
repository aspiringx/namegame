import { type User, type UserUser, type Group, type GroupUser, type Code, type Photo, type Message, type Greeting, type IceBreaker, type Link } from "@prisma/client";
export { type User, type UserUser, type Group, type GroupUser, type Code, type Photo, type Message, type Greeting, type IceBreaker, type Link, type Auth, type AuthIdentity, } from "@prisma/client";
export type Entity = User | UserUser | Group | GroupUser | Code | Photo | Message | Greeting | IceBreaker | Link | never;
export type EntityName = "User" | "UserUser" | "Group" | "GroupUser" | "Code" | "Photo" | "Message" | "Greeting" | "IceBreaker" | "Link" | never;
