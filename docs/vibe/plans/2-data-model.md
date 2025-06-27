## Data model

* Create schema.prisma models from docs/diagrams/NameGame-Class-Diagram.puml
  * We want explicit many-to-many relationships so we can add properties on the relationship
* Create enums for each enum in docs/diagrams/NameGame-Class-Diagram.puml
  * Use correct enum types for model properties

* In schema.prisma, add a local postgresql database provider with a DATABASE_URL environment variable

* In main.wasp, define queries for each schema.prisma data model using wasp 0.16.0 idiomatic query syntax
  * Query by ID and filter criteria
  * Use strong typescript types

* In src/queries.ts, create query implementations for each query defined in main.wasp
  * Queries receive typed arguments
    * args paramater for id or filter criteria
    * context parameter that has entities property with prisma client entities

* In main.wasp, define create, update, and delete actions for each schema.prisma data model
* In src/actions.ts, create action implementations for each action defined in main.wasp
  * Use idiomatic wasp 0.16.0 action implementations with strong typescript types
  * Use Prisma connect syntax to create and update relationships between entities

* HTTP Success and Error Handling and Responses
  * If the user gets a resource successfully, return 200
  * If the user attemps to find a set of resources based on search criteria that returns no results, return a 200 response with an empty array
  * If the user updates a resource successfully, return 200 with the updated resource
  * If the user creates a resource successfully, return 201 
  * If the user triggers an async action successfully, return 202
  * If the user deletes a resource successfully, return 204

  * If the user's request is invalid, throw a 400 error
  * If a user isn't authenticated, throw a 401 error
  * If the user is authenticated but doesn't have permission to access a resource, throw a 403 error
  * If user attempts to get a resource that doesn't exist, throw a 404 error 

* Add authorization to all queries and actions
  * Use wasp 0.16.0 idiomatic authorization
  * Allow owner of a resource to perform actions on it
  * Allow authenticated member of the group to perform queries 

* Generate a database migration from schema.prisma and run it
