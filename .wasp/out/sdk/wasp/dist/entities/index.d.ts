import { type User, type Group, type Code, type Photo, type Message, type Greeting, type IceBreaker, type Link } from "@prisma/client";
export { type User, type Group, type Code, type Photo, type Message, type Greeting, type IceBreaker, type Link, type Auth, type AuthIdentity, } from "@prisma/client";
export type Entity = User | Group | Code | Photo | Message | Greeting | IceBreaker | Link | never;
export type EntityName = "User" | "Group" | "Code" | "Photo" | "Message" | "Greeting" | "IceBreaker" | "Link" | never;
