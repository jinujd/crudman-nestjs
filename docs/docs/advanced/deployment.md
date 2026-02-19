# Deployment

Learn how to deploy your crudman-nestjs applications.

## Production Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=my-bucket
```

### Production Module Configuration

```typescript
// app.module.ts
CrudmanModule.forRoot({
  swagger: {
    enabled: process.env.NODE_ENV === 'development'
  },
  cache: {
    enabled: true,
    adapter: new RedisCacheAdapter({
      url: process.env.REDIS_URL
    })
  },
  fileStorages: {
    s3: {
      type: 's3',
      bucket: process.env.AWS_S3_BUCKET,
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
})
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Cloud Deployment

### AWS Deployment

#### Using AWS Elastic Beanstalk

```yaml
# .ebextensions/01-packages.config
packages:
  yum:
    git: []

# .ebextensions/02-nodejs.config
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm run start:prod"
    NodeVersion: 18
```

#### Using AWS ECS

```yaml
# task-definition.json
{
  "family": "crudman-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "crudman-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/crudman-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

### Google Cloud Platform

#### Using Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/crudman-app', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/crudman-app']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['run', 'deploy', 'crudman-app', '--image', 'gcr.io/$PROJECT_ID/crudman-app', '--region', 'us-central1']
```

### Azure Deployment

#### Using Azure Container Instances

```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: Docker@2
  inputs:
    command: 'buildAndPush'
    repository: 'crudman-app'
    dockerfile: '**/Dockerfile'
    tags: '$(Build.BuildId)'
```

## Database Setup

### PostgreSQL

```sql
-- Create database
CREATE DATABASE mydb;

-- Create user
CREATE USER myuser WITH PASSWORD 'mypassword';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
```

### Redis

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

## Monitoring and Logging

### Health Checks

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.health.checkDatabase(),
      () => this.health.checkRedis(),
    ]);
  }
}
```

### Logging

```typescript
// logger.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  log(message: string) {
    this.logger.log(message);
  }

  error(message: string, trace: string) {
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.warn(message);
  }
}
```

## Security Considerations

### Environment Variables

```bash
# Use strong passwords
DATABASE_PASSWORD=your_strong_password_here
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

### CORS Configuration

```typescript
// main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});
```

### Rate Limiting

```typescript
// rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    return req.ips?.length ? req.ips[0] : req.ip;
  }
}
```

## Performance Optimization

### Caching

```typescript
CrudmanModule.forRoot({
  cache: {
    enabled: true,
    adapter: new RedisCacheAdapter({
      url: process.env.REDIS_URL,
      ttl: 3600 // 1 hour
    })
  }
})
```

### Database Optimization

```typescript
// Add indexes
@Entity('users')
export class User {
  @Index()
  @Column()
  email!: string;

  @Index()
  @Column()
  createdAt!: Date;
}
```

## Best Practices

1. **Use environment variables** for configuration
2. **Implement health checks** for monitoring
3. **Use HTTPS** in production
4. **Set up logging** and monitoring
5. **Use container orchestration** for scalability
6. **Implement backup strategies** for databases
7. **Use CDN** for file serving

## Next Steps

- [Testing](/docs/advanced/testing) - Test your application
- [Adapters](/docs/advanced/adapters) - Learn about adapters
- [API Reference](/docs/api/configuration) - Configuration options
