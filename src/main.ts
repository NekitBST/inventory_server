import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

type SafeValidationError = {
  property: string;
  constraints?: Record<string, string>;
  children?: SafeValidationError[];
};

function toSafeValidationErrors(
  errors: ValidationError[],
): SafeValidationError[] {
  return errors.map((error) => ({
    property: error.property,
    constraints: error.constraints,
    children:
      error.children && error.children.length > 0
        ? toSafeValidationErrors(error.children)
        : undefined,
  }));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const parseCsv = (
    value: string | undefined,
    fallback: string[],
  ): string[] => {
    if (!value) {
      return fallback;
    }

    const normalized = value.trim();
    if (!normalized) {
      return fallback;
    }

    if (normalized === '*') {
      return ['*'];
    }

    return normalized
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const corsOrigins = parseCsv(config.get<string>('cors.origins'), ['*']);
  const corsMethods = parseCsv(
    config.get<string>('cors.methods'),
    ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  );
  const corsAllowedHeaders = parseCsv(
    config.get<string>('cors.allowedHeaders'),
    [],
  );
  const corsCredentials = config.get<string>('cors.credentials') === 'true';

  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    methods: corsMethods,
    allowedHeaders:
      corsAllowedHeaders.length > 0 && !corsAllowedHeaders.includes('*')
        ? corsAllowedHeaders
        : undefined,
    credentials: corsOrigins.includes('*') ? false : corsCredentials,
  });

  if (config.get<string>('swagger.enabled') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Inventory API')
      .setDescription('API для системы инвентаризации')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerServer = config.get<string>('swagger.serverUrl');
    if (swaggerServer) {
      swaggerDocument.servers = [{ url: swaggerServer }];
    }
    SwaggerModule.setup('swagger', app, swaggerDocument);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          statusCode: 422,
          message: 'Данные запроса не прошли валидацию',
          error: 'Unprocessable Entity',
          details: toSafeValidationErrors(errors),
        }),
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableShutdownHooks();
  await app.listen(config.get<number>('port')!, config.get<string>('host')!);
}
bootstrap();
