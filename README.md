# E-shop on Docker Swarm

This project is configured to run as a replicated, multi-service stack using Docker Swarm. This setup
is designed for a robust development environment that mimics a production deployment.

## Docker Swarm Stack

All services are managed as a single stack named `e-shop`. The primary way to interact with the stack
is through the provided shell scripts.

### Installation and Deployment

This command initializes Docker Swarm (if not already active), builds the local images for the client
and server, and deploys the entire stack.

```bash
./install.sh
```

### Uninstallation

This command will shut down and remove all services, networks, and containers associated with the stack.

```bash
./uninstall.sh
```

### Accessing the Services

Once the stack is running, the services are available at the following endpoints:

- Frontend Application: https://localhost:5173
- Backend API: https://localhost:3000
- Keycloak Admin Console: http://localhost:8080
- Adminer Database Management: http://localhost:8081

### Replicas Test

If you want to verify that the backend is actually replicated you can use this command, which
will return the hostnames of the replicas.

```bash
./test_replicas.sh
```

There is also a Postman collection present in the root of the project with a suite of tests.