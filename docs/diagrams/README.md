# Diagrams

This folder has PlantUML diagrams (.puml files) describing aspects of the
NameGame app. Since the .puml files are a known diagram language, it may also
help with generating code about models/entities, their relationships, and
flows.

UML (Unified Modeling Language) diagrams model systems from two perspectives,
structural and behavioral. We won't use all these but here's a quick reference.

- Structural Diagrams: static parts, like nouns
  - Class: model the classes or entities with their properties and relationships
  - Object: instances of classes at runtime, each can have different states
  - Component: parts of the system and their dependencies, like services, databases, queues, etc.
  - Deployment: shows how components are deployed on hardware and software *nodes*
  - Package: how related system elements are grouped, like organizing code into namespaces, packages, etc.
  - Composite structure: shows the parts, ports, and connectors of a classifier, more details than a class diagram
  - Profile: specialized thingy I'm not sure if/when to use

- Behavioral Diagrams: moving parts, how things interact, like verbs
  - Use case: shows how users interact with a system in specific situations with actors and use cases
  - Activity: visualize the workflow of activities and processes
  - Sequence: show the *time-ordered* interaction of objects, showing the sequence of messages exchanged (HTTP, AMQP, etc.)
  - Communication: show interaction between objects with focus on topology (rather than time), architecture and messages exchanged
  - State/State machine: models states of objects and transitions between the states


## Diagrams included here

- NameGame-Class-Diagram - model the entities/classes and their relationships
- NameGame-Sequence-Diagram - various, showing the steps in key flows
