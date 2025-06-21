## Data model

* Create schema.prisma models from docs/diagrams/NameGame-Class-Diagram.puml
* Create enums for each enum in docs/diagrams/NameGame-Class-Diagram.puml
  * Use correct enum types for model properties

* In schema.prisma, add a local postgresql database provider with a DATABASE_URL environment variable

* In main.wasp, define queries for each schema.prisma data model using wasp 0.16.0 idiomatic query syntax
  * To start, ignore queries for relationship entitys: UserUser, GroupUser, and UserGroup
  * Query by ID and filter criteria
  * Use strong typescript types

* In src/queries.ts, create query implementations for each query defined in main.wasp
  * Queries receive typed arguments
    * args paramater for id or filter criteria
    * context parameter that has entities property with prisma client entities

* In main.wasp, define create, update, and delete actions for each schema.prisma data model
* In src/actions.ts, create action implementations for each action defined in main.wasp
  * Use idiomatic wasp 0.16.0 action implementations with strong typescript types
* Generate a database migration from schema.prisma and run it
